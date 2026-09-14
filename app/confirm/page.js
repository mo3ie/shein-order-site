"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://grazynglhjuuxesgusgd.supabase.co",
  "sb_publishable_G0lZjONcFzTNl9wLlvJJpQ_1W7cedut"
);

export default function ConfirmPage() {
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    
    const id = localStorage.getItem("lastOrderId");
setOrderId(id);

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
  setLoading(true);
  try {
    const resOrder = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: order.name,
        phone: order.phone,
        cart_link: order.cartlink,
        price: order.price,
        image_url: order.image_url,
      }),
    });

    const orderData = await resOrder.json();
    const newOrderId = orderData.id;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: order.totalUSD,
        orderId: newOrderId,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("فشل إنشاء رابط الدفع");
    }
  } catch (err) {
    console.error(err);
    alert("خطأ في الدفع");
  }
  setLoading(false);
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
  background: "var(--t-page)",
  color: "var(--t-ink)",
  display: "flex",
  direction: "rtl",
  alignItems: "center",
  justifyContent: "center",
};

const card = {
  width: "420px",
  maxWidth: "94vw",
  background: "var(--t-card)",
  padding: "20px",
  direction: "rtl",
  color: "var(--t-ink)",
  borderRadius: "20px",
  boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
};

const box = {
  background: "var(--t-line)",
  padding: "10px",
  color: "var(--t-ink)",
  direction: "rtl",
  borderRadius: "10px",
  marginBottom: "15px"
};

const input = {
  width: "100%",
  padding: "10px",
  direction: "rtl",
  marginTop: "10px",
  color: "var(--t-ink)",
  borderRadius: "8px",
  border: "1.5px solid var(--t-line)"
};

const btn = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "var(--t-line)",
  border: "none",
  color: "var(--t-ink)",
  borderRadius: "10px",
};

const btnBlack = {
  width: "100%",
  padding: "14px",
  marginTop: "10px",
  background: "var(--t-solid)",
  color: "var(--t-on-solid)",
  border: "none",
  borderRadius: "13px",
  fontSize: "15px",
  fontWeight: 800,
  fontFamily: "inherit",
  cursor: "pointer",
};