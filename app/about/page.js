"use client";

import { useLang } from "@/lib/i18n";
import { Screen, Card, SectionTitle, Icon, I, PRIMARY, MUTED, FAINT, CHIP, GRAD_HEAD } from "@/app/components/ui";

/**
 * من نحن — تشرح الخدمة لمن يزور أول مرة.
 *
 * كانت ثلاثة أسطر على أرضية بيضاء. والزبون الذي يوشك أن يعطينا رابط سلته
 * ويدفع بالدينار يسأل قبل ذلك: كيف يعمل هذا؟ من أين السعر؟ ومتى يصلني؟
 * فهذه الصفحة تجيب الأسئلة بالترتيب.
 */
export default function About() {
  const { t } = useLang();

  const steps = [
    { icon: I.link,   title: t("تُرسل رابط سلتك"), note: t("من تطبيق شي إن: افتح سلتك ← زر المشاركة ← انسخ الرابط والصقه عندنا.") },
    { icon: I.search, title: t("نقرأ السعر الحقيقي"), note: t("نفتح سلتك داخل تطبيق شي إن على حساباتنا ونقرأ سعر الدفع كما ندفعه تمامًا — لا تقدير ولا تخمين.") },
    { icon: I.cart,   title: t("تحدّد الكميات"), note: t("رابط المشاركة يرسل كل صنف بكمية واحدة، فتضبط الكميات ونعيد القراءة ليظهر السعر النهائي.") },
    { icon: I.wallet, title: t("تدفع بالدينار الليبي"), note: t("من محفظتك أو ببطاقتك المحلية — بلا دولار ولا تحويل خارجي.") },
    { icon: I.truck,  title: t("نشتري ونشحن إليك"), note: t("نطلب سلتك من حسابنا ونتابع شحنها حتى تصل إليك في ليبيا.") },
  ];

  const facts = [
    { icon: I.shield, title: t("السعر الذي تراه هو سعر شي إن"), note: t("مقروء من صفحة الدفع داخل التطبيق، لا من المتصفح الذي تختلف أسعاره.") },
    { icon: I.box,    title: t("رسوم الشحن إلى ليبيا لاحقًا"), note: t("تُحسب بعد وصول الطلب إلى مستودعنا حسب الوزن، ونخبرك بها قبل التسليم.") },
    { icon: I.clock,  title: t("قراءة السلة تأخذ دقائق"), note: t("لأنها قراءة حقيقية من التطبيق؛ يمكنك إغلاق الصفحة والعودة، فالعمل يكمل على خادمنا.") },
  ];

  return (
    <Screen
      title={t("من نحن")}
      subtitle={t("وسيط شراء من شي إن إلى ليبيا — بسعر مقروء من التطبيق نفسه.")}
      active="order"
    >
      <Card pad={18}>
        <SectionTitle icon={I.chart}>{t("كيف تعمل الخدمة")}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ width: 34, height: 34, borderRadius: 12, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                <Icon path={s.icon} size={17} color={PRIMARY} />
                <span style={{ position: "absolute", top: -5, insetInlineEnd: -5, width: 17, height: 17, borderRadius: "50%", background: GRAD_HEAD, color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i + 1}
                </span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.85, marginTop: 3 }}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card pad={18}>
        <SectionTitle icon={I.alert}>{t("ما ينبغي أن تعرفه")}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {facts.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <Icon path={f.icon} size={18} color={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{f.title}</div>
                <div style={{ fontSize: 12.5, color: FAINT, lineHeight: 1.85, marginTop: 2 }}>{f.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card pad={18} style={{ background: GRAD_HEAD, color: "#fff", boxShadow: "0 6px 18px rgba(124,58,237,0.28)" }}>
        <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>{t("جاهز لطلبك الأول؟")}</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.8, marginBottom: 14 }}>
          {t("الصق رابط سلتك ودعنا نقرأ سعرها الآن.")}
        </div>
        <a href="/" style={{ display: "block", textAlign: "center", padding: 14, borderRadius: 13, background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
          {t("ابدأ طلبًا")}
        </a>
      </Card>

      <div style={{ textAlign: "center" }}>
        <a href="/contact" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>
          {t("لديك سؤال؟ تواصل معنا")}
        </a>
      </div>
    </Screen>
  );
}
