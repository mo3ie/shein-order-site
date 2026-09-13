"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Price diagnostics.
 *
 * The storefront shows one number in dinars on purpose. When that number looks
 * wrong, this is where it gets checked: SHEIN's own lines, which account read
 * them, where the time went, and the item list the quantity controls are built
 * from. Everything here is read-only — it prices carts, it never orders.
 */
const RATE_FALLBACK = 9.5;
const COMMISSION = 0.01;

export default function PriceTestPage() {
  const [token, setToken]   = useState(null);
  const [denied, setDenied] = useState(false);
  const [rate, setRate]     = useState(RATE_FALLBACK);

  const [url, setUrl]       = useState("");
  const [noCache, setNoCache] = useState(true);
  const [busy, setBusy]     = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError]   = useState("");
  const [result, setResult] = useState(null);
  const [qty, setQty]       = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data?.session?.access_token;
      if (!t) { setDenied(true); return; }
      setToken(t);
    });
    supabase.from("settings").select("exchange_rate").eq("id", 1).single()
      .then(({ data }) => { if (data?.exchange_rate) setRate(Number(data.exchange_rate)); });
  }, []);

  async function run(withQuantities) {
    const link = url.trim();
    if (!link || busy) return;
    setBusy(true); setError(""); setResult(null); setElapsed(0);

    const started = Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);

    try {
      const quantities = withQuantities
        ? (result?.items || []).map((it, i) => ({
            name: it.name, variant: it.variant,
            shared: it.quantity || 1,
            wanted: Number(qty[i] ?? it.quantity ?? 1),
          }))
        : null;

      const res = await fetch("/api/admin/price-test", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: link, quantities, noCache }),
      });
      const started_ = await res.json();
      if (!started_.success) { setError(started_.error || "تعذّر بدء القياس"); return; }

      for (;;) {
        await new Promise((r) => setTimeout(r, 4000));
        const p = await fetch(`/api/admin/price-test?job=${encodeURIComponent(started_.jobId)}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const pd = await p.json();
        if (pd.status === "pending") continue;
        if (!pd.success) { setError(`${pd.code || "خطأ"} — ${pd.error || ""}`); return; }

        const raw = pd.raw || {};
        const shaped = {
          price: raw.selected?.priceUsd ?? null,
          account: raw.selected?.accountId ?? null,
          source: raw.selected?.priceSource ?? null,
          breakdown: raw.breakdown || null,
          appTotal: raw.appTotalUsd ?? null,
          itemCount: raw.itemCount ?? null,
          items: raw.items || [],
          phases: raw.accounts?.[0]?.phaseMs || {},
          applied: raw.quantitiesApplied || [],
          shot: raw.screenshotBase64 ? `data:image/png;base64,${raw.screenshotBase64}` : null,
          cacheHit: !!raw.cacheHit,
          elapsedMs: Date.now() - started,
          at: new Date(),
          withQuantities: !!withQuantities,
        };
        setResult(shaped);
        if (!withQuantities) {
          setQty(Object.fromEntries((shaped.items || []).map((it, i) => [i, it.quantity || 1])));
        }
        setHistory((h) => [shaped, ...h].slice(0, 8));
        return;
      }
    } catch (e) {
      setError(e.message || "تعذّر الاتصال");
    } finally {
      clearInterval(tick);
      setBusy(false);
    }
  }

  if (denied) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <h1 style={S.h1}>تشخيص الأسعار</h1>
          <p style={S.muted}>سجّل الدخول بحساب مشرف لعرض هذه الصفحة.</p>
        </div>
      </main>
    );
  }

  const b = result?.breakdown;
  const lyd = (usd) => (Number(usd || 0) * (1 + COMMISSION) * rate);

  return (
    <main style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>🔍 تشخيص أسعار السلال</h1>
        <p style={S.muted}>
          يعرض أسطر شي إن نفسها، والحساب الذي قرأها، وأين ذهب الوقت. للقراءة فقط — لا ينشئ طلباً.
        </p>

        <input
          placeholder="https://onelink.shein.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={S.input}
          dir="ltr"
        />

        <label style={S.check}>
          <input type="checkbox" checked={noCache} onChange={(e) => setNoCache(e.target.checked)} />
          تجاهل الـ cache (قياس جديد دائماً)
        </label>

        <button onClick={() => run(false)} disabled={busy || !url.trim()} style={S.btn(busy || !url.trim())}>
          {busy ? `⏳ جاري القياس... ${elapsed} ثانية` : "قِس السلة"}
        </button>

        {error && <div style={S.err}>❌ {error}</div>}
      </div>

      {result && (
        <div style={S.card}>
          <div style={S.rowBetween}>
            <h2 style={S.h2}>النتيجة</h2>
            <span style={S.tag}>
              {result.cacheHit ? "من الـ cache" : `قياس حي — ${Math.round(result.elapsedMs / 1000)} ثانية`}
            </span>
          </div>

          <div style={S.grid}>
            <Cell label="الحساب المستخدم" value={result.account || "—"} mono />
            <Cell label="عدد الأصناف" value={result.itemCount ?? "—"} />
            <Cell label="مصدر السعر" value={result.source || "—"} mono small />
            <Cell label="الكميات المضبوطة"
                  value={result.applied.length ? result.applied.map((a) => `${a.name.slice(0, 14)}×${a.quantity}`).join("، ") : "لا شيء"} />
          </div>

          {b && (
            <table style={S.table}>
              <tbody>
                <Line k="Retail Price" v={b.retailUsd} />
                <Line k="Shipping Fee" v={b.shippingUsd} zero="مجاني" />
                <Line k="Promotions" v={b.promotionsUsd} good />
                <Line k="Coupon (غير محسوب)" v={b.couponUsd} muted />
                <tr style={S.sep}><td colSpan={2} /></tr>
                <tr>
                  <td style={S.kStrong}>السعر (retail + shipping − promotions)</td>
                  <td style={S.vStrong}>${Number(result.price || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={S.k}>+ عمولة 1% × سعر الصرف {rate}</td>
                  <td style={S.v}>{lyd(result.price).toFixed(2)} د.ل</td>
                </tr>
                {result.appTotal != null && (
                  <tr>
                    <td style={S.kMuted}>إجمالي التطبيق (بالكوبون، للمقارنة)</td>
                    <td style={S.vMuted}>${Number(result.appTotal).toFixed(2)}</td>
                  </tr>
                )}
                {b.orderTotalUsd != null && (
                  <tr>
                    <td style={S.kMuted}>Order Total في شي إن</td>
                    <td style={S.vMuted}>${Number(b.orderTotalUsd).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* The sum is worth showing: when it does not match Retail, an item
              was misread — which is exactly how a banner once became a line. */}
          {result.items.length > 0 && (
            <>
              <h3 style={S.h3}>
                الأصناف ({result.items.length})
                {b?.retailUsd != null && (
                  <span style={S.sumNote}>
                    {" "}— مجموع أسعار الوحدات ${result.items.reduce((a, i) => a + Number(i.unitRetailUsd || 0) * Number(qty[result.items.indexOf(i)] ?? i.quantity ?? 1), 0).toFixed(2)}
                    {" · "}Retail ${Number(b.retailUsd).toFixed(2)}
                  </span>
                )}
              </h3>
              {result.items.map((it, i) => (
                <div key={i} style={S.item}>
                  {it.image
                    ? <img src={it.image} alt="" style={S.thumb} />
                    : <div style={{ ...S.thumb, background: "#1a1a2e" }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.itemName}>{it.name}</div>
                    <div style={S.itemMeta}>
                      {it.variant || "—"} · ${Number(it.unitRetailUsd || 0).toFixed(2)}
                      {it.unitSaleUsd != null && it.unitSaleUsd !== it.unitRetailUsd
                        && ` (بالكوبون $${Number(it.unitSaleUsd).toFixed(2)})`}
                    </div>
                  </div>
                  <div style={S.qtyBox}>
                    <button style={S.qBtn} onClick={() => setQty((q) => ({ ...q, [i]: Math.min(20, Number(q[i] ?? 1) + 1) }))}>+</button>
                    <span style={S.qVal}>{qty[i] ?? it.quantity ?? 1}</span>
                    <button style={S.qBtn} onClick={() => setQty((q) => ({ ...q, [i]: Math.max(1, Number(q[i] ?? 1) - 1) }))}>−</button>
                  </div>
                </div>
              ))}
              <button onClick={() => run(true)} disabled={busy} style={S.btn(busy)}>
                {busy ? `⏳ جاري إعادة القياس... ${elapsed} ثانية` : "أعد القياس بهذه الكميات"}
              </button>
            </>
          )}

          {/* The screen the price was read off. When a number is disputed this
              settles it faster than any table. */}
          {result.shot && (
            <>
              <h3 style={S.h3}>لقطة السلة كما عرضها التطبيق</h3>
              <a href={result.shot} target="_blank" rel="noreferrer">
                <img src={result.shot} alt="" style={S.shot} />
              </a>
            </>
          )}

          {Object.keys(result.phases || {}).length > 0 && (
            <>
              <h3 style={S.h3}>الزمن</h3>
              <div style={S.phases}>
                {Object.entries(result.phases).map(([k, v]) => (
                  <span key={k} style={S.phase}>{k} <strong>{(v / 1000).toFixed(1)}s</strong></span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {history.length > 1 && (
        <div style={S.card}>
          <h2 style={S.h2}>قياسات هذه الجلسة</h2>
          {history.map((h, i) => (
            <div key={i} style={S.histRow}>
              <span style={S.histTime}>{h.at.toLocaleTimeString("ar-LY")}</span>
              <span style={S.tagSmall}>{h.account?.split(":").pop() || "—"}</span>
              <span>{h.withQuantities ? "بكميات" : "أساسي"}</span>
              <strong style={{ marginInlineStart: "auto" }}>${Number(h.price || 0).toFixed(2)}</strong>
              <span style={S.histLyd}>{lyd(h.price).toFixed(0)} د.ل</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Cell({ label, value, mono, small }) {
  return (
    <div style={S.cell}>
      <div style={S.cellLabel}>{label}</div>
      <div style={{ ...S.cellValue, ...(mono ? { fontFamily: "monospace" } : {}), ...(small ? { fontSize: 12 } : {}) }}>
        {value}
      </div>
    </div>
  );
}

function Line({ k, v, good, muted, zero }) {
  const n = Number(v || 0);
  return (
    <tr>
      <td style={muted ? S.kMuted : S.k}>{k}</td>
      <td style={{ ...(muted ? S.vMuted : S.v), ...(good ? { color: "#4ade80" } : {}) }}>
        {zero && n === 0 ? zero : `$${n.toFixed(2)}`}
      </td>
    </tr>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#0b0b14", color: "#e5e7eb", padding: 16,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", direction: "rtl" },
  card: { maxWidth: 720, margin: "0 auto 14px", background: "#13131f",
          border: "1px solid #2a2a3a", borderRadius: 14, padding: 16 },
  h1: { fontSize: 19, margin: "0 0 6px" },
  h2: { fontSize: 15, margin: "0 0 10px" },
  h3: { fontSize: 14, margin: "16px 0 8px", color: "#c7c9d1" },
  muted: { fontSize: 12.5, color: "#8b8f9c", lineHeight: 1.8, margin: "0 0 12px" },
  input: { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid #2a2a3a",
           background: "#0f0f18", color: "#e5e7eb", fontSize: 13, marginBottom: 10, fontFamily: "inherit" },
  check: { display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#9aa0aa", marginBottom: 12 },
  btn: (off) => ({ width: "100%", padding: "11px 14px", borderRadius: 10, border: "none",
                   background: off ? "#2a2a3a" : "#6d28d9", color: off ? "#6b7280" : "#fff",
                   fontSize: 13.5, fontWeight: 700, cursor: off ? "not-allowed" : "pointer",
                   fontFamily: "inherit", marginTop: 10 }),
  err: { marginTop: 10, padding: "9px 12px", borderRadius: 10, background: "#2a1414",
         border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 12.5 },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  tag: { fontSize: 11.5, color: "#8b8f9c", background: "#0f0f18", border: "1px solid #2a2a3a",
         borderRadius: 20, padding: "3px 10px" },
  tagSmall: { fontSize: 11, fontFamily: "monospace", color: "#a78bfa" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 0" },
  cell: { background: "#0f0f18", border: "1px solid #2a2a3a", borderRadius: 10, padding: "9px 11px" },
  cellLabel: { fontSize: 11, color: "#6b7280", marginBottom: 3 },
  cellValue: { fontSize: 13, fontWeight: 600, wordBreak: "break-word" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 6 },
  k: { padding: "6px 0", fontSize: 13, color: "#c7c9d1" },
  v: { padding: "6px 0", fontSize: 13, textAlign: "left", fontFamily: "monospace" },
  kStrong: { padding: "8px 0", fontSize: 13.5, fontWeight: 800 },
  vStrong: { padding: "8px 0", fontSize: 15, fontWeight: 800, textAlign: "left", fontFamily: "monospace" },
  kMuted: { padding: "6px 0", fontSize: 12.5, color: "#6b7280" },
  vMuted: { padding: "6px 0", fontSize: 12.5, color: "#6b7280", textAlign: "left", fontFamily: "monospace" },
  sep: { borderTop: "1px solid #2a2a3a" },
  sumNote: { fontSize: 11.5, color: "#8b8f9c", fontWeight: 400 },
  item: { display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderTop: "1px solid #1e1e2c" },
  thumb: { width: 46, height: 46, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid #2a2a3a" },
  itemName: { fontSize: 12.5, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  itemMeta: { fontSize: 11.5, color: "#8b8f9c", marginTop: 3 },
  qtyBox: { display: "flex", alignItems: "center", gap: 5, flexShrink: 0 },
  qBtn: { width: 26, height: 26, borderRadius: 7, border: "1px solid #2a2a3a", background: "#0f0f18",
          color: "#e5e7eb", fontSize: 15, lineHeight: 1, cursor: "pointer", padding: 0, fontFamily: "inherit" },
  qVal: { minWidth: 18, textAlign: "center", fontWeight: 700, fontSize: 13 },
  shot: { width: "100%", maxWidth: 300, borderRadius: 10, border: "1px solid #2a2a3a",
          display: "block", cursor: "zoom-in" },
  phases: { display: "flex", flexWrap: "wrap", gap: 6 },
  phase: { fontSize: 11.5, background: "#0f0f18", border: "1px solid #2a2a3a",
           borderRadius: 8, padding: "4px 9px", color: "#9aa0aa" },
  histRow: { display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
             borderTop: "1px solid #1e1e2c", fontSize: 12.5 },
  histTime: { color: "#6b7280", fontFamily: "monospace", fontSize: 11.5 },
  histLyd: { color: "#8b8f9c", minWidth: 78, textAlign: "left" },
};
