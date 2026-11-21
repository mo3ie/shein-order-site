import { orderAmountLYD } from "@/lib/orderAmount";
// Masarafi Pay (مصرفي باي) — Step 1: signin + OpenSession (bank sends the customer an OTP)
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { masarafiInitiate } from "@/lib/masarafi";

// POST /api/masarafi
// Body: { orderId, cardNumber }
export async function POST(req) {
  try {
    const { orderId, cardNumber } = await req.json();
    if (!orderId)    return Response.json({ error: "orderId مطلوب" }, { status: 400 });
    if (!cardNumber) return Response.json({ error: "رقم البطاقة مطلوب" }, { status: 400 });

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, amount, status")
      .eq("order_id", orderId)
      .eq("method", "masarafi")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) return Response.json({ error: "الطلب غير موجود أو مدفوع مسبقًا" }, { status: 404 });

    const { data: order } = await supabaseAdmin
      .from("orders").select("id, status").eq("id", orderId).maybeSingle();
    if (!order)                  return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
    if (order.status === "paid") return Response.json({ error: "هذا الطلب مدفوع مسبقًا" }, { status: 400 });

    const amount = await orderAmountLYD(orderId);
    if (!amount || amount <= 0) return Response.json({ error: "المبلغ غير صحيح" }, { status: 400 });

    const sessionToken = await masarafiInitiate({ identityCard: cardNumber, amount, orderId });

    await supabaseAdmin.from("payments").update({ payment_session: sessionToken }).eq("id", payment.id);

    console.log("[masarafi] initiated for order:", orderId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[masarafi] INITIATE ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 400 });
  }
}
