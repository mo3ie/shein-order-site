"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("⏳ جاري تسجيل الدخول...");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) return;

      // Call admin/check to verify role and set the admin_role cookie
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.access_token }),
      });

      if (res.ok) {
        router.replace("/admin");
      } else {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=not_authorized");
      }
    });

    // Timeout fallback in case onAuthStateChange never fires
    const timeout = setTimeout(() => {
      setStatus("⚠️ انتهت مهلة تسجيل الدخول");
      router.replace("/admin/login?error=timeout");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh", background: "#0b0f1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      direction: "rtl",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: "3px solid #7c3aed", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite", margin: "0 auto 20px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#9ca3af", fontSize: "15px" }}>{status}</p>
      </div>
    </main>
  );
}
