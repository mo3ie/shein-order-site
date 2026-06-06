"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
      <a href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
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
        <div style={{ width: "1px", height: "20px", background: "#e0e0e0" }} />
        <span style={{ fontSize: "13px", color: "#666", fontWeight: "500" }}>
          خدمة طلب شي إن
        </span>
      </a>

      <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {user ? (
          <>
            <a href="/account" style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 14px",
              borderRadius: "8px",
              background: "#f5f5f5",
              color: "#333",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid #ebebeb",
            }}>
              <img
                src={user.user_metadata?.avatar_url || "/avatar.png"}
                alt="avatar"
                style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; }}
              />
              {user.user_metadata?.name?.split(" ")[0] || user.email?.split("@")[0] || "حسابي"}
            </a>
            <button onClick={logout} style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "#fff",
              color: "#e53e3e",
              border: "1px solid #fecaca",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}>
              خروج
            </button>
          </>
        ) : (
          <>
            <a href="/my-orders" style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "#f5f5f5",
              color: "#333",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid #ebebeb",
            }}>
              📦 طلباتي
            </a>
            <a href="/login" style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
            }}>
              دخول
            </a>
          </>
        )}
      </nav>
    </header>
  );
}
