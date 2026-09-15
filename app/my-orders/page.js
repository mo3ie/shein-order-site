"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { statusLabel, statusColor, fmtDate, payLabel, isPaid, minutesLeftToPay } from "@/lib/orderStatus";
import { useLang, useIsDesktop } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import TopBar from "@/app/components/TopBar";

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

// مفردات التصميم نفسها الموجودة في صفحة الطلب، حتى تُقرأ الصفحتان كتصميم واحد.
const GRAD_HEAD = "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)";
const PAGE      = "var(--t-page)";
const CARD      = "var(--t-card)";
const INK       = "var(--t-ink)";
const MUTED     = "var(--t-muted)";
const FAINT     = "var(--t-faint)";
const LINE      = "var(--t-line)";
const CHIP      = "var(--t-chip)";
const SOLID     = "var(--t-solid)";
const ON_SOLID  = "var(--t-on-solid)";


// ── مساعدات ──────────────────────────────────────────────────────────────────

// ── صفحة تسجيل الدخول المدمجة ─────────────────────────────────────────────
function LoginPrompt({ onLogin }) {
  // الخطّاف داخل كل مكوّن يستعمل الترجمة: الصفحة الأم لا تمرّرها،
  // وبدونه ينهار العرض بـ "t is not defined".
  const { t, dir } = useLang();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setErr("أدخل البريد وكلمة المرور"); return; }
    setLoading(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr("بيانات الدخول غير صحيحة"); return; }
    onLogin(data.user);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?for=customer` },
    });
    if (error) setErr(error.message);
  };

  return (
    <div style={{ minHeight: "100vh", background: PAGE, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", direction: dir }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* أيقونة */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 30, boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}>📦</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: INK, margin: "0 0 4px" }}>{t("طلباتي")}</h2>
          <p style={{ fontSize: 14.5, color: FAINT }}>سجّل دخولك لعرض طلباتك</p>
        </div>

        {/* الكارد */}
        <div style={{ background: CARD, borderRadius: 20, padding: "28px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: `1px solid ${LINE}` }}>
          {err && (
            <div style={{ background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 14.5, color: "var(--t-red-ink)" }}>
              {err}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, border: `1.5px solid ${LINE}`, background: CARD, cursor: "pointer", fontSize: 15.5, fontWeight: 600, color: INK, marginBottom: 14, transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = PURPLE}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--t-line)"}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} />
            الدخول عبر Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: LINE }} />
            <span style={{ fontSize: 13.5, color: FAINT }}>أو</span>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          {/* Email + Password */}
          <input
            type="email" placeholder="البريد الإلكتروني"
            value={email} onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password" placeholder="كلمة المرور"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: 17, cursor: "pointer", opacity: loading ? 0.75 : 1, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
            {loading ? "⏳ جاري الدخول..." : "تسجيل الدخول"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 14.5, color: FAINT }}>
            ليس لديك حساب؟{" "}
            <a href="/signup" style={{ color: PURPLE, fontWeight: 700, textDecoration: "none" }}>إنشاء حساب</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── بطاقة الطلب ───────────────────────────────────────────────────────────
// كل طلب يحمل ما يعرّفه: المبلغ بالدينار، التاريخ، عدد الأصناف، طريقة الدفع،
// والعنوان — لا أكثر، وبالدينار وحده (الدولار شأننا لا شأن الزبون).
function OrderCard({ order }) {
  // الخطّاف داخل كل مكوّن يستعمل الترجمة: الصفحة الأم لا تمرّرها،
  // وبدونه ينهار العرض بـ "t is not defined".
  const { t, dir } = useLang();
  const sc = statusColor(order.status);
  const lyd = order.final_total ?? order.price_lyd;
  const items = order.price_breakdown?.quantities?.length || null;
  const addr = order.delivery_address
    ? [order.delivery_address.city, order.delivery_address.area].filter(Boolean).join(" — ")
    : (order.address || "");
  // دقائق متبقّية لدفع طلب غير مدفوع، أو null إن كان مدفوعًا.
  const left = minutesLeftToPay(order);

  return (
    <a
      href={`/track?id=${order.id}`}
      style={{
        background: CARD, borderRadius: 18, padding: 13, display: "flex", gap: 12,
        boxShadow: "0 2px 10px rgba(22,19,31,0.05)", textDecoration: "none", color: INK,
      }}
    >
      {order.image_url ? (
        <img src={order.image_url} alt="" style={{ width: 62, height: 62, borderRadius: 13, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 62, height: 62, borderRadius: 13, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🛍️</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12.5, color: FAINT, fontFamily: "ui-monospace, monospace" }}>#{order.id.slice(0, 8)}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: sc.color, background: sc.bg, borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>
            {t(statusLabel(order.status))}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 5 }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.4px" }}>
            {lyd ? Number(lyd).toFixed(0) : "—"}
          </span>
          {lyd ? <span style={{ fontSize: 12.5, color: FAINT }}>{t("د.ل")}</span> : null}
        </div>

        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.9, marginTop: 4 }}>
          {fmtDate(order.created_at)}
          {items ? ` · ${items} صنف` : ""}
          {order.payMethod ? ` · ${order.payMethod}` : ""}
          {addr ? <><br />{addr}</> : null}
        </div>

        {/* طلب لم يُدفع: طريق العودة إليه، ومهلته.
            الطلب يُنشأ قبل الدفع، ومن أغلق الصفحة كان طلبه يبقى معلّقًا بلا
            زرّ يكمل به. وبما أن غير المدفوع يُحذف بعد ساعة، تُعرض المهلة
            صراحةً بدل أن يفاجأ باختفاء طلبه. */}
        {left != null && (
          <div style={{ marginTop: 10 }}>
            <a
              href={`/pay?order=${order.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 14px", borderRadius: 13, background: GRAD_HEAD, color: "#fff",
                fontSize: 14, fontWeight: 800, textDecoration: "none",
                boxShadow: "0 4px 14px rgba(124,58,237,0.26)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" />
              </svg>
              {t("أكمل الدفع")}
            </a>
            <div style={{ fontSize: 12, color: "var(--t-amber-ink)", textAlign: "center", marginTop: 7, fontWeight: 700 }}>
              {left > 0
                ? `${t("يُحذف الطلب بعد")} ${left} ${t("دقيقة")}`
                : t("انتهت مهلة الدفع — سيُحذف هذا الطلب قريبًا")}
            </div>
          </div>
        )}
      </div>
    </a>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { lang, setLang, t, dir } = useLang();
  const isDesktop = useIsDesktop();
  const { resolved: themeMode, toggle: toggleTheme } = useTheme();
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("all");

  const loadOrders = async (u) => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, payments(method,status,amount)")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false });

    // An order row is created before the customer reaches the gateway, so a
    // payment they started and abandoned leaves one behind. Those are not
    // orders yet; an unpaid row is kept only long enough to finish paying it.
    const RESUME_WINDOW_MS = 60 * 60 * 1000;
    const rows = (data || []).map((o) => {
      const pays = Array.isArray(o.payments) ? o.payments : [];
      const done = pays.find((p) => ["paid", "success", "completed"].includes(p.status));
      return { ...o, payMethod: payLabel(done?.method || pays[0]?.method) || null };
    }).filter((o) =>
      !["new", "pending", null, undefined, ""].includes(o.status)
      || Date.now() - new Date(o.created_at).getTime() < RESUME_WINDOW_MS
    );

    setOrders(rows);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      if (u) loadOrders(u);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
  };

  // تحميل أولي
  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: PAGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #ede9fe", borderTopColor: PURPLE, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // غير مسجل الدخول
  if (!user) return <LoginPrompt onLogin={u => { setUser(u); loadOrders(u); }} />;

  const shown = orders.filter(o =>
    filter === "all" ? true
    : filter === "open" ? !["delivered", "completed", "cancelled"].includes(o.status)
    : ["delivered", "completed"].includes(o.status)
  );

  // مسجل الدخول
  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, direction: dir, paddingBottom: 96 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {isDesktop && <TopBar active="orders" lang={lang} setLang={setLang} t={t} user={user} />}

      <div className="form-inner" style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* ── الترويسة ── */}
        <div style={{ background: GRAD_HEAD, color: "#fff", padding: "18px 20px 24px", position: "relative", overflow: "hidden", borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <a href="/" style={{ fontWeight: 900, fontSize: 19, color: "#fff", textDecoration: "none" }}>{t("ترند · شي إن")}</a>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={toggleTheme} aria-label={t("الوضع الداكن")} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14.5, fontFamily: "inherit", padding: 0 }}>{themeMode === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ fontSize: 12.5, fontWeight: 700, background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit" }}>{lang === "ar" ? "EN" : "ع"}</button>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t("خروج")}</button>
            </div>
          </div>
          <div style={{ marginTop: 20, position: "relative" }}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.4 }}>{t("طلباتي")}</div>
            <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6, lineHeight: 1.8 }}>
              {user.user_metadata?.name || user.email}
            </div>
          </div>
        </div>

        <div style={{ padding: "18px 16px 0" }}>

          {orders.length > 0 && (
            <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                { k: "all",  t: `الكل · ${orders.length}` },
                { k: "open", t: "قيد المعالجة" },
                { k: "done", t: "منجزة" },
              ].map(c => (
                <button
                  key={c.k}
                  onClick={() => setFilter(c.k)}
                  style={{
                    fontSize: 13, fontWeight: filter === c.k ? 800 : 600, cursor: "pointer",
                    background: filter === c.k ? SOLID : CARD,
                    color: filter === c.k ? ON_SOLID : MUTED,
                    border: `1px solid ${filter === c.k ? SOLID : LINE}`,
                    borderRadius: 20, padding: "7px 15px", fontFamily: "inherit",
                  }}
                >{c.t}</button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: FAINT, fontSize: 14.5 }}>⏳ جاري التحميل...</div>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 20px", background: CARD, borderRadius: 18, boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
              <div style={{ fontSize: 46, marginBottom: 12 }}>📭</div>
              <p style={{ fontWeight: 800, marginBottom: 6 }}>
                {orders.length === 0 ? "لا توجد طلبات بعد" : "لا طلبات في هذا التصنيف"}
              </p>
              <p style={{ fontSize: 14, color: FAINT, marginBottom: 20 }}>{t("ابدأ بطلبك الأول من شي إن الآن")}</p>
              <a href="/" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 14, background: GRAD_HEAD, color: "#fff", fontWeight: 800, fontSize: 15.5, textDecoration: "none", boxShadow: "0 6px 18px rgba(124,58,237,0.28)" }}>{t("إنشاء طلب جديد")}</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {shown.map((order, i) => (
                <div key={order.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                  <OrderCard order={order} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── شريط التنقّل السفلي ── */}
      <nav className="bottom-nav" style={{
        position: "fixed", insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, zIndex: 60,
        background: CARD, borderTop: `1px solid ${LINE}`, boxShadow: "0 -4px 20px rgba(22,19,31,0.06)",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "9px 16px 14px" }}>
          {[
            { href: "/",          label: "طلب جديد", on: false, path: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /> },
            { href: "/my-orders", label: "طلباتي",   on: true,  path: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></> },
            { href: "/wallet",    label: "المحفظة",  on: false, path: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /></> },
            { href: "/account",   label: "حسابي",    on: false, path: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /></> },
          ].map((it, i) => (
            <a key={i} href={it.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", color: it.on ? PURPLE : FAINT }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={it.on ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round">{it.path}</svg>
              <span style={{ fontSize: 11.5, fontWeight: it.on ? 800 : 600 }}>{it.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  marginBottom: 12,
  borderRadius: 10,
  border: `1.5px solid ${LINE}`,
  fontSize: 15.5,
  outline: "none",
  color: INK,
  background: CARD,
  boxSizing: "border-box",
};
