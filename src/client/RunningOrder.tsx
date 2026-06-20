import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, useClock, SectionTitle } from './ui.tsx';
import { Drawer, Field, TextInput, Toggle, Select, DangerBtn } from './Drawer.tsx';
import type { TimelineSlot } from '../types.ts';
import { SHOW_DATE, fmtTime, toMins, fromMins, nowMins, fmtDrift } from './time.ts';

interface EditState {
  actId: string; actName: string; startTime: string; endTime: string;
  isGap: boolean; gapReason: string; openEnded: boolean;
}
const blank = (): EditState => ({ actId: '', actName: '', startTime: '10:00', endTime: '10:30', isGap: false, gapReason: '', openEnded: false });

export function RunningOrder() {
  const { db, viewer, create, patch, remove } = useStore();
  const now = useClock(15_000);
  const slots = [...db.timeline].sort((a, b) => a.sortOrder - b.sortOrder);

  const [edit, setEdit] = useState<TimelineSlot | null>(null);
  const [form, setForm] = useState<EditState>(blank());
  const [isNew, setIsNew] = useState(false);

  const pointerId = db.settings.live_current_slot_id ? Number(db.settings.live_current_slot_id) : null;
  const clock = nowMins(now);
  const currentId = pointerId ?? slots.find((s) => !s.finishedAt && clock >= toMins(s.startTime) && clock < toMins(s.endTime))?.id ?? null;

  function openEdit(s: TimelineSlot) {
    setIsNew(false); setEdit(s);
    setForm({ actId: s.actId ? String(s.actId) : '', actName: s.actName, startTime: s.startTime, endTime: s.endTime, isGap: s.isGap, gapReason: s.gapReason ?? '', openEnded: s.openEnded });
  }
  function openNew() {
    setIsNew(true);
    const last = slots[slots.length - 1];
    const start = last ? last.endTime : '10:00';
    setEdit({ id: 0 } as TimelineSlot);
    setForm({ ...blank(), startTime: start, endTime: fromMins(toMins(start) + 30) });
  }
  function save() {
    if (!form.actName.trim() && !form.isGap) return;
    const body = {
      actId: form.actId ? Number(form.actId) : null,
      actName: form.isGap ? (form.gapReason || 'Gap') : form.actName,
      startTime: form.startTime, endTime: form.endTime,
      isGap: form.isGap, gapReason: form.gapReason || null, openEnded: form.openEnded,
      updatedBy: viewer,
    };
    if (isNew) {
      const maxOrder = Math.max(0, ...slots.map((s) => s.sortOrder));
      create('timeline', { ...body, date: SHOW_DATE, plannedStartTime: form.startTime, plannedEndTime: form.endTime, sortOrder: maxOrder + 10 });
    } else if (edit) {
      patch('timeline', edit.id, body);
    }
    setEdit(null);
  }
  function onActSelect(id: string) {
    const a = db.acts.find((x) => String(x.id) === id);
    setForm((f) => ({ ...f, actId: id, actName: a?.name ?? f.actName }));
  }
  function resetToPlan() {
    if (!edit?.plannedStartTime) return;
    setForm((f) => ({ ...f, startTime: edit.plannedStartTime!, endTime: edit.plannedEndTime ?? f.endTime }));
  }
  function swap(i: number, j: number) {
    const a = slots[i], b = slots[j];
    if (!a || !b) return;
    patch('timeline', a.id, { sortOrder: b.sortOrder });
    patch('timeline', b.id, { sortOrder: a.sortOrder });
  }
  function pushFollowing(from: TimelineSlot, mins: number) {
    slots.filter((s) => s.sortOrder >= from.sortOrder && !s.finishedAt)
      .forEach((s) => patch('timeline', s.id, { startTime: fromMins(toMins(s.startTime) + mins), endTime: fromMins(toMins(s.endTime) + mins) }));
  }

  return (
    <div className="page">
      <SectionTitle action={
        <div className="title-actions">
          <a className="icon-pill" href="/api/ical" title="Add to calendar"><Icon name="calendar" size={16} /></a>
          <button className="icon-pill" onClick={() => window.print()} title="Print run-sheet"><Icon name="print" size={16} /></button>
          <button className="icon-pill primary" onClick={openNew} title="Add slot"><Icon name="plus" size={16} /></button>
        </div>
      }>Running order</SectionTitle>
      <p className="page-sub">Sunday 16 August · tap a slot to adjust. Original plan shown when times have moved.</p>

      <div className="order-list" id="run-sheet">
        {slots.map((s, i) => {
          const status = s.finishedAt ? 'done' : s.id === currentId ? 'now' : 'up';
          const moved = s.plannedStartTime && s.plannedStartTime !== s.startTime;
          const drift = s.plannedStartTime ? toMins(s.startTime) - toMins(s.plannedStartTime) : 0;
          const d = fmtDrift(drift);
          return (
            <div key={s.id} className={`order-row ${status} ${s.isGap ? 'gap' : ''}`}>
              <div className="order-rail">
                <button className="reorder" onClick={() => swap(i, i - 1)} disabled={i === 0} aria-label="Move up"><Icon name="chevronDown" size={14} className="flip" /></button>
                <span className={`order-dot ${status}`} />
                <button className="reorder" onClick={() => swap(i, i + 1)} disabled={i === slots.length - 1} aria-label="Move down"><Icon name="chevronDown" size={14} /></button>
              </div>
              <button className="order-main" onClick={() => openEdit(s)}>
                <div className="order-time">
                  <strong>{fmtTime(s.startTime)}</strong>
                  <span>{s.openEnded ? 'close' : fmtTime(s.endTime)}</span>
                </div>
                <div className="order-body">
                  <div className="order-name">{s.actName}{s.isGap && <Icon name="alert" size={14} className="gap-ico" />}</div>
                  <div className="order-meta">
                    {moved && <span className="planned-was">was {fmtTime(s.plannedStartTime)}</span>}
                    {moved && Math.abs(drift) >= 2 && <span className={`drift-pill sm drift-${d.tone}`}>{d.text}</span>}
                    {status === 'now' && <span className="row-tag now">ON NOW</span>}
                    {status === 'done' && <span className="row-tag done">done</span>}
                    {s.openEnded && <span className="row-tag open">open-ended</span>}
                  </div>
                </div>
                <Icon name="edit" size={15} className="order-edit" />
              </button>
            </div>
          );
        })}
      </div>

      <Drawer
        open={edit !== null}
        onClose={() => setEdit(null)}
        title={isNew ? 'Add slot' : form.actName || 'Edit slot'}
        footer={
          <div className="drawer-footer-btns">
            {!isNew && edit && edit.id > 0 && <DangerBtn onClick={() => { remove('timeline', edit.id); setEdit(null); }}>Delete</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        }
      >
        <Toggle checked={form.isGap} onChange={(v) => setForm((f) => ({ ...f, isGap: v }))} label="Gap / music blackout" />
        {!form.isGap && (
          <Field label="Act">
            <Select value={form.actId} onChange={(e) => onActSelect(e.target.value)}>
              <option value="">— Custom / no act —</option>
              {db.acts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label={form.isGap ? 'Reason' : 'Display name'}>
          <TextInput value={form.isGap ? form.gapReason : form.actName}
            onChange={(e) => setForm((f) => f.isGap ? { ...f, gapReason: e.target.value } : { ...f, actName: e.target.value })}
            placeholder={form.isGap ? 'e.g. Livestock parade' : 'Act name'} />
        </Field>
        <div className="grid-2">
          <Field label="Start"><TextInput type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} /></Field>
          <Field label="End"><TextInput type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} disabled={form.openEnded} /></Field>
        </div>
        {!form.isGap && <Toggle checked={form.openEnded} onChange={(v) => setForm((f) => ({ ...f, openEnded: v }))} label="Open-ended (plays to close)" />}

        {!isNew && edit?.plannedStartTime && (edit.plannedStartTime !== form.startTime || edit.plannedEndTime !== form.endTime) && (
          <div className="plan-reset">
            <span>Original plan: {fmtTime(edit.plannedStartTime)}–{fmtTime(edit.plannedEndTime)}</span>
            <button className="link-btn" onClick={resetToPlan}>Reset to plan</button>
          </div>
        )}

        {!isNew && edit && edit.id > 0 && (
          <div className="running-late">
            <div className="rl-label"><Icon name="clock" size={15} /> Running late? Push this & later acts</div>
            <div className="rl-btns">
              {[5, 10, 15].map((m) => <button key={m} className="rl-btn" onClick={() => pushFollowing(edit, m)}>+{m} min</button>)}
              <button className="rl-btn neg" onClick={() => pushFollowing(edit, -5)}>−5 min</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
