import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
async function getUser() {
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
export async function GET() {
  const user = await getUser();
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
  const user = await getUser();
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

  return Response.json({ success: true, balance: next });
}
