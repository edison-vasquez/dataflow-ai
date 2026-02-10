import { Hono } from 'hono';
import type { Bindings } from '../index';

const auth = new Hono<{ Bindings: Bindings }>();

auth.get('/me', async (c) => {
    const userId = c.req.header('x-user-id') || 'dev-user';
    const email = c.req.header('x-user-email') || 'dev@dataflow.local';
    const name = email.split('@')[0];

    try {
        await c.env.DB.prepare(`
            INSERT INTO users (id, email, name) VALUES (?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET name = excluded.name
        `).bind(userId, email, name).run();

        const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
            .bind(email).first();

        return c.json(dbUser || { id: userId, email, name, plan: 'free' });
    } catch (error) {
        console.error('Auth error:', error);
        return c.json({ id: userId, email, name, plan: 'free' });
    }
});

export { auth };
