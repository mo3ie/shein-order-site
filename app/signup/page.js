"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { Screen, Card, Field, Button, EmptyState, Icon, I, inputStyle, GRAD_HEAD, PRIMARY, INK, MUTED, FAINT, LINE, CARD } from "@/app/components/ui";

export default function SignupPage() {
  const { t } = useLang();
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
      <Screen title={t("تحقّق من بريدك")} subtitle={t("خطوة واحدة وينتهي التسجيل.")} nav={false} width={440}>
        <EmptyState
          icon={I.mail}
          title={t("أرسلنا رابط التأكيد")}
          note={`${t("افتح الرابط المرسل إلى")} ${email} ${t("لتفعيل حسابك.")}`}
          action={<a href="/login" style={{ display: "inline-block", padding: "14px 28px", borderRadius: 14, background: GRAD_HEAD, color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 6px 18px rgba(124,58,237,0.28)" }}>{t("العودة لتسجيل الدخول")}</a>}
        />
      </Screen>
    );
  }

  return (
    <Screen title={t("إنشاء حساب")} subtitle={t("حسابك يحفظ طلباتك وعناوينك ورصيد محفظتك.")} nav={false} width={440}>
      <Card pad={18}>
        <button onClick={loginWithGoogle} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: 14, borderRadius: 13, border: `1.5px solid ${LINE}`, background: CARD,
          cursor: "pointer", fontSize: 15, fontWeight: 700, color: INK, fontFamily: "inherit",
        }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width={19} />
          {t("المتابعة عبر Google")}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: LINE }} />
          <span style={{ fontSize: 12.5, color: FAINT }}>{t("أو")}</span>
          <div style={{ flex: 1, height: 1, background: LINE }} />
        </div>

        {error && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
            <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <Field label={t("الاسم الكامل")}>
          <input placeholder={t("أدخل اسمك الكامل")} value={fullName}
            onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
        </Field>

        <Field label={t("البريد الإلكتروني")}>
          <input type="email" placeholder="name@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} />
        </Field>

        <Field label={t("كلمة المرور")} hint={t("ستة أحرف على الأقل.")}>
          <input type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            style={inputStyle} />
        </Field>

        <Button onClick={handleSignup} disabled={loading} icon={I.user} style={{ opacity: loading ? 0.65 : 1, marginTop: 4 }}>
          {loading ? t("لحظة...") : t("إنشاء الحساب")}
        </Button>
      </Card>

      <Card pad={16} style={{ textAlign: "center" }}>
        <span style={{ fontSize: 13.5, color: MUTED }}>{t("لديك حساب بالفعل؟")} </span>
        <a href="/login" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 800, textDecoration: "none" }}>{t("تسجيل الدخول")}</a>
      </Card>
    </Screen>
  );
}
