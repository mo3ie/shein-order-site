"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const forCustomer = new URLSearchParams(window.location.search).get("for") === "customer";

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) return;

      if (forCustomer) {
        // Customer Google login — redirect to stored next URL or /account
        const redirectTo = sessionStorage.getItem("loginRedirectTo") || "/account";
        sessionStorage.removeItem("loginRedirectTo");
        router.replace(redirectTo);
        return;
      }

      // Admin login — check role
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

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh", background: "#0b0f1a",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: "3px solid #7c3aed", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite", margin: "0 auto 20px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#9ca3af", fontSize: "15px" }}>⏳ جاري تسجيل الدخول...</p>
      </div>
    </main>
  );
}
