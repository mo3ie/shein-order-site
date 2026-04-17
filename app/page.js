"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main style={main}>
      
      <div style={container}>
        
        <img src="/logo.png" style={{height:80, marginBottom:20}} />

        <h1 style={title}>
          TrendStore
        </h1>

        <p style={desc}>
          وسيط شراء من المواقع العالمية مثل SHEIN  
          نوفر لك طلبك بسهولة مع شحن سريع داخل ليبيا
        </p>

        <div style={box}>
          <h3>كيف يعمل الموقع؟</h3>

          <p>1. أرسل رابط السلة أو صورة الطلب</p>
          <p>2. نحسب لك السعر النهائي</p>
          <p>3. تأكيد الطلب</p>
          <p>4. اختيار طريقة الدفع</p>
          <p>5. التوصيل حتى بابك 🚚</p>
        </div>

        <button
          onClick={() => router.push("/order")}
          style={btn}
        >
          🚀 ابدأ الطلب الآن
        </button>

        <p style={note}>
          نحن وسيط شراء مستقل ولسنا تابعين لأي شركة
        </p>

      </div>

    </main>
  );
}

const main = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#000,#222)",
  color: "#fff",
  fontFamily: "system-ui"
};

const container = {
  textAlign: "center",
  maxWidth: "400px",
  padding: "20px"
};

const title = {
  fontSize: "32px",
  fontWeight: "bold",
  marginBottom: "10px"
};

const desc = {
  color: "#ccc",
  marginBottom: "20px"
};

const box = {
  background: "#111",
  padding: "15px",
  borderRadius: "12px",
  marginBottom: "20px",
  border: "1px solid #333"
};

const btn = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "#22c55e",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer"
};

const note = {
  marginTop: "15px",
  fontSize: "12px",
  color: "#888"
};