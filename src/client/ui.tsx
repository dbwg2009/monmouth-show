import { useEffect, useState } from 'react';
import type { ActStatus } from '../types.ts';

// ── Ticking clock ────────────────────────────────────────────────────────────
export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ── Contact link helpers ─────────────────────────────────────────────────────
export const telHref = (p?: string | null) => (p ? `tel:${p.replace(/\s+/g, '')}` : undefined);
export const smsHref = (p?: string | null) => (p ? `sms:${p.replace(/\s+/g, '')}` : undefined);
export const mailHref = (e?: string | null) => (e ? `mailto:${e}` : undefined);

// ── Icons ────────────────────────────────────────────────────────────────────
const PATHS: Record<string, React.ReactNode> = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0" /><path d="M12 18v3" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  more: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 6a3 3 0 010 6M21 20c0-2-1-3.5-3-4.5" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  edit: <><path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  message: <path d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2z" />,
  x: <><path d="M18 6L6 18M6 6l12 12" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  alert: <><path d="M10.3 4l-7 12A2 2 0 005 19h14a2 2 0 001.7-3l-7-12a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
  wifiOff: <><path d="M2 8l20 0M5 12a11 11 0 0114 0M8.5 15.5a6 6 0 017 0M12 19h.01" /><path d="M2 2l20 20" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  play: <path d="M7 5l12 7-12 7V5z" />,
  power: <><path d="M12 3v9" /><path d="M6 7a8 8 0 1012 0" /></>,
  seat: <><path d="M6 13V6a2 2 0 012-2h4a2 2 0 012 2v7M6 13h8M4 13h16v3a3 3 0 01-3 3H7a3 3 0 01-3-3v-3z" /></>,
  print: <><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M8 17h8v4H8z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
  refresh: <><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  pin: <><path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  note: <><path d="M5 3h11l4 4v14H5z" /><path d="M16 3v4h4M8 13h8M8 17h6" /></>,
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 00-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.3 2.5h4l.3-2.5a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5a7 7 0 00.1-1z" /></>,
};

export function Icon({ name, size = 22, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] ?? null}
    </svg>
  );
}

// ── Act status pill ──────────────────────────────────────────────────────────
export const STATUS_META: Record<ActStatus, { label: string; cls: string }> = {
  expected:     { label: 'Expected',     cls: 'st-expected' },
  arrived:      { label: 'Arrived',      cls: 'st-arrived' },
  setup:        { label: 'Setting up',   cls: 'st-setup' },
  soundchecked: { label: 'Soundchecked', cls: 'st-soundchecked' },
  performing:   { label: 'On stage',     cls: 'st-performing' },
  done:         { label: 'Done',         cls: 'st-done' },
};

export function StatusPill({ status }: { status: ActStatus }) {
  const m = STATUS_META[status];
  return <span className={`status-pill ${m.cls}`}>{m.label}</span>;
}

export function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

export function Empty({ icon = 'check', children }: { icon?: string; children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={30} />
      <p>{children}</p>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}
