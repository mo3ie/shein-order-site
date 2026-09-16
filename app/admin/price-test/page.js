"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminShell from "@/app/components/AdminShell";

/**
 * Price diagnostics.
 *
 * The storefront shows one number in dinars on purpose. When that number looks
 * wrong, this is where it gets checked: SHEIN's own lines, which account read
 * them, where the time went, and the item list the quantity controls are built
 * from. Everything here is read-only — it prices carts, it never orders.
 */
const RATE_FALLBACK = 9.5;
// العمولة تُقرأ من الإعدادات كبقية الموقع، فالتشخيص يطابق ما يراه الزبون.
const COMMISSION_FALLBACK = 0.01;

export default function PriceTestPage() {
  const [token, setToken]   = useState(null);
  const [denied, setDenied] = useState(false);
  const [rate, setRate]     = useState(RATE_FALLBACK);
  const [commission, setCommission] = useState(COMMISSION_FALLBACK);

  const [url, setUrl]       = useState("");
  const [noCache, setNoCache] = useState(true);
  const [busy, setBusy]     = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError]   = useState("");
  const [result, setResult] = useState(null);
  const [qty, setQty]       = useState({});
  const [history, setHistory] = useState([]);
  const [baseline, setBaseline] = useState(null);   // the one-of-each measurement
  // حالة خدمة التسعير: "غير متاحة" للزبون قد تعني الخدمة أو النفق أو المتصفح
  // داخلها — هذا يقول أيّها.
  const [health, setHealth] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data?.session?.access_token;
      if (!t) { setDenied(true); return; }
      setToken(t);
    });
    supabase.from("settings").select("*").eq("id", 1).single()
      .then(({ data }) => {
        if (data?.exchange_rate) setRate(Number(data.exchange_rate));
        if (data?.profit_rate != null) setCommission(Number(data.profit_rate) / 100);
      });
  }, []);

  const checkHealth = async (tok) => {
    const use = tok || token;
    if (!use) return;
    setHealth({ checking: true });
    try {
      const r = await fetch("/api/admin/resolver-health", { headers: { authorization: `Bearer ${use}` } });
      setHealth(await r.json());
    } catch (e) {
      setHealth({ ok: false, detail: { error: e.message } });
    }
  };

  useEffect(() => { if (token) checkHealth(token); }, [token]);

  async function run(withQuantities) {
    const link = url.trim();
    if (!link || busy) return;
    // Keep the previous result on screen while re-measuring. Clearing it made
    // the item list and quantities vanish, which read as "it started over".
    setBusy(true); setError(""); setElapsed(0);
    if (!withQuantities) { setResult(null); setBaseline(null); }

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
          setBaseline(shaped);
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
      <AdminShell title="تشخيص الأسعار">
        <div style={S.card}>
          <p style={S.muted}>سجّل الدخول بحساب مشرف لعرض هذه الصفحة.</p>
        </div>
      </AdminShell>
    );
  }

  const b = result?.breakdown;
  const lyd = (usd) => (Number(usd || 0) * (1 + commission) * rate);

  // The estimate the storefront would have shown: the baseline price plus each
  // extra unit at its own retail price.
  const estimate = (baseline?.price || 0) + (result?.items || []).reduce((sum, it, i) => {
    const extra = Math.max(0, Number(qty[i] ?? it.quantity ?? 1) - (it.quantity || 1));
    return sum + extra * Number(it.unitRetailUsd || 0);
  }, 0);
  const diff = Number(result?.price || 0) - estimate;

  return (
    <AdminShell role="admin" title="تشخيص الأسعار" subtitle="أسطر شي إن نفسها، والحساب الذي قرأها، وأين ذهب الوقت — للقراءة فقط." width={880}>
      {/* حقل الرابط بعنوانه: بعد نقل العنوان إلى إطار اللوحة بقي الحقل يطفو
          وحده في أعلى البطاقة بلا ما يعرّفه، فبدا في غير مكانه. */}
      {/* حالة الخدمة قبل أي قياس: الزبون يرى "خدمة التسعير غير متاحة" ولا يعرف
          أحد أين انقطع الخيط — الخدمة، أم النفق الذي يوصلها، أم المتصفح داخلها.
          هذا السطر يقول أيّها، ويُعاد فحصه بضغطة. */}
      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{
          width: 11, height: 11, borderRadius: "50%", flexShrink: 0,
          background: health?.checking ? "var(--t-amber-ink)" : health?.ok ? "var(--t-green-ink)" : "var(--t-red-ink)",
        }} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            {health?.checking ? "جاري فحص خدمة التسعير..."
              : health?.ok ? "خدمة التسعير تعمل"
              : "خدمة التسعير لا تستجيب"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t-faint)", marginTop: 3, lineHeight: 1.8 }}>
            {health?.checking ? "…"
              : health?.ok
                ? `استجابت في ${health.latencyMs}ms · المتصفح ${health.detail?.browser ? "جاهز" : "غير جاهز"}`
                : health
                  ? `HTTP ${health.httpStatus || "—"} · ${health.detail?.error || health.detail?.raw || "لا استجابة"}`
                  : "—"}
          </div>
        </div>
        <button onClick={() => checkHealth()} style={{ ...S.btn(false), width: "auto", padding: "10px 16px", marginTop: 0 }}>
          إعادة الفحص
        </button>
      </div>

      <div style={S.card}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
          رابط السلة المشتركة
        </label>
        <input
          placeholder="https://onelink.shein.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && url.trim() && run(false)}
          style={{ ...S.input, marginBottom: 12, textAlign: "left" }}
          dir="ltr"
        />

        <label style={S.check}>
          <input type="checkbox" checked={noCache} onChange={(e) => setNoCache(e.target.checked)} />
          تجاهل الـ cache (قياس جديد دائماً)
        </label>

        <button onClick={() => run(false)} disabled={busy || !url.trim()} style={S.btn(busy || !url.trim())}>
          {busy ? `جاري القياس · ${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}` : "قِس السلة"}
        </button>

        {error && <div style={S.err}>{error}</div>}
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
                  <td style={S.k}>+ عمولة {(commission * 100).toFixed(1)}% × سعر الصرف {rate}</td>
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

          {/* How the two numbers are reached, side by side. The estimate is
              arithmetic we do; the real price is what SHEIN charged once the
              quantities were actually set in its cart. Showing the workings is
              the whole point of this page. */}
          {result.withQuantities && baseline && (
            <>
              <h3 style={S.h3}>كيف حُسب السعران</h3>
              <table style={S.table}>
                <tbody>
                  <tr><td style={S.kMuted} colSpan={2}>التقديري (حساب الموقع، فوري)</td></tr>
                  <tr>
                    <td style={S.k}>سعر السلة الأساسي</td>
                    <td style={S.v}>${Number(baseline.price || 0).toFixed(2)}</td>
                  </tr>
                  {(result.items || []).map((it, i) => {
                    const want = Number(qty[i] ?? it.quantity ?? 1);
                    const extra = Math.max(0, want - (it.quantity || 1));
                    if (!extra) return null;
                    const unit = Number(it.unitRetailUsd || 0);
                    return (
                      <tr key={i}>
                        <td style={S.k}>+ {extra} × ${unit.toFixed(2)} — {it.name.slice(0, 24)}</td>
                        <td style={S.v}>${(extra * unit).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={S.kStrong}>= التقديري</td>
                    <td style={S.vStrong}>${estimate.toFixed(2)}</td>
                  </tr>
                  <tr><td style={S.k}>بالدينار</td><td style={S.v}>{lyd(estimate).toFixed(2)} د.ل</td></tr>

                  <tr style={S.sep}><td colSpan={2} /></tr>
                  <tr><td style={S.kMuted} colSpan={2}>الحقيقي (من شي إن بعد ضبط الكميات)</td></tr>
                  <tr>
                    <td style={S.k}>Retail {Number(baseline.breakdown?.retailUsd || 0).toFixed(2)} → {Number(b?.retailUsd || 0).toFixed(2)}</td>
                    <td style={S.v}>+${(Number(b?.retailUsd || 0) - Number(baseline.breakdown?.retailUsd || 0)).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={S.k}>Promotions {Number(baseline.breakdown?.promotionsUsd || 0).toFixed(2)} → {Number(b?.promotionsUsd || 0).toFixed(2)}</td>
                    <td style={{ ...S.v, color: "var(--t-green-ink)" }}>
                      {(Number(b?.promotionsUsd || 0) - Number(baseline.breakdown?.promotionsUsd || 0)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={S.k}>Shipping {Number(baseline.breakdown?.shippingUsd || 0).toFixed(2)} → {Number(b?.shippingUsd || 0).toFixed(2)}</td>
                    <td style={S.v}>{(Number(b?.shippingUsd || 0) - Number(baseline.breakdown?.shippingUsd || 0)).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={S.kStrong}>= الحقيقي</td>
                    <td style={S.vStrong}>${Number(result.price || 0).toFixed(2)}</td>
                  </tr>
                  <tr><td style={S.k}>بالدينار</td><td style={S.v}>{lyd(result.price).toFixed(2)} د.ل</td></tr>

                  <tr style={S.sep}><td colSpan={2} /></tr>
                  <tr>
                    <td style={S.kStrong}>الفرق</td>
                    <td style={{ ...S.vStrong, color: diff > 0 ? "var(--t-red-ink)" : "var(--t-green-ink)" }}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(2)} $ &nbsp;({diff > 0 ? "+" : ""}{(lyd(result.price) - lyd(estimate)).toFixed(0)} د.ل)
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={S.note}>
                الفرق يأتي من شي إن وحدها: العروض قد تكبر مع الكمية، والسلة الأكبر قد تعبر
                عتبة الشحن المجاني. لذلك الحقيقي أحياناً أقل من التقديري وأحياناً أعلى.
              </p>
            </>
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
                    : <div style={{ ...S.thumb, background: "var(--t-line)" }} />}
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
                {busy ? `جاري إعادة القياس · ${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}` : "أعد القياس بهذه الكميات"}
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
    </AdminShell>
  );
}

function Cell({ label, value, mono, small }) {
  return (
    <div style={S.cell}>
      <div style={S.cellLabel}>{label}</div>
      <div style={{ ...S.cellValue, ...(mono ? { fontFamily: "monospace" } : {}), ...(small ? { fontSize: 13.5 } : {}) }}>
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
      <td style={{ ...(muted ? S.vMuted : S.v), ...(good ? { color: "var(--t-green-ink)" } : {}) }}>
        {zero && n === 0 ? zero : `$${n.toFixed(2)}`}
      </td>
    </tr>
  );
}

const S = {
  page: { minHeight: "100vh", background: "var(--t-page)", color: "var(--t-ink)", padding: 16,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", direction: "rtl" },
  // البطاقة تملأ عرض إطار اللوحة: عرض ثابت 720 داخل حاوية 880 كان يترك
  // البطاقة وحقلها منزاحين عن بقية الصفحة.
  card: { margin: "0 0 14px", background: "var(--t-card)",
          boxShadow: "0 2px 10px rgba(22,19,31,0.05)", borderRadius: 18, padding: 18 },
  h1: { fontSize: 20.5, margin: "0 0 6px" },
  h2: { fontSize: 16.5, margin: "0 0 10px" },
  h3: { fontSize: 15.5, margin: "16px 0 8px", color: "var(--t-muted)" },
  muted: { fontSize: 14, color: "var(--t-faint)", lineHeight: 1.8, margin: "0 0 12px" },
  input: { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid var(--t-line)",
           background: "var(--t-chip)", color: "var(--t-ink)", fontSize: 14.5, marginBottom: 10, fontFamily: "inherit" },
  check: { display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--t-muted)", marginBottom: 12 },
  btn: (off) => ({ width: "100%", padding: "11px 14px", borderRadius: 10, border: "none",
                   background: off ? "var(--t-line)" : "#7c3aed", color: off ? "var(--t-faint)" : "#fff",
                   fontSize: 15, fontWeight: 700, cursor: off ? "not-allowed" : "pointer",
                   fontFamily: "inherit", marginTop: 10 }),
  err: { marginTop: 10, padding: "9px 12px", borderRadius: 10, background: "var(--t-red-bg)",
         border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", fontSize: 14 },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  tag: { fontSize: 13, color: "var(--t-faint)", background: "var(--t-chip)", border: "1px solid var(--t-line)",
         borderRadius: 20, padding: "3px 10px" },
  tagSmall: { fontSize: 12.5, fontFamily: "monospace", color: "#7c3aed" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 0" },
  cell: { background: "var(--t-chip)", border: "1px solid var(--t-line)", borderRadius: 10, padding: "9px 11px" },
  cellLabel: { fontSize: 12.5, color: "var(--t-faint)", marginBottom: 3 },
  cellValue: { fontSize: 14.5, fontWeight: 600, wordBreak: "break-word" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 6 },
  k: { padding: "6px 0", fontSize: 14.5, color: "var(--t-muted)" },
  v: { padding: "6px 0", fontSize: 14.5, textAlign: "left", fontFamily: "monospace" },
  kStrong: { padding: "8px 0", fontSize: 15, fontWeight: 800 },
  vStrong: { padding: "8px 0", fontSize: 16.5, fontWeight: 800, textAlign: "left", fontFamily: "monospace" },
  kMuted: { padding: "6px 0", fontSize: 14, color: "var(--t-faint)" },
  vMuted: { padding: "6px 0", fontSize: 14, color: "var(--t-faint)", textAlign: "left", fontFamily: "monospace" },
  sep: { borderTop: "1px solid var(--t-line)" },
  sumNote: { fontSize: 13, color: "var(--t-faint)", fontWeight: 400 },
  item: { display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderTop: "1px solid var(--t-line)" },
  thumb: { width: 46, height: 46, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--t-line)" },
  itemName: { fontSize: 14, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  itemMeta: { fontSize: 13, color: "var(--t-faint)", marginTop: 3 },
  qtyBox: { display: "flex", alignItems: "center", gap: 5, flexShrink: 0 },
  qBtn: { width: 26, height: 26, borderRadius: 7, border: "1px solid var(--t-line)", background: "var(--t-chip)",
          color: "var(--t-ink)", fontSize: 16.5, lineHeight: 1, cursor: "pointer", padding: 0, fontFamily: "inherit" },
  qVal: { minWidth: 18, textAlign: "center", fontWeight: 700, fontSize: 14.5 },
  shot: { width: "100%", maxWidth: 300, borderRadius: 10, border: "1px solid var(--t-line)",
          display: "block", cursor: "zoom-in" },
  note: { fontSize: 13, color: "var(--t-faint)", lineHeight: 1.9, margin: "8px 0 0" },
  phases: { display: "flex", flexWrap: "wrap", gap: 6 },
  phase: { fontSize: 13, background: "var(--t-chip)", border: "1px solid var(--t-line)",
           borderRadius: 8, padding: "4px 9px", color: "var(--t-muted)" },
  histRow: { display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
             borderTop: "1px solid var(--t-line)", fontSize: 14 },
  histTime: { color: "var(--t-faint)", fontFamily: "monospace", fontSize: 13 },
  histLyd: { color: "var(--t-faint)", minWidth: 78, textAlign: "left" },
};
