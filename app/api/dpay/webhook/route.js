export async function POST(req) {
  try {
    const body = await req.json();

    console.log("DPAY WEBHOOK:", body);

    /**
     * 🔴 شكل متوقع من dpay (قد يختلف):
     * {
     *   session_id: 123,
     *   status: "paid",
     *   order_id: "abc123"
     * }
     */

    const { session_id, status, order_id } = body;

    if (!session_id) {
      return Response.json({ error: "No session_id" }, { status: 400 });
    }

    // 🟡 فقط إذا تم الدفع
    if (status === "paid" || status === "success") {
      
      // 🟢 تحديث الطلب في Supabase
      const { createClient } = await import("@supabase/supabase-js");

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 مهم
      );

      const { error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_session: session_id,
        })
        .eq("id", order_id);

      if (error) {
        console.error("SUPABASE ERROR:", error);
        return Response.json({ error: "DB error" }, { status: 500 });
      }

      console.log("✅ ORDER PAID:", order_id);
    }

    return Response.json({ received: true });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}