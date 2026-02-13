import { Hono } from 'hono';
import type { Bindings } from '../index';

const assistant = new Hono<{ Bindings: Bindings }>();

function getSystemPrompt(context: any): string {
    const phase = context?.phase || 'workspace';
    const hasData = context?.dataSummary && context.dataSummary.rows > 0;

    let dataBlock = 'UNAVAILABLE (No dataset loaded)';
    if (hasData) {
        const s = context.dataSummary;
        dataBlock = `
<dataset_context>
  Name: "${context.datasetName}"
  Dimensions: ${s.rows} rows x ${s.columns?.length || 0} columns
  Categorical Features: ${(s.categoricalColumns || []).join(', ') || 'None'}
  Numeric Features: ${(s.numericColumns || []).join(', ') || 'None'}
  Data Sample (Head): ${JSON.stringify(s.sample?.[0] || {})}
</dataset_context>`;
    }

    const issueBlock = context?.issues?.length
        ? `\n<data_quality_report>\n${context.issues.map((i: any) => `  - [${i.severity.toUpperCase()}] ${i.type} detected in "${i.field}" (${i.count} anomalies)`).join('\n')}\n</data_quality_report>`
        : '';

    return `
# ROLE: DataFlow AI Strategic Consultant
You are a Senior Strategic Consultant and Data Scientist. Your goal is to transform raw data into actionable business intelligence. You don't just "show" data; you interpret it, identify risks, and suggest growth opportunities.

## ═══ CONTEXT ═══
Current Application Phase: ${phase}
${dataBlock}
${issueBlock}

## ═══ OPERATIONAL GUIDELINES ═══
1. **Tone & Style**: Professional, insightful, and executive. Use technical terms correctly (e.g., "skewness", "outliers", "correlation", "data integrity").
2. **Language**: Always respond in the SAME language as the user.
3. **Response Structure**:
   - **Insight/Analysis**: 2-3 sentences providing immediate value or deep interpretation.
   - **Strategic Recommendation**: Suggest the next best action (cleaning, a specific visualization, or moving to a report).
   - **Action Block**: If applicable, exactly one JSON block with the corresponding action.

## ═══ DATA VISUALIZATION TAXONOMY ═══
Select the most appropriate chart type based on the analytical goal:
- **bar**: Comparison of categorical values.
- **pie**: Part-to-whole relationship (max 6-8 slices).
- **scatter**: Relationship/Correlation between two numerical variables.
- **radar**: Multidimensional comparison (e.g., comparing product features).
- **treemap**: Hierarchical part-to-whole or large categorical distributions.
- **sunburst**: Multi-level hierarchical structures.
- **funnel**: Process linear stages or conversion rates.
- **gauge**: Single metric performance against a target/max.
- **boxplot**: Distribution, medians, and outliers across categories.

## ═══ AVAILABLE ACTIONS (JSON) ═══
Only output ONE JSON block per response, at the very end.

### ACTION: create_chart
{"action": "create_chart", "chart": {"title": "Professional Title", "type": "chart_type", "xColumn": "col_name", "yColumn": "col_name", "columns": ["col1", "col2"]}}
- Use "columns" (array) for 'radar' and 'boxplot'.
- Ensure "xColumn" and "yColumn" exist in the provided context.

### ACTION: apply_transformation
{"action": "apply_transformation", "transformation": {"type": "trans_type", "params": {}}}

**Missing Values:**
- remove_duplicates: no params
- impute_nulls: params: {field, value}
- impute_mean: params: {field} — fills nulls with column mean
- impute_median: params: {field} — fills nulls with column median
- impute_mode: params: {field} — fills nulls with most frequent value
- impute_forward_fill: params: {field} — fills nulls with previous value
- impute_backward_fill: params: {field} — fills nulls with next value
- drop_rows_with_nulls: params: {field?} — drops rows with nulls (field optional)

**Outlier Treatment:**
- outlier_cap: params: {field, factor?} — caps at Q1-1.5*IQR / Q3+1.5*IQR
- outlier_winsorize: params: {field, percentile?} — winsorize at Nth percentile
- outlier_remove: params: {field, threshold?} — removes outlier rows
- outlier_log_transform: params: {field} — applies log transformation

**String Cleaning:**
- string_trim: params: {field}
- string_lowercase: params: {field}
- string_uppercase: params: {field}
- string_regex_replace: params: {field, pattern, replacement}

**Type Conversion:**
- convert_to_number: params: {field}
- convert_to_string: params: {field}
- convert_to_date: params: {field}

**Column Operations:**
- drop_column: params: {column}
- rename_column: params: {oldName, newName}
- split_column: params: {field, delimiter, newColumns}
- merge_columns: params: {fields, newName, separator}
- computed_column: params: {newName, expression} — JS expression using d.columnName

### ACTION: switch_phase
{"action": "switch_phase", "target": "workspace|preparation|eda|exploration|reports"}

## ═══ CRITICAL CONSTRAINTS ═══
- NEVER invent data or column names.
- If data is missing, politely ask the user to upload it.
- If a visualization is requested but columns are ambiguous, pick the statistically logical ones and explain why.
- Do not provide code blocks unless specifically asked for technical implementation details.
- The JSON block MUST be the absolute last thing in your response.`;
}

