// Run-up plan content (Dan-only): email drafts, the live-sound learning track,
// and the stage-plot / input-list template. Sourced from the planning brief.

const CC = ['atcstephharris@gmail.com', 'jacobgrundy19@gmail.com']; // Steph, Jacob

export interface EmailDraft {
  id: string;
  label: string;     // who it's to, for the summary line
  to: string;        // recipient address ('' when not yet known, e.g. BSB)
  toLabel: string;   // human label shown in the card (e.g. "BSB")
  subject: string;
  body: string;
}

export const EMAIL_DRAFTS: EmailDraft[] = [
  {
    id: 'bsb',
    label: 'BSB — introduce yourself + understand the rig',
    to: '',
    toLabel: 'BSB (get address from Steph)',
    subject: 'Monmouthshire Show 2026 — Band Stand PA & sound',
    body: `Hello,

I'm Daniel Grey, Technical Manager for the Band Stand stage at this year's
Monmouthshire Show (Sunday 16 August). I understand you're providing and
setting up the PA for the stage, and I'll be operating it across the day,
so I wanted to introduce myself and get a clear picture of the system ahead
of time.

A few things that would help me plan:
 - What desk will be on the stage, and is it digital or analogue? If it's
   digital, I'd like to pre-build a scene per act if that's possible.
 - What does the system look like channel-wise — roughly how many inputs
   have I got to play with?
 - Monitoring: how many wedges / monitor mixes are available? One of our
   acts is a seven-piece band who'll likely want a couple of mixes.
 - When are you setting up, and which days are you on site? I'd like to be
   there with you for a couple of walk-arounds of the field, and ideally to
   get hands-on with the desk during your get-in so I'm not meeting it cold
   on show day.

Thanks very much — looking forward to working with you.

Best,
Daniel Grey
Technical Manager, Monmouthshire Show
dbwg2009@gmail.com
07485 688130`,
  },
  {
    id: 'rockchoir',
    label: 'Rock Choir (Karl)',
    to: 'karl.montgomery-williams@rockchoir.com',
    toLabel: 'Karl Montgomery-Williams',
    subject: "Monmouthshire Show 2026 — Band Stand, and Rock Choir's setup",
    body: `Hello Karl,

I'm Dan, Tech Manager for the Band Stand at this year's Monmouthshire Show
(Sunday 16 August), working alongside Jacob Grundy who's our Stage Manager.
We wanted to introduce ourselves as your main points of contact for the
day. I'll be looking after sound and tech on the stage and operating the
PA; Jacob handles staging, chairs and keeping things moving.

Thanks for confirming your two slots (10:00 and 14:00). To keep things
simple, let's use the stage PA rather than your own speakers — you can plug
your phone or backing straight into our system with the long cable you
mentioned, and I'll have a handheld mic ready for you to address the
audience. One less thing for you to carry.

A couple of things to confirm so I can plan the staging with Jacob:
 - Roughly how many singers should I expect? If it's nearer 80 we'll
   happily work out where everyone stands, including in front of the
   staging if that's easier.
 - Do you just need the one announcement mic, or anything for the singing
   itself?

Looking forward to working with you.

Best,
Dan (and Jacob)
Band Stand — Tech & Stage Management`,
  },
  {
    id: 'townband',
    label: 'Monmouth Town Band (Jeremy)',
    to: 'jcleaves544@gmail.com',
    toLabel: 'Jeremy Cleaves',
    subject: "Monmouthshire Show 2026 — Band Stand, and the Town Band's slots",
    body: `Hello Jeremy,

I'm Dan, Tech Manager for the Band Stand at this year's Monmouthshire Show
(Sunday 16 August), working alongside Jacob Grundy who's our Stage Manager.
We wanted to introduce ourselves as your main points of contact for the
day. I'll be looking after sound and tech on the stage; Jacob handles
staging, chairs and keeping things moving.

I understand the band will be set up with instruments at the back of the
stage from the start, across your two slots, and that you're largely
self-contained on the technical side — please let me know if that's not the
case and there's anything you'd like through the PA.

The main thing we want to get right is seating: roughly how many chairs
would you need, and whereabouts on or around the stage? If you could also
pass me a phone number we can reach you on during the day, that'd be a great
help for keeping things moving.

Looking forward to having you with us.

Best,
Dan (and Jacob)
Band Stand — Tech & Stage Management`,
  },
  {
    id: 'mvc',
    label: 'Male Voice Choir (Ian)',
    to: 'mon.mvc@gmail.com',
    toLabel: 'Ian MacIntyre / mon.mvc@gmail.com',
    subject: "Monmouthshire Show 2026 — Band Stand, and the choir's sound",
    body: `Hello Ian,

I'm Dan, Tech Manager for the Band Stand at this year's Monmouthshire Show
(Sunday 16 August), working alongside Jacob Grundy who's our Stage Manager.
We wanted to introduce ourselves as your main points of contact for the
day. I'll be looking after sound and tech on the stage and operating the
PA; Jacob handles staging, chairs and keeping things moving.

Steph suggested you'd be the best person to talk to about the choir's
requirements. I gather the technical side was a bit tricky last year, so I'd
like to get it right this time and plan properly around whatever suits you.
Could you let me know:
 - Roughly how many are singing, and will you be in formation or rows?
 - Do you have a musical director or anyone who needs a mic, to conduct or
   address the audience?
 - Do you sing unaccompanied, or use a piano or any backing?
 - How many chairs would you need, and do any of the choir need seating on
   or beside the stage?
 - Anything that didn't work well last year that I should make sure to
   avoid?

A phone number we can reach you on during the day would be handy too. I'll
have a PA on the stage and I'm operating it, so there's plenty of
flexibility.

Thanks very much, and looking forward to working with you.

Best,
Dan (and Jacob)
Band Stand — Tech & Stage Management`,
  },
  {
    id: 'vipers',
    label: 'Vipers + Guests (Tony Summers)',
    to: 'tonysummers967@gmail.com',
    toLabel: 'Tony Summers',
    subject: 'Monmouthshire Show 2026 — Band Stand, and sound for the Vipers',
    body: `Hello Tony,

I'm Dan, Tech Manager for the Band Stand at this year's Monmouthshire Show
(Sunday 16 August), working alongside Jacob Grundy who's our Stage Manager.
We wanted to introduce ourselves as your main points of contact for the
day. I'll be looking after sound and tech on the stage; Jacob handles
staging and keeping the day moving.

To answer your question: yes, there'll be a full PA on the stage and I'll be
running sound for you on the day. So I can set up properly for a
seven-piece, it would help to have a few details ahead of time:
 - An input list — who and what needs a channel (each vocal, the sax, the
   harmonica, and how you'd like the guitars and bass taken: mic, DI, or off
   your own amps), plus the drum mics you'd expect.
 - Whether you're bringing your own mics, DIs and stands, or need any from
   us.
 - Your monitoring — how many monitor mixes you'd like and who needs what.

With a 2:45 slot and a 15-minute changeover it'll be tight, so a stage plan
in advance will make the get-on much smoother. No rush at all, but the
earlier the better.

Looking forward to having you on the stage.

Best,
Dan (and Jacob)
Band Stand — Tech & Stage Management`,
  },
  {
    id: 'crossroads',
    label: 'Crossroads (Tony Forster)',
    to: 'tonyforster55@icloud.com',
    toLabel: 'Tony Forster',
    subject: 'Monmouthshire Show 2026 — Band Stand, and Crossroads closing the day',
    body: `Hello Tony,

I'm Dan, Tech Manager for the Band Stand at this year's Monmouthshire Show
(Sunday 16 August), working alongside Jacob Grundy who's our Stage Manager.
We wanted to introduce ourselves as your main points of contact for the
day. I'll be looking after sound and tech on the stage; Jacob handles
staging and keeping things moving.

I understand you're closing the day from around 4pm and that you're fully
self-sufficient — your own PA and kit, no seating needed. That all sounds
great, and a slightly later start is no problem at all. I just wanted to
confirm there's genuinely nothing you need from us on the day, and to flag
that I'll be on hand to help with the changeover onto the stage when your
slot comes around.

If you could pass me a phone number we can reach you on during the day,
that'd be a help for coordinating the handover.

Looking forward to it.

Best,
Dan (and Jacob)
Band Stand — Tech & Stage Management`,
  },
];

