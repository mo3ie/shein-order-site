import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const { orderId, amount } = body;

  try {
    const payload = {
      amount,
      pay_method: "moamalat",
      order_id: orderId,
      callback_url: `${process.env.BASE_URL}/api/dpay/moamalat/webhook`,
      return_url: `${process.env.BASE_URL}/success?source=dpay`
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