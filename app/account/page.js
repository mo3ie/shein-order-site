"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AddressManager from "@/components/AddressManager";

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

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

function OrderCard({ order }) {
  const sc = statusColor(order.status);

  return (
    <div style={{
      background: "#fff", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
      borderRight: `3px solid ${sc.color}`, display: "flex",
    }}>
      {/* صورة مصغرة */}
      {order.image_url ? (
        <img src={order.image_url} style={{ width: 88, minWidth: 88, objectFit: "cover", display: "block" }} alt="" />
      ) : (
        <div style={{ width: 88, minWidth: 88, background: "linear-gradient(135deg,#f5f3ff,#eff6ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          🛍️
        </div>
      )}

      {/* المحتوى */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        {/* رقم + حالة */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>#{order.id.slice(0, 8)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
            {statusLabel(order.status)}
          </span>
        </div>

        {/* السعر */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b" }}>
            {order.final_total
              ? Number(order.final_total).toFixed(0)
              : order.price_lyd
              ? Number(order.price_lyd).toFixed(0)
              : "—"}
          </span>
          {(order.final_total || order.price_lyd) && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>د.ل</span>
          )}
          {order.price && (
            <span style={{ fontSize: 11, color: "#d1d5db" }}>
              ({Number(order.price).toFixed(2)} $)
            </span>
          )}
        </div>

        {/* التاريخ */}
        <div style={{ fontSize: 11, color: "#9ca3af" }}>🕐 {fmtDate(order.created_at)}</div>

        {/* رابط + زر تتبع */}
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

export default function AccountPage() {
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

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
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
      <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #ede9fe", borderTopColor: PURPLE, animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const avatarUrl = avatar;
  const name      = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "مستخدم";

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", padding: "24px 16px", direction: "rtl", background: "transparent" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── بطاقة المستخدم ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => !uploadingAvatar && fileRef.current?.click()} title="تغيير الصورة"
              style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #e9d5ff", opacity: uploadingAvatar ? 0.5 : 1 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 800, opacity: uploadingAvatar ? 0.5 : 1 }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <span style={{ position: "absolute", bottom: -2, left: -2, width: 22, height: 22, borderRadius: "50%", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                {uploadingAvatar ? "⏳" : "📷"}
              </span>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>{name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <a href="/" style={{ flex: 1, padding: "10px", borderRadius: 10, background: GRAD, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", textAlign: "center", boxShadow: "0 3px 10px rgba(124,58,237,0.3)" }}>
              + طلب جديد
            </a>
            <button onClick={logout} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              تسجيل خروج
            </button>
          </div>
        </div>

        {/* ── العناوين ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
          <AddressManager />
        </div>

        {/* ── قائمة الطلبات ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>📦 طلباتي</h3>
            {orders.length > 0 && <span style={{ fontSize: 12, color: "#9ca3af" }}>{orders.length} طلب</span>}
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 18, border: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>📭</div>
              <p style={{ fontWeight: 700, color: "#1e1b4b", marginBottom: 4 }}>لا توجد طلبات بعد</p>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18 }}>ابدأ بطلبك الأول من شي إن</p>
              <a href="/" style={{ padding: "10px 28px", borderRadius: 12, background: GRAD, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                إنشاء طلب
              </a>
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
    </div>
  );
}
