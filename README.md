# Band Stand — Monmouthshire Show 2026

Offline-first coordinator app for the **Band Stand** at the Monmouthshire Show, **Sunday 16 August 2026** (Monmouthshire Showground, Redbrook Road, Monmouth NP25 4LG — gates 09:00).

Built for the three people running the stage: **Dan** (Tech Manager), **Jacob** (Stage Manager) and **Steph** (Show Chair & Liaison). It works with no signal on the field and syncs between phones when there's a connection.

**Stack:** React 19 (esbuild) · Hono.js · Drizzle ORM · Cloudflare Pages + Pages Functions · D1 (SQLite) · TypeScript strict · PWA (installable, offline service worker)

---

## What it does

- **Smart home screen** — a days-to-go build-up view that flips automatically to the live show-day board on 16 August (or via a per-device preview toggle).
- **Live "Now & Next" board** — big, sunlight-readable: current act + countdown, an on-screen overrun banner, the next act *and its needs*, and a behind/ahead-of-plan readout. You tap to advance when an act actually starts.
- **Running order** — live-editable times with the original plan shown alongside; "push this & later acts" buttons for when things slip; reorder; open-ended final slot; print run-sheet; calendar (.ics) export.
- **Acts** — full lifecycle status (Expected → Arrived → Setting up → Soundchecked → On stage → Done), PA/mic/power/seating, an editable **BSB input/channel list per act**, contacts (tap to call/text/email), fee and notes.
- **Build-up tools** — chase list (outstanding info per act), contacts directory, shared task checklist, site walk-around notes.
- **Extras** — schematic site map with tappable pins, a shared scratchpad, and the synced Gmail threads.
- **Offline-first + sync** — every screen reads from a local cache; edits apply instantly, queue in an outbox, and merge when back online (last-write-wins). One `/api/bootstrap` request primes the whole cache.

---

## Quick start (local dev)

```bash
npm install

# 1) Create the local D1 schema and seed it (do this once)
npm run db:migrate:local
npm run db:seed:local

# 2) Run the dev server (esbuild watch + wrangler pages dev)
npm run dev
# → http://localhost:8788
```

> The dev server reads the D1 binding from `wrangler.toml`, so it uses the **same** local database you migrate/seed above. (If you ever see "no such table", you've migrated a different DB than the one the server is bound to.)

Optional Gmail sync needs OAuth creds:

```bash
cp .dev.vars.example .dev.vars   # fill in GMAIL_CLIENT_ID / SECRET / REFRESH_TOKEN
```

---

## Project structure

```text
├── public/                 Static assets served by Pages
│   ├── index.html          App shell (PWA meta, fonts)
│   ├── styles.css          Design system (show green + gold, sunlight-readable)
│   ├── sw.js               Offline-first service worker
│   ├── manifest.json       PWA manifest + icons
│   └── app.js              Compiled from src/client (gitignored)
├── src/
│   ├── client/
│   │   ├── store.tsx       Offline-first data layer (cache + outbox + sync)
│   │   ├── App.tsx         Shell, nav, viewer picker
│   │   ├── Home.tsx        Smart home + live "Now & Next" board
│   │   ├── RunningOrder.tsx, Acts.tsx, Contacts.tsx, Tasks.tsx,
│   │   ├── Chase.tsx, Walkaround.tsx, SiteMap.tsx, Scratchpad.tsx,
│   │   ├── Emails.tsx, Settings.tsx
│   │   ├── ui.tsx          Icons, status pills, helpers, clock hook
│   │   ├── time.ts         Show-day time/drift helpers
│   │   └── Drawer.tsx      Bottom-sheet + form primitives
│   ├── db/
│   │   ├── schema.ts       Drizzle tables
│   │   └── index.ts        DB factory
│   └── types.ts            Shared types (API + client)
├── functions/
│   └── api/[[route]].ts    Hono catch-all API (incl. /bootstrap, live start/finish)
├── workers/
│   └── gmail-sync/         Standalone cron Worker (15-min Gmail sync)
└── drizzle/
    ├── migrations/         0000 base + 0001 band-stand rebuild
    └── seed.sql            Show seed data (acts, channels, timeline, tasks, chase, contacts, locations)
```

---

## API

All under `/api`. Resources: `acts`, `channels`, `timeline`, `tasks`, `chase`, `contacts`, `locations`, `walkaround` (REST: GET list, POST, PATCH `:id`, DELETE `:id`), plus:

- `GET /api/bootstrap` — everything in one payload (used to prime the offline cache)
- `POST /api/timeline/:id/start` · `POST /api/timeline/:id/finish` — live tap-to-advance
- `POST /api/timeline/reorder` · `POST /api/tasks/reorder`
- `GET /api/emails` · `GET /api/emails/:id` — synced Gmail (read-only)
- `GET /api/settings` · `PATCH /api/settings/:key`
- `GET /api/ical` — downloadable run-of-day `.ics`

---

## Cloudflare deploy

```bash
wrangler d1 create monmouth-show-db    # if not already created; copy the id into both wrangler.toml files
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy                          # builds UI + deploys Pages
wrangler deploy --config workers/gmail-sync/wrangler.toml   # cron Gmail sync
```

Pages project settings: build command `npm run build`, output dir `public`, D1 binding `DB → monmouth-show-db`.

### Gmail sync

The cron Worker queries Gmail every 15 minutes for `label:MonShow OR from:<contact>` and upserts threads/messages into D1. Configure the label and contacts in the in-app **Settings → Gmail sync** (`gmail_contacts` is stored as a JSON array). Set Worker secrets:

```bash
wrangler secret put GMAIL_CLIENT_ID     --config workers/gmail-sync/wrangler.toml
wrangler secret put GMAIL_CLIENT_SECRET --config workers/gmail-sync/wrangler.toml
wrangler secret put GMAIL_REFRESH_TOKEN --config workers/gmail-sync/wrangler.toml
```

Scope: `gmail.readonly`.

---

## Conventions

- Commit format: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- `npm run typecheck` (app + worker) and `npm run build` should pass before pushing
