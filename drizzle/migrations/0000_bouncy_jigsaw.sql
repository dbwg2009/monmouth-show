CREATE TABLE `acts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`contact_email_2` text,
	`contact_phone` text,
	`needs_pa` integer DEFAULT false NOT NULL,
	`mic_count` integer DEFAULT 0 NOT NULL,
	`needs_seats` integer DEFAULT false NOT NULL,
	`seats_notes` text,
	`power_sockets` text,
	`setup_mins` integer DEFAULT 0 NOT NULL,
	`performer_count` text,
	`fee_pence` integer,
	`confirmed` integer DEFAULT false NOT NULL,
	`notes` text,
	`website_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	CONSTRAINT "acts_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);
--> statement-breakpoint
CREATE TABLE `email_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` integer NOT NULL,
	`gmail_message_id` text NOT NULL,
	`from_addr` text NOT NULL,
	`to_addrs` text NOT NULL,
	`subject` text NOT NULL,
	`body_html` text,
	`body_text` text,
	`sent_at` text NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `email_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_messages_gmail_message_id_unique` ON `email_messages` (`gmail_message_id`);--> statement-breakpoint
CREATE TABLE `email_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gmail_thread_id` text NOT NULL,
	`subject` text NOT NULL,
	`participants` text NOT NULL,
	`last_message_at` text NOT NULL,
	`snippet` text,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_threads_gmail_thread_id_unique` ON `email_threads` (`gmail_thread_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`assignee` text,
	`due_date` text,
	`done` integer DEFAULT false NOT NULL,
	`done_at` text,
	`done_by` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	CONSTRAINT "tasks_assignee_viewer" CHECK(assignee IS NULL OR assignee IN ('Dan','Jacob','Steph')),
	CONSTRAINT "tasks_done_by_viewer" CHECK(done_by IS NULL OR done_by IN ('Dan','Jacob','Steph')),
	CONSTRAINT "tasks_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);
--> statement-breakpoint
CREATE TABLE `timeline_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`act_id` integer,
	`act_name` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`date` text NOT NULL,
	`is_gap` integer DEFAULT false NOT NULL,
	`gap_reason` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`act_id`) REFERENCES `acts`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "timeline_slots_updated_by_viewer" CHECK(updated_by IS NULL OR updated_by IN ('Dan','Jacob','Steph'))
);
