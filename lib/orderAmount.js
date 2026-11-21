import { supabaseAdmin } from "@/lib/supabaseAdmin";

// The dinar amount a payment route may charge for an order.
//
// It is the total /api/order computed on the server from our own price
// measurement and the settings rate (final_total, or price_lyd). Every gateway
// used to charge `amountLYD` from the request or `payments.amount` — a row the
// browser inserts itself — so a customer could pay a few dinars for any cart.
// Returns null when the order is missing, already paid, or has no total.
export async function orderAmountLYD(orderId) {
  if (!orderId) return null;
  const { data } = await supabaseAdmin
    .from("orders")
    .select("status, final_total, price_lyd")
    .eq("id", orderId)
    .maybeSingle();
  if (!data || data.status === "paid") return null;
  const amount = Number(data.final_total ?? data.price_lyd);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
