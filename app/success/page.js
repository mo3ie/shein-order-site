"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading");

  const orderId =
    params.get("orderId") ||
    (typeof window !== "undefined"
      ? localStorage.getItem("lastOrderId")
      : null);

  useEffect(() => {
  const checkPayment = async () => {
    if (!orderId) return;

    // 1) نجيب الحالة من قاعدة البيانات
    const { data } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    // إذا مدفوع مسبقاً
    if (data?.status === "paid") {
      setStatus("paid");
      return;
    }

    // 2) إذا ليس مدفوع → نتحقق من DPay
    if (sessionId) {
      try {
        const res = await fetch("/api/verify", {
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
          // تحديث الطلب في Supabase
          await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);

          setStatus("paid");
        } else {
          setStatus("pending");
        }
      } catch (err) {
        console.error("Verify error:", err);
        setStatus("pending");
      }
    } else {
      setStatus("pending");
    }
  };

  checkPayment();
}, [orderId, sessionId]);

  const sessionId = params.get("session_id");

  return (
    <div style={container}>
      {/* Logo */}
      <img src="/logo.png" style={logo} />

      {/* Card */}
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
            <div dir="rtl" className="flex items-center justify-center gap-2">
              <span className="text-gray-600" style={{ fontSize: "20px" }}>
                {" "}
                رقم الطلب :
              </span>

              {sessionId && (
                <p style={{ fontSize: "12px", color: "#999" }}>
                  Session: {sessionId}
                </p>
              )}

              <span className="font-bold">{orderId}</span>

              <button
                onClick={() => navigator.clipboard.writeText(orderId)}
                className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                style={{
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "5px 12px",
                  marginRight: "15px",
                  borderRadius: "8px",
                }}
              >
                نسخ
              </button>
            </div>
            <b>{orderId}</b>
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