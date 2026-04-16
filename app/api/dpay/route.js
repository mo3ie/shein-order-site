export async function POST(req) {
  try {
    const body = await req.json();

    const {
      method,
      amount,
      customer_mobile,
      card_number,
      order_id
    } = body;

    // 🔴 تحقق أساسي
    if (!method || !amount) {
      return Response.json(
        { error: "method و amount مطلوبين" },
        { status: 400 }
      );
    }

    // 🟢 تجهيز payload
    

const payload = {
  pay_method: method,
  amount: Math.round(amount),

  // 🔥 إضافة مهمة جدًا
  return_url: `https://institute-certification-coverage-lady.trycloudflare.com/success?orderId=${order_id}`,
};


    // 🟣 ربط الطلب (اختياري)
    if (order_id) {
      payload.order_id = order_id;
    }

    // 🟣 edfali
    if (method === "edfali") {
      if (!customer_mobile) {
        return Response.json(
          { error: "رقم الهاتف مطلوب لـ edfali" },
          { status: 400 }
        );
      }
      payload.customer_mobile = customer_mobile;
    }

    // 🔵 mobicash + البنوك
    if (
      method === "mobicash" ||
      method === "masrafypay" ||
      method === "yousrpay" ||
      method === "saharpay"
    ) {
      if (!card_number || card_number.length !== 7) {
        return Response.json(
          { error: "رقم البطاقة يجب أن يكون 7 أرقام" },
          { status: 400 }
        );
      }
      payload.card_number = card_number;
    }

    console.log("SEND TO DPAY:", payload);

    // 🟢 تحديد البيئة
    const baseUrl =
      process.env.DPAY_MODE === "production"
        ? "https://dpay.ly/api/payment/sessions/open"
        : "https://dpay.ly/api/sandbox/payment/sessions/open";

    // 🟢 إرسال الطلب
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.DPAY_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("DPAY NOT JSON:", text);
      return Response.json(
        { error: "رد غير مفهوم من DPAY", raw: text },
        { status: 500 }
      );
    }

    console.log("DPAY RESPONSE FULL:", data);

    if (!response.ok) {
      return Response.json(
        { error: "DPAY فشل", details: data },
        { status: 500 }
      );
    }

    // 🔥 الحل الحقيقي: استخدام session_id
    if (!data.session_id) {
      return Response.json(
        { error: "لم يتم إنشاء session", data },
        { status: 500 }
      );
    }

    // 🔗 إنشاء رابط الدفع
    const payment_link = data.payment_link;

    return Response.json({
      success: true,
      payment_link,
      session_id: data.session_id,
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return Response.json(
      { error: "خطأ في السيرفر" },
      { status: 500 }
    );
  }
}