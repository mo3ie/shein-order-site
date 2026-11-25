import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPush, NOTICES } from "@/lib/sendPush";

/**
 * The SHEIN wallet.
 *
 * Deliberately separate from the main Trend store's wallet: that one holds
 * `profiles.wallet_balance` and pays for shop orders, this one holds
 * `profiles.shein_wallet_balance` and pays for SHEIN orders. Sharing a balance
 * between two businesses would make refunds and reconciliation guesswork.
 *
 * The balance is only ever changed here, from the service role, against a
 * signed-in user — a client can read it but never write it.
 */
/**
 * Identify the caller.
 *
 * The site signs in with the browser Supabase client, which keeps the session
 * in localStorage — there are no auth cookies for the server to read. A
 * cookie-only check therefore saw every customer as a stranger and reported a
 * balance of zero however much they had. The bearer token the page already
 * holds is the reliable signal; the cookie path stays as a fallback for any
 * caller that does have one.
 */
async function getUser(req) {
  const bearer = (req?.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (bearer) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(bearer);
    if (user) return user;
  }
  const cookieStore = await cookies();
  const anon = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await anon.auth.getUser();
  return user;
}

/** GET /api/wallet — balance and recent movements for the signed-in customer. */
export async function GET(req) {
  const user = await getUser(req);
  if (!user) return Response.json({ balance: 0, transactions: [] });

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabaseAdmin.from("profiles").select("shein_wallet_balance").eq("id", user.id).single(),
    supabaseAdmin.from("shein_wallet_transactions").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  return Response.json({
    balance: Number(profile?.shein_wallet_balance || 0),
    transactions: transactions || [],
  });
}

/**
 * POST /api/wallet — move money.
 *
 * SECURITY (2026-11-25 audit). This endpoint used to trust the browser for both
 * the type and the amount: any signed-in customer could POST {type:"topup",
 * amount: 100000} and credit themselves, or POST {type:"debit", amount: 1,
 * order_id: <any order>} and have a $500 cart marked paid for one dinar (and
 * claim someone else's order). Now:
 *
 *   • topup  — STAFF (admin) only. Customers never top up here; real top-ups are
 *              done by Trend's admin (see /wallet: «الشحن يتم من إدارة ترند»).
 *              Body: { type:"topup", amount, user_id? | email?, note? } — no target = self.
 *   • debit  — pays ONE unpaid order that belongs to the caller (or to nobody yet),
 *              for the amount the SERVER stored on that order (final_total /
 *              price_lyd). The browser's amount is only compared, never charged.
 *              The order is claimed first (status new → paid, conditional) so two
 *              taps can't pay twice; the balance moves with an optimistic check so
 *              two concurrent debits can't overdraw; a failed debit releases the order.
 */
const UNPAID = ["new", "pending", "awaiting_payment"];

