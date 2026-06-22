"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { adminFetch } from "@/lib/adminFetch";
import { useRouter } from "next/navigation";

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState({});
  const [exchangeRate, setExchangeRate] = useState("");
  const [profitRate, setProfitRate] = useState(3);
  const [successId, setSuccessId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savedProfit, setSavedProfit] = useState(false);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [expandedImages, setExpandedImages] = useState({});
  const [expandedPrices, setExpandedPrices] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/admin/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role, full_name").eq("id", data.user.id).single();
      if (!profile || (profile.role !== "admin" && profile.role !== "employee")) {
        router.push("/admin/login"); return;
      }
      setRole(profile.role);
      if (profile.role === "employee") {
        const { data: perms } = await supabase
          .from("employee_permissions").select("*").eq("user_id", data.user.id).single();
        setPermissions(perms);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const getSettings = async () => {
      const { data } = await supabase.from("settings").select("exchange_rate, profit_rate").eq("id", 1).single();
      if (data) {
        setExchangeRate(data.exchange_rate);
        if (data.profit_rate != null) setProfitRate(data.profit_rate);
      }
    };
    getSettings();
  }, []);

  async function getOrders() {
    const res = await adminFetch("/api/order");
    const result = await res.json();
    setOrders(result.data.filter((o) => o.status !== "deleted" && o.status !== "completed"));
    setLoading(false);
  }

  useEffect(() => { getOrders(); }, []);

  async function updateStatus(id, newStatus, order) {
    await adminFetch("/api/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus })
    });
    getOrders();
    if (["ordered", "shipped", "delivered"].includes(newStatus)) sendWhatsApp({ ...order, status: newStatus });
  }

  function sendWhatsApp(order) {
    let phone = order.phone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "218" + phone.slice(1);
    const msgs = { ordered: "تم شراء طلبك من شي إن 🛍️", shipped: "تم شحن طلبك وهو في الطريق 🚚", delivered: "تم تسليم طلبك 🎉" };
    const text = msgs[order.status] || "تم استلام طلبك";
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً ${order.name}\n${text}`)}`;
  }

  const can = (role, permissions, key) => role === "admin" || (permissions && permissions[key] === true);

  const statusConfig = {
    new:       { label: "جديد",      color: "#f59e0b", bg: "#fef3c7", border: "#f59e0b" },
    ordered:   { label: "تم الشراء", color: "#3b82f6", bg: "#dbeafe", border: "#3b82f6" },
    shipped:   { label: "تم الشحن",  color: "#8b5cf6", bg: "#ede9fe", border: "#8b5cf6" },
    delivered: { label: "تم التسليم",color: "#10b981", bg: "#d1fae5", border: "#10b981" },
  };

  const stats = [
    { label: "إجمالي", value: orders.length, color: "#a855f7" },
    { label: "جديد", value: orders.filter(o => o.status === "new").length, color: "#f59e0b" },
    { label: "تم الشراء", value: orders.filter(o => o.status === "ordered").length, color: "#3b82f6" },
    { label: "تم الشحن", value: orders.filter(o => o.status === "shipped").length, color: "#8b5cf6" },
    { label: "تم التسليم", value: orders.filter(o => o.status === "delivered").length, color: "#10b981" },
  ];

  const filtered = orders.filter((o) =>
    (filterStatus === "all" || o.status === filterStatus) &&
    (o.name?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search))
  );

  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid #1e1e2e", borderTop: "3px solid #a855f7", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#555", fontSize: "14px" }}>جاري التحميل...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#080810", color: "#fff", fontFamily: "'Segoe UI', sans-serif", direction: "rtl" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        .order-card { animation: fadeIn 0.3s ease forwards; }
        .order-card:hover { transform: translateY(-2px) !important; }
        .stat-card:hover { border-color: var(--c) !important; }
        .action-btn:hover { filter: brightness(1.15); transform: scale(1.03); }
        input:focus { outline: none !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d0d18; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{ background: "rgba(13,13,24,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1a1a2e", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg,#a855f7,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>T</div>
          <div>
            <h1 style={{ fontSize: "17px", fontWeight: "800", background: "linear-gradient(90deg,#a855f7,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0, letterSpacing: "1px" }}>TREND ADMIN</h1>
            <p style={{ color: "#444", fontSize: "11px", margin: 0 }}>لوحة إدارة الطلبات</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {role === "admin" && (
            <button onClick={() => router.push("/admin/employees")} className="action-btn" style={{ background: "#1a1030", color: "#a855f7", border: "1px solid #3d1d6b", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}>
              👥 الموظفون
            </button>
          )}
          <button onClick={() => router.push("/admin/completed")} className="action-btn" style={{ background: "#0d2218", color: "#22c55e", border: "1px solid #14532d55", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}>
            ✅ المنجزة
          </button>
          <button onClick={() => router.push("/admin/trash")} className="action-btn" style={{ background: "#1f0d0d", color: "#ef4444", border: "1px solid #7f1d1d55", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}>
            🗑️ المحذوفات
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }} className="action-btn" style={{ background: "transparent", color: "#666", border: "1px solid #222", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", transition: "all 0.2s" }}>
            خروج
          </button>
        </div>
      </header>

      <div style={{ padding: "24px 28px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", marginBottom: "24px" }}>
          {stats.map((s) => (
            <div key={s.label} className="stat-card" style={{ background: "#0d0d18", border: `1px solid #1a1a2e`, borderRadius: "12px", padding: "16px", textAlign: "center", transition: "border-color 0.2s", "--c": s.color }}>
              <div style={{ fontSize: "26px", fontWeight: "800", color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Settings Panel */}
        {can(role, permissions, "shein_edit_exchange_rate") && (
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 16px", color: "#888", fontSize: "12px", fontWeight: "600", letterSpacing: "1.5px", textTransform: "uppercase" }}>⚙️ الإعدادات المالية</h3>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

              {/* Exchange Rate */}
              <div style={{ flex: 1, minWidth: "240px" }}>
                <label style={{ color: "#facc15", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "8px" }}>💱 سعر الدولار (USD → LYD)</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="number" step="0.01" value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #2a2a3a", background: "#13131f", color: "#fff", fontSize: "15px", fontWeight: "600", boxSizing: "border-box" }}
                    />
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#facc15", fontSize: "12px", pointerEvents: "none" }}>د.ل</span>
                  </div>
                  <button onClick={async () => {
                    const { error } = await supabase.from("settings").update({ exchange_rate: Number(exchangeRate) }).eq("id", 1);
                    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
                  }} className="action-btn" style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)", color: "#000", padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                    {saved ? "✅ تم" : "💾 حفظ"}
                  </button>
                </div>
              </div>

              <div style={{ width: "1px", background: "#1a1a2e" }} />

              {/* Profit Rate */}
              <div style={{ flex: 1, minWidth: "240px" }}>
                <label style={{ color: "#f97316", fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "8px" }}>💸 نسبة العمولة (%)</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="number" step="0.1" min="0" max="100" value={profitRate}
                      onChange={(e) => setProfitRate(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #2a2a3a", background: "#13131f", color: "#fff", fontSize: "15px", fontWeight: "600", boxSizing: "border-box" }}
                    />
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#f97316", fontSize: "12px", pointerEvents: "none" }}>%</span>
                  </div>
                  <button onClick={async () => {
                    const { error } = await supabase.from("settings").update({ profit_rate: Number(profitRate) }).eq("id", 1);
                    if (!error) { setSavedProfit(true); setTimeout(() => setSavedProfit(false), 2500); }
                  }} className="action-btn" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                    {savedProfit ? "✅ تم" : "💾 حفظ"}
                  </button>
                </div>
                <p style={{ color: "#555", fontSize: "11px", margin: "6px 0 0" }}>
                  مثال: السعر $100 → عمولة {Number(profitRate)}% = ${(100 * Number(profitRate) / 100).toFixed(2)} → الإجمالي ${(100 + 100 * Number(profitRate) / 100).toFixed(2)}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "#444" }}>🔍</span>
            <input
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "11px 40px 11px 14px", borderRadius: "10px", border: "1px solid #1a1a2e", background: "#0d0d18", color: "#fff", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[["all","الكل","#a855f7"],["new","جديد","#f59e0b"],["ordered","تم الشراء","#3b82f6"],["shipped","تم الشحن","#8b5cf6"],["delivered","تم التسليم","#10b981"]].map(([val,label,color]) => (
              <button key={val} onClick={() => setFilterStatus(val)} style={{
                padding: "8px 14px", borderRadius: "8px", border: `1px solid ${filterStatus===val ? color : "#1a1a2e"}`,
                background: filterStatus===val ? color+"22" : "#0d0d18", color: filterStatus===val ? color : "#555",
                cursor: "pointer", fontSize: "13px", fontWeight: filterStatus===val ? "700" : "400", transition: "all 0.2s"
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Orders Count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "14px", color: "#555", margin: 0, fontWeight: "400" }}>
            عرض <span style={{ color: "#fff", fontWeight: "700" }}>{filtered.length}</span> طلب
          </h2>
          <button onClick={getOrders} className="action-btn" style={{ background: "#0d0d18", color: "#555", border: "1px solid #1a1a2e", padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", transition: "all 0.2s" }}>
            🔄 تحديث
          </button>
        </div>

        {/* Orders Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "16px" }}>
          {filtered.map((order, idx) => {
            const sc = statusConfig[order.status] || { label: order.status, color: "#555", bg: "#1a1a2e", border: "#555" };
            const base = Number(order.price || 0);
            const rate = Number(profitRate || 3) / 100;
            const profit = base * rate;
            const totalUSD = base + profit;
            const priceLYD = Number(exchangeRate || 0) ? totalUSD * Number(exchangeRate) : 0;
            const shippingValue = Number(shipping[order.id] || 0);
            const finalTotal = priceLYD + shippingValue;
            const imgExpanded = expandedImages[order.id];
            const priceExpanded = expandedPrices[order.id];

            return (
              <div key={order.id} className="order-card" style={{
                background: "#0d0d18", border: `1px solid #1a1a2e`,
                borderRight: `3px solid ${sc.color}`, borderRadius: "14px",
                overflow: "hidden", transition: "all 0.25s", animationDelay: `${idx * 0.04}s`
              }}>

                {/* Card Header */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#444", fontFamily: "monospace" }}>#{order.id.slice(0,8)}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(order.id); setCopiedId(order.id); setTimeout(() => setCopiedId(null), 1500); }}
                      style={{ background: "none", border: "none", color: copiedId === order.id ? "#22c55e" : "#333", cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", transition: "color 0.2s" }}
                    >
                      {copiedId === order.id ? "✓ نُسخ" : "📋"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", background: sc.color+"22", color: sc.color, padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>
                      {sc.label}
                    </span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "10px", color: "#444" }}>
                        {new Date(order.created_at).toLocaleDateString("ar-LY", { day:"2-digit", month:"2-digit", year:"numeric" })}
                      </div>
                      <div style={{ fontSize: "10px", color: "#333" }}>
                        {new Date(order.created_at).toLocaleTimeString("ar-LY", { hour:"2-digit", minute:"2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>{order.name}</div>
                      <div style={{ fontSize: "13px", color: "#555", marginTop: "2px" }}>📞 {order.phone}</div>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#22c55e" }}>{finalTotal > 0 ? finalTotal.toFixed(0) : "—"} <span style={{ fontSize: "11px", fontWeight: "400", color: "#555" }}>د.ل</span></div>
                      <div style={{ fontSize: "11px", color: "#444" }}>{base > 0 ? base.toFixed(2) + " $" : "—"}</div>
                    </div>
                  </div>

                  {/* Cart Link */}
                  {order.cart_link && (
                    <a href={order.cart_link} target="_blank" rel="noreferrer" style={{
                      display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
                      padding: "9px 12px", borderRadius: "8px", background: "#13131f",
                      border: "1px solid #2a2a3a", color: "#7dd3fc", textDecoration: "none",
                      fontSize: "12px", fontWeight: "600", marginBottom: "10px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background="#1a2a3a"; e.currentTarget.style.borderColor="#3b82f6"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="#13131f"; e.currentTarget.style.borderColor="#2a2a3a"; }}
                    >
                      🛒 <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>فتح سلة التسوق</span>
                      <span style={{ color: "#444" }}>↗</span>
                    </a>
                  )}

                  {/* Image Toggle */}
                  {order.image_url && (
                    <div style={{ marginBottom: "10px" }}>
                      <button
                        onClick={() => setExpandedImages(p => ({ ...p, [order.id]: !p[order.id] }))}
                        style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", padding: "8px 12px", background: "#13131f", border: "1px solid #2a2a3a", borderRadius: "8px", color: "#888", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}
                      >
                        🖼️ صورة الطلب
                        <span style={{ marginRight: "auto", transition: "transform 0.3s", transform: imgExpanded ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▾</span>
                      </button>
                      {imgExpanded && (
                        <div style={{ marginTop: "8px", borderRadius: "8px", overflow: "hidden", border: "1px solid #1a1a2e" }}>
                          <img
                            src={order.image_url}
                            style={{ width: "100%", maxHeight: "180px", objectFit: "cover", cursor: "zoom-in", display: "block" }}
                            onClick={() => setSelectedImage(order.image_url)}
                            title="اضغط للتكبير"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price Breakdown Toggle */}
                  <div style={{ marginBottom: "10px" }}>
                    <button
                      onClick={() => setExpandedPrices(p => ({ ...p, [order.id]: !p[order.id] }))}
                      style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", padding: "8px 12px", background: "#13131f", border: "1px solid #2a2a3a", borderRadius: "8px", color: "#888", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}
                    >
                      💰 تفاصيل السعر
                      <span style={{ marginRight: "auto", transition: "transform 0.3s", transform: priceExpanded ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▾</span>
                    </button>
                    {priceExpanded && (
                      <div style={{ marginTop: "8px", background: "#13131f", borderRadius: "8px", border: "1px solid #1a1a2e", overflow: "hidden" }}>
                        {[
                          ["السعر الأصلي", `${base.toFixed(2)} $`, "#fff"],
                          [`العمولة (${profitRate}%)`, `${profit.toFixed(2)} $`, "#f97316"],
                          ["الإجمالي USD", `${totalUSD.toFixed(2)} $`, "#3b82f6"],
                          ["سعر الدولار", `${exchangeRate || "—"} د.ل`, "#facc15"],
                          ["الإجمالي LYD", `${priceLYD.toFixed(2)} د.ل`, "#22c55e"],
                          ["الشحن", `${shippingValue} د.ل`, "#a855f7"],
                        ].map(([label, value, color]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #1a1a2e" }}>
                            <span style={{ color: "#555", fontSize: "12px" }}>{label}</span>
                            <span style={{ color, fontSize: "13px", fontWeight: "600" }}>{value}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#0d1f18" }}>
                          <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "700" }}>💰 الإجمالي النهائي</span>
                          <span style={{ color: "#22c55e", fontSize: "15px", fontWeight: "800" }}>{finalTotal.toFixed(2)} د.ل</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipping Input */}
                  {can(role, permissions, "shein_set_shipping") && (
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        placeholder="سعر الشحن (د.ل)"
                        type="number" value={shipping[order.id] || ""}
                        onChange={(e) => setShipping(p => ({ ...p, [order.id]: e.target.value }))}
                        style={{ flex: 1, padding: "9px 12px", borderRadius: "8px", border: "1px solid #2a2a3a", background: "#13131f", color: "#fff", fontSize: "13px" }}
                      />
                      <button
                        onClick={async () => {
                          const res = await adminFetch("/api/order", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: order.id, shipping: shipping[order.id], exchange_rate: exchangeRate, price_lyd: priceLYD, final_total: finalTotal })
                          });
                          if (res.ok) { setSuccessId(order.id); setTimeout(() => setSuccessId(null), 2000); }
                        }}
                        style={{ padding: "9px 14px", borderRadius: "8px", border: "none", background: successId === order.id ? "#22c55e" : "#1a1a2e", color: successId === order.id ? "#fff" : "#888", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s", whiteSpace: "nowrap" }}
                      >
                        {successId === order.id ? "✅" : "💾 حفظ"}
                      </button>
                    </div>
                  )}

                  {/* Status Buttons */}
                  {can(role, permissions, "shein_change_status") && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                      {[["ordered","🛍️ شراء","#3b82f6"],["shipped","🚚 شحن","#8b5cf6"],["delivered","✅ تسليم","#10b981"],["completed","🏁 منجز","#22c55e"]].map(([s,l,c]) => (
                        <button key={s} onClick={() => updateStatus(order.id, s, order)} className="action-btn" style={{
                          flex: 1, padding: "7px 4px", borderRadius: "7px", border: `1px solid ${order.status===s ? c : "#1a1a2e"}`,
                          background: order.status===s ? c+"22" : "#13131f", color: order.status===s ? c : "#555",
                          cursor: "pointer", fontSize: "11px", fontWeight: order.status===s ? "700" : "400", transition: "all 0.2s"
                        }}>{l}</button>
                      ))}
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => sendWhatsApp(order)} className="action-btn" style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "#075e5422", color: "#25d366", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}>
                      📱 واتساب
                    </button>
                    {can(role, permissions, "shein_delete_orders") && (
                      <button onClick={() => updateStatus(order.id, "deleted", order)} className="action-btn" style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#ef444415", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" }}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#333" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
            <p style={{ fontSize: "16px" }}>لا توجد طلبات</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(6px)" }}>
          <img src={selectedImage} onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", boxShadow: "0 25px 80px rgba(0,0,0,0.8)" }} />
          <button onClick={() => setSelectedImage(null)} style={{ position: "fixed", top: "20px", right: "20px", background: "#1a1a2e", border: "1px solid #333", color: "#fff", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      )}
    </main>
  );
}

function getStatusColor(status) {
  const map = { new: "#f59e0b", ordered: "#3b82f6", shipped: "#8b5cf6", delivered: "#10b981" };
  return map[status] || "#444";
}
