# Changelog

All notable changes to ShowRunner are documented here.
Format: [Conventional Commits](https://www.conventionalcommits.org/). Dates ISO 8601 (yyyy-mm-dd), Europe/London.

## [Unreleased]

### feat — Band Stand rebuild (v1.0.0)
- Rebrand to **Band Stand** with the show's identity (deep green + gold, light/high-contrast for a bright field) and a new app icon set + PWA manifest
- **Offline-first data layer** (`store.tsx`): local cache + mutation outbox that queues edits and merges on reconnect; single `GET /api/bootstrap` primes everything; offline-first service worker (network-first API with cache fallback, cached app shell)
- **Smart home**: build-up (days-to-go, chase/tasks/unconfirmed focus) auto-switches to the live show-day board; per-device preview toggle to test it early
- **Live "Now & Next" board**: current act + second-by-second countdown, on-screen overrun banner, next act *with its needs*, behind/ahead-vs-plan, tap-to-advance (`/api/timeline/:id/start` · `/finish`)
- **Running order**: working-vs-planned times with live drift, "push this & later acts", reorder, open-ended final slot, print run-sheet, `.ics` export
- **Acts**: full lifecycle status (expected→arrived→setup→soundchecked→performing→done), PA/mic/power/seating, editable **per-act BSB input/channel list**, tap-to-call/text/email
- New build-up tools: **chase list**, **contacts directory**, **walk-around notes**, **site map** (schematic with tappable pins), **shared scratchpad**
- Corrected roles (Dan = Tech Manager, Jacob = Stage Manager, Steph = Show Chair & Liaison; no MC) and re-seeded acts/contacts/timeline from Steph's brief and the act email threads
- Schema migration `0001_band_stand_rebuild` (act status, planned/actual times, open-ended slots; new `channels`, `chase_items`, `contacts`, `locations`, `walkaround_notes` tables)

### fix
- `gmail_contacts` setting now stored as the JSON array the sync Worker expects (was a comma-separated string that broke `JSON.parse`)
- `npm run dev` no longer binds an empty `--d1=DB`; it reads the D1 binding from `wrangler.toml` so dev uses the migrated/seeded database


### feat
- Phase 6: iCal feed (`GET /api/ical`) — downloadable `.ics` with all Band Stand slots; print stylesheet for run-of-day timeline; export toolbar with iCal + Print buttons on Timeline tab
- Phase 5: Gmail OAuth helper script (`npm run oauth:gmail`) — local consent server, token exchange, prints `wrangler secret put` commands; Gmail cron Worker — 15-min sync of threads/messages into D1, upserts via raw SQL `ON CONFLICT DO UPDATE`
- Phase 4: complete mobile-first SPA — person-select, sticky tab bar, Timeline (inline edit, show-day "now" indicator), Acts/Tech tracker (cards, confirmed toggle, notes), Tasks (grouped, filter chips, add task), Emails panel (Dan only, thread + message view), Settings (gmail_label/contacts, switch user)
- Phase 3: full CRUD API — acts, timeline slots, tasks (with reorder endpoints), email threads/messages (read-only), settings (upsert); auto-stamps `doneAt`/`doneBy` on task completion
- Phase 2: Drizzle migration (`0000_bouncy_jigsaw.sql`) and full seed data — 6 acts, 8 timeline slots (incl. Livestock Parade gap), 14 tasks, settings defaults
- Phase 1: project scaffold — Hono + Drizzle on Cloudflare Pages + D1, gmail-sync cron Worker stub, esbuild frontend pipeline, wrangler config, README

## [0.1.0] — 2026-06-19

Initial commit. Repository structure and CLAUDE.md.
