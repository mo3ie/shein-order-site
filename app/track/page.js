"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

const STEPS = [
  { key: "new",       label: "تم الاستلام",    icon: "📥", keys: ["new", "paid", "confirmed"] },
  { key: "ordered",   label: "قيد المعالجة",   icon: "⚙️", keys: ["ordered", "processing"]    },
  { key: "shipped",   label: "في الشحن",       icon: "🚚", keys: ["shipped"]                   },
  { key: "delivered", label: "تم التسليم",     icon: "✅", keys: ["delivered"]                 },
];

function getStep(status) {
  if (!status) return 0;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].keys.includes(status)) return i;
  }
  return 0;
}

function TrackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id     = params.get("id");

  const [order,    setOrder]    = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [copied,   setCopied]   = useState(false);
  const [user,     setUser]     = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed,  setClaimed]  = useState(false);
  const [claimErr, setClaimErr] = useState("");
  const [trackInput, setTrackInput] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem("lastOrderId", id);

    fetch(`/api/order?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.order) setOrder(data.order);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaim = async () => {
    if (!user) {
      sessionStorage.setItem("claimOrderId", id);
      router.push(`/login?next=/track?id=${id}`);
      return;
    }
    setClaiming(true);
    setClaimErr("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/order/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ order_id: id }),
      });
      const result = await res.json();
      if (result.success) setClaimed(true);
      else setClaimErr(result.error || "فشل الربط");
    } catch { setClaimErr("خطأ في الاتصال"); }
    finally { setClaiming(false); }
  };

  const handleSearch = () => {
    if (trackInput.trim()) router.push(`/track?id=${trackInput.trim()}`);
  };

  // ── No ID in URL ─────────────────────────────────────────────────────────
  if (!id) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", marginBottom: 8 }}>تتبع طلبك</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>أدخل رقم الطلب لمتابعة حالته</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="رقم الطلب"
              value={trackInput}
              onChange={e => setTrackInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={styles.input}
            />
            <button onClick={handleSearch} style={styles.btn}>بحث</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!order && !notFound) {
    return (
      <div style={{ ...styles.page, flexDirection: "column", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `4px solid #ede9fe`, borderTopColor: PURPLE, animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#9ca3af", fontSize: 14 }}>جاري تحميل بيانات الطلب...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>الطلب غير موجود</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>تحقق من رقم الطلب وأعد المحاولة</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="رقم طلب آخر"
              value={trackInput}
              onChange={e => setTrackInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={styles.input}
            />
            <button onClick={handleSearch} style={styles.btn}>بحث</button>
          </div>
          <a href="/" style={{ display: "block", marginTop: 14, color: PURPLE, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>← العودة للرئيسية</a>
        </div>
      </div>
    );
  }

  const currentStep = getStep(order.status);
  const alreadyLinked = order.user_id;

  const printDate = order.created_at
    ? new Date(order.created_at).toLocaleString("ar-LY", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop  { from { transform:scale(0.9);opacity:0 } to { transform:scale(1);opacity:1 } }

        /* ── Print styles ── */
        @media print {
          body { margin: 0; background: #fff !important; }
          #screen-content { display: none !important; }
          #print-receipt  { display: block !important; }
          header, nav, footer { display: none !important; }
        }
        @media screen {
          #print-receipt { display: none; }
        }

        /* Receipt internal styles */
        .rc-table td, .rc-table th {
          padding: 7px 12px;
          font-size: 13px;
          border-bottom: 1px solid #e5e7eb;
          text-align: right;
        }
        .rc-table th { font-weight: 600; color: #6b7280; background: #f9fafb; }
        .rc-dots {
          border: none;
          border-top: 2px dashed #d1d5db;
          margin: 14px 0;
        }
      `}</style>

      {/* ════════════════════════════════════════════
          وصل الطباعة — مخفي في الشاشة، ظاهر عند الطباعة
          ════════════════════════════════════════════ */}
      <div id="print-receipt" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", direction: "rtl", maxWidth: 480, margin: "0 auto", padding: "24px 28px", color: "#111", background: "#fff" }}>

        {/* رأس الوصل */}
        <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "3px solid #7c3aed", paddingBottom: 16 }}>
          <img src="/logo.png" alt="Trend Store" style={{ height: 56, objectFit: "contain", marginBottom: 8 }} onError={e => { e.target.style.display = "none"; }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: "#7c3aed", letterSpacing: 1 }}>TREND STORE</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>تريند ستور — طلبات شي إن</div>
        </div>

        {/* عنوان الوصل */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-block", background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 8, padding: "6px 24px" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#7c3aed" }}>وصل حجز طلب</span>
          </div>
        </div>

        {/* تاريخ الإصدار */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>
          <span>تاريخ الإصدار: {new Date().toLocaleDateString("ar-LY", { year:"numeric", month:"long", day:"numeric" })}</span>
          <span>{new Date().toLocaleTimeString("ar-LY", { hour:"2-digit", minute:"2-digit" })}</span>
        </div>

        <hr className="rc-dots" />

        {/* بيانات الطلب */}
        <table className="rc-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6 }}>
          <tbody>
            <tr>
              <th>رقم الطلب</th>
              <td style={{ fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" }}>{id}</td>
            </tr>
            <tr>
              <th>اسم الزبون</th>
              <td style={{ fontWeight: 700 }}>{order.name}</td>
            </tr>
            <tr>
              <th>رقم الهاتف</th>
              <td>{order.phone}</td>
            </tr>
            <tr>
              <th>تاريخ الطلب</th>
              <td>{printDate}</td>
            </tr>
            <tr>
              <th>حالة الطلب</th>
              <td>
                <span style={{ background: "#f5f3ff", color: "#7c3aed", padding: "2px 10px", borderRadius: 12, fontWeight: 700, fontSize: 12 }}>
                  {statusLabel(order.status)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <hr className="rc-dots" />

        {/* تفاصيل السعر */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>تفاصيل السعر</div>
          <table className="rc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <th>السعر المدفوع (شي إن)</th>
                <td style={{ fontWeight: 700 }}>{order.price ? `${Number(order.price).toFixed(2)} $` : "—"}</td>
              </tr>
              {order.shipping ? (
                <tr>
                  <th>رسوم الشحن</th>
                  <td>{Number(order.shipping).toFixed(2)} د.ل</td>
                </tr>
              ) : null}
              {order.price_lyd ? (
                <tr>
                  <th>السعر بالدينار</th>
                  <td>{Number(order.price_lyd).toFixed(2)} د.ل</td>
                </tr>
              ) : null}
              {order.final_total ? (
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ color: "#7c3aed", fontWeight: 800 }}>الإجمالي النهائي</th>
                  <td style={{ fontWeight: 900, fontSize: 15, color: "#7c3aed" }}>{Number(order.final_total).toFixed(2)} د.ل</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <hr className="rc-dots" />

        {/* مراحل الطلب */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>مراحل الطلب</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <div key={step.key} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${done ? "#7c3aed" : "#d1d5db"}`, background: done ? "#7c3aed" : "#fff", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: done ? "#fff" : "#d1d5db", fontWeight: 800 }}>{done ? "✓" : i + 1}</span>
                  </div>
                  <div style={{ fontSize: 9, color: done ? "#7c3aed" : "#9ca3af", fontWeight: done ? 700 : 400, lineHeight: 1.3 }}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="rc-dots" />

        {/* ملاحظة */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12 }}>
          <strong>ملاحظة مهمة:</strong> يُرجى الاحتفاظ بهذا الوصل ورقم الطلب لمتابعة حالة شحنتك.
          <br />
          للتتبع: <strong style={{ color: "#7c3aed" }}>order.trendstore-ly.com/track?id={id}</strong>
        </div>

        {/* الختم والتوقيع */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #7c3aed", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: "#7c3aed", lineHeight: 1.2 }}>TREND</div>
                <div style={{ fontSize: 9, fontWeight: 900, color: "#7c3aed", lineHeight: 1.2 }}>STORE</div>
                <div style={{ fontSize: 7, color: "#9ca3af", lineHeight: 1.2 }}>ليبيا</div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af" }}>ختم المتجر</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 100, borderTop: "1px solid #374151", marginBottom: 4 }} />
            <div style={{ fontSize: 9, color: "#9ca3af" }}>توقيع الزبون</div>
          </div>
        </div>

        {/* ذيل */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #f3f4f6", textAlign: "center", fontSize: 10, color: "#9ca3af", lineHeight: 1.8 }}>
          <div>شكراً لثقتكم بـ Trend Store</div>
          <div>للتواصل والاستفسار: WhatsApp / Instagram @TrendStore</div>
          <div style={{ marginTop: 4, fontSize: 9 }}>هذا الوصل صادر إلكترونياً ويُعدّ وثيقة رسمية لحجز الطلب</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          المحتوى العادي على الشاشة
          ════════════════════════════════════════════ */}
      <div id="screen-content" style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14, animation: "pop 0.3s ease" }}>

        {/* ── رقم الطلب ── */}
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>📦 رقم الطلب</p>
            <span style={{ fontSize: 11, background: statusBg(order.status), color: statusColor(order.status), padding: "4px 12px", borderRadius: 20, fontWeight: 700 }}>
              {statusLabel(order.status)}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f9fafb", borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ flex: 1, fontFamily: "monospace", fontSize: 12, color: "#374151", wordBreak: "break-all" }}>{id}</span>
            <button
              onClick={handleCopy}
              style={{ padding: "7px 16px", borderRadius: 10, border: "none", background: copied ? "#16a34a" : GRAD, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", transition: "background 0.2s", minWidth: 80 }}
            >
              {copied ? "✓ تم النسخ" : "نسخ"}
            </button>
          </div>
        </div>

        {/* ── شريط التقدم ── */}
        <div style={styles.card}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 16 }}>حالة الطلب</p>

          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{ position: "absolute", top: 16, right: 16, left: 16, height: 3, background: "#f3f4f6", borderRadius: 10 }} />
            <div style={{ position: "absolute", top: 16, right: 16, width: `${(currentStep / (STEPS.length - 1)) * (100 - 8)}%`, height: 3, background: GRAD, borderRadius: 10, transition: "width 0.6s ease" }} />

            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              {STEPS.map((step, i) => {
                const done   = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: done ? GRAD : "#f3f4f6",
                      border: active ? "3px solid #c4b5fd" : "3px solid transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14,
                      boxShadow: active ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                      transition: "all 0.4s",
                      position: "relative", zIndex: 1,
                    }}>
                      {done ? <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span> : <span style={{ fontSize: 14 }}>{step.icon}</span>}
                    </div>
                    <p style={{ fontSize: 11, color: done ? PURPLE : "#9ca3af", marginTop: 6, fontWeight: done ? 700 : 400, textAlign: "center", lineHeight: 1.3 }}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── بيانات الطلب ── */}
        <div style={styles.card}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 14 }}>تفاصيل الطلب</p>

          {order.image_url && (
            <img
              src={order.image_url}
              alt="صورة الطلب"
              onClick={() => setPreview(order.image_url)}
              style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, marginBottom: 14, cursor: "pointer", border: "1px solid #f3f4f6" }}
            />
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {[
              { label: "👤 الاسم",   value: order.name  },
              { label: "📞 الهاتف",  value: order.phone },
              { label: "💰 السعر",   value: order.price ? `${Number(order.price).toFixed(2)} $` : "—" },
              { label: "📅 التاريخ", value: printDate   },
              ...(order.shipping   ? [{ label: "🚚 الشحن",      value: `${Number(order.shipping).toFixed(2)} د.ل`    }] : []),
              ...(order.final_total? [{ label: "🧾 الإجمالي",   value: `${Number(order.final_total).toFixed(2)} د.ل` }] : []),
              ...(order.cart_link  ? [{ label: "🔗 رابط السلة", value: order.cart_link, link: true }] : []),
            ].map(({ label, value, link }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
                {link
                  ? <a href={value} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: PURPLE, fontWeight: 600, maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}>فتح الرابط ↗</a>
                  : <span style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>{value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── ربط بالحساب ── */}
        {!alreadyLinked && (
          <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 18, padding: "18px 20px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>👤</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 3 }}>
                  {user ? "أضف هذا الطلب لحسابك" : "سجّل دخولك لمتابعة طلبك"}
                </p>
                <p style={{ fontSize: 12, color: "#7c3aed" }}>
                  {user ? "ستجد طلبك في قائمة طلباتك تلقائياً" : "أنشئ حساباً وأضف هذا الطلب لمتابعته مع طلباتك"}
                </p>
              </div>
            </div>
            {claimed ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", textAlign: "center", color: "#16a34a", fontWeight: 700, fontSize: 13 }}>
                ✅ تم إضافة الطلب لحسابك
              </div>
            ) : (
              <>
                {claimErr && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>⚠️ {claimErr}</p>}
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  style={{ width: "100%", padding: "11px", borderRadius: 12, border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: claiming ? 0.7 : 1, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
                >
                  {claiming ? "⏳ جاري الإضافة..." : user ? "إضافة لحسابي" : "تسجيل الدخول وإضافة الطلب"}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── أزرار ── */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ ...styles.btnOutline, flex: 1 }}>🖨️ طباعة الوصل</button>
          <a href="/" style={{ ...styles.btnOutline, flex: 1, textDecoration: "none", textAlign: "center" }}>طلب جديد</a>
        </div>

      </div>

      {/* ── معاينة الصورة ── */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
          <img src={preview} onClick={e => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 20, left: 20, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function statusLabel(s) {
  return { new: "جديد", paid: "مدفوع", confirmed: "مؤكد", ordered: "تحت المعالجة", processing: "تحت المعالجة", shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي" }[s] || s || "—";
}
function statusColor(s) {
  if (["delivered"].includes(s))                         return "#16a34a";
  if (["paid","confirmed"].includes(s))                  return "#7c3aed";
  if (["shipped"].includes(s))                           return "#2563eb";
  if (["ordered","processing"].includes(s))              return "#d97706";
  if (["cancelled"].includes(s))                         return "#ef4444";
  return "#6b7280";
}
function statusBg(s) {
  if (["delivered"].includes(s))                         return "#f0fdf4";
  if (["paid","confirmed"].includes(s))                  return "#f5f3ff";
  if (["shipped"].includes(s))                           return "#eff6ff";
  if (["ordered","processing"].includes(s))              return "#fffbeb";
  if (["cancelled"].includes(s))                         return "#fff5f5";
  return "#f9fafb";
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "calc(100vh - 60px)",
    background: "transparent",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "28px 16px",
    direction: "rtl",
  },
  card: {
    background: "#fff",
    borderRadius: 18,
    padding: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
  },
  input: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    outline: "none",
    color: "#111",
    background: "#fff",
  },
  btn: {
    padding: "11px 20px",
    borderRadius: 10,
    border: "none",
    background: GRAD,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  btnOutline: {
    padding: "12px",
    borderRadius: 12,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
};

export default function Track() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: PURPLE }}>⏳</div>}>
      <TrackContent />
    </Suspense>
  );
}
