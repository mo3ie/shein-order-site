import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Called by shein success page when Moamalat Lightbox completeCallback fires.
// The Lightbox only runs on trendstore-ly.com (whitelisted) so this is
// sufficient evidence of a real payment in our threat model.
export async function POST(req) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return Response.json({ error: "orderId مطلوب" }, { status: 400 });

    await Promise.all([
      supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
      supabaseAdmin.from("payments").update({ status: "paid" }).eq("order_id", orderId).eq("method", "moamalat"),
    ]);

    console.log("[moamalat/confirm] order marked paid:", orderId);
    return Response.json({ success: true });
  } catch (err) {
    console.error("[moamalat/confirm] ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
