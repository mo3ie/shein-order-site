"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

// ── مساعدات ──────────────────────────────────────────────────────────────────
function statusLabel(s) {
  return {
    new: "جديد", paid: "مدفوع", confirmed: "مؤكد",
    ordered: "قيد المعالجة", processing: "قيد المعالجة",
    shipped: "في الشحن", delivered: "تم التسليم",
    completed: "منجز", cancelled: "ملغي",
  }[s] || s || "جديد";
}
function statusColor(s) {
  if (["delivered","completed"].includes(s)) return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (["paid","confirmed"].includes(s))       return { color: "#7c3aed", bg: "#f5f3ff", border: "#e9d5ff" };
  if (["shipped"].includes(s))                return { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
  if (["ordered","processing"].includes(s))   return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  if (["cancelled"].includes(s))              return { color: "#ef4444", bg: "#fff5f5", border: "#fecaca" };
  return { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("ar-LY", { day: "2-digit", month: "long", year: "numeric" })
    + " — " + dt.toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" });
}

// ── صفحة تسجيل الدخول المدمجة ─────────────────────────────────────────────
function LoginPrompt({ onLogin }) {
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
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", direction: "rtl" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* أيقونة */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28, boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}>📦</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", margin: "0 0 4px" }}>طلباتي</h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>سجّل دخولك لعرض طلباتك</p>
        </div>

        {/* الكارد */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>
          {err && (
            <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#ef4444" }}>
              {err}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 14, transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = PURPLE}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} />
            الدخول عبر Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
            <span style={{ fontSize: 12, color: "#d1d5db" }}>أو</span>
            <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
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

          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.75 : 1, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
            {loading ? "⏳ جاري الدخول..." : "تسجيل الدخول"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#9ca3af" }}>
            ليس لديك حساب؟{" "}
            <a href="/signup" style={{ color: PURPLE, fontWeight: 700, textDecoration: "none" }}>إنشاء حساب</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── بطاقة الطلب ───────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const sc = statusColor(order.status);

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", borderRight: `3px solid ${sc.color}`, display: "flex", gap: 0 }}>

      {/* صورة مصغرة */}
      {order.image_url ? (
        <img
          src={order.image_url}
          style={{ width: 90, minWidth: 90, objectFit: "cover", display: "block" }}
          alt="طلب"
        />
      ) : (
        <div style={{ width: 90, minWidth: 90, background: "linear-gradient(135deg,#f5f3ff,#eff6ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          🛍️
        </div>
      )}

      {/* المحتوى */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>

        {/* الصف الأول: رقم + الحالة */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>#{order.id.slice(0, 8)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {statusLabel(order.status)}
          </span>
        </div>

        {/* السعر */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>
            {order.final_total ? Number(order.final_total).toFixed(0) : (order.price_lyd ? Number(order.price_lyd).toFixed(0) : "—")}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {order.final_total || order.price_lyd ? "د.ل" : ""}
          </span>
          {order.price && (
            <span style={{ fontSize: 11, color: "#d1d5db", marginRight: 2 }}>
              ({Number(order.price).toFixed(2)} $)
            </span>
          )}
        </div>

        {/* التاريخ */}
        <div style={{ fontSize: 11, color: "#9ca3af" }}>
          🕐 {fmtDate(order.created_at)}
        </div>

        {/* رابط الطلب + زر التتبع */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
          {order.cart_link ? (
            <a href={order.cart_link} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: PURPLE, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
              🛒 فتح السلة
            </a>
          ) : <span />}

          <a href={`/track?id=${order.id}`}
            style={{ padding: "5px 14px", borderRadius: 8, background: GRAD, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
            تتبع الطلب
          </a>
        </div>
      </div>
    </div>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async (u) => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
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
      <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `4px solid #ede9fe`, borderTopColor: PURPLE, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // غير مسجل الدخول
  if (!user) return <LoginPrompt onLogin={u => { setUser(u); loadOrders(u); }} />;

  // مسجل الدخول
  return (
    <div style={{ minHeight: "calc(100vh - 60px)", padding: "24px 16px", direction: "rtl", background: "transparent" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: 540, margin: "0 auto" }}>

        {/* الرأس */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>📦 طلباتي</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "3px 0 0" }}>
              {user.user_metadata?.name || user.email}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/" style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              + طلب جديد
            </a>
            <button onClick={handleLogout} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#fff5f5", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              خروج
            </button>
          </div>
        </div>

        {/* قائمة الطلبات */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>⏳ جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 18, border: "1px solid #f3f4f6" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>لا توجد طلبات بعد</p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>ابدأ بطلبك الأول من شي إن الآن</p>
            <a href="/" style={{ padding: "11px 28px", borderRadius: 12, background: GRAD, color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              إنشاء طلب جديد
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{orders.length} طلب</p>
            {orders.map((order, i) => (
              <div key={order.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  marginBottom: 12,
  borderRadius: 10,
  border: "1.5px solid #e5e7eb",
  fontSize: 14,
  outline: "none",
  color: "#111",
  background: "#fff",
  boxSizing: "border-box",
};
