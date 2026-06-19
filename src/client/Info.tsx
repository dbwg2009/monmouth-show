import { useState, useEffect, useCallback } from 'react';

function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

interface Props {}

export function Info(_: Props) {
  const [scratchpad, setScratchpad] = useState('');
  const [savedScratchpad, setSavedScratchpad] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json() as { ok: boolean; data?: Record<string, string> };
      const val = json.data?.scratchpad ?? '';
      setScratchpad(val);
      setSavedScratchpad(val);
    } catch (e) {
      console.error('Failed to load scratchpad:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Auto-clear the save message, cleaning up the timer on unmount.
  useEffect(() => {
    if (!saveMsg) return;
    const timer = setTimeout(() => setSaveMsg(''), 2000);
    return () => clearTimeout(timer);
  }, [saveMsg]);

  async function saveScratchpad() {
    setSaving(true);
    try {
      await fetch('/api/settings/scratchpad', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: scratchpad }),
      });
      setSavedScratchpad(scratchpad);
      setSaveMsg('Saved ✓');
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const isDirty = scratchpad !== savedScratchpad;

  if (loading) return <Spinner />;

  return (
    <div className="info-page">
      {/* Show Info */}
      <div className="info-section">
        <div className="info-section-title">Show Information</div>
        <div className="info-card">
          <InfoRow label="Event" value="Monmouthshire Agricultural Show" />
          <InfoRow label="Date" value="Sunday 16 August 2026" />
          <InfoRow label="Stage" value="Band Stand" />
          <InfoRow label="Show opens" value="10:00" />
          <InfoRow label="Show closes" value="18:00" />
        </div>
      </div>

      {/* Venue */}
      <div className="info-section">
        <div className="info-section-title">Venue</div>
        <div className="info-card">
          <InfoRow label="Address" value="Monmouth Showground, Monmouth, NP25" />
          <InfoRow label="What3words" value="/// (set in DB settings)" />
          <a
            href="https://maps.google.com/?q=Monmouth+Showground+NP25"
            target="_blank"
            rel="noopener noreferrer"
            className="info-map-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" style={{ width: 15, height: 15 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Open in Maps
          </a>
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="info-section">
        <div className="info-section-title">Emergency Contacts</div>
        <div className="info-card">
          <EmergencyRow name="Show Office" phone="01600 714305" />
          <EmergencyRow name="First Aid" phone="999 / on-site medic" />
          <EmergencyRow name="Dan (Sound & MC)" phone="— set in contacts" />
        </div>
      </div>

      {/* iCal link */}
      <div className="info-section">
        <div className="info-section-title">Calendar Feed</div>
        <div className="info-card" style={{ gap: 0 }}>
          <p className="info-text">Subscribe to the live schedule in your calendar app:</p>
          <a href="/api/ical" className="info-ical-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" style={{ width: 15, height: 15 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Download iCal (.ics)
          </a>
        </div>
      </div>

      {/* Scratchpad */}
      <div className="info-section">
        <div className="info-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Team Scratchpad</span>
          {saveMsg && <span style={{ fontSize: 12, color: 'var(--green-600)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>{saveMsg}</span>}
        </div>
        <div className="info-card" style={{ gap: 0 }}>
          <p className="info-text" style={{ marginBottom: 10 }}>Shared notes visible to all three of you. Auto-saved when you tap Save.</p>
          <textarea
            className="scratchpad-input"
            value={scratchpad}
            onChange={e => setScratchpad(e.target.value)}
            placeholder="Day-of notes, reminders, anything the team needs to know…"
            rows={6}
          />
          <button
            className={`btn-primary scratchpad-save ${isDirty ? '' : 'muted'}`}
            onClick={() => void saveScratchpad()}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving…' : isDirty ? 'Save notes' : 'Saved'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{value}</span>
    </div>
  );
}

function EmergencyRow({ name, phone }: { name: string; phone: string }) {
  const isCallable = phone.replace(/\s/g, '').match(/^\+?\d+$/);
  return (
    <div className="info-row">
      <span className="info-row-label">{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="info-row-value">{phone}</span>
        {isCallable && (
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="contact-btn btn-phone" style={{ width: 32, height: 32 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" style={{ width: 14, height: 14 }}>
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
