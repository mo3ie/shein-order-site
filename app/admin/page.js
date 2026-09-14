"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { adminFetch } from "@/lib/adminFetch";
import AdminShell, { useAdminGuard, StatCard } from "@/app/components/AdminShell";
import { Card, SectionTitle, Button, Icon, I, inputStyle, PRIMARY, INK, MUTED, FAINT, LINE, CARD, CHIP, SOLID, ON_SOLID } from "@/app/components/ui";

/**
 * لوحة الطلبات.
 *
 * ما يفعله الموظف هنا كل يوم: يرى ما هو جديد، يفتح سلة الزبون، يشتريها، يضع
 * الشحن، يبدّل الحالة، ويراسل الزبون. فرُتّبت الشاشة على هذا الترتيب: أرقام
 * اليوم أعلى، ثم أدوات التصفية، ثم بطاقة لكل طلب تحمل ما يحتاجه ولا تخبّئه
 * خلف نقرتين — ومعها تصدير CSV ومراسلة واتساب ومكالمة بضغطة.
 */
const STATUS = {
  new:       { label: "جديد",       tone: "var(--t-amber-ink)", bg: "var(--t-amber-bg)", icon: I.box },
  paid:      { label: "مدفوع",      tone: PRIMARY,              bg: "var(--t-chip)",     icon: I.wallet },
  ordered:   { label: "تم الشراء",  tone: "var(--t-blue-ink)",  bg: "var(--t-blue-bg)",  icon: I.cart },
  shipped:   { label: "تم الشحن",   tone: "#8b5cf6",            bg: "var(--t-chip)",     icon: I.truck },
  delivered: { label: "تم التسليم", tone: "var(--t-green-ink)", bg: "var(--t-green-bg)", icon: I.check },
};

