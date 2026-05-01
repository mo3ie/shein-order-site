import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const { orderId, amount } = body;

  try {
    const payload = {
  amount: body.amount,
  currency: "LYD",
  order_id: body.order_id,
  pay_method: "moamalat",

  customer_name: body.customer_name || "customer",
  customer_phone: body.customer_mobile,

  callback_url: `${process.env.BASE_URL}/api/dpay/webhook`,
  return_url: `${process.env.BASE_URL}/success?orderId=${body.order_id}`
};
    

    const response = await fetch("https://dpay.ly/api/payment/sessions/open", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DPAY_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    return NextResponse.json({
      payment_url: data.payment_url
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "DPAY ERROR" });
  }
}