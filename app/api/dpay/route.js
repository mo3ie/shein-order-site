export async function POST(req) {
  try {
    const body = await req.json();
    
const { amount, orderId } = body;
const priceLYD = amount;
    const {
      method,

      customer_mobile,
      card_number,
      orderid
    } = body;

    // 🔴 تحقق أساسي
    if (method === "edfali") {
  if (!customer_mobile || customer_mobile.length < 8) {
    return Response.json(
      { error: "رقم الهاتف غير صالح" },
      { status: 400 }
    );
  }

  payload.customer_mobile = customer_mobile;
}

    // 🟢 تجهيز payload
    
if (!priceLYD || isNaN(priceLYD)) {
  throw new Error("السعر غير صالح");
}


const payload = {

  currency: "LYD",
  amount: Math.round(Number(priceLYD)) ,
  order_id: orderId,

  pay_method: method,
callback_url: "https://trendstore-ly.com/api/dpay/webhook"
  
};

console.log("💰 FINAL AMOUNT:", priceLYD);
console.log("📦 PAYLOAD:", payload);



    // 🟣 ربط الطلب (اختياري)
    if (order_id) {
      payload.order_id = order_id;
    }

    // 🟣 edfali
    if (method === "edfali") {
      payload.customer_mobile = customer_mobile;
    }

    // 🔵 mobicash + البنوك
   if (
  method === "mobicash" ||
  method === "masrafypay" ||
  method === "yousrpay" ||
  method === "saharpay"
) {
  if (!card_number || !/^\d{7}$/.test(card_number)) {
    return Response.json(
      { error: "رقم البطاقة يجب أن يكون 7 أرقام صحيحة" },
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



console.log("DPAY RESPONSE FULL:", data);
    



    
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

  } 
  catch (error) {
  console.error("❌ DPAY ERROR:", error);

  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500 }
  );
}
}