async function isAdmin(userId) {
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

/** Atomic-enough balance move: only applies if the balance is still what we read. */
async function moveBalance(userId, delta) {
  for (let i = 0; i < 3; i++) {
    const { data: p } = await supabaseAdmin.from("profiles").select("shein_wallet_balance").eq("id", userId).single();
    const current = Number(p?.shein_wallet_balance || 0);
    const next = Number((current + delta).toFixed(2));
    if (next < -0.001) return { ok: false, insufficient: true, balance: current };
    const { data: upd, error } = await supabaseAdmin.from("profiles")
      .update({ shein_wallet_balance: next }).eq("id", userId).eq("shein_wallet_balance", current).select("id");
    if (error) return { ok: false, error: error.message, balance: current };
    if (upd?.length) return { ok: true, balance: next };
  }
  return { ok: false, error: "busy" };
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return Response.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const type = body.type === "debit" ? "debit" : body.type === "topup" ? "topup" : null;
  if (!type) return Response.json({ error: "نوع العملية غير صالح" }, { status: 400 });

  // ── TOP-UP: admin only ────────────────────────────────────────────────────
  if (type === "topup") {
    if (!(await isAdmin(user.id))) {
      console.warn(`[wallet] REFUSED self top-up attempt by ${user.id} amount=${body.amount}`);
      return Response.json({ error: "شحن المحفظة يتم من إدارة ترند فقط" }, { status: 403 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return Response.json({ error: "المبلغ غير صحيح" }, { status: 400 });
    }
    let target = user.id;
    if (body.user_id) target = String(body.user_id);
    else if (body.email) {
      const { data: pr } = await supabaseAdmin.from("profiles").select("id").ilike("email", String(body.email).trim()).maybeSingle();
      if (!pr) return Response.json({ error: "الحساب غير موجود" }, { status: 404 });
      target = pr.id;
    }
    const mv = await moveBalance(target, amount);
    if (!mv.ok) return Response.json({ error: "تعذّر تحديث الرصيد" }, { status: 500 });
    await supabaseAdmin.from("shein_wallet_transactions").insert({
      user_id: target, type: "topup", amount, method: "admin", note: body.note || `شحن إداري بواسطة ${user.email || user.id}`, balance_after: mv.balance,
    });
    return Response.json({ success: true, balance: mv.balance });
  }

  // ── DEBIT: pay one of my unpaid orders at the server's price ─────────────
  const orderId = body.order_id;
  if (!orderId) return Response.json({ error: "رقم الطلب مطلوب" }, { status: 400 });
  const { data: order } = await supabaseAdmin.from("orders")
    .select("id, user_id, status, final_total, price_lyd").eq("id", orderId).maybeSingle();
  if (!order) return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (order.user_id && order.user_id !== user.id) return Response.json({ error: "هذا الطلب ليس لك" }, { status: 403 });
  if (!UNPAID.includes(order.status)) return Response.json({ error: "هذا الطلب مدفوع أو لم يعد قابلاً للدفع" }, { status: 409 });

  const due = Number(Number(order.final_total ?? order.price_lyd).toFixed(2));
  if (!Number.isFinite(due) || due <= 0) return Response.json({ error: "سعر الطلب غير مؤكد بعد — حدّث الصفحة" }, { status: 409 });
  const asked = Number(body.amount);
  if (Number.isFinite(asked) && Math.abs(asked - due) > 1) {
    // the page showed a different figure (rate/shipping changed) — never charge silently
    return Response.json({ error: `المبلغ المستحق ${due.toFixed(2)} د.ل — حدّث الصفحة وأعد المحاولة.`, due }, { status: 409 });
  }

  // Claim the order first: only one payment can flip it from unpaid to paid.
  const { data: claimed } = await supabaseAdmin.from("orders")
    .update({ status: "paid", user_id: order.user_id || user.id }).eq("id", orderId).eq("status", order.status).select("id");
  if (!claimed?.length) return Response.json({ error: "هذا الطلب قيد الدفع أو مدفوع" }, { status: 409 });

  const mv = await moveBalance(user.id, -due);
  if (!mv.ok) {
    await supabaseAdmin.from("orders").update({ status: order.status }).eq("id", orderId).eq("status", "paid");
    if (mv.insufficient) return Response.json({ error: "رصيد المحفظة لا يكفي", balance: mv.balance }, { status: 400 });
    return Response.json({ error: "تعذّر تحديث الرصيد، حاول مرة أخرى" }, { status: 500 });
  }

  const { error: txErr } = await supabaseAdmin.from("shein_wallet_transactions").insert({
    user_id: user.id, type: "debit", amount: due, method: "wallet", order_id: orderId, note: body.note || null, balance_after: mv.balance,
  });
  if (txErr) console.error("[wallet] ledger insert failed:", txErr.message);

  const { error: payErr } = await supabaseAdmin.from("payments").insert({ order_id: orderId, method: "wallet", status: "paid", amount: due });
  if (payErr) console.error("[wallet] payment row insert failed:", payErr.message);

  // وتأكيد على الهاتف: الزبون يدفع ثم يغلق الصفحة، فالإشعار يصله حيث هو.
  try {
    const sent = await sendPush({ orderId }, NOTICES.paid(due));
    if (!sent.sent) await sendPush({ userId: user.id }, NOTICES.paid(due));
  } catch (e) {
    console.error(`[wallet] payment notification failed: ${e.message}`);
  }

  return Response.json({ success: true, balance: mv.balance, charged: due });
}
