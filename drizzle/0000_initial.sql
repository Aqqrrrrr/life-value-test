CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `email_verified_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `code_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `consumed_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS `redemption_codes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `code_hash` text NOT NULL UNIQUE,
  `sku` text DEFAULT 'full-report' NOT NULL,
  `status` text DEFAULT 'issued' NOT NULL,
  `source_order_ref` text,
  `expires_at` text,
  `redeemed_by` text,
  `redeemed_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS `entitlements` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `sku` text NOT NULL,
  `source` text DEFAULT 'xiaohongshu' NOT NULL,
  `granted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `revoked_at` text
);
CREATE INDEX IF NOT EXISTS `verification_codes_email_idx` ON `verification_codes` (`email`);
CREATE INDEX IF NOT EXISTS `entitlements_user_idx` ON `entitlements` (`user_id`);
