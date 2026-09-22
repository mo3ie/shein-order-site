// Masarafi Pay (مصرفي باي) — Step 2: confirm the customer's OTP and mark the order paid
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { masarafiConfirm } from "@/lib/masarafi";

// POST /api/masarafi/verify
// Body: { orderId, otp }
export async function POST(req) {
  try {
    const { orderId, otp } = await req.json();
    if (!orderId || !otp) return Response.json({ error: "orderId و otp مطلوبان" }, { status: 400 });

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, payment_session, status")
      .eq("order_id", orderId)
      .eq("method", "masarafi")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.payment_session)
      return Response.json({ error: "لم تبدأ عملية الدفع لهذا الطلب" }, { status: 400 });
    if (payment.status === "paid")
      return Response.json({ error: "هذا الطلب مدفوع مسبقًا" }, { status: 400 });

    await masarafiConfirm({ sessionToken: payment.payment_session, otp });

    await Promise.all([
      supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
      supabaseAdmin.from("payments").update({ status: "paid" }).eq("id", payment.id),
    ]);

    console.log("[masarafi/verify] order marked paid:", orderId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[masarafi/verify] ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 400 });
  }
}
