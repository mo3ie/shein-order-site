"use client";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #ebebeb",
      padding: "0 24px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{
          fontSize: "22px",
          fontWeight: "900",
          letterSpacing: "3px",
          background: "linear-gradient(90deg, #9333ea, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          TREND
        </span>
        <div style={{
          width: "1px",
          height: "20px",
          background: "#e0e0e0"
        }} />
        <span style={{
          fontSize: "13px",
          color: "#666",
          fontWeight: "500"
        }}>
          خدمة طلب شي إن
        </span>
      </div>

      <nav style={{ display: "flex", gap: "8px" }}>
        <a href="/my-orders" style={{
          padding: "7px 14px",
          borderRadius: "8px",
          background: "#f5f5f5",
          color: "#333",
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: "500",
          border: "1px solid #ebebeb"
        }}>
          📦 طلباتي
        </a>
        <a href="/user-login" style={{
          padding: "7px 14px",
          borderRadius: "8px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: "500"
        }}>
          دخول
        </a>
      </nav>
    </header>
  );
}
