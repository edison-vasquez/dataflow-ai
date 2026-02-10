import { Hono } from 'hono';
import type { Bindings } from '../index';

const transformations = new Hono<{ Bindings: Bindings }>();

transformations.post('/', async (c) => {
    try {
        const { projectId, type, params, rowsAffected } = await c.req.json() as { projectId: string; type: string; params?: any; rowsAffected?: number };
        if (!projectId || !type) {
            return c.json({ error: 'projectId and type are required' }, 400);
        }

        const id = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO transformations (id, project_id, type, params, rows_affected)
            VALUES (?, ?, ?, ?, ?)
        `).bind(id, projectId, type, JSON.stringify(params || {}), rowsAffected || 0).run();

        return c.json({ id, type, created_at: new Date().toISOString() });
    } catch (error) {
        console.error('Transformation save error:', error);
        return c.json({ error: 'Failed to save transformation' }, 500);
    }
});

transformations.get('/', async (c) => {
    try {
        const projectId = c.req.query('projectId');
        if (!projectId) return c.json({ error: 'projectId required' }, 400);

        const { results } = await c.env.DB.prepare(
            'SELECT * FROM transformations WHERE project_id = ? ORDER BY created_at ASC'
        ).bind(projectId).all();

        const parsed = (results || []).map((t: any) => ({
            ...t,
            params: t.params ? JSON.parse(t.params) : {},
        }));

        return c.json(parsed);
    } catch (error) {
        console.error('Transformation list error:', error);
        return c.json([], 500);
    }
});

export { transformations };
