import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("BODY:", body);

    // ✅ تأكد أن orderId موجود
    let orderId = body.orderId;

    if (!orderId) {
      orderId = Date.now().toString(); // fallback
      console.warn("⚠️ orderId was missing, generated:", orderId);
    }

    const session = await stripe.checkout.sessions.create({

      metadata: {
  order_id: orderId,
},

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

     
      

      // ✅ success URL مضبوط
      success_url: `http://trendstore-ly.com/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: "http://trendstore-ly.com/",

       metadata: {
        order_id: orderId      }
      
    });

    return Response.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE ERROR:", err);
    return Response.json({ error: err.message });
  }
}