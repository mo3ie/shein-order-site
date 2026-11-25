"use client";

import { useState } from "react";
import { Icon, I, PRIMARY, INK, MUTED, FAINT, LINE, CHIP } from "@/app/components/ui";
import { adminFetch } from "@/lib/adminFetch";

/**
 * «محتويات السلة للشراء» — what the buyer needs to purchase a paid cart exactly as
 * it was priced: every line with its picture, colour/size, seller, unit price and the
 * quantity to buy; which SHEIN account priced it and when; SHEIN's own totals; a
 * tick per line (kept on this device) so a long cart can be bought without losing
 * track; and a copyable shopping list.
 *
 * Data: order.price_breakdown.details (saved from the measurement since 2026-11-25).
 * Older orders don't have it — the panel says so and points to the cart link.
 */
const money = (v) => (v == null || !Number.isFinite(Number(v)) ? "—" : `$${Number(v).toFixed(2)}`);
const norm = (s) => String(s || "").trim().toLowerCase().slice(0, 40);

function wantedFor(item, quantities) {
  const q = (quantities || []).find((x) =>
    norm(x.name) && norm(item.name).startsWith(norm(x.name).slice(0, 26))
    && (!x.variant || !item.variant || norm(x.variant) === norm(item.variant)));
  const n = Number(q?.wanted);
  return Number.isFinite(n) && n > 0 ? n : Number(item.quantity) || 1;
}

function ago(iso) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `قبل ${m} دقيقة`;
  if (m < 1440) return `قبل ${Math.round(m / 60)} ساعة`;
  return `قبل ${Math.round(m / 1440)} يوم`;
}

