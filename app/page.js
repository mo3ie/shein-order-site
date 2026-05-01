"use client";
import { useState } from "react";

export default function Home() {
  return (
    <div style={mainStyle}>
      
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2 style={{color:"#7c3aed"}}>TREND</h2>

        <SidebarItem text="الرئيسية" />
        <SidebarItem text="طلب من شي إن" />
        <SidebarItem text="متجر الإلكترونيات" />
        <SidebarItem text="الصيانة والدعم" />
        <SidebarItem text="الخدمات الرقمية" />
      </div>

      {/* CONTENT */}
      <div style={content}>

        {/* HERO */}
        <div style={hero}>
          <div>
            <h1 style={{fontSize:"32px"}}>
              متجر <span style={{color:"#7c3aed"}}>ترند</span> للإلكترونيات
            </h1>
            <p>كل ما تحتاجه من عالم التقنية في مكان واحد</p>

            <button style={mainBtn}>تسوق الآن</button>
          </div>

          <img 
            src="https://i.imgur.com/4QfKuz1.png"
            style={{width:"250px"}}
          />
        </div>

        {/* CATEGORIES */}
        <div style={grid}>
          <Card text="هواتف" />
          <Card text="لابتوبات" />
          <Card text="بلايستيشن" />
          <Card text="خدمات إلكترونية" />
          <Card text="طلب من المواقع" />
          <Card text="إعلانات" />
        </div>

        {/* SHEIN */}
        <div style={bigCard}>
          <div>
            <h2>اطلب من شي إن 🛍</h2>
            <p>أسعار أقل - توصيل سريع - ضمان</p>
            <button style={mainBtn}>ابدأ الطلب</button>
          </div>
        </div>

        {/* OFFER */}
        <div style={offer}>
          <h2>عرض اليوم ⚡</h2>
          <h1 style={{fontSize:"40px"}}>30%</h1>
          <p>خصومات على جميع المنتجات</p>
        </div>

        {/* SERVICES */}
        <div style={grid}>
          <Card text="صيانة الأجهزة" />
          <Card text="خدمات رقمية" />
          <Card text="إكسسوارات" />
          <Card text="بيع الأجهزة" />
        </div>

      </div>
    </div>
  );
}

function SidebarItem({text}) {
  return (
    <div style={sideItem}>{text}</div>
  );
}

function Card({text}) {
  return (
    <div style={card}>
      {text}
    </div>
  );
}

const mainStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#0b0b0f",
  color: "#fff",
  fontFamily: "sans-serif"
};

const sidebar = {
  width: "220px",
  background: "#0f172a",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const sideItem = {
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "0.2s",
  background: "rgba(255,255,255,0.05)"
};

const content = {
  flex: 1,
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const hero = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "25px",
  borderRadius: "20px",
  background: "linear-gradient(135deg,#7c3aed,#06b6d4)"
};

const mainBtn = {
  marginTop: "10px",
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  background: "#000",
  color: "#fff",
  cursor: "pointer"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "15px"
};

const card = {
  padding: "20px",
  borderRadius: "16px",
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.1)",
  textAlign: "center"
};

const bigCard = {
  padding: "30px",
  borderRadius: "20px",
  background: "linear-gradient(135deg,#1f2937,#111827)"
};

const offer = {
  padding: "30px",
  borderRadius: "20px",
  background: "linear-gradient(135deg,#9333ea,#06b6d4)",
  textAlign: "center"
};