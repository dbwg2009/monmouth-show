-- Band Stand seed data — Monmouthshire Show 2026 (Sunday 16 August)
-- Run via: npm run db:seed:local / db:seed:remote
-- Sourced from Steph Harris's brief and the act email threads.

-- ── Acts ─────────────────────────────────────────────────────────────────────
-- One row per distinct act (Rock Choir and Monmouth Town Band each play twice;
-- the timeline references them in two slots).

INSERT INTO acts (name, contact_name, contact_email, contact_email_2, contact_phone, needs_pa, mic_count, needs_seats, seats_notes, power_sockets, setup_mins, performer_count, fee_pence, confirmed, status, notes, website_url, created_at, updated_at) VALUES
(
  'Rock Choir',
  'Karl Montgomery-Williams',
  'karl.montgomery-williams@rockchoir.com',
  'events@rockchoir.com',
  '01252 714276',
  0, -- brings own speakers/PA
  1, -- leader mic for Karl to talk to the crowd
  0,
  'All standing. Happy to be in front of the staging area if numbers do not fit on stage.',
  '2 sockets (own speakers + backing-track laptop/phone)',
  15,
  '60-80',
  NULL,
  1,
  'expected',
  'Opens the show and plays again at 14:00. Brings own speakers — Karl controls the music from his phone/laptop. Needs ONE mic to talk to the audience. Numbers (40-80) confirmed nearer the date. Office enquiries: Moira on 01252 714276.',
  'https://www.rockchoir.com',
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Monmouth Town Band',
  'Jeremy Cleaves',
  'jcleaves544@gmail.com',
  NULL,
  NULL, -- phone still to chase (via Jeremy / Terry)
  0, -- acoustic brass band, no PA needed
  0,
  1,
  'Chairs for ~25 players + space for a conductor stand. Same chairs reused for the 13:15 set.',
  '1 socket (optional, conductor stand light)',
  20,
  '25',
  NULL,
  1,
  'expected',
  'Acoustic brass band — no PA. Keep instruments at the back of the stage from the start so they set up fast. Plays twice (11:00 and 13:15). Still need a phone contact — chase via Jeremy/Terry.',
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
  1, -- needs house PA for outdoor projection
  1, -- director/announce mic
  1,
  'Chairs for ~40 singers; risers/tiered if available, flat rows otherwise. Slow to get on and off stage — allow extra time.',
  '2 sockets (PA mixer + laptop)',
  20,
  '40',
  NULL,
  1,
  'expected',
  'Struggled with the tech last year — priority to keep them happy. Ian MacIntyre (07554 545834) will help with requirements — get his email and confirm exact PA needs. Longest single slot: 12:00-13:00.',
  NULL,
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Vipers and Guests',
  'Tony Summers',
  'borderlines2023@gmail.com',
  NULL,
  '07840440304',
  1, -- full band, house PA + backline
  6,
  0,
  NULL,
  '4 sockets (guitar amp, bass amp, keys, mixer)',
  30,
  '7',
  NULL,
  1,
  'expected',
  'Rock/covers band (formerly Borderlines — line-up changed). Requested at least 15 min setup; allow the full 30. Tony Summers was ex-Chair of Off Centre. Fee and full setup details to be forwarded by Steph — confirm before the day.',
  NULL,
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
),
(
  'Crossroads',
  'Tony Forster',
  'tonyforster55@icloud.com',
  'a.m.macdonald@reading.ac.uk',
  '07876761522',
  0, -- brings own PA
  3, -- lead vocal, rhythm guitar/vocal, lead guitar
  0,
  NULL,
  '3 sockets (2x guitar amp, mixer)',
  20,
  '4',
  NULL,
  1,
  'expected',
  'Newly formed U3A band — closes the show from 16:00 and would ideally run late (~1 hour, open-ended). Brings own PA. Second contact: Averil MacDonald. Likely playing while vintage cars circle the Main Ring.',
  'https://monstock.org/band/crossroads/',
  '2026-06-01T00:00:00.000Z',
  '2026-06-01T00:00:00.000Z'
);

-- ── Channels (BSB input list per act) ─────────────────────────────────────────
-- act_id: 1=Rock Choir, 2=MTB, 3=Male Voice Choir, 4=Vipers+Guests, 5=Crossroads

INSERT INTO channels (act_id, channel_no, source, input_type, notes, sort_order, updated_at) VALUES
(1, 1, 'Leader mic (Karl)', 'Wireless / SM58', 'Only input needed — choir brings own speakers for music', 10, '2026-06-01T00:00:00.000Z'),

