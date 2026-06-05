"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "reset"

  const handleLogin = async () => {
    if (!email || !password) {
      alert("أدخل البريد وكلمة المرور");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      alert("بيانات الدخول غير صحيحة");
      return;
    }

    // Check role and redirect accordingly
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);
    if (profile?.role === "admin" || profile?.role === "employee") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/account";
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/account`,
      },
    });
    if (error) alert(error.message);
  };

  const resetPassword = async () => {
    if (!email) {
      alert("أدخل البريد أولاً");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      alert("تم إرسال رابط إعادة تعيين كلمة المرور على بريدك");
      setMode("login");
    }
  };

  return (
    <main style={mainStyle}>
      <div style={card}>
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>
          {mode === "reset" ? "🔑 استعادة كلمة المرور" : "👤 تسجيل الدخول"}
        </h2>

        <input
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          type="email"
        />

        {mode === "login" && (
          <input
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={input}
            type="password"
          />
        )}

        {mode === "login" ? (
          <>
            <button onClick={handleLogin} style={btnPrimary} disabled={loading}>
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>

            <button onClick={loginWithGoogle} style={btnGoogle}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                   alt="Google" width={18} style={{ marginLeft: 8 }} />
              تسجيل عبر Google
            </button>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
              <button onClick={() => setMode("reset")} style={linkBtn}>
                نسيت كلمة المرور؟
              </button>
              <span style={{ color: "#aaa", margin: "0 8px" }}>|</span>
              <a href="/signup" style={{ color: "#7c3aed", textDecoration: "none" }}>
                إنشاء حساب جديد
              </a>
            </div>
          </>
        ) : (
          <>
            <button onClick={resetPassword} style={btnPrimary} disabled={loading}>
              {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
            </button>
            <button onClick={() => setMode("login")} style={linkBtn}>
              ← العودة لتسجيل الدخول
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "calc(100vh - 60px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "transparent",
  direction: "rtl",
};

const card = {
  background: "#fff",
  padding: "32px",
  color: "#2c2c2c",
  borderRadius: "16px",
  width: "320px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  border: "1px solid #eee",
};

const input = {
  width: "100%",
  padding: "11px 14px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #e0e0e0",
  outline: "none",
  fontSize: "14px",
  color: "#111",
  background: "#fff",
  boxSizing: "border-box",
};

const btnPrimary = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  background: "#111",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  marginBottom: "10px",
};

const btnGoogle = {
  width: "100%",
  padding: "11px",
  borderRadius: "10px",
  background: "#fff",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "4px",
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "#888",
  cursor: "pointer",
  fontSize: "13px",
  padding: 0,
};
