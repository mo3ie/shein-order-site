"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { statusLabel, statusColor, fmtDate, lydOf, isPaid, payLabel, minutesLeftToPay } from "@/lib/orderStatus";
import { useLang, useIsDesktop } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import TopBar from "@/app/components/TopBar";
import { useRouter } from "next/navigation";
import AddressManager from "@/components/AddressManager";

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

// مفردات التصميم نفسها في كل الشاشات.
const GRAD_HEAD = "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)";
const PAGE      = "var(--t-page)";
const CARD      = "var(--t-card)";
const INK       = "var(--t-ink)";
const MUTED     = "var(--t-muted)";
const FAINT     = "var(--t-faint)";
const LINE      = "var(--t-line)";
const CHIP      = "var(--t-chip)";

/** What the customer owes, in the currency they pay in. */

/** An order only counts as paid once a gateway (or the wallet) says so. */


function OrderCard({ order }) {
  // الخطّاف داخل كل مكوّن يستعمل الترجمة: الصفحة الأم لا تمرّرها،
  // وبدونه ينهار العرض بـ "t is not defined".
  const { t, dir } = useLang();
  const sc = statusColor(order.status);

  return (
    <div style={{
      background: CARD, borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
      borderRight: `3px solid ${sc.color}`, display: "flex",
    }}>
      {/* صورة مصغرة */}
      {order.image_url ? (
        <img src={order.image_url} style={{ width: 88, minWidth: 88, objectFit: "cover", display: "block" }} alt="" />
      ) : (
        <div style={{ width: 88, minWidth: 88, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          🛍️
        </div>
      )}

      {/* المحتوى */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        {/* رقم + حالة */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 12.5, color: FAINT }}>#{order.id.slice(0, 8)}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {t(statusLabel(order.status))}
          </span>
        </div>

        {/* السعر — بالدينار فقط: العميل يدفع بالدينار، والدولار تفصيل داخلي */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: INK }}>
            {lydOf(order) != null ? lydOf(order).toFixed(0) : "—"}
          </span>
          {lydOf(order) != null && <span style={{ fontSize: 12.5, color: FAINT }}>{t("د.ل")}</span>}
          {!isPaid(order) && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-amber-ink)", background: "var(--t-amber-bg)",
                           border: "1px solid var(--t-amber-line)", borderRadius: 20, padding: "1px 8px", marginInlineStart: 4 }}>{t("بانتظار الدفع")}</span>
          )}
        </div>

        {/* ما يحتاجه العميل ليتعرّف على طلبه دون فتح صفحة أخرى */}
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.9 }}>
          🕐 {fmtDate(order.created_at)}
          {order.itemCount ? <> · 🧾 {order.itemCount} صنف</> : null}
          {order.payMethod ? <> · 💳 {order.payMethod}</> : null}
          {order.delivery_address ? <><br />📍 {order.delivery_address}</> : null}
          {order.shipping ? <><br />🚚 الشحن: {Number(order.shipping).toFixed(0)} د.ل</> : null}
        </div>

        {/* طلب لم يُدفع: زرّ يُكمل به الدفع، ومهلته قبل الحذف. */}
        {minutesLeftToPay(order) != null && (
          <a
            href={`/pay?order=${order.id}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 14px", borderRadius: 13, background: GRAD, color: "#fff",
              fontSize: 14, fontWeight: 800, textDecoration: "none", marginTop: 4,
            }}
          >
            {t("أكمل الدفع")}
            <span style={{ fontSize: 11.5, opacity: 0.85, fontWeight: 600 }}>
              ({minutesLeftToPay(order)} {t("دقيقة")})
            </span>
          </a>
        )}

        {/* رابط + زر تتبع */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
          {order.cart_link ? (
            <a href={order.cart_link} target="_blank" rel="noreferrer"
              style={{ fontSize: 12.5, color: PURPLE, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
              🛒 فتح السلة
            </a>
          ) : <span />}
          <a href={`/track?id=${order.id}`}
            style={{ padding: "5px 14px", borderRadius: 8, background: GRAD, color: "#fff", fontSize: 13.5, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
            تتبع الطلب
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { lang, setLang, t, dir } = useLang();
  const isDesktop = useIsDesktop();
  const { resolved: themeMode, toggle: toggleTheme } = useTheme();
  const router  = useRouter();
  const [user,    setUser]    = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatar,  setAvatar]  = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: prof } = await supabase
        .from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
      setAvatar(prof?.avatar_url || user.user_metadata?.avatar_url || null);

      // auto-claim طلب عند العودة من الدخول
      const claimId = sessionStorage.getItem("claimOrderId");
      if (claimId) {
        sessionStorage.removeItem("claimOrderId");
        const { data: { session } } = await supabase.auth.getSession();
        await fetch("/api/order/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ order_id: claimId }),
        });
      }

      // الطلبات وحدها، ثم صفوف الدفع على حدة: جلبهما معًا كان يُفشل الاستعلام
      // كلّه حين تمنع RLS قراءة صفوف الدفع، فتظهر الشاشة بلا طلبات إطلاقًا.
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      let payRows = [];
      if (data?.length) {
        const { data: p } = await supabase
          .from("payments")
          .select("order_id, method, status")
          .in("order_id", data.map((o) => o.id));
        payRows = p || [];
      }

      // An order row is created before the customer reaches the gateway, so a
      // payment they started and abandoned leaves one behind. Those are not
      // orders yet -- showing them made two identical "طلب جديد" cards appear
      // for a single attempt. An unpaid row is kept only long enough for the
      // customer to finish paying it.
      const RESUME_WINDOW_MS = 60 * 60 * 1000;
      const rows = (data || []).map((o) => {
        const pays = payRows.filter((p) => p.order_id === o.id);
        const done = pays.find((p) => ["paid", "success", "completed"].includes(p.status));
        return {
          ...o,
          payMethod: payLabel(done?.method || pays[0]?.method),
          itemCount: o.price_breakdown?.quantities?.length || null,
        };
      }).filter((o) =>
        isPaid(o) || Date.now() - new Date(o.created_at).getTime() < RESUME_WINDOW_MS
      );
      setOrders(rows);
      setLoading(false);
    };
    getData();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { data: { session } } = await supabase.auth.getSession();
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    setUploadingAvatar(false);
    if (res.ok && data.url) setAvatar(data.url);
    else alert(data.error || "فشل رفع الصورة");
    e.target.value = "";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #ede9fe", borderTopColor: PURPLE, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const avatarUrl = avatar;
  const name      = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "مستخدم";

  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, direction: dir, paddingBottom: 96 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {isDesktop && <TopBar active="account" lang={lang} setLang={setLang} t={t} user={user} />}

      <div className="form-inner" style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* ── الترويسة: الهوية نفسها، وصورة الحساب تعيش داخل التدرّج ── */}
        <div style={{ background: GRAD_HEAD, color: "#fff", padding: "18px 20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <a href="/" style={{ fontWeight: 900, fontSize: 20, color: "#fff", textDecoration: "none" }}>{t("ترند · شي إن")}</a>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={toggleTheme} aria-label={t("الوضع الداكن")} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14.5, fontFamily: "inherit", padding: 0 }}>{themeMode === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ fontSize: 12.5, fontWeight: 700, background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit" }}>{lang === "ar" ? "EN" : "ع"}</button>
            <button onClick={logout} style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t("خروج")}</button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, position: "relative" }}>
            <div onClick={() => !uploadingAvatar && fileRef.current?.click()} title="تغيير الصورة" style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(255,255,255,0.45)", opacity: uploadingAvatar ? 0.5 : 1 }} />
              ) : (
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, opacity: uploadingAvatar ? 0.5 : 1 }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <span style={{ position: "absolute", bottom: -2, insetInlineStart: -2, width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                {uploadingAvatar
                  ? <span style={{ width: 11, height: 11, borderRadius: "50%", border: `2px solid ${PURPLE}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="14" rx="2.5" /><circle cx="12" cy="13" r="3.2" /></svg>}
              </span>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 21, letterSpacing: "-0.4px" }}>{name}</div>
              <div style={{ fontSize: 13.5, opacity: 0.82, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", position: "relative" }}>
            <span style={{ fontSize: 12.5, background: "rgba(255,255,255,0.16)", borderRadius: 20, padding: "4px 11px" }}>
              {orders.length} طلب
            </span>
            <a href="/wallet" style={{ fontSize: 12.5, background: "rgba(255,255,255,0.16)", borderRadius: 20, padding: "4px 11px", color: "#fff", textDecoration: "none" }}>
              المحفظة ←
            </a>
          </div>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>

          {/* ── العناوين ── */}
          <div style={{ background: CARD, borderRadius: 18, padding: 15, boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
            <AddressManager />
          </div>

          {/* ── قائمة الطلبات ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ fontSize: 15.5, fontWeight: 800 }}>{t("طلباتي")}</span>
            <a href="/my-orders" style={{ fontSize: 13, color: PURPLE, textDecoration: "none", fontWeight: 700 }}>{t("عرض الكل ←")}</a>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: CARD, borderRadius: 18, boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
              <p style={{ fontWeight: 800, marginBottom: 6 }}>{t("لا توجد طلبات بعد")}</p>
              <p style={{ fontSize: 14, color: FAINT, marginBottom: 20 }}>ابدأ بطلبك الأول من شي إن</p>
              <a href="/" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 14, background: GRAD_HEAD, color: "#fff", fontWeight: 800, fontSize: 15.5, textDecoration: "none", boxShadow: "0 6px 18px rgba(124,58,237,0.28)" }}>{t("إنشاء طلب")}</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.map((order, i) => (
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
        background: CARD, borderTop: `1px solid ${LINE}`,
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "8px 16px 10px" }}>
          {[
            { href: "/",          label: "طلب جديد", on: false, path: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /> },
            { href: "/my-orders", label: "طلباتي",   on: false, path: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></> },
            { href: "/wallet",    label: "المحفظة",  on: false, path: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /></> },
            { href: "/account",   label: "حسابي",    on: true,  path: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /></> },
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
