import { useState, useEffect, useCallback } from 'react';
import type { Act, TimelineSlot } from '../types.ts';

function Spinner() { return <div className="spinner-wrap"><div className="spinner" /></div>; }

function fmtTime(t: string) { const [h, m] = t.split(':'); return `${h}:${m}`; }

export function TechSheet() {
  const [acts, setActs] = useState<Act[]>([]);
  const [slots, setSlots] = useState<TimelineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [aRes, sRes] = await Promise.all([fetch('/api/acts'), fetch('/api/timeline')]);
      const aJson = await aRes.json() as { ok: boolean; data?: Act[] };
      const sJson = await sRes.json() as { ok: boolean; data?: TimelineSlot[] };
      if (!aJson.ok || !aJson.data) throw new Error('Failed to load acts');
      if (!sJson.ok || !sJson.data) throw new Error('Failed to load timeline');
      setActs(aJson.data);
      setSlots(sJson.data.filter(s => s.date === '2026-08-16' && !s.isGap));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Spinner />;
  if (error) return <div className="error-msg">⚠️ {error}</div>;

  const actsById = new Map(acts.map(a => [a.id, a]));

  // PA / own-PA split
  const needPA = acts.filter(a => a.needsPA);
  const ownPA = acts.filter(a => !a.needsPA);
  const totalMics = acts.reduce((sum, a) => sum + (a.micCount ?? 0), 0);
  const needSeats = acts.filter(a => a.needsSeats);
  const maxSetup = Math.max(0, ...acts.map(a => a.setupMins ?? 0));

  return (
    <div className="tech-page">
      {/* Summary stats */}
      <div className="tech-summary">
        <div className="tech-stat-card">
          <div className="tech-stat-num">{totalMics}</div>
          <div className="tech-stat-label">Total mics</div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-num">{needPA.length}</div>
          <div className="tech-stat-label">Need house PA</div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-num">{needSeats.length}</div>
          <div className="tech-stat-label">Need seating</div>
        </div>
        <div className="tech-stat-card">
          <div className="tech-stat-num">{maxSetup}</div>
          <div className="tech-stat-label">Max setup (min)</div>
        </div>
      </div>

      {/* Per-act tech table */}
      <div className="tech-section-title">Per-Act Requirements</div>
      <div className="tech-table">
        {slots.map(slot => {
          const act = slot.actId != null ? actsById.get(slot.actId) : null;
          if (!act) return null;
          return (
            <div key={slot.id} className="tech-row">
              <div className="tech-row-time">{fmtTime(slot.startTime)}</div>
              <div className="tech-row-body">
                <div className="tech-row-name">{act.name}</div>
                <div className="tech-row-chips">
                  {act.needsPA
                    ? <span className="tech-chip tech-chip-house">🔊 House PA</span>
                    : <span className="tech-chip tech-chip-own">🔊 Own PA</span>}
                  {act.micCount > 0 && <span className="tech-chip">🎤 {act.micCount} mic{act.micCount > 1 ? 's' : ''}</span>}
                  {act.powerSockets && <span className="tech-chip">⚡ {act.powerSockets}</span>}
                  {act.needsSeats && <span className="tech-chip">🪑 Seats{act.seatsNotes ? ` – ${act.seatsNotes}` : ''}</span>}
                  {act.setupMins > 0 && <span className="tech-chip">⏱ {act.setupMins} min setup</span>}
                  {act.performerCount && <span className="tech-chip">👥 {act.performerCount}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Own PA acts */}
      {ownPA.length > 0 && (
        <>
          <div className="tech-section-title" style={{ marginTop: 20 }}>Bringing Own PA</div>
          <div className="tech-note-list">
            {ownPA.map(a => (
              <div key={a.id} className="tech-note-row">
                <span className="tech-note-name">{a.name}</span>
                {a.powerSockets && <span className="tech-chip">⚡ {a.powerSockets}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Seating */}
      {needSeats.length > 0 && (
        <>
          <div className="tech-section-title" style={{ marginTop: 20 }}>Seating Required</div>
          <div className="tech-note-list">
            {needSeats.map(a => (
              <div key={a.id} className="tech-note-row">
                <span className="tech-note-name">{a.name}</span>
                {a.seatsNotes && <span className="tech-chip">{a.seatsNotes}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
