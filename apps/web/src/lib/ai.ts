/**
 * Build a chart object from dataset + LLM hints (column names, type).
 * The LLM only suggests which columns and chart type — the actual data
 * is always sourced from the real dataset in the store.
 */
function buildChartFromData(
    dataset: any[],
    chartHint: { title?: string; type?: string; xColumn?: string; yColumn?: string; columns?: string[] }
): any | null {
    if (!dataset || dataset.length === 0) return null;

    const columns = Object.keys(dataset[0]);
    const numCols = columns.filter(c => typeof dataset[0][c] === 'number');
    const catCols = columns.filter(c => typeof dataset[0][c] === 'string');

    const chartType = chartHint.type || 'bar';
    let xCol = chartHint.xColumn;
    let yCol = chartHint.yColumn;

    // Validate that the suggested columns actually exist
    if (xCol && !columns.includes(xCol)) xCol = undefined;
    if (yCol && !columns.includes(yCol)) yCol = undefined;

    // Auto-pick columns if the LLM didn't specify valid ones
    if (!xCol) xCol = catCols[0] || columns[0];
    if (!yCol) yCol = numCols[0] || columns[1] || columns[0];

    const title = chartHint.title || `${xCol} vs ${yCol}`;

    if (chartType === 'pie') {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol!]);
            counts[key] = (counts[key] || 0) + (Number(r[yCol!]) || 1);
        });
        return {
            id: Math.random().toString(),
            title,
            type: 'pie',
            data: Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, value]) => ({ name, value })),
            layout: {}
        };
    }

    if (chartType === 'radar') {
        const selectedCols = chartHint.columns || numCols.slice(0, 5);
        if (selectedCols.length < 3) return null;

        // Calculate averages for the radar
        const values = selectedCols.map(col => {
            const sum = dataset.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
            return sum / dataset.length;
        });

        return {
            id: Math.random().toString(),
            title,
            type: 'radar',
            data: [{ name: 'Averages', value: values }],
            layout: {
                radar: {
                    indicator: selectedCols.map(col => ({ name: col, max: Math.max(...dataset.map(r => Number(r[col]) || 0)) * 1.1 }))
                }
            }
        };
    }

    if (chartType === 'treemap' || chartType === 'sunburst') {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol!]);
            counts[key] = (counts[key] || 0) + (Number(r[yCol!]) || 1);
        });
        const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

        return {
            id: Math.random().toString(),
            title,
            type: chartType,
            data: data.sort((a, b) => b.value - a.value).slice(0, 20),
            layout: {}
        };
    }

    if (chartType === 'funnel') {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol!]);
            counts[key] = (counts[key] || 0) + (Number(r[yCol!]) || 1);
        });
        const data = Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            id: Math.random().toString(),
            title,
            type: 'funnel',
            data,
            layout: {}
        };
    }

    if (chartType === 'gauge') {
        const val = Number(dataset[0]?.[yCol!]) || 0;
        const max = Math.max(...dataset.map(r => Number(r[yCol!]) || 0));
        return {
            id: Math.random().toString(),
            title,
            type: 'gauge',
            data: [{ value: val / (max || 1), name: xCol }],
            layout: {}
        };
    }

    if (chartType === 'boxplot') {
        const selectedCols = chartHint.columns || numCols.slice(0, 5);
        const data = selectedCols.map(col => {
            const vals = dataset.map(r => Number(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
            const n = vals.length;
            if (n === 0) return [0, 0, 0, 0, 0];
            return [
                vals[0],
                vals[Math.floor(n * 0.25)],
                vals[Math.floor(n * 0.5)],
                vals[Math.floor(n * 0.75)],
                vals[n - 1]
            ];
        });
        return {
            id: Math.random().toString(),
            title,
            type: 'boxplot',
            data,
            layout: {
                xAxis: { data: selectedCols }
            }
        };
    }

    if (chartType === 'sankey') {
        const sourceCol = chartHint.xColumn || catCols[0];
        const targetCol = chartHint.yColumn || catCols[1] || catCols[0];
        if (!sourceCol || !targetCol) return null;

        const linksMap: Record<string, number> = {};
        const nodesSet = new Set<string>();

        dataset.slice(0, 100).forEach(r => {
            const source = String(r[sourceCol]);
            const target = String(r[targetCol]);
            if (source === target) return;
            const key = `${source} -> ${target}`;
            linksMap[key] = (linksMap[key] || 0) + 1;
            nodesSet.add(source);
            nodesSet.add(target);
        });

        const nodes = Array.from(nodesSet).map(name => ({ name }));
        const links = Object.entries(linksMap).map(([key, value]) => {
            const [source, target] = key.split(' -> ');
            return { source, target, value };
        });

        return {
            id: Math.random().toString(),
            title,
            type: 'sankey',
            data: { nodes, links },
            layout: {}
        };
    }

    if (chartType === 'scatter') {
        const sx = numCols.includes(xCol!) ? xCol! : numCols[0];
        const sy = yCol && numCols.includes(yCol) ? yCol : numCols[1] || numCols[0];
        if (!sx || !sy) return null;

        return {
            id: Math.random().toString(),
            title: chartHint.title || `${sx} vs ${sy}`,
            type: 'scatter',
            data: [{
                x: dataset.map(r => r[sx]),
                y: dataset.map(r => r[sy]),
            }],
            layout: {}
        };
    }

    // Default: bar chart
    if (catCols.includes(xCol!) && numCols.includes(yCol!)) {
        const counts: Record<string, number> = {};
        dataset.forEach(r => {
            const key = String(r[xCol!]);
            counts[key] = (counts[key] || 0) + (Number(r[yCol!]) || 0);
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15);
        return {
            id: Math.random().toString(),
            title,
            type: 'bar',
            data: [{ x: sorted.map(s => s[0]), y: sorted.map(s => s[1]) }],
            layout: {}
        };
    }

    return {
        id: Math.random().toString(),
        title,
        type: chartType,
        data: [{
            x: dataset.map(r => r[xCol!]),
            y: dataset.map(r => r[yCol!]),
        }],
        layout: {}
    };
}

export async function processAssistantRequest(
    message: string,
    currentData: any[],
    setDataset: any,
    setIssues: any,
    addChart: any,
    setPhase: any,
    extra?: { datasetName?: string | null; phase?: string; issues?: any[] }
) {
    try {
        const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];
        const numCols = columns.filter(c => typeof currentData[0]?.[c] === 'number');
        const catCols = columns.filter(c => typeof currentData[0]?.[c] === 'string');

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://dataflow-api.edison-985.workers.dev';
        const response = await fetch(`${API_BASE}/assistant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                context: {
                    phase: extra?.phase || 'workspace',
                    datasetName: extra?.datasetName || null,
                    dataSummary: currentData.length > 0 ? {
                        rows: currentData.length,
                        columns,
                        numericColumns: numCols,
                        categoricalColumns: catCols,
                        sample: currentData.slice(0, 3)
                    } : null,
                    issues: extra?.issues || [],
                }
            })
        });

        if (!response.ok) throw new Error('AI Service unavailable');

        const result = await response.json() as {
            message: string;
            action?: {
                type: 'switch_phase' | 'create_chart' | 'apply_transformation';
                target?: string;
                chart?: { title?: string; type?: string; xColumn?: string; yColumn?: string; columns?: string[] };
                transformation?: { type: string; params: any };
            }
        };

        // Process "actions" from the LLM if any
        if (result.action) {
            if (result.action.type === 'switch_phase' && result.action.target) {
                setPhase(result.action.target);
            }
            if (result.action.type === 'create_chart') {
                // Build the chart from REAL dataset data, not from LLM output
                const chart = buildChartFromData(currentData, result.action.chart || {});
                if (chart) {
                    addChart(chart);
                    // Return chart info so ChatPanel can persist it
                    return { message: result.message, chart };
                }
            }
            if (result.action.type === 'apply_transformation' && result.action.transformation) {
                const { type, params } = result.action.transformation;
                return { message: result.message, transformation: { type, params } };
            }
        }

        return result.message;
    } catch (error) {
        console.error("AI Error:", error);
        return "I'm having trouble connecting right now. Please try again in a moment.";
    }
}
