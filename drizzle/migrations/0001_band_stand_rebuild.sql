-- Band Stand rebuild — adds live status, planned-vs-working times, and the
-- build-up tooling tables (channels, chase list, contacts, locations, walk-around notes).

-- ── acts: live day-of status ─────────────────────────────────────────────────
ALTER TABLE `acts` ADD COLUMN `status` text DEFAULT 'expected' NOT NULL;--> statement-breakpoint
ALTER TABLE `acts` ADD COLUMN `status_updated_at` text;--> statement-breakpoint

-- ── timeline_slots: planned vs working times, live actuals, open-ended ────────
ALTER TABLE `timeline_slots` ADD COLUMN `planned_start_time` text;--> statement-breakpoint
ALTER TABLE `timeline_slots` ADD COLUMN `planned_end_time` text;--> statement-breakpoint
ALTER TABLE `timeline_slots` ADD COLUMN `actual_start_time` text;--> statement-breakpoint
ALTER TABLE `timeline_slots` ADD COLUMN `finished_at` text;--> statement-breakpoint
ALTER TABLE `timeline_slots` ADD COLUMN `open_ended` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `timeline_slots` SET `planned_start_time` = `start_time` WHERE `planned_start_time` IS NULL;--> statement-breakpoint
UPDATE `timeline_slots` SET `planned_end_time` = `end_time` WHERE `planned_end_time` IS NULL;--> statement-breakpoint

-- ── channels (BSB input list per act) ─────────────────────────────────────────
CREATE TABLE `channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`act_id` integer NOT NULL,
	`channel_no` integer DEFAULT 1 NOT NULL,
	`source` text NOT NULL,
	`input_type` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`act_id`) REFERENCES `acts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "channels_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);--> statement-breakpoint

-- ── chase_items (outstanding info) ────────────────────────────────────────────
CREATE TABLE `chase_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`act_id` integer,
	`label` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`done_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`act_id`) REFERENCES `acts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chase_items_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);--> statement-breakpoint

-- ── contacts (non-act directory) ──────────────────────────────────────────────
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`org` text,
	`phone` text,
	`email` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	CONSTRAINT "contacts_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);--> statement-breakpoint

-- ── locations (site schematic) ────────────────────────────────────────────────
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'place' NOT NULL,
	`notes` text,
	`pos_x` integer,
	`pos_y` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	CONSTRAINT "locations_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);--> statement-breakpoint

-- ── walkaround_notes (site walk log) ──────────────────────────────────────────
CREATE TABLE `walkaround_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body` text NOT NULL,
	`author` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "walkaround_notes_author_viewer" CHECK(author IS NULL OR author IN ('Dan','Jacob','Steph'))
);