export default function CartDetails({ order, onImage }) {
  const pb = order.price_breakdown || {};
  const [fresh, setFresh] = useState(null);       // details just read for an older order
  const [reading, setReading] = useState("");     // progress text while re-reading
  const d = fresh || pb.details || null;
  const items = d?.items || [];
  const key = `adm_cart_ticks_${order.id}`;
  // The admin list renders after the client-side auth guard, so storage is available here.
  const [ticks, setTicks] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } });
  const [copied, setCopied] = useState("");
  const tick = (i) => setTicks((t) => {
    const n = { ...t, [i]: !t[i] };
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* fine */ }
    return n;
  });
  // Older order → read the cart now (≈3–4 min) and save its contents; the price is not changed.
  const readNow = async () => {
    setReading("بدأت القراءة… (3–4 دقايق)");
    try {
      const r = await adminFetch("/api/admin/order-details", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: order.id }) });
      const j = await r.json();
      if (!j.jobId) { setReading(`تعذّر: ${j.error || "خطأ"}`); return; }
      const t0 = Date.now();
      for (;;) {
        await new Promise((res) => setTimeout(res, 8000));
        const p = await (await adminFetch(`/api/admin/order-details?id=${order.id}&job=${encodeURIComponent(j.jobId)}`)).json();
        if (p.status === "done") { setFresh(p.details); setReading(""); return; }
        if (p.success === false) { setReading(`تعذّرت القراءة: ${p.error || ""}`); return; }
        setReading(`جاري قراءة السلة… ${Math.round((Date.now() - t0) / 1000)} ثانية`);
        if (Date.now() - t0 > 7 * 60000) { setReading("طوّلت — حاول مرة ثانية بعد شوية."); return; }
      }
    } catch (e) { setReading(`تعذّر: ${e.message}`); }
  };

  const copy = async (text, tag) => {
    try { await navigator.clipboard.writeText(text); setCopied(tag); setTimeout(() => setCopied(""), 1400); } catch { /* ignore */ }
  };

  const rows = items.map((it) => ({ ...it, buy: wantedFor(it, pb.quantities) }));
  const pieces = rows.reduce((a, r) => a + r.buy, 0);
  const linesUsd = rows.reduce((a, r) => a + (Number(r.unitSaleUsd ?? r.unitRetailUsd) || 0) * r.buy, 0);
  const done = rows.filter((_, i) => ticks[i]).length;

  const shoppingList = [
    `طلب #${order.id.slice(0, 8)} — ${order.name || ""}`,
    d?.accountLabel || d?.account ? `حساب القياس: ${d.accountLabel || d.account}` : null,
    order.cart_link ? `السلة: ${order.cart_link}` : null,
    "",
    ...rows.map((r, i) => `${i + 1}) ${r.name}${r.variant ? ` | ${r.variant}` : ""} × ${r.buy}  (${money(r.unitSaleUsd ?? r.unitRetailUsd)})`),
    "",
    `المجموع: ${rows.length} صنف / ${pieces} قطعة — سعر القياس ${money(order.price)}`,
  ].filter((x) => x !== null).join("\n");

  const box = { border: `1px solid ${LINE}`, borderRadius: 13, overflow: "hidden" };

  return (
    <div style={box}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: CHIP }}>
        <Icon path={I.cart} size={16} color={PRIMARY} />
        <strong style={{ fontSize: 13.5, flex: 1 }}>محتويات السلة للشراء</strong>
        {rows.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, color: done === rows.length ? "var(--t-green-ink)" : MUTED }}>
            {done}/{rows.length} {done === rows.length ? "✓ كلها أُضيفت" : "أُضيفت"}
          </span>
        )}
      </div>

      {/* who priced it */}
      <div style={{ padding: "9px 13px", borderBottom: `1px solid ${LINE}`, fontSize: 12.5, lineHeight: 1.9, color: MUTED }}>
        {d ? (
          <>
            <div>
              <Icon path={I.user} size={13} style={{ verticalAlign: -2 }} /> قِيس السعر من حساب شي إن:{" "}
              <strong style={{ color: INK }}>{d.accountLabel || d.account || "غير مسجّل"}</strong>
              {d.accountLabel && d.account ? <span style={{ color: FAINT }}> ({d.account})</span> : null}
            </div>
            <div>
              <Icon path={I.clock} size={13} style={{ verticalAlign: -2 }} /> وقت القياس: {new Date(d.checkedAt).toLocaleString("ar-LY", { dateStyle: "medium", timeStyle: "short" })}
              <span style={{ color: FAINT }}> · {ago(d.checkedAt)}</span>
            </div>
            <div style={{ color: FAINT }}>اشترِ من نفس الحساب والعنوان (دبي) ليطابق السعر والشحن ما قيس. أسعار شي إن تتغيّر — قارن بالإجمالي قبل الدفع.</div>
          </>
        ) : (
          <div>
            <span style={{ color: "var(--t-amber-ink)" }}>⚠️ هذا الطلب قبل حفظ تفاصيل السلة — الأصناف غير محفوظة.</span>
            <button onClick={readNow} disabled={!!reading && !reading.startsWith("تعذّر") && !reading.startsWith("طوّلت")}
              style={{ display: "block", marginTop: 7, width: "100%", padding: "10px 12px", borderRadius: 11, border: "none", background: PRIMARY, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800, opacity: reading && !reading.startsWith("تعذّر") ? 0.7 : 1 }}>
              {reading || "اقرأ تفاصيل السلة الآن"}
            </button>
            <span style={{ fontSize: 11.5, color: FAINT }}>يقرأ السلة من شي إن بالكميات المطلوبة ويحفظ الأصناف بصورها — سعر الطلب ما يتغيّرش.</span>
          </div>
        )}
      </div>

      {d && d.itemsComplete === false && (
        <div style={{ padding: "9px 13px", background: "var(--t-red-bg, #fee2e2)", color: "var(--t-red-ink, #b91c1c)", fontSize: 12.5, fontWeight: 700 }}>
          ⚠️ القائمة ناقصة: السلة أعلنت {d.itemCount} صنف وقُرئ {rows.length} فقط — راجع الأصناف الباقية من رابط السلة.
        </div>
      )}

      {/* lines */}
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 13px", borderBottom: `1px solid ${LINE}`, alignItems: "flex-start", opacity: ticks[i] ? 0.55 : 1 }}>
          <button onClick={() => tick(i)} title="تمت إضافته لسلة الشراء"
            style={{ width: 24, height: 24, marginTop: 2, borderRadius: 7, flexShrink: 0, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1.5px solid ${ticks[i] ? "var(--t-green-ink)" : LINE}`, background: ticks[i] ? "var(--t-green-ink)" : "transparent" }}>
            {ticks[i] && <Icon path={I.check} size={14} color="#fff" stroke={2.8} />}
          </button>
          {r.image ? (
            <img src={r.image} alt="" onClick={() => onImage?.(r.image)}
              style={{ width: 58, height: 58, borderRadius: 10, objectFit: "cover", flexShrink: 0, cursor: "zoom-in", background: CHIP }} />
          ) : (
            <span style={{ width: 58, height: 58, borderRadius: 10, background: CHIP, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.8, fontWeight: 700, lineHeight: 1.5, color: INK, textDecoration: ticks[i] ? "line-through" : "none",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} dir="ltr">{r.name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5, alignItems: "center" }}>
              {r.variant && (
                <span dir="ltr" style={{ fontSize: 12, fontWeight: 800, background: "var(--t-amber-bg)", color: "var(--t-amber-ink)", borderRadius: 8, padding: "2px 8px" }}>{r.variant}</span>
              )}
              {r.seller && <span style={{ fontSize: 11.5, color: FAINT }}>البائع: {r.seller}</span>}
              <button onClick={() => copy(r.name, `n${i}`)} style={{ fontSize: 11.5, color: PRIMARY, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontWeight: 700 }}>
                {copied === `n${i}` ? "✓ نُسخ" : "نسخ الاسم"}
              </button>
            </div>
          </div>
          <div style={{ textAlign: "end", flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: r.buy > 1 ? PRIMARY : INK }}>× {r.buy}</div>
            <div style={{ fontSize: 12.5, fontWeight: 800 }}>{money(r.unitSaleUsd ?? r.unitRetailUsd)}</div>
            {r.unitRetailUsd != null && r.unitSaleUsd != null && r.unitRetailUsd > r.unitSaleUsd && (
              <div style={{ fontSize: 11, color: FAINT, textDecoration: "line-through" }}>{money(r.unitRetailUsd)}</div>
            )}
          </div>
        </div>
      ))}

      {/* SHEIN's totals as measured */}
      {d && (
        <div style={{ padding: "9px 13px", fontSize: 12.5, lineHeight: 1.9, color: MUTED, borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>{rows.length} صنف · {pieces} قطعة · مجموع الأسطر</span><strong style={{ color: INK }}>{money(linesUsd)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Retail / الشحن / العروض</span><span dir="ltr">{money(pb.retailUsd)} + {money(pb.shippingUsd)} − {money(Math.abs(Number(pb.promotionsUsd) || 0))}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>سعر القياس المعتمد (بدون كوبون)</span><strong style={{ color: INK }}>{money(order.price)}</strong></div>
          {d.remeasuredUsd != null && Math.abs(Number(d.remeasuredUsd) - Number(order.price)) > 0.01 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: Number(d.remeasuredUsd) > Number(order.price) ? "var(--t-red-ink, #b91c1c)" : "var(--t-green-ink)", fontWeight: 800 }}>
              <span>⚠️ السعر عند إعادة القراءة</span><span>{money(d.remeasuredUsd)}</span>
            </div>
          )}
          {pb.orderTotalUsd != null && (
            <div style={{ display: "flex", justifyContent: "space-between", color: FAINT }}><span>إجمالي شي إن مع الكوبون {money(pb.couponUsd)}</span><span>{money(pb.orderTotalUsd)}</span></div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: 10, flexWrap: "wrap" }}>
        {rows.length > 0 && (
          <button onClick={() => copy(shoppingList, "list")}
            style={{ flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 11, border: `1px solid ${LINE}`, background: CHIP, color: INK, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800 }}>
            {copied === "list" ? "✓ نُسخت القائمة" : "نسخ قائمة الشراء"}
          </button>
        )}
        {rows.length > 0 && done > 0 && (
          <button onClick={() => { setTicks({}); try { localStorage.removeItem(key); } catch { /* fine */ } }}
            style={{ padding: "10px 12px", borderRadius: 11, border: `1px solid ${LINE}`, background: "none", color: MUTED, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5 }}>
            مسح العلامات
          </button>
        )}
      </div>
    </div>
  );
}
