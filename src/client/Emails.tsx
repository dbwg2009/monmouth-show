import { useEffect, useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle, Empty, Spinner } from './ui.tsx';
import { Drawer } from './Drawer.tsx';
import type { EmailThread, EmailMessage } from '../types.ts';
import { EMAIL_DRAFTS, gmailComposeUrl, type EmailDraft } from './planContent.ts';

const fmtWhen = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const parseList = (s: string): string[] => { try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch { return []; } };

function DraftCard({ draft }: { draft: EmailDraft }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(draft.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* clipboard blocked — Open in Gmail still works */ });
  }

  return (
    <details className="draft-card">
      <summary>
        <Icon name="mail" size={16} />
        <span>{draft.label}<span className="draft-to">To: {draft.toLabel}</span></span>
      </summary>
      <div className="draft-body-wrap">
        <div className="draft-field">Subject: {draft.subject}</div>
        <div className="draft-field">Cc: Steph, Jacob</div>
        <pre className="draft-pre">{draft.body}</pre>
        <div className="draft-actions">
          <a className="btn-primary sm" href={gmailComposeUrl(draft)} target="_blank" rel="noopener noreferrer">
            <Icon name="mail" size={15} /> Open in Gmail
          </a>
          <button className="btn-secondary sm" onClick={copy}>{copied ? 'Copied ✓' : 'Copy text'}</button>
        </div>
      </div>
    </details>
  );
}

export function Emails() {
  const { db, online, viewer } = useStore();
  const threads = db.emails;
  const [open, setOpen] = useState<EmailThread | null>(null);

  return (
    <div className="page">
      <SectionTitle>Emails</SectionTitle>
      <p className="page-sub">Show threads synced from Gmail{!online && ' · offline: showing last synced'}.</p>

      {viewer === 'Dan' && (
        <>
          <div className="sub-head">Drafts to send</div>
          <p className="muted-sm">Intro emails, ready to send — opens in Gmail pre-filled, cc'ing Steph &amp; Jacob.</p>
          <div className="draft-list">
            {EMAIL_DRAFTS.map((d) => <DraftCard key={d.id} draft={d} />)}
          </div>
          <div className="sub-head" style={{ marginTop: 18 }}>Synced threads</div>
        </>
      )}

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
    setLoading(true);
    setMessages(null);
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
