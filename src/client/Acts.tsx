import { useState, useEffect, useCallback } from 'react';
import type { Act, TimelineSlot, Viewer } from '../types.ts';
import { Drawer, Field, TextInput, TextArea, Toggle, Select, FormSection, DangerBtn } from './Drawer.tsx';

interface Props { viewer: Viewer; }

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

function fmt(pence: number): string { return `£${(pence / 100).toFixed(2).replace('.00', '')}`; }
function fmtTime(t: string): string { const [h, m] = t.split(':'); return `${h}:${m}`; }

interface ArrivalData { expected: string; arrived: boolean; }

interface ActWithSlots extends Act { slots: TimelineSlot[]; }

const EMPTY_ACT: Omit<Act, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'> = {
  name: '', contactName: '', contactEmail: '', contactEmail2: '', contactPhone: '',
  needsPA: true, micCount: 0, needsSeats: false, seatsNotes: '', powerSockets: '',
  setupMins: 0, performerCount: '', feePence: null, confirmed: false, notes: '', websiteUrl: '',
};

interface EditState {
  name: string; contactName: string; contactEmail: string; contactEmail2: string;
  contactPhone: string; needsPA: boolean; micCount: number; needsSeats: boolean;
  seatsNotes: string; powerSockets: string; setupMins: number; performerCount: string;
  feePence: string; confirmed: boolean; notes: string; websiteUrl: string;
}

function actToEdit(a: Partial<Act>): EditState {
  return {
    name: a.name ?? '', contactName: a.contactName ?? '', contactEmail: a.contactEmail ?? '',
    contactEmail2: a.contactEmail2 ?? '', contactPhone: a.contactPhone ?? '',
    needsPA: a.needsPA ?? true, micCount: a.micCount ?? 0, needsSeats: a.needsSeats ?? false,
    seatsNotes: a.seatsNotes ?? '', powerSockets: a.powerSockets ?? '',
    setupMins: a.setupMins ?? 0, performerCount: a.performerCount ?? '',
    feePence: a.feePence != null ? String(a.feePence / 100) : '',
    confirmed: a.confirmed ?? false, notes: a.notes ?? '', websiteUrl: a.websiteUrl ?? '',
  };
}

function editToBody(e: EditState, viewer: Viewer): Record<string, unknown> {
  return {
    name: e.name, contactName: e.contactName || null, contactEmail: e.contactEmail || null,
    contactEmail2: e.contactEmail2 || null, contactPhone: e.contactPhone || null,
    needsPA: e.needsPA, micCount: Number(e.micCount), needsSeats: e.needsSeats,
    seatsNotes: e.seatsNotes || null, powerSockets: e.powerSockets || null,
    setupMins: Number(e.setupMins), performerCount: e.performerCount || null,
    feePence: e.feePence ? Math.round(parseFloat(e.feePence) * 100) : null,
    confirmed: e.confirmed, notes: e.notes || null, websiteUrl: e.websiteUrl || null,
    updatedBy: viewer,
  };
}

