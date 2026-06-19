import { useState, useEffect, useCallback } from 'react';
import type { TimelineSlot } from '../types.ts';

const SHOW_DATE = '2026-08-16';
const SHOW_YEAR = 2026;
const SHOW_MONTH = 7; // 0-indexed August
const SHOW_DAY = 16;

function slotToMs(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number);
  return new Date(date + 'T00:00:00').getTime() + (h! * 60 + m!) * 60_000;
}

function durationMins(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh! * 60 + em!) - (sh! * 60 + sm!);
}

function fmtTime(time: string): string {
  const [h, m] = time.split(':');
  return `${h}:${m}`;
}

function fmtCountdown(ms: number): { days: number; hours: number; mins: number; secs: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days  = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins  = Math.floor((total % 3600) / 60);
  const secs  = total % 60;
  return { days, hours, mins, secs };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function IconMusic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9"  x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

interface SlotWithStatus extends TimelineSlot {
  status: 'done' | 'current' | 'between' | 'next' | 'future';
  progressPct?: number;
}

function classifySlots(slots: TimelineSlot[], now: Date): SlotWithStatus[] {
  const nowMs = now.getTime();

  return slots.map((s, i) => {
    const startMs = slotToMs(s.date, s.startTime);
    const endMs   = slotToMs(s.date, s.endTime);

    if (nowMs >= endMs) {
      return { ...s, status: 'done' as const };
    }
    if (nowMs >= startMs && nowMs < endMs) {
      const progressPct = Math.round(((nowMs - startMs) / (endMs - startMs)) * 100);
      return { ...s, status: 'current' as const, progressPct };
    }
    // Is there a gap before this slot?
    const prevSlot = slots[i - 1];
    if (prevSlot) {
      const prevEndMs = slotToMs(prevSlot.date, prevSlot.endTime);
      if (nowMs >= prevEndMs && nowMs < startMs) {
        return { ...s, status: 'between' as const };
      }
    }
    // Is this the immediate next?
    const hasCurrent = slots.some(sl => {
      const sMs = slotToMs(sl.date, sl.startTime);
      const eMs = slotToMs(sl.date, sl.endTime);
      return nowMs >= sMs && nowMs < eMs;
    });
    const hasBetween = slots.some((sl, j) => {
      const prevSl = slots[j - 1];
      if (!prevSl) return false;
      const prevEMs = slotToMs(prevSl.date, prevSl.endTime);
      const slSMs = slotToMs(sl.date, sl.startTime);
      return nowMs >= prevEMs && nowMs < slSMs;
    });

    if (!hasCurrent && !hasBetween && i === slots.findIndex(sl => slotToMs(sl.date, sl.startTime) > nowMs)) {
      return { ...s, status: 'next' as const };
    }
    if ((hasCurrent || hasBetween) && i === slots.findIndex(sl => slotToMs(sl.date, sl.startTime) > nowMs)) {
      return { ...s, status: 'next' as const };
    }

    return { ...s, status: 'future' as const };
  });
}

export function Timeline() {
  const [slots, setSlots]   = useState<TimelineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [now, setNow]       = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/timeline');
      const json = await res.json() as { ok: boolean; data?: TimelineSlot[]; error?: string };
      if (!json.ok || !json.data) throw new Error(json.error ?? 'Failed to load');
      setSlots(json.data.filter(s => s.date === SHOW_DATE));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Tick clock every 10s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <div className="error-msg">⚠️ {error}</div>;

  const showStart = new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY, 10, 0, 0);
  const showEnd   = new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY, 18, 0, 0);
  const isShowDay = now >= new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY, 0, 0, 0) &&
                    now < new Date(SHOW_YEAR, SHOW_MONTH, SHOW_DAY + 1, 0, 0, 0);
  const isAfter   = now > showEnd;
  const isBefore  = now < showStart;

  const classified = classifySlots(slots, now);
  const current    = classified.find(s => s.status === 'current');
  const between    = classified.find(s => s.status === 'between');
  const next       = classified.find(s => s.status === 'next' || s.status === 'between');
  const nextActual = classified.find(s => s.status === 'next');

  // Countdown to show
  const msToShow = showStart.getTime() - now.getTime();
  const countdown = fmtCountdown(msToShow);

  return (
    <div className="timeline-page">
      {/* Pre-show: countdown */}
      {isBefore && (
        <>
          <div className="countdown-banner">
            <div className="countdown-label">Until the show</div>
            <div className="countdown-units">
              <div className="countdown-unit">
                <span className="num">{countdown.days}</span>
                <span className="lbl">days</span>
              </div>
              <div className="countdown-unit">
                <span className="num">{pad(countdown.hours)}</span>
                <span className="lbl">hrs</span>
              </div>
              <div className="countdown-unit">
                <span className="num">{pad(countdown.mins)}</span>
                <span className="lbl">min</span>
              </div>
              <div className="countdown-unit">
                <span className="num">{pad(countdown.secs)}</span>
                <span className="lbl">sec</span>
              </div>
            </div>
            <div className="countdown-date">Sunday 16 August 2026 · Monmouthshire Show</div>
          </div>
        </>
      )}

      {/* On show day: live status */}
      {isShowDay && current && (
        <div className="now-card">
          <div className="now-label">
            <span className="now-dot" />
            On stage now
          </div>
          <div className="now-name">{current.actName}</div>
          <div className="now-time">{fmtTime(current.startTime)} – {fmtTime(current.endTime)} · {durationMins(current.startTime, current.endTime)} min</div>
          <div className="now-progress-track">
            <div className="now-progress-fill" style={{ width: `${current.progressPct ?? 0}%` }} />
          </div>
          <div className="now-progress-labels">
            <span>{fmtTime(current.startTime)}</span>
            <span>{fmtTime(current.endTime)}</span>
          </div>
        </div>
      )}

      {/* Between slots */}
      {isShowDay && !current && between && (
        <div className="between-card" style={{ margin: '16px 16px 10px' }}>
          <div className="label">Break</div>
          <div className="name">Changeover</div>
          <div className="time">Next: {between.actName} at {fmtTime(between.startTime)}</div>
        </div>
      )}

      {/* Before first slot on show day */}
      {isShowDay && !current && !between && isBefore && (
        <div className="before-show-hero">
          <h2>🎺 Show starts at 10:00</h2>
          <p>First up: {classified[0]?.actName}</p>
        </div>
      )}

      {/* Gap warning (livestock parade etc.) */}
      {isShowDay && current?.isGap && current.gapReason && (
        <div className="gap-card" style={{ margin: '0 16px 10px' }}>
          <IconWarning />
          <div className="gap-card-text">
            <strong>Music blackout</strong>
            <span>{current.gapReason}</span>
          </div>
        </div>
      )}

      {/* Next up */}
      {isShowDay && nextActual && (
        <div className="next-card">
          <div className="next-icon"><IconMusic /></div>
          <div>
            <div className="next-label">Up next</div>
            <div className="next-name">{nextActual.actName}</div>
            <div className="next-time">{fmtTime(nextActual.startTime)} – {fmtTime(nextActual.endTime)}</div>
          </div>
        </div>
      )}

      {/* After show */}
      {isAfter && (
        <div className="after-show">
          <h2>🎉 Show complete</h2>
          <p>Thanks for a great day at the Monmouthshire Show!</p>
        </div>
      )}

      {/* Full schedule */}
      <div className="schedule-section">
        <div className="schedule-section-title">Full schedule · Sunday 16 August</div>
        <div className="schedule-list">
          {classified.map(slot => {
            const dotClass =
              slot.status === 'done'    ? 'done'    :
              slot.status === 'current' ? 'current' :
              slot.isGap               ? 'gap'     : 'future';

            const nameClass =
              slot.status === 'current' ? 'current' :
              slot.status === 'done'    ? 'done'    :
              slot.isGap               ? 'gap'     : '';

            const itemClass =
              slot.status === 'current' ? 'current' :
              slot.status === 'done'    ? 'done'    :
              slot.isGap               ? 'gap-item' : '';

            return (
              <div key={slot.id} className={`schedule-item ${itemClass}`}>
                <div className="schedule-time">{fmtTime(slot.startTime)}</div>
                <div className={`schedule-dot ${dotClass}`} />
                <div className={`schedule-name ${nameClass}`}>{slot.actName}</div>
                <div className="schedule-end">{fmtTime(slot.endTime)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
