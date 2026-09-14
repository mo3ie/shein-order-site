"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import AdminShell, { useAdminGuard, StatCard } from "@/app/components/AdminShell";
import { Card, Button, Icon, I, inputStyle, PRIMARY, MUTED, FAINT, LINE, CHIP } from "@/app/components/ui";

/**
 * الطلبات المنجزة — أرشيف يُبحث فيه، لا قائمة صور.
 * ما يُسأل عنه هنا عادةً: كم أنجزنا، وكم حصّلنا، وأين طلب فلان.
 */
export default function Completed() {
  const { role } = useAdminGuard();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [img, setImg] = useState(null);

  async function getOrders() {
    setLoading(true);
    const res = await adminFetch("/api/order");
    const result = await res.json();
    setOrders((result.data || []).filter((o) => o.status === "completed"));
    setLoading(false);
  }
  useEffect(() => { getOrders(); }, []);

  const filtered = useMemo(() => orders.filter((o) =>
    !search.trim() || o.name?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search)
  ), [orders, search]);

  const total = filtered.reduce((s, o) => s + Number(o.final_total || o.price_lyd || 0), 0);

  return (
    <AdminShell
      role={role}
      title="الطلبات المنجزة"
      subtitle={`${filtered.length} طلب · ${total.toFixed(0)} د.ل`}
      actions={<Button kind="quiet" onClick={getOrders} icon={I.refresh} style={{ width: "auto", padding: "11px 16px", fontSize: 13.5 }}>تحديث</Button>}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard icon={I.check} label="طلبات منجزة" value={orders.length} tone="var(--t-green-ink)" />
        <StatCard icon={I.wallet} label="إجمالي محصّل" value={total.toFixed(0)} unit="د.ل" tone="var(--t-green-ink)" />
      </div>

      <div style={{ position: "relative", marginBottom: 18, maxWidth: 420 }}>
        <span style={{ position: "absolute", insetInlineStart: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
          <Icon path={I.search} size={16} color={FAINT} />
        </span>
        <input placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingInlineStart: 40 }} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "70px 0" }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${LINE}`, borderTopColor: PRIMARY, animation: "spin .8s linear infinite" }} />
          <p style={{ color: FAINT, fontSize: 14, fontWeight: 600 }}>جاري التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "56px 20px" }}>
          <span style={{ width: 54, height: 54, borderRadius: 18, background: CHIP, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon path={I.check} size={24} color={PRIMARY} />
          </span>
          <p style={{ fontWeight: 800, fontSize: 16 }}>لا طلبات منجزة بعد</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 14 }}>
          {filtered.map((o) => (
            <Card key={o.id} className="adm-card" pad={16}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--t-green-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon path={I.check} size={17} color="var(--t-green-ink)" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: FAINT, fontFamily: "ui-monospace, monospace" }}>#{o.id.slice(0, 8)}</div>
                </div>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{Number(o.final_total || o.price_lyd || 0).toFixed(0)}</div>
                  <div style={{ fontSize: 11, color: FAINT }}>د.ل</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.9 }}>
                {o.phone}
                <br />
                {new Date(o.created_at).toLocaleDateString("ar-LY", { day: "2-digit", month: "long", year: "numeric" })}
                {o.delivery_address ? <><br />{o.delivery_address}</> : null}
              </div>
              {o.image_url && (
                <img src={o.image_url} alt="" onClick={() => setImg(o.image_url)}
                  style={{ width: "100%", maxHeight: 150, objectFit: "cover", borderRadius: 13, marginTop: 12, cursor: "zoom-in" }} />
              )}
            </Card>
          ))}
        </div>
      )}

      {img && (
        <div onClick={() => setImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(22,19,31,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <img src={img} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 16 }} />
        </div>
      )}
    </AdminShell>
  );
}
