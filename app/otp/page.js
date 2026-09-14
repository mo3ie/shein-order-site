"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { Screen, Card, Field, Button, Icon, I, inputStyle, FAINT } from "@/app/components/ui";

/** تأكيد رقم الهاتف برمز — شاشة قديمة بقيت في المسار، فأخذت التصميم نفسه. */
export default function OTP() {
  const { t } = useLang();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("otp") : null;
    if (code.trim() && code.trim() === saved) router.push("/confirm");
    else setError(t("الرمز غير صحيح"));
  };

  return (
    <Screen title={t("تأكيد رقم الهاتف")} subtitle={t("أدخل الرمز الذي وصلك في رسالة.")} nav={false} width={420}>
      <Card pad={18}>
        {error && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
            <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}
        <Field label={t("الرمز")}>
          <input
            inputMode="numeric"
            placeholder="······"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            style={{ ...inputStyle, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 10, direction: "ltr" }}
          />
        </Field>
        <Button onClick={handleVerify} icon={I.check}>{t("تأكيد")}</Button>
        <p style={{ fontSize: 12.5, color: FAINT, textAlign: "center", marginTop: 12, lineHeight: 1.8 }}>
          {t("لم يصلك الرمز؟ راسلنا على واتساب ونؤكّد رقمك يدويًا.")}
        </p>
      </Card>
    </Screen>
  );
}
