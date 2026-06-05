"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if there's an error from the OAuth callback
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "not_authorized") setError("ليس لديك صلاحية الوصول للوحة التحكم");
    else if (err) setError("حدث خطأ أثناء تسجيل الدخول");
  }, []);

  async function handleGoogle() {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  }

  async function handleLogin() {
    setError("");
    if (!email || !password) { setError("أدخل البريد وكلمة المرور"); return; }
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError("بيانات الدخول غير صحيحة");
    }
    // onAuthStateChange handles the rest (check + redirect)
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0b0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      direction: "rtl",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow effects */}
      <div style={{ position: "fixed", top: "-100px", left: "-100px", width: "400px", height: "400px", background: "rgba(124,58,237,0.15)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-100px", right: "-100px", width: "400px", height: "400px", background: "rgba(59,130,246,0.15)", borderRadius: "50%", filter: "blur(120px)", pointerEvents: "none" }} />

      <div style={{
        background: "#0f1320",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "24px",
        padding: "40px",
        width: "360px",
        boxShadow: "0 0 60px rgba(168,85,247,0.1)",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{
            fontSize: "32px", fontWeight: "900", letterSpacing: "4px",
            background: "linear-gradient(90deg,#a855f7,#3b82f6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            margin: 0,
          }}>TREND</h1>
          <p style={{ color: "#4b5563", fontSize: "13px", margin: "6px 0 0" }}>لوحة التحكم</p>
        </div>

        <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 22px", fontWeight: "600" }}>
          ⚡ تسجيل الدخول
        </p>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        <input
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          style={inputStyle}
        />

        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="كلمة المرور"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ ...inputStyle, paddingLeft: "42px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "16px" }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "13px",
            background: loading ? "#4b2a9a" : "linear-gradient(135deg,#7c3aed,#3b82f6)",
            color: "#fff", border: "none", borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "800", fontSize: "15px", marginTop: "4px",
            boxShadow: loading ? "none" : "0 0 20px rgba(124,58,237,0.4)",
            transition: "0.2s",
          }}
        >
          {loading ? "⏳ جاري التحقق..." : "دخول →"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#1f1f2e" }} />
          <span style={{ color: "#4b5563", fontSize: "12px" }}>أو</span>
          <div style={{ flex: 1, height: "1px", background: "#1f1f2e" }} />
        </div>

        <button
          onClick={handleGoogle}
          style={{
            width: "100%", padding: "12px",
            background: "#fff", color: "#333",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "12px", cursor: "pointer",
            fontSize: "14px", fontWeight: "600",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} />
          تسجيل الدخول بـ Google
        </button>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(124,58,237,0.2)",
  background: "rgba(0,0,0,0.4)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
