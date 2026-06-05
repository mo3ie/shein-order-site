"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("أدخل البريد وكلمة المرور");
      return;
    }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError("بيانات الدخول غير صحيحة");
      return;
    }

    const token = data.session.access_token;
    const res = await fetch("/api/admin/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      await supabase.auth.signOut();
      setError("ليس لديك صلاحية الوصول للوحة التحكم");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>لوحة التحكم</h2>
        <p style={styles.subtitle}>تسجيل دخول الأدمن</p>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        <input
          style={styles.input}
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <input
          style={styles.input}
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
      </div>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
  },
  card: {
    background: "#111827",
    padding: "40px",
    borderRadius: "16px",
    width: "320px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    textAlign: "center",
  },
  title: { color: "#fff", marginBottom: "5px" },
  subtitle: { color: "#9ca3af", marginBottom: "20px", fontSize: "14px" },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#1f2937",
    color: "#fff",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "12px",
    fontSize: "13px",
  },
};
