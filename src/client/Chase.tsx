import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle, Empty } from './ui.tsx';

export function Chase() {
  const { db, viewer, create, patch, remove } = useStore();
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [actId, setActId] = useState('');

  const items = [...db.chaseItems].sort((a, b) => a.sortOrder - b.sortOrder).filter((c) => showDone || !c.done);
  const groups = new Map<string, typeof items>();
  for (const it of items) {
    const act = db.acts.find((a) => a.id === it.actId);
    const key = act ? act.name : 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const openCount = db.chaseItems.filter((c) => !c.done).length;

  function add() {
    if (!label.trim()) return;
    create('chaseItems', { actId: actId ? Number(actId) : null, label: label.trim(), done: false, sortOrder: Math.max(0, ...db.chaseItems.map((c) => c.sortOrder)) + 10, updatedBy: viewer });
    setLabel(''); setActId(''); setAdding(false);
  }

  return (
    <div className="page">
      <SectionTitle action={<button className="icon-pill primary" onClick={() => setAdding((v) => !v)} title="Add item"><Icon name="plus" size={16} /></button>}>Chase list</SectionTitle>
      <p className="page-sub">{openCount} still to collect. <button className="link-btn" onClick={() => setShowDone((v) => !v)}>{showDone ? 'Hide done' : 'Show done'}</button></p>

      {adding && (
        <div className="add-box">
          <input className="add-input" placeholder="What needs chasing?" value={label} autoFocus onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <select className="add-select" value={actId} onChange={(e) => setActId(e.target.value)}>
            <option value="">General</option>
            {db.acts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button className="btn-primary sm" onClick={add}>Add</button>
        </div>
      )}

      {items.length === 0 ? <Empty icon="checkCircle">Nothing outstanding — all chased up.</Empty> : (
        [...groups.entries()].map(([group, list]) => (
          <div key={group} className="chase-group">
            <div className="sub-head">{group}</div>
            {list.map((c) => (
              <div key={c.id} className={`check-row ${c.done ? 'done' : ''}`}>
                <button className={`checkbox ${c.done ? 'on' : ''}`} onClick={() => patch('chaseItems', c.id, { done: !c.done })}>
                  {c.done && <Icon name="check" size={14} />}
                </button>
                <span className="check-label">{c.label}</span>
                <button className="row-del" onClick={() => remove('chaseItems', c.id)} aria-label="Delete"><Icon name="x" size={15} /></button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
