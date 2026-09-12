-- Additive columns for the SHEIN order flow. Safe to run more than once.
--
-- cart_shot_url    a picture of the cart as SHEIN rendered it, so a price can be
--                  checked against what was on screen rather than trusted
-- price_breakdown  SHEIN's own lines (retail, shipping, promotions, coupon) plus
--                  the quantities the customer chose and what they added
-- delivery_*       the customer's own delivery address, typed and optionally pinned

alter table public.orders
  add column if not exists cart_shot_url    text,
  add column if not exists price_breakdown  jsonb,
  add column if not exists delivery_address text,
  add column if not exists delivery_geo     jsonb;
