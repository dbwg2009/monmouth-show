import { useState } from 'react';
import { useStore } from './store.tsx';
import { Icon, useClock } from './ui.tsx';
import type { Act, TimelineSlot } from '../types.ts';
import {
  SHOW_DATE_LABEL, isShowDay, nowMins, toMins, fmtTime, daysUntilShow,
  countdownTo, showStartDate, fmtDrift, pad,
} from './time.ts';

const PREVIEW_KEY = 'bandstand_preview_live';
const minsOfDay = (iso: string) => nowMins(new Date(iso));

export function Home({ goTo }: { goTo: (t: any) => void }) {
  const now = useClock(1000);
  const [preview, setPreview] = useState(() => localStorage.getItem(PREVIEW_KEY) === '1');
  const live = isShowDay(now) || preview;

  function togglePreview() {
    const next = !preview;
    setPreview(next);
    if (next) localStorage.setItem(PREVIEW_KEY, '1');
    else localStorage.removeItem(PREVIEW_KEY);
  }

  return live
    ? <LiveBoard now={now} preview={preview && !isShowDay(now)} onExitPreview={togglePreview} goTo={goTo} />
    : <BuildUp now={now} onPreview={togglePreview} goTo={goTo} />;
}

// ── Build-up (before show day) ───────────────────────────────────────────────
function BuildUp({ now, onPreview, goTo }: { now: Date; onPreview: () => void; goTo: (t: any) => void }) {
  const { db } = useStore();
  const days = daysUntilShow(now);
  const cd = countdownTo(showStartDate().getTime(), now);

  const openChase = db.chaseItems.filter((c) => !c.done);
  const openTasks = db.tasks.filter((t) => !t.done);
  const dueSoon = openTasks.filter((t) => t.dueDate && t.dueDate <= new Date(now.getTime() + 7 * 864e5).toISOString().slice(0, 10));
  const unconfirmed = db.acts.filter((a) => !a.confirmed);

  return (
    <div className="page">
      <div className="countdown-hero">
        <div className="countdown-num">{days}</div>
        <div className="countdown-unit">{days === 1 ? 'day to go' : 'days to go'}</div>
        <div className="countdown-clock">
          {pad(cd.hours)}<span>h</span> {pad(cd.mins)}<span>m</span> {pad(cd.secs)}<span>s</span>
        </div>
        <div className="countdown-date">{SHOW_DATE_LABEL} · gates 09:00</div>
      </div>

      <div className="focus-grid">
        <FocusCard n={openChase.length} label="to chase" icon="list" tone={openChase.length ? 'warn' : 'ok'} onClick={() => goTo('chase')} />
        <FocusCard n={dueSoon.length} label="tasks due" icon="check" tone={dueSoon.length ? 'warn' : 'ok'} onClick={() => goTo('tasks')} />
        <FocusCard n={unconfirmed.length} label="unconfirmed acts" icon="mic" tone={unconfirmed.length ? 'warn' : 'ok'} onClick={() => goTo('acts')} />
        <FocusCard n={db.acts.length} label="acts booked" icon="users" tone="neutral" onClick={() => goTo('acts')} />
      </div>

      {openChase.length > 0 && (
        <section className="card">
          <div className="card-head"><h3>Still to chase</h3><button className="link-btn" onClick={() => goTo('chase')}>All</button></div>
          <ul className="mini-list">
            {openChase.slice(0, 4).map((c) => {
              const act = db.acts.find((a) => a.id === c.actId);
              return <li key={c.id}><span className="mini-dot warn" /><span>{c.label}{act ? <em className="mini-tag">{act.name}</em> : null}</span></li>;
            })}
          </ul>
        </section>
      )}

      {dueSoon.length > 0 && (
        <section className="card">
          <div className="card-head"><h3>Tasks coming up</h3><button className="link-btn" onClick={() => goTo('tasks')}>All</button></div>
          <ul className="mini-list">
            {dueSoon.slice(0, 4).map((t) => (
              <li key={t.id}><span className="mini-dot" /><span>{t.title}{t.assignee ? <em className="mini-tag">{t.assignee}</em> : null}</span></li>
            ))}
          </ul>
        </section>
      )}

      <button className="big-ghost-btn" onClick={onPreview}>
        <Icon name="play" size={18} /> Preview the live show-day screen
      </button>
    </div>
  );
}