export default function Admin() {
  const { role, can, checking } = useAdminGuard();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilter]     = useState("all");
  const [period, setPeriod]           = useState("all");   // all | today | week
  const [selectedImage, setImage]     = useState(null);
  const [shipping, setShipping]       = useState({});
  const [exchangeRate, setRate]       = useState("");
  const [profitRate, setProfit]       = useState(3);
  const [saved, setSaved]             = useState(false);
  const [savedProfit, setSavedProfit] = useState(false);
  const [openPrice, setOpenPrice]     = useState({});
  const [copiedId, setCopied]         = useState(null);

  useEffect(() => {
    supabase.from("settings").select("exchange_rate, profit_rate").eq("id", 1).single()
      .then(({ data }) => {
        if (!data) return;
        setRate(data.exchange_rate);
        if (data.profit_rate != null) setProfit(data.profit_rate);
      });
  }, []);

  async function getOrders() {
    setLoading(true);
    const res = await adminFetch("/api/order");
    const result = await res.json();
    setOrders((result.data || []).filter((o) => o.status !== "deleted" && o.status !== "completed"));
    setLoading(false);
  }
  useEffect(() => { getOrders(); }, []);

  async function updateStatus(id, newStatus, order) {
    await adminFetch("/api/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    getOrders();
    if (["ordered", "shipped", "delivered"].includes(newStatus)) {
      window.open(waLink(order, newStatus), "_blank");
    }
  }

  function waLink(order, status) {
    let phone = String(order.phone || "").replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "218" + phone.slice(1);
    const msgs = {
      ordered:   "تم شراء طلبك من شي إن وهو قيد التجهيز.",
      shipped:   "تم شحن طلبك وهو في الطريق إليك.",
      delivered: "تم تسليم طلبك — شكرًا لثقتك بنا.",
    };
    const text = msgs[status] || "بخصوص طلبك لدى ترند";
    return `https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً ${order.name}\n${text}`)}`;
  }

  const lydOf = (o) => {
    const base = Number(o.price || 0);
    const total = base * (1 + Number(profitRate || 0) / 100);
    const lyd = Number(exchangeRate || 0) ? total * Number(exchangeRate) : 0;
    return { base, total, lyd, ship: Number(shipping[o.id] ?? o.shipping ?? 0) };
  };

  const inPeriod = (o) => {
    if (period === "all") return true;
    const age = Date.now() - new Date(o.created_at).getTime();
    return period === "today" ? age < 864e5 : age < 7 * 864e5;
  };

  const filtered = useMemo(() => orders.filter((o) =>
    (filterStatus === "all" || o.status === filterStatus) &&
    inPeriod(o) &&
    (!search.trim()
      || o.name?.toLowerCase().includes(search.toLowerCase())
      || o.phone?.includes(search)
      || o.id?.startsWith(search.trim()))
  ), [orders, filterStatus, period, search]);

  // مجموع ما ستحصّله هذه القائمة — رقم يريده المدير كل صباح.
  const revenue = filtered.reduce((sum, o) => {
    const { lyd, ship } = lydOf(o);
    return sum + (Number(o.final_total) || lyd + ship);
  }, 0);

  /** تصدير ما هو معروض إلى CSV: المحاسبة تُنجز خارج اللوحة. */
  function exportCsv() {
    const rows = [["رقم الطلب", "الاسم", "الهاتف", "الحالة", "التاريخ", "السعر بالدولار", "الإجمالي بالدينار", "الشحن", "العنوان", "رابط السلة"]];
    filtered.forEach((o) => {
      const { base, lyd, ship } = lydOf(o);
      rows.push([
        o.id, o.name || "", o.phone || "", STATUS[o.status]?.label || o.status,
        new Date(o.created_at).toLocaleString("ar-LY"),
        base.toFixed(2), (Number(o.final_total) || lyd + ship).toFixed(2), String(ship),
        o.delivery_address || "", o.cart_link || "",
      ]);
    });
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `trend-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (checking || loading) {
    return (
      <AdminShell role={role} title="الطلبات">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 0" }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${LINE}`, borderTopColor: PRIMARY, animation: "spin .8s linear infinite" }} />
          <p style={{ color: FAINT, fontSize: 14, fontWeight: 600 }}>جاري التحميل...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      role={role}
      title="الطلبات"
      subtitle={`${filtered.length} طلب معروض · ${revenue.toFixed(0)} د.ل`}
      actions={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button kind="ghost" onClick={exportCsv} icon={I.download} style={{ width: "auto", padding: "11px 16px", fontSize: 13.5 }}>
            تصدير CSV
          </Button>
          <Button kind="quiet" onClick={getOrders} icon={I.refresh} style={{ width: "auto", padding: "11px 16px", fontSize: 13.5 }}>
            تحديث
          </Button>
        </div>
      }
    >
      {/* ── أرقام سريعة، وكل رقم مرشّح قابل للنقر ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard icon={I.chart} label="كل الطلبات" value={orders.length}
          active={filterStatus === "all"} onClick={() => setFilter("all")} />
        {Object.entries(STATUS).filter(([k]) => k !== "paid").map(([key, cfg]) => (
          <StatCard key={key} icon={cfg.icon} label={cfg.label} tone={cfg.tone}
            value={orders.filter((o) => o.status === key).length}
            active={filterStatus === key} onClick={() => setFilter(key)} />
        ))}
        <StatCard icon={I.wallet} label="إجمالي المعروض" value={revenue.toFixed(0)} unit="د.ل" tone="var(--t-green-ink)" />
      </div>

      {/* ── الإعدادات المالية ── */}
      {can("shein_edit_exchange_rate") && (
        <Card pad={18} style={{ marginBottom: 18 }}>
          <SectionTitle icon={I.bank}>الإعدادات المالية</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>سعر الدولار (USD → LYD)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" step="0.01" value={exchangeRate}
                  onChange={(e) => setRate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <Button kind="solid" style={{ width: "auto", padding: "0 20px" }}
                  onClick={async () => {
                    const { error } = await supabase.from("settings").update({ exchange_rate: Number(exchangeRate) }).eq("id", 1);
                    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
                  }}>
                  {saved ? "تم" : "حفظ"}
                </Button>
              </div>
              <p style={{ fontSize: 12, color: FAINT, margin: "8px 0 0", lineHeight: 1.8 }}>
                يُطبَّق على كل تسعيرة جديدة فور حفظه.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 8 }}>نسبة العمولة (%)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" step="0.1" min="0" max="100" value={profitRate}
                  onChange={(e) => setProfit(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <Button kind="solid" style={{ width: "auto", padding: "0 20px" }}
                  onClick={async () => {
                    const { error } = await supabase.from("settings").update({ profit_rate: Number(profitRate) }).eq("id", 1);
                    if (!error) { setSavedProfit(true); setTimeout(() => setSavedProfit(false), 2000); }
                  }}>
                  {savedProfit ? "تم" : "حفظ"}
                </Button>
              </div>
              <p style={{ fontSize: 12, color: FAINT, margin: "8px 0 0", lineHeight: 1.8 }}>
                سلة بـ 100$ تصير {(100 * (1 + Number(profitRate) / 100)).toFixed(2)}$ ≈ {(100 * (1 + Number(profitRate) / 100) * Number(exchangeRate || 0)).toFixed(0)} د.ل
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── التصفية ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
          <span style={{ position: "absolute", insetInlineStart: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
            <Icon path={I.search} size={16} color={FAINT} />
          </span>
          <input
            placeholder="ابحث بالاسم أو الهاتف أو رقم الطلب..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingInlineStart: 40 }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["all", "كل الفترات"], ["today", "اليوم"], ["week", "٧ أيام"]].map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{
              padding: "10px 15px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", fontSize: 13.5,
              fontWeight: period === k ? 800 : 600,
              border: `1.5px solid ${period === k ? SOLID : LINE}`,
              background: period === k ? SOLID : CARD, color: period === k ? ON_SOLID : MUTED,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── الطلبات ── */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "56px 20px" }}>
          <span style={{ width: 54, height: 54, borderRadius: 18, background: CHIP, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon path={I.box} size={24} color={PRIMARY} />
          </span>
          <p style={{ fontWeight: 800, fontSize: 16 }}>لا طلبات في هذا التصنيف</p>
          <p style={{ fontSize: 13.5, color: FAINT, marginTop: 6 }}>جرّب تصفية أخرى أو حدّث القائمة.</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 16 }}>
          {filtered.map((order, idx) => {
            const cfg = STATUS[order.status] || { label: order.status, tone: MUTED, bg: CHIP, icon: I.box };
            const { base, total, lyd, ship } = lydOf(order);
            const finalTotal = Number(order.final_total) || lyd + ship;
            const qtys = order.price_breakdown?.quantities?.filter((q) => Number(q.wanted) > 1) || [];

            return (
              <Card key={order.id} className="adm-card" pad={0} style={{ overflow: "hidden", animationDelay: `${idx * 0.03}s` }}>
                {/* رأس البطاقة */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: `1px solid ${LINE}` }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon path={cfg.icon} size={17} color={cfg.tone} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.name}</div>
                    <div style={{ fontSize: 12, color: FAINT, fontFamily: "ui-monospace, monospace" }}>#{order.id.slice(0, 8)}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: cfg.tone, background: cfg.bg, borderRadius: 20, padding: "5px 11px", whiteSpace: "nowrap" }}>
                    {cfg.label}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(order.id); setCopied(order.id); setTimeout(() => setCopied(null), 1500); }}
                    title="نسخ رقم الطلب"
                    style={{ background: "none", border: "none", cursor: "pointer", color: copiedId === order.id ? "var(--t-green-ink)" : FAINT, padding: 4, display: "flex" }}
                  >
                    <Icon path={copiedId === order.id ? I.check : I.copy} size={16} />
                  </button>
                </div>

                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* المبلغ والتاريخ */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: "-0.6px", lineHeight: 1 }}>
                        {finalTotal > 0 ? finalTotal.toFixed(0) : "—"}
                        <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}> د.ل</span>
                      </div>
                      <div style={{ fontSize: 12, color: FAINT, marginTop: 4 }}>
                        {base > 0 ? `${base.toFixed(2)}$ من شي إن` : "بلا سعر"}
                      </div>
                    </div>
                    <div style={{ textAlign: "end", fontSize: 12, color: FAINT, lineHeight: 1.7 }}>
                      {new Date(order.created_at).toLocaleDateString("ar-LY", { day: "2-digit", month: "long" })}
                      <br />
                      {new Date(order.created_at).toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {/* الاتصال بالزبون بضغطة، لا نسخ ولصق */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`tel:${order.phone}`} style={{ flex: 1, textDecoration: "none" }}>
                      <Button kind="ghost" icon={I.phone} style={{ width: "100%", padding: "11px 10px", fontSize: 13 }}>
                        {order.phone}
                      </Button>
                    </a>
                    <a href={waLink(order, order.status)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      <Button kind="quiet" icon={I.chat} style={{ width: "auto", padding: "11px 15px", fontSize: 13, color: "var(--t-green-ink)", background: "var(--t-green-bg)" }}>
                        واتساب
                      </Button>
                    </a>
                  </div>

                  {/* العنوان والخريطة */}
                  {(order.delivery_address || order.delivery_geo) && (
                    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: CHIP, borderRadius: 13, padding: "11px 13px" }}>
                      <Icon path={I.pin} size={16} color={PRIMARY} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.8 }}>
                        {order.delivery_address || "—"}
                        {order.delivery_geo && (
                          <>
                            <br />
                            <a href={`https://www.google.com/maps?q=${order.delivery_geo.lat},${order.delivery_geo.lng}`}
                               target="_blank" rel="noreferrer"
                               style={{ color: PRIMARY, fontWeight: 700, textDecoration: "none", fontSize: 12.5 }}>
                              فتح على الخريطة ↗
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* الكميات التي اختارها الزبون */}
                  {qtys.length > 0 && (
                    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-amber-bg)", color: "var(--t-amber-ink)", borderRadius: 13, padding: "11px 13px", fontSize: 12.5, lineHeight: 1.8 }}>
                      <Icon path={I.cart} size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{qtys.map((q) => `${String(q.name).slice(0, 26)} × ${q.wanted}`).join(" · ")}</span>
                    </div>
                  )}

                  {/* روابط وصور */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {order.cart_link && (
                      <a href={order.cart_link} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 130, textDecoration: "none" }}>
                        <Button kind="ghost" icon={I.link} style={{ width: "100%", padding: "11px 10px", fontSize: 13 }}>سلة شي إن</Button>
                      </a>
                    )}
                    {order.cart_shot_url && (
                      <Button kind="ghost" icon={I.search} onClick={() => setImage(order.cart_shot_url)}
                        style={{ width: "auto", padding: "11px 14px", fontSize: 13 }}>لقطة السلة</Button>
                    )}
                    {order.image_url && (
                      <Button kind="ghost" icon={I.note} onClick={() => setImage(order.image_url)}
                        style={{ width: "auto", padding: "11px 14px", fontSize: 13 }}>صورة الزبون</Button>
                    )}
                  </div>

                  {/* تفاصيل السعر */}
                  <div>
                    <button
                      onClick={() => setOpenPrice((p) => ({ ...p, [order.id]: !p[order.id] }))}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "11px 13px", background: CHIP, border: "none", borderRadius: 13, color: INK, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}
                    >
                      <Icon path={I.chart} size={16} color={PRIMARY} />
                      تفاصيل السعر
                      <Icon path={I.back} size={15} color={FAINT}
                        style={{ marginInlineStart: "auto", transform: openPrice[order.id] ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .18s" }} />
                    </button>

                    {openPrice[order.id] && (
                      <div style={{ marginTop: 8, border: `1px solid ${LINE}`, borderRadius: 13, overflow: "hidden" }}>
                        {[
                          ["سعر شي إن", `${base.toFixed(2)} $`],
                          [`العمولة (${profitRate}%)`, `${(total - base).toFixed(2)} $`],
                          ["الإجمالي بالدولار", `${total.toFixed(2)} $`],
                          ["سعر الصرف", `${exchangeRate || "—"} د.ل`],
                          ["الإجمالي بالدينار", `${lyd.toFixed(2)} د.ل`],
                          ["الشحن", `${ship} د.ل`],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 13px", borderBottom: `1px solid ${LINE}`, fontSize: 13 }}>
                            <span style={{ color: MUTED }}>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                        {order.price_breakdown && (
                          <div style={{ padding: "9px 13px", borderBottom: `1px solid ${LINE}`, fontSize: 12.5, color: MUTED, lineHeight: 1.9 }}>
                            قراءة شي إن: retail ${Number(order.price_breakdown.retailUsd ?? 0).toFixed(2)} ·
                            shipping ${Number(order.price_breakdown.shippingUsd ?? 0).toFixed(2)} ·
                            promotions ${Number(order.price_breakdown.promotionsUsd ?? 0).toFixed(2)}
                            <br />
                            <span style={{ opacity: 0.7 }}>coupon ${Number(order.price_breakdown.couponUsd ?? 0).toFixed(2)} (غير محسوب عمدًا)</span>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 13px", background: "var(--t-green-bg)", color: "var(--t-green-ink)" }}>
                          <strong style={{ fontSize: 13 }}>الإجمالي النهائي</strong>
                          <strong style={{ fontSize: 15 }}>{finalTotal.toFixed(2)} د.ل</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* الشحن */}
                  {can("shein_set_shipping") && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        placeholder="سعر الشحن (د.ل)" type="number"
                        value={shipping[order.id] ?? order.shipping ?? ""}
                        onChange={(e) => setShipping((p) => ({ ...p, [order.id]: e.target.value }))}
                        style={{ ...inputStyle, flex: 1, padding: "11px 13px", fontSize: 14 }}
                      />
                      <Button kind="solid" style={{ width: "auto", padding: "0 18px", fontSize: 13.5 }}
                        onClick={async () => {
                          await adminFetch("/api/order", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: order.id, shipping: shipping[order.id],
                              exchange_rate: exchangeRate, price_lyd: lyd,
                              final_total: lyd + Number(shipping[order.id] || 0),
                            }),
                          });
                          getOrders();
                        }}>
                        حفظ
                      </Button>
                    </div>
                  )}

                  {/* الحالة */}
                  {can("shein_change_status") && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {[["ordered", "شراء", I.cart], ["shipped", "شحن", I.truck], ["delivered", "تسليم", I.check], ["completed", "إنهاء", I.box]].map(([s, label, icon]) => (
                        <button key={s} onClick={() => updateStatus(order.id, s, order)} style={{
                          flex: 1, minWidth: 82, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "10px 8px", borderRadius: 11, border: `1.5px solid ${order.status === s ? PRIMARY : LINE}`,
                          background: order.status === s ? CHIP : CARD, color: order.status === s ? PRIMARY : MUTED,
                          cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
                        }}>
                          <Icon path={icon} size={15} />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {can("shein_delete_orders") && (
                    <Button kind="danger" icon={I.trash} style={{ padding: "10px", fontSize: 13 }}
                      onClick={() => { if (confirm("نقل الطلب إلى المحذوفات؟")) updateStatus(order.id, "deleted", order); }}>
                      حذف الطلب
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* معاينة الصور */}
      {selectedImage && (
        <div onClick={() => setImage(null)} style={{
          position: "fixed", inset: 0, background: "rgba(22,19,31,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20,
        }}>
          <img src={selectedImage} onClick={(e) => e.stopPropagation()} alt=""
            style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </AdminShell>
  );
}
