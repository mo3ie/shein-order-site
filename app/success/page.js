"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, SectionTitle, Button, Icon, I, GRAD_HEAD, PAGE, CARD, CHIP, PRIMARY, INK, MUTED, FAINT, LINE } from "@/app/components/ui";

const GRAD = "linear-gradient(135deg,#7c3aed,#3b82f6)";

function SuccessContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const pollRef = useRef(null);

  const orderId    = params.get("orderId");
  const sessionId  = params.get("session_id");
  const viaDpay    = params.get("via") === "dpay";
  const viaMoamalat = params.get("via") === "moamalat";
  const moamalatPaid = params.get("paid") === "1";

  const [status,    setStatus]    = useState("loading");
  const [copied,    setCopied]    = useState(false);
  const [user,      setUser]      = useState(null);
  const [claiming,  setClaiming]  = useState(false);
  const [claimed,   setClaimed]   = useState(false);
  const [claimErr,  setClaimErr]  = useState("");
  const [orderData, setOrderData] = useState(null);

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  // ── Payment verification ─────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) { setStatus("pending"); return; }

    // If returning from trendstore-ly.com/moamalat-pay after successful payment,
    // confirm immediately before polling.
    if (viaMoamalat && moamalatPaid) {
      fetch("/api/moamalat/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
    }

    const check = async () => {
      const { data } = await supabase
        .from("orders")
        .select("status, user_id, name, phone, price")
        .eq("id", orderId)
        .maybeSingle();

      if (data) setOrderData(data);

      if (data?.status === "paid" || data?.status === "confirmed") {
        setStatus("paid");
        clearInterval(pollRef.current);
        return;
      }

      if (sessionId) {
        const res    = await fetch("/api/verify-stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const result = await res.json();
        if (result?.success) { setStatus("paid"); clearInterval(pollRef.current); return; }
      }

      if (viaDpay) {
        const dpaySession = localStorage.getItem("dpaySession");
        if (dpaySession) {
          const res    = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: dpaySession, order_id: orderId }),
          });
          const result = await res.json();
          if (result?.success) {
            localStorage.removeItem("dpaySession");
            setStatus("paid");
            clearInterval(pollRef.current);
            return;
          }
        }
      }

      setStatus("pending");
    };

    check();
    pollRef.current = setInterval(check, 3000);
    setTimeout(() => clearInterval(pollRef.current), 60000);
    return () => clearInterval(pollRef.current);
  }, [orderId, sessionId, viaDpay]);

  // ── Copy ─────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Claim ────────────────────────────────────────────────────────────────
  const handleClaim = async () => {
    if (!user) {
      // حفظ orderId ثم توجيه للدخول
      sessionStorage.setItem("claimOrderId", orderId);
      router.push(`/login?next=/success?orderId=${orderId}&via=${viaDpay ? "dpay" : "stripe"}`);
      return;
    }
    setClaiming(true);
    setClaimErr("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/order/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      const result = await res.json();
      if (result.success) { setClaimed(true); }
      else { setClaimErr(result.error || "فشل الربط"); }
    } catch { setClaimErr("خطأ في الاتصال"); }
    finally { setClaiming(false); }
  };

  const isPaid    = status === "paid";
  const isLoading = status === "loading";
  const alreadyLinked = orderData?.user_id;
  const lyd = orderData?.final_total ?? orderData?.price_lyd;

  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, direction: "rtl", paddingBottom: 40 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pop{0%{transform:scale(0.92);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>

      <div className="form-inner" style={{ maxWidth: 460, margin: "0 auto" }}>

        {/* ── الحصيلة في الترويسة: نجح الدفع أم ما زال معلّقًا، وبكم ── */}
        <div style={{
          background: isPaid ? GRAD_HEAD : "var(--t-amber-bg)",
          color: isPaid ? "#fff" : "var(--t-amber-ink)",
          padding: "28px 20px 30px", position: "relative", overflow: "hidden", textAlign: "center",
        }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />

          <span style={{
            width: 62, height: 62, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: isPaid ? "rgba(255,255,255,0.2)" : "var(--t-card)", marginBottom: 14, position: "relative",
            animation: "pop .3s ease",
          }}>
            {isLoading
              ? <span style={{ width: 26, height: 26, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", animation: "spin .8s linear infinite" }} />
              : <Icon path={isPaid ? I.check : I.clock} size={28} color={isPaid ? "#fff" : "var(--t-amber-ink)"} stroke={2.4} />}
          </span>

          <div style={{ fontSize: 22, fontWeight: 900, position: "relative" }}>
            {isLoading ? "جاري التحقق..." : isPaid ? "تم الدفع بنجاح" : "في انتظار تأكيد الدفع"}
          </div>
          <div style={{ fontSize: 13.5, opacity: 0.85, marginTop: 7, lineHeight: 1.8, position: "relative" }}>
            {isLoading ? "نتحقّق من حالة دفعك الآن..."
              : isPaid ? "استلمنا طلبك وبدأنا العمل عليه."
              : "إن اكتمل دفعك يظهر التأكيد هنا خلال لحظات تلقائيًا."}
          </div>

          {isPaid && lyd != null && (
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, marginTop: 16, background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "7px 16px", position: "relative" }}>
              <span style={{ fontSize: 20, fontWeight: 900 }}>{Number(lyd).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.9 }}>د.ل</span>
            </div>
          )}
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>

          {/* ── رقم الطلب ── */}
          {orderId && (
            <Card pad={16}>
              <SectionTitle icon={I.box} size={14.5}>رقم الطلب</SectionTitle>
              <div style={{ display: "flex", gap: 10, alignItems: "center", background: CHIP, borderRadius: 13, padding: "12px 14px" }}>
                <span style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 13, wordBreak: "break-all" }}>{orderId}</span>
                <button onClick={handleCopy} style={{
                  padding: "9px 15px", borderRadius: 11, border: "none", cursor: "pointer",
                  background: copied ? "var(--t-green-bg)" : CARD, color: copied ? "var(--t-green-ink)" : PRIMARY,
                  fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                }}>
                  <Icon path={copied ? I.check : I.copy} size={14} />
                  {copied ? "نُسخ" : "نسخ"}
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: FAINT, margin: "10px 0 0", lineHeight: 1.8 }}>
                احتفظ بهذا الرقم لمتابعة طلبك في أي وقت من صفحة التتبّع.
              </p>
            </Card>
          )}

          {/* ── ربط الطلب بالحساب ── */}
          {orderId && isPaid && !alreadyLinked && (
            <Card pad={18} style={{ border: "1.5px solid var(--t-accent-line)" }}>
              <SectionTitle icon={I.user} size={14.5}>
                {user ? "أضف هذا الطلب لحسابك" : "سجّل دخولك لمتابعة طلبك"}
              </SectionTitle>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.85, margin: "0 0 13px" }}>
                {user ? "ستجده بعدها في قائمة طلباتك تلقائيًا."
                      : "أنشئ حسابًا أو سجّل دخولك لإضافة هذا الطلب إلى قائمتك."}
              </p>
              {claimed ? (
                <div style={{ display: "flex", gap: 9, alignItems: "center", background: "var(--t-green-bg)", border: "1px solid var(--t-green-line)", color: "var(--t-green-ink)", borderRadius: 13, padding: "12px 14px", fontSize: 13.5, fontWeight: 700 }}>
                  <Icon path={I.check} size={17} stroke={2.3} />
                  تم إضافة الطلب لحسابك
                </div>
              ) : (<>
                {claimErr && (
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "11px 13px", marginBottom: 11, fontSize: 13 }}>
                    <Icon path={I.alert} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{claimErr}</span>
                  </div>
                )}
                <Button onClick={handleClaim} disabled={claiming} icon={I.user} style={{ opacity: claiming ? 0.65 : 1 }}>
                  {claiming ? "جاري الإضافة..." : user ? "إضافة لحسابي" : "تسجيل الدخول وإضافة الطلب"}
                </Button>
              </>)}
            </Card>
          )}

          {/* ── ما التالي: يعرف الزبون ما ينتظره بدل أن يسأل ── */}
          {isPaid && (
            <Card pad={16}>
              <SectionTitle icon={I.truck} size={14.5}>ما الذي يحدث الآن</SectionTitle>
              {[
                { icon: I.cart,  text: "نشتري سلتك من شي إن بحسابنا خلال ساعات." },
                { icon: I.truck, text: "نتابع شحنها إلى مستودعنا ثم إلى ليبيا." },
                { icon: I.phone, text: "نتصل بك على رقمك عند وصول الطلب وتحديد رسوم الشحن." },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "9px 0" }}>
                  <Icon path={r.icon} size={17} color={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.8 }}>{r.text}</span>
                </div>
              ))}
            </Card>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <Button onClick={() => orderId && router.push(`/track?id=${orderId}`)} icon={I.search} style={{ flex: 1 }}>
              تتبّع الطلب
            </Button>
            <a href="/" style={{ flex: 1, textDecoration: "none" }}>
              <Button kind="ghost" icon={I.plus} style={{ width: "100%" }}>طلب جديد</Button>
            </a>
          </div>

          <div style={{ textAlign: "center" }}>
            <a href="/my-orders" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>كل طلباتي ←</a>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Success() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>⏳</div>}>
      <SuccessContent />
    </Suspense>
  );
}
