import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { projects } from './routes/projects';
import { datasets } from './routes/datasets';
import { charts } from './routes/charts';
import { transformations } from './routes/transformations';
import { assistant } from './routes/assistant';
import { auth } from './routes/auth';

export type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    AI: Ai;
    ANTHROPIC_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());
app.route('/auth', auth);
app.route('/projects', projects);
app.route('/datasets', datasets);
app.route('/charts', charts);
app.route('/transformations', transformations);
app.route('/assistant', assistant);

app.get('/', (c) => c.text('DataFlow API v1.0'));
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
