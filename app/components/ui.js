"use client";

/**
 * عدّة الواجهة المشتركة.
 *
 * كل شاشة كانت تكتب بطاقتها وزرّها وحقلها بيدها، فاختلفت الشاشات بقدر عدد
 * المرّات التي كُتبت فيها، وأي تحسين كان يصل واحدة ويترك البقية. هذه العدّة
 * تعرّف المفردات مرّة: الأرضية، البطاقة، الزرّ، الحقل، عنوان القسم، الحالة
 * الفارغة، والأيقونات. أي تعديل هنا يصل كل شاشة في الموقع.
 */
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export const PRIMARY   = "#7c3aed";
export const GRAD_HEAD = "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)";
export const PAGE      = "var(--t-page)";
export const CARD      = "var(--t-card)";
export const SOFT      = "var(--t-soft)";
export const INK       = "var(--t-ink)";
export const MUTED     = "var(--t-muted)";
export const FAINT     = "var(--t-faint)";
export const LINE      = "var(--t-line)";
export const CHIP      = "var(--t-chip)";
export const SOLID     = "var(--t-solid)";
export const ON_SOLID  = "var(--t-on-solid)";

export const SHADOW = "0 2px 10px rgba(22,19,31,0.05)";

/** أيقونات الخطّ الواحد — SVG لا إيموجي، فشكلها لا يتغيّر بين الأجهزة. */
export const I = {
  link:    <><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.8 1.7" /><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.8-1.7" /></>,
  cart:    <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></>,
  user:    <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /></>,
  users:   <><circle cx="9" cy="8" r="3.5" /><path d="M2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1" /><path d="M17 5.5a3.5 3.5 0 010 6.8" /><path d="M19 20v-1a5 5 0 00-3-4.6" /></>,
  note:    <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  search:  <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  pin:     <><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  wallet:  <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /><path d="M17 15h2" /></>,
  phone:   <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
  bank:    <><path d="M3 10l9-6 9 6" /><path d="M5 10v9" /><path d="M19 10v9" /><path d="M3 19h18" /></>,
  mail:    <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 7l10 6 10-6" /></>,
  lock:    <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
  check:   <path d="M20 6L9 17l-5-5" />,
  clock:   <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  truck:   <><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  box:     <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>,
  chart:   <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  trash:   <><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></>,
  back:    <path d="M9 6l6 6-6 6" />,
  plus:    <><path d="M12 5v14M5 12h14" /></>,
  refresh: <><path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 4v5h-5" /></>,
  download:<><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
  copy:    <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5h10" /></>,
  chat:    <><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.4A8 8 0 1121 12z" /></>,
  shield:  <><path d="M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  alert:   <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></>,
};

/** أيقونة بمقاس ولون محدّدين. */
export function Icon({ path, size = 18, color = "currentColor", stroke = 1.9, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {path}
    </svg>
  );
}

/** البطاقة البيضاء: شكل واحد في كل الموقع. */
export function Card({ children, style, className = "", pad = 16, ...rest }) {
  return (
    <div className={className} style={{ background: CARD, borderRadius: 18, padding: pad, boxShadow: SHADOW, ...style }} {...rest}>
      {children}
    </div>
  );
}

/** عنوان قسم: أيقونة في مربّع ملوّن ثم النصّ — تُلتقط قبل أن تُقرأ. */
export function SectionTitle({ icon, children, size = 15.5, extra }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: 10, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon path={icon} size={16} color={PRIMARY} />
      </span>
      <span style={{ fontSize: size, fontWeight: 800, flex: 1 }}>{children}</span>
      {extra}
    </div>
  );
}

/** زرّ: أساسي متدرّج، أو مُصمت، أو شبحي. */
export function Button({ kind = "primary", children, style, icon, ...rest }) {
  const base = {
    width: "100%", padding: "15px 16px", borderRadius: 14, border: "none",
    fontSize: 16, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
  };
  const kinds = {
    primary: { background: GRAD_HEAD, color: "#fff", boxShadow: "0 6px 18px rgba(124,58,237,0.28)" },
    solid:   { background: SOLID, color: ON_SOLID },
    ghost:   { background: "none", color: MUTED, border: `1.5px solid ${LINE}` },
    danger:  { background: "var(--t-red-bg)", color: "var(--t-red-ink)", border: "1.5px solid var(--t-red-line)" },
    quiet:   { background: CHIP, color: PRIMARY },
  };
  return (
    <button style={{ ...base, ...kinds[kind], ...style }} {...rest}>
      {icon ? <Icon path={icon} size={17} /> : null}
      {children}
    </button>
  );
}

/** حقل بعنوانه وخطأه، فلا يتكرّر الثلاثي في كل صفحة. */
export function Field({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 13.5, fontWeight: 800, marginBottom: 7 }}>{label}</label>}
      {children}
      {error
        ? <p style={{ color: "var(--t-red-ink)", fontSize: 12.5, fontWeight: 600, margin: "7px 0 0" }}>{error}</p>
        : hint ? <p style={{ color: FAINT, fontSize: 12.5, lineHeight: 1.85, margin: "7px 0 0" }}>{hint}</p> : null}
    </div>
  );
}

