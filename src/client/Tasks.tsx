import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle, Empty } from './ui.tsx';
import { Drawer, Field, TextInput, TextArea, Select, DangerBtn } from './Drawer.tsx';
import type { Task, Viewer } from '../types.ts';
import { SHOW_DATE } from './time.ts';

const VIEWERS: Viewer[] = ['Dan', 'Jacob', 'Steph'];

function bucketOf(t: Task): 'before' | 'day' | 'after' {
  if (!t.dueDate) return 'before';
  if (t.dueDate < SHOW_DATE) return 'before';
  if (t.dueDate === SHOW_DATE) return 'day';
  return 'after';
}
const BUCKETS: { id: 'before' | 'day' | 'after'; label: string }[] = [
  { id: 'before', label: 'Before the show' },
  { id: 'day', label: 'Show day' },
  { id: 'after', label: 'After' },
];

export function Tasks() {
  const { db, viewer, create, patch, remove } = useStore();
  const [filter, setFilter] = useState<'all' | Viewer>('all');
  const [edit, setEdit] = useState<Task | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Task>>({});

  const tasks = [...db.tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((t) => filter === 'all' || t.assignee === filter);

  function openNew() { setIsNew(true); setForm({ title: '', description: '', assignee: viewer, dueDate: SHOW_DATE }); setEdit({ id: 0 } as Task); }
  function openEdit(t: Task) { setIsNew(false); setForm(t); setEdit(t); }
  function save() {
    if (!form.title?.trim()) return;
    const body = { title: form.title.trim(), description: form.description || null, assignee: form.assignee || null, dueDate: form.dueDate || null, updatedBy: viewer };
    if (isNew) create('tasks', { ...body, done: false, sortOrder: Math.max(0, ...db.tasks.map((t) => t.sortOrder)) + 10 });
    else if (edit) patch('tasks', edit.id, body);
    setEdit(null);
  }

  const remaining = db.tasks.filter((t) => !t.done).length;

  return (
    <div className="page">
      <SectionTitle action={<button className="icon-pill primary" onClick={openNew} title="Add task"><Icon name="plus" size={16} /></button>}>Tasks</SectionTitle>
      <p className="page-sub">{remaining} still to do</p>

      <div className="chips">
        <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>All</button>
        {VIEWERS.map((v) => <button key={v} className={`chip ${filter === v ? 'on' : ''}`} onClick={() => setFilter(v)}>{v}</button>)}
      </div>

      {tasks.length === 0 ? <Empty icon="checkCircle">No tasks here.</Empty> : BUCKETS.map((b) => {
        const list = tasks.filter((t) => bucketOf(t) === b.id);
        if (list.length === 0) return null;
        return (
          <div key={b.id} className="task-group">
            <div className="sub-head">{b.label}</div>
            {list.map((t) => (
              <div key={t.id} className={`check-row ${t.done ? 'done' : ''}`}>
                <button className={`checkbox ${t.done ? 'on' : ''}`} onClick={() => patch('tasks', t.id, { done: !t.done, doneBy: !t.done ? viewer : null })}>
                  {t.done && <Icon name="check" size={14} />}
                </button>
                <button className="check-main" onClick={() => openEdit(t)}>
                  <span className="check-label">{t.title}</span>
                  <span className="check-meta">
                    {t.assignee && <span className={`who who-${t.assignee.toLowerCase()}`}>{t.assignee}</span>}
                    {t.dueDate && t.dueDate !== SHOW_DATE && <span className="due">{new Date(`${t.dueDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                  </span>
                </button>
              </div>
            ))}
          </div>
        );
      })}

      <Drawer open={edit !== null} onClose={() => setEdit(null)} title={isNew ? 'Add task' : 'Edit task'}
        footer={
          <div className="drawer-footer-btns">
            {!isNew && edit && edit.id > 0 && <DangerBtn onClick={() => { remove('tasks', edit.id); setEdit(null); }}>Delete</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        }>
        <Field label="Task"><TextInput value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        <Field label="Notes"><TextArea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <div className="grid-2">
          <Field label="Who">
            <Select value={form.assignee ?? ''} onChange={(e) => setForm((f) => ({ ...f, assignee: (e.target.value || null) as Viewer | null }))}>
              <option value="">Anyone</option>
              {VIEWERS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Due"><TextInput type="date" value={form.dueDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
        </div>
      </Drawer>
    </div>
  );
}
