# Changelog

All notable changes to ShowRunner are documented here.
Format: [Conventional Commits](https://www.conventionalcommits.org/). Dates ISO 8601 (yyyy-mm-dd), Europe/London.

## [Unreleased]

### feat
- Phase 6: iCal feed (`GET /api/ical`) — downloadable `.ics` with all Band Stand slots; print stylesheet for run-of-day timeline; export toolbar with iCal + Print buttons on Timeline tab
- Phase 5: Gmail OAuth helper script (`npm run oauth:gmail`) — local consent server, token exchange, prints `wrangler secret put` commands; Gmail cron Worker — 15-min sync of threads/messages into D1, upserts via raw SQL `ON CONFLICT DO UPDATE`
- Phase 4: complete mobile-first SPA — person-select, sticky tab bar, Timeline (inline edit, show-day "now" indicator), Acts/Tech tracker (cards, confirmed toggle, notes), Tasks (grouped, filter chips, add task), Emails panel (Dan only, thread + message view), Settings (gmail_label/contacts, switch user)
- Phase 3: full CRUD API — acts, timeline slots, tasks (with reorder endpoints), email threads/messages (read-only), settings (upsert); auto-stamps `doneAt`/`doneBy` on task completion
- Phase 2: Drizzle migration (`0000_bouncy_jigsaw.sql`) and full seed data — 6 acts, 8 timeline slots (incl. Livestock Parade gap), 14 tasks, settings defaults
- Phase 1: project scaffold — Hono + Drizzle on Cloudflare Pages + D1, gmail-sync cron Worker stub, esbuild frontend pipeline, wrangler config, README

## [0.1.0] — 2026-06-19

Initial commit. Repository structure and CLAUDE.md.