function parseAction(text: string): { cleanText: string; action: any | null } {
    const actionMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (actionMatch) {
        try {
            const action = JSON.parse(actionMatch[1]);
            return { cleanText: text.replace(actionMatch[0], '').trim(), action };
        } catch { return { cleanText: text, action: null }; }
    }
    const rawMatch = text.match(/\{[\s\S]*"action"[\s\S]*\}\s*$/);
    if (rawMatch) {
        try {
            const action = JSON.parse(rawMatch[0]);
            return { cleanText: text.replace(rawMatch[0], '').trim(), action };
        } catch { return { cleanText: text, action: null }; }
    }
    return { cleanText: text, action: null };
}

async function callGroq(apiKey: string, model: string, systemPrompt: string, userMessage: string, maxTokens: number) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq ${model} error ${response.status}: ${err}`);
    }
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
}

async function callLLM(env: Bindings, systemPrompt: string, userMessage: string, maxTokens = 1024) {
    // Primary: Groq — Kimi K2
    if (env.GROQ_API_KEY) {
        try {
            const text = await callGroq(env.GROQ_API_KEY, 'moonshotai/kimi-k2-instruct-0905', systemPrompt, userMessage, maxTokens);
            return { text, provider: 'groq-kimi-k2' };
        } catch (error) {
            console.error('Groq Kimi K2 error, trying fallback:', error);
        }

        // Fallback: Groq — Llama 3.3 70B
        try {
            const text = await callGroq(env.GROQ_API_KEY, 'llama-3.3-70b-versatile', systemPrompt, userMessage, maxTokens);
            return { text, provider: 'groq-llama-3.3' };
        } catch (error) {
            console.error('Groq Llama fallback error:', error);
        }
    }

    // Last resort: Cloudflare Workers AI
    try {
        const result = await env.AI.run('@cf/meta/llama-3.1-70b-instruct' as any, {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: maxTokens,
        });
        return { text: (result as any).response, provider: 'workers-ai' };
    } catch (error) {
        console.error('Workers AI error:', error);
    }

    return { text: "I'm your DataFlow Assistant. Try asking me to clean your data, visualize patterns, or export a report!", provider: 'mock' };
}

assistant.post('/', async (c) => {
    try {
        const { message, context } = await c.req.json() as { message: string; context?: any };
        const systemPrompt = getSystemPrompt(context);
        const result = await callLLM(c.env, systemPrompt, message);
        const { cleanText, action: rawAction } = parseAction(result.text);

        // Normalize action format: LLM outputs {"action": "create_chart", "chart": {...}}
        // Frontend expects {"type": "create_chart", "chart": {...}}
        let action = null;
        if (rawAction && rawAction.action) {
            action = {
                type: rawAction.action,
                target: rawAction.target,
                chart: rawAction.chart,
                transformation: rawAction.transformation,
            };
        } else if (rawAction && rawAction.type) {
            // Already in correct format
            action = rawAction;
        }

        return c.json({ message: cleanText, action, provider: result.provider });
    } catch (error) {
        console.error('Assistant error:', error);
        return c.json({ message: 'I encountered an error. Please try again.', action: null }, 500);
    }
});

export { assistant };
