import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    // SECURITY: this webhook marks orders paid, so it must present the shared
    // secret. Configure the registered DPay webhook URL with ?secret=<value>
    // and set DPAY_WEBHOOK_SECRET. If unset, the endpoint is fail-closed —
    // /api/dpay (verify) already confirms payments server-to-server, so this
    // being locked does not stop payments from completing.
    const secret = process.env.DPAY_WEBHOOK_SECRET;
    const provided =
      req.headers.get("x-webhook-secret") ||
      new URL(req.url).searchParams.get("secret");
    if (!secret || provided !== secret) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

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
