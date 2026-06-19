import { useState, useEffect, useCallback, useRef } from 'react';
import { Field, TextInput } from './Drawer.tsx';

function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

export function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json() as { ok: boolean; data?: Record<string, string> };
      if (json.ok && json.data) setSettings(json.data);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Cancel any pending message-clear timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  }, []);

  async function save(key: string, value: string) {
    setSaving(key);
    try {
      await fetch(`/api/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      setSettings(s => ({ ...s, [key]: value }));
      setMsgs(m => ({ ...m, [key]: 'Saved ✓' }));
      const timer = setTimeout(() => {
        setMsgs(m => { const n = { ...m }; delete n[key]; return n; });
        timersRef.current.delete(key);
      }, 2000);
      timersRef.current.set(key, timer);
    } catch {
      setMsgs(m => ({ ...m, [key]: 'Failed' }));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="settings-page">
      <h2 className="page-heading">Settings</h2>

      <div className="settings-section">
        <div className="settings-section-title">Gmail Sync</div>
        <SettingRow
          label="Gmail label"
          hint="Gmail label the Worker filters on (e.g. show-2026)"
          value={settings['gmail_label'] ?? ''}
          saveKey="gmail_label"
          onSave={save}
          saving={saving}
          msg={msgs['gmail_label']}
        />
        <SettingRow
          label="Contact allowlist"
          hint="Comma-separated email addresses to watch"
          value={settings['contact_allowlist'] ?? ''}
          saveKey="contact_allowlist"
          onSave={save}
          saving={saving}
          msg={msgs['contact_allowlist']}
        />
        <div className="settings-info-row">
          <span>Last sync</span>
          <span>{settings['last_sync_at'] ? new Date(settings['last_sync_at']).toLocaleString('en-GB') : 'Never'}</span>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Show Details</div>
        <SettingRow
          label="Show title"
          value={settings['show_title'] ?? 'Monmouthshire Agricultural Show 2026'}
          saveKey="show_title"
          onSave={save}
          saving={saving}
          msg={msgs['show_title']}
        />
        <SettingRow
          label="Venue name"
          value={settings['venue_name'] ?? ''}
          saveKey="venue_name"
          onSave={save}
          saving={saving}
          msg={msgs['venue_name']}
          placeholder="e.g. Monmouth Showground"
        />
        <SettingRow
          label="What3words"
          value={settings['venue_w3w'] ?? ''}
          saveKey="venue_w3w"
          onSave={save}
          saving={saving}
          msg={msgs['venue_w3w']}
          placeholder="e.g. filled.count.soap"
        />
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Export & Links</div>
        <div className="settings-link-row">
          <span>iCal feed</span>
          <a href="/api/ical" download="monmouth-show-2026.ics" className="settings-link-btn">Download .ics</a>
        </div>
        <div className="settings-link-row">
          <span>Health check</span>
          <a href="/api/health" target="_blank" rel="noopener noreferrer" className="settings-link-btn">Check API</a>
        </div>
      </div>

      <div className="settings-section settings-section-danger">
        <div className="settings-section-title">About</div>
        <div className="settings-info-row">
          <span>App version</span>
          <span>ShowRunner 0.4.0</span>
        </div>
        <div className="settings-info-row">
          <span>Database</span>
          <span>Cloudflare D1</span>
        </div>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  hint?: string | undefined;
  value: string;
  saveKey: string;
  onSave: (key: string, value: string) => Promise<void>;
  saving: string | null;
  msg?: string | undefined;
  placeholder?: string | undefined;
}

function SettingRow({ label, hint, value, saveKey, onSave, saving, msg, placeholder }: SettingRowProps) {
  const [local, setLocal] = useState(value);
  const isDirty = local !== value;

  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="setting-row">
      <div className="setting-row-label-row">
        <label className="setting-row-label">{label}</label>
        {msg && <span className="setting-row-msg">{msg}</span>}
      </div>
      {hint && <p className="setting-row-hint">{hint}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <TextInput
          value={local}
          onChange={e => setLocal(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <button
          className={`btn-primary ${isDirty ? '' : 'muted'}`}
          onClick={() => void onSave(saveKey, local)}
          disabled={saving === saveKey || !isDirty}
          style={{ flexShrink: 0, minWidth: 64 }}
        >
          {saving === saveKey ? '…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
