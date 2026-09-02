import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`ai_addon_purchases\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`user\` text NOT NULL,
  	\`client\` text,
  	\`addonId\` text,
  	\`credits\` real NOT NULL,
  	\`amount\` real,
  	\`currency\` text DEFAULT 'USD',
  	\`paymentProvider\` text,
  	\`paymentId\` text,
  	\`status\` text DEFAULT 'pending' NOT NULL,
  	\`metadata\` text DEFAULT '{}',
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE INDEX \`ai_addon_purchases_user_idx\` ON \`ai_addon_purchases\` (\`user\`);`)
  await db.run(sql`CREATE TABLE \`ai_credit_addons\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`user\` text NOT NULL,
  	\`client\` text,
  	\`creditsTotal\` real NOT NULL,
  	\`creditsUsed\` real DEFAULT 0 NOT NULL,
  	\`purchaseId\` text,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE INDEX \`ai_credit_addons_status_idx\` ON \`ai_credit_addons\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`ai_credit_addons_user_idx\` ON \`ai_credit_addons\` (\`user\`);`)
  await db.run(sql`CREATE TABLE \`ai_logs\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`model\` text,
  	\`totalDuration\` real,
  	\`error\` text,
  	\`totalTokens\` real,
  	\`tokenUsage\` text,
  	\`user\` text,
  	\`client\` text,
  	\`cost\` real DEFAULT 0,
  	\`prompt\` text,
  	\`app\` text,
  	\`creditSource\` text DEFAULT 'monthly',
  	\`addonId\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action,
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE INDEX \`ai_logs_addon_id_idx\` ON \`ai_logs\` (\`addonId\`);`)
  await db.run(sql`CREATE INDEX \`ai_logs_credit_source_idx\` ON \`ai_logs\` (\`creditSource\`);`)
  await db.run(sql`CREATE TABLE \`app_api_keys\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`apiKey\` text DEFAULT '',
  	\`app\` text,
  	\`status\` text DEFAULT 'ACTIVE',
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_assets\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`app\` text,
  	\`name\` text,
  	\`url\` text,
  	\`size\` text,
  	\`folderId\` text,
  	\`thumbnailUrl\` text,
  	\`duration\` real,
  	\`format\` text,
  	\`width\` real,
  	\`height\` real,
  	\`createdBy\` text,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`type\` text,
  	\`updatedAt\` text,
  	\`description\` text DEFAULT '{}',
  	\`deletedAt\` text,
  	\`deletedBy\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_domains\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`app\` text,
  	\`hosting\` text DEFAULT 'vercel',
  	\`hostingProjectId\` text DEFAULT 'env',
  	\`subdomain\` text,
  	\`domain\` text,
  	\`domainConfigured\` integer DEFAULT false,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_form_submissions\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`app\` text,
  	\`formData\` text,
  	\`additionalData\` text,
  	\`formName\` text DEFAULT '',
  	\`pageUrl\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_pages\` (
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`slug\` text NOT NULL,
  	\`lang\` text DEFAULT '' NOT NULL,
  	\`seo\` text DEFAULT '{}',
  	\`app\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`primaryPage\` text,
  	\`blocks\` text DEFAULT '[]',
  	\`currentEditor\` text,
  	\`changes\` text,
  	\`online\` integer DEFAULT false,
  	\`parent\` text,
  	\`pageType\` text,
  	\`lastSaved\` text,
  	\`dynamic\` integer DEFAULT false,
  	\`libRefId\` text,
  	\`dynamicSlugCustom\` text DEFAULT '',
  	\`metadata\` text DEFAULT '{}',
  	\`jsonld\` text DEFAULT '{}',
  	\`globalJsonLds\` text DEFAULT '[]',
  	\`links\` text,
  	\`partialBlocks\` text,
  	\`designTokens\` text,
  	\`ai\` text DEFAULT '{}',
  	\`deletedAt\` text,
  	\`deletedBy\` text,
  	\`createdBy\` text,
  	\`tracking\` text DEFAULT '{}',
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action,
  	FOREIGN KEY (\`parent\`) REFERENCES \`app_pages\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE INDEX \`idx_app_pages_app_slug\` ON \`app_pages\` (\`app\`,\`slug\`);`)
  await db.run(sql`CREATE TABLE \`app_pages_online\` (
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`slug\` text NOT NULL,
  	\`lang\` text DEFAULT '' NOT NULL,
  	\`seo\` text DEFAULT '{}',
  	\`app\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`primaryPage\` text,
  	\`blocks\` text DEFAULT '[]',
  	\`currentEditor\` text,
  	\`changes\` text,
  	\`partialBlocks\` text,
  	\`links\` text,
  	\`online\` integer DEFAULT true,
  	\`pageType\` text,
  	\`parent\` text,
  	\`lastSaved\` text,
  	\`dynamic\` integer DEFAULT false,
  	\`libRefId\` text,
  	\`dynamicSlugCustom\` text DEFAULT '',
  	\`metadata\` text DEFAULT '{}',
  	\`jsonld\` text DEFAULT '{}',
  	\`globalJsonLds\` text DEFAULT '[]',
  	\`designTokens\` text,
  	\`ai\` text DEFAULT '{}',
  	\`createdBy\` text DEFAULT '',
  	\`deletedAt\` text,
  	\`deletedBy\` text,
  	\`tracking\` text DEFAULT '{}',
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE INDEX \`idx_app_pages_online_app_slug\` ON \`app_pages_online\` (\`app\`,\`slug\`);`)
  await db.run(sql`CREATE TABLE \`app_pages_revisions\` (
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`slug\` text NOT NULL,
  	\`lang\` text DEFAULT '' NOT NULL,
  	\`seo\` text DEFAULT '{}',
  	\`app\` text NOT NULL,
  	\`id\` text NOT NULL,
  	\`name\` text NOT NULL,
  	\`primaryPage\` text,
  	\`blocks\` text DEFAULT '[]',
  	\`currentEditor\` text,
  	\`changes\` text,
  	\`partialBlocks\` text,
  	\`links\` text,
  	\`online\` integer DEFAULT true,
  	\`pageType\` text,
  	\`parent\` text,
  	\`lastSaved\` text,
  	\`dynamic\` integer DEFAULT false,
  	\`uid\` text PRIMARY KEY NOT NULL,
  	\`type\` text,
  	\`libRefId\` text,
  	\`dynamicSlugCustom\` text DEFAULT '',
  	\`metadata\` text DEFAULT '{}',
  	\`jsonld\` text DEFAULT '{}',
  	\`globalJsonLds\` text DEFAULT '[]',
  	\`designTokens\` text,
  	\`ai\` text DEFAULT '{}',
  	\`createdBy\` text,
  	\`deletedBy\` text,
  	\`deletedAt\` text,
  	\`tracking\` text DEFAULT '{}',
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_redirects\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`updatedAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`app\` text NOT NULL,
  	\`fromPath\` text NOT NULL,
  	\`toPath\` text NOT NULL,
  	\`permanent\` integer DEFAULT true NOT NULL,
  	\`active\` integer DEFAULT true NOT NULL,
  	\`createdBy\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE INDEX \`idx_app_redirects_app_toPath\` ON \`app_redirects\` (\`app\`,\`toPath\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`app_redirects_app_fromPath_unique\` ON \`app_redirects\` (\`app\`,\`fromPath\`);`)
  await db.run(sql`CREATE TABLE \`app_trash\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`deletedAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`deletedBy\` text,
  	\`entityType\` text NOT NULL,
  	\`entityId\` text,
  	\`metadata\` text DEFAULT '{}',
  	\`app\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_user_addons\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')),
  	\`addonId\` text NOT NULL,
  	\`client\` text,
  	\`user\` text,
  	\`status\` text DEFAULT 'active',
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_user_plans\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`user\` text,
  	\`planId\` text DEFAULT 'FREE',
  	\`nextBilledAt\` text NOT NULL,
  	\`subscriptionId\` text,
  	\`client\` text,
  	\`scheduledForCancellation\` integer DEFAULT false,
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`app_users\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`user\` text,
  	\`app\` text,
  	\`role\` text,
  	\`permissions\` text,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`apps\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`name\` text,
  	\`user\` text,
  	\`settings\` text DEFAULT '{}',
  	\`theme\` text DEFAULT '{}',
  	\`fallbackLang\` text DEFAULT 'en',
  	\`languages\` text DEFAULT '[]',
  	\`changes\` text,
  	\`deletedAt\` text,
  	\`client\` text,
  	\`designTokens\` text DEFAULT '{}',
  	\`ai\` text DEFAULT '{}',
  	\`configData\` text DEFAULT '{}',
  	\`consentConfig\` text DEFAULT '{}',
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`apps_online\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`name\` text,
  	\`user\` text,
  	\`settings\` text DEFAULT '{}',
  	\`theme\` text DEFAULT '{}',
  	\`fallbackLang\` text DEFAULT 'en',
  	\`languages\` text DEFAULT '[]',
  	\`changes\` text,
  	\`apiKey\` text,
  	\`deletedAt\` text,
  	\`client\` text,
  	\`designTokens\` text DEFAULT '{}',
  	\`ai\` text DEFAULT '{}',
  	\`configData\` text DEFAULT '{}',
  	\`consentConfig\` text DEFAULT '{}',
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`client_users\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`user\` text,
  	\`client\` text,
  	\`data\` text DEFAULT '{}',
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`client_users_user_client_unique\` ON \`client_users\` (\`user\`,\`client\`);`)
  await db.run(sql`CREATE TABLE \`clients\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`name\` text,
  	\`status\` text DEFAULT 'active',
  	\`billingStartDate\` text,
  	\`startDate\` text,
  	\`settings\` text DEFAULT '{}',
  	\`loginHtml\` text,
  	\`features\` text DEFAULT '{}',
  	\`paymentConfig\` text DEFAULT '{}',
  	\`theme\` text,
  	\`helpHtml\` text,
  	\`madeWithBadge\` text,
  	\`superAdmins\` text DEFAULT '[]',
  	\`ai\` text DEFAULT '{"models":[]}',
  	\`plansAndAddOns\` text DEFAULT '{"plans":[],"addOns":[],"provider":"DODO","paymentEnv":"sandbox"}',
  	\`rolesAndPermissions\` text DEFAULT '{"admin":{"permissions":{"*":true}},"editor":{"permissions":{"*":false}},"designer":{"permissions":{"*":false}}}',
  	\`coreFeatures\` text DEFAULT '{"ai":true,"email":false,"api_access":false,"multi_user":false,"export_code":true,"import_html":true,"multilingual":false,"revision_and_restore":false}',
  	\`envs\` text DEFAULT '{"payment":{"live":{"client":"","server":""},"sandbox":{"client":"","server":""}}}'
  );
  `)
  await db.run(sql`CREATE TABLE \`invited_users\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`email\` text,
  	\`client\` text,
  	\`status\` text DEFAULT 'invited',
  	\`app\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action,
  	FOREIGN KEY (\`client\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`libraries\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`name\` text,
  	\`app\` text,
  	\`type\` text,
  	\`status\` text DEFAULT 'active' NOT NULL,
  	\`client\` text,
  	FOREIGN KEY (\`app\`) REFERENCES \`apps\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`library_items\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`library\` text,
  	\`name\` text,
  	\`description\` text,
  	\`blocks\` text DEFAULT '[]',
  	\`preview\` text,
  	\`group\` text DEFAULT 'general',
  	\`user\` text,
  	\`html\` text,
  	\`deletedAt\` text,
  	\`deletedBy\` text,
  	\`createdBy\` text,
  	FOREIGN KEY (\`library\`) REFERENCES \`libraries\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`library_templates\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`user\` text,
  	\`name\` text,
  	\`description\` text,
  	\`pageId\` text,
  	\`pageType\` text,
  	\`library\` text,
  	\`preview\` text,
  	\`deletedAt\` text,
  	\`createdBy\` text,
  	\`deletedBy\` text,
  	FOREIGN KEY (\`library\`) REFERENCES \`libraries\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`roles\` (
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`name\` text NOT NULL,
  	\`label\` text,
  	\`permissions\` text DEFAULT '[]' NOT NULL,
  	\`isSystem\` integer DEFAULT false NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`roles_name_unique\` ON \`roles\` (\`name\`);`)
  await db.run(sql`CREATE TABLE \`webhook_events\` (
  	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  	\`createdAt\` text DEFAULT (datetime('now')) NOT NULL,
  	\`provider\` text,
  	\`eventType\` text,
  	\`payload\` text,
  	\`userId\` text,
  	\`clientId\` text,
  	FOREIGN KEY (\`clientId\`) REFERENCES \`clients\`(\`id\`) ON UPDATE no action ON DELETE no action
  );
  `)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`first_name\` text,
  	\`last_name\` text,
  	\`role\` text DEFAULT 'none',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`blog\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`app\` text,
  	\`hero_image_id\` text(36),
  	\`published_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_hero_image_idx\` ON \`blog\` (\`hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_updated_at_idx\` ON \`blog\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_created_at_idx\` ON \`blog\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`blog__status_idx\` ON \`blog\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`blog_locales\` (
  	\`title\` text,
  	\`slug\` text,
  	\`content\` text DEFAULT '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","detail":0,"format":0,"mode":"normal","style":"","text":"","version":1}],"direction":null,"format":"","indent":0,"textFormat":0,"textStyle":"","version":1}],"direction":null,"format":"","indent":0,"version":1}}',
  	\`excerpt\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` text(36),
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`blog\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_slug_idx\` ON \`blog_locales\` (\`slug\`,\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`blog_meta_meta_image_idx\` ON \`blog_locales\` (\`meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_locales_locale_parent_id_unique\` ON \`blog_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`blog_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text(36) NOT NULL,
  	\`path\` text NOT NULL,
  	\`blog_categories_id\` text(36),
  	\`users_id\` text(36),
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`blog\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`blog_categories_id\`) REFERENCES \`blog_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_rels_order_idx\` ON \`blog_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`blog_rels_parent_idx\` ON \`blog_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_rels_path_idx\` ON \`blog_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`blog_rels_blog_categories_id_idx\` ON \`blog_rels\` (\`blog_categories_id\`);`)
  await db.run(sql`CREATE INDEX \`blog_rels_users_id_idx\` ON \`blog_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`_blog_v\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`parent_id\` text(36),
  	\`version_app\` text,
  	\`version_hero_image_id\` text(36),
  	\`version_published_at\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`blog\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_blog_v_parent_idx\` ON \`_blog_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_version_version_hero_image_idx\` ON \`_blog_v\` (\`version_hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_version_version_updated_at_idx\` ON \`_blog_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_version_version_created_at_idx\` ON \`_blog_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_version_version__status_idx\` ON \`_blog_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_created_at_idx\` ON \`_blog_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_updated_at_idx\` ON \`_blog_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_snapshot_idx\` ON \`_blog_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_published_locale_idx\` ON \`_blog_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_latest_idx\` ON \`_blog_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_blog_v_locales\` (
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_content\` text DEFAULT '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","detail":0,"format":0,"mode":"normal","style":"","text":"","version":1}],"direction":null,"format":"","indent":0,"textFormat":0,"textStyle":"","version":1}],"direction":null,"format":"","indent":0,"version":1}}',
  	\`version_excerpt\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` text(36),
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_blog_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_blog_v_version_version_slug_idx\` ON \`_blog_v_locales\` (\`version_slug\`,\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_version_meta_version_meta_image_idx\` ON \`_blog_v_locales\` (\`version_meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_blog_v_locales_locale_parent_id_unique\` ON \`_blog_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_blog_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text(36) NOT NULL,
  	\`path\` text NOT NULL,
  	\`blog_categories_id\` text(36),
  	\`users_id\` text(36),
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_blog_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`blog_categories_id\`) REFERENCES \`blog_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_blog_v_rels_order_idx\` ON \`_blog_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_rels_parent_idx\` ON \`_blog_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_rels_path_idx\` ON \`_blog_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_rels_blog_categories_id_idx\` ON \`_blog_v_rels\` (\`blog_categories_id\`);`)
  await db.run(sql`CREATE INDEX \`_blog_v_rels_users_id_idx\` ON \`_blog_v_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`blog_categories\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`app\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE INDEX \`blog_categories_updated_at_idx\` ON \`blog_categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_categories_created_at_idx\` ON \`blog_categories\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`blog_categories__status_idx\` ON \`blog_categories\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`blog_categories_locales\` (
  	\`name\` text,
  	\`slug\` text,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`blog_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_categories_slug_idx\` ON \`blog_categories_locales\` (\`slug\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_categories_locales_locale_parent_id_unique\` ON \`blog_categories_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_blog_categories_v\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`parent_id\` text(36),
  	\`version_app\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`blog_categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_parent_idx\` ON \`_blog_categories_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_version_version_updated_at_idx\` ON \`_blog_categories_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_version_version_created_at_idx\` ON \`_blog_categories_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_version_version__status_idx\` ON \`_blog_categories_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_created_at_idx\` ON \`_blog_categories_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_updated_at_idx\` ON \`_blog_categories_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_snapshot_idx\` ON \`_blog_categories_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_published_locale_idx\` ON \`_blog_categories_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_latest_idx\` ON \`_blog_categories_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_blog_categories_v_locales\` (
  	\`version_name\` text,
  	\`version_slug\` text,
  	\`version_description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_blog_categories_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_blog_categories_v_version_version_slug_idx\` ON \`_blog_categories_v_locales\` (\`version_slug\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_blog_categories_v_locales_locale_parent_id_unique\` ON \`_blog_categories_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`app\` text NOT NULL,
  	\`deleted_at\` text,
  	\`deleted_by\` text,
  	\`prefix\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`media_locales\` (
  	\`alt\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`media_locales_locale_parent_id_unique\` ON \`media_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_config_social_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_config\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_config_social_links_order_idx\` ON \`site_config_social_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_config_social_links_parent_id_idx\` ON \`site_config_social_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_config\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`app\` text,
  	\`logo_id\` text(36),
  	\`favicon_id\` text(36),
  	\`contact_email\` text,
  	\`contact_phone\` text,
  	\`physical_address_zip\` text,
  	\`physical_address_location\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`favicon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_config_logo_idx\` ON \`site_config\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_config_favicon_idx\` ON \`site_config\` (\`favicon_id\`);`)
  await db.run(sql`CREATE INDEX \`site_config_updated_at_idx\` ON \`site_config\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`site_config_created_at_idx\` ON \`site_config\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`site_config__status_idx\` ON \`site_config\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`site_config_locales\` (
  	\`name\` text,
  	\`tagline\` text,
  	\`physical_address_address_line1\` text,
  	\`physical_address_address_line2\` text,
  	\`physical_address_city\` text,
  	\`physical_address_state\` text,
  	\`privacy_policy_page\` text,
  	\`terms_of_services_page\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` text(36),
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_config\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_config_meta_meta_image_idx\` ON \`site_config_locales\` (\`meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`site_config_locales_locale_parent_id_unique\` ON \`site_config_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_config_v_version_social_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`platform\` text,
  	\`url\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_config_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_social_links_order_idx\` ON \`_site_config_v_version_social_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_social_links_parent_id_idx\` ON \`_site_config_v_version_social_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_config_v\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`parent_id\` text(36),
  	\`version_app\` text,
  	\`version_logo_id\` text(36),
  	\`version_favicon_id\` text(36),
  	\`version_contact_email\` text,
  	\`version_contact_phone\` text,
  	\`version_physical_address_zip\` text,
  	\`version_physical_address_location\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site_config\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_favicon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_config_v_parent_idx\` ON \`_site_config_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_version_logo_idx\` ON \`_site_config_v\` (\`version_logo_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_version_favicon_idx\` ON \`_site_config_v\` (\`version_favicon_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_version_updated_at_idx\` ON \`_site_config_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_version_created_at_idx\` ON \`_site_config_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_version__status_idx\` ON \`_site_config_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_created_at_idx\` ON \`_site_config_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_updated_at_idx\` ON \`_site_config_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_snapshot_idx\` ON \`_site_config_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_published_locale_idx\` ON \`_site_config_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_site_config_v_latest_idx\` ON \`_site_config_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_site_config_v_locales\` (
  	\`version_name\` text,
  	\`version_tagline\` text,
  	\`version_physical_address_address_line1\` text,
  	\`version_physical_address_address_line2\` text,
  	\`version_physical_address_city\` text,
  	\`version_physical_address_state\` text,
  	\`version_privacy_policy_page\` text,
  	\`version_terms_of_services_page\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` text(36),
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_config_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_config_v_version_meta_version_meta_image_idx\` ON \`_site_config_v_locales\` (\`version_meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_site_config_v_locales_locale_parent_id_unique\` ON \`_site_config_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`form_submissions\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`app\` text NOT NULL,
  	\`form_name\` text NOT NULL,
  	\`page_url\` text,
  	\`form_data\` text NOT NULL,
  	\`additional_data\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`menus_items_children\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'page',
  	\`url\` text,
  	\`open_in_new_tab\` integer DEFAULT false,
  	\`icon\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menus_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menus_items_children_order_idx\` ON \`menus_items_children\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menus_items_children_parent_id_idx\` ON \`menus_items_children\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`menus_items_children_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menus_items_children\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`menus_items_children_locales_locale_parent_id_unique\` ON \`menus_items_children_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`menus_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'page',
  	\`url\` text,
  	\`open_in_new_tab\` integer DEFAULT false,
  	\`icon\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menus\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menus_items_order_idx\` ON \`menus_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menus_items_parent_id_idx\` ON \`menus_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`menus_items_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menus_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`menus_items_locales_locale_parent_id_unique\` ON \`menus_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`menus\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`app\` text,
  	\`name\` text,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE INDEX \`menus_updated_at_idx\` ON \`menus\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`menus_created_at_idx\` ON \`menus\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`menus__status_idx\` ON \`menus\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_menus_v_version_items_children\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'page',
  	\`url\` text,
  	\`open_in_new_tab\` integer DEFAULT false,
  	\`icon\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_menus_v_version_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_menus_v_version_items_children_order_idx\` ON \`_menus_v_version_items_children\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_version_items_children_parent_id_idx\` ON \`_menus_v_version_items_children\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_menus_v_version_items_children_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_menus_v_version_items_children\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_menus_v_version_items_children_locales_locale_parent_id_uni\` ON \`_menus_v_version_items_children_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_menus_v_version_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`type\` text DEFAULT 'page',
  	\`url\` text,
  	\`open_in_new_tab\` integer DEFAULT false,
  	\`icon\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_menus_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_menus_v_version_items_order_idx\` ON \`_menus_v_version_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_version_items_parent_id_idx\` ON \`_menus_v_version_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_menus_v_version_items_locales\` (
  	\`label\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_menus_v_version_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_menus_v_version_items_locales_locale_parent_id_unique\` ON \`_menus_v_version_items_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_menus_v\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`parent_id\` text(36),
  	\`version_app\` text,
  	\`version_name\` text,
  	\`version_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`menus\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_menus_v_parent_idx\` ON \`_menus_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_version_version_updated_at_idx\` ON \`_menus_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_version_version_created_at_idx\` ON \`_menus_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_version_version__status_idx\` ON \`_menus_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_created_at_idx\` ON \`_menus_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_updated_at_idx\` ON \`_menus_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_snapshot_idx\` ON \`_menus_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_published_locale_idx\` ON \`_menus_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_menus_v_latest_idx\` ON \`_menus_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text(36) NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` text(36),
  	\`blog_id\` text(36),
  	\`blog_categories_id\` text(36),
  	\`media_id\` text(36),
  	\`site_config_id\` text(36),
  	\`form_submissions_id\` text(36),
  	\`menus_id\` text(36),
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`blog_id\`) REFERENCES \`blog\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`blog_categories_id\`) REFERENCES \`blog_categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`site_config_id\`) REFERENCES \`site_config\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`menus_id\`) REFERENCES \`menus\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blog_id_idx\` ON \`payload_locked_documents_rels\` (\`blog_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blog_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`blog_categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_site_config_id_idx\` ON \`payload_locked_documents_rels\` (\`site_config_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_menus_id_idx\` ON \`payload_locked_documents_rels\` (\`menus_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text(36) NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` text(36),
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`ai_addon_purchases\`;`)
  await db.run(sql`DROP TABLE \`ai_credit_addons\`;`)
  await db.run(sql`DROP TABLE \`ai_logs\`;`)
  await db.run(sql`DROP TABLE \`app_api_keys\`;`)
  await db.run(sql`DROP TABLE \`app_assets\`;`)
  await db.run(sql`DROP TABLE \`app_domains\`;`)
  await db.run(sql`DROP TABLE \`app_form_submissions\`;`)
  await db.run(sql`DROP TABLE \`app_pages\`;`)
  await db.run(sql`DROP TABLE \`app_pages_online\`;`)
  await db.run(sql`DROP TABLE \`app_pages_revisions\`;`)
  await db.run(sql`DROP TABLE \`app_redirects\`;`)
  await db.run(sql`DROP TABLE \`app_trash\`;`)
  await db.run(sql`DROP TABLE \`app_user_addons\`;`)
  await db.run(sql`DROP TABLE \`app_user_plans\`;`)
  await db.run(sql`DROP TABLE \`app_users\`;`)
  await db.run(sql`DROP TABLE \`apps\`;`)
  await db.run(sql`DROP TABLE \`apps_online\`;`)
  await db.run(sql`DROP TABLE \`client_users\`;`)
  await db.run(sql`DROP TABLE \`clients\`;`)
  await db.run(sql`DROP TABLE \`invited_users\`;`)
  await db.run(sql`DROP TABLE \`libraries\`;`)
  await db.run(sql`DROP TABLE \`library_items\`;`)
  await db.run(sql`DROP TABLE \`library_templates\`;`)
  await db.run(sql`DROP TABLE \`roles\`;`)
  await db.run(sql`DROP TABLE \`webhook_events\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`blog\`;`)
  await db.run(sql`DROP TABLE \`blog_locales\`;`)
  await db.run(sql`DROP TABLE \`blog_rels\`;`)
  await db.run(sql`DROP TABLE \`_blog_v\`;`)
  await db.run(sql`DROP TABLE \`_blog_v_locales\`;`)
  await db.run(sql`DROP TABLE \`_blog_v_rels\`;`)
  await db.run(sql`DROP TABLE \`blog_categories\`;`)
  await db.run(sql`DROP TABLE \`blog_categories_locales\`;`)
  await db.run(sql`DROP TABLE \`_blog_categories_v\`;`)
  await db.run(sql`DROP TABLE \`_blog_categories_v_locales\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`media_locales\`;`)
  await db.run(sql`DROP TABLE \`site_config_social_links\`;`)
  await db.run(sql`DROP TABLE \`site_config\`;`)
  await db.run(sql`DROP TABLE \`site_config_locales\`;`)
  await db.run(sql`DROP TABLE \`_site_config_v_version_social_links\`;`)
  await db.run(sql`DROP TABLE \`_site_config_v\`;`)
  await db.run(sql`DROP TABLE \`_site_config_v_locales\`;`)
  await db.run(sql`DROP TABLE \`form_submissions\`;`)
  await db.run(sql`DROP TABLE \`menus_items_children\`;`)
  await db.run(sql`DROP TABLE \`menus_items_children_locales\`;`)
  await db.run(sql`DROP TABLE \`menus_items\`;`)
  await db.run(sql`DROP TABLE \`menus_items_locales\`;`)
  await db.run(sql`DROP TABLE \`menus\`;`)
  await db.run(sql`DROP TABLE \`_menus_v_version_items_children\`;`)
  await db.run(sql`DROP TABLE \`_menus_v_version_items_children_locales\`;`)
  await db.run(sql`DROP TABLE \`_menus_v_version_items\`;`)
  await db.run(sql`DROP TABLE \`_menus_v_version_items_locales\`;`)
  await db.run(sql`DROP TABLE \`_menus_v\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
}
