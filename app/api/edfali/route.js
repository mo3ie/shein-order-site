// Adfali web service — مصرف التجارة و التنمية
// Protocol: SOAP 1.1 (HTTP GET is disabled on this server)
const ADFALI_ENDPOINT = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const PW = "123@xdsr$#!!";

const ERROR_MESSAGES = {
  LIMIT: "المبلغ خارج الحدود المسموح بها — تواصل مع البنك لتعديل الحدود",
  PW1:   "خطأ في إعداد الخدمة",
  PW:    "خطأ في إعداد الخدمة",
  ACC:   "رقم الهاتف غير مسجل في ادفع لي",
  BAL:   "تعذّر إتمام العملية",
};

function soapBody(method, params) {
  const fields = Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${method} xmlns="http://tempuri.org/">${fields}</${method}></soap:Body>
</soap:Envelope>`;
}

async function soapCall(method, params) {
  const res = await fetch(ADFALI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": `http://tempuri.org/${method}` },
    body: soapBody(method, params),
    cache: "no-store",
  });
  const xml = await res.text();
  const tag = `${method}Result`;
  return xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim() ?? "";
}

function normalizePhone(phone) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("218")) d = d.slice(3);
  if (d.startsWith("0"))   d = d.slice(1);
  return `+218${d}`;
}

// POST /api/edfali
// Body: { phone, amountLYD, orderId }
// Calls Adfali DoPTrans via SOAP — sends OTP SMS to customer
// Returns: { session_id }
export async function POST(req) {
  try {
    const { phone, amountLYD, orderId } = await req.json();

    if (!phone || !amountLYD) {
      return Response.json({ error: "رقم الهاتف والمبلغ مطلوبان" }, { status: 400 });
    }

    const value = await soapCall("DoPTrans", {
      Mobile:        process.env.EDFALI_MOBILE,
      Pin:           process.env.EDFALI_PIN,
      Cmobile:       normalizePhone(phone),
      decimalAmount: Math.round(Number(amountLYD)),
      PW,
    });

    if (!value) return Response.json({ error: "لم يتم الاتصال بخدمة ادفع لي" }, { status: 502 });
    if (ERROR_MESSAGES[value.toUpperCase()]) {
      return Response.json({ error: ERROR_MESSAGES[value.toUpperCase()] }, { status: 400 });
    }

    console.log("EDFALI DoPTrans OK — sessionId:", value, "order:", orderId);
    return Response.json({ success: true, session_id: value });

  } catch (err) {
    console.error("EDFALI INITIATE ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
