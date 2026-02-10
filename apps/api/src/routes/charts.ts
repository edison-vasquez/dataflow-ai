import { Hono } from 'hono';
import type { Bindings } from '../index';

const charts = new Hono<{ Bindings: Bindings }>();

charts.post('/', async (c) => {
    try {
        const { projectId, title, type, config } = await c.req.json() as { projectId: string; title: string; type: string; config?: any };
        if (!projectId || !title || !type) {
            return c.json({ error: 'projectId, title, and type are required' }, 400);
        }

        const id = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO charts (id, project_id, title, type, config)
            VALUES (?, ?, ?, ?, ?)
        `).bind(id, projectId, title, type, JSON.stringify(config || {})).run();

        return c.json({ id, title, type, created_at: new Date().toISOString() });
    } catch (error) {
        console.error('Chart save error:', error);
        return c.json({ error: 'Failed to save chart' }, 500);
    }
});

charts.get('/', async (c) => {
    try {
        const projectId = c.req.query('projectId');
        if (!projectId) return c.json({ error: 'projectId required' }, 400);

        const { results } = await c.env.DB.prepare(
            'SELECT * FROM charts WHERE project_id = ? ORDER BY created_at ASC'
        ).bind(projectId).all();

        const parsed = (results || []).map((ch: any) => ({
            ...ch,
            config: ch.config ? JSON.parse(ch.config) : {},
        }));

        return c.json(parsed);
    } catch (error) {
        console.error('Chart list error:', error);
        return c.json([], 500);
    }
});

export { charts };