/** Gmail web compose URL, pre-filled with to / cc / subject / body. */
export function gmailComposeUrl(d: EmailDraft): string {
  const p = new URLSearchParams({
    view: 'cm',
    fs: '1',
    cc: CC.join(','),
    su: d.subject,
    body: d.body,
  });
  if (d.to) p.set('to', d.to);
  return `https://mail.google.com/mail/?${p.toString()}`;
}

// ── Live-sound learning track ──────────────────────────────────────────────────
export interface LearnItem { n: number; title: string; note: string; }

export const LEARNING_TRACK: LearnItem[] = [
  {
    n: 1,
    title: 'Gain staging fast, by ear',
    note: 'In theatre you can take your time; live you set a working gain in seconds while someone soundchecks "two, two." Practise setting gain to a healthy level (good signal, headroom before clip) quickly on every input type — dynamic vocal mic, DI, condenser.',
  },
  {
    n: 2,
    title: 'Building a band mix from scratch',
    note: 'Order of operations: kick/drums → bass → rhythm instruments → lead instruments → vocals on top. Get vocals sitting above a full band without them disappearing or feeding back. This is the Vipers skill specifically — seven sources, vocals must win.',
  },
  {
    n: 3,
    title: 'Monitors / foldback',
    note: 'The bit theatre rarely teaches. Performers need to hear themselves via stage wedges fed from aux sends, separate from the FOH mix. Learn to build a monitor mix and manage the extra feedback risk it creates. Ask the Vipers how many mixes they want.',
  },
  {
    n: 4,
    title: 'Ringing out a system',
    note: 'Systematically finding and notching feedback frequencies before the audience arrives. Push a mic until it rings, identify the frequency, cut it, repeat. Do it for every open mic. Your single most useful pre-show skill solo.',
  },
  {
    n: 5,
    title: "Working a digital desk's scenes/snapshots",
    note: 'If BSB are digital: saving and recalling a scene per act is what makes a solo op survive tight changeovers. Learn save/recall, channel libraries, and safe-ing channels so a recall doesn\'t kill something mid-show. (Skip if analogue — then it\'s about a written recall sheet instead.)',
  },
  {
    n: 6,
    title: 'Mixing outdoors',
    note: 'No walls = less reflection and feedback, but also less reinforcement and wind/temperature affecting things. You generally push a bit more level and worry less about room ring, but watch wind noise on mics (use the band\'s windshields) and that the mix doesn\'t get thin in open air.',
  },
];

