"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { Screen, Card, SectionTitle, Button, Icon, I, inputStyle, PRIMARY, INK, MUTED, FAINT, LINE, CARD, CHIP } from "@/app/components/ui";

/**
 * دفع طلب موجود.
 *
 * الطلب يُنشأ قبل الدفع (البوابة تحتاج رقمًا تُحوّل إليه)، فمن أغلق الصفحة قبل
 * إتمام الدفع كان طلبه يبقى معلّقًا بلا طريق للعودة إليه. هذه الشاشة هي ذلك
 * الطريق: تفتح بـ /pay?order=<id> من زرّ "أكمل الدفع" في طلباتي.
 *
 * طرق الدفع هي نفسها في ورقة الدفع الأصلية، لكنها هنا تعمل على طلب قائم بدل
 * إنشاء طلب جديد — فلا يتضاعف الطلب بمحاولتين.
 */
function PayContent() {
  const { t } = useLang();
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("order");

  const [order, setOrder]   = useState(null);
  const [state, setState]   = useState("loading"); // loading | ready | missing | paid
  const [wallet, setWallet] = useState(null);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");

  // موبي كاش: بطاقة ثم رمز
  const [mcStep, setMcStep] = useState(null);
  const [mcCard, setMcCard] = useState("");
  const [mcOtp, setMcOtp]   = useState("");

  const due = Number(order?.final_total ?? order?.price_lyd ?? 0);

  useEffect(() => {
    if (!orderId) { setState("missing"); return; }
    (async () => {
      const res = await fetch(`/api/order?id=${encodeURIComponent(orderId)}`);
      const data = await res.json().catch(() => ({}));
      if (!data.success || !data.order) { setState("missing"); return; }
      setOrder(data.order);
      setState(!["new", "pending", null, ""].includes(data.order.status) ? "paid" : "ready");
    })();
  }, [orderId]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/wallet", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json().catch(() => ({}));
      setWallet({ balance: Number(data.balance || 0) });
    })();
  }, []);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  async function payFromWallet() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ type: "debit", amount: Number(due.toFixed(2)), method: "wallet", order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || t("تعذّر الدفع من المحفظة"));
      router.push(`/success?orderId=${orderId}&via=wallet`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function payMoamalat() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await supabase.from("payments").insert({ order_id: orderId, method: "moamalat", status: "pending", amount: due });
      const res = await fetch("/api/moamalat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amountLYD: due }),
      });
      const p = await res.json();
      if (!p.success) throw new Error(p.error || t("فشل تهيئة بوابة الدفع"));

      const origin = window.location.origin;
      const qs = new URLSearchParams({
        mid: p.MID, tid: p.TID, amount: p.AmountTrxn, ref: p.MerchantReference,
        datetime: p.TrxDateTime, hash: p.SecureHash, script: p.scriptUrl,
        return: `${origin}/success?orderId=${orderId}&via=moamalat`,
        cancel: origin,
      });
      window.location.href = `https://www.trendstore-ly.com/moamalat-pay?${qs.toString()}`;
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function mobicashSend() {
    const card = mcCard.replace(/\D/g, "");
    if (card.length < 5) { setError(t("أدخل رقم بطاقة موبي كاش")); return; }
    setBusy(true); setError("");
    try {
      await supabase.from("payments").insert({ order_id: orderId, method: "mobicash", status: "pending", amount: due });
      const res = await fetch("/api/mobicash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amountLYD: due, cardNumber: card }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || t("فشل إرسال رمز التحقق"));
      setMcStep("otp");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function mobicashVerify() {
    if (mcOtp.length < 4) { setError(t("أدخل رمز التحقق")); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/mobicash/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, otp: mcOtp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || t("رمز التحقق خاطئ"));
      router.push(`/success?orderId=${orderId}&via=mobicash`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <Screen title={t("إتمام الدفع")} nav={false} width={440}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "60px 0" }}>
          <span style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${LINE}`, borderTopColor: PRIMARY, animation: "spin .8s linear infinite" }} />
          <p style={{ color: FAINT, fontSize: 14, fontWeight: 600 }}>{t("جاري التحميل...")}</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Screen>
    );
  }

  if (state === "missing") {
    return (
      <Screen title={t("إتمام الدفع")} nav={false} width={440}>
        <Card style={{ textAlign: "center", padding: "44px 20px" }}>
          <span style={{ width: 52, height: 52, borderRadius: 18, background: "var(--t-red-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon path={I.alert} size={23} color="var(--t-red-ink)" />
          </span>
          <p style={{ fontWeight: 800, fontSize: 16 }}>{t("الطلب غير موجود")}</p>
          <p style={{ fontSize: 13, color: FAINT, margin: "6px 0 18px", lineHeight: 1.85 }}>
            {t("الطلب غير المدفوع يُحذف بعد ساعة من إنشائه. ابدأ طلبًا جديدًا.")}
          </p>
          <a href="/" style={{ textDecoration: "none" }}>
            <Button icon={I.plus} style={{ width: "auto", margin: "0 auto", padding: "13px 24px" }}>{t("طلب جديد")}</Button>
          </a>
        </Card>
      </Screen>
    );
  }

  if (state === "paid") {
    return (
      <Screen title={t("إتمام الدفع")} nav={false} width={440}>
        <Card style={{ textAlign: "center", padding: "44px 20px" }}>
          <span style={{ width: 52, height: 52, borderRadius: 18, background: "var(--t-green-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon path={I.check} size={24} color="var(--t-green-ink)" stroke={2.4} />
          </span>
          <p style={{ fontWeight: 800, fontSize: 16 }}>{t("هذا الطلب مدفوع بالفعل")}</p>
          <a href={`/track?id=${orderId}`} style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>
            <Button kind="ghost" icon={I.search} style={{ width: "auto", padding: "13px 24px" }}>{t("تتبّع الطلب")}</Button>
          </a>
        </Card>
      </Screen>
    );
  }

  const enough = wallet && wallet.balance + 0.001 >= due;

  return (
    <Screen title={t("إتمام الدفع")} subtitle={t("أكمل دفع طلبك — الطلب غير المدفوع يُحذف بعد ساعة.")} nav={false} width={440}>
      {/* المبلغ أولاً */}
      <Card pad={16} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 3 }}>{t("المبلغ المستحق")}</div>
          <div style={{ fontSize: 12, color: FAINT, fontFamily: "ui-monospace, monospace" }}>#{String(orderId).slice(0, 8)}</div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1 }}>{due.toFixed(0)}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{t("د.ل")}</div>
        </div>
      </Card>

      {error && (
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", fontSize: 13 }}>
          <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {mcStep === "otp" ? (
        <Card pad={18}>
          <SectionTitle icon={I.lock}>{t("تحقق من رمز موبي كاش")}</SectionTitle>
          <input
            inputMode="numeric" placeholder="······" value={mcOtp}
            onChange={(e) => setMcOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            style={{ ...inputStyle, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 10, direction: "ltr", marginBottom: 14 }}
          />
          <Button onClick={mobicashVerify} disabled={busy} icon={I.check} style={{ opacity: busy ? 0.65 : 1 }}>
            {busy ? t("جاري التحقق...") : t("تأكيد الدفع")}
          </Button>
          <Button kind="ghost" onClick={() => { setMcStep(null); setMcOtp(""); }} style={{ marginTop: 10 }}>
            {t("رجوع")}
          </Button>
        </Card>
      ) : mcStep === "card" ? (
        <Card pad={18}>
          <SectionTitle icon={I.phone}>{t("موبي كاش")}</SectionTitle>
          <input
            inputMode="numeric" placeholder={t("رقم البطاقة")} value={mcCard}
            onChange={(e) => setMcCard(e.target.value.replace(/\D/g, "").slice(0, 19))}
            style={{ ...inputStyle, textAlign: "center", fontSize: 20, fontWeight: 800, letterSpacing: 4, direction: "ltr", marginBottom: 14 }}
          />
          <Button onClick={mobicashSend} disabled={busy} icon={I.phone} style={{ opacity: busy ? 0.65 : 1 }}>
            {busy ? t("جاري إرسال رمز التحقق...") : t("إرسال رمز التحقق")}
          </Button>
          <Button kind="ghost" onClick={() => setMcStep(null)} style={{ marginTop: 10 }}>{t("رجوع")}</Button>
        </Card>
      ) : (<>
        {/* المحفظة أولاً: أسرع طريق وبلا رمز تحقق */}
        {wallet && (
          <Card pad={16} style={{ background: "linear-gradient(140deg,#0f766e,#14b8a6)", color: "#fff", boxShadow: "0 6px 18px rgba(15,118,110,0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon path={I.wallet} size={18} color="#fff" />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{t("محفظتي")}</div>
                <div style={{ fontSize: 12.5, opacity: 0.9 }}>{t("الرصيد")} {wallet.balance.toFixed(2)} {t("د.ل")}</div>
              </div>
            </div>
            {enough ? (
              <Button onClick={payFromWallet} disabled={busy}
                style={{ background: "#0b5d56", color: "#fff", boxShadow: "none", opacity: busy ? 0.65 : 1 }}>
                {busy ? t("جاري الدفع...") : `${t("ادفع من المحفظة")} · ${due.toFixed(0)} ${t("د.ل")}`}
              </Button>
            ) : (
              <p style={{ fontSize: 12.5, margin: 0, lineHeight: 1.85, background: "rgba(255,255,255,0.16)", borderRadius: 11, padding: "10px 12px" }}>
                {t("الرصيد لا يكفي لهذا الطلب")} ({due.toFixed(0)} {t("د.ل")}).
              </p>
            )}
          </Card>
        )}

        <Card pad={16}>
          <SectionTitle icon={I.bank} size={14.5}>{t("اختر طريقة الدفع")}</SectionTitle>

          <button onClick={() => setMcStep("card")} disabled={busy} style={payRow}>
            <span style={payIcon}><Icon path={I.phone} size={18} color={PRIMARY} /></span>
            <span style={{ flex: 1, minWidth: 0, textAlign: "start" }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{t("موبي كاش")}</span>
              <span style={{ display: "block", fontSize: 12.5, color: MUTED, marginTop: 2 }}>{t("بطاقة مصرف الوحدة — برمز تحقق")}</span>
            </span>
            <span style={{ fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap" }}>{due.toFixed(0)} {t("د.ل")}</span>
          </button>

          <button onClick={payMoamalat} disabled={busy} style={payRow}>
            <span style={payIcon}><Icon path={I.bank} size={18} color={PRIMARY} /></span>
            <span style={{ flex: 1, minWidth: 0, textAlign: "start" }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{t("معاملات")}</span>
              <span style={{ display: "block", fontSize: 12.5, color: MUTED, marginTop: 2 }}>{t("بطاقة مصرفية — نافذة آمنة")}</span>
            </span>
            <span style={{ fontWeight: 900, fontSize: 13.5, whiteSpace: "nowrap" }}>{due.toFixed(0)} {t("د.ل")}</span>
          </button>
        </Card>
      </>)}

      <div style={{ textAlign: "center" }}>
        <a href="/my-orders" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>{t("طلباتي")}</a>
      </div>
    </Screen>
  );
}

const payRow = {
  width: "100%", display: "flex", alignItems: "center", gap: 12, marginBottom: 9,
  padding: "13px 14px", borderRadius: 15, background: CARD, border: `1.5px solid ${LINE}`,
  cursor: "pointer", fontFamily: "inherit", color: INK,
};
const payIcon = {
  width: 38, height: 38, borderRadius: 12, background: CHIP,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

export default function PayPage() {
  return (
    <Suspense fallback={null}>
      <PayContent />
    </Suspense>
  );
}
