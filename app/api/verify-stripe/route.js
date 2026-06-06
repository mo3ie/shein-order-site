import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: "session_id مطلوب" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      return NextResponse.json({ error: "order_id غير موجود في الجلسة" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ success: false, status: session.payment_status });
    }

    // تحديث الطلب
    await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    // تحديث سجل الدفع (upsert لتفادي التكرار)
    await supabaseAdmin
      .from("payments")
      .update({ status: "paid", amount: session.amount_total / 100 })
      .eq("order_id", orderId)
      .eq("method", "stripe");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("STRIPE VERIFY ERROR:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
