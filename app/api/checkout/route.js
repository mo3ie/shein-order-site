import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req) {
  try {
    const { amount, orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: "orderId مطلوب" }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return Response.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "طلب شي إن — TREND" },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { order_id: orderId },
      success_url: `${BASE}/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${BASE}/?cancelled=1`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("STRIPE ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
