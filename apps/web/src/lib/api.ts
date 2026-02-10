const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://dataflow-api.edison-985.workers.dev';

export const api = {
    auth: {
        me: async () => {
            const res = await fetch(`${API_BASE}/auth/me`);
            if (!res.ok) throw new Error('Auth failed');
            return res.json();
        },
    },

    projects: {
        list: async (): Promise<Array<{ id: string; name: string; status: string }>> => {
            const res = await fetch(`${API_BASE}/projects`);
            if (!res.ok) throw new Error('Failed to fetch projects');
            return res.json();
        },
        create: async (name: string): Promise<{ id: string; name: string; status: string }> => {
            const res = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Failed to create project');
            return res.json();
        },
        get: async (id: string) => {
            const res = await fetch(`${API_BASE}/projects/${id}`);
            if (!res.ok) throw new Error('Failed to fetch project');
            return res.json();
        },
        update: async (id: string, data: { name?: string; status?: string }) => {
            const res = await fetch(`${API_BASE}/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update project');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
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
            const res = await fetch(`${API_BASE}/datasets`, { method: 'POST', body: form });
            if (!res.ok) throw new Error('Failed to upload dataset');
            return res.json();
        },
        get: async (id: string) => {
            const res = await fetch(`${API_BASE}/datasets/${id}`);
            if (!res.ok) throw new Error('Failed to fetch dataset');
            return res.json();
        },
        getData: async (id: string) => {
            const res = await fetch(`${API_BASE}/datasets/${id}/data`);
            if (!res.ok) throw new Error('Failed to fetch dataset data');
            return res.text();
        },
    },

    transformations: {
        create: async (data: { projectId: string; type: string; params: any; rowsAffected?: number }) => {
            const res = await fetch(`${API_BASE}/transformations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save transformation');
            return res.json();
        },
        list: async (projectId: string) => {
            const res = await fetch(`${API_BASE}/transformations?projectId=${projectId}`);
            if (!res.ok) throw new Error('Failed to fetch transformations');
            return res.json();
        },
    },

    charts: {
        create: async (data: { projectId: string; title: string; type: string; config: any }) => {
            const res = await fetch(`${API_BASE}/charts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save chart');
            return res.json();
        },
        list: async (projectId: string) => {
            const res = await fetch(`${API_BASE}/charts?projectId=${projectId}`);
            if (!res.ok) throw new Error('Failed to fetch charts');
            return res.json();
        },
    },
};
