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
  // شاشات التطبيق الأربع ترسم ترويستها داخل التدرّج (الإجمالي أو الرصيد يعيش
  // فيها)، وشريط التنقّل السفلي يغني عن روابط الأعلى — فترويسة ثانية تكرار.
  if (["/", "/my-orders", "/account", "/wallet"].includes(pathname)) return null;

  return (
    <header style={{
      background: "var(--t-card)",
      borderBottom: "1px solid var(--t-line)",
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
        <div style={{ width: "1px", height: "20px", background: "var(--t-line)" }} />
        <span style={{ fontSize: "13px", color: "var(--t-muted)", fontWeight: "500" }}>
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
              background: "var(--t-chip)",
              color: "var(--t-ink)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid var(--t-line)",
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
              background: "var(--t-card)",
              color: "var(--t-red-ink)",
              border: "1px solid var(--t-red-line)",
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
              background: "var(--t-chip)",
              color: "var(--t-ink)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              border: "1px solid var(--t-line)",
            }}>
              📦 طلباتي
            </a>
            <a href="/login" style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "var(--t-solid)",
              color: "var(--t-on-solid)",
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