function FocusCard({ n, label, icon, tone, onClick }: { n: number; label: string; icon: string; tone: 'warn' | 'ok' | 'neutral'; onClick: () => void }) {
  return (
    <button className={`focus-card focus-${tone}`} onClick={onClick}>
      <Icon name={icon} size={18} className="focus-ico" />
      <span className="focus-n">{n}</span>
      <span className="focus-l">{label}</span>
    </button>
  );
}

// ── Live show-day board ──────────────────────────────────────────────────────
function LiveBoard({ now, preview, onExitPreview, goTo }: { now: Date; preview: boolean; onExitPreview: () => void; goTo: (t: any) => void }) {
  const { db, startSlot, finishSlot } = useStore();
  const slots = [...db.timeline].sort((a, b) => a.sortOrder - b.sortOrder);
  const actById = (id: number | null) => db.acts.find((a) => a.id === id);

  const pointerId = db.settings.live_current_slot_id ? Number(db.settings.live_current_slot_id) : null;
  const clock = nowMins(now);

  // Current = the live pointer (if running), else the slot whose working window holds the clock.
  let current: TimelineSlot | undefined = pointerId
    ? slots.find((s) => s.id === pointerId && !s.finishedAt)
    : undefined;
  if (!current) current = slots.find((s) => clock >= toMins(s.startTime) && clock < toMins(s.endTime) && !s.finishedAt);

  const curIndex = current ? slots.indexOf(current) : -1;
  // Next = first slot after current that isn't finished; if no current, first unstarted slot.
  const next = current
    ? slots.slice(curIndex + 1).find((s) => !s.finishedAt)
    : slots.find((s) => !s.finishedAt && !s.actualStartTime);

  const allDone = slots.length > 0 && slots.every((s) => s.finishedAt);

  return (
    <div className="page live">
      {preview && (
        <div className="preview-strip">
          <span><Icon name="play" size={14} /> Preview — this is the show-day view</span>
          <button onClick={onExitPreview}>Exit</button>
        </div>
      )}
      <div className="live-clock">{pad(now.getHours())}:{pad(now.getMinutes())}<span className="live-secs">:{pad(now.getSeconds())}</span></div>

      {allDone ? (
        <div className="live-done">
          <Icon name="flag" size={34} />
          <h2>That's a wrap</h2>
          <p>Every act is finished. Great day at the Band Stand.</p>
        </div>
      ) : current ? (
        <CurrentCard slot={current} act={actById(current.actId)} now={now}
          onFinish={() => finishSlot(current!.id)} />
      ) : (
        <NotStartedCard next={next} act={next ? actById(next.actId) : undefined}
          onStart={() => next && startSlot(next.id)} />
      )}

      {next && (current || !allDone) && (
        <NextCard slot={next} act={actById(next.actId)} isStart={!!current}
          onStart={() => startSlot(next.id)} />
      )}

      <button className="link-row" onClick={() => goTo('running')}>
        <Icon name="music" size={16} /> Full running order <Icon name="chevron" size={15} />
      </button>

      <div className="live-mini">
        {slots.map((s) => {
          const status = s.finishedAt ? 'done' : s.id === current?.id ? 'now' : s.id === next?.id ? 'next' : 'up';
          const drift = s.plannedStartTime ? toMins(s.startTime) - toMins(s.plannedStartTime) : 0;
          return (
            <div key={s.id} className={`live-mini-row ${status}`}>
              <span className="lm-time">{fmtTime(s.startTime)}</span>
              <span className="lm-dot" />
              <span className="lm-name">{s.actName}{s.isGap && <em> · blackout</em>}</span>
              {status === 'now' && <span className="lm-tag now">NOW</span>}
              {status === 'next' && <span className="lm-tag next">NEXT</span>}
              {status === 'done' && <Icon name="check" size={14} className="lm-check" />}
              {status === 'up' && Math.abs(drift) >= 2 && <span className={`lm-drift ${drift > 0 ? 'behind' : 'ahead'}`}>{drift > 0 ? '+' : ''}{drift}m</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrentCard({ slot, act, now, onFinish }: { slot: TimelineSlot; act: Act | undefined; now: Date; onFinish: () => void }) {
  const clock = nowMins(now);
  const endM = toMins(slot.endTime);
  const leftMin = endM - clock;
  const overrun = !slot.openEnded && leftMin < 0;
  const leftAbs = Math.abs(leftMin);
  const leftH = Math.floor(leftAbs / 60), leftMm = Math.floor(leftAbs % 60), leftSs = Math.floor((leftAbs * 60) % 60);

  // Drift vs original plan: how late did we start (or are running) vs planned start.
  const startedM = slot.actualStartTime ? minsOfDay(slot.actualStartTime) : clock;
  const drift = slot.plannedStartTime ? startedM - toMins(slot.plannedStartTime) : 0;
  const d = fmtDrift(drift);

  return (
    <div className={`live-now ${overrun ? 'overrun' : ''} ${slot.isGap ? 'gap' : ''}`}>
      {overrun && <div className="overrun-banner"><Icon name="alert" size={18} /> Over by {pad(leftH * 60 + leftMm)}:{pad(leftSs)} — wrap up</div>}
      <div className="live-now-label"><span className="pulse" /> {slot.isGap ? 'Now — music blackout' : 'On stage now'}</div>
      <div className="live-now-name">{slot.actName}</div>
      <div className="live-now-window">{fmtTime(slot.startTime)} – {slot.openEnded ? 'to close' : fmtTime(slot.endTime)}</div>

      {slot.isGap ? (
        <div className="gap-note"><Icon name="alert" size={16} /> {slot.gapReason}</div>
      ) : slot.openEnded ? (
        <div className="live-count open"><span className="cnum">∞</span><span className="clbl">open-ended — plays to close</span></div>
      ) : (
        <div className={`live-count ${overrun ? 'over' : leftMin <= 5 ? 'soon' : ''}`}>
          <span className="cnum">{overrun ? '+' : ''}{pad(leftH * 60 + leftMm)}<span className="csep">:</span>{pad(leftSs)}</span>
          <span className="clbl">{overrun ? 'over time' : 'left on stage'}</span>
        </div>
      )}

      {!slot.isGap && <div className={`drift-pill drift-${d.tone}`}>{d.text} vs plan</div>}
      {act && <ActNeeds act={act} />}

      <button className="live-action finish" onClick={onFinish}>
        <Icon name="check" size={18} /> Mark {slot.isGap ? 'blackout over' : `${slot.actName} finished`}
      </button>
    </div>
  );
}

function NotStartedCard({ next, act, onStart }: { next: TimelineSlot | undefined; act: Act | undefined; onStart: () => void }) {
  if (!next) return <div className="live-now"><div className="live-now-label">Nothing scheduled</div></div>;
  return (
    <div className="live-now waiting">
      <div className="live-now-label">First up</div>
      <div className="live-now-name">{next.actName}</div>
      <div className="live-now-window">planned {fmtTime(next.plannedStartTime ?? next.startTime)}</div>
      {act && <ActNeeds act={act} />}
      <button className="live-action start" onClick={onStart}>
        <Icon name="play" size={18} /> Start {next.actName}
      </button>
    </div>
  );
}

function NextCard({ slot, act, isStart, onStart }: { slot: TimelineSlot; act: Act | undefined; isStart: boolean; onStart: () => void }) {
  const drift = slot.plannedStartTime ? toMins(slot.startTime) - toMins(slot.plannedStartTime) : 0;
  const d = fmtDrift(drift);
  return (
    <div className="live-next">
      <div className="live-next-head">
        <div>
          <div className="live-next-label">Up next · {fmtTime(slot.startTime)}{slot.isGap ? ' · blackout' : ''}</div>
          <div className="live-next-name">{slot.actName}</div>
        </div>
        {!slot.isGap && Math.abs(drift) >= 2 && <span className={`drift-pill drift-${d.tone}`}>{d.text}</span>}
      </div>
      {act && <ActNeeds act={act} compact />}
      {isStart && (
        <button className="live-action start sm" onClick={onStart}>
          <Icon name="play" size={16} /> Start now
        </button>
      )}
    </div>
  );
}

export function ActNeeds({ act, compact }: { act: Act; compact?: boolean }) {
  const chips: { icon: string; text: string; warn?: boolean }[] = [];
  chips.push({ icon: 'mic', text: act.micCount ? `${act.micCount} mic${act.micCount > 1 ? 's' : ''}` : 'no mics' });
  chips.push({ icon: 'power', text: act.needsPA ? 'house PA' : 'own PA', warn: act.needsPA });
  if (act.powerSockets) chips.push({ icon: 'power', text: act.powerSockets.replace(/\s*\(.*\)/, '') });
  if (act.needsSeats) chips.push({ icon: 'seat', text: 'seats' });
  if (!compact && act.setupMins) chips.push({ icon: 'clock', text: `${act.setupMins}m setup` });
  return (
    <div className={`needs ${compact ? 'compact' : ''}`}>
      {chips.map((c, i) => (
        <span key={i} className={`need-chip ${c.warn ? 'warn' : ''}`}><Icon name={c.icon} size={13} />{c.text}</span>
      ))}
    </div>
  );
}
