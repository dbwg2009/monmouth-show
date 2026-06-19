import { useState, useEffect, useCallback } from 'react';
import type { Act, TimelineSlot, Viewer } from '../types.ts';
import { Drawer, Field, TextInput, Toggle, Select, FormSection, DangerBtn } from './Drawer.tsx';

interface Props { viewer: Viewer; }

const SHOW_DATE = '2026-08-16';
const SHOW_YEAR = 2026;
const SHOW_MONTH = 7;
const SHOW_DAY = 16;

function slotToMs(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number);
  return new Date(date + 'T00:00:00').getTime() + (h! * 60 + m!) * 60_000;
}

function durationMins(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh! * 60 + em!) - (sh! * 60 + sm!);
}

function fmtTime(time: string): string { const [h, m] = time.split(':'); return `${h}:${m}`; }

function fmtCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

function pad(n: number): string { return String(n).padStart(2, '0'); }

function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

interface SlotWithStatus extends TimelineSlot {
  status: 'done' | 'current' | 'between' | 'next' | 'future';
  progressPct?: number;
}

function classifySlots(slots: TimelineSlot[], now: Date): SlotWithStatus[] {
  const nowMs = now.getTime();
  return slots.map((s, i) => {
    const startMs = slotToMs(s.date, s.startTime);
    const endMs = slotToMs(s.date, s.endTime);
    if (nowMs >= endMs) return { ...s, status: 'done' as const };
    if (nowMs >= startMs && nowMs < endMs) {
      return { ...s, status: 'current' as const, progressPct: Math.round(((nowMs - startMs) / (endMs - startMs)) * 100) };
    }
    const prevSlot = slots[i - 1];
    if (prevSlot) {
      const prevEndMs = slotToMs(prevSlot.date, prevSlot.endTime);
      if (nowMs >= prevEndMs && nowMs < startMs) return { ...s, status: 'between' as const };
    }
    const hasCurrent = slots.some(sl => { const s2 = slotToMs(sl.date, sl.startTime), e2 = slotToMs(sl.date, sl.endTime); return nowMs >= s2 && nowMs < e2; });
    const hasBetween = slots.some((sl, j) => {
      const prev = slots[j - 1];
      if (!prev) return false;
      return nowMs >= slotToMs(prev.date, prev.endTime) && nowMs < slotToMs(sl.date, sl.startTime);
    });
    if (i === slots.findIndex(sl => slotToMs(sl.date, sl.startTime) > nowMs)) return { ...s, status: 'next' as const };
    if ((hasCurrent || hasBetween) && i === slots.findIndex(sl => slotToMs(sl.date, sl.startTime) > nowMs)) return { ...s, status: 'next' as const };
    return { ...s, status: 'future' as const };
  });
}

interface EditState {
  actId: string; actName: string; startTime: string; endTime: string;
  date: string; isGap: boolean; gapReason: string; sortOrder: string;
}

function slotToEdit(s: Partial<TimelineSlot>): EditState {
  return {
    actId: s.actId != null ? String(s.actId) : '',
    actName: s.actName ?? '',
    startTime: s.startTime ?? '',
    endTime: s.endTime ?? '',
    date: s.date ?? SHOW_DATE,
    isGap: s.isGap ?? false,
    gapReason: s.gapReason ?? '',
    sortOrder: s.sortOrder != null ? String(s.sortOrder) : '0',
  };
}

