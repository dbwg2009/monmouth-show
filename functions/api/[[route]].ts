import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/cloudflare-pages';
import { eq, asc } from 'drizzle-orm';
import { createDb } from '../../src/db/index.ts';
import {
  acts, channels, timelineSlots, tasks, chaseItems, contacts,
  locations, walkaroundNotes, emailThreads, emailMessages, settings,
} from '../../src/db/schema.ts';

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

const now = () => new Date().toISOString();

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (c) =>
  c.json({ ok: true, version: '1.0.0', ts: now() }),
);

// ── Bootstrap (one request primes the whole offline cache) ────────────────────

app.get('/bootstrap', async (c) => {
  const db = createDb(c.env.DB);
  const [
    actRows, channelRows, slotRows, taskRows, chaseRows,
    contactRows, locationRows, walkRows, threadRows, settingRows,
  ] = await Promise.all([
    db.select().from(acts).orderBy(asc(acts.name)),
    db.select().from(channels).orderBy(asc(channels.actId), asc(channels.sortOrder)),
    db.select().from(timelineSlots).orderBy(asc(timelineSlots.sortOrder)),
    db.select().from(tasks).orderBy(asc(tasks.sortOrder)),
    db.select().from(chaseItems).orderBy(asc(chaseItems.sortOrder)),
    db.select().from(contacts).orderBy(asc(contacts.sortOrder)),
    db.select().from(locations).orderBy(asc(locations.sortOrder)),
    db.select().from(walkaroundNotes).orderBy(asc(walkaroundNotes.createdAt)),
    db.select().from(emailThreads).orderBy(asc(emailThreads.lastMessageAt)),
    db.select().from(settings),
  ]);
  return c.json({
    ok: true,
    data: {
      acts: actRows,
      channels: channelRows,
      timeline: slotRows,
      tasks: taskRows,
      chaseItems: chaseRows,
      contacts: contactRows,
      locations: locationRows,
      walkaroundNotes: walkRows.reverse(),
      emails: threadRows.reverse(),
      settings: Object.fromEntries(settingRows.map((r) => [r.key, r.value])),
    },
  });
});

// ── Acts ──────────────────────────────────────────────────────────────────────

app.get('/acts', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(acts).orderBy(asc(acts.name));
  return c.json({ ok: true, data: rows });
});

app.post('/acts', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const ts = now();
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
    status:         (body.status as string) ?? 'expected',
    notes:          (body.notes as string | null) ?? null,
    websiteUrl:     (body.websiteUrl as string | null) ?? null,
    updatedBy:      (body.updatedBy as string | null) ?? null,
    createdAt:      ts,
    updatedAt:      ts,
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/acts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: now() };
  delete patch.id; delete patch.createdAt;
  if (body.status !== undefined) patch.statusUpdatedAt = now();
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

// ── Channels (BSB input list) ─────────────────────────────────────────────────

app.get('/channels', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(channels).orderBy(asc(channels.actId), asc(channels.sortOrder));
  return c.json({ ok: true, data: rows });
});

