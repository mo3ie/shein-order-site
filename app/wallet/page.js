"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLang, useIsDesktop } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import TopBar from "@/app/components/TopBar";

const PRIMARY   = "#7c3aed";
const GRAD_HEAD = "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)";
const PAGE      = "var(--t-page)";
const CARD      = "var(--t-card)";
const INK       = "var(--t-ink)";
const MUTED     = "var(--t-muted)";
const FAINT     = "var(--t-faint)";
const LINE      = "var(--t-line)";
const CHIP      = "var(--t-chip)";

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("ar-LY", { day: "2-digit", month: "long" })
    + " — " + dt.toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" });
}

const METHOD = {
  wallet: "المحفظة", mobicash: "موبي كاش", moamalat: "معاملات",
  edfali: "ادفع لي", admin: "شحن إداري",
};

/**
 * محفظة شي إن — منفصلة عن محفظة متجر ترند عمداً: هذه تدفع طلبات شي إن وحدها.
 * الشاشة تقرأ الرصيد والحركات من /api/wallet برمز Bearer، لأن جلسة الموقع
 * تعيش في localStorage ولا تصل الخادم في كوكي.
 */
export default function WalletPage() {
  const { lang, setLang, t, dir } = useLang();
  const isDesktop = useIsDesktop();
  const { resolved: themeMode, toggle: toggleTheme } = useTheme();
  const [user,    setUser]    = useState(undefined);
  const [balance, setBalance] = useState(0);
  const [txs,     setTxs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (!u) { setLoading(false); return; }

      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      setBalance(Number(data.balance || 0));
      setTxs(Array.isArray(data.transactions) ? data.transactions : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, direction: dir, paddingBottom: 96 }}>
      {isDesktop && <TopBar active="wallet" lang={lang} setLang={setLang} t={t} user={user} />}

      <div className="form-inner" style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* ── الترويسة ── */}
        <div style={{ background: GRAD_HEAD, color: "#fff", padding: "18px 20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <a href="/" style={{ fontWeight: 900, fontSize: 18, color: "#fff", textDecoration: "none" }}>{t("ترند · شي إن")}</a>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={toggleTheme} aria-label={t("الوضع الداكن")} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}>{themeMode === "dark" ? "☀" : "☾"}</button>
            <button type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")} style={{ fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 20, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit" }}>{lang === "ar" ? "EN" : "ع"}</button>
            <a href={user ? "/account" : "/login"} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
              {user ? (user.user_metadata?.name?.[0] || user.email?.[0] || "م").toUpperCase() : "؟"}
            </a>
            </div>
          </div>

          <div style={{ marginTop: 22, position: "relative" }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{t("رصيد محفظتك")}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1 }}>
                {loading ? "—" : balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.85 }}>{t("د.ل")}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.16)", borderRadius: 20, padding: "4px 11px" }}>{t("الدفع منها بلا رمز تحقق")}</span>
              <span style={{ fontSize: 11, background: "rgba(255,255,255,0.16)", borderRadius: 20, padding: "4px 11px" }}>{t("محفظة شي إن وحدها")}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>

          {user === null ? (
            <div style={{ background: CARD, borderRadius: 18, padding: "48px 20px", textAlign: "center", boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
              <p style={{ fontWeight: 800, marginBottom: 6 }}>{t("سجّل دخولك لعرض محفظتك")}</p>
              <p style={{ fontSize: 12.5, color: FAINT, marginBottom: 20 }}>{t("الرصيد مرتبط بحسابك")}</p>
              <a href="/login" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 14, background: GRAD_HEAD, color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 6px 18px rgba(124,58,237,0.28)" }}>{t("تسجيل الدخول")}</a>
            </div>
          ) : (<>

            <div style={{ background: CARD, borderRadius: 18, padding: 15, boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 9 }}>{t("كيف تُستعمل المحفظة")}</div>
              <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.9 }}>
                عند الدفع تظهر المحفظة أول الطرق: ضغطة واحدة بلا رمز تحقق ولا انتظار بوابة.
                والشحن يتم حالياً من إدارة ترند — راسلنا بالمبلغ ويُضاف إلى رصيدك هنا.
              </div>
              <a href="/" style={{ display: "block", textAlign: "center", marginTop: 12, padding: 13, borderRadius: 13, background: CHIP, color: PRIMARY, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>{t("ابدأ طلباً وادفع من المحفظة")}</a>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{t("حركات الرصيد")}</div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 30, color: FAINT, fontSize: 13 }}>{t("جاري التحميل...")}</div>
            ) : txs.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 18, padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
                <p style={{ fontWeight: 800, marginBottom: 6 }}>{t("لا حركات بعد")}</p>
                <p style={{ fontSize: 12.5, color: FAINT }}>{t("سيظهر هنا كل شحن ودفع من المحفظة")}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {txs.map((tx) => {
                  const isIn = tx.type === "topup";
                  return (
                    <div key={tx.id} style={{ background: CARD, borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: isIn ? "var(--t-green-bg)" : CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isIn ? "var(--t-green-ink)" : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {isIn ? <><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></> : <><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>}
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{isIn ? t("شحن رصيد") : t("دفع طلب")}</div>
                        <div style={{ fontSize: 11, color: FAINT, marginTop: 2 }}>
                          {fmtDate(tx.created_at)}
                          {tx.method ? ` · ${METHOD[tx.method] || tx.method}` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "left", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: isIn ? "var(--t-green-ink)" : INK }}>
                          {isIn ? "+" : "−"}{Number(tx.amount).toFixed(0)}
                        </div>
                        <div style={{ fontSize: 10.5, color: FAINT }}>{t("د.ل")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>)}
        </div>
      </div>

      {/* ── شريط التنقّل السفلي ── */}
      <nav className="bottom-nav" style={{
        position: "fixed", insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, zIndex: 60,
        background: CARD, borderTop: `1px solid ${LINE}`,
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "8px 16px 10px" }}>
          {[
            { href: "/",          label: "طلب جديد", on: false, path: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /> },
            { href: "/my-orders", label: "طلباتي",   on: false, path: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></> },
            { href: "/wallet",    label: "المحفظة",  on: true,  path: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /></> },
            { href: user ? "/account" : "/login", label: user ? "حسابي" : "دخول", on: false, path: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /></> },
          ].map((it, i) => (
            <a key={i} href={it.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", color: it.on ? PRIMARY : FAINT }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={it.on ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round">{it.path}</svg>
              <span style={{ fontSize: 10, fontWeight: it.on ? 800 : 600 }}>{it.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
