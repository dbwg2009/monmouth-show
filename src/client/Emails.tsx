import { useEffect, useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle, Empty, Spinner } from './ui.tsx';
import { Drawer } from './Drawer.tsx';
import type { EmailThread, EmailMessage } from '../types.ts';

const fmtWhen = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const parseList = (s: string): string[] => { try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch { return []; } };

export function Emails() {
  const { db, online } = useStore();
  const threads = db.emails;
  const [open, setOpen] = useState<EmailThread | null>(null);

  return (
    <div className="page">
      <SectionTitle>Emails</SectionTitle>
      <p className="page-sub">Show threads synced from Gmail{!online && ' · offline: showing last synced'}.</p>

      {threads.length === 0 ? <Empty icon="mail">No synced threads yet. Apply the “MonShow” label in Gmail, or wait for the next sync.</Empty> : (
        <div className="email-list">
          {threads.map((t) => (
            <button key={t.id} className="email-row" onClick={() => setOpen(t)}>
              <div className="email-subj">{t.subject}</div>
              <div className="email-snip">{t.snippet}</div>
              <div className="email-meta">{parseList(t.participants).slice(0, 3).join(', ')} · {fmtWhen(t.lastMessageAt)}</div>
            </button>
          ))}
        </div>
      )}

      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open?.subject ?? ''}>
        {open && <Thread thread={open} online={online} />}
      </Drawer>
    </div>
  );
}

function Thread({ thread, online }: { thread: EmailThread; online: boolean }) {
  const [messages, setMessages] = useState<EmailMessage[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/emails/${thread.id}`);
        const json = await res.json() as { ok: boolean; data?: { messages: EmailMessage[] } };
        if (alive && json.ok && json.data) setMessages(json.data.messages);
      } catch { /* offline */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [thread.id]);

  if (loading) return <Spinner />;
  if (!messages) {
    return (
      <div className="thread-offline">
        <Icon name="wifiOff" size={22} />
        <p>Need signal to load the full thread. Here's the latest snippet:</p>
        <blockquote>{thread.snippet}</blockquote>
      </div>
    );
  }
  return (
    <div className="thread">
      {messages.map((m) => (
        <div key={m.id} className="msg">
          <div className="msg-head"><strong>{m.fromAddr}</strong><span>{fmtWhen(m.sentAt)}</span></div>
          <div className="msg-body">{(m.bodyText ?? thread.snippet ?? '').slice(0, 4000)}</div>
        </div>
      ))}
      {!online && <p className="muted-sm">Showing cached copy — reconnect for the newest messages.</p>}
    </div>
  );
}
