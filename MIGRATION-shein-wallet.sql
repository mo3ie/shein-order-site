-- A wallet for the SHEIN order site, separate from the main store's.
--
-- The shop's wallet (profiles.wallet_balance / wallet_transactions) pays for
-- shop orders. This one pays for SHEIN orders. Keeping them apart is what makes
-- refunds and reconciliation answerable instead of guesswork.
--
-- Safe to run more than once.

alter table public.profiles
  add column if not exists shein_wallet_balance numeric(12,2) not null default 0;

create table if not exists public.shein_wallet_transactions (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in ('topup','debit','refund')),
  amount       numeric(12,2) not null check (amount > 0),
  method       text,
  order_id     bigint,
  note         text,
  balance_after numeric(12,2),
  created_at   timestamptz not null default now()
);

create index if not exists shein_wallet_tx_user_idx
  on public.shein_wallet_transactions (user_id, created_at desc);

-- The balance moves only through the service role in /api/wallet; a customer
-- may read their own history and nothing else.
alter table public.shein_wallet_transactions enable row level security;

drop policy if exists "own shein wallet history" on public.shein_wallet_transactions;
create policy "own shein wallet history"
  on public.shein_wallet_transactions for select
  using (auth.uid() = user_id);
