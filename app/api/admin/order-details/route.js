import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { startResolveJob, pollResolveJob, isSheinShareUrl } from "@/lib/resolver";
import { buildDetails } from "@/lib/priceQuote";

/**
 * Fill in the cart contents of an order placed before details were saved.
 *
 *   POST { id }            → starts a measurement of the order's cart (with its quantities)
 *   GET  ?id=&job=         → polls; when done, saves price_breakdown.details on the order
 *
 * The order's PRICE is never touched — the customer paid what was quoted. The fresh
 * reading is stored for the buyer (items, variants, quantities, pictures, account) and
 * the measured total is kept beside it as `remeasuredUsd`, so a price that moved since
 * the order is visible before buying.
 */
async function requireStaff(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: p } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  return p?.role === "admin" || p?.role === "employee" ? user : null;
}

async function loadOrder(id) {
  const { data } = await supabaseAdmin.from("orders").select("id, cart_link, price_breakdown").eq("id", id).maybeSingle();
  return data;
}

export async function POST(req) {
  if (!(await requireStaff(req))) return Response.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await req.json().catch(() => ({}));
  const order = id ? await loadOrder(String(id)) : null;
  if (!order) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (!isSheinShareUrl(order.cart_link)) return Response.json({ error: "رابط السلة غير صالح" }, { status: 400 });
  const qty = (order.price_breakdown?.quantities || []).filter((q) => Number(q.wanted) > 1);
  try {
    const { jobId } = await startResolveJob(order.cart_link, { quantities: qty.length ? qty : null });
    return Response.json({ success: true, jobId });
  } catch (e) {
    return Response.json({ error: e.message || "تعذّر بدء القراءة" }, { status: 502 });
  }
}

export async function GET(req) {
  if (!(await requireStaff(req))) return Response.json({ error: "غير مصرح" }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id"), job = sp.get("job");
  if (!id || !job) return Response.json({ error: "id و job مطلوبة" }, { status: 400 });
  try {
    const out = await pollResolveJob(job);
    if (out.status === "pending") return Response.json({ success: true, status: "pending", elapsedMs: out.elapsedMs ?? null });
    const order = await loadOrder(id);
    if (!order) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
    const details = await buildDetails(out);
    details.remeasuredUsd = out.estimatedPrice ?? null;
    details.backfilled = true;
    const pb = { ...(order.price_breakdown || {}), details };
    const { error } = await supabaseAdmin.from("orders").update({ price_breakdown: pb }).eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, status: "done", details });
  } catch (e) {
    return Response.json({ success: false, error: e.message || "تعذّرت القراءة" }, { status: 200 });
  }
}
