"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

const PRIMARY   = "#7c3aed";
const GRADIENT  = "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)";
const BG        = "transparent";

// ── مفردات التصميم (الاتجاه الجريء) ────────────────────────────────────────
// التدرّج هو هوية الشاشة، والإجمالي يعيش داخله لا تحته: أول ما تراه العين هو
// المبلغ بالدينار. وما تحته صفحة واحدة من بطاقات بيضاء على أرضية شبه بيضاء.
const GRAD_HEAD = "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)";
const PAGE      = "var(--t-page)";
const CARD      = "var(--t-card)";
const SOFT      = "var(--t-soft)";
const INK       = "var(--t-ink)";
const MUTED     = "var(--t-muted)";
const FAINT     = "var(--t-faint)";
const LINE      = "var(--t-line)";
const CHIP      = "var(--t-chip)";
const DASH      = "var(--t-dash)";
// زر مُصمت ونصّه: يبقى التباين صحيحًا في الوضعين (أسود على أبيض، والعكس).
const SOLID     = "var(--t-solid)";
const ON_SOLID  = "var(--t-on-solid)";

// حبّة معلومة داخل الترويسة (على التدرّج، فلا لون أرضية لها إلا الشفاف الأبيض)
const hChip = {
  fontSize: 10.5, fontWeight: 700, background: "rgba(255,255,255,0.18)",
  borderRadius: 20, padding: "5px 11px", whiteSpace: "nowrap",
};

// موبي كاش قيد التجربة: تظهر للأدمن فقط، أو للجميع عند ضبط
// NEXT_PUBLIC_MOBICASH_ENABLED=true بعد تفعيل حساب البرودكشن.
const ADMIN_EMAIL = "mo3iemohamed@gmail.com";

