"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const [logs, setLogs] = useState([]);
  const [done, setDone] = useState(false);

  const log = (msg) => setLogs(prev => [...prev, msg]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    log(`code present: ${!!params.get("code")}`);
    log(`error param: ${params.get("error") || "none"}`);
    log(`hash: ${hash ? hash.slice(0, 60) : "none"}`);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log(`EVENT: ${event} | session: ${session ? "YES" : "NULL"}`);
      if (!session) return;

      log(`user.id: ${session.user.id}`);
      log(`user.email: ${session.user.email}`);
      log(`token (first 40): ${session.access_token.slice(0, 40)}`);

      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.access_token }),
      });

      const body = await res.json();
      log(`admin/check status: ${res.status}`);
      log(`admin/check body: ${JSON.stringify(body)}`);
      setDone(true);
    });

    setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        log(`getSession after 3s: ${data.session ? "HAS SESSION" : "NO SESSION"}`);
        setDone(true);
      });
    }, 3000);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#0b0f1a", padding: "40px 24px" }}>
      <h2 style={{ color: "#a855f7", marginBottom: 20, fontFamily: "monospace" }}>Auth Debug</h2>
      {logs.map((l, i) => (
        <p key={i} style={{ color: "#e2e8f0", fontSize: 14, margin: "6px 0", fontFamily: "monospace", background: "#111", padding: "6px 12px", borderRadius: 6 }}>
          {l}
        </p>
      ))}
      {!done && <p style={{ color: "#555", marginTop: 16, fontFamily: "monospace" }}>جاري التحميل...</p>}
      {done && (
        <div style={{ marginTop: 24 }}>
          <a href="/admin/login" style={{ color: "#a855f7" }}>← رجوع لتسجيل الدخول</a>
        </div>
      )}
    </main>
  );
}
