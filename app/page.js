"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {

  const router = useRouter();

  return (
    <main style={main}>

      {/* Header */}
      <header style={header}>
        <h2>TrendStore</h2>

        <div>
          <button onClick={()=>router.push("/about")} style={navBtn}>من نحن</button>
          <button onClick={()=>router.push("/contact")} style={navBtn}>تواصل</button>
        </div>
      </header>

      {/* Hero */}
      <section style={hero}>
        <h1 style={{fontSize:"32px"}}>
          اطلب من SHEIN بسهولة 🚀
        </h1>

        <p style={{marginTop:10}}>
          نحن وسيط شراء آمن، نطلب لك المنتجات ونوصّلها لحد بابك
        </p>

        <button 
          onClick={()=>router.push("/order")}
          style={mainBtn}
        >
          ابدأ الطلب الآن
        </button>
      </section>

      {/* خدمات */}
      <section style={section}>
        <h2>خدماتنا</h2>

        <div style={grid}>
          <div style={card}>
            📦 شراء من المواقع العالمية
          </div>

          <div style={card}>
            🚚 توصيل داخل ليبيا
          </div>

          <div style={card}>
            💰 أفضل سعر وتحويل عملة
          </div>
        </div>
      </section>

      {/* كيف يعمل */}
      <section style={section}>
        <h2>كيف يعمل؟</h2>

        <div style={grid}>
          <div style={card}>1. أرسل صورة السلة</div>
          <div style={card}>2. نحسب السعر</div>
          <div style={card}>3. نؤكد الطلب</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={footer}>
        <p>© 2026 TrendStore - جميع الحقوق محفوظة</p>
      </footer>

    </main>
  );
}

// 🎨 styles
const main = { fontFamily:"sans-serif" };

const header = {
  display:"flex",
  justifyContent:"space-between",
  padding:"20px",
  borderBottom:"1px solid #eee"
};

const navBtn = {
  marginLeft:10,
  background:"none",
  border:"none",
  cursor:"pointer"
};

const hero = {
  textAlign:"center",
  padding:"60px 20px"
};

const mainBtn = {
  marginTop:20,
  padding:"12px 20px",
  background:"#000",
  color:"#fff",
  border:"none",
  borderRadius:8,
  cursor:"pointer"
};

const section = {
  padding:"40px 20px",
  textAlign:"center"
};

const grid = {
  display:"flex",
  gap:20,
  justifyContent:"center",
  flexWrap:"wrap",
  marginTop:20
};

const card = {
  padding:20,
  border:"1px solid #eee",
  borderRadius:10,
  minWidth:150
};

const footer = {
  textAlign:"center",
  padding:20,
  borderTop:"1px solid #eee",
  marginTop:40
};