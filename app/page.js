"use client";

import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();

  return (
    <main style={mainStyle}>

      {/* أزرار أعلى */}
      <div style={topBar}>
        <button style={topBtn}>من نحن</button>
        <button style={topBtn}>تواصل</button>
        <button onClick={()=>router.push("/login")} style={topBtnBlack}>
          تسجيل دخول
        </button>
      </div>

      <div style={cardStyle}>

        {/* اللوقو بالمنتصف */}
        <div style={{textAlign:"center"}}>
          <img src="/logo.png" style={{height:90,}} />
        </div>

        <h3 style={{textAlign:"center", marginTop:10, color:"#111"}}>
          منتجاتك و سلتك بضغطة زر تكون عندك
        </h3>

        <p style={desc}>
         نحن وسيط شراء مستقل ولسنا تابعين لأي شركة
        </p>

        {/* زر الطلب */}
        <button
          onClick={()=>router.push("/order")}
          style={mainBtn}
        >
          إرسال طلب جديد
        </button>

        {/* تتبع */}
        <div style={{display:"flex", gap:10, marginTop:10 , color:"#111"}}>
          <input placeholder="أدخل رقم الطلب" style={input}/>
          <button style={searchBtn}>بحث</button>
        </div>

        {/* حساب */}
        <button
          onClick={()=>router.push("/signup")}
          style={{secondaryBtn, color:"#111"} }
        >
          إنشاء حساب
        </button>

      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  backgroundImage: "url('/bg.png')", // نفس خلفية الطلب
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle = {
  width: "400px",
  background: "#fff",
  padding: "25px",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
};

const desc = {
  textAlign: "center",
  color: "#666",
  fontSize: "14px",
  marginBottom: "15px"
};

const mainBtn = {
  width: "100%",
  padding: "14px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  marginTop: "10px"
};

const secondaryBtn = {
  width: "100%",
  padding: "12px",
  background: "#f3f4f6",
  border: "none",
  borderRadius: "10px",
  marginTop: "10px",
  cursor: "pointer"
};

const input = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd"
};

const searchBtn = {
  padding: "10px",
  background: "#000",
  color: "#fff",
  borderRadius: "8px",
  border: "none"
};

const topBar = {
  position: "absolute",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "10px"
};

const topBtn = {
  padding: "6px 12px",
  background: "#fff",
  borderRadius: "8px",
  border: "1px solid #ddd",
  cursor: "pointer"
};

const topBtnBlack = {
  padding: "6px 12px",
  background: "#000",
  color: "#fff",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer"
};