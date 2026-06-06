import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BASE  = "https://dpay.ly/api";
const TOKEN = process.env.DPAYLY_TOKEN;

export async function POST(req) {
  try {
    const { sessionId, otp, orderId } = await req.json();

    const res = await fetch(`${BASE}/payment/sessions/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ session_id: sessionId, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("EDFALI VERIFY ERROR:", data);
      return Response.json({ error: data.message || "رمز التحقق خاطئ أو انتهت صلاحيته" }, { status: res.status });
    }

    if (data.status === "paid" && orderId) {
      await Promise.all([
        supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
        supabaseAdmin.from("payments")
          .update({ status: "paid", gateway_ref: data.tx_id })
          .eq("order_id", orderId)
          .eq("method", "edfali"),
      ]);
    }

    console.log("EDFALI PAID:", orderId, "tx:", data.tx_id);
    return Response.json({ success: true, status: data.status, tx_id: data.tx_id });

  } catch (err) {
    console.error("EDFALI VERIFY ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