(3, 1, 'Director mic', 'SM58', 'Announcements + direction', 10, '2026-06-01T00:00:00.000Z'),
(3, 2, 'Choir L', 'Condenser', 'Area mic, stage left', 20, '2026-06-01T00:00:00.000Z'),
(3, 3, 'Choir R', 'Condenser', 'Area mic, stage right', 30, '2026-06-01T00:00:00.000Z'),
(3, 4, 'Backing track', 'DI / 3.5mm', 'Laptop — confirm with Ian MacIntyre', 40, '2026-06-01T00:00:00.000Z'),

(4, 1, 'Lead vocal', 'SM58', NULL, 10, '2026-06-01T00:00:00.000Z'),
(4, 2, 'Backing vocal', 'SM58', NULL, 20, '2026-06-01T00:00:00.000Z'),
(4, 3, 'Electric guitar', 'DI / mic amp', 'Confirm DI vs mic on the day', 30, '2026-06-01T00:00:00.000Z'),
(4, 4, 'Bass', 'DI', NULL, 40, '2026-06-01T00:00:00.000Z'),
(4, 5, 'Keys', 'DI (stereo)', NULL, 50, '2026-06-01T00:00:00.000Z'),
(4, 6, 'Drum overhead / kit', 'Condenser', 'Minimal kit mic-ing — confirm setup details', 60, '2026-06-01T00:00:00.000Z'),

(5, 1, 'Lead vocal', 'SM58', 'Crossroads bring own PA — list for reference', 10, '2026-06-01T00:00:00.000Z'),
(5, 2, 'Rhythm gtr / vocal', 'SM58 + DI', NULL, 20, '2026-06-01T00:00:00.000Z'),
(5, 3, 'Lead guitar', 'DI', NULL, 30, '2026-06-01T00:00:00.000Z');

-- ── Timeline slots ────────────────────────────────────────────────────────────
-- start/end = working (live-editable) times; planned_* = the fixed original plan.

INSERT INTO timeline_slots (act_id, act_name, start_time, end_time, planned_start_time, planned_end_time, open_ended, date, is_gap, gap_reason, sort_order, updated_at) VALUES
(1, 'Rock Choir',          '10:00', '10:30', '10:00', '10:30', 0, '2026-08-16', 0, NULL, 10, '2026-06-01T00:00:00.000Z'),
(2, 'Monmouth Town Band',  '11:00', '11:30', '11:00', '11:30', 0, '2026-08-16', 0, NULL, 20, '2026-06-01T00:00:00.000Z'),
(3, 'Male Voice Choir',    '12:00', '13:00', '12:00', '13:00', 0, '2026-08-16', 0, NULL, 30, '2026-06-01T00:00:00.000Z'),
(2, 'Monmouth Town Band',  '13:15', '13:45', '13:15', '13:45', 0, '2026-08-16', 0, NULL, 40, '2026-06-01T00:00:00.000Z'),
(1, 'Rock Choir',          '14:00', '14:30', '14:00', '14:30', 0, '2026-08-16', 0, NULL, 50, '2026-06-01T00:00:00.000Z'),
(4, 'Vipers and Guests',   '14:45', '15:30', '14:45', '15:30', 0, '2026-08-16', 0, NULL, 60, '2026-06-01T00:00:00.000Z'),
(NULL, 'Livestock Parade', '15:30', '15:45', '15:30', '15:45', 0, '2026-08-16', 1, 'Music blackout — livestock parade in the Main Ring next door. No music, PA or soundcheck (may spook the animals).', 70, '2026-06-01T00:00:00.000Z'),
(5, 'Crossroads',          '16:00', '17:00', '16:00', '17:00', 1, '2026-08-16', 0, NULL, 80, '2026-06-01T00:00:00.000Z');

-- ── Tasks ─────────────────────────────────────────────────────────────────────

