import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: "No session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const orderId = session.metadata.order_id;

    if (!orderId) {
      return NextResponse.json({ error: "No order_id" }, { status: 400 });
    }

    if (session.payment_status === "paid") {
      // تحديث الطلب
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

      // تسجيل الدفع
      await supabaseAdmin
        .from("payments")
        .insert({
          order_id: orderId,
          method: "stripe",
          status: "paid",
          amount: session.amount_total / 100,
        });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch (err) {
    console.error("STRIPE VERIFY ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}