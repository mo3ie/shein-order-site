// Edfali (ادفع لي) — مصرف التجارة والتنمية
// SOAP 1.1 — Step 1: DoPTrans sends OTP to customer, returns sessionID
const ENDPOINT = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const SYS_PW   = "123@xdsr$#!!";

const ERRORS = {
  PW:    "كلمة مرور الخدمة خاطئة",
  PW1:   "كلمة مرور الخدمة خاطئة",
  ACC:   "الحساب التاجر غير مفعّل",
  LIMIT: "المبلغ خارج الحدود المسموح بها",
  BAL:   "رصيد غير كافٍ لدى العميل",
  NO:    "رقم الهاتف غير مسجل في ادفع لي",
};

function buildSoap(method, params) {
  const fields = Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join("");
  return `<?xml version="1.0" encoding="utf-8"?>\
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
xmlns:xsd="http://www.w3.org/2001/XMLSchema" \
xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\
<soap:Body><${method} xmlns="http://tempuri.org/">${fields}</${method}></soap:Body>\
</soap:Envelope>`;
}

function extractResult(xml, method) {
  return xml.match(new RegExp(`<${method}Result>([^<]*)<\/${method}Result>`))?.[1]?.trim() ?? "";
}

async function soapCall(method, params) {
  const body = buildSoap(method, params);
  console.log(`[edfali] → ${method}`, JSON.stringify(params));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method:  "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction":   `"http://tempuri.org/${method}"`,
      },
      body,
      cache:  "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("انتهت مهلة الاتصال بسيرفر ادفع لي (20 ث)");
    throw new Error(`تعذّر الاتصال بسيرفر ادفع لي: ${err.message}`);
  }
  clearTimeout(timer);

  const xml = await res.text();
  console.log(`[edfali] ← ${method} HTTP ${res.status} | raw:`, xml);

  if (!res.ok) throw new Error(`سيرفر ادفع لي أعاد خطأ HTTP ${res.status}`);

  const value = extractResult(xml, method);
  if (!value) throw new Error("رقم الهاتف غير مسجل في ادفع لي أو تعذّر إرسال رمز التحقق");

  console.log(`[edfali] result:`, value);
  return value;
}

function normalizePhone(phone) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("218")) d = d.slice(3);
  if (d.startsWith("0"))   d = d.slice(1);
  return d;
}

// POST /api/edfali
// Body: { phone, amountLYD, orderId }
export async function POST(req) {
  try {
    const { phone, amountLYD, orderId } = await req.json();

    if (!phone || !amountLYD)
      return Response.json({ error: "رقم الهاتف والمبلغ مطلوبان" }, { status: 400 });

    if (!process.env.EDFALI_MOBILE || !process.env.EDFALI_PIN)
      return Response.json({ error: "متغيرات البيئة EDFALI_MOBILE / EDFALI_PIN غير موجودة" }, { status: 500 });

    const normalized = normalizePhone(phone);
    const amount     = Math.round(Number(amountLYD));
    console.log(`[edfali] merchant: ${process.env.EDFALI_MOBILE}, customer: ${normalized}, amount: ${amount}, order: ${orderId}`);

    const value = await soapCall("DoPTrans", {
      Mobile:  process.env.EDFALI_MOBILE,
      Pin:     process.env.EDFALI_PIN,
      Cmobile: normalized,
      Amount:  amount,
      PW:      SYS_PW,
    });

    const upper  = value.toUpperCase();
    const errMsg = ERRORS[upper];
    if (errMsg) return Response.json({ error: `[${upper}] ${errMsg}` }, { status: 400 });

    console.log("[edfali] DoPTrans OK — sessionId:", value, "order:", orderId);
    return Response.json({ success: true, session_id: value });

  } catch (err) {
    console.error("[edfali] INITIATE ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
