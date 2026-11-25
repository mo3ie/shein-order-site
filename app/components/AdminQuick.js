"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * زرّ «لوحة الإدارة» السريع.
 *
 * يظهر فقط لحساب دوره admin أو employee في profiles — الزبون لا يراه أبدًا،
 * والصلاحية الحقيقية يحكم بها الخادم (/api/admin/check) لا هذا الزر. الضغط
 * يمرّر جلسة الحساب الحالية إلى الفحص فيُضبط كوكي الإدارة ويُفتح /admin مباشرة
 * بلا شاشة دخول ثانية.
 */
export default function AdminQuick() {
  const pathname = usePathname() || "/";
  const [role, setRole] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async (user) => {
      if (!user) { if (alive) setRole(null); return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (alive) setRole(data?.role === "admin" || data?.role === "employee" ? data.role : null);
    };
    supabase.auth.getUser().then(({ data }) => check(data?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user ?? null));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  if (!role || pathname.startsWith("/admin")) return null;

  const go = async () => {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/admin/login"; return; }
      const r = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: session.access_token }),
      });
      window.location.href = r.ok ? "/admin" : "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      aria-label="لوحة الإدارة"
      style={{
        position: "fixed", insetInlineStart: 14, bottom: "calc(92px + env(safe-area-inset-bottom))", zIndex: 70,
        display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 999, border: "none",
        background: "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)", color: "#fff",
        fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer",
        boxShadow: "0 8px 22px rgba(91,75,245,0.38)", opacity: busy ? 0.7 : 1,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M9 12l2 2 4-4" /></svg>
      {busy ? "جاري الفتح…" : role === "admin" ? "لوحة الإدارة" : "لوحة الموظفين"}
    </button>
  );
}
