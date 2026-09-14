"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { Screen, Card, Field, Button, Icon, I, inputStyle, PRIMARY, MUTED } from "@/app/components/ui";

/** دخول الزبون المبسّط — يبقى للتوافق مع روابط قديمة، بالتصميم نفسه. */
export default function UserLogin() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(t("بيانات الدخول غير صحيحة")); return; }
    router.push("/my-orders");
  };

  return (
    <Screen title={t("تسجيل الدخول")} subtitle={t("ادخل إلى حسابك لمتابعة طلباتك ومحفظتك.")} nav={false} width={420}>
      <Card pad={18}>
        {error && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
            <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}
        <Field label={t("البريد الإلكتروني")}>
          <input type="email" placeholder="name@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} />
        </Field>
        <Field label={t("كلمة المرور")}>
          <input type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()} style={inputStyle} />
        </Field>
        <Button onClick={handleLogin} disabled={loading} icon={I.lock} style={{ opacity: loading ? 0.65 : 1 }}>
          {loading ? t("لحظة...") : t("دخول")}
        </Button>
      </Card>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 13.5, color: MUTED }}>{t("ليس لديك حساب؟")} </span>
        <a href="/signup" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 800, textDecoration: "none" }}>{t("إنشاء حساب")}</a>
      </div>
    </Screen>
  );
}
