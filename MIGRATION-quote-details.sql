-- Everything the buyer needs from a measured cart (items with variant/qty/price/thumbnail,
-- which SHEIN account priced it, when, whether the list is complete). Copied into
-- orders.price_breakdown.details when the order is placed. Additive, safe to re-run.
alter table public.shein_price_quotes add column if not exists details jsonb;
