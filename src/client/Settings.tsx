import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, SectionTitle } from './ui.tsx';
import type { Viewer } from '../types.ts';

const VIEWERS: Viewer[] = ['Dan', 'Jacob', 'Steph'];
const PREVIEW_KEY = 'bandstand_preview_live';

function parseContacts(v: string | undefined): string[] {
  if (!v) return [];
  try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean); }
}

export function Settings() {
  const { db, viewer, setViewer, online, pending, lastSync, refresh, setSetting } = useStore();
  const [label, setLabel] = useState(db.settings.gmail_label ?? 'MonShow');
  const [contacts, setContacts] = useState(parseContacts(db.settings.gmail_contacts).join('\n'));
  const [preview, setPreview] = useState(localStorage.getItem(PREVIEW_KEY) === '1');
  const [syncing, setSyncing] = useState(false);

  function saveGmail() {
    setSetting('gmail_label', label.trim());
    const arr = contacts.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    setSetting('gmail_contacts', JSON.stringify(arr));
  }
  function togglePreview() {
    const next = !preview; setPreview(next);
    if (next) localStorage.setItem(PREVIEW_KEY, '1'); else localStorage.removeItem(PREVIEW_KEY);
  }
  async function syncNow() { setSyncing(true); await refresh(); setSyncing(false); }
  function resetLocal() {
    if (!confirm('Clear this device\'s local copy and reload? Unsynced offline changes will be lost.')) return;
    localStorage.removeItem('bandstand_cache_v1');
    localStorage.removeItem('bandstand_outbox_v1');
    location.reload();
  }

  return (
    <div className="page">
      <SectionTitle>Settings</SectionTitle>

      <section className="card">
        <div className="card-head"><h3>You</h3></div>
        <div className="seg">
          {VIEWERS.map((v) => (
            <button key={v} className={`seg-btn ${viewer === v ? 'on' : ''}`} onClick={() => setViewer(v)}>{v}</button>
          ))}
        </div>
        <p className="muted-sm">Edits are stamped with your name so the others can see who changed what.</p>
      </section>

      <section className="card">
        <div className="card-head"><h3>Sync</h3>
          <button className="link-btn" onClick={syncNow} disabled={syncing}><Icon name="refresh" size={14} /> {syncing ? 'Syncing…' : 'Sync now'}</button>
        </div>
        <div className="kv"><span>Connection</span><strong className={online ? 'ok' : 'bad'}>{online ? 'Online' : 'Offline'}</strong></div>
        <div className="kv"><span>Queued changes</span><strong>{pending}</strong></div>
        <div className="kv"><span>Last synced</span><strong>{lastSync ? new Date(lastSync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</strong></div>
        <p className="muted-sm">Everything works offline. Changes queue on your phone and merge when there's signal.</p>
      </section>

      <section className="card">
        <div className="card-head"><h3>Show-day preview</h3></div>
        <label className="switch-row">
          <span>Force the live show-day screen now</span>
          <button role="switch" aria-checked={preview} className={`toggle-btn ${preview ? 'on' : ''}`} onClick={togglePreview}><span className="toggle-thumb" /></button>
        </label>
        <p className="muted-sm">Only on your device — lets you test the day-of view before 16 August.</p>
      </section>

      <section className="card">
        <div className="card-head"><h3>Export</h3></div>
        <div className="btn-row">
          <button className="btn-secondary" onClick={() => window.print()}><Icon name="print" size={16} /> Print run-sheet</button>
          <a className="btn-secondary" href="/api/ical"><Icon name="calendar" size={16} /> Add to calendar</a>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3>Gmail sync</h3></div>
        <label className="form-label-text">Label applied to show threads</label>
        <input className="form-input-field" value={label} onChange={(e) => setLabel(e.target.value)} />
        <label className="form-label-text" style={{ marginTop: 10 }}>Also sync emails from (one per line)</label>
        <textarea className="form-input-field form-textarea" rows={5} value={contacts} onChange={(e) => setContacts(e.target.value)} />
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn-primary" onClick={saveGmail}>Save Gmail settings</button>
        </div>
        <p className="muted-sm">The background worker syncs matching threads every 15 minutes into the Emails tab.</p>
      </section>

      <section className="card">
        <div className="card-head"><h3>This device</h3></div>
        <button className="btn-danger-outline" onClick={resetLocal}><Icon name="refresh" size={15} /> Reset local copy</button>
      </section>

      <p className="app-foot">Band Stand · Monmouthshire Show 2026 · v1.0</p>
    </div>
  );
}
