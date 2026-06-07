"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Tesseract from "tesseract.js";

const PRIMARY   = "#7c3aed";
const GRADIENT  = "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)";
const BG        = "transparent";

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
  const [priceWarning,      setPriceWarning]      = useState(false);
  const [priceCurrencyErr,  setPriceCurrencyErr]  = useState(false);
  const [orderId,           setOrderId]           = useState(null);
  const [edfaliStep,        setEdfaliStep]        = useState(null);
  const [edfaliSession,     setEdfaliSession]     = useState(null);
  const [edfaliOtp,         setEdfaliOtp]         = useState("");
  const [edfaliOrderId,     setEdfaliOrderId]     = useState(null);
  const [edfaliPhone,       setEdfaliPhone]       = useState("");

  const base      = price || 0;
  const profit    = base * 0.01;
  const totalUSD  = base + profit;
  const priceLYD  = exchangeRate ? totalUSD * exchangeRate : 0;

  const paymentMethods = [
    { id: "mobicash",   name: "موبي كاش",  icon: "📱", color: "#0284c7" },
    { id: "masrefypay", name: "مصرفي",     icon: "💳", color: "#ea580c" },
    { id: "yousrpay",   name: "يسر باي",   icon: "💳", color: "#0d9488" },
    { id: "saharpay",   name: "صحارة باي", icon: "💳", color: "#ca8a04" },
  ];

  useEffect(() => {
    supabase.from("settings").select("exchange_rate").eq("id", 1).single()
      .then(({ data }) => { if (data) setExchangeRate(Number(data.exchange_rate)); });
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
    if (!image)                       errs.image    = "يجب رفع صورة تحتوي على السعر المقدر";
    if (priceCurrencyErr)             errs.price    = "العملة ليست دولار — افتح شي إن على دبي/الإمارات";
    else if (!price)                  errs.price    = "لم يُستخرج سعر من الصورة";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── OCR ─────────────────────────────────────────────────────────────────
  async function handleImage(file) {
    setLoading(true);
    setPriceWarning(false);
    setPriceCurrencyErr(false);
    setPrice(null);

    const { data: { text } } = await Tesseract.recognize(file, "eng+ara", {
      workerPath: "/tesseract-worker.min.js",
      langPath: "/tessdata",
    });

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let labelFound = false;
    let p = null;

    for (let i = 0; i < lines.length; i++) {
      const isLabel =
        /estim.{0,8}price/i.test(lines[i]) ||
        /السعر.{0,8}المقدر/.test(lines[i]);
      if (!isLabel) continue;

      labelFound = true;
      const win = lines.slice(i, i + 4).join(" ");

      // Accept ONLY if $ present — also handle S as OCR mistake for $
      const m = win.match(/\$\s*([\d,]+\.?\d*)/) ||
                win.match(/\bS\s*([\d,]+\.\d{2})\b/);
      if (m) {
        const val = parseFloat(m[1].replace(/,/g, ""));
        if (val >= 0.5 && val <= 9999) p = val;
      }
      break;
    }

    setLoading(false);

    if (!labelFound) { setPriceWarning(true); setPrice(null); return; }
    if (!p)          { setPriceCurrencyErr(true); setPrice(null); return; }
    setPrice(p);
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

  // ── Moamalat ─────────────────────────────────────────────────────────────
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
      const params = await res.json();
      if (!params.success) throw new Error(params.error || "فشل تهيئة بوابة الدفع");

      await new Promise((resolve, reject) => {
        if (document.getElementById("moamalat-lb")) { resolve(); return; }
        const script = document.createElement("script");
        script.id = "moamalat-lb";
        script.src = params.scriptUrl;
        script.onload = resolve;
        script.onerror = () => reject(new Error("فشل تحميل بوابة معاملات"));
        document.head.appendChild(script);
      });

      await new Promise(r => setTimeout(r, 300));
      localStorage.setItem("lastOrderId", oid);

      window.Lightbox.Checkout.configure = {
        MID:               params.MID,
        TID:               params.TID,
        AmountTrxn:        params.AmountTrxn,
        MerchantReference: params.MerchantReference,
        TrxDateTime:       params.TrxDateTime,
        SecureHash:        params.SecureHash,
        completeCallback:  () => { window.location.href = `/success?orderId=${oid}&via=moamalat`; },
        errorCallback:     () => { setSending(false); alert("حدث خطأ في عملية الدفع، حاول مجدداً"); },
        cancelCallback:    () => { setSending(false); },
      };
      window.Lightbox.Checkout.showLightbox();
      setSending(false);
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
            : <p style={s.hint}>🔗 يُقبل فقط رابط من shein.com — روابط المتاجر الأخرى مرفوضة</p>
          }

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
            📸 <strong>مهم:</strong> ارفع سكرين شوت من تطبيق شي إن يظهر فيه <strong>السعر المقدر (Estimated Price)</strong> بالدولار الأمريكي $ بوضوح — لا تُقبل صور بعملات أخرى.
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
                setPriceWarning(false);
                setPriceCurrencyErr(false);
                handleImage(file);
              }}
            />
            <span style={{ fontSize: 28 }}>📷</span>
            <span style={{ fontSize: 13, color: image ? PRIMARY : "#9ca3af", fontWeight: image ? 600 : 400 }}>
              {image ? image.name : "اضغط لرفع صورة السعر المقدر"}
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

          {priceCurrencyErr && !loading && (
            <div style={s.noteRed}>
              ❌ <strong>السعر المقدر ليس بالدولار الأمريكي ($).</strong><br /><br />
              لتصحيح ذلك:<br />
              ١. افتح تطبيق شي إن<br />
              ٢. اذهب إلى <strong>الإعدادات ← الدولة / المنطقة</strong><br />
              ٣. اختر <strong>الإمارات العربية المتحدة 🇦🇪</strong><br />
              ٤. تأكد أن العملة أصبحت <strong>USD $</strong> ثم أعد التصوير
            </div>
          )}
          {priceWarning && !loading && (
            <div style={s.noteRed}>
              ⚠️ لم يُعثر على <strong>"Estimated Price"</strong> في الصورة. تأكد أن السعر المقدر ظاهر بوضوح بالدولار $.
            </div>
          )}
          {errors.price && <p style={s.err}>⚠️ {errors.price}</p>}
          {price > 0 && !loading && (
            <p style={{ color: "#16a34a", fontSize: 13, margin: "6px 0 0", fontWeight: 600 }}>✅ تم استخراج السعر: {price} $</p>
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
        <div onClick={() => { if (!edfaliStep) setShowPayment(false); }} style={s.overlay}>
          <div onClick={e => e.stopPropagation()} className="pay-modal" style={s.modal}>

            {/* ── Phone Input Screen ── */}
            {edfaliStep === "phone" ? (
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

            {["mobicash", "masrefypay", "yousrpay", "saharpay"].includes(selectedMethod) && (
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
