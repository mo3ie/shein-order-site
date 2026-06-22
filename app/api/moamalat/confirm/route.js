import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Called by the shein success page when the Moamalat Lightbox completeCallback
// fires. SECURITY: this used to mark the order "paid" from an unauthenticated
// client claim — anyone could POST { orderId } and get free goods without
// paying. It is now READ-ONLY: it returns the order's current status, and the
// authoritative paid-marking happens ONLY in /api/moamalat/webhook, which
// verifies the Moamalat SecureHash signature (registered via
// register-moamalat-webhook.mjs).
export async function POST(req) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return Response.json({ error: "orderId مطلوب" }, { status: 400 });

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();

    const paid = order?.status === "paid";
    return Response.json({ success: true, paid, status: order?.status ?? null });
  } catch (err) {
    console.error("[moamalat/confirm] ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
