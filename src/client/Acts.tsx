import { useState, useEffect, useCallback } from 'react';
import type { Act, TimelineSlot } from '../types.ts';

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

function IconSpeaker() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
    </svg>
  );
}

function IconChair() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <path d="M19 9V6a2 2 0 00-2-2H7a2 2 0 00-2 2v3" />
      <path d="M3 11v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-4 0v2H7v-2a2 2 0 00-4 0z" />
      <path d="M5 18v2M19 18v2" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function fmt(pence: number): string {
  return `£${(pence / 100).toFixed(2).replace('.00', '')}`;
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':');
  return `${h}:${m}`;
}

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

interface ActWithSlots extends Act {
  slots: TimelineSlot[];
}

export function Acts() {
  const [acts, setActs]     = useState<ActWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [actsRes, slotsRes] = await Promise.all([
        fetch('/api/acts'),
        fetch('/api/timeline'),
      ]);
      const actsJson  = await actsRes.json()  as { ok: boolean; data?: Act[];          error?: string };
      const slotsJson = await slotsRes.json() as { ok: boolean; data?: TimelineSlot[]; error?: string };

      if (!actsJson.ok  || !actsJson.data)  throw new Error(actsJson.error  ?? 'Failed to load acts');
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
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Spinner />;
  if (error)   return <div className="error-msg">⚠️ {error}</div>;

  // Deduplicate by act ID (MTB appears twice in timeline)
  const seen = new Set<number>();
  const unique = acts.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  return (
    <div className="acts-page">
      {unique.map(act => {
        const uniqueSlots = act.slots.filter((s, i, arr) =>
          arr.findIndex(s2 => s2.startTime === s.startTime) === i
        );

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
              <span className={`badge ${act.confirmed ? 'badge-green' : 'badge-amber'}`}>
                {act.confirmed ? '✓ Confirmed' : 'Unconfirmed'}
              </span>
            </div>

            {/* Tech requirements */}
            <div className="act-tech">
              {act.needsPA && (
                <span className="tech-chip"><IconSpeaker />House PA</span>
              )}
              {!act.needsPA && (
                <span className="tech-chip"><IconSpeaker />Own PA</span>
              )}
              {act.micCount > 0 && (
                <span className="tech-chip"><IconMic />{act.micCount} mic{act.micCount > 1 ? 's' : ''}</span>
              )}
              {act.needsSeats && (
                <span className="tech-chip"><IconChair />Seating</span>
              )}
              {act.powerSockets && (
                <span className="tech-chip"><IconZap />{act.powerSockets}</span>
              )}
              {act.performerCount && (
                <span className="tech-chip"><IconUsers />{act.performerCount} performers</span>
              )}
              {act.setupMins > 0 && (
                <span className="tech-chip"><IconClock />{act.setupMins} min setup</span>
              )}
            </div>

            {/* Contacts */}
            {(act.contactName || act.contactEmail || act.contactPhone) && (
              <div className="act-contacts">
                {/* Primary contact */}
                {act.contactName && (
                  <div className="contact-row">
                    <span className="contact-name">{act.contactName}</span>
                    {act.contactPhone && (
                      <a
                        href={`tel:${act.contactPhone.replace(/\s/g, '')}`}
                        className="contact-btn btn-phone"
                        aria-label={`Call ${act.contactName}`}
                      >
                        <IconPhone />
                      </a>
                    )}
                    {act.contactEmail && (
                      <a
                        href={`mailto:${act.contactEmail}`}
                        className="contact-btn btn-email"
                        aria-label={`Email ${act.contactName}`}
                      >
                        <IconMail />
                      </a>
                    )}
                  </div>
                )}
                {/* Secondary email */}
                {act.contactEmail2 && (
                  <div className="contact-row">
                    <span className="contact-name" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {act.contactEmail2}
                    </span>
                    <a
                      href={`mailto:${act.contactEmail2}`}
                      className="contact-btn btn-email"
                      aria-label={`Email ${act.contactEmail2}`}
                    >
                      <IconMail />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {act.notes && (
              <div className="act-notes">{act.notes}</div>
            )}

            {/* Footer: fee + website */}
            {(act.feePence !== null || act.websiteUrl) && (
              <div className="act-footer">
                <div>
                  {act.feePence !== null ? (
                    <>
                      <div className="act-fee-amount">{fmt(act.feePence)}</div>
                      <div className="act-fee-label">Agreed fee</div>
                    </>
                  ) : (
                    <div className="act-fee-label" style={{ fontStyle: 'italic' }}>No fee</div>
                  )}
                </div>
                {act.websiteUrl && (
                  <a
                    href={act.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-btn btn-web"
                    aria-label="Visit website"
                    style={{ width: 'auto', padding: '0 12px', gap: 6, display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600 }}
                  >
                    <IconGlobe />
                    Website
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
