import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, StatusPill, STATUS_META, SectionTitle, telHref, smsHref, mailHref } from './ui.tsx';
import { ActNeeds } from './Home.tsx';
import { Drawer, Field, TextInput, TextArea, Toggle, DangerBtn } from './Drawer.tsx';
import type { Act, ActStatus, Channel } from '../types.ts';
import { ACT_STATUS_FLOW } from '../types.ts';

const nextStatus = (s: ActStatus): ActStatus => {
  const i = ACT_STATUS_FLOW.indexOf(s);
  return ACT_STATUS_FLOW[Math.min(i + 1, ACT_STATUS_FLOW.length - 1)]!;
};
const fmtFee = (p: number | null) => (p == null ? null : `£${(p / 100).toFixed(p % 100 ? 2 : 0)}`);

export function Acts() {
  const { db, viewer, patch, create } = useStore();
  const acts = [...db.acts].sort((a, b) => a.name.localeCompare(b.name));
  const [openId, setOpenId] = useState<number | null>(null);
  const open = acts.find((a) => a.id === openId) ?? null;

  function addAct() {
    create('acts', { name: 'New act', status: 'expected', confirmed: false, micCount: 0, needsPA: false, needsSeats: false, setupMins: 0, updatedBy: viewer });
  }

  return (
    <div className="page">
      <SectionTitle action={<button className="icon-pill primary" onClick={addAct} title="Add act"><Icon name="plus" size={16} /></button>}>Acts</SectionTitle>
      <p className="page-sub">Tap the status chip to advance it. Tap a card for tech, input list and contacts.</p>

      <div className="act-list">
        {acts.map((a) => (
          <div key={a.id} className="act-card" onClick={() => setOpenId(a.id)}>
            <div className="act-card-top">
              <div className="act-card-name">
                {a.name}
                {a.confirmed
                  ? <span className="confirm-tick" title="Confirmed"><Icon name="check" size={12} /></span>
                  : <span className="confirm-no" title="Not confirmed">unconfirmed</span>}
              </div>
              <button className="status-btn" onClick={(e) => { e.stopPropagation(); patch('acts', a.id, { status: nextStatus(a.status), updatedBy: viewer }); }} title="Tap to advance">
                <StatusPill status={a.status} />
              </button>
            </div>
            <div className="act-card-sub">
              {a.performerCount && <span>{a.performerCount} people</span>}
              {a.contactName && <span>· {a.contactName}</span>}
              {fmtFee(a.feePence) && <span>· {fmtFee(a.feePence)}</span>}
            </div>
            <ActNeeds act={a} compact />
          </div>
        ))}
      </div>

      <Drawer open={open !== null} onClose={() => setOpenId(null)} title={open?.name ?? ''}>
        {open && <ActDetail act={open} onClose={() => setOpenId(null)} />}
      </Drawer>
    </div>
  );
}

