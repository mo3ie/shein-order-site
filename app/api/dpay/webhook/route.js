import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("DPAY WEBHOOK:", body);

    const { session_id, status, order_id } = body;

    if (!order_id) {
      console.error("Webhook: order_id مفقود");
      return Response.json({ received: true });
    }

    const isPaid = status === "paid" || status === "success";

    if (isPaid) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order_id);

      await supabaseAdmin
        .from("payments")
        .update({ status: "paid", payment_session: session_id })
        .eq("order_id", order_id)
        .eq("method", "dpay");

      console.log("✅ DPay order paid:", order_id);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("DPAY WEBHOOK ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
