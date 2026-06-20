// Show-day time helpers. All times are Europe/London on the show date.

export const SHOW_DATE = '2026-08-16';
export const SHOW_DATE_LABEL = 'Sunday 16 August 2026';
export const GATES_OPEN = '09:00';

/** "HH:MM" → minutes since midnight. */
export function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** minutes since midnight → "HH:MM". */
export function fromMins(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function fmtTime(time: string | null | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${h}:${m}`;
}

export function pad(n: number): string { return String(n).padStart(2, '0'); }

/** Whole-day boundaries of the show as Date objects (local time). */
export function showDayBounds() {
  const [y, m, d] = SHOW_DATE.split('-').map(Number);
  const start = new Date(y!, m! - 1, d!, 0, 0, 0);
  const end = new Date(y!, m! - 1, d! + 1, 0, 0, 0);
  return { start, end };
}

export function isShowDay(now: Date): boolean {
  const { start, end } = showDayBounds();
  return now >= start && now < end;
}

/** Current clock time on the show day as minutes since midnight (clamped to the day). */
export function nowMins(now: Date): number {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

export function daysUntilShow(now: Date): number {
  const { start } = showDayBounds();
  const ms = start.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round(ms / 86_400_000);
}

export interface Countdown { days: number; hours: number; mins: number; secs: number; past: boolean; }
export function countdownTo(targetMs: number, now: Date): Countdown {
  const diff = targetMs - now.getTime();
  const past = diff <= 0;
  const total = Math.max(0, Math.floor(Math.abs(diff) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
    past,
  };
}

/** Show start (first slot's planned start) as a Date for the days-to-go countdown. */
export function showStartDate(firstStart = '10:00'): Date {
  const [y, m, d] = SHOW_DATE.split('-').map(Number);
  const [hh, mm] = firstStart.split(':').map(Number);
  return new Date(y!, m! - 1, d!, hh ?? 10, mm ?? 0, 0);
}

/** Format a signed minute drift like "+6 min late" / "4 min early" / "on time". */
export function fmtDrift(mins: number): { text: string; tone: 'ahead' | 'ontime' | 'behind' } {
  const r = Math.round(mins);
  if (r >= 2) return { text: `${r} min behind`, tone: 'behind' };
  if (r <= -2) return { text: `${Math.abs(r)} min ahead`, tone: 'ahead' };
  return { text: 'on schedule', tone: 'ontime' };
}
