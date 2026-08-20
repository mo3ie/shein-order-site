// MobiCash (موبي كاش) — Wahda Bank card payments, merchant API-key auth
//
// Two-step card flow:
//   1. POST /payments/card            → bank sends an OTP to the customer,
//                                       returns a payment_uuid (valid 5 min)
//   2. POST /payments/card/verify-otp → confirms the sale with that OTP
//
// Auth is a single merchant API key sent in the JSON body (documented primary
// method). The payment_uuid is stored on the payments row between the steps.

// Trailing slashes are stripped so a value like "https://api.wahda.mobi/" —
// the form MobiCash hands out — cannot produce a double-slashed request path.
const BASE_URL = (process.env.MOBICASH_BASE_URL || "https://api.wahda.mobi").trim().replace(/\/+$/, "");
const API_KEY  = (process.env.MOBICASH_API_KEY  || "").trim();

// The API answers in English; customers read Arabic.
function arabicError(raw) {
  const e = (raw || "").toLowerCase();
  // Gateway-side outage. MobiCash wraps its own upstream failures inside the
  // same "failed to get customer details" text, so this must be checked first
  // — otherwise a MobiCash outage is reported to the customer as a bad card.
  if (e.includes("deadline exceeded") || e.includes("timeout") ||
      e.includes("failed to send request") || e.includes("connection refused") ||
      e.includes("no such host") || e.includes("bad gateway"))
    return "خدمة موبي كاش لا تستجيب حاليًا (عطل مؤقت لدى المزوّد) — يرجى المحاولة لاحقًا";
  if (e.includes("failed to get customer details")) return "رقم البطاقة غير صحيح أو غير مفعّل لدى موبي كاش";
  if (e.includes("invalid otp"))                    return "رمز التحقق غير صحيح";
  if (e.includes("maximum verification attempts"))  return "تم تجاوز عدد محاولات إدخال الرمز — يرجى بدء عملية دفع جديدة";
  if (e.includes("no bank reference"))              return "لم يستجب المصرف لعملية الدفع — يرجى المحاولة مجددًا";
  if (e.includes("expired") || e.includes("not found")) return "انتهت صلاحية جلسة الدفع (5 دقائق) — يرجى إعادة المحاولة";
  if (e.includes("insufficient"))                   return "الرصيد غير كافٍ في البطاقة";
  if (e.includes("api key") || e.includes("unauthorized") || e.includes("merchant"))
    return "بيانات تاجر موبي كاش غير صالحة";
  return raw || "فشلت العملية لدى موبي كاش";
}

async function call(path, body) {
  if (!API_KEY) throw new Error("مفتاح موبي كاش غير مضبوط (MOBICASH_API_KEY)");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  let res;
  try {
    res = await fetch(`${BASE_URL}/api/v1/merchant-api/${path}`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Accept:         "application/json",
        "X-API-Key":    API_KEY,
      },
      body:   JSON.stringify({ api_key: API_KEY, ...body }),
      cache:  "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("انتهت مهلة الاتصال بخدمة موبي كاش (25 ث)");
    throw new Error(`تعذّر الاتصال بخدمة موبي كاش: ${err.message}`);
  }
  clearTimeout(timer);

  const raw = await res.text();
  // Never log the card number / OTP — only the gateway's own answer.
  console.log(`[mobicash:${path}] HTTP ${res.status} |`, raw.slice(0, 400));

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`تعذّر قراءة رد خدمة موبي كاش (HTTP ${res.status})`);
  }

  if (!res.ok || json.status !== "success" || !json.data) {
    throw new Error(arabicError(json.error || json.message || ""));
  }

  return json.data;
}

// Step 1 — charge a card; the bank sends the cardholder an OTP.
// amount is in Libyan dinars and may carry fils (e.g. 10.5).
export async function initiateCardPayment({ cardNumber, amount, description }) {
  const card = String(cardNumber || "").replace(/\D/g, "");
  if (card.length < 5 || card.length > 19) throw new Error("رقم البطاقة غير صحيح");

  const amt = Math.round(Number(amount) * 100) / 100;
  if (!amt || amt <= 0) throw new Error("المبلغ غير صحيح");

  const data = await call("payments/card", {
    card_number: card,
    amount:      amt,
    description: description || "Shein order payment",
  });

  if (!data.payment_uuid) throw new Error("لم تُرجع خدمة موبي كاش معرّف العملية");

  const expiresIn = Number(data.expires_in) || 300;
  return {
    paymentUuid: data.payment_uuid,
    amount:      Number(data.amount ?? amt),
    expiresIn,
    expiresAt:   new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

// Step 2 — confirm with the OTP the cardholder received.
export async function verifyOtp({ paymentUuid, otp }) {
  const code = String(otp || "").trim();
  if (!code)        throw new Error("رمز التحقق مطلوب");
  if (!paymentUuid) throw new Error("لم تبدأ عملية الدفع");

  const data = await call("payments/card/verify-otp", { payment_uuid: paymentUuid, otp: code });

  return {
    uuid:                data.uuid,
    status:              data.status,
    amount:              Number(data.amount),
    currency:            data.currency || "LYD",
    bankReference:       data.bank_reference_number || null,
    bankTransactionDate: data.bank_transaction_date || null,
  };
}
