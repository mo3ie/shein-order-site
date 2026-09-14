"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card, Field, Button, Icon, I, inputStyle, GRAD_HEAD, PAGE, CARD, PRIMARY, INK, MUTED, FAINT, LINE } from "@/app/components/ui";

/**
 * دخول لوحة الإدارة.
 *
 * شاشة موظفين لا شاشة زبائن: لا تنقّل ولا محفظة، فقط الدخول — وبتصميم الموقع
 * نفسه بدل أرضية سوداء لا تتبع الثيم. وبعد الدخول يُقرأ الدور هنا صراحةً: من
 * ليس مديرًا ولا موظفًا يُخرَج فورًا برسالة، بدل أن يقف أمام لوحة فارغة.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "not_authorized") setError("ليس لديك صلاحية الوصول للوحة التحكم");
    else if (err) setError("حدث خطأ أثناء تسجيل الدخول");
  }, []);

  async function routeByRole(userId) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "admin" || profile?.role === "employee") {
      router.push("/admin");
    } else {
      await supabase.auth.signOut();
      setLoading(false);
      setError("هذا الحساب ليس له صلاحية دخول اللوحة");
    }
  }

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
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data?.user) {
      setLoading(false);
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    routeByRole(data.user.id);
  }

  return (
    <main style={{
      minHeight: "100vh", background: PAGE, color: INK, direction: "rtl",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{
            width: 62, height: 62, borderRadius: 20, background: GRAD_HEAD, color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 25, fontWeight: 900, boxShadow: "0 8px 24px rgba(124,58,237,0.3)", marginBottom: 14,
          }}>T</span>
          <h1 style={{ fontSize: 23, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
            إدارة <span style={{ color: PRIMARY }}>ترند</span>
          </h1>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "6px 0 0" }}>لوحة الطلبات والإعدادات</p>
        </div>

        <Card pad={20}>
          {error && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
              <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <Field label="البريد الإلكتروني">
            <input type="email" value={email} placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} />
          </Field>

          <Field label="كلمة المرور">
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password} placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{ ...inputStyle, paddingInlineEnd: 46 }}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                aria-label="إظهار كلمة المرور"
                style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: FAINT, display: "flex", padding: 4 }}>
                <Icon path={showPassword
                  ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 004.2 4.2" /><path d="M9.9 4.6A9.5 9.5 0 0112 4.5c5 0 9 4.5 9 7.5a12 12 0 01-2.3 3.3M6.2 6.7A12.4 12.4 0 003 12c0 3 4 7.5 9 7.5 1.2 0 2.3-.2 3.3-.6" /></>
                  : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>} size={17} />
              </button>
            </div>
          </Field>

          <Button onClick={handleLogin} disabled={loading} icon={I.lock} style={{ opacity: loading ? 0.65 : 1, marginTop: 4 }}>
            {loading ? "جاري الدخول..." : "دخول اللوحة"}
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: LINE }} />
            <span style={{ fontSize: 12.5, color: FAINT }}>أو</span>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          <button onClick={handleGoogle} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: 14, borderRadius: 13, border: `1.5px solid ${LINE}`, background: CARD,
            cursor: "pointer", fontSize: 15, fontWeight: 700, color: INK, fontFamily: "inherit",
          }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={19} />
            الدخول عبر Google
          </button>
        </Card>

        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "16px 6px 0" }}>
          <Icon path={I.shield} size={16} color={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12.5, color: FAINT, lineHeight: 1.85, margin: 0 }}>
            هذه الصفحة للموظفين. إن كنت زبونًا فالدخول من{" "}
            <a href="/login" style={{ color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>صفحة الحساب</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
