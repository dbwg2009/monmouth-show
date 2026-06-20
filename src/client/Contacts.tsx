import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle, telHref, smsHref, mailHref } from './ui.tsx';
import { Drawer, Field, TextInput, TextArea, DangerBtn } from './Drawer.tsx';
import type { Contact } from '../types.ts';

export function Contacts() {
  const { db, viewer, create, patch, remove } = useStore();
  const people = [...db.contacts].sort((a, b) => a.sortOrder - b.sortOrder);
  const actContacts = db.acts.filter((a) => a.contactName || a.contactPhone || a.contactEmail);
  const [editId, setEditId] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const editing = people.find((p) => p.id === editId) ?? null;
  const [form, setForm] = useState<Partial<Contact>>({});

  function openNew() { setIsNew(true); setForm({ name: '', role: '', org: '', phone: '', email: '', notes: '' }); setEditId(-1); }
  function openEdit(c: Contact) { setIsNew(false); setForm(c); setEditId(c.id); }
  function save() {
    const body = { name: (form.name ?? '').trim() || 'Unnamed', role: form.role || null, org: form.org || null, phone: form.phone || null, email: form.email || null, notes: form.notes || null, updatedBy: viewer };
    if (isNew) create('contacts', { ...body, sortOrder: Math.max(0, ...people.map((p) => p.sortOrder)) + 10 });
    else if (editing) patch('contacts', editing.id, body);
    setEditId(null);
  }

  return (
    <div className="page">
      <SectionTitle action={<button className="icon-pill primary" onClick={openNew} title="Add contact"><Icon name="plus" size={16} /></button>}>Contacts</SectionTitle>

      <div className="sub-head">Key people</div>
      <div className="contact-list">
        {people.map((c) => (
          <div key={c.id} className="contact-row">
            <button className="contact-main" onClick={() => openEdit(c)}>
              <div className="contact-name">{c.name}</div>
              <div className="contact-role">{[c.role, c.org].filter(Boolean).join(' · ')}</div>
              {c.notes && <div className="contact-note">{c.notes}</div>}
            </button>
            <div className="contact-quick">
              {c.phone && <a href={telHref(c.phone)} aria-label="Call"><Icon name="phone" size={17} /></a>}
              {c.phone && <a href={smsHref(c.phone)} aria-label="Text"><Icon name="message" size={17} /></a>}
              {c.email && <a href={mailHref(c.email)} aria-label="Email"><Icon name="mail" size={17} /></a>}
            </div>
          </div>
        ))}
      </div>

      <div className="sub-head">Act contacts</div>
      <div className="contact-list">
        {actContacts.map((a) => (
          <div key={a.id} className="contact-row">
            <div className="contact-main">
              <div className="contact-name">{a.name}</div>
              <div className="contact-role">{a.contactName ?? ''}{a.contactPhone ? ` · ${a.contactPhone}` : ''}</div>
            </div>
            <div className="contact-quick">
              {a.contactPhone && <a href={telHref(a.contactPhone)} aria-label="Call"><Icon name="phone" size={17} /></a>}
              {a.contactPhone && <a href={smsHref(a.contactPhone)} aria-label="Text"><Icon name="message" size={17} /></a>}
              {a.contactEmail && <a href={mailHref(a.contactEmail)} aria-label="Email"><Icon name="mail" size={17} /></a>}
            </div>
          </div>
        ))}
      </div>

      <Drawer open={editId !== null} onClose={() => setEditId(null)} title={isNew ? 'Add contact' : form.name ?? 'Contact'}
        footer={
          <div className="drawer-footer-btns">
            {!isNew && editing && <DangerBtn onClick={() => { remove('contacts', editing.id); setEditId(null); }}>Delete</DangerBtn>}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn-secondary" onClick={() => setEditId(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        }>
        <Field label="Name"><TextInput value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <div className="grid-2">
          <Field label="Role"><TextInput value={form.role ?? ''} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="PA / Sound" /></Field>
          <Field label="Org"><TextInput value={form.org ?? ''} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))} placeholder="BSB" /></Field>
        </div>
        <Field label="Phone"><TextInput value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} inputMode="tel" /></Field>
        <Field label="Email"><TextInput value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} inputMode="email" /></Field>
        <Field label="Notes"><TextArea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
      </Drawer>
    </div>
  );
}
