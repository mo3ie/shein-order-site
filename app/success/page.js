"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const sessionId = params.get("session_id");
  const orderId = params.get("orderId");

  useEffect(() => {
    const checkPayment = async () => {
      if (!orderId) { setStatus("pending"); return; }

      try {
        const { data } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .maybeSingle();

        if (!data) { setStatus("pending"); return; }
        if (data?.status === "paid") { setStatus("paid"); return; }

        if (sessionId) {
          const res = await fetch("/api/verify-stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const result = await res.json();
          if (result?.data?.status === "paid") {
            await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
            setStatus("paid");
          } else {
            setStatus("pending");
          }
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    };

    checkPayment();
  }, [orderId, sessionId]);

  const isPaid = status === "paid";
  const isLoading = status === "loading";

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "440px",
        background: "#fff",
        borderRadius: "24px",
        padding: "40px 32px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        border: "1px solid #ebebeb",
        textAlign: "center",
      }}>

        {/* Icon */}
        {isLoading ? (
          <div style={{
            width: "72px", height: "72px",
            borderRadius: "50%",
            border: "4px solid #ebebeb",
            borderTopColor: "#9333ea",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 24px",
          }} />
        ) : isPaid ? (
          <div style={{
            width: "80px", height: "80px",
            borderRadius: "50%",
            background: "#f0fdf4",
            border: "2px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "40px",
          }}>
            ✓
          </div>
        ) : (
          <div style={{
            width: "80px", height: "80px",
            borderRadius: "50%",
            background: "#fffbeb",
            border: "2px solid #fde68a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "40px",
          }}>
            ⏳
          </div>
        )}

        {/* Title */}
        <h2 style={{
          fontSize: "22px",
          fontWeight: "800",
          color: isLoading ? "#666" : isPaid ? "#15803d" : "#d97706",
          marginBottom: "8px",
        }}>
          {isLoading ? "جاري التحقق..." : isPaid ? "تم الدفع بنجاح!" : "قيد المراجعة"}
        </h2>

        <p style={{ color: "#888", fontSize: "14px", marginBottom: "28px" }}>
          {isLoading ? "نتحقق من حالة الدفع..." : "شكراً لك، تم استلام طلبك"}
        </p>

        {/* Order ID */}
        {orderId && (
          <div style={{
            background: "#f8f8f8",
            border: "1px solid #ebebeb",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
          }}>
            <p style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>رقم الطلب</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <span style={{ fontWeight: "700", fontSize: "15px", color: "#111", wordBreak: "break-all" }}>
                {orderId}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(orderId)}
                style={{
                  background: "#111", color: "#fff",
                  border: "none", padding: "5px 12px",
                  borderRadius: "8px", cursor: "pointer",
                  fontSize: "12px", fontWeight: "600",
                  whiteSpace: "nowrap",
                }}
              >
                نسخ
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#bbb", marginTop: "8px" }}>
              ⚠️ احتفظ بهذا الرقم لتتبع طلبك
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => {
            if (!orderId) { alert("رقم الطلب غير متوفر"); return; }
            router.push(`/track?id=${orderId}`);
          }}
          style={{
            width: "100%",
            padding: "14px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "15px",
            marginBottom: "12px",
          }}
        >
          تتبع الطلب
        </button>

        <a href="/" style={{
          display: "block",
          padding: "13px",
          background: "#f5f5f5",
          color: "#555",
          border: "1px solid #ebebeb",
          borderRadius: "12px",
          textDecoration: "none",
          fontWeight: "500",
          fontSize: "14px",
        }}>
          العودة للرئيسية
        </a>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        ⏳ تحميل...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