// ── Stage plot / input list template ───────────────────────────────────────────
export interface PlotRow {
  ch: string; source: string; type: string; mic: string;
  stand: string; phantom: string; monitor: string; notes: string;
}

export const PLOT_ROWS: PlotRow[] = [
  { ch: '1', source: 'Kick', type: 'Drum', mic: 'e.g. dynamic kick mic', stand: 'Short boom', phantom: 'No', monitor: '—', notes: 'From band' },
  { ch: '2', source: 'Snare', type: 'Drum', mic: 'Dynamic', stand: 'Clip/short', phantom: 'No', monitor: '—', notes: '' },
  { ch: '3', source: 'Overheads', type: 'Drum', mic: 'Condenser pair', stand: 'Tall boom', phantom: 'Yes', monitor: '—', notes: '' },
  { ch: '4', source: 'Bass', type: 'DI / amp', mic: 'DI box', stand: '—', phantom: 'Maybe', monitor: '—', notes: 'Angela' },
  { ch: '5', source: 'Lead guitar', type: 'Amp / DI', mic: 'Mic on amp?', stand: 'Short boom', phantom: 'No', monitor: 'Mix 1?', notes: 'Tim' },
  { ch: '6', source: 'Rhythm guitar', type: 'Amp / DI', mic: 'Mic on amp?', stand: 'Short boom', phantom: 'No', monitor: '—', notes: 'Tony' },
  { ch: '7', source: 'Harmonica', type: 'Vocal mic', mic: 'Dynamic', stand: 'Tall boom', phantom: 'No', monitor: 'Mix 1?', notes: "'Mad Mike'" },
  { ch: '8', source: 'Sax', type: 'Mic / clip', mic: 'Dynamic/clip', stand: 'Tall boom', phantom: 'Maybe', monitor: '—', notes: 'Richard' },
  { ch: '9', source: 'Lead vocal', type: 'Vocal', mic: 'Dynamic', stand: 'Tall boom', phantom: 'No', monitor: 'Mix 1', notes: 'Niki — must sit on top' },
  { ch: '10', source: 'Vocal 2', type: 'Vocal', mic: 'Dynamic', stand: 'Tall boom', phantom: 'No', monitor: 'Mix 1', notes: 'Tony / others' },
  { ch: '—', source: 'Announce mic', type: 'Vocal', mic: 'Handheld', stand: '—', phantom: 'No', monitor: '—', notes: 'Shared / choir slots' },
];
