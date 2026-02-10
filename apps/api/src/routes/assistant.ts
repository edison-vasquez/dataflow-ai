import { Hono } from 'hono';
import type { Bindings } from '../index';

const assistant = new Hono<{ Bindings: Bindings }>();

function getSystemPrompt(context: any): string {
    const dataInfo = context?.datasetName
        ? `Dataset loaded: "${context.datasetName}" with ${context.dataSummary?.rows || 0} rows and columns: ${(context.dataSummary?.columns || []).join(', ')}`
        : 'No dataset loaded yet.';

    const issueInfo = context?.issues?.length
        ? `\nDetected issues:\n${context.issues.map((i: any) => `- ${i.type} in "${i.field}" (${i.count} occurrences)`).join('\n')}`
        : '';

    return `You are DataFlow Assistant, a concise and helpful data science AI co-pilot.

Current phase: ${context?.phase || 'workspace'}
${dataInfo}${issueInfo}

Guidelines:
- Keep responses concise (2-4 sentences max unless the user asks for detail)
- When suggesting a next step, include an action block at the end of your response
- Available actions (append as a fenced JSON code block):
  {"action": "switch_phase", "target": "workspace|preparation|exploration|reports"}
  {"action": "create_chart", "chart": {"title": "...", "type": "bar|scatter|line", ...}}
- Only suggest actions when they directly serve the user's request
- Reference actual column names and data characteristics when available`;
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

async function callLLM(env: Bindings, systemPrompt: string, userMessage: string, maxTokens = 1024) {
    if (env.ANTHROPIC_API_KEY) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: maxTokens,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userMessage }],
                }),
            });
            if (response.ok) {
                const data = await response.json() as { content: Array<{ text: string }> };
                return { text: data.content[0].text, provider: 'claude' };
            }
        } catch (error) {
            console.error('Claude error, falling back:', error);
        }
    }

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
        const { cleanText, action } = parseAction(result.text);

        return c.json({ message: cleanText, action, provider: result.provider });
    } catch (error) {
        console.error('Assistant error:', error);
        return c.json({ message: 'I encountered an error. Please try again.', action: null }, 500);
    }
});

export { assistant };
