const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const DPAY_URL =
  process.env.DPAY_MODE === "Production"
    ? "https://dpay.ly/api/payment/sessions/open"
    : "https://dpay.ly/api/sandbox/payment/sessions/open";

export async function POST(req) {
  try {
    const { amount, orderId, method, customer_mobile, customer_name, card_number } = await req.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return Response.json({ error: "المبلغ غير صالح" }, { status: 400 });
    }
    if (!orderId) {
      return Response.json({ error: "orderId مطلوب" }, { status: 400 });
    }
    if (!method) {
      return Response.json({ error: "طريقة الدفع مطلوبة" }, { status: 400 });
    }

    const payload = {
      amount:       Math.round(amount),
      currency:     "LYD",
      order_id:     orderId,
      pay_method:   method,
      callback_url: `${BASE}/api/dpay/webhook`,
      return_url:   `${BASE}/success?orderId=${orderId}&via=dpay`,
    };

    if (method === "moamalat") {
      payload.customer_name  = customer_name  || "customer";
      payload.customer_phone = customer_mobile || "0910000000";
    }

    if (method === "edfali") {
      if (!customer_mobile) {
        return Response.json({ error: "رقم الهاتف مطلوب لـ ادفع لي" }, { status: 400 });
      }
      payload.customer_mobile = customer_mobile;
    }

    if (["mobicash", "masrefypay", "yousrpay", "saharpay"].includes(method)) {
      if (!card_number) {
        return Response.json({ error: "رقم البطاقة مطلوب" }, { status: 400 });
      }
      payload.card_number = card_number;
    }

    const response = await fetch(DPAY_URL, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${process.env.DPAY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return Response.json({ error: "رد غير مفهوم من DPay", raw: text }, { status: 500 }); }

    if (!response.ok || !data.payment_link) {
      console.error("DPAY ERROR:", data);
      return Response.json({ error: data?.message || "فشل إنشاء جلسة الدفع", data }, { status: 500 });
    }

    return Response.json({
      success:      true,
      payment_link: data.payment_link,
      session_id:   data.session_id,
    });

  } catch (err) {
    console.error("DPAY ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
