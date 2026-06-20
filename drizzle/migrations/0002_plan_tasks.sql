-- Run-up plan tasks — imported from the Tech Manager run-up plan (Dan).
-- These are the action items from the plan's five phases that aren't already
-- covered by the original seed tasks. All assigned to Dan.

INSERT INTO tasks (title, description, assignee, due_date, done, sort_order, created_at, updated_at) VALUES
-- Phase 1 — this week (blockers)
('Get BSB''s contact details from Steph', 'Blocker — you can''t spec anything without knowing their kit. Ask Steph for a name, number and email so you can talk PA/desk directly.', 'Dan', '2026-06-30', 0, 5, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Email BSB — introduce yourself + understand the rig', 'Blocker. Send once Steph passes their contact. The email that unblocks your input lists and practice planning — draft ready in Emails (cc Steph & Jacob).', 'Dan', '2026-06-30', 0, 7, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
-- Phase 2 — early–mid July (learning window)
('Find out BSB''s exact desk + kit, and book matching practice time', 'Blocker. Digital (X32/Qu/etc.) vs analogue completely changes how you prepare. If you can practise on the same family of desk via school/theatre, do that.', 'Dan', '2026-07-15', 0, 22, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Work through the live-sound learning track', 'Full curriculum in the Learning track screen. Aim for ~2 focused sessions a week on a real desk. Front-load before any holiday/DofE.', 'Dan', '2026-07-15', 0, 24, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Build a draft input list / stage plot per act', 'Template in the Stage plot screen. Start from the acts'' replies. The Vipers'' sheet is the one that matters most.', 'Dan', '2026-07-20', 0, 26, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Confirm the changeover plan with Jacob', 'Tightest transitions: Vipers (15-min setup) and any choir-to-band swap. Agree who does what — you on lines/desk, Jacob on staging/chairs.', 'Dan', '2026-07-20', 0, 28, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
-- Phase 3 — late July → early August
('Chase any acts who haven''t sent requirements', 'Anyone silent gets a polite nudge. The Vipers'' input list is non-negotiable — chase hard if missing.', 'Dan', '2026-08-01', 0, 33, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Finalise the run-of-day + patch list', 'One master input/patch list covering the whole day, plus per-act notes. Remember the deliberate 15:30 livestock-parade gap.', 'Dan', '2026-08-07', 0, 35, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Prep a "go bag" of consumables', 'Gaffer, spare batteries (handheld mics!), cable ties, torch, multitool, spare XLR/jack leads, sun cream and water, power bank for the field.', 'Dan', '2026-08-10', 0, 45, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
-- Phase 4 — show week & setup days
('Get hands-on with BSB''s desk during their get-in', 'Two field walk-arounds while BSB build. Learn their desk, FOH/monitor positions, power, gain structure and quirks. Your dress rehearsal for the rig.', 'Dan', '2026-08-14', 0, 70, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Pre-build a desk scene/snapshot if digital', 'If BSB''s desk is digital and allows it, pre-label channels and rough-set gains/EQ per act from your input lists. Saves precious time in 15-min changeovers.', 'Dan', '2026-08-14', 0, 75, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
('Ring-out the system for feedback', 'With the PA in show position, push each mic up, find the ringing frequencies and notch them. Choir announce mics and open band mics are the risk points.', 'Dan', '2026-08-15', 0, 90, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z'),
-- Phase 5 — show day
('Protect the Vipers changeover (~14:30)', 'Your hardest 15 minutes. Scene pre-loaded, channels labelled, mics/DIs staged. Don''t chase perfection — get a solid vocal-forward mix and refine during the first song.', 'Dan', '2026-08-16', 0, 210, '2026-06-20T00:00:00.000Z', '2026-06-20T00:00:00.000Z');
