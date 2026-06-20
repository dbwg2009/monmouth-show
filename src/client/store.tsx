import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type {
  Act, Channel, TimelineSlot, Task, ChaseItem, Contact, SiteLocation,
  WalkaroundNote, EmailThread, Viewer,
} from '../types.ts';

// ── Shape of everything the app holds ────────────────────────────────────────
export interface DbState {
  acts: Act[];
  channels: Channel[];
  timeline: TimelineSlot[];
  tasks: Task[];
  chaseItems: ChaseItem[];
  contacts: Contact[];
  locations: SiteLocation[];
  walkaroundNotes: WalkaroundNote[];
  emails: EmailThread[];
  settings: Record<string, string>;
}

const EMPTY: DbState = {
  acts: [], channels: [], timeline: [], tasks: [], chaseItems: [],
  contacts: [], locations: [], walkaroundNotes: [], emails: [], settings: {},
};

type ListKey = 'acts' | 'channels' | 'timeline' | 'tasks' | 'chaseItems'
  | 'contacts' | 'locations' | 'walkaroundNotes';

const PATHS: Record<ListKey, string> = {
  acts: '/api/acts',
  channels: '/api/channels',
  timeline: '/api/timeline',
  tasks: '/api/tasks',
  chaseItems: '/api/chase',
  contacts: '/api/contacts',
  locations: '/api/locations',
  walkaroundNotes: '/api/walkaround',
};

type Method = 'POST' | 'PATCH' | 'DELETE';
interface OutboxItem { uid: string; method: Method; path: string; body?: unknown; }

const CACHE_KEY = 'bandstand_cache_v1';
const OUTBOX_KEY = 'bandstand_outbox_v1';
const VIEWER_KEY = 'bandstand_viewer';

function loadCache(): DbState {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return EMPTY;
}
function saveCache(s: DbState) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* quota */ }
}
function loadOutbox(): OutboxItem[] {
  try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]'); } catch { return []; }
}
function saveOutbox(o: OutboxItem[]) {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(o)); } catch { /* quota */ }
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const nowIso = () => new Date().toISOString();

// ── Context ──────────────────────────────────────────────────────────────────
export interface Store {
  db: DbState;
  ready: boolean;
  online: boolean;
  pending: number;          // queued mutations not yet sent
  lastSync: string | null;
  viewer: Viewer | null;
  setViewer: (v: Viewer | null) => void;
  refresh: () => Promise<void>;
  // generic mutations (optimistic + queued)
  create: <T extends { id: number }>(key: ListKey, body: Record<string, unknown>) => void;
  patch: (key: ListKey, id: number, patch: Record<string, unknown>) => void;
  remove: (key: ListKey, id: number) => void;
  setSetting: (k: string, v: string) => void;
  startSlot: (id: number) => void;
  finishSlot: (id: number) => void;
}

