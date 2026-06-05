"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);

  const log = (msg) => {
    console.log("[callback]", msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    log(`URL params: code=${params.get("code")?.slice(0,20)}... error=${params.get("error")}`);
    log(`Hash: ${hash ? hash.slice(0,50) : "none"}`);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log(`onAuthStateChange: event=${event}, session=${session ? "YES uid="+session.user.id.slice(0,8) : "NULL"}`);

      if (!session) return;

      log("Calling /api/admin/check...");
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.access_token }),
      });

      log(`admin/check status: ${res.status}`);
      if (res.ok) {
        log("Redirecting to /admin...");
        router.replace("/admin");
      } else {
        const body = await res.json();
        log(`Denied: ${JSON.stringify(body)}`);
        await supabase.auth.signOut();
        router.replace("/admin/login?error=not_authorized");
      }
    });

    // Also try getSession in case onAuthStateChange already fired
    setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      log(`getSession (after 2s): session=${data.session ? "YES" : "NULL"}`);
    }, 2000);

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh", background: "#0b0f1a",
      padding: "40px 24px", direction: "ltr",
    }}>
      <h2 style={{ color: "#a855f7", marginBottom: 16 }}>Auth Callback Debug</h2>
      {logs.map((l, i) => (
        <p key={i} style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0", fontFamily: "monospace" }}>{l}</p>
      ))}
      {logs.length === 0 && <p style={{ color: "#555" }}>Waiting...</p>}
    </main>
  );
}
