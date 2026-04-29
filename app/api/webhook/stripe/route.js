import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  // 🎯 عند نجاح الدفع
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const orderId = session.metadata.order_id;
   const sessionId = session.id;

console.log("PAYMENT SUCCESS:", orderId);

    // تحديث payment
    await supabaseAdmin
      .from("payments")
      .update({ status: "paid" , payment_session: sessionId })
      .eq("order_id", orderId);

    // تحديث order
    await supabaseAdmin
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", orderId);
  }

  return NextResponse.json({ received: true });
}