import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle, Empty } from './ui.tsx';

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function Walkaround() {
  const { db, viewer, create, remove } = useStore();
  const [body, setBody] = useState('');
  const notes = [...db.walkaroundNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function add() {
    if (!body.trim()) return;
    create('walkaroundNotes', { body: body.trim(), author: viewer });
    setBody('');
  }

  return (
    <div className="page">
      <SectionTitle>Walk-around notes</SectionTitle>
      <p className="page-sub">Log what you spot on the field with BSB — power, access, the livestock gate, sight-lines.</p>

      <div className="note-compose">
        <textarea className="note-input" rows={3} placeholder="Add a note from the walk-around…" value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn-primary" onClick={add} disabled={!body.trim()}><Icon name="plus" size={16} /> Add note</button>
      </div>

      {notes.length === 0 ? <Empty icon="note">No walk-around notes yet.</Empty> : (
        <div className="note-list">
          {notes.map((n) => (
            <div key={n.id} className="note-card">
              <div className="note-body">{n.body}</div>
              <div className="note-foot">
                <span>{n.author ?? 'Someone'} · {fmtWhen(n.createdAt)}</span>
                <button className="row-del" onClick={() => remove('walkaroundNotes', n.id)} aria-label="Delete"><Icon name="x" size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
