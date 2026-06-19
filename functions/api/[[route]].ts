import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';
import { createDb } from '../../src/db/index.ts';

export type Env = {
  Bindings: {
    DB: D1Database;
    GMAIL_CLIENT_ID: string;
    GMAIL_CLIENT_SECRET: string;
    GMAIL_REFRESH_TOKEN: string;
  };
};

const app = new Hono<Env>().basePath('/api');

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'] }));

// Health check
app.get('/health', (c) =>
  c.json({ ok: true, version: '0.1.0', ts: new Date().toISOString() }),
);

// Placeholder route groups — implemented in Phase 3
app.get('/acts',         (c) => c.json({ ok: true, data: [] }));
app.get('/timeline',     (c) => c.json({ ok: true, data: [] }));
app.get('/tasks',        (c) => c.json({ ok: true, data: [] }));
app.get('/emails',       (c) => c.json({ ok: true, data: [] }));
app.get('/settings',     (c) => c.json({ ok: true, data: {} }));

app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: 'Internal server error' }, 500);
});

export const onRequest = handle(app);
