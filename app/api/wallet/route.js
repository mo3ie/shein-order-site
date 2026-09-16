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
 * POST /api/wallet — record a movement and move the balance.
 *
 * `type` is "topup" (money in, after a gateway confirmed it) or "debit" (paying
 * for an order). A debit that would overdraw is refused rather than allowed to
 * go negative.
 */
export async function POST(req) {
  const user = await getUser(req);
  if (!user) return Response.json({ error: "يجب تسجيل الدخول" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const amount = Number(body.amount);
  const type = body.type === "debit" ? "debit" : "topup";
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "المبلغ غير صحيح" }, { status: 400 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("shein_wallet_balance").eq("id", user.id).single();
  const current = Number(profile?.shein_wallet_balance || 0);

  if (type === "debit" && amount > current + 0.001) {
    return Response.json(
      { error: "رصيد المحفظة لا يكفي", balance: current },
      { status: 400 }
    );
  }

  const next = Number((type === "debit" ? current - amount : current + amount).toFixed(2));

  const { error: balErr } = await supabaseAdmin
    .from("profiles").update({ shein_wallet_balance: next }).eq("id", user.id);
  if (balErr) {
    console.error("[wallet] balance update failed:", balErr.message);
    return Response.json({ error: "تعذّر تحديث الرصيد" }, { status: 500 });
  }

  // The ledger is written after the balance so a failure here leaves money
  // correct and only the history incomplete, never the other way round.
  const { error: txErr } = await supabaseAdmin.from("shein_wallet_transactions").insert({
    user_id: user.id,
    type,
    amount,
    method: body.method || null,
    order_id: body.order_id || null,
    note: body.note || null,
    balance_after: next,
  });
  if (txErr) console.error("[wallet] ledger insert failed:", txErr.message);

  // A paid order has to SAY it is paid.
  //
  // The order row is created before payment with status "new", and the customer
  // screens treat an order that is still "new" as an abandoned attempt and stop
  // listing it after an hour — so an order really paid from the wallet vanished
  // from "طلباتي" and from the account page. The gateways mark their orders paid
  // server-side after verification; the wallet has to do the same, here, where
  // the service role can write and no RLS policy can quietly refuse it.
  if (type === "debit" && body.order_id) {
    const { error: ordErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "paid", final_total: amount, price_lyd: amount })
      .eq("id", body.order_id);
    if (ordErr) console.error("[wallet] order not marked paid:", ordErr.message);

    // The payment row was being inserted from the browser with the anon key,
    // where RLS can drop it silently and the order loses its payment method.
    const { error: payErr } = await supabaseAdmin.from("payments").insert({
      order_id: body.order_id, method: "wallet", status: "paid", amount,
    });
    if (payErr) console.error("[wallet] payment row insert failed:", payErr.message);

    // The order belongs to whoever paid for it, so it shows in their list even
    // if it was started before they signed in.
    await supabaseAdmin
      .from("orders").update({ user_id: user.id })
      .eq("id", body.order_id).is("user_id", null);

    // وتأكيد على الهاتف: الزبون يدفع ثم يغلق الصفحة، فالإشعار يصله حيث هو
    // بدل شاشة قد لا يعود إليها.
    try {
      const sent = await sendPush({ orderId: body.order_id }, NOTICES.paid(amount));
      if (!sent.sent) await sendPush({ userId: user.id }, NOTICES.paid(amount));
    } catch (e) {
      console.error(`[wallet] payment notification failed: ${e.message}`);
    }
  }

  return Response.json({ success: true, balance: next });
}
