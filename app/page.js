"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const PRIMARY   = "#7c3aed";
const GRADIENT  = "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)";
const BG        = "transparent";

// موبي كاش قيد التجربة: تظهر للأدمن فقط، أو للجميع عند ضبط
// NEXT_PUBLIC_MOBICASH_ENABLED=true بعد تفعيل حساب البرودكشن.
const ADMIN_EMAIL = "mo3iemohamed@gmail.com";

export default function OrderPage() {
  const [cartLink,          setCartLink]          = useState("");
  const [name,              setName]              = useState("");
  const [phone,             setPhone]             = useState("");
  const [image,             setImage]             = useState(null);
  const [price,             setPrice]             = useState(null);
  const [exchangeRate,      setExchangeRate]      = useState(1);
  const [loading,           setLoading]           = useState(false);
  const [sending,           setSending]           = useState(false);
  const [preview,           setPreview]           = useState(null);
  const [trackId,           setTrackId]           = useState("");
  const [showPayment,       setShowPayment]       = useState(false);
  const [selectedMethod,    setSelectedMethod]    = useState(null);
  const [cardNumber,        setCardNumber]        = useState("");
  const [errors,            setErrors]            = useState({});
  const [orderId,           setOrderId]           = useState(null);
  const [edfaliStep,        setEdfaliStep]        = useState(null);
  const [edfaliSession,     setEdfaliSession]     = useState(null);
  const [edfaliOtp,         setEdfaliOtp]         = useState("");
  const [edfaliOrderId,     setEdfaliOrderId]     = useState(null);
  const [edfaliPhone,       setEdfaliPhone]       = useState("");
  const [mcStep,            setMcStep]            = useState(null);
  const [mcCard,            setMcCard]            = useState("");
  const [mcOtp,             setMcOtp]             = useState("");
  const [mcOrderId,         setMcOrderId]         = useState(null);
  const [isAdmin,           setIsAdmin]           = useState(false);
  // Price now comes from the resolver service (a real SHEIN cart read on our own
  // accounts) instead of OCR on a customer screenshot.
  const [resolveState,      setResolveState]      = useState("idle"); // idle|checking|verified|failed
  const [resolveError,      setResolveError]      = useState("");
  const [itemCount,         setItemCount]         = useState(null);
  const [resolvedLink,      setResolvedLink]      = useState("");
  const [elapsed,           setElapsed]           = useState(0);
  const [queue,             setQueue]             = useState(null);

  const base      = price || 0;
  const profit    = base * 0.01;
  const totalUSD  = base + profit;
  const priceLYD  = exchangeRate ? totalUSD * exchangeRate : 0;

  const paymentMethods = [
    { id: "masrefypay", name: "مصرفي",     icon: "💳", color: "#ea580c" },
    { id: "yousrpay",   name: "يسر باي",   icon: "💳", color: "#0d9488" },
    { id: "saharpay",   name: "صحارة باي", icon: "💳", color: "#ca8a04" },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data?.user?.email === ADMIN_EMAIL);
    });
  }, []);

  useEffect(() => {
    supabase.from("settings").select("exchange_rate").eq("id", 1).single()
      .then(({ data }) => { if (data) setExchangeRate(Number(data.exchange_rate)); });
  }, []);

  // A price check runs on our server, not in this tab. If the customer closed
  // the page, lost connection, or came back later, pick the same job up again
  // instead of starting a second run against the same SHEIN cart.
  useEffect(() => {
    let cancelled = false;
    let saved;
    try { saved = JSON.parse(localStorage.getItem("trend_price_job") || "null"); } catch { saved = null; }
    // Jobs and their results do not outlive the resolver's 15-minute window.
    if (!saved?.jobId || !saved?.link || Date.now() - (saved.at || 0) > 15 * 60 * 1000) {
      try { localStorage.removeItem("trend_price_job"); } catch {}
      return;
    }

    setCartLink(saved.link);
    setResolveState("checking");
    const started = saved.at;

    (async () => {
      for (;;) {
        if (cancelled) return;
        try {
          const r = await fetch(
            `/api/resolve-cart?job=${encodeURIComponent(saved.jobId)}&url=${encodeURIComponent(saved.link)}`
          );
          const pd = await r.json();
          if (cancelled) return;

          if (!pd.success) {
            try { localStorage.removeItem("trend_price_job"); } catch {}
            setResolveState("failed");
            setResolveError(pd.message || "تعذّر التحقق من السعر.");
            return;
          }
          if (pd.queue) setQueue({ ...pd.queue, averageMs: pd.averageMs });
          if (pd.status !== "pending") {
            try { localStorage.removeItem("trend_price_job"); } catch {}
            setQueue(null);
            setPrice(Number(pd.estimatedPrice));
            setItemCount(pd.itemCount ?? null);
            setResolvedLink(saved.link);
            setResolveState("verified");
            return;
          }
          setElapsed(Math.round((Date.now() - started) / 1000));
        } catch {
          // A dropped connection is not a failed job; keep polling.
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────
  function isValidSheinLink(url) { return /shein\.com/i.test(url.trim()); }
  function isValidLibyanPhone(p) {
    return /^(00218|\+218|0)9[1-5]\d{7}$/.test(p.replace(/[\s-]/g, ""));
  }
  function validate() {
    const errs = {};
    if (!isValidSheinLink(cartLink))  errs.cartLink = "يجب أن يكون رابط سلة من موقع shein.com";
    if (!name.trim())                 errs.name     = "أدخل اسمك الكامل";
    if (!isValidLibyanPhone(phone))   errs.phone    = "رقم الهاتف غير صحيح — مثال: 0913456789";
    if (resolveState !== "verified" || !price) {
      errs.price = "اضغط \"تحقق من السلة والسعر\" أولاً";
    } else if (resolvedLink !== cartLink.trim()) {
      // The link changed after verification — the price on screen is stale.
      errs.price = "تغيّر الرابط بعد التحقق — تحقق من السلة مرة أخرى";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // The screenshot is kept as an attachment for the admin, but it is no longer
  // a price source: the price comes from the resolver reading the real cart.
  // The Tesseract OCR pipeline that used to parse "Estimated Price" out of it
  // has been removed rather than left dormant.

  // ── Cart verification (replaces the screenshot OCR) ──────────────────────
  async function handleResolveCart() {
    const link = cartLink.trim();
    if (!isValidSheinLink(link)) {
      setErrors(p => ({ ...p, cartLink: "يجب أن يكون رابط سلة من موقع shein.com" }));
      return;
    }
    setResolveState("checking");
    setResolveError("");
    setElapsed(0);
    setQueue(null);
    setPrice(null);
    setItemCount(null);
    setErrors(p => ({ ...p, price: null, cartLink: null }));

    const finish = (data) => {
      try { localStorage.removeItem("trend_price_job"); } catch {}
      setQueue(null);
      setPrice(Number(data.estimatedPrice));
      setItemCount(data.itemCount ?? null);
      setResolvedLink(link);
      setResolveState("verified");
    };
    const fail = (msg) => {
      try { localStorage.removeItem("trend_price_job"); } catch {}
      setQueue(null);
      setResolveState("failed");
      setResolveError(msg);
    };

    try {
      // Start the job. Reading a real cart takes minutes, so the request only
      // kicks it off — the result is collected by polling.
      const res  = await fetch("/api/resolve-cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();

      if (!data.success) return fail(data.message || "تعذّر التحقق من السعر.");
      if (data.status !== "pending") return finish(data);   // served from cache

      // Remember the job. The measurement runs on the server, not in this tab,
      // so a closed page or a dropped connection must not lose it: reopening
      // rejoins the same run instead of starting a second one.
      try {
        localStorage.setItem("trend_price_job",
          JSON.stringify({ jobId: data.jobId, link, at: Date.now() }));
      } catch {}

      const started = Date.now();
      const LIMIT_MS = 5 * 60 * 1000;
      for (;;) {
        await new Promise(r => setTimeout(r, 4000));
        setElapsed(Math.round((Date.now() - started) / 1000));

        const p = await fetch(
          `/api/resolve-cart?job=${encodeURIComponent(data.jobId)}&url=${encodeURIComponent(link)}`
        );
        const pd = await p.json();

        if (!pd.success) return fail(pd.message || "تعذّر التحقق من السعر.");
        if (pd.queue) setQueue({ ...pd.queue, averageMs: pd.averageMs });
        if (pd.status !== "pending") return finish(pd);
        if (Date.now() - started > LIMIT_MS) {
          return fail("استغرق التحقق وقتاً أطول من المتوقع. حاول مرة أخرى.");
        }
      }
    } catch {
      fail("تعذّر الاتصال بخدمة التسعير. حاول مرة أخرى.");
    }
  }

  // ── Upload helper ────────────────────────────────────────────────────────
  async function uploadImage() {
    const fileName = `${Date.now()}-${image.name}`;
    const { error } = await supabase.storage.from("orders-images").upload(`public/${fileName}`, image);
    if (error) throw new Error("فشل رفع الصورة");
    const { data } = supabase.storage.from("orders-images").getPublicUrl(`public/${fileName}`);
    return data.publicUrl;
  }

  async function createOrder(imageUrl) {
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, cart_link: cartLink, price, image_url: imageUrl, user_id: user?.id }),
    });
    const result = await res.json();
    if (!result.success) throw new Error("فشل إنشاء الطلب");
    return result.id;
  }

  // ── Track ────────────────────────────────────────────────────────────────
  const handleTrack = () => {
    if (!trackId) return;
    window.location.href = `/track?id=${trackId}`;
  };

  // ── Stripe ───────────────────────────────────────────────────────────────
  const handlePayment = async () => {
    try {
      setSending(true);
      const imageUrl = await uploadImage();
      const oid = await createOrder(imageUrl);
      await supabase.from("payments").insert({ order_id: oid, method: "stripe", status: "pending", amount: totalUSD });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalUSD, orderId: oid }),
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      alert(err.message || "خطأ في الدفع");
      setSending(false);
    }
  };

  // ── DPay ─────────────────────────────────────────────────────────────────
  const handleDpay = async (method) => {
    if (!method) { alert("اختر طريقة الدفع أولاً"); return; }
    try {
      setSending(true);
      const imageUrl = await uploadImage();
      const oid = await createOrder(imageUrl);
      setOrderId(oid);
      await supabase.from("payments").insert({ order_id: oid, method: "dpay", status: "pending", amount: priceLYD });
      const res = await fetch("/api/dpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: oid,
          amount: Math.round(Number(priceLYD)),
          method,
          customer_mobile: phone,
          card_number: cardNumber,
          customer_name: name,
        }),
      });
      const data = await res.json();
      if (data.payment_link) {
        localStorage.setItem("lastOrderId", oid);
        if (data.session_id) localStorage.setItem("dpaySession", data.session_id);
        window.location.href = data.payment_link;
      } else {
        throw new Error(data.error || "فشل الدفع");
      }
    } catch (err) {
      alert(err.message || "خطأ في الدفع");
      setSending(false);
    }
  };

  // ── EDFali (DPAY.LY) ────────────────────────────────────────────────────
  const handleEdfaliPhoneSubmit = () => {
    let cleaned = edfaliPhone.replace(/\D/g, "");
    // Normalize to 10 digits with leading 0 (Libyan format: 09xxxxxxxx)
    if (cleaned.length === 9 && !cleaned.startsWith("0")) cleaned = "0" + cleaned;
    if (cleaned.length !== 10 || !cleaned.startsWith("0")) {
      alert("أدخل رقم هاتف صحيح · مثال: 0912345678");
      return;
    }
    setEdfaliPhone(cleaned);
    setEdfaliStep("sending");
    handleEdfali(cleaned);
  };

  const handleEdfali = async (ePhone) => {
    try {
      setSending(true);
      const imageUrl = await uploadImage();
      const oid = await createOrder(imageUrl);
      setOrderId(oid);
      setEdfaliOrderId(oid);
      await supabase.from("payments").insert({ order_id: oid, method: "edfali", status: "pending", amount: priceLYD });

      const res = await fetch("/api/edfali", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid, amountLYD: priceLYD, phone: ePhone }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل إرسال طلب الدفع");

      setEdfaliSession(data.session_id);
      setEdfaliStep("otp");
      setSending(false);
    } catch (err) {
      alert(err.message || "خطأ في الدفع");
      setEdfaliStep(null);
      setSending(false);
    }
  };

  const handleEdfaliVerify = async () => {
    if (!edfaliOtp || edfaliOtp.length < 4) { alert("أدخل رمز التحقق المكون من 4 أرقام"); return; }
    try {
      setSending(true);
      const res = await fetch("/api/edfali/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: edfaliSession, otp: edfaliOtp, orderId: edfaliOrderId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "رمز التحقق خاطئ");
      localStorage.setItem("lastOrderId", edfaliOrderId);
      window.location.href = `/success?orderId=${edfaliOrderId}&via=edfali`;
    } catch (err) {
      alert(err.message || "رمز خاطئ، حاول مجدداً");
      setSending(false);
    }
  };

  // ── MobiCash (موبي كاش) — direct Wahda Bank card payment ────────────────
  const handleMobicash = async () => {
    const card = mcCard.replace(/\D/g, "");
    if (card.length < 5) { alert("أدخل رقم بطاقة موبي كاش"); return; }
    try {
      setMcStep("sending");
      setSending(true);
      const imageUrl = await uploadImage();
      const oid = await createOrder(imageUrl);
      setOrderId(oid);
      setMcOrderId(oid);
      await supabase.from("payments").insert({ order_id: oid, method: "mobicash", status: "pending", amount: priceLYD });

      const res = await fetch("/api/mobicash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid, amountLYD: priceLYD, cardNumber: card }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل إرسال رمز التحقق");

      setMcStep("otp");
      setSending(false);
    } catch (err) {
      alert(err.message || "خطأ في الدفع");
      setMcStep("card");
      setSending(false);
    }
  };

  const handleMobicashVerify = async () => {
    if (!mcOtp || mcOtp.length < 4) { alert("أدخل رمز التحقق"); return; }
    try {
      setSending(true);
      const res = await fetch("/api/mobicash/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: mcOrderId, otp: mcOtp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "رمز التحقق خاطئ");
      localStorage.setItem("lastOrderId", mcOrderId);
      window.location.href = `/success?orderId=${mcOrderId}&via=mobicash`;
    } catch (err) {
      alert(err.message || "رمز خاطئ، حاول مجدداً");
      setSending(false);
    }
  };

  // ── Moamalat ─────────────────────────────────────────────────────────────
  // Lightbox must load on trendstore-ly.com (whitelisted domain) — redirect there with params
  const TRENDSTORE = "https://trendstore-ly.com";

  const handleMoamalat = async () => {
    try {
      setSending(true);
      const imageUrl = await uploadImage();
      const oid = await createOrder(imageUrl);
      setOrderId(oid);
      await supabase.from("payments").insert({ order_id: oid, method: "moamalat", status: "pending", amount: priceLYD });

      const res = await fetch("/api/moamalat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid, amountLYD: priceLYD }),
      });
      const p = await res.json();
      if (!p.success) throw new Error(p.error || "فشل تهيئة بوابة الدفع");

      localStorage.setItem("lastOrderId", oid);

      const origin      = window.location.origin;
      const returnUrl   = `${origin}/success?orderId=${oid}&via=moamalat`;
      const cancelUrl   = `${origin}`;

      const qs = new URLSearchParams({
        mid:      p.MID,
        tid:      p.TID,
        amount:   p.AmountTrxn,
        ref:      p.MerchantReference,
        datetime: p.TrxDateTime,
        hash:     p.SecureHash,
        script:   p.scriptUrl,
        return:   returnUrl,
        cancel:   cancelUrl,
      }).toString();

      window.location.href = `${TRENDSTORE}/moamalat-pay?${qs}`;
    } catch (err) {
      alert(err.message || "خطأ في الدفع");
      setSending(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="form-main" style={{ minHeight: "calc(100vh - 60px)", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", direction: "rtl" }}>

      <style>{`
        @keyframes zoomIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes spin    { to   { transform: rotate(360deg); } }
        input:focus { outline: none !important; border-color: ${PRIMARY} !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
      `}</style>

      <div className="form-inner" style={{ width: "100%", maxWidth: 480 }}>

        {/* ── Card ── */}
        <div className="form-card" style={{ background: "#fff", borderRadius: 24, padding: "36px 32px", boxShadow: "0 8px 40px rgba(124,58,237,0.10)", border: "1px solid #ede9fe" }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <img src="/logo.png" alt="logo" style={{ height: 90, objectFit: "contain" }} />
          </div>
          <h1 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: "#1e1b4b", marginBottom: 4 }}>
            منتجاتك وسلتك بضغطة زر
          </h1>
          <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>
            ضع رابط سلتك من شي إن وسنتكفل بالباقي
          </p>

          {/* Note: UAE */}
          <div style={s.noteBlue}>
            🇦🇪 <strong>تنبيه هام:</strong> يجب أن يكون متجر شي إن موجّهاً لـ <strong>دبي / الإمارات العربية المتحدة</strong> حتى تظهر الأسعار بالدولار الأمريكي بشكل صحيح.
          </div>

          {/* Cart Link */}
          <label style={s.label}>رابط سلة شي إن</label>
          <input
            placeholder="https://www.shein.com/..."
            value={cartLink}
            onChange={e => { setCartLink(e.target.value); setErrors(p => ({ ...p, cartLink: null })); }}
            style={{ ...s.input, ...(errors.cartLink ? s.inputErr : {}) }}
          />
          {errors.cartLink
            ? <p style={s.err}>⚠️ {errors.cartLink}</p>
            : <p style={s.hint}>🔗 الصق رابط <strong>السلة المشتركة</strong> من تطبيق شي إن (زر المشاركة داخل السلة)</p>
          }

          {/* Verify the cart on our side — this is where the price comes from now. */}
          <button
            type="button"
            onClick={handleResolveCart}
            disabled={resolveState === "checking" || !cartLink.trim()}
            style={{
              ...s.verifyBtn,
              opacity: (resolveState === "checking" || !cartLink.trim()) ? 0.6 : 1,
              cursor:  (resolveState === "checking" || !cartLink.trim()) ? "not-allowed" : "pointer",
            }}
          >
            {resolveState === "checking"
              ? `⏳ جاري التحقق... ${elapsed > 0 ? elapsed + " ثانية" : ""}`
              : "🔍 تحقق من السلة والسعر"}
          </button>

          {resolveState === "checking" && (
            <div style={s.queueBox}>
              {/* Pricing runs on one device, so the line is real. Telling the
                  customer where they stand beats an unexplained spinner. */}
              {queue && queue.ahead > 0 ? (
                <>
                  <div style={s.queuePos}>
                    دورك رقم <strong>{queue.position}</strong> في الانتظار
                  </div>
                  <div style={s.queueSub}>
                    {queue.ahead === 1 ? "أمامك طلب واحد" : `أمامك ${queue.ahead} طلبات`}
                    {queue.etaMs ? ` — الوقت المتوقع ${Math.max(1, Math.round(queue.etaMs / 60000))} دقيقة تقريباً` : ""}
                  </div>
                </>
              ) : (
                <div style={s.queuePos}>
                  ⏳ نقرأ سعر سلتك الآن من تطبيق شي إن
                  {queue?.averageMs ? ` — عادةً ${Math.round(queue.averageMs / 1000)} ثانية` : ""}
                </div>
              )}
              <div style={s.queueSub}>
                يمكنك إغلاق الصفحة — العملية تكمل على خادمنا، وتستأنف من حيث توقفت عند رجوعك.
              </div>
            </div>
          )}
          {resolveState === "verified" && (
            <div style={s.okBox}>
              ✅ <strong>تم التحقق من السعر</strong>
              {itemCount ? <> — {itemCount} منتج في السلة</> : null}
            </div>
          )}
          {resolveState === "failed" && (
            <div style={s.noteRed}>❌ {resolveError}</div>
          )}

          {/* Name */}
          <label style={s.label}>الاسم الكامل</label>
          <input
            placeholder="أدخل اسمك الكامل"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })); }}
            style={{ ...s.input, ...(errors.name ? s.inputErr : {}) }}
          />
          {errors.name && <p style={s.err}>⚠️ {errors.name}</p>}

          {/* Phone */}
          <label style={s.label}>رقم الهاتف الليبي</label>
          <input
            placeholder="0913456789"
            value={phone}
            type="tel"
            maxLength={13}
            onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: null })); }}
            style={{ ...s.input, ...(errors.phone ? s.inputErr : {}) }}
          />
          {errors.phone
            ? <p style={s.err}>⚠️ {errors.phone}</p>
            : <p style={s.hint}>📞 يبدأ بـ 091 أو 092 أو 093 أو 094 أو 095 — 10 أرقام</p>
          }

          {/* Image note */}
          <div style={s.noteYellow}>
            📸 <strong>اختياري:</strong> يمكنك رفع سكرين شوت للسلة إن أردت — لم يعد مطلوباً، فالسعر يُقرأ آلياً من رابط السلة.
          </div>

          {/* Upload */}
          <label style={{ ...s.uploadBox, ...(errors.image ? s.uploadBoxErr : {}) }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                setImage(file);
                setErrors(p => ({ ...p, image: null, price: null }));
              }}
            />
            <span style={{ fontSize: 28 }}>📷</span>
            <span style={{ fontSize: 13, color: image ? PRIMARY : "#9ca3af", fontWeight: image ? 600 : 400 }}>
              {image ? image.name : "اضغط لرفع صورة (اختياري)"}
            </span>
          </label>
          {errors.image && <p style={s.err}>⚠️ {errors.image}</p>}

          {/* Preview thumbnail */}
          {image && (
            <img
              src={URL.createObjectURL(image)}
              onClick={() => setPreview(URL.createObjectURL(image))}
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, marginTop: 10, cursor: "pointer", border: "2px solid #ede9fe" }}
            />
          )}

          {/* OCR status */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0", color: PRIMARY, fontSize: 13 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${PRIMARY}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              جاري قراءة الصورة...
            </div>
          )}

          {errors.price && <p style={s.err}>⚠️ {errors.price}</p>}
          {price > 0 && !loading && (
            <p style={{ color: "#16a34a", fontSize: 13, margin: "6px 0 0", fontWeight: 600 }}>✅ سعر السلة: {price} $</p>
          )}

          {/* Price breakdown */}
          {price > 0 && (
            <div style={s.priceBox}>
              <div style={s.priceRow}>
                <span style={{ color: "#6b7280" }}>📦 السعر الأصلي</span>
                <strong>{base.toFixed(2)} $</strong>
              </div>
              <div style={s.priceRow}>
                <span style={{ color: "#f97316" }}>💸 العمولة (1%)</span>
                <strong style={{ color: "#f97316" }}>{profit.toFixed(2)} $</strong>
              </div>
              <hr style={{ margin: "10px 0", borderColor: "#f3f4f6", borderTop: "none" }} />
              <div style={s.priceRow}>
                <span style={{ color: "#2563eb" }}>💵 الإجمالي بالدولار</span>
                <strong style={{ color: "#2563eb" }}>{totalUSD.toFixed(2)} $</strong>
              </div>
              <div style={s.priceRow}>
                <span style={{ color: "#9ca3af" }}>💱 سعر الدولار</span>
                <span style={{ color: "#9ca3af" }}>{exchangeRate} د.ل</span>
              </div>
              <hr style={{ margin: "10px 0", borderColor: "#f3f4f6", borderTop: "none" }} />
              <div style={{ ...s.priceRow, padding: "12px 14px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                <span style={{ color: "#15803d", fontWeight: 700 }}>🇱🇾 الإجمالي بالدينار</span>
                <strong style={{ fontSize: 18, color: "#15803d" }}>{priceLYD.toFixed(2)} د.ل</strong>
              </div>
              <p style={{ fontSize: 12, color: "#facc15", margin: "8px 0 0", textAlign: "center" }}>
                🚚 رسوم الشحن تُحدد لاحقاً حسب الوزن
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => { if (validate()) setShowPayment(true); }}
            disabled={sending || loading}
            style={{ ...s.btn, marginTop: 20, opacity: (sending || loading) ? 0.7 : 1, cursor: (sending || loading) ? "not-allowed" : "pointer" }}
          >
            {sending ? "⏳ جاري الإرسال..." : "إرسال الطلب ←"}
          </button>

          {/* Track */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <input
              placeholder="🔍 أدخل رقم الطلب للتتبع"
              value={trackId}
              onChange={e => setTrackId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              style={{ ...s.input, marginBottom: 0, flex: 1 }}
            />
            <button onClick={handleTrack} style={{ ...s.btn, width: "auto", padding: "0 20px", marginTop: 0 }}>
              بحث
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <a href="/my-orders" style={{ fontSize: 13, color: PRIMARY, textDecoration: "none", fontWeight: 500 }}>
              📦 عرض طلباتي السابقة
            </a>
          </div>
        </div>
      </div>

      {/* ── Image Preview Modal ── */}
      {preview && (
        <div onClick={() => setPreview(null)} style={s.overlay}>
          <img
            src={preview}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", animation: "zoomIn 0.2s ease" }}
          />
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPayment && (
        <div onClick={() => { if (!edfaliStep && !mcStep) setShowPayment(false); }} style={s.overlay}>
          <div onClick={e => e.stopPropagation()} className="pay-modal" style={s.modal}>

            {/* ── MobiCash: card number ── */}
            {mcStep === "card" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📲</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>موبي كاش — أدخل رقم بطاقتك</h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                  سيصلك رمز تحقق على هاتفك المرتبط بالبطاقة
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="رقم البطاقة"
                  value={mcCard}
                  onChange={e => setMcCard(e.target.value.replace(/[^0-9]/g, "").slice(0, 19))}
                  style={{ ...s.input, fontSize: 20, textAlign: "center", letterSpacing: 4, fontWeight: 700, marginBottom: 16, direction: "ltr" }}
                  autoFocus
                />
                <button
                  onClick={handleMobicash}
                  disabled={sending || mcCard.replace(/[^0-9]/g, "").length < 5}
                  style={{ ...s.btn, background: mcCard.replace(/[^0-9]/g, "").length >= 5 ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : "#e5e7eb", color: mcCard.replace(/[^0-9]/g, "").length >= 5 ? "#fff" : "#9ca3af", cursor: mcCard.replace(/[^0-9]/g, "").length >= 5 ? "pointer" : "not-allowed" }}
                >
                  إرسال رمز التحقق →
                </button>
                <button
                  onClick={() => { setMcStep(null); setMcCard(""); }}
                  style={{ width: "100%", marginTop: 10, padding: 10, background: "none", border: "1px solid #f3f4f6", borderRadius: 10, color: "#9ca3af", cursor: "pointer", fontSize: 13 }}
                >
                  رجوع
                </button>
              </div>

            ) : mcStep === "sending" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #e0f2fe", borderTopColor: "#0284c7", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                <p style={{ color: "#6b7280", fontSize: 14 }}>⏳ جاري إرسال رمز التحقق...</p>
              </div>

            ) : mcStep === "otp" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>تحقق من رمز موبي كاش</h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                  أُرسل رمز التحقق إلى هاتفك — صالح لمدة <strong>5 دقائق</strong>
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="أدخل الرمز"
                  value={mcOtp}
                  onChange={e => setMcOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                  style={{ ...s.input, fontSize: 28, textAlign: "center", letterSpacing: 12, fontWeight: 700, marginBottom: 16, direction: "ltr" }}
                  autoFocus
                />
                <button
                  onClick={handleMobicashVerify}
                  disabled={sending || mcOtp.length < 4}
                  style={{ ...s.btn, background: mcOtp.length >= 4 ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : "#e5e7eb", color: mcOtp.length >= 4 ? "#fff" : "#9ca3af", cursor: mcOtp.length >= 4 ? "pointer" : "not-allowed" }}
                >
                  {sending ? "⏳ جاري التحقق..." : "تأكيد الدفع ✓"}
                </button>
                <button
                  onClick={() => { setMcStep("card"); setMcOtp(""); setSending(false); }}
                  style={{ width: "100%", marginTop: 10, padding: 10, background: "none", border: "1px solid #f3f4f6", borderRadius: 10, color: "#9ca3af", cursor: "pointer", fontSize: 13 }}
                >
                  رجوع
                </button>
              </div>

            ) : edfaliStep === "phone" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏧</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>ادفع لي — أدخل رقم هاتفك</h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                  أدخل رقم الهاتف المرتبط بحساب <strong>ادفع لي</strong><br />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>مثال: 0912345678</span>
                </p>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0912345678"
                  value={edfaliPhone}
                  onChange={e => setEdfaliPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                  style={{ ...s.input, fontSize: 20, textAlign: "center", letterSpacing: 4, fontWeight: 700, marginBottom: 16 }}
                  autoFocus
                />
                <button
                  onClick={handleEdfaliPhoneSubmit}
                  disabled={edfaliPhone.replace(/\D/g, "").length < 9}
                  style={{ ...s.btn, background: edfaliPhone.replace(/\D/g, "").length >= 9 ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "#e5e7eb", color: edfaliPhone.replace(/\D/g, "").length >= 9 ? "#fff" : "#9ca3af", cursor: edfaliPhone.replace(/\D/g, "").length >= 9 ? "pointer" : "not-allowed" }}
                >
                  إرسال رمز التحقق →
                </button>
                <button
                  onClick={() => { setEdfaliStep(null); setEdfaliPhone(""); }}
                  style={{ width: "100%", marginTop: 10, padding: 10, background: "none", border: "1px solid #f3f4f6", borderRadius: 10, color: "#9ca3af", cursor: "pointer", fontSize: 13 }}
                >
                  رجوع
                </button>
              </div>

            ) : edfaliStep === "sending" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color: "#6b7280", fontSize: 14 }}>⏳ جاري إرسال رمز التحقق...</p>
              </div>

            ) : edfaliStep === "otp" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏧</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>تحقق من رمز ادفع لي</h3>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                  أُرسل رمز تحقق مكوّن من <strong>4 أرقام</strong> إلى هاتفك<br />
                  <strong style={{ color: PRIMARY }}>{edfaliPhone}</strong>
                </p>
                <input
                  type="number"
                  maxLength={4}
                  placeholder="أدخل الرمز"
                  value={edfaliOtp}
                  onChange={e => setEdfaliOtp(e.target.value.slice(0, 4))}
                  style={{ ...s.input, fontSize: 28, textAlign: "center", letterSpacing: 12, fontWeight: 700, marginBottom: 16 }}
                  autoFocus
                />
                <button
                  onClick={handleEdfaliVerify}
                  disabled={sending || edfaliOtp.length < 4}
                  style={{ ...s.btn, background: edfaliOtp.length === 4 ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "#e5e7eb", color: edfaliOtp.length === 4 ? "#fff" : "#9ca3af", cursor: edfaliOtp.length === 4 ? "pointer" : "not-allowed" }}
                >
                  {sending ? "⏳ جاري التحقق..." : "تأكيد الدفع ✓"}
                </button>
                <button
                  onClick={() => { setEdfaliStep(null); setEdfaliOtp(""); setSending(false); }}
                  style={{ width: "100%", marginTop: 10, padding: 10, background: "none", border: "1px solid #f3f4f6", borderRadius: 10, color: "#9ca3af", cursor: "pointer", fontSize: 13 }}
                >
                  رجوع
                </button>
              </div>
            ) : (<>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>اختر طريقة الدفع</h3>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                المبلغ: <strong style={{ color: PRIMARY }}>{priceLYD.toFixed(0)} د.ل</strong> أو <strong style={{ color: "#2563eb" }}>{totalUSD.toFixed(2)} $</strong>
              </p>
            </div>

            {/* Stripe */}
            <button
              onClick={handlePayment}
              style={{ ...s.payBtn, background: "#1a1a2e", color: "#fff" }}
            >
              <span style={{ fontSize: 20 }}>💳</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>الدفع الدولي</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Visa / MasterCard</div>
              </div>
              <span style={{ marginRight: "auto", fontSize: 12, opacity: 0.6 }}>{totalUSD.toFixed(2)} $</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
              <span style={{ fontSize: 12, color: "#d1d5db" }}>أو ادفع بالدينار الليبي</span>
              <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
            </div>

            {/* Moamalat — dedicated button */}
            <button
              onClick={handleMoamalat}
              disabled={sending}
              style={{ ...s.payBtn, background: "linear-gradient(135deg,#15803d,#16a34a)", color: "#fff", marginBottom: 8 }}
            >
              <span style={{ fontSize: 22 }}>🏦</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>معاملات</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>بطاقة ليبية — Moamalat</div>
              </div>
              <span style={{ marginRight: "auto", fontWeight: 700, fontSize: 13 }}>{priceLYD.toFixed(0)} د.ل</span>
            </button>

            {/* EDFali — dedicated button */}
            <button
              onClick={() => setEdfaliStep("phone")}
              disabled={sending}
              style={{ ...s.payBtn, background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", marginBottom: 10 }}
            >
              <span style={{ fontSize: 22 }}>🏧</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>ادفع لي</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>محفظة EDFali — OTP</div>
              </div>
              <span style={{ marginRight: "auto", fontWeight: 700, fontSize: 13 }}>{priceLYD.toFixed(0)} د.ل</span>
            </button>

            {/* MobiCash — hidden until NEXT_PUBLIC_MOBICASH_ENABLED=true (sandbox → production) */}
            {(process.env.NEXT_PUBLIC_MOBICASH_ENABLED === "true" || isAdmin) && (
            <button
              onClick={() => setMcStep("card")}
              disabled={sending}
              style={{ ...s.payBtn, background: "linear-gradient(135deg,#0284c7,#0ea5e9)", color: "#fff", marginBottom: 10 }}
            >
              <span style={{ fontSize: 22 }}>📲</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>موبي كاش</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>بطاقة مصرف الوحدة — OTP</div>
              </div>
              <span style={{ marginRight: "auto", fontWeight: 700, fontSize: 13 }}>{priceLYD.toFixed(0)} د.ل</span>
            </button>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 10px" }}>
              <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
              <span style={{ fontSize: 11, color: "#d1d5db" }}>بوابات أخرى</span>
              <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
            </div>

            {/* DPay methods */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {paymentMethods.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 12,
                    border: selectedMethod === m.id ? `2px solid ${m.color}` : "2px solid #f3f4f6",
                    background: selectedMethod === m.id ? `${m.color}15` : "#fafafa",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 22 }}>{m.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selectedMethod === m.id ? m.color : "#374151", marginTop: 4 }}>{m.name}</div>
                </button>
              ))}
            </div>

            {["masrefypay", "yousrpay", "saharpay"].includes(selectedMethod) && (
              <input placeholder="💳 رقم البطاقة (7 أرقام)" value={cardNumber} onChange={e => setCardNumber(e.target.value)} style={{ ...s.input, marginBottom: 10 }} />
            )}

            <button
              disabled={!selectedMethod || sending}
              onClick={() => handleDpay(selectedMethod)}
              style={{
                ...s.btn,
                marginTop: 4,
                background: selectedMethod ? GRADIENT : "#e5e7eb",
                color: selectedMethod ? "#fff" : "#9ca3af",
                cursor: selectedMethod ? "pointer" : "not-allowed",
              }}
            >
              {sending ? "⏳ جاري الدفع..." : selectedMethod ? `تأكيد الدفع — ${priceLYD.toFixed(0)} د.ل` : "اختر طريقة الدفع أولاً"}
            </button>

            <button onClick={() => setShowPayment(false)} style={{ width: "100%", marginTop: 10, padding: "10px", background: "none", border: "1px solid #f3f4f6", borderRadius: 10, color: "#9ca3af", cursor: "pointer", fontSize: 13 }}>
              إغلاق
            </button>
            </>)}
          </div>
        </div>
      )}
    </main>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 14,
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontSize: 14,
    color: "#111",
    background: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputErr: {
    borderColor: "#f87171",
    background: "#fff5f5",
  },
  btn: {
    width: "100%",
    padding: "14px",
    background: GRADIENT,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "0.3px",
    boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
    transition: "opacity 0.15s",
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "2px dashed #ddd6fe",
    borderRadius: 12,
    padding: "24px 16px",
    cursor: "pointer",
    background: "#faf5ff",
    transition: "border-color 0.15s",
    marginBottom: 4,
  },
  uploadBoxErr: {
    borderColor: "#f87171",
    background: "#fff5f5",
  },
  verifyBtn: {
    width: "100%", padding: "13px 16px", marginTop: 10, borderRadius: 12,
    border: "none", background: GRADIENT, color: "#fff",
    fontSize: 15, fontWeight: 700, fontFamily: "inherit",
  },
  okBox: {
    marginTop: 10, padding: "11px 14px", borderRadius: 12,
    background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d",
    fontSize: 13, lineHeight: 1.7,
  },
  queueBox: {
    marginTop: 10, padding: "12px 14px", borderRadius: 12,
    background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8",
    fontSize: 13, lineHeight: 1.8,
  },
  queuePos: { fontWeight: 700, fontSize: 14 },
  queueSub: { opacity: 0.85, fontSize: 12.5 },
  noteBlue: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    color: "#1d4ed8",
    lineHeight: 1.6,
    marginBottom: 16,
  },
  noteYellow: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    color: "#92400e",
    lineHeight: 1.6,
    marginBottom: 12,
  },
  noteRed: {
    background: "#fff5f5",
    border: "1px solid #fca5a5",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    color: "#991b1b",
    lineHeight: 1.6,
    margin: "8px 0",
  },
  err: {
    color: "#ef4444",
    fontSize: 12,
    margin: "-10px 0 10px 2px",
  },
  hint: {
    color: "#9ca3af",
    fontSize: 12,
    margin: "-10px 0 14px 2px",
  },
  priceBox: {
    marginTop: 16,
    padding: "16px",
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "6px 0",
    fontSize: 14,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#fff",
    padding: "28px 24px",
    borderRadius: 20,
    width: 360,
    maxWidth: "92vw",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "zoomIn 0.2s ease",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
    direction: "rtl",
  },
  payBtn: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: 8,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "right",
    transition: "opacity 0.15s",
  },
};
