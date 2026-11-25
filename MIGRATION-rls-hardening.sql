-- 2026-11-25 security audit — close world-readable / world-writable tables.
--
-- BEFORE (all applied to role PUBLIC = anyone holding the anon key, which ships in every browser):
--   orders   : "Enable read access for all users"  SELECT using (true)          → anyone could dump every SHEIN order (names, phones, addresses, map pins)
--              "updated"                            UPDATE using (auth.role()='authenticated') → any signed-in user could edit ANY order (status, price…)
--              "Enable insert for authenticated users only" INSERT check (true) → any user could insert a fake «paid» order
--   settings : "update" UPDATE using (true) / "insert" INSERT check (true)     → anyone could change exchange_rate / profit_rate / resolver_url
--   payments : "update pay" UPDATE using (true)                                → anyone could rewrite payment rows
--
-- AFTER: the browser reads only its own orders; staff (profiles.role admin|employee) read/edit all;
-- every write the site needs happens server-side with the service role (bypasses RLS).
-- Pages that relied on public reads were moved to server endpoints first (success page → /api/order?id=).
--
-- ROLLBACK (only if something essential breaks): re-create the BEFORE policies listed above.

create or replace function public.shein_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'employee'));
$$;
revoke all on function public.shein_is_staff() from public;
grant execute on function public.shein_is_staff() to anon, authenticated;

-- orders
drop policy if exists "Enable read access for all users" on public.orders;
drop policy if exists "updated" on public.orders;
drop policy if exists "Enable insert for authenticated users only" on public.orders;
drop policy if exists "orders_read_own_or_staff" on public.orders;
drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_read_own_or_staff" on public.orders for select
  using (user_id = auth.uid() or public.shein_is_staff());
create policy "orders_update_staff" on public.orders for update
  using (public.shein_is_staff()) with check (public.shein_is_staff());

-- settings (public read stays: the site needs the rate before sign-in)
drop policy if exists "update" on public.settings;
drop policy if exists "insert" on public.settings;
drop policy if exists "settings_update_staff" on public.settings;
create policy "settings_update_staff" on public.settings for update
  using (public.shein_is_staff()) with check (public.shein_is_staff());

-- payments: the browser may only add a PENDING row; marking paid is server-only
drop policy if exists "update pay" on public.payments;
drop policy if exists "insert pay" on public.payments;
create policy "insert pay" on public.payments for insert with check (status = 'pending');