export function Acts({ viewer }: Props) {
  const [acts, setActs] = useState<ActWithSlots[]>([]);
  const [arrivals, setArrivals] = useState<Record<string, ArrivalData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit drawer
  const [editAct, setEditAct] = useState<ActWithSlots | null>(null);
  const [editState, setEditState] = useState<EditState>(actToEdit(EMPTY_ACT));
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Arrival drawer
  const [arrivalAct, setArrivalAct] = useState<ActWithSlots | null>(null);
  const [arrivalEdit, setArrivalEdit] = useState<ArrivalData>({ expected: '', arrived: false });
  const [savingArrival, setSavingArrival] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [actsRes, slotsRes, settingsRes] = await Promise.all([
        fetch('/api/acts'),
        fetch('/api/timeline'),
        fetch('/api/settings'),
      ]);
      const actsJson = await actsRes.json() as { ok: boolean; data?: Act[]; error?: string };
      const slotsJson = await slotsRes.json() as { ok: boolean; data?: TimelineSlot[]; error?: string };
      const settingsJson = await settingsRes.json() as { ok: boolean; data?: Record<string, string> };

      if (!actsJson.ok || !actsJson.data) throw new Error(actsJson.error ?? 'Failed to load acts');
      if (!slotsJson.ok || !slotsJson.data) throw new Error(slotsJson.error ?? 'Failed to load timeline');

      const slotsByAct = new Map<number, TimelineSlot[]>();
      for (const s of slotsJson.data) {
        if (s.actId !== null) {
          const arr = slotsByAct.get(s.actId) ?? [];
          arr.push(s);
          slotsByAct.set(s.actId, arr);
        }
      }
      setActs(actsJson.data.map(a => ({ ...a, slots: slotsByAct.get(a.id) ?? [] })));

      // Load arrivals from settings
      const settings = settingsJson.data ?? {};
      const arrMap: Record<string, ArrivalData> = {};
      for (const [k, v] of Object.entries(settings)) {
        if (k.startsWith('arrival_')) {
          try { arrMap[k] = JSON.parse(v); } catch {}
        }
      }
      setArrivals(arrMap);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Deduplicate acts
  const seen = new Set<number>();
  const unique = acts.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  function openEdit(act: ActWithSlots) {
    setIsNew(false);
    setEditAct(act);
    setEditState(actToEdit(act));
    setSaveError(null);
  }

  function openNew() {
    setIsNew(true);
    setEditAct({ ...EMPTY_ACT, id: 0, createdAt: '', updatedAt: '', updatedBy: null, slots: [] });
    setEditState(actToEdit(EMPTY_ACT));
    setSaveError(null);
  }

  async function saveAct() {
    if (!editState.name.trim()) { setSaveError('Name is required'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const body = editToBody(editState, viewer);
      const res = isNew
        ? await fetch('/api/acts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/acts/${editAct!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Save failed');
      setEditAct(null);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAct() {
    if (!editAct || isNew) return;
    if (!confirm(`Delete "${editAct.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/acts/${editAct.id}`, { method: 'DELETE' });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Delete failed');
      setEditAct(null);
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  function openArrival(act: ActWithSlots) {
    setArrivalAct(act);
    const key = `arrival_${act.id}`;
    setArrivalEdit(arrivals[key] ?? { expected: '', arrived: false });
    setArrivalError(null);
  }

  async function saveArrival() {
    if (!arrivalAct) return;
    setSavingArrival(true);
    setArrivalError(null);
    try {
      const key = `arrival_${arrivalAct.id}`;
      const value = JSON.stringify(arrivalEdit);
      const res = await fetch(`/api/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const json = await res.json() as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? 'Save failed');
      setArrivals(prev => ({ ...prev, [key]: arrivalEdit }));
      setArrivalAct(null);
    } catch (e) {
      setArrivalError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingArrival(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <div className="error-msg">⚠️ {error}</div>;

  return (
    <div className="acts-page">
      {/* Add new act button */}
      <button className="add-btn" onClick={openNew}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Act
      </button>

      {unique.map(act => {
        const uniqueSlots = act.slots.filter((s, i, arr) =>
          arr.findIndex(s2 => s2.startTime === s.startTime) === i
        );
        const arrKey = `arrival_${act.id}`;
        const arrival = arrivals[arrKey];

        return (
          <div key={act.id} className="act-card">
            <div className="act-card-header">
              <div className="act-card-left">
                <div className="act-card-name">{act.name}</div>
                {uniqueSlots.length > 0 && (
                  <div className="act-slot-time">
                    {uniqueSlots.map(s => `${fmtTime(s.startTime)}–${fmtTime(s.endTime)}`).join(' · ')}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span className={`badge ${act.confirmed ? 'badge-green' : 'badge-amber'}`}>
                  {act.confirmed ? '✓ Confirmed' : 'Unconfirmed'}
                </span>
                <button className="icon-btn" onClick={() => openEdit(act)} aria-label="Edit act">
                  <IconEdit />
                </button>
              </div>
            </div>

            {/* Arrival tracking */}
            <button className={`arrival-row ${arrival?.arrived ? 'arrived' : ''}`} onClick={() => openArrival(act)}>
              <span className={`arrival-dot ${arrival?.arrived ? 'on' : ''}`} />
              <span className="arrival-label">
                {arrival?.arrived
                  ? 'Arrived ✓'
                  : arrival?.expected
                    ? `Expected ${arrival.expected}`
                    : 'Set arrival time'}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} style={{ width: 14, height: 14, opacity: 0.4, marginLeft: 'auto' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Tech */}
            <div className="act-tech">
              {act.needsPA
                ? <span className="tech-chip">🔊 House PA</span>
                : <span className="tech-chip">🔊 Own PA</span>}
              {act.micCount > 0 && <span className="tech-chip">🎤 {act.micCount} mic{act.micCount > 1 ? 's' : ''}</span>}
              {act.needsSeats && <span className="tech-chip">🪑 Seating{act.seatsNotes ? ` (${act.seatsNotes})` : ''}</span>}
              {act.powerSockets && <span className="tech-chip">⚡ {act.powerSockets}</span>}
              {act.performerCount && <span className="tech-chip">👥 {act.performerCount} performers</span>}
              {act.setupMins > 0 && <span className="tech-chip">⏱ {act.setupMins} min setup</span>}
            </div>

            {/* Contacts */}
            {(act.contactName || act.contactEmail || act.contactPhone) && (
              <div className="act-contacts">
                {act.contactName && (
                  <div className="contact-row">
                    <span className="contact-name">{act.contactName}</span>
                    {act.contactPhone && (
                      <a href={`tel:${act.contactPhone.replace(/\s/g, '')}`} className="contact-btn btn-phone" aria-label={`Call ${act.contactName}`}>
                        <IconPhone />
                      </a>
                    )}
                    {act.contactEmail && (
                      <a href={`mailto:${act.contactEmail}`} className="contact-btn btn-email" aria-label={`Email ${act.contactName}`}>
                        <IconMail />
                      </a>
                    )}
                  </div>
                )}
                {act.contactEmail2 && (
                  <div className="contact-row">
                    <span className="contact-name" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{act.contactEmail2}</span>
                    <a href={`mailto:${act.contactEmail2}`} className="contact-btn btn-email"><IconMail /></a>
                  </div>
                )}
              </div>
            )}

            {act.notes && <div className="act-notes">{act.notes}</div>}

            {(act.feePence !== null || act.websiteUrl) && (
              <div className="act-footer">
                <div>
                  {act.feePence !== null
                    ? <><div className="act-fee-amount">{fmt(act.feePence)}</div><div className="act-fee-label">Agreed fee</div></>
                    : <div className="act-fee-label" style={{ fontStyle: 'italic' }}>No fee</div>}
                </div>
                {act.websiteUrl && (
                  <a href={act.websiteUrl} target="_blank" rel="noopener noreferrer" className="contact-btn btn-web"
                    style={{ width: 'auto', padding: '0 12px', gap: 6, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600 }}>
                    <IconGlobe />Website
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Act edit/create drawer */}
      <Drawer
        open={editAct !== null}
        onClose={() => setEditAct(null)}
        title={isNew ? 'Add Act' : `Edit: ${editAct?.name}`}
        footer={
          <div className="drawer-footer-btns">
            {!isNew && <DangerBtn onClick={deleteAct}>Delete Act</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEditAct(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => void saveAct()} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        {saveError && <div className="form-error">{saveError}</div>}
        <FormSection title="Act Details" />
        <Field label="Act name *">
          <TextInput value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Rock Choir" />
        </Field>
        <Toggle checked={editState.confirmed} onChange={v => setEditState(s => ({ ...s, confirmed: v }))} label="Confirmed" />
        <Field label="Performers">
          <TextInput value={editState.performerCount} onChange={e => setEditState(s => ({ ...s, performerCount: e.target.value }))} placeholder="e.g. 12 or 60-80" />
        </Field>
        <Field label="Fee (£)">
          <TextInput type="number" step="0.01" min="0" value={editState.feePence} onChange={e => setEditState(s => ({ ...s, feePence: e.target.value }))} placeholder="0.00" />
        </Field>

        <FormSection title="Primary Contact" />
        <Field label="Contact name">
          <TextInput value={editState.contactName} onChange={e => setEditState(s => ({ ...s, contactName: e.target.value }))} placeholder="Name" />
        </Field>
        <Field label="Phone">
          <TextInput type="tel" value={editState.contactPhone} onChange={e => setEditState(s => ({ ...s, contactPhone: e.target.value }))} placeholder="07xxx xxxxxx" />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={editState.contactEmail} onChange={e => setEditState(s => ({ ...s, contactEmail: e.target.value }))} placeholder="name@example.com" />
        </Field>
        <Field label="Second email">
          <TextInput type="email" value={editState.contactEmail2} onChange={e => setEditState(s => ({ ...s, contactEmail2: e.target.value }))} placeholder="backup@example.com" />
        </Field>
        <Field label="Website">
          <TextInput type="url" value={editState.websiteUrl} onChange={e => setEditState(s => ({ ...s, websiteUrl: e.target.value }))} placeholder="https://…" />
        </Field>

        <FormSection title="Technical Requirements" />
        <Toggle checked={editState.needsPA} onChange={v => setEditState(s => ({ ...s, needsPA: v }))} label="Needs house PA" />
        <Field label="Microphones">
          <TextInput type="number" min="0" value={editState.micCount} onChange={e => setEditState(s => ({ ...s, micCount: Number(e.target.value) }))} />
        </Field>
        <Toggle checked={editState.needsSeats} onChange={v => setEditState(s => ({ ...s, needsSeats: v }))} label="Needs seating" />
        {editState.needsSeats && (
          <Field label="Seating notes">
            <TextInput value={editState.seatsNotes} onChange={e => setEditState(s => ({ ...s, seatsNotes: e.target.value }))} placeholder="e.g. 80 chairs" />
          </Field>
        )}
        <Field label="Power sockets">
          <TextInput value={editState.powerSockets} onChange={e => setEditState(s => ({ ...s, powerSockets: e.target.value }))} placeholder="e.g. 2 × 13A" />
        </Field>
        <Field label="Setup time (minutes)">
          <TextInput type="number" min="0" value={editState.setupMins} onChange={e => setEditState(s => ({ ...s, setupMins: Number(e.target.value) }))} />
        </Field>

        <FormSection title="Notes" />
        <Field label="Internal notes">
          <TextArea value={editState.notes} onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))} placeholder="Anything the team should know…" />
        </Field>
      </Drawer>

      {/* Arrival drawer */}
      <Drawer
        open={arrivalAct !== null}
        onClose={() => setArrivalAct(null)}
        title={`Arrival: ${arrivalAct?.name}`}
        footer={
          <div className="drawer-footer-btns">
            <button className="btn-secondary" onClick={() => setArrivalAct(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => void saveArrival()} disabled={savingArrival}>
              {savingArrival ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <Field label="Expected arrival time">
          <TextInput type="time" value={arrivalEdit.expected} onChange={e => setArrivalEdit(s => ({ ...s, expected: e.target.value }))} />
        </Field>
        <Toggle checked={arrivalEdit.arrived} onChange={v => setArrivalEdit(s => ({ ...s, arrived: v }))} label="Has arrived on site" />
        {arrivalError && <div className="form-error">⚠️ {arrivalError}</div>}
      </Drawer>
    </div>
  );
}
