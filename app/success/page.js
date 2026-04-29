"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading");

  // ✅ عرّف sessionId قبل useEffect
  const sessionId = params.get("session_id");

  const orderId = params.get("orderId");
   

  useEffect(() => {
    const checkPayment = async () => {
      if (!orderId) {
        setStatus("pending");
        return;
      }

      try {
        // 1) نجيب الحالة من Supabase
        const { data, error } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .maybeSingle();

       

if (!data) {
  console.log("⚠️ الطلب غير موجود في قاعدة البيانات");
  setStatus("pending");
  return;
}

        // إذا مدفوع مسبقاً
        if (data?.status === "paid") {
          setStatus("pending");
          return;
        }

        // 2) تحقق من الدفع عبر API
        if (sessionId) {
          const res = await fetch("/api/verify-stripe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          const result = await res.json();
          console.log("VERIFY RESULT:", result);

          const paymentStatus = result?.data?.status;

          if (paymentStatus === "paid") {
            // تحديث الطلب
            await supabase
              .from("orders")
              .update({ status: "paid" })
              .eq("id", orderId);

            setStatus("paid");
          } else {
            setStatus("pending");
          }
        } else {
          setStatus("pending");
        }
      } catch (err) {
        console.error("Verify error:", err);
        setStatus("pending");
      }
    };

    checkPayment();
  }, [orderId, sessionId]);

  return (
    <div style={container}>
      <img src="/logo.png" style={logo} />

      <div style={card}>
        {status === "loading" && <h2>⏳ جاري التحقق من الدفع...</h2>}

        {status === "paid" && (
          <h2 style={{ color: "#22c55e" }}>✅ تم الدفع بنجاح</h2>
        )}

        {status === "pending" && (
          <h2 style={{ color: "#f59e0b" }}>⏳ الدفع قيد المراجعة</h2>
        )}

        <p style={text}>شكراً لك، تم استلام طلبك بنجاح</p>

        {orderId && (
          <div style={orderBox}>
            <div dir="rtl" style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
              <span style={{ fontSize: "20px" }}>رقم الطلب :</span>

              <span style={{ fontWeight: "bold" }}>{orderId}</span>

              <button
                onClick={() => navigator.clipboard.writeText(orderId)}
                style={{
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                نسخ
              </button>
            </div>

            {sessionId && (
              <p style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
                Session: {sessionId}
              </p>
            )}
          </div>
        )}

        <button
          style={button}
          onClick={() => {
            if (!orderId) {
              alert("رقم الطلب غير متوفر");
              return;
            }
            router.push(`/track?id=${orderId}`);
          }}
        >
          عرض الطلبية
        </button>
      </div>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={<div>⏳ تحميل...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

/* نفس الـ styles بدون أي تغيير */
const container = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8f8f8",
};

const logo = {
  width: "120px",
  marginBottom: "20px",
};

const card = {
  background: "#fff",
  color: "#666",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  textAlign: "center",
  width: "50%",
};

const text = {
  color: "#666",
  marginBottom: "20px",
};

const orderBox = {
  background: "#f1f1f1",
  padding: "10px",
  borderRadius: "10px",
  marginBottom: "20px",
};

const button = {
  width: "100%",
  padding: "12px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};