INSERT INTO tasks (title, description, assignee, due_date, done, sort_order, created_at, updated_at) VALUES
-- Pre-show admin
('Send intro email to all acts (cc Steph)', 'Introduce Dan (Tech) & Jacob (Stage), ask any questions, confirm needs', 'Dan', '2026-07-15', 0, 10, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Collect tech needs from every act', 'PA, mic counts, power, backline, setup time — fill in the input lists', 'Dan', '2026-08-07', 0, 20, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Confirm PA plan with BSB', 'MVC and Vipers need house PA; Rock Choir and Crossroads bring own', 'Dan', '2026-08-07', 0, 30, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Confirm who provides chairs for Monmouth Town Band (~25)', 'Plus space for a conductor stand', 'Jacob', '2026-08-10', 0, 40, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Arrange 2x field walk-arounds with BSB', 'Once at PA/stage build (a couple of days before) and again before the day', 'Dan', '2026-08-14', 0, 50, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Get the Programme copy from Steph', 'For bearings — livestock parade / hunt relay / scurry timings near the Band Stand', 'Dan', '2026-08-14', 0, 60, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
-- Day-of setup
('Arrive at Band Stand by 08:30', 'Setup with Jacob before gates at 09:00', 'Dan', '2026-08-16', 0, 100, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Soundcheck with Rock Choir before 10:00', 'Leader mic + their own speakers; open the show on time', 'Dan', '2026-08-16', 0, 110, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
('Set out chairs for Monmouth Town Band', '~25 chairs + conductor stand; leave in place for their 13:15 set', 'Jacob', '2026-08-16', 0, 120, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
-- Day-of: during
('Hold music for the Livestock Parade (15:30-15:45)', 'No music, PA or soundcheck while animals are in the Main Ring', 'Dan', '2026-08-16', 0, 200, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
-- Post-show
('Strike PA and pack down Band Stand', 'After Crossroads finish', 'Dan', '2026-08-16', 0, 300, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z');

-- ── Chase list (outstanding info) ─────────────────────────────────────────────
-- act_id: 1=Rock Choir, 2=MTB, 3=Male Voice Choir, 4=Vipers+Guests, 5=Crossroads

INSERT INTO chase_items (act_id, label, done, sort_order, created_at, updated_at) VALUES
(2, 'Phone contact for Monmouth Town Band', 0, 10, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
(3, 'Ian MacIntyre''s email address', 0, 20, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
(3, 'Confirm MVC PA / tech requirements (struggled last year)', 0, 30, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
(4, 'Vipers + Guests fee & full setup details (Steph forwarding)', 0, 40, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
(1, 'Rock Choir final numbers (40-80)', 0, 50, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
(NULL, 'BSB PA/stage build date', 0, 60, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z'),
(NULL, 'Who is providing chairs', 0, 70, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z');

-- ── Contacts (people who aren't acts) ─────────────────────────────────────────

INSERT INTO contacts (name, role, org, phone, email, notes, sort_order, updated_at) VALUES
('Steph Harris', 'Show Chair & Liaison', 'Monmouthshire Show', '07711 055753', 'atcstephharris@gmail.com', 'Organising the Band Stand. Copy her on act emails.', 10, '2026-06-01T00:00:00.000Z'),
('BSB', 'PA / Sound', 'BSB', NULL, NULL, 'Providing the PA. Set up a couple of days before with the stage build. Arrange 2x field walk-arounds.', 20, '2026-06-01T00:00:00.000Z'),
('Cathy Tindell', 'Show Secretary', 'Monmouthshire Show', '07841 921002', 'secretary@monmouthshow.co.uk', 'Show management office.', 30, '2026-06-01T00:00:00.000Z'),
('Moira', 'Rock Choir office', 'Rock Choir', '01252 714276', 'events@rockchoir.com', 'Answers the phone / takes enquiries for Rock Choir; Karl is the lead contact.', 40, '2026-06-01T00:00:00.000Z');

-- ── Site locations (schematic positions, 0-100; approximate — adjust on the day)

INSERT INTO locations (name, category, notes, pos_x, pos_y, sort_order, updated_at) VALUES
('Band Stand', 'stage', 'Our stage, near the Members Tent.', 32, 55, 10, '2026-06-01T00:00:00.000Z'),
('Members Tent', 'facility', 'Right by the Band Stand.', 20, 42, 20, '2026-06-01T00:00:00.000Z'),
('Main Ring', 'place', 'Large ring beside the Band Stand — livestock parade, hunt relay, scurry, vintage cars.', 68, 48, 30, '2026-06-01T00:00:00.000Z'),
('Livestock gate', 'access', 'Animals enter/exit the Main Ring here, close to us — keep music down during the parade (15:30-15:45).', 52, 60, 40, '2026-06-01T00:00:00.000Z'),
('Main entrance / gates', 'access', 'Gates open 09:00.', 50, 90, 50, '2026-06-01T00:00:00.000Z'),
('Parking', 'place', NULL, 78, 84, 60, '2026-06-01T00:00:00.000Z'),
('First aid', 'safety', 'Confirm exact location on arrival.', 14, 74, 70, '2026-06-01T00:00:00.000Z');

-- ── Settings ──────────────────────────────────────────────────────────────────
-- gmail_contacts is a JSON array (the sync Worker JSON.parses it).

INSERT INTO settings (key, value, updated_at) VALUES
('gmail_label',    'MonShow', '2026-06-01T00:00:00.000Z'),
('gmail_contacts', '["atcstephharris@gmail.com","karl.montgomery-williams@rockchoir.com","borderlines2023@gmail.com","tonyforster55@icloud.com","a.m.macdonald@reading.ac.uk","jcleaves544@gmail.com","mon.mvc@gmail.com"]', '2026-06-01T00:00:00.000Z'),
('scratchpad',     '', '2026-06-01T00:00:00.000Z'),
('live_current_slot_id', '', '2026-06-01T00:00:00.000Z');
