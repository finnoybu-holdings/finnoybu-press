-- Initial Cloudflare D1 schema for Finnoybu Press.
-- Better Auth managed tables + purchases table.
-- Generated to match src/db/schema.ts; regeneratable via `npm run db:generate`.

CREATE TABLE `user` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `email_verified` integer DEFAULT 0 NOT NULL,
  `name` text,
  `image` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
--> statement-breakpoint

CREATE TABLE `session` (
  `id` text PRIMARY KEY NOT NULL,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
--> statement-breakpoint

CREATE TABLE `account` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer,
  `updated_at` integer
);
--> statement-breakpoint

CREATE TABLE `purchases` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `book_slug` text NOT NULL,
  `product_id` text DEFAULT 'pdf-epub' NOT NULL,
  `stripe_session_id` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `currency` text DEFAULT 'usd' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_session_slug_uniq` ON `purchases` (`stripe_session_id`, `book_slug`);
--> statement-breakpoint
CREATE INDEX `purchases_user_idx` ON `purchases` (`user_id`);
--> statement-breakpoint
CREATE INDEX `purchases_user_book_idx` ON `purchases` (`user_id`, `book_slug`);
