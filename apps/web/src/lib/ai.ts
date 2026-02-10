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
                        sample: currentData.slice(0, 3)
                    } : null,
                    issues: extra?.issues || [],
                }
            })
        });

        if (!response.ok) throw new Error('AI Service unavailable');

        const result = await response.json() as { message: string; action?: { type: string; target?: string; chart?: any } };

        // Process "actions" from the LLM if any
        if (result.action) {
            if (result.action.type === 'switch_phase') {
                setPhase(result.action.target);
            }
            if (result.action.type === 'create_chart') {
                addChart(result.action.chart);
            }
        }

        return result.message;
    } catch (error) {
        console.error("AI Error:", error);
        return "I'm having trouble connecting to my neural core. Please try again in a moment.";
    }
}
