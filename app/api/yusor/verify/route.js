// Yusor Pay (يسر باي) — Step 2: confirm the customer's OTP and mark the order paid
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { yusorConfirm } from "@/lib/yusor";

// POST /api/yusor/verify
// Body: { orderId, otp }
export async function POST(req) {
  try {
    const { orderId, otp } = await req.json();
    if (!orderId || !otp) return Response.json({ error: "orderId و otp مطلوبان" }, { status: 400 });

    // The session token comes from the row written at initiate, not the browser.
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, payment_session, status")
      .eq("order_id", orderId)
      .eq("method", "yusor")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.payment_session)
      return Response.json({ error: "لم تبدأ عملية الدفع لهذا الطلب" }, { status: 400 });
    if (payment.status === "paid")
      return Response.json({ error: "هذا الطلب مدفوع مسبقًا" }, { status: 400 });

    await yusorConfirm({ sessionToken: payment.payment_session, otp });

    await Promise.all([
      supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
      supabaseAdmin.from("payments").update({ status: "paid" }).eq("id", payment.id),
    ]);

    console.log("[yusor/verify] order marked paid:", orderId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[yusor/verify] ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 400 });
  }
}
