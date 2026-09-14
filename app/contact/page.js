"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Screen, Card, SectionTitle, Icon, I, PRIMARY, MUTED, FAINT, CHIP, CARD, LINE, GRAD_HEAD } from "@/app/components/ui";

const WHATSAPP = "218945798033";
const EMAIL    = "support@trendstore-ly.com";

/**
 * تواصل معنا.
 *
 * كانت سطرين نصًّا لا يمكن حتى نسخهما بسهولة. القناة الحقيقية هنا واتساب،
 * فهي أول ما في الصفحة وبضغطة واحدة تفتح محادثة جاهزة؛ وتحتها الأسئلة التي
 * تتكرّر فعلاً، لأن أسرع دعم هو ألّا يحتاج الزبون إلى مراسلتنا أصلاً.
 */
export default function Contact() {
  const { t } = useLang();
  const [copied, setCopied] = useState("");

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1600);
  };

  const faqs = [
    { q: t("كم يستغرق قراءة سعر السلة؟"), a: t("دقيقة إلى أربع دقائق: نفتح سلتك داخل تطبيق شي إن ونقرأ صفحة الدفع. يمكنك إغلاق الصفحة والعودة، فالعمل يكمل على خادمنا.") },
    { q: t("لماذا يختلف السعر عمّا أراه في المتصفح؟"), a: t("أسعار تطبيق شي إن تختلف عن المتصفح، ونحن نشتري من التطبيق — فنقرأ منه لتدفع ما ندفعه بالضبط.") },
    { q: t("متى تُحسب رسوم الشحن إلى ليبيا؟"), a: t("بعد وصول طلبك إلى مستودعنا، حسب الوزن، ونخبرك بها قبل التسليم.") },
    { q: t("كيف أشحن محفظتي؟"), a: t("راسلنا على واتساب بالمبلغ، ويُضاف إلى رصيدك فورًا ليصير الدفع بضغطة واحدة بلا رمز تحقق.") },
    { q: t("هل يمكنني تعديل الكميات بعد إرسال الرابط؟"), a: t("نعم، من شاشة السلة — ثم اطلب إعادة الحساب ليقرأ الموقع السعر النهائي من شي إن.") },
  ];

  const [open, setOpen] = useState(0);

  return (
    <Screen
      title={t("تواصل معنا")}
      subtitle={t("نردّ يوميًا من العاشرة صباحًا حتى العاشرة مساءً.")}
      active="order"
    >
      {/* واتساب أولاً: هي القناة التي يستعملها الناس فعلاً. */}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank" rel="noreferrer"
        style={{ textDecoration: "none" }}
      >
        <Card pad={16} className="card-tap" style={{ background: "linear-gradient(140deg,#0f766e,#14b8a6)", color: "#fff", boxShadow: "0 6px 18px rgba(15,118,110,0.22)", display: "flex", alignItems: "center", gap: 13 }}>
          <span style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon path={I.chat} size={20} color="#fff" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>{t("واتساب")}</div>
            <div style={{ fontSize: 13, opacity: 0.9, direction: "ltr", textAlign: "start" }}>+{WHATSAPP}</div>
          </div>
          <Icon path={I.back} size={18} color="#fff" style={{ transform: "scaleX(-1)", opacity: 0.85 }} />
        </Card>
      </a>

      <Card pad={16}>
        <SectionTitle icon={I.mail}>{t("قنوات أخرى")}</SectionTitle>

        {[
          { icon: I.mail,  label: t("البريد الإلكتروني"), value: EMAIL, key: "mail", href: `mailto:${EMAIL}` },
          { icon: I.phone, label: t("الهاتف"), value: `+${WHATSAPP}`, key: "phone", href: `tel:+${WHATSAPP}` },
        ].map((c) => (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: `1px solid ${LINE}` }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon path={c.icon} size={17} color={PRIMARY} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: FAINT }}>{c.label}</div>
              <a href={c.href} style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, textDecoration: "none", direction: "ltr", display: "block", textAlign: "start", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.value}
              </a>
            </div>
            <button
              onClick={() => copy(c.value, c.key)}
              style={{ background: CHIP, border: "none", borderRadius: 11, padding: "8px 12px", cursor: "pointer", color: copied === c.key ? "var(--t-green-ink)" : MUTED, fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Icon path={copied === c.key ? I.check : I.copy} size={14} />
              {copied === c.key ? t("نُسخ") : t("نسخ")}
            </button>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0 0", borderTop: `1px solid ${LINE}` }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon path={I.clock} size={17} color={PRIMARY} />
          </span>
          <div>
            <div style={{ fontSize: 13, color: FAINT }}>{t("ساعات الردّ")}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t("يوميًا · 10 صباحًا — 10 مساءً")}</div>
          </div>
        </div>
      </Card>

      {/* الأسئلة المتكرّرة: أسرع دعم هو ما يغني عن السؤال. */}
      <Card pad={16}>
        <SectionTitle icon={I.alert}>{t("أسئلة متكرّرة")}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderTop: i ? `1px solid ${LINE}` : "none" }}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: "13px 0", cursor: "pointer", color: "inherit", fontFamily: "inherit", textAlign: "start" }}
              >
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{f.q}</span>
                <Icon path={I.back} size={16} color={PRIMARY}
                  style={{ transform: open === i ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .18s ease", flexShrink: 0 }} />
              </button>
              {open === i && (
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.9, margin: "0 0 13px" }}>{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ textAlign: "center" }}>
        <a href="/about" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>
          {t("كيف تعمل الخدمة؟")}
        </a>
      </div>
    </Screen>
  );
}
