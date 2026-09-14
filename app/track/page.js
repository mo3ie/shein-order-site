"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { statusLabel, statusColor } from "@/lib/orderStatus";
import { Card, SectionTitle, Button, Icon, I, GRAD_HEAD, PRIMARY, INK, MUTED, FAINT, LINE, CHIP, CARD } from "@/app/components/ui";

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

// المراحل بأيقونات خطّية وملاحظة تشرح ما يجري في كل مرحلة، فالمسار يُقرأ
// كحكاية لا كأربع دوائر.
const STEPS = [
  { key: "new",       label: "تم الاستلام",  note: "وصلنا طلبك وسجّلناه",       icon: I.box,   keys: ["new", "paid", "confirmed"] },
  { key: "ordered",   label: "قيد المعالجة", note: "نشتري سلتك من شي إن",      icon: I.cart,  keys: ["ordered", "processing"]    },
  { key: "shipped",   label: "في الشحن",     note: "في طريقه إلى ليبيا",       icon: I.truck, keys: ["shipped"]                  },
  { key: "delivered", label: "تم التسليم",   note: "استلمت طلبك — شكرًا لثقتك", icon: I.check, keys: ["delivered"]                },
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
          <span style={{ width: 54, height: 54, borderRadius: 18, background: CHIP, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon path={I.search} size={24} color={PRIMARY} /></span>
          <h2 style={{ fontSize: 21, fontWeight: 900, marginBottom: 8 }}>تتبّع طلبك</h2>
          <p style={{ fontSize: 14, color: FAINT, marginBottom: 20, lineHeight: 1.8 }}>أدخل رقم الطلب لمتابعة حالته خطوة بخطوة.</p>
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
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `4px solid var(--t-line)`, borderTopColor: PURPLE, animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: FAINT, fontSize: 14.5, fontWeight: 600 }}>جاري تحميل بيانات الطلب...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center", maxWidth: 420 }}>
          <span style={{ width: 54, height: 54, borderRadius: 18, background: "var(--t-red-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon path={I.alert} size={24} color="var(--t-red-ink)" /></span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--t-red-ink)", marginBottom: 8 }}>الطلب غير موجود</h2>
          <p style={{ fontSize: 13, color: "var(--t-faint)", marginBottom: 20 }}>تحقق من رقم الطلب وأعد المحاولة</p>
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
          border-bottom: 1px solid var(--t-line);
          text-align: right;
        }
        .rc-table th { font-weight: 600; color: var(--t-muted); background: var(--t-chip); }
        .rc-dots {
          border: none;
          border-top: 2px dashed var(--t-faint);
          margin: 14px 0;
        }
      `}</style>

      {/* ════════════════════════════════════════════
          وصل الطباعة — مخفي في الشاشة، ظاهر عند الطباعة
          ════════════════════════════════════════════ */}
      <div id="print-receipt" style={{ fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif", direction: "rtl", maxWidth: 480, margin: "0 auto", padding: "24px 28px", color: "var(--t-ink)", background: "var(--t-card)" }}>

        {/* رأس الوصل */}
        <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "3px solid #7c3aed", paddingBottom: 16 }}>
          <img src="/logo.png" alt="Trend Store" style={{ height: 56, objectFit: "contain", marginBottom: 8 }} onError={e => { e.target.style.display = "none"; }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: "#7c3aed", letterSpacing: 1 }}>TREND STORE</div>
          <div style={{ fontSize: 11, color: "var(--t-faint)", marginTop: 2 }}>تريند ستور — طلبات شي إن</div>
        </div>

        {/* عنوان الوصل */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-block", background: "var(--t-chip)", border: "1px solid var(--t-accent-line)", borderRadius: 8, padding: "6px 24px" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#7c3aed" }}>وصل حجز طلب</span>
          </div>
        </div>

        {/* تاريخ الإصدار */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--t-faint)", marginBottom: 14 }}>
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
                <span style={{ background: "var(--t-chip)", color: "#7c3aed", padding: "2px 10px", borderRadius: 12, fontWeight: 700, fontSize: 12 }}>
                  {statusLabel(order.status)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <hr className="rc-dots" />

        {/* تفاصيل السعر */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-ink)", marginBottom: 8 }}>تفاصيل السعر</div>
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
                <tr style={{ background: "var(--t-chip)" }}>
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
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-ink)", marginBottom: 10 }}>مراحل الطلب</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <div key={step.key} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${done ? "#7c3aed" : "var(--t-faint)"}`, background: done ? "#7c3aed" : "var(--t-card)", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: done ? "var(--t-card)" : "var(--t-faint)", fontWeight: 800 }}>{done ? "✓" : i + 1}</span>
                  </div>
                  <div style={{ fontSize: 9, color: done ? "#7c3aed" : "var(--t-faint)", fontWeight: done ? 700 : 400, lineHeight: 1.3 }}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="rc-dots" />

        {/* ملاحظة */}
        <div style={{ background: "var(--t-amber-bg)", border: "1px solid var(--t-amber-line)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12 }}>
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
                <div style={{ fontSize: 7, color: "var(--t-faint)", lineHeight: 1.2 }}>ليبيا</div>
              </div>
            </div>
            <div style={{ fontSize: 9, color: "var(--t-faint)" }}>ختم المتجر</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 100, borderTop: "1px solid var(--t-ink)", marginBottom: 4 }} />
            <div style={{ fontSize: 9, color: "var(--t-faint)" }}>توقيع الزبون</div>
          </div>
        </div>

        {/* ذيل */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid var(--t-line)", textAlign: "center", fontSize: 10, color: "var(--t-faint)", lineHeight: 1.8 }}>
          <div>شكراً لثقتكم بـ Trend Store</div>
          <div>للتواصل والاستفسار: WhatsApp / Instagram @TrendStore</div>
          <div style={{ marginTop: 4, fontSize: 9 }}>هذا الوصل صادر إلكترونياً ويُعدّ وثيقة رسمية لحجز الطلب</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          المحتوى العادي على الشاشة
          ════════════════════════════════════════════ */}
      <div id="screen-content" style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 13, animation: "pop 0.3s ease" }}>

        {/* ── الحالة والمبلغ في بطاقة واحدة متدرّجة: أول ما يسأل عنه صاحب الطلب ── */}
        <div style={{ background: GRAD_HEAD, color: "#fff", borderRadius: 18, padding: "18px 18px 20px", position: "relative", overflow: "hidden", boxShadow: "0 6px 18px rgba(124,58,237,0.25)" }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", marginBottom: 16 }}>
            <span style={{ fontSize: 13, opacity: 0.85 }}>{STEPS[currentStep]?.label}</span>
            <span style={{ fontSize: 12, fontWeight: 800, background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px" }}>
              {statusLabel(order.status)}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>الإجمالي</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1.4px", lineHeight: 1 }}>
                {order.final_total ?? order.price_lyd
                  ? Number(order.final_total ?? order.price_lyd).toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "—"}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.85 }}>د.ل</span>
            </div>
          </div>
        </div>

        {/* ── المسار: أين وصل الطلب ── */}
        <Card pad={18}>
          <SectionTitle icon={I.truck}>مسار طلبك</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {STEPS.map((step, i) => {
              const done   = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: done ? GRAD_HEAD : "var(--t-chip)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: active ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                      color: done ? "#fff" : "var(--t-faint)",
                    }}>
                      <Icon path={done ? I.check : step.icon} size={15} stroke={2.2} />
                    </span>
                    {i < STEPS.length - 1 && (
                      <span style={{ width: 2, flex: 1, minHeight: 26, background: i < currentStep ? PRIMARY : "var(--t-line)" }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: active ? 900 : 700, color: done ? INK : FAINT }}>{step.label}</div>
                    <div style={{ fontSize: 12.5, color: FAINT, marginTop: 2 }}>{step.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── رقم الطلب: يُنسخ بضغطة، فهو مفتاح المتابعة ── */}
        <Card pad={16}>
          <SectionTitle icon={I.box} size={14.5}>رقم الطلب</SectionTitle>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: CHIP, borderRadius: 13, padding: "12px 14px" }}>
            <span style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 13, wordBreak: "break-all" }}>{id}</span>
            <button onClick={handleCopy} style={{
              padding: "9px 15px", borderRadius: 11, border: "none", cursor: "pointer",
              background: copied ? "var(--t-green-bg)" : CARD, color: copied ? "var(--t-green-ink)" : PRIMARY,
              fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
              <Icon path={copied ? I.check : I.copy} size={14} />
              {copied ? "نُسخ" : "نسخ"}
            </button>
          </div>
        </Card>

        {/* ── تفاصيل الطلب ── */}
        <Card pad={16}>
          <SectionTitle icon={I.note} size={14.5}>تفاصيل الطلب</SectionTitle>

          {order.image_url && (
            <img
              src={order.image_url}
              alt=""
              onClick={() => setPreview(order.image_url)}
              style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 13, marginBottom: 14, cursor: "pointer" }}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { icon: I.user,  label: "الاسم",   value: order.name },
              { icon: I.phone, label: "الهاتف",  value: order.phone },
              { icon: I.clock, label: "التاريخ", value: printDate },
              ...(order.delivery_address ? [{ icon: I.pin, label: "العنوان", value: order.delivery_address }] : []),
              ...(order.shipping ? [{ icon: I.truck, label: "الشحن", value: `${Number(order.shipping).toFixed(0)} د.ل` }] : []),
              ...(order.cart_link ? [{ icon: I.link, label: "سلة شي إن", value: order.cart_link, link: true }] : []),
            ].map((row, i) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                <Icon path={row.icon} size={16} color={FAINT} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>{row.label}</span>
                {row.link
                  ? <a href={row.value} target="_blank" rel="noreferrer" style={{ marginInlineStart: "auto", fontSize: 13, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>فتح ↗</a>
                  : <span style={{ marginInlineStart: "auto", fontSize: 13.5, fontWeight: 700, textAlign: "end" }}>{row.value}</span>}
              </div>
            ))}
          </div>
        </Card>

        {/* ── ربط الطلب بالحساب ── */}
        {!alreadyLinked && (
          <Card pad={18} style={{ border: `1.5px solid var(--t-accent-line)` }}>
            <SectionTitle icon={I.user} size={14.5}>
              {user ? "أضف هذا الطلب لحسابك" : "سجّل دخولك لمتابعة طلبك"}
            </SectionTitle>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.85, margin: "0 0 13px" }}>
              {user ? "ستجده بعدها في قائمة طلباتك تلقائيًا." : "أنشئ حسابًا وأضف هذا الطلب لتتابعه مع بقية طلباتك."}
            </p>
            {claimed ? (
              <div style={{ display: "flex", gap: 9, alignItems: "center", background: "var(--t-green-bg)", border: "1px solid var(--t-green-line)", color: "var(--t-green-ink)", borderRadius: 13, padding: "12px 14px", fontSize: 13.5, fontWeight: 700 }}>
                <Icon path={I.check} size={17} stroke={2.3} />
                تم إضافة الطلب لحسابك
              </div>
            ) : (<>
              {claimErr && (
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "11px 13px", marginBottom: 11, fontSize: 13 }}>
                  <Icon path={I.alert} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{claimErr}</span>
                </div>
              )}
              <Button onClick={handleClaim} disabled={claiming} icon={I.user} style={{ opacity: claiming ? 0.65 : 1 }}>
                {claiming ? "جاري الإضافة..." : user ? "إضافة لحسابي" : "تسجيل الدخول وإضافة الطلب"}
              </Button>
            </>)}
          </Card>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Button kind="ghost" onClick={() => window.print()} icon={I.download} style={{ flex: 1 }}>طباعة الوصل</Button>
          <a href="/" style={{ flex: 1, textDecoration: "none" }}>
            <Button kind="quiet" icon={I.plus} style={{ width: "100%" }}>طلب جديد</Button>
          </a>
        </div>

        <div style={{ textAlign: "center" }}>
          <a href="/my-orders" style={{ fontSize: 13.5, color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>كل طلباتي ←</a>
        </div>
      </div>

      {/* ── معاينة الصورة ── */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(22,19,31,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
          <img src={preview} onClick={e => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 20, left: 20, background: "rgba(255,255,255,0.15)", border: "none", color: "var(--t-card)", width: 36, height: 36, borderRadius: "50%", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--t-page)",
    color: "var(--t-ink)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "28px 16px",
    direction: "rtl",
  },
  card: {
    background: "var(--t-card)",
    borderRadius: 18,
    padding: "20px",
    boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
  },
  input: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--t-line)",
    fontSize: 14,
    outline: "none",
    color: "var(--t-ink)",
    background: "var(--t-card)",
  },
  btn: {
    padding: "11px 20px",
    borderRadius: 10,
    border: "none",
    background: GRAD_HEAD,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  btnOutline: {
    padding: "12px",
    borderRadius: 12,
    border: "1.5px solid var(--t-line)",
    background: "var(--t-card)",
    color: "var(--t-ink)",
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
