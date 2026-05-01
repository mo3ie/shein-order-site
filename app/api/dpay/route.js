export async function POST(req) {
  try {
    const body = await req.json();

    const {
      amount,
      orderId,
      method,
      customer_mobile,
      customer_name,
      card_number
    } = body;

    if (!amount || isNaN(amount)) {
      throw new Error("السعر غير صالح");
    }

    let payload = {
      amount: Math.round(amount),
      currency: "LYD",
      order_id: orderId,
      pay_method: method,
      callback_url: `${process.env.BASE_URL}/api/dpay/webhook`,
      return_url: `${process.env.BASE_URL}/success?orderId=${orderId}`,
    };

    // ✅ Moamalat (الأهم عندك)
    if (method === "moamalat") {
      payload.customer_name = customer_name || "customer";
      payload.customer_phone = customer_mobile || "0910000000";
    }

    // ✅ EDFali
    if (method === "edfali") {
      if (!customer_mobile) {
        return Response.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
      }
      payload.customer_mobile = customer_mobile;
    }

    // ✅ البطاقات
    if (
      method === "mobicash" ||
      method === "masrefypay" ||
      method === "yousrpay" ||
      method === "saharpay"
    ) {
      if (!card_number) {
        return Response.json({ error: "رقم البطاقة مطلوب" }, { status: 400 });
      }
      payload.card_number = card_number;
    }

    console.log("📦 FINAL PAYLOAD:", payload);

    const baseUrl =
      process.env.DPAY_MODE === "production"
        ? "https://api.dpay.ly/api/payment/sessions/open"
        : "https://api.dpay.ly/api/sandbox/payment/sessions/open";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
  Authorization: `Bearer ${process.env.DPAY_TOKEN}`,
  "Content-Type": "application/json"
},
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("🧾 RAW RESPONSE:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return Response.json({ error: "رد غير مفهوم", raw: text }, { status: 500 });
    }

    if (!response.ok) {
      return Response.json({ error: "DPAY ERROR", data }, { status: 500 });
    }

    if (!data.payment_link) {
      return Response.json({ error: "لم يتم إنشاء session", data }, { status: 500 });
    }

    return Response.json({
      success: true,
      payment_link: data.payment_link,
      session_id: data.session_id,
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}