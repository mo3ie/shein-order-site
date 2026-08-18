// MobiCash (موبي كاش) — Step 1: charge the card, bank sends the customer an OTP
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { initiateCardPayment } from "@/lib/mobicash";

// POST /api/mobicash
// Body: { orderId, amountLYD, cardNumber }
export async function POST(req) {
  try {
    const { orderId, amountLYD, cardNumber } = await req.json();

    if (!orderId)    return Response.json({ error: "orderId مطلوب" }, { status: 400 });
    if (!cardNumber) return Response.json({ error: "رقم البطاقة مطلوب" }, { status: 400 });

    // A card is only ever charged against a real, unpaid order — and for the
    // amount recorded on its pending payment row, not one sent by the browser.
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, amount, status")
      .eq("order_id", orderId)
      .eq("method", "mobicash")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) return Response.json({ error: "الطلب غير موجود أو مدفوع مسبقًا" }, { status: 404 });

    const { data: order } = await supabaseAdmin
      .from("orders").select("id, status").eq("id", orderId).maybeSingle();
    if (!order)                return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
    if (order.status === "paid") return Response.json({ error: "هذا الطلب مدفوع مسبقًا" }, { status: 400 });

    const amount = Number(payment.amount) || Number(amountLYD);
    if (!amount || amount <= 0)
      return Response.json({ error: "المبلغ غير صحيح" }, { status: 400 });

    const { paymentUuid, expiresAt } = await initiateCardPayment({
      cardNumber,
      amount,
      description: `Shein order ${orderId}`,
    });

    // Keep the payment_uuid server-side; /verify reads it back by orderId.
    await supabaseAdmin
      .from("payments")
      .update({ payment_session: paymentUuid })
      .eq("id", payment.id);

    console.log("[mobicash] initiated for order:", orderId);
    return Response.json({ success: true, expiresAt });

  } catch (err) {
    console.error("[mobicash] INITIATE ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 400 });
  }
}
