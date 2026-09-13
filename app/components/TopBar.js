"use client";
import { useTheme } from "@/lib/theme";

/**
 * شريط الكمبيوتر العلوي.
 *
 * على الشاشة العريضة يختفي شريط التنقّل السفلي (هو إيماءة هاتف)، فلولا هذا
 * الشريط لبقيت الشاشة بلا ملاحة أصلاً. الشكل واحد في كل الشاشات: الاسم،
 * روابط نصّية، مبدّل اللغة، وصورة الحساب.
 */
const PRIMARY = "#7c3aed";
const INK     = "var(--t-ink)";
const MUTED   = "var(--t-muted)";
const LINE    = "var(--t-line)";
const SOLID   = "var(--t-solid)";
const ON_SOLID = "var(--t-on-solid)";

export default function TopBar({ active, lang, setLang, t, user }) {
  const { resolved, toggle } = useTheme();
  const links = [
    { key: "order",  href: "/",          label: t("طلب جديد") },
    { key: "orders", href: "/my-orders", label: t("طلباتي") },
    { key: "wallet", href: "/wallet",    label: t("المحفظة") },
    { key: "help",   href: "/contact",   label: t("مساعدة") },
  ];

  return (
    <div className="desk-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <a href="/" style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.4px", color: INK, textDecoration: "none" }}>
          Trend <span style={{ color: PRIMARY }}>SHEIN</span>
        </a>
        <div style={{ display: "flex", gap: 22, fontSize: 13 }}>
          {links.map((l) => (
            <a
              key={l.key}
              href={l.href}
              style={{ color: l.key === active ? INK : MUTED, fontWeight: l.key === active ? 700 : 500, textDecoration: "none" }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          onClick={toggle}
          aria-label={t("الوضع الداكن")}
          style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${LINE}`, background: "none", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
        >
          {resolved === "dark"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z" /></svg>}
        </button>
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          style={{ fontSize: 12, fontWeight: 700, color: MUTED, border: `1px solid ${LINE}`, background: "none", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
        <a
          href={user ? "/account" : "/login"}
          style={{ width: 32, height: 32, borderRadius: "50%", background: SOLID, color: ON_SOLID, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
        >
          {user ? (user.user_metadata?.name?.[0] || user.email?.[0] || "م").toUpperCase() : "؟"}
        </a>
      </div>
    </div>
  );
}
