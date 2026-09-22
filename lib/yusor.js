// Yusor Pay (يسر باي) — MITF / مسارات — bank-card identity + OTP, via the
// static-IP relay (x-relay-key). Same 3-step flow used across our apps:
//   Signin → OpenSession (bank sends OTP) → CompleteSession (OTP)
// CompleteSession MUST use the token returned by OpenSession, not the signin
// token (signin token → HTTP 403). Confirmed with Masarat.

function env(name) {
  return (process.env[name] || "").replace(/^﻿/, "").trim();
}

const BASE_URL = env("YUSOR_BASE_URL") || "http://160.19.103.122:40120/YusorOnline";

async function yusorCall(path, body, token) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const relayKey = env("YUSOR_RELAY_KEY");
  if (relayKey) headers["x-relay-key"] = relayKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/OnlinePaymentServices/${path}`, {
      method: "POST", headers, body: JSON.stringify(body), cache: "no-store", signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const code = err?.cause?.code || "";
    throw new Error(
      err.name === "AbortError" || code === "ETIMEDOUT"
        ? "انتهت مهلة الاتصال بخدمة يسر باي — IP الخادم غير مسموح به في قائمة مسارات"
        : `تعذّر الاتصال بخدمة يسر باي: ${err.message}`,
    );
  }
  clearTimeout(timer);

  const raw = await res.text();
  if (!res.ok) throw new Error(`خدمة يسر باي أعادت خطأ HTTP ${res.status}`);

  let envelope;
  try { envelope = JSON.parse(raw); } catch { throw new Error("تعذّر قراءة رد خدمة يسر باي"); }
  if (envelope.type !== 1) {
    throw new Error((envelope.messages || []).filter(Boolean).join(" — ") || "فشلت العملية لدى خدمة يسر باي");
  }
  return envelope;
}

// Step 1 — signin + OpenSession. Returns the SESSION token to persist.
export async function yusorInitiate({ identityCard, amount, orderId }) {
  const userId = Number(env("YUSOR_USER_ID"));
  const pin = env("YUSOR_PIN");
  const providerId = Number(env("YUSOR_PROVIDER_ID"));
  if (!userId || !pin || !providerId) throw new Error("بوابة يسر باي غير مهيّأة");

  const card = String(identityCard || "").replace(/\D/g, "");
  if (card.length < 9 || card.length > 10) {
    throw new Error("رقم البطاقة يجب أن يكون 9 أرقام (أو 10 لمصرف التجارة والتنمية)");
  }
  const amt = Math.round(Number(amount));
  if (!amt || amt <= 0) throw new Error("المبلغ غير صحيح");

  const signin = await yusorCall("Signin", {
    userId, pin, providerId, authUserType: Number(env("YUSOR_AUTH_USER_TYPE") || "0"),
  });
  const merchantToken = signin.content?.value;
  if (!merchantToken) throw new Error("لم تُرجع خدمة يسر باي رمز الدخول");

  const session = await yusorCall("OpenSession", {
    amount: amt, identityCard: card, transactionId: orderId, onlineOperation: 1,
  }, merchantToken);

  const sessionToken = session.content?.value;
  if (!sessionToken) throw new Error("لم تُرجع خدمة يسر باي رمز الجلسة");
  return sessionToken;
}

// Step 2 — confirm with the customer's OTP, using the OpenSession token.
export async function yusorConfirm({ sessionToken, otp }) {
  const code = String(otp || "").trim();
  if (!code) throw new Error("رمز التحقق مطلوب");
  await yusorCall("CompleteSession", { otp: code }, sessionToken);
}
