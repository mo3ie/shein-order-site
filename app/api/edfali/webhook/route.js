import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    // SECURITY: marks orders paid → must present the shared secret. Configure
    // the registered Edfali webhook URL with ?secret=<value> and set
    // EDFALI_WEBHOOK_SECRET. Fail-closed if unset — /api/edfali/verify confirms
    // the customer OTP server-to-server, so this lock does not block payments.
    const secret = process.env.EDFALI_WEBHOOK_SECRET;
    const provided =
      req.headers.get("x-webhook-secret") ||
      new URL(req.url).searchParams.get("secret");
    if (!secret || provided !== secret) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("EDFALI WEBHOOK:", JSON.stringify(body, null, 2));

    const { event, payment } = body;

    if (event === "payment.paid" && payment) {
      const orderId = payment.data?.order_id;
      if (orderId) {
        await Promise.all([
          supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
          supabaseAdmin.from("payments")
            .update({ status: "paid", gateway_ref: payment.tx_id })
            .eq("order_id", orderId)
            .eq("method", "edfali"),
        ]);
        console.log("EDFALI WEBHOOK: order", orderId, "marked paid");
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("EDFALI WEBHOOK ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
