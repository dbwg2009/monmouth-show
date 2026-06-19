// Shared types used across API (functions/) and client (src/client/)

export type Viewer = 'Dan' | 'Jacob' | 'Steph';

export interface Act {
  id: number;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactEmail2: string | null;
  needsPA: boolean;
  micCount: number;
  needsSeats: boolean;
  seatsNotes: string | null;
  powerSockets: string | null;
  setupMins: number;
  performerCount: string | null; // e.g. "60-80" or "4"
  feePence: number | null;
  confirmed: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: Viewer | null;
}

export interface TimelineSlot {
  id: number;
  actId: number | null;
  actName: string; // denormalised for display / gaps
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  date: string;      // "yyyy-mm-dd"
  isGap: boolean;
  gapReason: string | null;
  sortOrder: number;
  updatedAt: string;
  updatedBy: Viewer | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignee: Viewer | null;
  dueDate: string | null; // "yyyy-mm-dd"
  done: boolean;
  doneAt: string | null;
  doneBy: Viewer | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: Viewer | null;
}

export interface EmailThread {
  id: number;
  gmailThreadId: string;
  subject: string;
  participants: string; // JSON array of email addresses
  lastMessageAt: string;
  snippet: string | null;
  syncedAt: string;
}

export interface EmailMessage {
  id: number;
  threadId: number;
  gmailMessageId: string;
  fromAddr: string;
  toAddrs: string; // JSON array
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  sentAt: string;
}

export interface Settings {
  key: string;
  value: string;
  updatedAt: string;
}

// API response envelope
export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: string;
}
export type ApiResult<T> = ApiOk<T> | ApiErr;
