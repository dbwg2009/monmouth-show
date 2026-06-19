-- ShowRunner seed data — Monmouthshire Show 2026
-- Run via: npm run db:seed:local / db:seed:remote

-- ── Acts ─────────────────────────────────────────────────────────────────────

INSERT INTO acts (name, contact_name, contact_email, contact_email_2, contact_phone, needs_pa, mic_count, needs_seats, seats_notes, power_sockets, setup_mins, performer_count, fee_pence, confirmed, notes, website_url, created_at, updated_at) VALUES
(
  'Rock Choir',
  'Karl Montgomery-Williams',
  'karl.montgomery-williams@rockchoir.com',
  'events@rockchoir.com',
  '01252 714276',
  0, -- brings own speakers/PA
  1, -- conductor mic only
  0,
  NULL,
  '2 sockets (own speakers + backing track laptop)',
  15,
  '60-80',
  NULL,
  1,
  'Brings own PA/speakers — no house PA needed. Conductor mic required. Two sets: 10:00–10:30 and 14:00–14:30. Bring own backing tracks on laptop. Check levels before first set.',
  'https://www.rockchoir.com',
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Monmouth Town Band',
  'Jeremy Cleaves',
  'jcleaves544@gmail.com',
  NULL,
  NULL,
  0, -- acoustic brass band, no PA needed
  0,
  1,
  'Chairs for ~25 musicians + conductor stand',
  '1 socket (optional, conductor stand light)',
  20,
  '25',
  NULL,
  1,
  'Brass band — fully acoustic, no PA required. Need chairs set out before they arrive. Allow 20 min setup.',
  NULL,
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Male Voice Choir',
  'Stuart Baber',
  'mon.mvc@gmail.com',
  NULL,
  '07554 545834',
  1, -- needs PA for outdoor projection
  1, -- conductor/director mic
  1,
  'Risers or tiered seating for ~40 singers if available; flat rows otherwise',
  '2 sockets (PA mixer + laptop)',
  20,
  '40',
  NULL,
  1,
  'Contact: Stuart Baber (Secretary). Also Ian MacIntyre 07554 545834. Longest slot: 12:00–13:00. Confirm PA requirements closer to date.',
  NULL,
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Monmouth Town Band (2nd set)',
  'Jeremy Cleaves',
  'jcleaves544@gmail.com',
  NULL,
  NULL,
  0,
  0,
  1,
  'Same chairs as first set — leave in place',
  NULL,
  10,
  '25',
  NULL,
  1,
  'Second set 13:15–13:45. Chairs should already be in place from morning set.',
  NULL,
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Vipers and Guests',
  'Tony Summers',
  'tonysummers967@gmail.com',
  NULL,
  '07840440304',
  1, -- band with full backline
  4, -- vocals x2, guitar, bass (DI boxes)
  0,
  NULL,
  '4 sockets (guitar amp, bass amp, keyboard, mixer)',
  30,
  '7',
  17500,
  1,
  'Rock/covers band. Fee: £175. Longest setup — allow full 30 min. Confirm backline requirements. Slot 14:45–15:30.',
  NULL,
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Crossroads',
  'Averil MacDonald',
  'a.m.macdonald@reading.ac.uk',
  'tonyforster55@icloud.com',
  NULL,
  1,
  3, -- lead vocal, rhythm guitar/vocal, lead guitar
  0,
  NULL,
  '3 sockets (2x guitar amp, mixer)',
  20,
  '4',
  NULL,
  1,
  'Final act, plays to close of show (16:00 onwards). Contacts: Averil MacDonald & Tony Forster. Bring own PA. No fee — voluntary. Confirm end time on the day.',
  'https://monstock.org/band/crossroads/',
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
);

-- ── Timeline slots ────────────────────────────────────────────────────────────
-- act_id references: 1=Rock Choir, 2=MTB, 3=Male Voice Choir, 4=MTB 2nd set,
--                    5=Vipers+Guests, 6=Crossroads