function ActDetail({ act, onClose }: { act: Act; onClose: () => void }) {
  const { viewer, patch, remove } = useStore();
  const [form, setForm] = useState({
    name: act.name,
    contactName: act.contactName ?? '',
    contactPhone: act.contactPhone ?? '',
    contactEmail: act.contactEmail ?? '',
    contactEmail2: act.contactEmail2 ?? '',
    performerCount: act.performerCount ?? '',
    micCount: String(act.micCount),
    powerSockets: act.powerSockets ?? '',
    seatsNotes: act.seatsNotes ?? '',
    setupMins: String(act.setupMins),
    feePence: act.feePence != null ? String(act.feePence / 100) : '',
    notes: act.notes ?? '',
    websiteUrl: act.websiteUrl ?? '',
    needsPA: act.needsPA,
    needsSeats: act.needsSeats,
    confirmed: act.confirmed,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    patch('acts', act.id, {
      name: form.name.trim() || act.name,
      contactName: form.contactName || null,
      contactPhone: form.contactPhone || null,
      contactEmail: form.contactEmail || null,
      contactEmail2: form.contactEmail2 || null,
      performerCount: form.performerCount || null,
      micCount: Number(form.micCount) || 0,
      powerSockets: form.powerSockets || null,
      seatsNotes: form.seatsNotes || null,
      setupMins: Number(form.setupMins) || 0,
      feePence: form.feePence ? Math.round(Number(form.feePence) * 100) : null,
      notes: form.notes || null,
      websiteUrl: form.websiteUrl || null,
      needsPA: form.needsPA,
      needsSeats: form.needsSeats,
      confirmed: form.confirmed,
      updatedBy: viewer,
    });
    onClose();
  }

  return (
    <div className="act-detail">
      <div className="status-stepper">
        {ACT_STATUS_FLOW.map((s) => (
          <button key={s} className={`step ${act.status === s ? 'on' : ''} ${ACT_STATUS_FLOW.indexOf(s) < ACT_STATUS_FLOW.indexOf(act.status) ? 'past' : ''}`}
            onClick={() => patch('acts', act.id, { status: s, updatedBy: viewer })}>
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      <div className="contact-actions">
        {act.contactPhone && <a className="ca-btn" href={telHref(act.contactPhone)}><Icon name="phone" size={16} /> Call</a>}
        {act.contactPhone && <a className="ca-btn" href={smsHref(act.contactPhone)}><Icon name="message" size={16} /> Text</a>}
        {act.contactEmail && <a className="ca-btn" href={mailHref(act.contactEmail)}><Icon name="mail" size={16} /> Email</a>}
      </div>

      <details className="acc" open>
        <summary>Contact</summary>
        <Field label="Contact name"><TextInput value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></Field>
        <Field label="Phone"><TextInput value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} inputMode="tel" /></Field>
        <Field label="Email"><TextInput value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} inputMode="email" /></Field>
        <Field label="Second email"><TextInput value={form.contactEmail2} onChange={(e) => set('contactEmail2', e.target.value)} inputMode="email" /></Field>
      </details>

      <details className="acc" open>
        <summary>Tech &amp; stage</summary>
        <Toggle checked={form.needsPA} onChange={(v) => set('needsPA', v)} label="Needs house PA" />
        <div className="grid-2">
          <Field label="Mics"><TextInput type="number" value={form.micCount} onChange={(e) => set('micCount', e.target.value)} /></Field>
          <Field label="Setup (min)"><TextInput type="number" value={form.setupMins} onChange={(e) => set('setupMins', e.target.value)} /></Field>
        </div>
        <Field label="Power sockets"><TextInput value={form.powerSockets} onChange={(e) => set('powerSockets', e.target.value)} placeholder="e.g. 2 sockets (mixer + laptop)" /></Field>
        <Toggle checked={form.needsSeats} onChange={(v) => set('needsSeats', v)} label="Needs seating" />
        {form.needsSeats && <Field label="Seating notes"><TextArea value={form.seatsNotes} onChange={(e) => set('seatsNotes', e.target.value)} /></Field>}
        <div className="grid-2">
          <Field label="People"><TextInput value={form.performerCount} onChange={(e) => set('performerCount', e.target.value)} placeholder="e.g. 40 or 60-80" /></Field>
          <Field label="Fee (£)"><TextInput value={form.feePence} onChange={(e) => set('feePence', e.target.value)} inputMode="decimal" placeholder="blank = none" /></Field>
        </div>
      </details>

      <details className="acc">
        <summary>Input list (for BSB)</summary>
        <ChannelsEditor act={act} />
      </details>

      <Field label="Notes"><TextArea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      <Field label="Website"><TextInput value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} inputMode="url" /></Field>
      <Toggle checked={form.confirmed} onChange={(v) => set('confirmed', v)} label="Booking confirmed" />

      <div className="detail-foot">
        <DangerBtn onClick={() => { if (confirm(`Delete ${act.name}?`)) { remove('acts', act.id); onClose(); } }}>Delete act</DangerBtn>
        <button className="btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

function ChannelsEditor({ act }: { act: Act }) {
  const { db, viewer, create, patch, remove } = useStore();
  const rows = db.channels.filter((c) => c.actId === act.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const [adding, setAdding] = useState({ source: '', inputType: '' });

  function add() {
    if (!adding.source.trim()) return;
    const maxNo = Math.max(0, ...rows.map((r) => r.channelNo));
    const maxOrder = Math.max(0, ...rows.map((r) => r.sortOrder));
    create('channels', { actId: act.id, channelNo: maxNo + 1, source: adding.source.trim(), inputType: adding.inputType || null, sortOrder: maxOrder + 10, updatedBy: viewer });
    setAdding({ source: '', inputType: '' });
  }

  return (
    <div className="channels">
      {rows.length === 0 && <p className="muted-sm">No channels yet. Build the patch list BSB will need.</p>}
      {rows.map((c) => (
        <ChannelRow key={`${c.id}:${c.updatedAt}`} ch={c} onPatch={(p) => patch('channels', c.id, { ...p, updatedBy: viewer })} onDelete={() => remove('channels', c.id)} />
      ))}
      <div className="channel-add">
        <span className="ch-no">{Math.max(0, ...rows.map((r) => r.channelNo)) + 1}</span>
        <input className="ch-in src" placeholder="Source (e.g. Lead vocal)" value={adding.source} onChange={(e) => setAdding((a) => ({ ...a, source: e.target.value }))} />
        <input className="ch-in typ" placeholder="SM58 / DI" value={adding.inputType} onChange={(e) => setAdding((a) => ({ ...a, inputType: e.target.value }))} />
        <button className="ch-add-btn" onClick={add}><Icon name="plus" size={15} /></button>
      </div>
    </div>
  );
}

function ChannelRow({ ch, onPatch, onDelete }: { ch: Channel; onPatch: (p: Partial<Channel>) => void; onDelete: () => void }) {
  const [src, setSrc] = useState(ch.source);
  const [typ, setTyp] = useState(ch.inputType ?? '');
  return (
    <div className="channel-row">
      <span className="ch-no">{ch.channelNo}</span>
      <input className="ch-in src" value={src} onChange={(e) => setSrc(e.target.value)} onBlur={() => src !== ch.source && onPatch({ source: src })} />
      <input className="ch-in typ" value={typ} onChange={(e) => setTyp(e.target.value)} onBlur={() => typ !== (ch.inputType ?? '') && onPatch({ inputType: typ || null })} />
      <button className="ch-del" onClick={onDelete} aria-label="Remove channel"><Icon name="x" size={14} /></button>
    </div>
  );
}