export const inputStyle = {
  width: "100%", padding: "13px 14px", borderRadius: 13,
  border: `1.5px solid ${LINE}`, fontSize: 15, color: INK, background: CARD,
  fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s",
};

/** حبّة معلومة. */
export function Chip({ children, tone = "plain", style }) {
  const tones = {
    plain:  { background: CHIP, color: MUTED },
    violet: { background: "var(--t-chip)", color: PRIMARY },
    green:  { background: "var(--t-green-bg)", color: "var(--t-green-ink)" },
    amber:  { background: "var(--t-amber-bg)", color: "var(--t-amber-ink)" },
    red:    { background: "var(--t-red-bg)", color: "var(--t-red-ink)" },
    blue:   { background: "var(--t-blue-bg)", color: "var(--t-blue-ink)" },
    dark:   { background: SOLID, color: ON_SOLID },
  };
  return (
    <span style={{ fontSize: 12, fontWeight: 800, borderRadius: 20, padding: "5px 11px", whiteSpace: "nowrap", ...tones[tone], ...style }}>
      {children}
    </span>
  );
}

/** حالة فارغة تشرح وتقترح فعلاً، بدل صفحة بيضاء. */
export function EmptyState({ icon, title, note, action }) {
  return (
    <Card style={{ textAlign: "center", padding: "48px 20px" }}>
      <span style={{ width: 54, height: 54, borderRadius: 18, background: CHIP, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon path={icon} size={24} color={PRIMARY} />
      </span>
      <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{title}</p>
      {note && <p style={{ fontSize: 13.5, color: FAINT, marginBottom: action ? 20 : 0, lineHeight: 1.8 }}>{note}</p>}
      {action}
    </Card>
  );
}

/**
 * ترويسة الزبون المتدرّجة: الهوية، ومكان لرقم كبير تحتها (إجمالي أو رصيد).
 * الأزرار الثلاثة (المظهر، اللغة، الحساب) تعيش هنا فتصل كل شاشة دفعة واحدة.
 */
export function GradientHeader({ title, subtitle, children, back, user, right }) {
  const { lang, setLang, t } = useLang();
  const { resolved, toggle } = useTheme();
  return (
    <div style={{ background: GRAD_HEAD, color: "#fff", padding: "18px 20px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {back && (
            <a href={back} aria-label={t("رجوع")} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Icon path={I.back} size={16} stroke={2.2} />
            </a>
          )}
          <a href="/" style={{ fontWeight: 900, fontSize: 19, color: "#fff", textDecoration: "none" }}>{t("ترند · شي إن")}</a>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {right}
          <button type="button" onClick={toggle} aria-label={t("الوضع الداكن")}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            {resolved === "dark"
              ? <Icon path={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>} size={15} stroke={2} />
              : <Icon path={<path d="M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z" />} size={15} stroke={2} />}
          </button>
          <button type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            style={{ fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <a href={user ? "/account" : "/login"}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
            {user ? (user.user_metadata?.name?.[0] || user.email?.[0] || "م").toUpperCase() : "؟"}
          </a>
        </div>
      </div>

      {(title || subtitle) && (
        <div style={{ marginTop: 20, position: "relative" }}>
          {title && <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.4 }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 14, opacity: 0.82, marginTop: 6, lineHeight: 1.8 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/** شريط التنقّل السفلي — نفسه في كل شاشات الزبون. */
export function BottomNav({ active, user }) {
  const { t } = useLang();
  const items = [
    { k: "order",  href: "/",          label: t("طلب جديد"), path: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /> },
    { k: "orders", href: "/my-orders", label: t("طلباتي"),   path: I.cart },
    { k: "wallet", href: "/wallet",    label: t("المحفظة"),  path: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /></> },
    { k: "account", href: user ? "/account" : "/login", label: user ? t("حسابي") : t("دخول"), path: I.user },
  ];
  return (
    <nav className="bottom-nav" style={{
      position: "fixed", insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, zIndex: 60,
      background: CARD, borderTop: `1px solid ${LINE}`,
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "8px 16px 10px" }}>
        {items.map((it) => (
          <a key={it.k} href={it.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", color: it.k === active ? PRIMARY : FAINT }}>
            <Icon path={it.path} size={20} stroke={it.k === active ? 2 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: it.k === active ? 800 : 600 }}>{it.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

/**
 * إطار شاشة زبون كاملة: أرضية، ترويسة متدرّجة، محتوى بعرض مضبوط، وشريط سفلي.
 * صفحات الدخول والتسجيل تستعمله بلا شريط سفلي (nav={false}).
 */
export function Screen({ title, subtitle, header, back, user, active, nav = true, children, width = 480 }) {
  const { dir } = useLang();
  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, direction: dir, paddingBottom: nav ? 96 : 32 }}>
      <div className="form-inner" style={{ maxWidth: width, margin: "0 auto" }}>
        <GradientHeader title={title} subtitle={subtitle} back={back} user={user}>{header}</GradientHeader>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>
          {children}
        </div>
      </div>
      {nav && <BottomNav active={active} user={user} />}
    </div>
  );
}
