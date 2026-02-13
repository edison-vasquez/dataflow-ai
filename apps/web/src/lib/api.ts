const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://dataflow-api.edison-985.workers.dev';

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_BASE = 1000;

async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    { retries = MAX_RETRIES, timeout = DEFAULT_TIMEOUT } = {}
): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Don't retry client errors (4xx), only server errors (5xx)
            if (res.ok || (res.status >= 400 && res.status < 500)) {
                return res;
            }

            if (attempt < retries) {
                const backoff = RETRY_BACKOFF_BASE * Math.pow(2, attempt);
                const jitter = Math.random() * 500;
                await new Promise(r => setTimeout(r, backoff + jitter));
                continue;
            }

            return res;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                if (attempt < retries) {
                    const backoff = RETRY_BACKOFF_BASE * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, backoff));
                    continue;
                }
                throw new Error(`Request timed out after ${timeout}ms: ${url}`);
            }
            if (attempt < retries) {
                const backoff = RETRY_BACKOFF_BASE * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, backoff));
                continue;
            }
            throw error;
        }
    }

    throw new Error(`Failed after ${retries} retries: ${url}`);
}

export const api = {
    auth: {
        me: async () => {
            const res = await fetchWithRetry(`${API_BASE}/auth/me`);
            if (!res.ok) throw new Error('Auth failed');
            return res.json();
        },
    },

    projects: {
        list: async (): Promise<Array<{ id: string; name: string; status: string }>> => {
            const res = await fetchWithRetry(`${API_BASE}/projects`);
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
        create: async (name: string): Promise<{ id: string; name: string; status: string }> => {
            const res = await fetchWithRetry(`${API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Failed to create project');
            return res.json();
        },
        get: async (id: string) => {
            const res = await fetchWithRetry(`${API_BASE}/projects/${id}`);
            if (!res.ok) throw new Error('Failed to fetch project');
            return res.json();
        },
        update: async (id: string, data: { name?: string; status?: string }) => {
            const res = await fetchWithRetry(`${API_BASE}/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update project');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetchWithRetry(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete project');
            return res.json();
        },
    },

    datasets: {
        upload: async (file: File, projectId: string, schema: string[], rowCount: number): Promise<{ id: string; r2Key: string; name: string }> => {
            const form = new FormData();
            form.append('file', file);
            form.append('projectId', projectId);
            form.append('schema', JSON.stringify(schema));
            form.append('rowCount', String(rowCount));
            const res = await fetchWithRetry(`${API_BASE}/datasets`, { method: 'POST', body: form }, { timeout: 30000 });
            if (!res.ok) throw new Error('Failed to upload dataset');
            return res.json();
        },
        get: async (id: string) => {
            const res = await fetchWithRetry(`${API_BASE}/datasets/${id}`);
            if (!res.ok) throw new Error('Failed to fetch dataset');
            return res.json();
        },
        getData: async (id: string) => {
            const res = await fetchWithRetry(`${API_BASE}/datasets/${id}/data`);
            if (!res.ok) throw new Error('Failed to fetch dataset data');
            return res.text();
        },
    },

    transformations: {
        create: async (data: { projectId: string; type: string; params: any; rowsAffected?: number }) => {
            const res = await fetchWithRetry(`${API_BASE}/transformations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save transformation');
            return res.json();
        },
        list: async (projectId: string) => {
            const res = await fetchWithRetry(`${API_BASE}/transformations?projectId=${projectId}`);
            if (!res.ok) throw new Error('Failed to fetch transformations');
            return res.json();
        },
    },

    charts: {
        create: async (data: { projectId: string; title: string; type: string; config: any }) => {
            const res = await fetchWithRetry(`${API_BASE}/charts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save chart');
            return res.json();
        },
        list: async (projectId: string) => {
            const res = await fetchWithRetry(`${API_BASE}/charts?projectId=${projectId}`);
            if (!res.ok) throw new Error('Failed to fetch charts');
            return res.json();
        },
    },
};
