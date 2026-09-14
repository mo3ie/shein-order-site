"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { Screen, Card, Field, Button, Icon, I, inputStyle, PRIMARY, INK, MUTED, FAINT, LINE, CARD } from "@/app/components/ui";

function LoginForm() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "reset" | "otp"
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace(next);
    });
  }, [next]);

  // Shared post-login routing: admins/employees → /admin, customers → next.
  const routeAfterLogin = async (userId) => {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "admin" || profile?.role === "employee") {
      window.location.href = "/admin";
    } else {
      window.location.href = next;
    }
  };

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
    await routeAfterLogin(data.user.id);
  };

  // OTP login: email a one-time code, then verify it (no password needed).
  const handleSendOtp = async () => {
    if (!email) { alert("أدخل البريد أولاً"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setOtpSent(true);
    alert("أرسلنا رمزاً إلى بريدك");
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) { alert("أدخل الرمز"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode.trim(), type: "email" });
    if (error || !data.user) { setLoading(false); alert("الرمز غير صحيح أو منتهي الصلاحية"); return; }
    await routeAfterLogin(data.user.id);
  };

  const loginWithGoogle = async () => {
    // Store next URL so callback can redirect there after OAuth
    if (next && next !== "/account") {
      sessionStorage.setItem("loginRedirectTo", next);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?for=customer`,
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

  const title = mode === "reset" ? t("استعادة كلمة المرور")
    : mode === "otp" ? t("الدخول برمز") : t("تسجيل الدخول");
  const sub = mode === "reset" ? t("نرسل رابط إعادة التعيين إلى بريدك.")
    : mode === "otp" ? t("رمز لمرّة واحدة إلى بريدك — بلا كلمة مرور.")
    : t("ادخل إلى حسابك لمتابعة طلباتك ومحفظتك.");

  return (
    <Screen title={title} subtitle={sub} nav={false} width={440}>
      <Card pad={18}>
        {/* جوجل أولاً: أسرع طريق ولا كلمة مرور تُنسى. */}
        <button onClick={loginWithGoogle} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: 14, borderRadius: 13, border: `1.5px solid ${LINE}`, background: CARD,
          cursor: "pointer", fontSize: 15, fontWeight: 700, color: INK, fontFamily: "inherit",
        }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={19} />
          {t("الدخول عبر Google")}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: LINE }} />
          <span style={{ fontSize: 12.5, color: FAINT }}>{t("أو")}</span>
          <div style={{ flex: 1, height: 1, background: LINE }} />
        </div>

        <Field label={t("البريد الإلكتروني")}>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mode === "otp" && otpSent}
            style={{ ...inputStyle, direction: "ltr", textAlign: "left" }}
          />
        </Field>

        {mode === "login" && (
          <Field label={t("كلمة المرور")}>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={inputStyle}
            />
          </Field>
        )}

        {mode === "otp" && otpSent && (
          <Field label={t("الرمز المرسل")} hint={t("صالح لدقائق — تفقّد بريدك ومجلد الرسائل غير المرغوبة.")}>
            <input
              inputMode="numeric"
              placeholder="······"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              style={{ ...inputStyle, textAlign: "center", fontSize: 24, fontWeight: 800, letterSpacing: 8, direction: "ltr" }}
            />
          </Field>
        )}

        <Button
          onClick={mode === "reset" ? resetPassword : mode === "otp" ? (otpSent ? handleVerifyOtp : handleSendOtp) : handleLogin}
          disabled={loading}
          icon={mode === "login" ? I.lock : I.mail}
          style={{ opacity: loading ? 0.65 : 1, marginTop: 4 }}
        >
          {loading ? t("لحظة...")
            : mode === "reset" ? t("أرسل رابط الاستعادة")
            : mode === "otp" ? (otpSent ? t("تأكيد الرمز") : t("أرسل الرمز"))
            : t("دخول")}
        </Button>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {mode !== "login" ? (
            <button onClick={() => { setMode("login"); setOtpSent(false); }} style={linkBtn}>{t("العودة لتسجيل الدخول")}</button>
          ) : (<>
            <button onClick={() => setMode("otp")} style={linkBtn}>{t("الدخول برمز بدل كلمة المرور")}</button>
            <button onClick={() => setMode("reset")} style={linkBtn}>{t("نسيت كلمة المرور؟")}</button>
          </>)}
        </div>
      </Card>

      <Card pad={16} style={{ textAlign: "center" }}>
        <span style={{ fontSize: 13.5, color: MUTED }}>{t("ليس لديك حساب؟")} </span>
        <a href="/signup" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 800, textDecoration: "none" }}>{t("إنشاء حساب")}</a>
      </Card>

      {/* ما يطمئن قبل إدخال بيانات: أين تذهب وماذا تفيد. */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "0 4px" }}>
        <Icon path={I.shield} size={17} color={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12.5, color: FAINT, lineHeight: 1.85, margin: 0 }}>
          {t("حسابك يحفظ طلباتك وعناوينك ورصيد محفظتك. لا نشارك بياناتك مع أحد.")}
        </p>
      </div>
    </Screen>
  );
}

const linkBtn = {
  background: "none", border: "none", color: PRIMARY, cursor: "pointer",
  fontSize: 13, fontWeight: 700, padding: 0, fontFamily: "inherit",
};


export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>⏳</div>}>
      <LoginForm />
    </Suspense>
  );
}
