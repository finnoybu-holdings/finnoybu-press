// Drizzle schema for SQLite / Cloudflare D1.
//
// Layout:
//   - Better Auth managed tables (user, session, account, verification) —
//     names and column shapes match Better Auth's expected adapter contract.
//   - App tables: purchases (Stripe-backed digital purchases).
//
// Conventions:
//   - Primary keys are text UUIDs.
//   - Timestamps stored as INTEGER (epoch ms) via Drizzle's `mode: "timestamp"`.
//   - Row-level ownership is enforced in app code, not RLS (SQLite has none).

import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// =============================================================================
// Better Auth tables
// =============================================================================

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  name: text('name'),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// =============================================================================
// App tables
// =============================================================================

// Records each digital grant (book or toolkit) a user owns. Bundles expand
// into multiple rows at webhook time, so ownership checks become a flat
// per-slug lookup. `book_slug` is historical — it holds any item slug;
// `product_id` differentiates 'pdf-epub' (books) from 'toolkit-pdf' (toolkits).
export const purchases = sqliteTable(
  'purchases',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    bookSlug: text('book_slug').notNull(),
    productId: text('product_id').notNull().default('pdf-epub'),
    stripeSessionId: text('stripe_session_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => ({
    // Idempotency for the Stripe webhook: replaying the same session_id
    // for the same slug must not double-grant.
    sessionSlugUniq: uniqueIndex('purchases_session_slug_uniq').on(
      t.stripeSessionId,
      t.bookSlug,
    ),
    userIdx: index('purchases_user_idx').on(t.userId),
    userBookIdx: index('purchases_user_book_idx').on(t.userId, t.bookSlug),
  }),
);

// Re-exported types for app use.
export type User = typeof user.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
