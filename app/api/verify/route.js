import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DPAY_BASE =
  process.env.DPAY_MODE === "Production"
    ? "https://dpay.ly/api/payment"
    : "https://dpay.ly/api/sandbox/payment";

export async function POST(req) {
  try {
    const { session_id, order_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ success: false, error: "session_id مطلوب" }, { status: 400 });
    }

    const response = await fetch(`${DPAY_BASE}/sessions/${session_id}/verify`, {
      method: "GET",
      headers: {
        Authorization:  `Bearer ${process.env.DPAY_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const isPaid = data?.status === "paid" || data?.status === "success" || data?.payment_status === "paid";

    // إذا تم الدفع وعندنا orderId، حدّث قاعدة البيانات
    if (isPaid && order_id) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", order_id);

      await supabaseAdmin
        .from("payments")
        .update({ status: "paid", payment_session: session_id })
        .eq("order_id", order_id)
        .eq("method", "dpay");
    }

    return NextResponse.json({ success: isPaid, data });
  } catch (err) {
    console.error("DPAY VERIFY ERROR:", err);
    return NextResponse.json({ success: false, error: "خطأ في التحقق" }, { status: 500 });
  }
}
