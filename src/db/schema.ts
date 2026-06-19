import { sqliteTable, text, integer, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const VIEWER_CHECK = sql`IS NULL OR value IN ('Dan','Jacob','Steph')`;
const viewerCheck = (col: string) =>
  sql.raw(`${col} IS NULL OR ${col} IN ('Dan','Jacob','Steph')`);

// ── Acts ─────────────────────────────────────────────────────────────────────
export const acts = sqliteTable('acts', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  name:           text('name').notNull(),
  contactName:    text('contact_name'),
  contactEmail:   text('contact_email'),
  contactEmail2:  text('contact_email_2'),
  contactPhone:   text('contact_phone'),
  needsPA:        integer('needs_pa', { mode: 'boolean' }).notNull().default(false),
  micCount:       integer('mic_count').notNull().default(0),
  needsSeats:     integer('needs_seats', { mode: 'boolean' }).notNull().default(false),
  seatsNotes:     text('seats_notes'),
  powerSockets:   text('power_sockets'),
  setupMins:      integer('setup_mins').notNull().default(0),
  performerCount: text('performer_count'), // "60-80" or "4"
  feePence:       integer('fee_pence'),    // GBP pence, null = no fee / TBC
  confirmed:      integer('confirmed', { mode: 'boolean' }).notNull().default(false),
  notes:          text('notes'),
  websiteUrl:     text('website_url'),
  createdAt:      text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:      text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy:      text('updated_by'),
}, (t) => [
  check('acts_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Timeline slots ────────────────────────────────────────────────────────────
export const timelineSlots = sqliteTable('timeline_slots', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  actId:      integer('act_id').references(() => acts.id, { onDelete: 'set null' }),
  actName:    text('act_name').notNull(),  // denormalised; updated when act name changes
  startTime:  text('start_time').notNull(), // "HH:MM"
  endTime:    text('end_time').notNull(),   // "HH:MM"
  date:       text('date').notNull(),       // "yyyy-mm-dd"
  isGap:      integer('is_gap', { mode: 'boolean' }).notNull().default(false),
  gapReason:  text('gap_reason'),
  sortOrder:  integer('sort_order').notNull().default(0),
  updatedAt:  text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy:  text('updated_by'),
}, (t) => [
  check('timeline_slots_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = sqliteTable('tasks', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  title:       text('title').notNull(),
  description: text('description'),
  assignee:    text('assignee'),       // 'Dan' | 'Jacob' | 'Steph' | null
  dueDate:     text('due_date'),       // "yyyy-mm-dd"
  done:        integer('done', { mode: 'boolean' }).notNull().default(false),
  doneAt:      text('done_at'),
  doneBy:      text('done_by'),
  sortOrder:   integer('sort_order').notNull().default(0),
  createdAt:   text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:   text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy:   text('updated_by'),
}, (t) => [
  check('tasks_assignee_viewer',   viewerCheck('assignee')),
  check('tasks_done_by_viewer',    viewerCheck('done_by')),
  check('tasks_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Gmail threads (synced by cron Worker) ────────────────────────────────────
export const emailThreads = sqliteTable('email_threads', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  gmailThreadId: text('gmail_thread_id').notNull().unique(),
  subject:       text('subject').notNull(),
  participants:  text('participants').notNull(), // JSON string[]
  lastMessageAt: text('last_message_at').notNull(),
  snippet:       text('snippet'),
  syncedAt:      text('synced_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ── Gmail messages ────────────────────────────────────────────────────────────
export const emailMessages = sqliteTable('email_messages', {
  id:             integer('id').primaryKey({ autoIncrement: true }),
  threadId:       integer('thread_id').notNull().references(() => emailThreads.id, { onDelete: 'cascade' }),
  gmailMessageId: text('gmail_message_id').notNull().unique(),
  fromAddr:       text('from_addr').notNull(),
  toAddrs:        text('to_addrs').notNull(), // JSON string[]
  subject:        text('subject').notNull(),
  bodyHtml:       text('body_html'),
  bodyText:       text('body_text'),
  sentAt:         text('sent_at').notNull(),
});

// ── Settings (key-value) ──────────────────────────────────────────────────────
export const settings = sqliteTable('settings', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
