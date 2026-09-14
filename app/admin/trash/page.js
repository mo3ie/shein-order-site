"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import AdminShell, { useAdminGuard, StatCard } from "@/app/components/AdminShell";
import { Card, Button, Icon, I, PRIMARY, MUTED, FAINT, LINE, CHIP, CARD } from "@/app/components/ui";

/**
 * المحذوفات — سلّة مهملات لا مقبرة.
 *
 * الحذف عندنا نقلٌ لا إتلاف، فالمهم أن يكون الرجوع سهلاً: اختيار متعدّد،
 * تحديد الكل بضغطة، واستعادة دفعة واحدة.
 */
export default function Trash() {
  const { role } = useAdminGuard();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function getOrders() {
    setLoading(true);
    const res = await adminFetch("/api/order");
    const result = await res.json();
    setOrders((result.data || []).filter((o) => o.status === "deleted"));
    setLoading(false);
  }
  useEffect(() => { getOrders(); }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const restore = async (ids) => {
    if (!ids.length) return;
    setBusy(true);
    for (const id of ids) {
      await adminFetch("/api/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "new" }),
      });
    }
    setSelected([]);
    setBusy(false);
    getOrders();
  };

  return (
    <AdminShell
      role={role}
      title="المحذوفات"
      subtitle="الحذف نقلٌ لا إتلاف — يمكن استرجاع أي طلب من هنا."
      actions={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {orders.length > 0 && (
            <Button kind="ghost" icon={I.check} style={{ width: "auto", padding: "11px 16px", fontSize: 13.5 }}
              onClick={() => setSelected(selected.length === orders.length ? [] : orders.map((o) => o.id))}>
              {selected.length === orders.length ? "إلغاء التحديد" : "تحديد الكل"}
            </Button>
          )}
          <Button kind="quiet" onClick={getOrders} icon={I.refresh} style={{ width: "auto", padding: "11px 16px", fontSize: 13.5 }}>
            تحديث
          </Button>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard icon={I.trash} label="طلبات محذوفة" value={orders.length} tone="var(--t-red-ink)" />
        <StatCard icon={I.check} label="محدّد للاستعادة" value={selected.length} tone={PRIMARY} />
      </div>

      {selected.length > 0 && (
        <Card pad={14} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Icon path={I.refresh} size={18} color={PRIMARY} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{selected.length} طلب محدّد</span>
          <Button onClick={() => restore(selected)} disabled={busy} icon={I.refresh}
            style={{ width: "auto", padding: "11px 20px", fontSize: 13.5, opacity: busy ? 0.65 : 1 }}>
            {busy ? "جاري الاستعادة..." : "استعادة المحدّد"}
          </Button>
        </Card>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "70px 0" }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${LINE}`, borderTopColor: PRIMARY, animation: "spin .8s linear infinite" }} />
          <p style={{ color: FAINT, fontSize: 14, fontWeight: 600 }}>جاري التحميل...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "56px 20px" }}>
          <span style={{ width: 54, height: 54, borderRadius: 18, background: CHIP, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon path={I.trash} size={24} color={PRIMARY} />
          </span>
          <p style={{ fontWeight: 800, fontSize: 16 }}>سلة المحذوفات فارغة</p>
          <p style={{ fontSize: 13.5, color: FAINT, marginTop: 6 }}>لا شيء هنا في انتظار الاستعادة.</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 14 }}>
          {orders.map((o) => {
            const on = selected.includes(o.id);
            return (
              <Card key={o.id} className="adm-card" pad={16}
                onClick={() => toggle(o.id)}
                style={{ cursor: "pointer", border: `1.5px solid ${on ? PRIMARY : "transparent"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                    border: `1.5px solid ${on ? PRIMARY : LINE}`, background: on ? PRIMARY : CARD,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on && <Icon path={I.check} size={14} color="#fff" stroke={2.4} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: FAINT, fontFamily: "ui-monospace, monospace" }}>#{o.id.slice(0, 8)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.9 }}>
                  {o.phone}
                  <br />
                  {new Date(o.created_at).toLocaleDateString("ar-LY", { day: "2-digit", month: "long", year: "numeric" })}
                  {o.price ? <><br />{Number(o.price).toFixed(2)} $</> : null}
                </div>
                <Button kind="ghost" icon={I.refresh} style={{ marginTop: 12, padding: "10px", fontSize: 13 }}
                  onClick={(e) => { e.stopPropagation(); restore([o.id]); }}>
                  استعادة هذا الطلب
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