app.post('/channels', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const [row] = await db.insert(channels).values({
    actId:     Number(body.actId),
    channelNo: Number(body.channelNo ?? 1),
    source:    String(body.source ?? ''),
    inputType: (body.inputType as string | null) ?? null,
    notes:     (body.notes as string | null) ?? null,
    sortOrder: Number(body.sortOrder ?? 0),
    updatedBy: (body.updatedBy as string | null) ?? null,
    updatedAt: now(),
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/channels/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: now() };
  delete patch.id;
  const [row] = await db.update(channels).set(patch).where(eq(channels.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/channels/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(channels).where(eq(channels.id, id));
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
  const start = String(body.startTime ?? '');
  const end = String(body.endTime ?? '');
  const [row] = await db.insert(timelineSlots).values({
    actId:            body.actId != null ? Number(body.actId) : null,
    actName:          String(body.actName ?? ''),
    startTime:        start,
    endTime:          end,
    plannedStartTime: (body.plannedStartTime as string | null) ?? start,
    plannedEndTime:   (body.plannedEndTime as string | null) ?? end,
    openEnded:        Boolean(body.openEnded ?? false),
    date:             String(body.date ?? '2026-08-16'),
    isGap:            Boolean(body.isGap ?? false),
    gapReason:        (body.gapReason as string | null) ?? null,
    sortOrder:        Number(body.sortOrder ?? 0),
    updatedBy:        (body.updatedBy as string | null) ?? null,
    updatedAt:        now(),
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/timeline/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: now() };
  delete patch.id;
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

// Bulk reorder: body = { order: number[] } (slot ids in desired order)
app.post('/timeline/reorder', async (c) => {
  const { order } = await c.req.json<{ order: number[] }>();
  const db = createDb(c.env.DB);
  const ts = now();
  await Promise.all(
    order.map((id, idx) =>
      db.update(timelineSlots)
        .set({ sortOrder: (idx + 1) * 10, updatedAt: ts })
        .where(eq(timelineSlots.id, id)),
    ),
  );
  const rows = await db.select().from(timelineSlots).orderBy(asc(timelineSlots.sortOrder));
  return c.json({ ok: true, data: rows });
});

// Live: mark an act as started now (tap-to-advance). Finishes the previous live slot.
app.post('/timeline/:id/start', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ updatedBy?: string }>().catch(() => ({} as { updatedBy?: string }));
  const db = createDb(c.env.DB);
  const ts = now();
  // Finish the previously-live slot (tracked by the live_current_slot_id pointer).
  const prev = await db.select().from(settings).where(eq(settings.key, 'live_current_slot_id'));
  const prevId = prev[0]?.value ? Number(prev[0].value) : null;
  if (prevId && prevId !== id) {
    await db.update(timelineSlots).set({ finishedAt: ts, updatedAt: ts }).where(eq(timelineSlots.id, prevId));
  }
  const [row] = await db.update(timelineSlots)
    .set({ actualStartTime: ts, finishedAt: null, updatedBy: body.updatedBy ?? null, updatedAt: ts })
    .where(eq(timelineSlots.id, id))
    .returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  await db.insert(settings)
    .values({ key: 'live_current_slot_id', value: String(id), updatedAt: ts })
    .onConflictDoUpdate({ target: settings.key, set: { value: String(id), updatedAt: ts } });
  return c.json({ ok: true, data: row });
});

// Live: mark an act finished now.
app.post('/timeline/:id/finish', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  const ts = now();
  const [row] = await db.update(timelineSlots)
    .set({ finishedAt: ts, updatedAt: ts })
    .where(eq(timelineSlots.id, id))
    .returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  // Only clear the live pointer if the slot being finished is the current one,
  // so finishing an older slot doesn't wipe the pointer to a live act.
  const ptr = await db.select().from(settings).where(eq(settings.key, 'live_current_slot_id'));
  if (ptr[0]?.value === String(id)) {
    await db.insert(settings)
      .values({ key: 'live_current_slot_id', value: '', updatedAt: ts })
      .onConflictDoUpdate({ target: settings.key, set: { value: '', updatedAt: ts } });
  }
  return c.json({ ok: true, data: row });
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
  const ts = now();
  const [row] = await db.insert(tasks).values({
    title:       String(body.title ?? ''),
    description: (body.description as string | null) ?? null,
    assignee:    (body.assignee as string | null) ?? null,
    dueDate:     (body.dueDate as string | null) ?? null,
    done:        false,
    sortOrder:   Number(body.sortOrder ?? 0),
    updatedBy:   (body.updatedBy as string | null) ?? null,
    createdAt:   ts,
    updatedAt:   ts,
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const ts = now();
  const patch: Record<string, unknown> = { ...body, updatedAt: ts };
  delete patch.id; delete patch.createdAt;
  if (body.done === true && !body.doneAt) patch.doneAt = ts;
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

app.post('/tasks/reorder', async (c) => {
  const { order } = await c.req.json<{ order: number[] }>();
  const db = createDb(c.env.DB);
  const ts = now();
  await Promise.all(
    order.map((id, idx) =>
      db.update(tasks)
        .set({ sortOrder: (idx + 1) * 10, updatedAt: ts })
        .where(eq(tasks.id, id)),
    ),
  );
  const rows = await db.select().from(tasks).orderBy(asc(tasks.sortOrder));
  return c.json({ ok: true, data: rows });
});

// ── Chase items ───────────────────────────────────────────────────────────────

app.get('/chase', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(chaseItems).orderBy(asc(chaseItems.sortOrder));
  return c.json({ ok: true, data: rows });
});

app.post('/chase', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const ts = now();
  const [row] = await db.insert(chaseItems).values({
    actId:     body.actId != null ? Number(body.actId) : null,
    label:     String(body.label ?? ''),
    done:      Boolean(body.done ?? false),
    sortOrder: Number(body.sortOrder ?? 0),
    updatedBy: (body.updatedBy as string | null) ?? null,
    createdAt: ts,
    updatedAt: ts,
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/chase/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const ts = now();
  const patch: Record<string, unknown> = { ...body, updatedAt: ts };
  delete patch.id; delete patch.createdAt;
  if (body.done === true && !body.doneAt) patch.doneAt = ts;
  if (body.done === false) patch.doneAt = null;
  const [row] = await db.update(chaseItems).set(patch).where(eq(chaseItems.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/chase/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(chaseItems).where(eq(chaseItems.id, id));
  return c.json({ ok: true });
});

// ── Contacts ──────────────────────────────────────────────────────────────────

app.get('/contacts', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(contacts).orderBy(asc(contacts.sortOrder));
  return c.json({ ok: true, data: rows });
});

app.post('/contacts', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const [row] = await db.insert(contacts).values({
    name:      String(body.name ?? ''),
    role:      (body.role as string | null) ?? null,
    org:       (body.org as string | null) ?? null,
    phone:     (body.phone as string | null) ?? null,
    email:     (body.email as string | null) ?? null,
    notes:     (body.notes as string | null) ?? null,
    sortOrder: Number(body.sortOrder ?? 0),
    updatedBy: (body.updatedBy as string | null) ?? null,
    updatedAt: now(),
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/contacts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: now() };
  delete patch.id;
  const [row] = await db.update(contacts).set(patch).where(eq(contacts.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/contacts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(contacts).where(eq(contacts.id, id));
  return c.json({ ok: true });
});

// ── Locations ─────────────────────────────────────────────────────────────────

app.get('/locations', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(locations).orderBy(asc(locations.sortOrder));
  return c.json({ ok: true, data: rows });
});

app.post('/locations', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const [row] = await db.insert(locations).values({
    name:      String(body.name ?? ''),
    category:  (body.category as string) ?? 'place',
    notes:     (body.notes as string | null) ?? null,
    posX:      body.posX != null ? Number(body.posX) : null,
    posY:      body.posY != null ? Number(body.posY) : null,
    sortOrder: Number(body.sortOrder ?? 0),
    updatedBy: (body.updatedBy as string | null) ?? null,
    updatedAt: now(),
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/locations/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: now() };
  delete patch.id;
  const [row] = await db.update(locations).set(patch).where(eq(locations.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/locations/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(locations).where(eq(locations.id, id));
  return c.json({ ok: true });
});

// ── Walk-around notes ─────────────────────────────────────────────────────────

app.get('/walkaround', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(walkaroundNotes).orderBy(asc(walkaroundNotes.createdAt));
  return c.json({ ok: true, data: rows.reverse() });
});

app.post('/walkaround', async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const ts = now();
  const [row] = await db.insert(walkaroundNotes).values({
    body:      String(body.body ?? ''),
    author:    (body.author as string | null) ?? null,
    createdAt: ts,
    updatedAt: ts,
  }).returning();
  return c.json({ ok: true, data: row }, 201);
});

app.patch('/walkaround/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Record<string, unknown>>();
  const db = createDb(c.env.DB);
  const patch: Record<string, unknown> = { ...body, updatedAt: now() };
  delete patch.id; delete patch.createdAt;
  const [row] = await db.update(walkaroundNotes).set(patch).where(eq(walkaroundNotes.id, id)).returning();
  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  return c.json({ ok: true, data: row });
});

app.delete('/walkaround/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = createDb(c.env.DB);
  await db.delete(walkaroundNotes).where(eq(walkaroundNotes.id, id));
  return c.json({ ok: true });
});

// ── Emails (read-only — written by cron Worker) ───────────────────────────────

app.get('/emails', async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db.select().from(emailThreads).orderBy(asc(emailThreads.lastMessageAt));
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
  const ts = now();
  await db
    .insert(settings)
    .values({ key, value, updatedAt: ts })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: ts } });
  return c.json({ ok: true, data: { key, value } });
});

// ── iCal feed ─────────────────────────────────────────────────────────────────

app.get('/ical', async (c) => {
  const db = createDb(c.env.DB);
  const slots = await db.select().from(timelineSlots).orderBy(asc(timelineSlots.sortOrder));

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function toIcalDt(date: string, time: string): string {
    const [y, m, d] = date.split('-');
    const [hh, mm] = time.split(':');
    return `${y}${m}${d}T${hh}${mm}00`;
  }

  const uidBase = 'monmouth-show-2026@bandstand';
  const n = new Date();
  const dtstamp = `${n.getUTCFullYear()}${pad(n.getUTCMonth() + 1)}${pad(n.getUTCDate())}T${pad(n.getUTCHours())}${pad(n.getUTCMinutes())}${pad(n.getUTCSeconds())}Z`;

  const events = slots.map((s) => {
    const summary = s.isGap ? `[GAP] ${s.gapReason ?? s.actName}` : s.actName;
    return [
      'BEGIN:VEVENT',
      `UID:${uidBase}-${s.id}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/London:${toIcalDt(s.date, s.startTime)}`,
      `DTEND;TZID=Europe/London:${toIcalDt(s.date, s.endTime)}`,
      `SUMMARY:${summary}`,
      ...(s.isGap ? ['DESCRIPTION:No music — livestock/animals on site'] : []),
      'END:VEVENT',
    ].join('\r\n');
  });

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Band Stand//Monmouthshire Show 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Monmouthshire Show 2026 — Band Stand',
    'X-WR-TIMEZONE:Europe/London',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="monmouth-show-2026.ics"',
    },
  });
});

// ── Fallbacks ─────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: 'Internal server error' }, 500);
});

export const onRequest = handle(app);
