"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://grazynglhjuuxesgusgd.supabase.co",
  "sb_publishable_G0lZjONcFzTNl9wLlvJJpQ_1W7cedut"
);

export default function ConfirmPage() {
  const [order, setOrder] = useState(null);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const data = localStorage.getItem("pendingOrder");
  if (data) {
    const parsed = JSON.parse(data);
    setOrder(parsed);
    setPhone(parsed.phone); // 🔥 مهم جداً
  }
}, []);


  // إرسال OTP
  const sendOtp = async () => {
  setLoading(true);

  const formatPhone = (phone) => {
  // إزالة أي شيء ليس رقم
  let clean = phone.replace(/\D/g, "");

  // إزالة 0 من البداية
  clean = clean.replace(/^0/, "");

  // إذا لم يبدأ بـ 218 أضفها
  if (!clean.startsWith("218")) {
    clean = "218" + clean;
  }

  return "+" + clean;
};

const formattedPhone = formatPhone(phone);
console.log("FINAL PHONE:", formattedPhone);

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  console.log(error);

  if (error) {
    alert("فشل إرسال الكود");
  } else {
    alert("تم إرسال الكود");
  }

  setLoading(false);
};
  // تحقق OTP
  const verifyOtp = async () => {
  setLoading(true);

  const formattedPhone = phone.startsWith("+")
    ? phone
    : `+218${phone.replace(/^0/, "")}`;

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: otp,
    type: "sms",
  });

  if (error) {
    console.log(error);
    alert("الكود غير صحيح");
  } else {
    setVerified(true);
    alert("تم التحقق بنجاح");
  }

  setLoading(false);
};

  // الدفع
  const handlePay = async () => {
   
    const res = await fetch("/api/checkout", {
      
      method: "POST",
      body: JSON.stringify({
  amount: order.totalUSD,
  orderId: order.id
  
})

    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("فشل إنشاء رابط الدفع");
    }
  };

  if (!order) return <div style={{textAlign:"center"}}>جاري التحميل...</div>;

  return (
    <main style={mainStyle}>
      <div style={card}>

        <h2 style={{textAlign:"center"}}>تأكيد الطلب</h2>

        <div style={box}>
          <p><b>الاسم:</b> {order?.name}</p>
          <p><b>الهاتف:</b> {order?.phone}</p>
          <p><b>الرابط:</b> {order?.cartlink}</p>
        </div>

        {/* OTP */}
        {!verified && (
          <>
            <button onClick={sendOtp} style={btn}>
              {loading ? "..." : "إرسال كود التحقق"}
            </button>

            <input
              placeholder="أدخل الكود"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={input}
            />

            <button onClick={verifyOtp} style={btnBlack}>
              تحقق
            </button>
          </>
        )}

        {/* بعد التحقق */}
        {verified && (
          <button onClick={handlePay} style={btnBlack}>
            الدفع الآن
          </button>
        )}

      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  backgroundImage: "url('/bg.png')",
  backgroundSize: "cover",
  display: "flex",
  direction: "rtl",
  alignItems: "center",
  justifyContent: "center",
};

const card = {
  width: "400px",
  background: "#fff",
  padding: "20px",
  direction: "rtl",
  color:"#000",
  borderRadius: "16px",
};

const box = {
  background: "#f3f4f6",
  padding: "10px",
  color:"#000",
  direction: "rtl",
  borderRadius: "10px",
  marginBottom: "15px"
};

const input = {
  width: "100%",
  padding: "10px",
  direction: "rtl",
  marginTop: "10px",
  color:"#000",
  borderRadius: "8px",
  border: "1px solid #ddd"
};

const btn = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "#e5e7eb",
  border: "none",
  color:"#000",
  borderRadius: "10px",
};

const btnBlack = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "#000",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
};