export function Timeline({ viewer }: Props) {
  const [slots, setSlots] = useState<TimelineSlot[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const [editSlot, setEditSlot] = useState<TimelineSlot | null>(null);
  const [editState, setEditState] = useState<EditState>(slotToEdit({}));
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [sRes, aRes] = await Promise.all([fetch('/api/timeline'), fetch('/api/acts')]);
      const sJson = await sRes.json() as { ok: boolean; data?: TimelineSlot[]; error?: string };
      const aJson = await aRes.json() as { ok: boolean; data?: Act[] };
      if (!sJson.ok || !sJson.data) throw new Error(sJson.error ?? 'Failed to load');
      setSlots(sJson.data.filter(s => s.date === SHOW_DATE));
      setActs(aJson.data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 10_000); return () => clearInterval(id); }, []);

  function openEdit(slot: TimelineSlot) {
    setIsNew(false);
    setEditSlot(slot);
    setEditState(slotToEdit(slot));
    setSaveError(null);
  }

  function openNew() {
    setIsNew(true);
    const maxOrder = Math.max(0, ...slots.map(s => s.sortOrder));
    setEditSlot({ id: 0, actId: null, actName: '', startTime: '10:00', endTime: '11:00', date: SHOW_DATE, isGap: false, gapReason: null, sortOrder: maxOrder + 10, updatedAt: '', updatedBy: null });
    setEditState(slotToEdit({ startTime: '10:00', endTime: '11:00', date: SHOW_DATE, sortOrder: maxOrder + 10 }));
    setSaveError(null);
  }

  async function saveSlot() {
    if (!editState.actName.trim() && !editState.isGap) { setSaveError('Act name or gap reason required'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        actId: editState.actId ? Number(editState.actId) : null,
        actName: editState.actName,
        startTime: editState.startTime,
        endTime: editState.endTime,
        date: editState.date,
        isGap: editState.isGap,
        gapReason: editState.gapReason || null,
        sortOrder: Number(editState.sortOrder),
        updatedBy: viewer,
      };
      const res = isNew
        ? await fetch('/api/timeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/timeline/${editSlot!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Save failed');
      setEditSlot(null);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot() {
    if (!editSlot || isNew) return;
    if (!confirm(`Delete "${editSlot.actName}" from the schedule?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/timeline/${editSlot.id}`, { method: 'DELETE' });
      setEditSlot(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  // When selecting an act from dropdown, auto-fill name
  function onActSelect(actId: string) {
    const act = acts.find(a => String(a.id) === actId);
    setEditState(s => ({ ...s, actId, actName: act?.name ?? s.actName }));
  }

  if (loading) return <Spinner />;
  if (error) return <div className="error-msg">⚠️ {error}</div>;

  const showStart = new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY, 10, 0, 0);
  const showEnd = new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY, 18, 0, 0);
  const isShowDay = now >= new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY, 0, 0, 0) && now < new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY + 1, 0, 0, 0);
  const isAfter = now > showEnd;
  const isBefore = now < showStart;
  const classified = classifySlots(slots, now);
  const current = classified.find(s => s.status === 'current');
  const between = classified.find(s => s.status === 'between');
  const nextActual = classified.find(s => s.status === 'next');
  const msToShow = showStart.getTime() - now.getTime();
  const countdown = fmtCountdown(msToShow);

  return (
    <div className="timeline-page">
      {isBefore && (
        <div className="countdown-banner">
          <div className="countdown-label">Until the show</div>
          <div className="countdown-units">
            {[{ n: countdown.days, l: 'days' }, { n: countdown.hours, l: 'hrs' }, { n: countdown.mins, l: 'min' }, { n: countdown.secs, l: 'sec' }].map(({ n, l }) => (
              <div key={l} className="countdown-unit">
                <span className="num">{l === 'days' ? n : pad(n)}</span>
                <span className="lbl">{l}</span>
              </div>
            ))}
          </div>
          <div className="countdown-date">Sunday 16 August 2026 · Monmouthshire Show</div>
        </div>
      )}

      {isShowDay && current && (
        <div className="now-card">
          <div className="now-label"><span className="now-dot" />On stage now</div>
          <div className="now-name">{current.actName}</div>
          <div className="now-time">{fmtTime(current.startTime)} – {fmtTime(current.endTime)} · {durationMins(current.startTime, current.endTime)} min</div>
          <div className="now-progress-track"><div className="now-progress-fill" style={{ width: `${current.progressPct ?? 0}%` }} /></div>
          <div className="now-progress-labels"><span>{fmtTime(current.startTime)}</span><span>{fmtTime(current.endTime)}</span></div>
        </div>
      )}

      {isShowDay && !current && between && (
        <div className="between-card" style={{ margin: '16px 16px 10px' }}>
          <div className="label">Break</div>
          <div className="name">Changeover</div>
          <div className="time">Next: {between.actName} at {fmtTime(between.startTime)}</div>
        </div>
      )}

      {isShowDay && current?.isGap && current.gapReason && (
        <div className="gap-card" style={{ margin: '0 16px 10px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" style={{ width: 18, height: 18, color: 'var(--red-500)', flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="gap-card-text">
            <strong>Music blackout</strong><span>{current.gapReason}</span>
          </div>
        </div>
      )}

      {isShowDay && nextActual && (
        <div className="next-card">
          <div className="next-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" style={{ width: 20, height: 20, color: 'var(--green-500)' }}>
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <div className="next-label">Up next</div>
            <div className="next-name">{nextActual.actName}</div>
            <div className="next-time">{fmtTime(nextActual.startTime)} – {fmtTime(nextActual.endTime)}</div>
          </div>
        </div>
      )}

      {isAfter && (
        <div className="after-show">
          <h2>🎉 Show complete</h2>
          <p>Thanks for a great day at the Monmouthshire Show!</p>
        </div>
      )}

      {/* Schedule */}
      <div className="schedule-section">
        <div className="schedule-header">
          <div className="schedule-section-title">Full schedule · Sunday 16 August</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline-sm" onClick={() => window.print()} title="Print run of day">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" style={{ width: 15, height: 15 }}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>
            <button className="btn-outline-sm" onClick={openNew}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 13, height: 13 }}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add slot
            </button>
          </div>
        </div>

        <div className="schedule-list">
          {classified.map(slot => {
            const dotClass = slot.status === 'done' ? 'done' : slot.status === 'current' ? 'current' : slot.isGap ? 'gap' : 'future';
            const nameClass = slot.status === 'current' ? 'current' : slot.status === 'done' ? 'done' : slot.isGap ? 'gap' : '';
            const itemClass = slot.status === 'current' ? 'current' : slot.status === 'done' ? 'done' : slot.isGap ? 'gap-item' : '';
            return (
              <div key={slot.id} className={`schedule-item ${itemClass}`}>
                <div className="schedule-time">{fmtTime(slot.startTime)}</div>
                <div className={`schedule-dot ${dotClass}`} />
                <div className={`schedule-name ${nameClass}`}>{slot.actName}</div>
                <div className="schedule-end">{fmtTime(slot.endTime)}</div>
                <button className="icon-btn icon-btn-sm schedule-edit-btn" onClick={() => openEdit(slot)} aria-label="Edit slot">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" style={{ width: 13, height: 13 }}>
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot edit drawer */}
      <Drawer
        open={editSlot !== null}
        onClose={() => setEditSlot(null)}
        title={isNew ? 'Add Schedule Slot' : 'Edit Slot'}
        footer={
          <div className="drawer-footer-btns">
            {!isNew && <DangerBtn onClick={deleteSlot}>Delete</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEditSlot(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => void saveSlot()} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        {saveError && <div className="form-error">{saveError}</div>}
        <Toggle checked={editState.isGap} onChange={v => setEditState(s => ({ ...s, isGap: v }))} label="This is a gap / music blackout" />

        {!editState.isGap && (
          <Field label="Act">
            <Select value={editState.actId} onChange={e => onActSelect(e.target.value)}>
              <option value="">— Custom / no act —</option>
              {acts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        )}

        <Field label={editState.isGap ? 'Gap reason' : 'Display name'}>
          <TextInput
            value={editState.isGap ? editState.gapReason : editState.actName}
            onChange={e => setEditState(s => editState.isGap ? { ...s, gapReason: e.target.value, actName: e.target.value || 'Gap' } : { ...s, actName: e.target.value })}
            placeholder={editState.isGap ? 'e.g. Livestock parade' : 'Act name shown in schedule'}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Start time">
            <TextInput type="time" value={editState.startTime} onChange={e => setEditState(s => ({ ...s, startTime: e.target.value }))} />
          </Field>
          <Field label="End time">
            <TextInput type="time" value={editState.endTime} onChange={e => setEditState(s => ({ ...s, endTime: e.target.value }))} />
          </Field>
        </div>

        <Field label="Date">
          <TextInput type="date" value={editState.date} onChange={e => setEditState(s => ({ ...s, date: e.target.value }))} />
        </Field>

        <Field label="Sort order" hint="Lower numbers appear first">
          <TextInput type="number" value={editState.sortOrder} onChange={e => setEditState(s => ({ ...s, sortOrder: e.target.value }))} />
        </Field>
      </Drawer>
    </div>
  );
}
