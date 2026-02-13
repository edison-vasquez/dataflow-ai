import { Hono } from 'hono';
import type { Bindings } from '../index';

const projects = new Hono<{ Bindings: Bindings }>();

projects.get('/', async (c) => {
    const userId = c.req.header('x-user-id') || 'dev-user';
    const cacheKey = `projects:${userId}`;
    try {
        // Try KV cache first
        const cached = await c.env.CACHE.get(cacheKey);
        if (cached) return c.json(JSON.parse(cached));

        const { results } = await c.env.DB.prepare(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(userId).all();

        // Cache for 60 seconds
        await c.env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: 60 });
        return c.json(results);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return c.json([], 500);
    }
});

projects.post('/', async (c) => {
    try {
        const { name } = await c.req.json() as { name?: string };
        const userId = c.req.header('x-user-id') || 'dev-user';
        const id = crypto.randomUUID();
        const newProject = {
            id,
            user_id: userId,
            name: name || 'Untitled Project',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        await c.env.DB.prepare(
            'INSERT INTO projects (id, user_id, name, status) VALUES (?, ?, ?, ?)'
        ).bind(id, userId, newProject.name, 'active').run();
        // Invalidate cache
        await c.env.CACHE.delete(`projects:${userId}`);
        return c.json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        return c.json({ error: 'Failed to create project' }, 500);
    }
});

projects.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?')
            .bind(id).first();
        if (!project) return c.json({ error: 'Not found' }, 404);
        return c.json(project);
    } catch (error) {
        return c.json({ error: 'Failed to fetch project' }, 500);
    }
});

projects.put('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const { name, status } = await c.req.json() as { name?: string; status?: string };
        await c.env.DB.prepare(
            'UPDATE projects SET name = COALESCE(?, name), status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(name || null, status || null, id).run();
        const userId = c.req.header('x-user-id') || 'dev-user';
        await c.env.CACHE.delete(`projects:${userId}`);
        return c.json({ id, name, status });
    } catch (error) {
        return c.json({ error: 'Failed to update project' }, 500);
    }
});

projects.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
        const userId = c.req.header('x-user-id') || 'dev-user';
        await c.env.CACHE.delete(`projects:${userId}`);
        return c.json({ deleted: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete project' }, 500);
    }
});

export { projects };
