import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';
import { eq, asc } from 'drizzle-orm';
import { createDb } from '../../src/db/index.ts';
import { acts, timelineSlots, tasks, emailThreads, emailMessages, settings } from '../../src/db/schema.ts';

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

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (c) =>
  c.json({ ok: true, version: '0.3.0', ts: new Date().toISOString() }),
);

// ── Acts ──────────────────────────────────────────────────────────────────────

app.get('/acts', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(acts).orderBy(asc(acts.name));
  return c.json({ ok: true, data: rows });
});

app.post('/acts', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const now = new Date().toISOString();
  const [row] = await db.insert(acts).values({
    name:           String(body.name ?? ''),
    contactName:    (body.contactName as string | null) ?? null,
    contactEmail:   (body.contactEmail as string | null) ?? null,
    contactEmail2:  (body.contactEmail2 as string | null) ?? null,
    contactPhone:   (body.contactPhone as string | null) ?? null,
    needsPA:        Boolean(body.needsPA ?? false),
    micCount:       Number(body.micCount ?? 0),
    needsSeats:     Boolean(body.needsSeats ?? false),
    seatsNotes:     (body.seatsNotes as string | null) ?? null,
    powerSockets:   (body.powerSockets as string | null) ?? null,
    setupMins:      Number(body.setupMins ?? 0),
    performerCount: (body.performerCount as string | null) ?? null,
    feePence:       body.feePence != null ? Number(body.feePence) : null,
    confirmed:      Boolean(body.confirmed ?? false),
    notes:          (body.notes as string | null) ?? null,
    websiteUrl:     (body.websiteUrl as string | null) ?? null,
    updatedBy:      (body.updatedBy as string | null) ?? null,
    createdAt:      now,
    updatedAt:      now,
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/acts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: new Date().toISOString() };
  const [row] = await db.update(acts).set(patch).where(eq(acts.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/acts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(acts).where(eq(acts.id, id));
  return c.json({ ok: true });
});

// ── Timeline ──────────────────────────────────────────────────────────────────

app.get('/timeline', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(timelineSlots).orderBy(asc(timelineSlots.sortOrder));
  return c.json({ ok: true, data: rows });
});

app.post('/timeline', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const [row] = await db.insert(timelineSlots).values({
    actId:     body.actId != null ? Number(body.actId) : null,
    actName:   String(body.actName ?? ''),
    startTime: String(body.startTime ?? ''),
    endTime:   String(body.endTime ?? ''),
    date:      String(body.date ?? '2026-08-16'),
    isGap:     Boolean(body.isGap ?? false),
    gapReason: (body.gapReason as string | null) ?? null,
    sortOrder: Number(body.sortOrder ?? 0),
    updatedBy: (body.updatedBy as string | null) ?? null,
    updatedAt: new Date().toISOString(),
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/timeline/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: new Date().toISOString() };
  const [row] = await db.update(timelineSlots).set(patch).where(eq(timelineSlots.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/timeline/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(timelineSlots).where(eq(timelineSlots.id, id));
  return c.json({ ok: true });
});

// Bulk reorder: body = { order: number[] } (array of slot ids in desired order)
app.post('/timeline/reorder', async (c) => {
  const { order } = await c.req.json<{ order: number[] }>();
  const db = createDb(c.env.DB);
  const now = new Date().toISOString();
  await Promise.all(
    order.map((id, idx) =>
      db.update(timelineSlots)
        .set({ sortOrder: (idx + 1) * 10, updatedAt: now })
        .where(eq(timelineSlots.id, id)),
    ),
  );
  const rows = await db.select().from(timelineSlots).orderBy(asc(timelineSlots.sortOrder));
  return c.json({ ok: true, data: rows });
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

app.get('/tasks', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(tasks).orderBy(asc(tasks.sortOrder));
  return c.json({ ok: true, data: rows });
});

app.post('/tasks', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const now = new Date().toISOString();
  const [row] = await db.insert(tasks).values({
    title:       String(body.title ?? ''),
    description: (body.description as string | null) ?? null,
    assignee:    (body.assignee as string | null) ?? null,
    dueDate:     (body.dueDate as string | null) ?? null,
    done:        false,
    sortOrder:   Number(body.sortOrder ?? 0),
    updatedBy:   (body.updatedBy as string | null) ?? null,
    createdAt:   now,
    updatedAt:   now,
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { ...body, updatedAt: now };
  // auto-stamp doneAt when marking done
  if (body.done === true && !body.doneAt) patch.doneAt = now;
  if (body.done === false) { patch.doneAt = null; patch.doneBy = null; }
  const [row] = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(tasks).where(eq(tasks.id, id));
  return c.json({ ok: true });
});

// Bulk reorder
app.post('/tasks/reorder', async (c) => {
  const { order } = await c.req.json<{ order: number[] }>();
  const db = createDb(c.env.DB);
  const now = new Date().toISOString();
  await Promise.all(
    order.map((id, idx) =>
      db.update(tasks)
        .set({ sortOrder: (idx + 1) * 10, updatedAt: now })
        .where(eq(tasks.id, id)),
    ),
  );
  const rows = await db.select().from(tasks).orderBy(asc(tasks.sortOrder));
  return c.json({ ok: true, data: rows });
});

// ── Emails (read-only — written by cron Worker) ───────────────────────────────

app.get('/emails', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db
    .select()
    .from(emailThreads)
    .orderBy(asc(emailThreads.lastMessageAt));
  // reverse for newest-first
  return c.json({ ok: true, data: rows.reverse() });
});

app.get('/emails/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  const [thread] = await db.select().from(emailThreads).where(eq(emailThreads.id, id));
  if (!thread) return c.json({ ok: false, error: 'Not found' }, 404);
  const messages = await db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.threadId, id))
    .orderBy(asc(emailMessages.sentAt));
  return c.json({ ok: true, data: { thread, messages } });
});

// ── Settings ──────────────────────────────────────────────────────────────────

app.get('/settings', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return c.json({ ok: true, data: map });
});

app.patch('/settings/:key', async (c) => {
  const key = c.req.param('key');
  const { value } = await c.req.json<{ value: string }>();
  const db = createDb(c.env.DB);
  const now = new Date().toISOString();
  await db
    .insert(settings)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now } });
  return c.json({ ok: true, data: { key, value } });
});

// ── Fallbacks ─────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: 'Internal server error' }, 500);
});

export const onRequest = handle(app);
