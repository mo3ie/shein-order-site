// Adfali web service — مصرف التجارة و التنمية
// Protocol: SOAP 1.1 (HTTP GET is disabled on this server)
const ADFALI_ENDPOINT = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const PW = "123@xdsr$#!!";

const ERROR_MESSAGES = {
  LIMIT: "المبلغ خارج الحدود المسموح بها",
  PW1:   "خطأ في إعداد الخدمة",
  PW:    "خطأ في إعداد الخدمة",
  ACC:   "تعذّر معالجة الطلب — تحقق من إعدادات حساب ادفع لي التاجر",
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(ADFALI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": `http://tempuri.org/${method}` },
      body: soapBody(method, params),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw new Error("انتهت مهلة الاتصال بخدمة ادفع لي");
    throw new Error(`تعذّر الاتصال بخدمة ادفع لي: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`خدمة ادفع لي أعادت خطأ: ${res.status}`);
  const xml = await res.text();
  const tag = `${method}Result`;
  const value = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim() ?? "";
  if (!value) console.error(`[adfali] empty result for ${method}:`, xml.slice(0, 300));
  return value;
}

// Edfali expects number without leading zero (no +218 prefix)
// e.g. 0918621511 → 918621511
function normalizePhone(phone) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("218")) d = d.slice(3);
  if (d.startsWith("0"))   d = d.slice(1);
  return d;
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

    if (!process.env.EDFALI_MOBILE || !process.env.EDFALI_PIN) {
      return Response.json({ error: "إعدادات ادفع لي غير مكتملة" }, { status: 500 });
    }

    const normalized = normalizePhone(phone);
    console.log(`[edfali] phone: ${phone} → ${normalized}, amount: ${amountLYD}`);

    const value = await soapCall("DoPTrans", {
      Mobile:  process.env.EDFALI_MOBILE,
      Pin:     process.env.EDFALI_PIN,
      Cmobile: normalized,
      Amount:  Math.round(Number(amountLYD)),
      PW,
    });

    if (!value) return Response.json({ error: "لم يستجب سيرفر ادفع لي — حاول مرة أخرى" }, { status: 502 });
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
