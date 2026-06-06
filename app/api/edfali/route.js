import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BASE  = "https://dpay.ly/api";
const TOKEN = process.env.DPAYLY_TOKEN;

export async function POST(req) {
  try {
    const { orderId, amountLYD, phone } = await req.json();

    if (!orderId || !amountLYD || !phone) {
      return Response.json({ error: "orderId و amountLYD و phone مطلوبة" }, { status: 400 });
    }

    const res = await fetch(`${BASE}/payment/sessions/open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        pay_method: "edfali",
        amount: Math.round(Number(amountLYD)),
        customer_mobile: phone,
        data: { order_id: orderId },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("DPAYLY EDFALI OPEN ERROR:", data);
      return Response.json({ error: data.message || "فشل فتح جلسة الدفع" }, { status: res.status });
    }

    console.log("EDFALI SESSION OPENED:", data.session_id, "order:", orderId);
    return Response.json({ success: true, session_id: data.session_id, expires_at: data.expired_at });

  } catch (err) {
    console.error("EDFALI OPEN ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
