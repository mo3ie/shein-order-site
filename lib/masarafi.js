// Masarafi Pay (مصرفي باي — مصرف الجمهورية) — MITF / مسارات. SAME REST API and
// OTP flow as Yusor, but a COMPLETELY SEPARATE service: own creds, mTLS cert/CA,
// host + port. Reached through its own static-IP relay path (x-relay-key).

function env(name) {
  return (process.env[name] || "").replace(/^﻿/, "").trim();
}

const BASE_URL = env("MUSRFY_BASE_URL") || "https://musrefypay-online.mitflink.ly:40110/JUMOnline";

async function masarafiCall(path, body, token) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const relayKey = env("MUSRFY_RELAY_KEY");
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
        ? "انتهت مهلة الاتصال بخدمة مصرفي باي — IP الخادم غير مسموح به في قائمة مسارات"
        : `تعذّر الاتصال بخدمة مصرفي باي: ${err.message}`,
    );
  }
  clearTimeout(timer);

  const raw = await res.text();
  if (!res.ok) throw new Error(`خدمة مصرفي باي أعادت خطأ HTTP ${res.status}`);

  let envelope;
  try { envelope = JSON.parse(raw); } catch { throw new Error("تعذّر قراءة رد خدمة مصرفي باي"); }
  if (envelope.type !== 1) {
    throw new Error((envelope.messages || []).filter(Boolean).join(" — ") || "فشلت العملية لدى خدمة مصرفي باي");
  }
  return envelope;
}

// Step 1 — signin + OpenSession. Returns the SESSION token to persist.
export async function masarafiInitiate({ identityCard, amount, orderId }) {
  const userId = Number(env("MUSRFY_USER_ID"));
  const pin = env("MUSRFY_PIN");
  const providerId = Number(env("MUSRFY_PROVIDER_ID"));
  if (!userId || !pin || !providerId) throw new Error("بوابة مصرفي باي غير مهيّأة");

  const card = String(identityCard || "").replace(/\D/g, "");
  if (card.length < 9 || card.length > 10) {
    throw new Error("رقم البطاقة يجب أن يكون 9 أرقام (أو 10 لمصرف التجارة والتنمية)");
  }
  const amt = Math.round(Number(amount));
  if (!amt || amt <= 0) throw new Error("المبلغ غير صحيح");

  const signin = await masarafiCall("Signin", {
    userId, pin, providerId, authUserType: Number(env("MUSRFY_AUTH_USER_TYPE") || "0"),
  });
  const merchantToken = signin.content?.value;
  if (!merchantToken) throw new Error("لم تُرجع خدمة مصرفي باي رمز الدخول");

  const session = await masarafiCall("OpenSession", {
    amount: amt, identityCard: card, transactionId: orderId, onlineOperation: 1,
  }, merchantToken);

  const sessionToken = session.content?.value;
  if (!sessionToken) throw new Error("لم تُرجع خدمة مصرفي باي رمز الجلسة");
  return sessionToken;
}

// Step 2 — confirm with the customer's OTP, using the OpenSession token.
export async function masarafiConfirm({ sessionToken, otp }) {
  const code = String(otp || "").trim();
  if (!code) throw new Error("رمز التحقق مطلوب");
  await masarafiCall("CompleteSession", { otp: code }, sessionToken);
}
