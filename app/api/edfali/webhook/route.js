import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
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
