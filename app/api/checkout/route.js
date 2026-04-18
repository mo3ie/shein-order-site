import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("BODY:", body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "طلب من الموقع",
            },
            unit_amount: Math.round(body.amount * 100),
          },
          quantity: 1,
        },
      ],

      // ✅ هذا هو المهم
      success_url: `http://trendstore-ly.com/success?orderId=${body.orderId}`,

      cancel_url: "http://trendstore-ly.com",
    });

    return Response.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE ERROR:", err);
    return Response.json({ error: err.message });
  }
}