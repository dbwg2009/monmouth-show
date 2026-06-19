import { useState, useEffect, useCallback } from 'react';
import type { EmailThread, EmailMessage } from '../types.ts';

function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtFullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function parseParticipants(json: string): string[] {
  try { return JSON.parse(json); } catch { return [json]; }
}

function stripEmail(addr: string): string {
  const m = addr.match(/^(.+?)\s*<.+>$/);
  return m ? m[1]!.trim() : addr;
}

function ThreadRow({ thread, onOpen }: { thread: EmailThread; onOpen: () => void }) {
  const participants = parseParticipants(thread.participants);
  const names = participants.slice(0, 3).map(stripEmail).join(', ');

  return (
    <button className="email-thread-row" onClick={onOpen}>
      <div className="email-thread-avatar">
        {(participants[0] ? stripEmail(participants[0]) : '?')[0]?.toUpperCase()}
      </div>
      <div className="email-thread-body">
        <div className="email-thread-top">
          <span className="email-thread-from">{names}</span>
          <span className="email-thread-time">{fmtDate(thread.lastMessageAt)}</span>
        </div>
        <div className="email-thread-subject">{thread.subject}</div>
        {thread.snippet && <div className="email-thread-snippet">{thread.snippet}</div>}
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, color: 'var(--text-light)', flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function MessageCard({ msg }: { msg: EmailMessage }) {
  const [expanded, setExpanded] = useState(true);
  const body = msg.bodyText || msg.bodyHtml?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '(no body)';

  return (
    <div className="email-message-card">
      <button className="email-msg-header" onClick={() => setExpanded(v => !v)}>
        <div className="email-msg-avatar">{(stripEmail(msg.fromAddr)[0] ?? '?').toUpperCase()}</div>
        <div className="email-msg-meta">
          <div className="email-msg-from">{stripEmail(msg.fromAddr)}</div>
          <div className="email-msg-date">{fmtFullDate(msg.sentAt)}</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {expanded && (
        <div className="email-msg-body">{body}</div>
      )}
    </div>
  );
}

interface ThreadDetailProps {
  thread: EmailThread;
  onBack: () => void;
}

function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/emails/${thread.id}`)
      .then(r => r.json() as Promise<{ ok: boolean; data?: { thread: EmailThread; messages: EmailMessage[] }; error?: string }>)
      .then(json => {
        if (!json.ok || !json.data) throw new Error(json.error ?? 'Failed to load');
        setMessages(json.data.messages);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [thread.id]);

  return (
    <div className="email-detail">
      <button className="email-back-btn" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 18, height: 18 }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All emails
      </button>
      <h2 className="email-detail-subject">{thread.subject}</h2>
      {loading && <Spinner />}
      {error && <div className="error-msg">⚠️ {error}</div>}
      {messages.map(msg => <MessageCard key={msg.id} msg={msg} />)}
    </div>
  );
}

export function Emails() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<EmailThread | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/emails');
      const json = await res.json() as { ok: boolean; data?: EmailThread[]; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? 'Failed to load');
      setThreads(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Spinner />;
  if (error) return <div className="error-msg">⚠️ {error}</div>;

  if (open) return <ThreadDetail thread={open} onBack={() => setOpen(null)} />;

  return (
    <div className="emails-page">
      <div className="emails-header">
        <h2 className="page-heading">Emails</h2>
        <span className="emails-count">{threads.length} thread{threads.length !== 1 ? 's' : ''}</span>
      </div>
      {threads.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-state-icon">📬</div>
          <p className="empty-state-text">No emails synced yet.</p>
          <p className="empty-state-sub">The Gmail sync runs every 15 minutes. Make sure the cron Worker is deployed and Gmail credentials are configured.</p>
        </div>
      ) : (
        <div className="email-thread-list">
          {threads.map(t => <ThreadRow key={t.id} thread={t} onOpen={() => setOpen(t)} />)}
        </div>
      )}
    </div>
  );
}
