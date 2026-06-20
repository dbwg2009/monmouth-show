import { useRef, useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle } from './ui.tsx';
import { Drawer, Field, TextInput, TextArea, Select, DangerBtn } from './Drawer.tsx';
import type { SiteLocation, LocationCategory } from '../types.ts';

const CATS: { id: LocationCategory; label: string }[] = [
  { id: 'stage', label: 'Stage' },
  { id: 'facility', label: 'Facility' },
  { id: 'access', label: 'Access' },
  { id: 'safety', label: 'Safety' },
  { id: 'place', label: 'Place' },
];

export function SiteMap() {
  const { db, viewer, create, patch, remove } = useStore();
  const locs = [...db.locations].sort((a, b) => a.sortOrder - b.sortOrder);
  const mapRef = useRef<HTMLDivElement>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<SiteLocation>>({});
  const editing = locs.find((l) => l.id === editId) ?? null;
  const sel = locs.find((l) => l.id === selId) ?? null;

  function onMapTap(e: React.MouseEvent) {
    if (!placing || selId == null || !mapRef.current) return;
    const r = mapRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    patch('locations', selId, { posX: Math.max(2, Math.min(98, x)), posY: Math.max(2, Math.min(98, y)), updatedBy: viewer });
    setPlacing(false);
  }

  function addNew() {
    setForm({ name: '', category: 'place', notes: '' });
    setEditId(-1);
  }
  function saveForm() {
    const body = { name: (form.name ?? '').trim() || 'New point', category: form.category ?? 'place', notes: form.notes || null, updatedBy: viewer };
    if (editing) patch('locations', editing.id, body);
    else create('locations', { ...body, posX: 50, posY: 50, sortOrder: Math.max(0, ...locs.map((l) => l.sortOrder)) + 10 });
    setEditId(null);
  }

  return (
    <div className="page">
      <SectionTitle action={<button className="icon-pill primary" onClick={addNew} title="Add location"><Icon name="plus" size={16} /></button>}>Site map</SectionTitle>
      <p className="page-sub">Approximate layout near the Band Stand. {placing ? <strong>Tap the map to place “{sel?.name}”.</strong> : 'Tap a pin for details.'}</p>

      <div className={`sitemap ${placing ? 'placing' : ''}`} ref={mapRef} onClick={onMapTap}>
        <div className="sitemap-grass" />
        {locs.filter((l) => l.posX != null && l.posY != null).map((l) => (
          <button key={l.id} className={`map-pin cat-${l.category} ${selId === l.id ? 'sel' : ''}`}
            style={{ left: `${l.posX}%`, top: `${l.posY}%` }}
            onClick={(e) => { e.stopPropagation(); setSelId(l.id); }}>
            <Icon name={l.category === 'stage' ? 'music' : l.category === 'safety' ? 'alert' : 'pin'} size={15} />
            <span className="pin-label">{l.name}</span>
          </button>
        ))}
      </div>

      {sel && (
        <div className="map-detail">
          <div className="map-detail-head">
            <div><strong>{sel.name}</strong><span className={`cat-tag cat-${sel.category}`}>{sel.category}</span></div>
            <button className="row-del" onClick={() => setSelId(null)}><Icon name="x" size={16} /></button>
          </div>
          {sel.notes && <p className="map-notes">{sel.notes}</p>}
          <div className="map-detail-actions">
            <button className="btn-secondary sm" onClick={() => setPlacing(true)}><Icon name="pin" size={14} /> Move</button>
            <button className="btn-secondary sm" onClick={() => { setForm(sel); setEditId(sel.id); }}><Icon name="edit" size={14} /> Edit</button>
          </div>
        </div>
      )}

      <div className="loc-list">
        {locs.map((l) => (
          <button key={l.id} className="loc-row" onClick={() => setSelId(l.id)}>
            <span className={`loc-dot cat-${l.category}`} />
            <span className="loc-name">{l.name}</span>
            {l.notes && <span className="loc-note">{l.notes}</span>}
          </button>
        ))}
      </div>

      <Drawer open={editId !== null} onClose={() => setEditId(null)} title={editing ? 'Edit location' : 'Add location'}
        footer={
          <div className="drawer-footer-btns">
            {editing && <DangerBtn onClick={() => { remove('locations', editing.id); setEditId(null); setSelId(null); }}>Delete</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEditId(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveForm}>Save</button>
            </div>
          </div>
        }>
        <Field label="Name"><TextInput value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Category">
          <Select value={form.category ?? 'place'} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as LocationCategory }))}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Notes"><TextArea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
      </Drawer>
    </div>
  );
}
