// Adfali direct web service — مصرف التجارة و التنمية
const ADFALI_URL = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const PW = "123@xdsr$#!!";

const ERROR_MESSAGES = {
  PW1:   "خطأ في إعداد الخدمة",
  PW:    "خطأ في إعداد الخدمة",
  Limit: "المبلغ خارج الحدود المسموح بها",
  ACC:   "رقم الهاتف غير مسجل في ادفع لي",
  Bal:   "تعذّر إتمام العملية",
};

function extractXml(xml) {
  return xml.match(/<string[^>]*>([^<]*)<\/string>/)?.[1]?.trim() ?? "";
}

function normalizePhone(phone) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("218")) d = d.slice(3);
  if (d.startsWith("0"))   d = d.slice(1);
  return `+218${d}`;
}

// POST /api/edfali
// Body: { phone, amountLYD, orderId }
// Calls Adfali DoPTrans — sends OTP SMS to customer
// Returns: { session_id }
export async function POST(req) {
  try {
    const { phone, amountLYD, orderId } = await req.json();

    if (!phone || !amountLYD) {
      return Response.json({ error: "رقم الهاتف والمبلغ مطلوبان" }, { status: 400 });
    }

    const mobile  = process.env.EDFALI_MOBILE;
    const pin     = process.env.EDFALI_PIN;
    const cmobile = normalizePhone(phone);

    const url = new URL(`${ADFALI_URL}/DoPTrans`);
    url.searchParams.set("Mobile",        mobile);
    url.searchParams.set("Pin",           pin);
    url.searchParams.set("Cmobile",       cmobile);
    url.searchParams.set("decimalAmount", String(Math.round(Number(amountLYD))));
    url.searchParams.set("PW",            PW);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const xml = await res.text();
    const value = extractXml(xml);

    if (!value) {
      return Response.json({ error: "لم يتم الاتصال بخدمة ادفع لي" }, { status: 502 });
    }
    if (ERROR_MESSAGES[value]) {
      return Response.json({ error: ERROR_MESSAGES[value] }, { status: 400 });
    }

    // value is sessionID
    console.log("EDFALI DoPTrans OK — sessionId:", value, "order:", orderId);
    return Response.json({ success: true, session_id: value });

  } catch (err) {
    console.error("EDFALI INITIATE ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
