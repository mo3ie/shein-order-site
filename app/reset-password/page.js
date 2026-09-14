"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { Screen, Card, Field, Button, Icon, I, inputStyle, FAINT, PRIMARY } from "@/app/components/ui";

export default function ResetPassword() {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [state, setState]       = useState("idle"); // idle | saving | done
  const [error, setError]       = useState("");

  const handleUpdate = async () => {
    setError("");
    if (password.length < 6) { setError(t("كلمة المرور يجب أن تكون 6 أحرف على الأقل")); return; }
    if (password !== confirm) { setError(t("الكلمتان غير متطابقتين")); return; }

    setState("saving");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setState("idle"); setError(err.message); return; }
    setState("done");
    // يعود إلى حسابه بنفسه: تغيير كلمة المرور لا ينتهي بصفحة ساكنة.
    setTimeout(() => { window.location.href = "/account"; }, 1600);
  };

  return (
    <Screen title={t("تغيير كلمة المرور")} subtitle={t("اختر كلمة مرور جديدة لحسابك.")} nav={false} width={440}>
      <Card pad={18}>
        {error && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
            <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {state === "done" ? (
          <div style={{ textAlign: "center", padding: "18px 0" }}>
            <span style={{ width: 52, height: 52, borderRadius: 18, background: "var(--t-green-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon path={I.check} size={24} color="var(--t-green-ink)" stroke={2.4} />
            </span>
            <p style={{ fontWeight: 800, fontSize: 16 }}>{t("تم تغيير كلمة المرور")}</p>
            <p style={{ fontSize: 13, color: FAINT, marginTop: 6 }}>{t("ننقلك إلى حسابك الآن...")}</p>
          </div>
        ) : (<>
          <Field label={t("كلمة المرور الجديدة")} hint={t("ستة أحرف على الأقل.")}>
            <input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t("تأكيد كلمة المرور")}>
            <input type="password" placeholder="••••••••" value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdate()} style={inputStyle} />
          </Field>
          <Button onClick={handleUpdate} disabled={state === "saving"} icon={I.lock}
            style={{ opacity: state === "saving" ? 0.65 : 1, marginTop: 4 }}>
            {state === "saving" ? t("لحظة...") : t("تحديث كلمة المرور")}
          </Button>
        </>)}
      </Card>

      <div style={{ textAlign: "center" }}>
        <a href="/login" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>
          {t("العودة لتسجيل الدخول")}
        </a>
      </div>
    </Screen>
  );
}
