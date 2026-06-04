"use client";

import { Suspense } from "react";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";


if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

  
@keyframes zoomIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
;
 ` ;
  document.head.appendChild(style);
}



function TrackContent() {
  const params = useSearchParams();
  const id = params.get("id");

  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!id) return;

    localStorage.setItem("lastOrderId", id);

    const getOrder = async () => {
  const res = await fetch(`/api/order?id=${id}`);

  // 👇 تحقق أولاً
  if (!res.ok) {
    console.error("API ERROR:", res.status);
    return;
  }

  const text = await res.text();

  if (!text) {
    console.error("EMPTY RESPONSE");
    return;
  }

  const data = JSON.parse(text);

 if (data.success && data.order) {
  setOrder(data.order);
} else {
  console.log("❌ الطلب غير موجود");

  setOrder({
    status: "not_found",
    name: "-",
    phone: "-",
    price: "-",
    image_url: ""
  });
}

};

    getOrder();
  }, [id]);

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("INVOICE", 20, 20);

  doc.setFontSize(12);
  doc.text(`Order ID: ${id}`, 20, 40);

  doc.text(`Name: ${order.name}`, 20, 55);
  doc.text(`Phone: ${order.phone}`, 20, 65);

  doc.text(`Price: ${order.price} USD`, 20, 80);

  doc.setDrawColor(0);
  doc.line(20, 90, 180, 90);

  doc.setFontSize(14);
  doc.text("Status:", 20, 110);
  doc.text(order.status || "Processing", 80, 110);

  doc.save(`invoice-${id}.pdf`);
};

 if (!order) {
  return <p style={{ textAlign: "center", marginTop: 50 }}>⏳ جاري تحميل الطلب...</p>;
}

if (order.status === "not_found") {
  return (
    <p style={{ textAlign: "center", marginTop: 50 }}>
      ❌ الطلب غير موجود
    </p>
  );
}

const steps = ["new", "ordered", "shipped", "delivered"];

const currentStep = order?.status
  ? steps.indexOf(order.status)
  : 0;

console.log("STEP:", currentStep);

  return (
  <div style={container}>

    {/* ✅ Wrapper عمودي */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
      width: "100%",
      maxWidth: "420px"
    }}>

      {/* 🔥 Header */}
      <div style={header}>
        {copied && <p style={{ marginTop: 5 }}>✅ تم النسخ</p>}

        <div style={{
          background:"#fff",
          padding:"20px",
          borderRadius:"16px",
          width:"100%",
          boxShadow:"0 10px 25px rgba(0,0,0,0.1)"
        }}>
          <p style={{fontWeight:"bold"}}>📦 تتبع الطلب</p>

          <div style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            marginTop:"10px"
          }}>
            <span style={{fontSize:"14px", wordBreak:"break-all"}}>
              {id}
            </span>

            <button onClick={copyId} style={{
              background:"#000",
              color:"#fff",
              border:"none",
              padding:"5px 12px",
              borderRadius:"8px"
            }}>
              نسخ
            </button>
          </div>

          <p style={{
            fontSize:"12px",
            color:"#777",
            marginTop:"10px"
          }}>
            ⚠️ احتفظ بالرقم للرجوع لاحقاً
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{
        width:"100%",
        height: 6,
        background: "#e5e7eb",
        borderRadius: 10,
        overflow: "hidden"
      }}>
        <div style={{
          width: `${(currentStep / (steps.length - 1)) * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg, #000, #444)",
          transition: "width 0.6s ease"
        }} />
      </div>

      {/* Timeline */}
      <div style={{
        ...timelineBox,
        width:"100%"
      }}>
        {steps.map((step, index) => (
          <Step
            key={step}
            title={
              step === "new" ? "تم الاستلام" :
              step === "ordered" ? "قيد المعالجة" :
              step === "shipped" ? "جاري الشحن" :
              "تم التسليم"
            }
            active={index <= currentStep}
          />
        ))}
      </div>

      {/* Card */}
      <div style={{
        ...card,
        width:"100%"
      }}>

        <img
          src={order.image_url}
          onClick={() => setPreview(order.image_url)}
          style={{
            width: "100%",
            maxHeight: "200px",
            objectFit: "cover",
            borderRadius: "12px",
            marginBottom: "10px",
            cursor: "pointer"
          }}
        />

        <div style={{ textAlign:"right", lineHeight:"1.8" }}>
          <p><b>👤 الاسم:</b> {order.name}</p>
          <p><b>📞 الهاتف:</b> {order.phone}</p>
          <p><b>💰 السعر:</b> {order.price} $</p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        ...buttons,
        width:"100%"
      }}>
        <button onClick={() => window.print()} style={btnYellow}>
          🧾 طباعة
        </button>

        <button onClick={downloadPDF} style={btnBlue}>
          ⬇️ تحميل PDF
        </button>
      </div>

    </div>

    {/* Preview */}
    {preview && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999
        }}
        onClick={() => setPreview(null)}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
          }}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            color: "#fff",
            fontSize: "24px",
            cursor: "pointer"
          }}
        >
          ✕
        </div>
        <img
          src={preview}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "90%",
            maxHeight: "90%",
            borderRadius: "12px",
            animation: "zoomIn 0.3s ease"
          }}
        />
      </div>
    )}

  </div>

  
);


}

export default function Track() {
  return (
    <Suspense fallback={<div>⏳ جاري التحميل...</div>}>
      <TrackContent />
    </Suspense>
  );
}



/* 🧩 Step Component */
function Step({ title, active }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: active ? "#9333ea" : "#e5e7eb",
          margin: "0 auto",
          transition: "all 0.4s ease",
          transform: active ? "scale(1.15)" : "scale(1)",
          boxShadow: active ? "0 0 10px rgba(147,51,234,0.4)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "12px",
        }}
      />
      <p style={{
        fontSize: 12,
        color: active ? "#000" : "#999",
        marginTop: 6,
        transition: "0.3s",
        fontWeight: active ? "bold" : "normal"
      }}>
        {title}
      </p>
    </div>
  );
}

/* 🎨 Styles */

const container = {
  minHeight: "calc(100vh - 60px)",
  background: "#f5f5f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
};

const header = {
  background: "#fff",
  border: "1px solid #ebebeb",
  color: "#111",
  padding: "16px 20px",
  borderRadius: "16px",
  marginBottom: 0,
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
};

const idBox = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  background: "#f5f5f5",
  padding: "10px 14px",
  borderRadius: 10,
};

const copyBtn = {
  background: "#111",
  color: "#fff",
  border: "none",
  padding: "6px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
};

const note = {
  fontSize: 12,
  marginTop: 10,
  color: "#999",
};

const timelineBox = {
  display: "flex",
  justifyContent: "space-between",
  background: "#fff",
  border: "1px solid #ebebeb",
  padding: "16px",
  borderRadius: "16px",
  marginBottom: 0,
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const card = {
  background: "#fff",
  border: "1px solid #ebebeb",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  color: "#111",
};

const image = {
  width: "100%",
  borderRadius: 12,
  marginTop: 10,
};

const buttons = {
  display: "flex",
  gap: 10,
  marginTop: 4,
};

const btnYellow = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #ebebeb",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

const btnBlue = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "#111",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};