export default function OrderPage() {
  const [cartLink,          setCartLink]          = useState("");
  const [name,              setName]              = useState("");
  const [phone,             setPhone]             = useState("");
  const [city,              setCity]              = useState("");
  const [area,              setArea]              = useState("");
  const [addressNote,       setAddressNote]       = useState("");
  const [geo,               setGeo]               = useState(null);
  const [geoState,          setGeoState]          = useState("idle");
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
  const [authUser,          setAuthUser]          = useState(null);
  const [wallet,            setWallet]            = useState(null);   // {balance}
  const [walletBusy,        setWalletBusy]        = useState(false);
  // Price now comes from the resolver service (a real SHEIN cart read on our own
  // accounts) instead of OCR on a customer screenshot.
  const [resolveState,      setResolveState]      = useState("idle"); // idle|checking|verified|failed
  const [resolveError,      setResolveError]      = useState("");
  const [itemCount,         setItemCount]         = useState(null);
  const [resolvedLink,      setResolvedLink]      = useState("");
  const [elapsed,           setElapsed]           = useState(0);
  const [queue,             setQueue]             = useState(null);
  const [cartItems,         setCartItems]         = useState([]);
  const [images,            setImages]            = useState([]);
  const [orderNote,         setOrderNote]         = useState("");
  const uploadedUrlsRef = useRef([]);
  const [quantities,        setQuantities]        = useState({});
  const [breakdown,         setBreakdown]         = useState(null);
  const [exactPrice,        setExactPrice]        = useState(null);
  const [repricing,         setRepricing]         = useState(false);
  const [openNames,         setOpenNames]         = useState({});
  const [repriceError,      setRepriceError]      = useState("");

  // A SHEIN share link carries no quantities: three of one shirt arrive as one
  // line of one, and the same shirt in another size arrives as its own line. So
  // the customer sets quantities here, and anything above the one SHEIN sent is
  // added at that line's own unit price.
  //
  // This is an ESTIMATE shown instantly. SHEIN's promotions and shipping move
  // with quantity in ways only SHEIN can compute, so the order route re-reads
  // the real cart before anything is charged.
  const extrasUSD = cartItems.reduce((sum, it, i) => {
    const want = Number(quantities[i] ?? it.quantity ?? 1);
    const extra = Math.max(0, want - (it.quantity || 1));
    const unit = Number(it.unitRetailUsd ?? it.unitSaleUsd ?? 0);
    return sum + extra * unit;
  }, 0);
  const quantityChanged = cartItems.some((it, i) => Number(quantities[i] ?? 1) !== (it.quantity || 1));

  // Once SHEIN has priced the chosen quantities, that figure replaces the
  // estimate everywhere — including the button the customer pays from.
  const base      = exactPrice != null ? exactPrice : (price || 0) + extrasUSD;
  const profit    = base * 0.01;
  const totalUSD  = base + profit;
  const priceLYD  = exchangeRate ? totalUSD * exchangeRate : 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data?.user?.email === ADMIN_EMAIL);
      setAuthUser(data?.user ?? null);
    });
  }, []);

  useEffect(() => {
    supabase.from("settings").select("exchange_rate").eq("id", 1).single()
      .then(({ data }) => { if (data) setExchangeRate(Number(data.exchange_rate)); });
  }, []);

  // The session lives in the browser client, so the token has to be sent
  // explicitly — the server has no auth cookie to read.
  const authHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const t = data?.session?.access_token;
    return t ? { authorization: `Bearer ${t}` } : {};
  };
  const loadWallet = async () => {
    const h = await authHeaders();
    if (!h.authorization) { setWallet(null); return; }
    try { setWallet(await fetch("/api/wallet", { headers: h }).then(r => r.json())); } catch {}
  };
  useEffect(() => {
    loadWallet();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadWallet());
    return () => sub?.subscription?.unsubscribe?.();
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
            setCartItems(pd.items || []);
            setBreakdown(pd.breakdown || null);
            setQuantities(Object.fromEntries((pd.items || []).map((it, i) => [i, it.quantity || 1])));
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

  /**
   * Prices the cart again with the quantities the customer chose.
   *
   * Not arithmetic: the quantities are set inside SHEIN's own cart and the
   * checkout is read again, because raising a line can cross the free-shipping
   * threshold and change the promotion — on one test cart it did both.
   */
  async function handleReprice() {
    const link = cartLink.trim();
    if (!link || repricing) return;
    setRepricing(true);
    setRepriceError("");

    const wanted = cartItems.map((it, i) => ({
      name: it.name,
      // Two lines can share a title and differ only by size, so the variant is
      // part of the identity, not decoration.
      variant: it.variant || null,
      shared: it.quantity || 1,
      wanted: Number(quantities[i] ?? it.quantity ?? 1),
    }));

    try {
      const res = await fetch("/api/resolve-cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: link, quantities: wanted }),
      });
      const data = await res.json();
      if (!data.success) {
        setRepriceError(data.message || "تعذّر قراءة السعر الجديد.");
        return;
      }
      const settle = (d) => {
        setExactPrice(Number(d.estimatedPrice));
        setBreakdown(d.breakdown || null);
        if (d.itemCount != null) setItemCount(d.itemCount);
      };
      if (data.status !== "pending") { settle(data); return; }

      const started = Date.now();
      for (;;) {
        await new Promise(r => setTimeout(r, 4000));
        setElapsed(Math.round((Date.now() - started) / 1000));
        const p = await fetch(
          `/api/resolve-cart?job=${encodeURIComponent(data.jobId)}&url=${encodeURIComponent(link)}`
        );
        const pd = await p.json();
        if (!pd.success) { setRepriceError(pd.message || "تعذّر قراءة السعر الجديد."); return; }
        if (pd.queue) setQueue({ ...pd.queue, averageMs: pd.averageMs });
        if (pd.status !== "pending") { settle(pd); return; }
        // Both devices can be busy, and a link is pinned to one account so the
        // request may wait for it. Ten minutes covers a queued run; the queue
        // position is on screen throughout.
        if (Date.now() - started > 10 * 60 * 1000) {
          setRepriceError("استغرقت قراءة السعر وقتاً أطول من المتوقع. حاول مرة أخرى.");
          return;
        }
      }
    } catch {
      setRepriceError("تعذّر الاتصال بخدمة التسعير. حاول مرة أخرى.");
    } finally {
      setRepricing(false);
      setQueue(null);
    }
  }

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
    if (!city.trim())                 errs.city     = "أدخل المدينة";
    if (!area.trim())                 errs.area     = "أدخل المنطقة";
    if (resolveState !== "verified" || !price) {
      errs.price = "اضغط \"تحقق من السلة والسعر\" أولاً";
    } else if (quantityChanged && exactPrice == null) {
      // An estimate must never be the number someone pays.
      errs.price = "اضغط \"إعادة حساب السلة\" لتأكيد السعر النهائي بالكميات التي اخترتها";
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
    setCartItems([]);
    setQuantities({});
    setBreakdown(null);
    setPrice(null);
    setItemCount(null);
    setErrors(p => ({ ...p, price: null, cartLink: null }));

    const finish = (data) => {
      try { localStorage.removeItem("trend_price_job"); } catch {}
      setQueue(null);
      setCartItems(data.items || []);
      setBreakdown(data.breakdown || null);
      setQuantities(Object.fromEntries((data.items || []).map((it, i) => [i, it.quantity || 1])));
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
    // Every attached photo goes up; the first is the order's headline image and
    // the rest ride along in the note so nothing the customer sent is lost.
    if (!images.length) return null;
    const urls = [];
    for (const file of images) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.name}`;
      const { error } = await supabase.storage.from("orders-images").upload(`public/${fileName}`, file);
      if (error) throw new Error("فشل رفع الصورة");
      urls.push(supabase.storage.from("orders-images").getPublicUrl(`public/${fileName}`).data.publicUrl);
    }
    uploadedUrlsRef.current = urls;
    return urls[0];
  }

  async function createOrder(imageUrl) {
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, phone, cart_link: cartLink, price, image_url: imageUrl, user_id: user?.id,
        // Quantities the customer set here, because SHEIN's share link sends
        // every line as one. The server re-reads the real cart before charging.
        quantities: cartItems.map((it, i) => ({
          name: it.name, variant: it.variant,
          shared: it.quantity || 1,
          wanted: Number(quantities[i] ?? it.quantity ?? 1),
          unitUsd: Number(it.unitRetailUsd ?? it.unitSaleUsd ?? 0),
        })),
        address: { city: city.trim(), area: area.trim(), note: addressNote.trim(), geo },
        note: orderNote.trim(),
        images: uploadedUrlsRef.current,
      }),
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

  /**
   * Pays for the order out of the SHEIN wallet.
   *
   * The debit is asked for first: if the balance does not cover it the server
   * refuses and no order is created, so a customer never ends up with an order
   * that was never paid for.
   */
  const handleWalletPay = async () => {
    if (walletBusy) return;
    const due = Number(priceLYD.toFixed(2));
    if (!wallet || Number(wallet.balance) + 0.001 < due) {
      alert("رصيد المحفظة لا يكفي. اشحن المحفظة أولاً.");
      return;
    }
    try {
      setWalletBusy(true);
      setSending(true);
      const imageUrl = await uploadImage();
      const oid = await createOrder(imageUrl);
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ type: "debit", amount: due, method: "wallet", order_id: oid }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "تعذّر الخصم من المحفظة");

      await supabase.from("payments").insert({
        order_id: oid, method: "wallet", status: "paid", amount: due,
      });
      setWallet(w => ({ ...(w || {}), balance: data.balance }));
      localStorage.setItem("lastOrderId", oid);
      window.location.href = `/success?orderId=${oid}&via=wallet`;
    } catch (err) {
      alert(err.message || "تعذّر الدفع من المحفظة");
      setSending(false);
    } finally {
      setWalletBusy(false);
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
    <main className="form-main" style={{ minHeight: "100vh", background: PAGE, color: INK, direction: "rtl", paddingBottom: 96 }}>

      <style>{`
        @keyframes zoomIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes spin    { to   { transform: rotate(360deg); } }
        input:focus, textarea:focus { outline: none !important; border-color: ${PRIMARY} !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
      `}</style>

      <div className="form-inner" style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}>

        {/* ── الترويسة: التدرّج هو هوية الشاشة، والإجمالي يعيش داخله ── */}
        <div style={{ background: GRAD_HEAD, color: "#fff", padding: "18px 20px 24px", position: "relative", overflow: "hidden", borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -50, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, color: "#fff", textDecoration: "none" }}>
              <img src="/logo.png" alt="" style={{ height: 30, objectFit: "contain" }} />
              <span style={{ fontWeight: 900, fontSize: 17 }}>ترند · شي إن</span>
            </a>
            <a
              href={authUser ? "/account" : "/login"}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", textDecoration: "none" }}
            >
              {authUser ? (authUser.user_metadata?.name?.[0] || authUser.email?.[0] || "ح").toUpperCase() : "دخول"[0]}
            </a>
          </div>

          <div style={{ marginTop: 20, position: "relative" }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.4 }}>
              منتجاتك وسلّتك بضغطة زر
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 6, lineHeight: 1.8 }}>
              ضع رابط سلتك من شي إن، ونحن نقرأ السعر الحقيقي من التطبيق.
            </div>
          </div>

          {/* الإجمالي داخل التدرّج: أول ما تراه العين هو المبلغ بالدينار. */}
          {price > 0 && (
            <div style={{ marginTop: 18, position: "relative" }}>
              <div style={{ fontSize: 11.5, opacity: 0.8, marginBottom: 2 }}>الإجمالي المستحق</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1 }}>
                  {priceLYD.toFixed(0)}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>د.ل</span>
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                {itemCount ? <span style={hChip}>{itemCount} صنف</span> : null}
                <span style={hChip}>{exactPrice != null ? "سعر نهائي من شي إن" : "سعر مقروء من التطبيق"}</span>
                <span style={hChip}>الشحن إلى ليبيا يُحسب لاحقاً</span>
              </div>
            </div>
          )}

          {/* الخطوات الثلاث تشرح الخدمة لمن يزور أول مرة، وتختفي بعد أول قراءة. */}
          {resolveState === "idle" && !price && (
            <div style={{ display: "flex", gap: 8, marginTop: 18, position: "relative" }}>
              {["الصق الرابط", "حدّد الكميات", "ادفع بالدينار"].map((t, i) => (
                <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.14)", borderRadius: 13, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 900, opacity: 0.75 }}>{i + 1}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 3, lineHeight: 1.5 }}>{t}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 16px 0" }}>

        {/* ── بطاقة الرابط ── */}
        <div className="form-card" style={{ background: CARD, borderRadius: 18, padding: "18px 16px", boxShadow: "0 2px 10px rgba(22,19,31,0.05)" }}>

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
              {queue && queue.ahead > 0 && !queue.running ? (
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
            <div style={{ ...s.noteRed, marginBottom: 0 }}>❌ {resolveError}</div>
          )}
        </div>{/* /بطاقة الرابط */}

          {/* SHEIN's share link always reports one of each item, whatever the
              customer actually chose, so quantities are set here. */}
          {resolveState === "verified" && cartItems.length > 0 && (
            <div style={s.qtyBox}>
              <div style={s.qtyTitle}>الكميات</div>
              <p style={s.qtyNote}>
                رابط المشاركة من شي إن يرسل كل صنف بكمية 1 دائماً. إن كنت تريد أكثر، حدّد الكمية هنا.
              </p>
              {cartItems.map((it, i) => (
                <div key={i} style={s.qtyRow}>
                  {it.image
                    ? <img src={it.image} alt="" style={s.qtyThumb} />
                    : <div style={{ ...s.qtyThumb, background: CHIP }} />}

                  {/* Titles from SHEIN run to 160 characters. Shown in full they
                      pushed one word per line on a phone and buried the price,
                      so the name is clamped to two lines and opens on tap. */}
                  <div style={s.qtyInfo}>
                    <div
                      onClick={() => setOpenNames(o => ({ ...o, [i]: !o[i] }))}
                      style={openNames[i] ? s.qtyNameFull : s.qtyName}
                      title="اضغط لعرض الاسم كاملاً"
                    >
                      {it.name}
                    </div>
                    <div style={s.qtyMeta}>
                      {it.variant ? <span style={s.qtyVariant}>{it.variant}</span> : null}
                      <strong style={{ whiteSpace: "nowrap" }}>
                        ${Number(it.unitRetailUsd ?? it.unitSaleUsd ?? 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div style={s.qtyCtrl}>
                    <button
                      type="button"
                      style={s.qtyBtn}
                      onClick={() => { setExactPrice(null); setQuantities(q => ({ ...q, [i]: Math.min(20, Number(q[i] ?? 1) + 1) })); }}
                    >+</button>
                    <span style={s.qtyVal}>{quantities[i] ?? it.quantity ?? 1}</span>
                    <button
                      type="button"
                      style={s.qtyBtn}
                      onClick={() => { setExactPrice(null); setQuantities(q => ({ ...q, [i]: Math.max(1, Number(q[i] ?? 1) - 1) })); }}
                    >−</button>
                  </div>
                </div>
              ))}
              {quantityChanged && !exactPrice && (
                <>
                  <p style={s.qtyWarn}>
                    ⚠️ السعر الظاهر الآن بعد تعديل الكميات <strong>سعر تقديري</strong>، ولا يحسب
                    السعر بالعروض. بعد تحديد كميتك اطلب <strong>إعادة حساب السلة</strong> ليظهر لك
                    السعر النهائي.
                  </p>
                  <button
                    type="button"
                    onClick={handleReprice}
                    disabled={repricing}
                    style={{ ...s.repriceBtn, opacity: repricing ? 0.6 : 1, cursor: repricing ? "not-allowed" : "pointer" }}
                  >
                    {repricing ? "⏳ جاري إعادة حساب السلة..." : "🔄 إعادة حساب السلة"}
                  </button>
                  {repricing && (
                    <p style={s.qtyNote}>
                      نضبط الكميات داخل سلتك على شي إن ونقرأ السعر منها — قد يستغرق ذلك دقيقتين إلى أربع.
                      {queue?.ahead > 0 && !queue?.running
                        ? ` أمامك ${queue.ahead} طلب في الانتظار.`
                        : ""}
                    </p>
                  )}
                  {repriceError && <div style={s.noteRed}>❌ {repriceError}</div>}
                </>
              )}
              {quantityChanged && exactPrice && (
                <div style={s.qtyOk}>
                  ✅ <strong>هذا هو السعر النهائي من شي إن بالكميات التي اخترتها.</strong>
                  {/* SHEIN's own lines are kept for the admin panel, not shown
                      here: the customer pays in dinars and a dollar breakdown
                      only invites arithmetic. */}
                </div>
              )}
            </div>
          )}
          {/* ── بطاقة بياناتك ── */}
          <div style={{ background: CARD, borderRadius: 18, padding: "18px 16px", boxShadow: "0 2px 10px rgba(22,19,31,0.05)", marginTop: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14.5, marginBottom: 12 }}>بياناتك وعنوان الاستلام</div>

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

          {/* Delivery address. Typed first, because a pin alone tells the driver
              nothing on a street with no numbers; the map is an extra, not a
              replacement. */}
          <label style={s.label}>عنوان الاستلام</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="المدينة"
              value={city}
              onChange={e => { setCity(e.target.value); setErrors(p => ({ ...p, city: null })); }}
              style={{ ...s.input, ...(errors.city ? s.inputErr : {}), flex: 1 }}
            />
            <input
              placeholder="المنطقة"
              value={area}
              onChange={e => { setArea(e.target.value); setErrors(p => ({ ...p, area: null })); }}
              style={{ ...s.input, ...(errors.area ? s.inputErr : {}), flex: 1 }}
            />
          </div>
          {(errors.city || errors.area) && <p style={s.err}>⚠️ {errors.city || errors.area}</p>}

          <input
            placeholder="أقرب نقطة دالة أو وصف إضافي (اختياري)"
            value={addressNote}
            onChange={e => setAddressNote(e.target.value)}
            style={s.input}
          />

          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) { setGeoState("unsupported"); return; }
              setGeoState("locating");
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setGeo({
                    lat: Number(pos.coords.latitude.toFixed(6)),
                    lng: Number(pos.coords.longitude.toFixed(6)),
                    accuracy: Math.round(pos.coords.accuracy),
                  });
                  setGeoState("ok");
                },
                () => setGeoState("denied"),
                { enableHighAccuracy: true, timeout: 15000 }
              );
            }}
            style={s.geoBtn}
          >
            {geoState === "locating" ? "⏳ جاري تحديد موقعك..."
              : geo ? "📍 تم تحديد الموقع — اضغط للتحديث"
              : "📍 حدّد موقعي على الخريطة"}
          </button>

          {geo && (
            <p style={s.hint}>
              ✅ موقع محفوظ (دقة ~{geo.accuracy} متر) —{" "}
              <a
                href={`https://www.google.com/maps?q=${geo.lat},${geo.lng}`}
                target="_blank" rel="noreferrer"
                style={{ color: PRIMARY, textDecoration: "underline" }}
              >عرضه على الخريطة</a>
            </p>
          )}
          {geoState === "denied" && (
            <p style={s.hint}>لم نتمكن من قراءة موقعك. اكتب العنوان أعلاه ويكفي.</p>
          )}
          {geoState === "unsupported" && (
            <p style={s.hint}>متصفحك لا يدعم تحديد الموقع. اكتب العنوان أعلاه ويكفي.</p>
          )}

          {/* One box: a note the customer writes, and as many reference photos
              as they need. Replaces the old single-screenshot upload, which
              stopped being useful once the price came from the cart link. */}
          <label style={s.label}>ملاحظات وصور (اختياري)</label>
          <textarea
            placeholder="اكتب أي ملاحظة تخص طلبك..."
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            rows={3}
            style={{ ...s.input, resize: "vertical", minHeight: 70, lineHeight: 1.7 }}
          />
          <p style={s.hint}>
            إن كان لديك منتج تريد تعديله أو اختياره بشكل معيّن، أرسل صورته مع الكتابة
            أو الشكل أو الإضافة التي تريدها بوضوح.
          </p>

          <label style={s.uploadBox}>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={e => {
                const picked = Array.from(e.target.files || []);
                if (!picked.length) return;
                setImages(prev => [...prev, ...picked].slice(0, 6));
                setErrors(p => ({ ...p, image: null, price: null }));
              }}
            />
            <span style={{ fontSize: 26 }}>📷</span>
            <span style={{ fontSize: 13, color: images.length ? PRIMARY : FAINT, fontWeight: images.length ? 600 : 400 }}>
              {images.length ? `${images.length} صورة مرفقة — أضف المزيد` : "إضافة صور (حتى 6)"}
            </span>
          </label>

          {images.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {images.map((f, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={URL.createObjectURL(f)}
                    onClick={() => setPreview(URL.createObjectURL(f))}
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, cursor: "pointer", border: "2px solid #ede9fe" }}
                  />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, k) => k !== i))}
                    style={s.imgRemove}
                    aria-label="حذف الصورة"
                  >×</button>
                </div>
              ))}
            </div>
          )}
          </div>{/* /بطاقة بياناتك */}

          {/* OCR status */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0", color: PRIMARY, fontSize: 13 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${PRIMARY}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              جاري قراءة الصورة...
            </div>
          )}

          {errors.price && <p style={s.err}>⚠️ {errors.price}</p>}
          {/* One number, in the currency the customer actually pays in. The
              commission and the dollar rate are ours to know, not theirs to
              read: showing them invited arithmetic instead of a decision. */}
          {price > 0 && (
            <div style={s.priceBox}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 3 }}>الإجمالي المستحق</div>
                  <div style={{ fontSize: 11, color: FAINT }}>
                    {itemCount ? `${itemCount} صنف · ` : ""}الشحن إلى ليبيا يُحسب لاحقاً
                  </div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1, color: INK }}>
                    {priceLYD.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED }}>د.ل</div>
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: FAINT, margin: "12px 0 0", lineHeight: 1.85 }}>
                السعر شامل قيمة المنتجات اليوم بسعر المصرف. الأسعار غير ثابتة نظراً لتغيّر
                العروض وسعر صرف الدينار.
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
          <div style={{ background: CARD, borderRadius: 18, padding: "16px", boxShadow: "0 2px 10px rgba(22,19,31,0.05)", marginTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>تتبّع طلباً سابقاً</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="أدخل رقم الطلب"
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleTrack()}
                style={{ ...s.input, marginBottom: 0, flex: 1 }}
              />
              <button onClick={handleTrack} style={{ ...s.btn, width: "auto", padding: "0 22px", boxShadow: "none" }}>
                بحث
              </button>
            </div>
          </div>

        </div>{/* /الحشو */}
      </div>

      {/* ── شريط التنقّل السفلي ── */}
      <nav className="bottom-nav" style={{
        position: "fixed", insetInlineStart: 0, insetInlineEnd: 0, bottom: 0, zIndex: 60,
        background: CARD, borderTop: `1px solid ${LINE}`,
        boxShadow: "0 -4px 20px rgba(22,19,31,0.06)",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "9px 16px 14px" }}>
          {[
            { href: "/",          label: "طلب جديد", on: true,  path: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /> },
            { href: "/my-orders", label: "طلباتي",   on: false, path: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></> },
            { href: "/account",   label: "المحفظة",  on: false, path: <><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /></> },
            { href: authUser ? "/account" : "/login", label: authUser ? "حسابي" : "دخول", on: false, path: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /></> },
          ].map((it, i) => (
            <a key={i} href={it.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, textDecoration: "none", color: it.on ? PRIMARY : FAINT }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={it.on ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round">{it.path}</svg>
              <span style={{ fontSize: 10, fontWeight: it.on ? 800 : 600 }}>{it.label}</span>
            </a>
          ))}
        </div>
      </nav>

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
                <h3 style={s.modalTitle}>موبي كاش — أدخل رقم بطاقتك</h3>
                <p style={s.modalSub}>
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
                  style={{ ...s.btn, background: mcCard.replace(/[^0-9]/g, "").length >= 5 ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : CHIP, color: mcCard.replace(/[^0-9]/g, "").length >= 5 ? "#fff" : FAINT, cursor: mcCard.replace(/[^0-9]/g, "").length >= 5 ? "pointer" : "not-allowed" }}
                >
                  إرسال رمز التحقق →
                </button>
                <button
                  onClick={() => { setMcStep(null); setMcCard(""); }}
                  style={s.ghostBtn}
                >
                  رجوع
                </button>
              </div>

            ) : mcStep === "sending" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #e0f2fe", borderTopColor: "#0284c7", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                <p style={{ color: MUTED, fontSize: 14 }}>⏳ جاري إرسال رمز التحقق...</p>
              </div>

            ) : mcStep === "otp" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
                <h3 style={s.modalTitle}>تحقق من رمز موبي كاش</h3>
                <p style={s.modalSub}>
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
                  style={{ ...s.btn, background: mcOtp.length >= 4 ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : CHIP, color: mcOtp.length >= 4 ? "#fff" : FAINT, cursor: mcOtp.length >= 4 ? "pointer" : "not-allowed" }}
                >
                  {sending ? "⏳ جاري التحقق..." : "تأكيد الدفع ✓"}
                </button>
                <button
                  onClick={() => { setMcStep("card"); setMcOtp(""); setSending(false); }}
                  style={s.ghostBtn}
                >
                  رجوع
                </button>
              </div>

            ) : edfaliStep === "phone" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏧</div>
                <h3 style={s.modalTitle}>ادفع لي — أدخل رقم هاتفك</h3>
                <p style={s.modalSub}>
                  أدخل رقم الهاتف المرتبط بحساب <strong>ادفع لي</strong><br />
                  <span style={{ color: MUTED, fontSize: 12 }}>مثال: 0912345678</span>
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
                  style={{ ...s.btn, background: edfaliPhone.replace(/\D/g, "").length >= 9 ? "linear-gradient(135deg,#7c3aed,#9333ea)" : CHIP, color: edfaliPhone.replace(/\D/g, "").length >= 9 ? "#fff" : FAINT, cursor: edfaliPhone.replace(/\D/g, "").length >= 9 ? "pointer" : "not-allowed" }}
                >
                  إرسال رمز التحقق →
                </button>
                <button
                  onClick={() => { setEdfaliStep(null); setEdfaliPhone(""); }}
                  style={s.ghostBtn}
                >
                  رجوع
                </button>
              </div>

            ) : edfaliStep === "sending" ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ color: MUTED, fontSize: 14 }}>⏳ جاري إرسال رمز التحقق...</p>
              </div>

            ) : edfaliStep === "otp" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏧</div>
                <h3 style={s.modalTitle}>تحقق من رمز ادفع لي</h3>
                <p style={s.modalSub}>
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
                  style={{ ...s.btn, background: edfaliOtp.length === 4 ? "linear-gradient(135deg,#7c3aed,#9333ea)" : CHIP, color: edfaliOtp.length === 4 ? "#fff" : FAINT, cursor: edfaliOtp.length === 4 ? "pointer" : "not-allowed" }}
                >
                  {sending ? "⏳ جاري التحقق..." : "تأكيد الدفع ✓"}
                </button>
                <button
                  onClick={() => { setEdfaliStep(null); setEdfaliOtp(""); setSending(false); }}
                  style={s.ghostBtn}
                >
                  رجوع
                </button>
              </div>
            ) : (<>

            {/* المبلغ أولاً وبأكبر خط في الورقة، ثم الطرق تحته صفًّا صفًّا. */}
            <div style={{ background: CARD, borderRadius: 18, padding: "15px 16px", boxShadow: "0 2px 10px rgba(22,19,31,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 3 }}>المبلغ المستحق</div>
                <div style={{ fontSize: 11, color: FAINT }}>
                  {itemCount ? `${itemCount} صنف · ` : ""}الشحن إلى ليبيا يُحسب لاحقاً
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1, color: INK }}>{priceLYD.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: MUTED }}>د.ل</div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>اختر طريقة الدفع</div>

            {/* المحفظة أولًا وبلون أخضر مميّز: أسرع طريق وبلا رمز تحقق. */}
            {wallet && (
              <div style={s.walletBox}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ ...s.payIcon, background: "rgba(255,255,255,0.2)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20" /><path d="M17 15h2" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontWeight: 800, fontSize: 13.5 }}>محفظتي</span>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,0.22)", borderRadius: 20, padding: "2px 8px" }}>الأسرع</span>
                    </div>
                    <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2 }}>
                      الرصيد {Number(wallet.balance || 0).toFixed(2)} د.ل — بلا رمز تحقق
                    </div>
                  </div>
                </div>
                {Number(wallet.balance || 0) + 0.001 >= priceLYD ? (
                  <button
                    onClick={handleWalletPay}
                    disabled={walletBusy || sending}
                    style={{ ...s.btn, marginTop: 12, background: "#0b5d56", color: "#fff", boxShadow: "none",
                      opacity: (walletBusy || sending) ? 0.6 : 1 }}
                  >
                    {walletBusy ? "⏳ جاري الدفع..." : `ادفع من المحفظة · ${priceLYD.toFixed(0)} د.ل`}
                  </button>
                ) : (
                  <p style={{ fontSize: 11.5, margin: "10px 0 0", lineHeight: 1.85, background: "rgba(255,255,255,0.16)", borderRadius: 11, padding: "9px 11px" }}>
                    الرصيد لا يكفي لهذا الطلب ({priceLYD.toFixed(0)} د.ل). ادفع بإحدى البوابات أدناه.
                  </p>
                )}
              </div>
            )}

            {/* MobiCash is live in production, so it is no longer gated behind
                an env flag or the admin account. */}
            <button onClick={() => setMcStep("card")} disabled={sending} style={s.payBtn}>
              <div style={s.payIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={s.payName}>موبي كاش</div>
                <div style={s.payNote}>بطاقة مصرف الوحدة — برمز تحقق</div>
              </div>
              <span style={s.payAmount}>{priceLYD.toFixed(0)} د.ل</span>
            </button>

            {/* Moamalat — dedicated button */}
            <button onClick={handleMoamalat} disabled={sending} style={s.payBtn}>
              <div style={s.payIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-6 9 6" /><path d="M5 10v9" /><path d="M19 10v9" /><path d="M3 19h18" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={s.payName}>معاملات</div>
                <div style={s.payNote}>بطاقة مصرفية — نافذة آمنة</div>
              </div>
              <span style={s.payAmount}>{priceLYD.toFixed(0)} د.ل</span>
            </button>

            {/* ادفع لي آخر القائمة وبتنبيه: خادمها ما زال متعذّرًا، فلا يُقدَّم
                للزبون طريقٌ يرجّح أن يفشل به قبل الطرق العاملة. */}
            <button onClick={() => setEdfaliStep("phone")} disabled={sending} style={{ ...s.payBtn, opacity: 0.75 }}>
              <div style={s.payIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={s.payName}>ادفع لي</div>
                <div style={s.payNote}>محفظة EDFali — قد تكون غير متاحة مؤقتاً</div>
              </div>
              <span style={s.payAmount}>{priceLYD.toFixed(0)} د.ل</span>
            </button>

            <button onClick={() => setShowPayment(false)} style={s.ghostBtn}>
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
// One vocabulary, defined once: white cards on #f7f7fb, 16–18px radii, a soft
// single shadow instead of borders, and violet reserved for what is actionable.
const s = {
  label: {
    display: "block",
    fontSize: 12.5,
    fontWeight: 800,
    color: INK,
    marginBottom: 7,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    marginBottom: 14,
    borderRadius: 13,
    border: `1.5px solid ${LINE}`,
    fontSize: 14,
    color: INK,
    background: CARD,
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  inputErr: {
    borderColor: "#f87171",
    background: "var(--t-red-bg)",
  },
  btn: {
    width: "100%",
    padding: "15px",
    background: GRAD_HEAD,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
    fontFamily: "inherit",
    boxShadow: "0 6px 18px rgba(124,58,237,0.28)",
    transition: "opacity 0.15s",
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: `1.5px dashed ${DASH}`,
    borderRadius: 14,
    padding: "22px 16px",
    cursor: "pointer",
    background: SOFT,
    transition: "border-color 0.15s",
    marginBottom: 4,
  },
  uploadBoxErr: {
    borderColor: "#f87171",
    background: "var(--t-red-bg)",
  },
  verifyBtn: {
    width: "100%", padding: "15px 16px", marginTop: 4, borderRadius: 14,
    border: "none", background: GRAD_HEAD, color: "#fff",
    fontSize: 15, fontWeight: 800, fontFamily: "inherit",
    boxShadow: "0 6px 18px rgba(124,58,237,0.28)",
  },
  okBox: {
    marginTop: 12, padding: "12px 14px", borderRadius: 14,
    background: "var(--t-green-bg)", border: "1px solid var(--t-green-line)", color: "var(--t-green-ink)",
    fontSize: 12.5, lineHeight: 1.8, fontWeight: 600,
  },
  // Waiting is part of the design, not an empty screen: the place in line, the
  // expected time, and that the page may be closed.
  queueBox: {
    marginTop: 12, padding: "15px 16px", borderRadius: 16,
    background: CARD, boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
    color: INK, fontSize: 12.5, lineHeight: 1.85,
    border: `1px solid ${LINE}`,
  },
  queuePos: { fontWeight: 800, fontSize: 13.5, color: INK },
  queueSub: { color: MUTED, fontSize: 12, lineHeight: 1.9, marginTop: 3 },
  qtyBox: {
    marginTop: 14, padding: "16px", borderRadius: 18,
    background: CARD, boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
  },
  qtyTitle: { fontWeight: 900, fontSize: 14.5, color: INK, marginBottom: 4 },
  qtyNote: { fontSize: 12, color: MUTED, lineHeight: 1.85, margin: "0 0 10px" },
  qtyRow: {
    display: "flex", alignItems: "flex-start", gap: 11,
    padding: "13px 0", borderTop: `1px solid ${LINE}`,
  },
  // A phone gives this row about 300px; the picture and the stepper are fixed,
  // so the text column has to be free to shrink or the title wraps one word
  // per line. minWidth:0 is what actually allows that inside a flex row.
  qtyInfo: { flex: "1 1 auto", minWidth: 0 },
  qtyThumb: {
    width: 58, height: 58, borderRadius: 13, objectFit: "cover",
    flexShrink: 0, border: `1px solid ${LINE}`,
  },
  qtyName: {
    fontSize: 12.5, lineHeight: 1.6, cursor: "pointer", color: INK, fontWeight: 600,
    overflow: "hidden", display: "-webkit-box",
    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
  },
  qtyNameFull: { fontSize: 12.5, lineHeight: 1.6, cursor: "pointer", color: INK, fontWeight: 600 },
  qtyVariant: {
    background: CHIP, borderRadius: 20, padding: "2px 9px",
    fontSize: 11, color: MUTED, fontWeight: 700, whiteSpace: "nowrap",
  },
  qtyMeta: {
    fontSize: 12, color: MUTED, marginTop: 6,
    display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
  },
  imgRemove: {
    position: "absolute", top: -6, insetInlineEnd: -6, width: 20, height: 20,
    borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff",
    fontSize: 13, lineHeight: "20px", cursor: "pointer", padding: 0, fontFamily: "inherit",
  },
  // Vertical stepper: one tall touch target per direction, the way a phone
  // wants it, instead of two small buttons side by side.
  qtyCtrl: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 2, flexShrink: 0, background: CHIP, borderRadius: 13, padding: 3,
  },
  qtyBtn: {
    width: 30, height: 26, borderRadius: 10, border: "none",
    background: CARD, color: PRIMARY, fontSize: 15, lineHeight: 1,
    cursor: "pointer", fontWeight: 800,
    fontFamily: "inherit", padding: 0, flexShrink: 0,
    boxShadow: "0 1px 3px rgba(22,19,31,0.08)",
  },
  qtyVal: { minWidth: 20, textAlign: "center", fontWeight: 900, fontSize: 14, color: INK, padding: "3px 0" },
  geoBtn: {
    width: "100%", marginTop: 2, marginBottom: 4, padding: "13px 14px", borderRadius: 13,
    border: `1.5px dashed ${DASH}`, background: SOFT, color: PRIMARY,
    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  // The wallet gets its own colour: it is the fastest path and the only one
  // without an OTP, so it should not look like the gateways.
  walletBox: {
    marginBottom: 12, padding: "14px 15px", borderRadius: 16,
    background: "linear-gradient(140deg,#0f766e,#14b8a6)", color: "#fff",
    boxShadow: "0 6px 18px rgba(15,118,110,0.22)",
  },
  repriceBtn: {
    width: "100%", marginTop: 10, padding: "13px 14px", borderRadius: 13,
    border: "none", background: SOLID, color: ON_SOLID,
    fontSize: 13.5, fontWeight: 800, fontFamily: "inherit",
  },
  qtyOk: {
    marginTop: 10, marginBottom: 0, fontSize: 12.5, lineHeight: 1.8,
    color: "var(--t-green-ink)", background: "var(--t-green-bg)", border: "1px solid var(--t-green-line)",
    borderRadius: 13, padding: "11px 12px",
  },
  qtyWarn: {
    marginTop: 10, marginBottom: 0, fontSize: 12.5, lineHeight: 1.8,
    color: "var(--t-amber-ink)", background: "var(--t-amber-bg)", border: "1px solid var(--t-amber-line)",
    borderRadius: 13, padding: "11px 12px",
  },
  noteBlue: {
    background: "var(--t-blue-bg)",
    border: "1px solid var(--t-blue-line)",
    borderRadius: 13,
    padding: "12px 14px",
    fontSize: 12.5,
    color: "var(--t-blue-ink)",
    lineHeight: 1.8,
    marginBottom: 16,
  },
  noteYellow: {
    background: "var(--t-amber-bg)",
    border: "1px solid var(--t-amber-line)",
    borderRadius: 13,
    padding: "12px 14px",
    fontSize: 12.5,
    color: "var(--t-amber-ink)",
    lineHeight: 1.8,
    marginBottom: 12,
  },
  noteRed: {
    background: "var(--t-red-bg)",
    border: "1px solid var(--t-red-line)",
    borderRadius: 13,
    padding: "12px 14px",
    fontSize: 12.5,
    color: "var(--t-red-ink)",
    lineHeight: 1.8,
    margin: "10px 0",
  },
  err: {
    color: "#ef4444",
    fontSize: 11.5,
    fontWeight: 600,
    margin: "-9px 0 10px 2px",
  },
  hint: {
    color: FAINT,
    fontSize: 11.5,
    lineHeight: 1.85,
    margin: "-9px 0 14px 2px",
  },
  priceBox: {
    marginTop: 16,
    padding: "16px",
    borderRadius: 18,
    background: CARD,
    boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
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
    background: "rgba(22,19,31,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
    padding: 16,
  },
  modal: {
    background: PAGE,
    padding: "24px 20px",
    borderRadius: 22,
    width: 370,
    maxWidth: "92vw",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "zoomIn 0.2s ease",
    boxShadow: "0 24px 60px rgba(22,19,31,0.28)",
    direction: "rtl",
    color: INK,
  },
  // A payment method is a row, not a coloured slab: icon tile, name, one line
  // of explanation, and the amount at the end.
  payBtn: {
    width: "100%",
    padding: "13px 14px",
    marginBottom: 9,
    borderRadius: 15,
    background: CARD,
    border: `1.5px solid ${LINE}`,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    color: INK,
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "right",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  payIcon: {
    width: 38, height: 38, borderRadius: 12, background: CHIP,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 19,
  },
  payName: { fontSize: 13.5, fontWeight: 800, color: INK },
  payNote: { fontSize: 11.5, color: MUTED, marginTop: 2 },
  payAmount: { marginInlineStart: "auto", fontWeight: 900, fontSize: 13, color: INK, whiteSpace: "nowrap" },
  modalTitle: { fontSize: 17, fontWeight: 900, color: INK, margin: "0 0 6px" },
  modalSub: { fontSize: 12.5, color: MUTED, marginBottom: 16, lineHeight: 1.8 },
  ghostBtn: {
    width: "100%", marginTop: 10, padding: 12, background: "none",
    border: `1.5px solid ${LINE}`, borderRadius: 13, color: MUTED,
    cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
  },
};