const Ctx = createContext<Store | null>(null);
export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used within <DataProvider>');
  return s;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DbState>(() => loadCache());
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState<boolean>(() => navigator.onLine);
  const [pending, setPending] = useState<number>(() => loadOutbox().length);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [viewer, setViewerState] = useState<Viewer | null>(() => {
    const v = localStorage.getItem(VIEWER_KEY);
    return v === 'Dan' || v === 'Jacob' || v === 'Steph' ? v : null;
  });

  const dbRef = useRef(db);
  const flushing = useRef(false);
  useEffect(() => { dbRef.current = db; }, [db]);

  const applyState = useCallback((next: DbState) => {
    dbRef.current = next;
    setDb(next);
    saveCache(next);
  }, []);

  const setViewer = useCallback((v: Viewer | null) => {
    if (v) localStorage.setItem(VIEWER_KEY, v);
    else localStorage.removeItem(VIEWER_KEY);
    setViewerState(v);
  }, []);

  // ── Reconcile from server ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    // Don't overwrite un-synced optimistic edits with server state.
    if (loadOutbox().length > 0) { setReady(true); return; }
    try {
      const res = await fetch('/api/bootstrap', { cache: 'no-store' });
      const json = await res.json() as { ok: boolean; data?: DbState };
      if (json.ok && json.data) {
        applyState({ ...EMPTY, ...json.data });
        setLastSync(nowIso());
      }
    } catch {
      // offline — keep cache
    } finally {
      setReady(true);
    }
  }, [applyState]);

  // ── Outbox flush ───────────────────────────────────────────────────────────
  const flush = useCallback(async () => {
    if (flushing.current || !navigator.onLine) return;
    if (loadOutbox().length === 0) return;
    flushing.current = true;
    try {
      let working = loadOutbox();
      while (working.length > 0) {
        const item = working[0]!;
        try {
          const init: RequestInit = { method: item.method };
          if (item.body !== undefined) {
            init.headers = { 'Content-Type': 'application/json' };
            init.body = JSON.stringify(item.body);
          }
          const res = await fetch(item.path, init);
          // Transient server errors (5xx / rate limit): stop and retry later so
          // we don't silently drop unsynced changes.
          if (!res.ok && (res.status >= 500 || res.status === 429)) break;
          // Success, or a permanent 4xx a retry won't fix: drop this item.
          // Re-read the outbox first so items enqueued during the await aren't
          // clobbered by a stale snapshot.
          const remaining = loadOutbox().filter((q) => q.uid !== item.uid);
          saveOutbox(remaining);
          setPending(remaining.length);
          working = remaining;
        } catch {
          // network error — stop, retry later
          break;
        }
      }
      if (loadOutbox().length === 0) {
        await refresh();
      }
    } finally {
      flushing.current = false;
    }
  }, [refresh]);

  const enqueue = useCallback((method: Method, path: string, body?: unknown) => {
    const queue = loadOutbox();
    queue.push({ uid: uid(), method, path, body });
    saveOutbox(queue);
    setPending(queue.length);
    void flush();
  }, [flush]);

  // ── Generic optimistic mutations ───────────────────────────────────────────
  const create = useCallback((key: ListKey, body: Record<string, unknown>) => {
    const tempId = -Date.now();
    const optimistic = {
      id: tempId,
      ...body,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    } as unknown;
    const cur = dbRef.current;
    applyState({ ...cur, [key]: [...(cur[key] as unknown[]), optimistic] } as DbState);
    enqueue('POST', PATHS[key], body);
  }, [applyState, enqueue]);

  const patch = useCallback((key: ListKey, id: number, p: Record<string, unknown>) => {
    const cur = dbRef.current;
    const list = (cur[key] as Array<{ id: number }>).map((it) =>
      it.id === id ? { ...it, ...p, updatedAt: nowIso() } : it);
    applyState({ ...cur, [key]: list } as DbState);
    if (id > 0) enqueue('PATCH', `${PATHS[key]}/${id}`, p);
  }, [applyState, enqueue]);

  const remove = useCallback((key: ListKey, id: number) => {
    const cur = dbRef.current;
    const list = (cur[key] as Array<{ id: number }>).filter((it) => it.id !== id);
    applyState({ ...cur, [key]: list } as DbState);
    if (id > 0) enqueue('DELETE', `${PATHS[key]}/${id}`);
  }, [applyState, enqueue]);

  const setSetting = useCallback((k: string, v: string) => {
    const cur = dbRef.current;
    applyState({ ...cur, settings: { ...cur.settings, [k]: v } });
    enqueue('PATCH', `/api/settings/${encodeURIComponent(k)}`, { value: v });
  }, [applyState, enqueue]);

  const startSlot = useCallback((id: number) => {
    const cur = dbRef.current;
    const prevId = cur.settings.live_current_slot_id ? Number(cur.settings.live_current_slot_id) : null;
    const ts = nowIso();
    const timeline = cur.timeline.map((s) => {
      if (s.id === id) return { ...s, actualStartTime: ts, finishedAt: null };
      if (prevId && s.id === prevId) return { ...s, finishedAt: ts };
      return s;
    });
    applyState({ ...cur, timeline, settings: { ...cur.settings, live_current_slot_id: String(id) } });
    if (id > 0) enqueue('POST', `/api/timeline/${id}/start`, { updatedBy: viewer });
  }, [applyState, enqueue, viewer]);

  const finishSlot = useCallback((id: number) => {
    const cur = dbRef.current;
    const ts = nowIso();
    const timeline = cur.timeline.map((s) => (s.id === id ? { ...s, finishedAt: ts } : s));
    applyState({ ...cur, timeline, settings: { ...cur.settings, live_current_slot_id: '' } });
    if (id > 0) enqueue('POST', `/api/timeline/${id}/finish`, {});
  }, [applyState, enqueue]);

  // ── Lifecycle: initial load, online listeners, periodic sync ───────────────
  useEffect(() => {
    void refresh();
    void flush();
    const onOnline = () => { setOnline(true); void flush(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const poll = window.setInterval(() => {
      if (navigator.onLine) { void flush(); if (loadOutbox().length === 0) void refresh(); }
    }, 30_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(poll);
    };
  }, [refresh, flush]);

  const store: Store = {
    db, ready, online, pending, lastSync, viewer, setViewer,
    refresh, create, patch, remove, setSetting, startSlot, finishSlot,
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

// Re-export so components can pull the type without a second import line.
export type { Act, Channel, TimelineSlot, Task, ChaseItem, Contact, SiteLocation, WalkaroundNote, EmailThread, Viewer };
