"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace("/account");
    });
  }, []);

  const handleSignup = async () => {
    setError("");
    if (!fullName.trim()) { setError("أدخل الاسم الكامل"); return; }
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    if (password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }

    setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: fullName } },
    });
    setLoading(false);

    if (signupError) {
      if (signupError.message.includes("already registered")) {
        setError("هذا البريد مسجّل مسبقاً، سجّل دخولك");
      } else {
        setError(signupError.message);
      }
      return;
    }

    // Auto-confirmed → redirect directly
    if (data.session) {
      window.location.replace("/account");
    } else {
      // Email confirmation required
      setDone(true);
    }
  };

  const loginWithGoogle = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?for=customer` },
    });
    if (oauthError) setError(oauthError.message);
  };

  if (done) {
    return (
      <main style={mainStyle}>
        <div style={card}>
          <div style={{ textAlign: "center", fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ textAlign: "center", marginBottom: 8, color: "#111" }}>تحقق من بريدك</h2>
          <p style={{ textAlign: "center", color: "#666", fontSize: 14, lineHeight: 1.6 }}>
            أرسلنا لك رابط تأكيد على <strong>{email}</strong>
            <br />افتح الرابط لتفعيل حسابك
          </p>
          <a href="/login" style={{ ...btnPrimary, display: "block", textAlign: "center", marginTop: 20, textDecoration: "none" }}>
            العودة لتسجيل الدخول
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      <div style={card}>
        <h2 style={{ textAlign: "center", marginBottom: 20, color: "#111", fontWeight: 800 }}>
          إنشاء حساب جديد
        </h2>

        <button onClick={loginWithGoogle} style={btnGoogle}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google" width={18} style={{ marginLeft: 8 }}
          />
          التسجيل عبر Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#eee" }} />
          <span style={{ color: "#bbb", fontSize: 12 }}>أو</span>
          <div style={{ flex: 1, height: 1, background: "#eee" }} />
        </div>

        <input
          placeholder="الاسم الكامل"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={input}
          type="text"
        />
        <input
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={input}
          type="email"
        />
        <input
          placeholder="كلمة المرور (6 أحرف على الأقل)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSignup()}
          style={input}
          type="password"
        />

        {error && (
          <p style={{ color: "#e53e3e", fontSize: 13, marginBottom: 10, textAlign: "center" }}>
            ⚠️ {error}
          </p>
        )}

        <button onClick={handleSignup} style={btnPrimary} disabled={loading}>
          {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#888", marginTop: 14 }}>
          لديك حساب؟{" "}
          <a href="/login" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
            سجّل دخولك
          </a>
        </p>
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
  width: "340px",
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
};
