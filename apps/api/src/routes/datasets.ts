import { Hono } from 'hono';
import type { Bindings } from '../index';

const datasets = new Hono<{ Bindings: Bindings }>();

datasets.post('/', async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string;
        const schema = formData.get('schema') as string;
        const rowCount = parseInt(formData.get('rowCount') as string);

        if (!file || !projectId) {
            return c.json({ error: 'File and projectId are required' }, 400);
        }

        const id = crypto.randomUUID();
        const r2Key = `datasets/${projectId}/${id}/${file.name}`;

        await c.env.BUCKET.put(r2Key, file.stream(), {
            httpMetadata: { contentType: file.type || 'text/csv' },
        });

        await c.env.DB.prepare(`
            INSERT INTO data_sources (id, project_id, name, type, r2_key, schema_json, row_count, status)
            VALUES (?, ?, ?, 'file', ?, ?, ?, 'ready')
        `).bind(id, projectId, file.name, r2Key, schema, rowCount).run();

        return c.json({ id, r2Key, name: file.name, rowCount });
    } catch (error) {
        console.error('Dataset upload error:', error);
        return c.json({ error: 'Failed to upload dataset' }, 500);
    }
});

datasets.get('/', async (c) => {
    try {
        const projectId = c.req.query('projectId');
        if (!projectId) return c.json({ error: 'projectId required' }, 400);

        const { results } = await c.env.DB.prepare(
            'SELECT * FROM data_sources WHERE project_id = ? ORDER BY created_at DESC'
        ).bind(projectId).all();

        return c.json(results);
    } catch (error) {
        console.error('Dataset list error:', error);
        return c.json([], 500);
    }
});

datasets.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const dataset = await c.env.DB.prepare(
            'SELECT * FROM data_sources WHERE id = ?'
        ).bind(id).first();

        if (!dataset) return c.json({ error: 'Dataset not found' }, 404);
        return c.json(dataset);
    } catch (error) {
        return c.json({ error: 'Failed to fetch dataset' }, 500);
    }
});

datasets.get('/:id/data', async (c) => {
    try {
        const id = c.req.param('id');
        const dataset = await c.env.DB.prepare(
            'SELECT r2_key, name FROM data_sources WHERE id = ?'
        ).bind(id).first<{ r2_key: string; name: string }>();

        if (!dataset) return c.json({ error: 'Dataset not found' }, 404);

        const object = await c.env.BUCKET.get(dataset.r2_key);
        if (!object) return c.json({ error: 'File not found in storage' }, 404);

        return new Response(object.body, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${dataset.name}"`,
            },
        });
    } catch (error) {
        return c.json({ error: 'Failed to fetch dataset data' }, 500);
    }
});

datasets.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const dataset = await c.env.DB.prepare(
            'SELECT r2_key FROM data_sources WHERE id = ?'
        ).bind(id).first<{ r2_key: string }>();

        if (dataset?.r2_key) {
            await c.env.BUCKET.delete(dataset.r2_key);
        }

        await c.env.DB.prepare('DELETE FROM data_sources WHERE id = ?').bind(id).run();
        return c.json({ deleted: true });
    } catch (error) {
        return c.json({ error: 'Failed to delete dataset' }, 500);
    }
});

export { datasets };
