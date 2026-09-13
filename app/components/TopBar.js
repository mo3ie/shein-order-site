"use client";

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
