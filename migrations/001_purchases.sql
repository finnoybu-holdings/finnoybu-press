-- Finnoybu Press commerce schema
-- Run in Supabase SQL editor (Project → SQL Editor → New query)

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  book_slug text not null,
  product_id text not null default 'pdf-epub',
  stripe_session_id text not null,
  amount_cents int not null,
  currency text not null default 'usd',
  created_at timestamptz default now()
);

create index if not exists purchases_user_id_idx on purchases(user_id);
create index if not exists purchases_user_book_idx on purchases(user_id, book_slug);
create unique index if not exists purchases_session_book_idx on purchases(stripe_session_id, book_slug);

alter table purchases enable row level security;

-- Users can read their own purchases
drop policy if exists "Users read own purchases" on purchases;
create policy "Users read own purchases" on purchases
  for select using (auth.uid() = user_id);

-- Inserts come exclusively from the webhook (server-side, using service-role key
-- which bypasses RLS). No insert policy granted to authenticated users.
