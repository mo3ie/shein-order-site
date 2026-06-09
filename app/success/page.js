"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

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

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", direction: "rtl" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>

      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── بطاقة الحالة ── */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", boxShadow: "0 8px 40px rgba(124,58,237,0.10)", border: "1px solid #ede9fe", textAlign: "center", animation: "pop 0.3s ease" }}>

          {/* أيقونة */}
          {isLoading ? (
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
          ) : isPaid ? (
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32, color: "#fff", boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}>✓</div>
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fffbeb", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>⏳</div>
          )}

          <h2 style={{ fontSize: 22, fontWeight: 800, color: isLoading ? "#9ca3af" : isPaid ? "#7c3aed" : "#d97706", marginBottom: 6 }}>
            {isLoading ? "جاري التحقق..." : isPaid ? "تم الدفع بنجاح! 🎉" : "في انتظار تأكيد الدفع"}
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 0 }}>
            {isLoading ? "نتحقق من حالة دفعك..." : isPaid ? "شكراً! تم استلام طلبك وسيتم معالجته قريباً" : "إذا اكتمل دفعك، يظهر التأكيد خلال لحظات تلقائياً"}
          </p>
        </div>

        {/* ── رقم الطلب ── */}
        {orderId && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, fontWeight: 600 }}>رقم الطلب</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f9fafb", borderRadius: 12, padding: "12px 14px" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1e1b4b", wordBreak: "break-all", fontFamily: "monospace" }}>
                {orderId}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  padding: "7px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: copied ? "#16a34a" : GRAD,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  transition: "background 0.2s",
                  minWidth: 80,
                }}
              >
                {copied ? "✓ تم النسخ" : "نسخ"}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 8, textAlign: "center" }}>
              ⚠️ احتفظ بهذا الرقم لمتابعة طلبك في أي وقت
            </p>
          </div>
        )}

        {/* ── ربط الطلب بالحساب ── */}
        {orderId && isPaid && !alreadyLinked && (
          <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 18, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>👤</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 4 }}>
                  {user ? "أضف هذا الطلب لحسابك" : "سجّل دخولك لمتابعة طلبك"}
                </p>
                <p style={{ fontSize: 12, color: "#7c3aed" }}>
                  {user
                    ? "ستجد طلبك في قائمة طلباتك وتتمكن من متابعته بسهولة"
                    : "أنشئ حساباً أو سجّل دخولك لإضافة هذا الطلب لقائمتك"}
                </p>
              </div>
            </div>

            {claimed ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", textAlign: "center", color: "#16a34a", fontWeight: 700, fontSize: 14 }}>
                ✅ تم إضافة الطلب لحسابك بنجاح
              </div>
            ) : (
              <>
                {claimErr && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>⚠️ {claimErr}</p>}
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: claiming ? 0.7 : 1, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
                >
                  {claiming ? "⏳ جاري الإضافة..." : user ? "إضافة لحسابي" : "تسجيل الدخول وإضافة الطلب"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── أزرار التنقل ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => orderId && router.push(`/track?id=${orderId}`)}
            style={{ width: "100%", padding: 14, background: GRAD, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
          >
            🔍 تتبع الطلب
          </button>
          <a href="/" style={{ display: "block", padding: 13, background: "#fff", color: "#6b7280", border: "1px solid #f3f4f6", borderRadius: 14, textDecoration: "none", fontWeight: 600, fontSize: 14, textAlign: "center" }}>
            طلب جديد
          </a>
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