INSERT INTO timeline_slots (act_id, act_name, start_time, end_time, date, is_gap, gap_reason, sort_order, updated_at) VALUES
(1, 'Rock Choir',               '10:00', '10:30', '2026-08-16', 0, NULL, 10, '2026-06-01T00:00:00.000Z'),
(2, 'Monmouth Town Band',       '11:00', '11:30', '2026-08-16', 0, NULL, 20, '2026-06-01T00:00:00.000Z'),
(3, 'Male Voice Choir',         '12:00', '13:00', '2026-08-16', 0, NULL, 30, '2026-06-01T00:00:00.000Z'),
(4, 'Monmouth Town Band',       '13:15', '13:45', '2026-08-16', 0, NULL, 40, '2026-06-01T00:00:00.000Z'),
(1, 'Rock Choir',               '14:00', '14:30', '2026-08-16', 0, NULL, 50, '2026-06-01T00:00:00.000Z'),
(5, 'Vipers and Guests',        '14:45', '15:30', '2026-08-16', 0, NULL, 60, '2026-06-01T00:00:00.000Z'),
(NULL, 'Livestock Parade',      '15:30', '15:45', '2026-08-16', 1, 'Livestock Parade — no music, may spook animals', 70, '2026-06-01T00:00:00.000Z'),
(6, 'Crossroads',               '16:00', '18:00', '2026-08-16', 0, NULL, 80, '2026-06-01T00:00:00.000Z');

-- ── Tasks ─────────────────────────────────────────────────────────────────────

INSERT INTO tasks (title, description, assignee, due_date, done, sort_order, created_at, updated_at) VALUES
-- Pre-show admin
('Confirm all acts are booked', 'Written confirmation from all six acts', 'Dan', '2026-08-01', 0, 10, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Collect tech riders from all acts', 'PA requirements, mic counts, power sockets, backline needs', 'Dan', '2026-08-07', 0, 20, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Arrange PA system hire or confirm in-house PA', 'MVC and Vipers need house PA; Rock Choir and Crossroads bring own', 'Dan', '2026-08-07', 0, 30, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Source chairs for Monmouth Town Band (25 seats)', 'Confirm with show organisers who is providing seating', 'Jacob', '2026-08-10', 0, 40, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Pay Vipers and Guests (£175)', 'Fee agreed: £175. Arrange payment method with Tony Summers', 'Dan', '2026-08-14', 0, 45, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Print run-of-day schedule for all volunteers', 'One copy per person + spares', 'Steph', '2026-08-14', 0, 50, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Brief Jacob and Steph on roles for the day', NULL, 'Dan', '2026-08-14', 0, 60, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
-- Day-of setup (pre-show)
('Arrive at Band Stand by 08:30 for setup', NULL, 'Dan', '2026-08-16', 0, 100, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Set up PA system and do sound check', 'Test with Rock Choir conductor mic + laptop input', 'Dan', '2026-08-16', 0, 110, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Set out chairs for Monmouth Town Band', '25 chairs + conductor stand', 'Jacob', '2026-08-16', 0, 120, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Meet and greet Rock Choir on arrival (09:45)', 'Guide to Band Stand, confirm speaker placement', 'Steph', '2026-08-16', 0, 130, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
-- Day-of: between acts
('Clear chairs between MTB 1st set and Male Voice Choir', 'MVC need different layout', 'Jacob', '2026-08-16', 0, 200, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Enforce music blackout during Livestock Parade (15:30–15:45)', 'No music, no PA, no soundcheck — animals on site', 'Dan', '2026-08-16', 0, 210, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
-- Post-show
('Strike PA and pack down Band Stand', NULL, 'Dan', '2026-08-16', 0, 300, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Return hired equipment', NULL, 'Dan', '2026-08-17', 0, 310, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z');

-- ── Settings ──────────────────────────────────────────────────────────────────

INSERT INTO settings (key, value, updated_at) VALUES
('gmail_label',    'MonShow',                                                                   '2026-06-01T00:00:00.000Z'),
('gmail_contacts', 'atcstephharris@gmail.com,karl.montgomery-williams@rockchoir.com,tonysummers967@gmail.com,a.m.macdonald@reading.ac.uk,jcleaves544@gmail.com,mon.mvc@gmail.com', '2026-06-01T00:00:00.000Z');
