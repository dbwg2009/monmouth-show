import { useState, useEffect, useCallback } from 'react';
import type { Task, Viewer } from '../types.ts';

interface Props {
  viewer: Viewer;
}

function IconCheckmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

type Group = { label: string; tasks: Task[] };

function groupTasks(tasks: Task[]): Group[] {
  const pre:   Task[] = [];
  const dayOf: Task[] = [];
  const post:  Task[] = [];

  for (const t of tasks) {
    if (!t.dueDate || t.dueDate < '2026-08-16') pre.push(t);
    else if (t.dueDate === '2026-08-16' && t.sortOrder < 300) dayOf.push(t);
    else post.push(t);
  }

  const groups: Group[] = [];
  if (pre.length)   groups.push({ label: 'Pre-show', tasks: pre });
  if (dayOf.length) groups.push({ label: 'Day of show',  tasks: dayOf });
  if (post.length)  groups.push({ label: 'Post-show', tasks: post });
  return groups;
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[(m ?? 1) - 1]} ${y}`;
}

export function Tasks({ viewer }: Props) {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/tasks');
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

    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, done: newDone, doneBy: newDone ? viewer : null, doneAt: newDone ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Viewer': viewer },
        body: JSON.stringify({ done: newDone }),
      });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error);
    } catch {
      // Revert on failure
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id ? { ...t, done: task.done, doneBy: task.doneBy, doneAt: task.doneAt } : t
        )
      );
    } finally {
      setToggling(s => {
        const next = new Set(s);
        next.delete(task.id);
        return next;
      });
    }
  }, [viewer, toggling]);

  if (loading) return <Spinner />;
  if (error)   return <div className="error-msg">⚠️ {error}</div>;

  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const groups = groupTasks(tasks);

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
        </div>
        <div className="tasks-progress-bar">
          <div className="tasks-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {groups.map(group => (
        <div key={group.label} className="task-group">
          <div className="task-group-title">{group.label}</div>
          <div className="task-group-cards">
            {group.tasks.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.done ? 'done' : ''}`}
                onClick={() => void toggle(task)}
                role="checkbox"
                aria-checked={task.done}
                tabIndex={0}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') void toggle(task); }}
              >
                <div className={`task-check ${task.done ? 'checked' : ''}`}>
                  {task.done && <IconCheckmark />}
                </div>
                <div className="task-body">
                  <div className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</div>
                  {task.description && !task.done && (
                    <div className="task-desc">{task.description}</div>
                  )}
                  <div className="task-meta">
                    {task.assignee && (
                      <span className={`task-assignee assignee-${task.assignee}`}>
                        {task.assignee}
                      </span>
                    )}
                    {task.dueDate && !task.done && (
                      <span className="task-due">{fmtDate(task.dueDate)}</span>
                    )}
                    {task.done && task.doneBy && (
                      <span className="task-done-by">✓ {task.doneBy}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
