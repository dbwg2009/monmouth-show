import { useState, useEffect, useCallback } from 'react';
import type { Task, Viewer } from '../types.ts';
import { Drawer, Field, TextInput, TextArea, Toggle, Select, FormSection, DangerBtn } from './Drawer.tsx';
import { SHOW_DATE, DAY_OF_SHOW_SORT_THRESHOLD } from './constants.ts';

interface Props { viewer: Viewer; }

function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

function fmtDate(d: string): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const [y, m, day] = d.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (!m || m < 1 || m > 12) return d;
  return `${day} ${months[m - 1]} ${y}`;
}

function isOverdue(t: Task, today: string): boolean {
  return !t.done && !!t.dueDate && t.dueDate < today;
}

type Group = { label: string; tasks: Task[]; overdue?: boolean };

function groupTasks(tasks: Task[], today: string, showDone: boolean): Group[] {
  const pre: Task[] = [], dayOf: Task[] = [], post: Task[] = [], done: Task[] = [];
  for (const t of tasks) {
    if (t.done) { done.push(t); continue; }
    if (!t.dueDate || t.dueDate < SHOW_DATE) pre.push(t);
    else if (t.dueDate === SHOW_DATE && t.sortOrder < DAY_OF_SHOW_SORT_THRESHOLD) dayOf.push(t);
    else post.push(t);
  }
  const groups: Group[] = [];
  if (pre.length)   groups.push({ label: 'Pre-show', tasks: pre });
  if (dayOf.length) groups.push({ label: 'Day of show', tasks: dayOf });
  if (post.length)  groups.push({ label: 'Post-show', tasks: post });
  if (showDone && done.length) groups.push({ label: `Done (${done.length})`, tasks: done });
  return groups;
}

interface EditState {
  title: string; description: string; assignee: string; dueDate: string;
}

function taskToEdit(t: Partial<Task>): EditState {
  return {
    title: t.title ?? '', description: t.description ?? '',
    assignee: t.assignee ?? '', dueDate: t.dueDate ?? '',
  };
}

export function Tasks({ viewer }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [showDone, setShowDone] = useState(false);

  // Edit drawer
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editState, setEditState] = useState<EditState>(taskToEdit({}));
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const json = await res.json() as { ok: boolean; data?: Task[]; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? 'Failed to load');
      setTasks(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = useCallback(async (task: Task) => {
    if (toggling.has(task.id)) return;
    setToggling(s => new Set(s).add(task.id));
    const newDone = !task.done;
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, done: newDone, doneBy: newDone ? viewer : null, doneAt: newDone ? new Date().toISOString() : null } : t
    ));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDone, doneBy: newDone ? viewer : null }),
      });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error);
    } catch {
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, done: task.done, doneBy: task.doneBy, doneAt: task.doneAt } : t
      ));
    } finally {
      setToggling(s => { const n = new Set(s); n.delete(task.id); return n; });
    }
  }, [viewer, toggling]);

  function openEdit(task: Task, e: React.MouseEvent) {
    e.stopPropagation();
    setIsNew(false);
    setEditTask(task);
    setEditState(taskToEdit(task));
    setSaveError(null);
  }

  function openNew() {
    setIsNew(true);
    setEditTask({ id: 0, title: '', description: null, assignee: null, dueDate: null, done: false, doneAt: null, doneBy: null, sortOrder: 999, createdAt: '', updatedAt: '', updatedBy: null });
    setEditState(taskToEdit({}));
    setSaveError(null);
  }

  async function saveTask() {
    if (!editState.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        title: editState.title,
        description: editState.description || null,
        assignee: editState.assignee || null,
        dueDate: editState.dueDate || null,
        updatedBy: viewer,
        sortOrder: isNew ? (tasks.length + 1) * 10 : editTask?.sortOrder,
      };
      const res = isNew
        ? await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/tasks/${editTask!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Save failed');
      setEditTask(null);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask() {
    if (!editTask || isNew) return;
    if (!confirm(`Delete task "${editTask.title}"?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/tasks/${editTask.id}`, { method: 'DELETE' });
      setEditTask(null);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <div className="error-msg">⚠️ {error}</div>;

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const groups = groupTasks(tasks, today, showDone);

  return (
    <div className="tasks-page">
      {/* Summary */}
      <div className="tasks-summary">
        <div className="tasks-summary-row">
          <div className="tasks-summary-stat">
            <span className="num">{done}</span>
            <span className="lbl">Done</span>
          </div>
          <div className="tasks-summary-stat">
            <span className="num">{total - done}</span>
            <span className="lbl">Remaining</span>
          </div>
          <div className="tasks-summary-stat">
            <span className="num">{pct}%</span>
            <span className="lbl">Complete</span>
          </div>
          <button
            className={`show-done-toggle ${showDone ? 'active' : ''}`}
            onClick={() => setShowDone(v => !v)}
          >
            {showDone ? 'Hide done' : 'Show done'}
          </button>
        </div>
        <div className="tasks-progress-bar">
          <div className="tasks-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <button className="add-btn" onClick={openNew}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Task
      </button>

      {groups.map(group => (
        <div key={group.label} className="task-group">
          <div className="task-group-title">{group.label}</div>
          <div className="task-group-cards">
            {group.tasks.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.done ? 'done' : ''} ${isOverdue(task, today) ? 'overdue' : ''}`}
              >
                <div
                  className={`task-check ${task.done ? 'checked' : ''}`}
                  onClick={() => void toggle(task)}
                  role="checkbox"
                  aria-checked={task.done}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') void toggle(task); }}
                >
                  {task.done && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="task-body" onClick={() => void toggle(task)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <div className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</div>
                  {task.description && !task.done && <div className="task-desc">{task.description}</div>}
                  <div className="task-meta">
                    {task.assignee && <span className={`task-assignee assignee-${task.assignee}`}>{task.assignee}</span>}
                    {task.dueDate && !task.done && (
                      <span className={`task-due ${isOverdue(task, today) ? 'overdue' : ''}`}>{fmtDate(task.dueDate)}</span>
                    )}
                    {task.done && task.doneBy && <span className="task-done-by">✓ {task.doneBy}</span>}
                  </div>
                </div>
                <button className="icon-btn icon-btn-sm" onClick={e => openEdit(task, e)} aria-label="Edit task">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Task edit drawer */}
      <Drawer
        open={editTask !== null}
        onClose={() => setEditTask(null)}
        title={isNew ? 'Add Task' : 'Edit Task'}
        footer={
          <div className="drawer-footer-btns">
            {!isNew && <DangerBtn onClick={deleteTask}>Delete</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEditTask(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => void saveTask()} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        {saveError && <div className="form-error">{saveError}</div>}
        <Field label="Title *">
          <TextInput value={editState.title} onChange={e => setEditState(s => ({ ...s, title: e.target.value }))} placeholder="Task title" autoFocus />
        </Field>
        <Field label="Description">
          <TextArea value={editState.description} onChange={e => setEditState(s => ({ ...s, description: e.target.value }))} placeholder="Optional details…" />
        </Field>
        <Field label="Assigned to">
          <Select value={editState.assignee} onChange={e => setEditState(s => ({ ...s, assignee: e.target.value }))}>
            <option value="">Anyone</option>
            <option value="Dan">Dan</option>
            <option value="Jacob">Jacob</option>
            <option value="Steph">Steph</option>
          </Select>
        </Field>
        <Field label="Due date">
          <TextInput type="date" value={editState.dueDate} onChange={e => setEditState(s => ({ ...s, dueDate: e.target.value }))} />
        </Field>
      </Drawer>
    </div>
  );
}
