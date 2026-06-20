import { sqliteTable, text, integer, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const viewerCheck = (col: string) =>
  sql.raw(`${col} IS NULL OR ${col} IN ('Dan','Jacob','Steph')`);

// Act lifecycle on the day: expected → arrived → setup → soundchecked → performing → done
const actStatusCheck = (col: string) =>
  sql.raw(`${col} IN ('expected','arrived','setup','soundchecked','performing','done')`);

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
  // Live day-of status
  status:         text('status').notNull().default('expected'),
  statusUpdatedAt: text('status_updated_at'),
  notes:          text('notes'),
  websiteUrl:     text('website_url'),
  createdAt:      text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:      text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy:      text('updated_by'),
}, () => [
  check('acts_updated_by_viewer', viewerCheck('updated_by')),
  check('acts_status_valid', actStatusCheck('status')),
]);

// ── Channels (BSB input list, one row per act per channel) ────────────────────
export const channels = sqliteTable('channels', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  actId:     integer('act_id').notNull().references(() => acts.id, { onDelete: 'cascade' }),
  channelNo: integer('channel_no').notNull().default(1),
  source:    text('source').notNull(),          // e.g. "Lead vocal", "Conductor mic", "Guitar"
  inputType: text('input_type'),                // e.g. "SM58", "DI", "Wireless", "Line"
  notes:     text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy: text('updated_by'),
}, () => [
  check('channels_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Timeline slots ────────────────────────────────────────────────────────────
export const timelineSlots = sqliteTable('timeline_slots', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  actId:             integer('act_id').references(() => acts.id, { onDelete: 'set null' }),
  actName:           text('act_name').notNull(),  // denormalised; updated when act name changes
  // Working (live-editable) times — what you adjust on the day
  startTime:         text('start_time').notNull(), // "HH:MM"
  endTime:           text('end_time').notNull(),   // "HH:MM"
  // Original plan — fixed reference so drift is visible
  plannedStartTime:  text('planned_start_time'),   // "HH:MM"
  plannedEndTime:    text('planned_end_time'),     // "HH:MM"
  // Live actuals
  actualStartTime:   text('actual_start_time'),    // ISO timestamp when act actually started
  finishedAt:        text('finished_at'),          // ISO timestamp when marked finished
  openEnded:         integer('open_ended', { mode: 'boolean' }).notNull().default(false),
  date:              text('date').notNull(),       // "yyyy-mm-dd"
  isGap:             integer('is_gap', { mode: 'boolean' }).notNull().default(false),
  gapReason:         text('gap_reason'),
  sortOrder:         integer('sort_order').notNull().default(0),
  updatedAt:         text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy:         text('updated_by'),
}, () => [
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
}, () => [
  check('tasks_assignee_viewer',   viewerCheck('assignee')),
  check('tasks_done_by_viewer',    viewerCheck('done_by')),
  check('tasks_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Chase list (outstanding info to collect, optionally tied to an act) ────────
export const chaseItems = sqliteTable('chase_items', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  actId:     integer('act_id').references(() => acts.id, { onDelete: 'cascade' }),
  label:     text('label').notNull(),  // e.g. "MTB phone number", "Ian MacIntyre email"
  done:      integer('done', { mode: 'boolean' }).notNull().default(false),
  doneAt:    text('done_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy: text('updated_by'),
}, () => [
  check('chase_items_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Contacts (non-act people: BSB, Steph, show office, first aid) ──────────────
export const contacts = sqliteTable('contacts', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  role:      text('role'),     // e.g. "PA / Sound", "Show Chair"
  org:       text('org'),      // e.g. "BSB"
  phone:     text('phone'),
  email:     text('email'),
  notes:     text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy: text('updated_by'),
}, () => [
  check('contacts_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Site locations (key points for a schematic map) ───────────────────────────
export const locations = sqliteTable('locations', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  category:  text('category').notNull().default('place'), // stage | facility | access | safety | place
  notes:     text('notes'),
  posX:      integer('pos_x'), // 0-100, position on schematic
  posY:      integer('pos_y'), // 0-100
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedBy: text('updated_by'),
}, () => [
  check('locations_category_valid', sql.raw("category IN ('stage','facility','access','safety','place')")),
  check('locations_updated_by_viewer', viewerCheck('updated_by')),
]);

// ── Walk-around notes (site walk log with BSB) ────────────────────────────────
export const walkaroundNotes = sqliteTable('walkaround_notes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  body:      text('body').notNull(),
  author:    text('author'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, () => [
  check('walkaround_notes_author_viewer', viewerCheck('author')),
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
