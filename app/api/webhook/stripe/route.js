import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error("Webhook: order_id مفقود من metadata");
      return NextResponse.json({ received: true });
    }

    await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    await supabaseAdmin
      .from("payments")
      .update({ status: "paid", payment_session: session.id, amount: session.amount_total / 100 })
      .eq("order_id", orderId)
      .eq("method", "stripe");
  }

  return NextResponse.json({ received: true });
}
