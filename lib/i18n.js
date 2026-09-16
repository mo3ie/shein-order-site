"use client";
import { useEffect, useState } from "react";

/**
 * عربي/إنجليزي للواجهة الزبونية.
 *
 * المفتاح هو النصّ العربي نفسه: لا جدول رموز يُخترع ولا مفتاح ينسى، وأي نصّ
 * لم يُترجم بعد يظهر بالعربية بدل أن يظهر فارغًا. الاختيار يُحفظ في المتصفح
 * فينتقل بين الشاشات الأربع، وتتغيّر جهة الصفحة معه.
 */
const EN = {
  // الترويسة والتنقّل
  "ترند · شي إن": "Trend · SHEIN",
  "طلب جديد": "New order",
  "طلباتي": "My orders",
  "المحفظة": "Wallet",
  "حسابي": "Account",
  "دخول": "Sign in",
  "خروج": "Sign out",
  "رجوع": "Back",

  // الشاشة الأولى
  "اطلب من شي إن": "Order from SHEIN",
  "وادفع بالدينار": "pay in dinars",
  "الصق رابط سلتك المشتركة، ونقرأ سعرها الحقيقي من تطبيق شي إن نفسه.":
    "Paste your shared cart link and we read its real price from the SHEIN app itself.",
  "رابط السلة المشتركة": "Shared cart link",
  "من داخل تطبيق شي إن: افتح سلتك ← زر المشاركة ← انسخ الرابط.":
    "In the SHEIN app: open your cart → Share → copy the link.",
  "تحقّق من السلة والسعر": "Check cart and price",
  "جاري التحقق...": "Checking...",
  "نقرأ سعر سلتك الآن": "Reading your cart price now",
  "يمكنك إغلاق الصفحة — العملية تُكمل على خادمنا وتستأنف عند رجوعك.":
    "You can close this page — the job finishes on our server and resumes when you return.",
  "نفتح سلتك داخل تطبيق شي إن ونقرأ السعر كما تدفعه ترند تمامًا.":
    "We open your cart inside the SHEIN app and read the price exactly as Trend pays it.",
  "تحدّد الكميات التي تريدها — رابط شي إن يرسل كل صنف بكمية واحدة دائمًا.":
    "You set the quantities — a SHEIN link always sends every line as one.",
  "تدفع بالدينار الليبي من محفظتك أو من بوابتك المفضّلة.":
    "You pay in Libyan dinars from your wallet or your preferred gateway.",
  "تتبّع طلباً سابقاً": "Track an earlier order",
  "رقم الطلب": "Order number",
  "بحث": "Track",

  // السلة
  "الإجمالي المستحق": "Total due",
  "د.ل": "LYD",
  "سلتك": "Your cart",
  "عدّل الكميات ثم أعد الحساب": "Adjust quantities, then recalculate",
  "سعر نهائي من شي إن": "Final price from SHEIN",
  "الشحن إلى ليبيا لاحقاً": "Shipping to Libya later",
  "إعادة حساب السلة": "Recalculate cart",
  "جاري إعادة حساب السلة...": "Recalculating...",
  "نضبط الكميات داخل سلتك على شي إن ونقرأ السعر منها — قد يستغرق ذلك دقيقتين إلى أربع.":
    "We set the quantities inside your SHEIN cart and read the price from it — this can take two to four minutes.",
  "هذا هو السعر النهائي من شي إن بالكميات التي اخترتها.":
    "This is the final SHEIN price for the quantities you chose.",
  "سلة أخرى": "Another cart",
  "اضغط لعرض الاسم كاملاً": "Tap to see the full name",

  // بياناتك
  "بياناتك": "Your details",
  "الاسم الكامل": "Full name",
  "أدخل اسمك الكامل": "Enter your full name",
  "رقم الهاتف الليبي": "Libyan phone number",
  "يبدأ بـ 091 أو 092 أو 093 أو 094 أو 095 — 10 أرقام":
    "Starts with 091, 092, 093, 094 or 095 — 10 digits",
  "عنوان الاستلام": "Delivery address",
  "المدينة": "City",
  "المنطقة": "Area",
  "أقرب نقطة دالة أو وصف إضافي (اختياري)": "Nearest landmark or extra detail (optional)",
  "حدّد موقعي على الخريطة": "Pin my location on the map",
  "جاري تحديد موقعك...": "Locating you...",
  "تم تحديد الموقع — اضغط للتحديث": "Location saved — tap to update",
  "عرضه على الخريطة": "open in maps",
  "لم نتمكن من قراءة موقعك. اكتب العنوان أعلاه ويكفي.":
    "We could not read your location. The typed address above is enough.",
  "متصفحك لا يدعم تحديد الموقع. اكتب العنوان أعلاه ويكفي.":
    "Your browser has no location support. The typed address above is enough.",
  "ملاحظات وصور (اختياري)": "Notes and photos (optional)",
  "اكتب أي ملاحظة تخص طلبك...": "Write any note about your order...",
  "إن كان لديك منتج تريد تعديله أو اختياره بشكل معيّن، أرسل صورته مع الشرح الذي تريده.":
    "If you want an item changed or picked a certain way, send its photo with the explanation.",
  "إضافة صور (حتى 6)": "Add photos (up to 6)",
  "حذف الصورة": "Remove photo",

  // الدفع
  "اختر طريقة الدفع": "Choose a payment method",
  "محفظتي": "My wallet",
  "الأسرع": "Fastest",
  "موبي كاش": "MobiCash",
  "معاملات": "Moamalat",
  "ادفع لي": "Edfali",
  "بطاقة مصرف الوحدة — برمز تحقق": "Wahda Bank card — with an OTP",
  "بطاقة مصرفية — نافذة آمنة": "Bank card — secure window",
  "محفظة EDFali — قد تكون غير متاحة مؤقتاً": "EDFali wallet — may be unavailable right now",
  "إغلاق": "Close",
  "رجوع ←": "Back",
  "إرسال رمز التحقق →": "Send verification code",
  "تأكيد الدفع ✓": "Confirm payment",
  "جاري التحقق...  ": "Verifying...",
  "جاري إرسال رمز التحقق...": "Sending the verification code...",
  "جاري الدفع...": "Paying...",
  "جاري الإرسال...": "Sending...",

  // المحفظة
  "رصيد محفظتك": "Your wallet balance",
  "الدفع منها بلا رمز تحقق": "Pay from it with no OTP",
  "محفظة شي إن وحدها": "SHEIN wallet only",
  "كيف تُستعمل المحفظة": "How the wallet works",
  "حركات الرصيد": "Balance movements",
  "لا حركات بعد": "No movements yet",
  "سيظهر هنا كل شحن ودفع من المحفظة": "Every top-up and payment will show here",
  "شحن رصيد": "Top-up",
  "دفع طلب": "Order payment",
  "ابدأ طلباً وادفع من المحفظة": "Start an order and pay from the wallet",
  "سجّل دخولك لعرض محفظتك": "Sign in to see your wallet",
  "الرصيد مرتبط بحسابك": "The balance belongs to your account",
  "تسجيل الدخول": "Sign in",

  // الطلبات
  "كل طلب بتفاصيله": "Every order with its details",
  "لا توجد طلبات بعد": "No orders yet",
  "لا طلبات في هذا التصنيف": "No orders in this filter",
  "ابدأ بطلبك الأول من شي إن الآن": "Start your first SHEIN order now",
  "إنشاء طلب جديد": "Create a new order",
  "إنشاء طلب": "Create an order",
  "قيد المعالجة": "Processing",
  "منجزة": "Completed",
  "عرض الكل ←": "See all",
  "جاري التحميل...": "Loading...",

  // الحالات
  "جديد": "New",
  "مدفوع": "Paid",
  "مؤكد": "Confirmed",
  "في الشحن": "Shipping",
  "تم التسليم": "Delivered",
  "منجز": "Completed",
  "ملغي": "Cancelled",
  "بانتظار الدفع": "Awaiting payment",
  "صنف": "items",
  "طلب": "orders",
  "دورك": "Your place",
  "تُقاس الآن": "being measured now",
  "أمامك": "ahead of you",
  "دقيقة": "min",
  "ثانية": "s",
  "~٥٠ ثانية": "~50s",
  "متابعة الطلب": "Continue",
  "ادفع": "Pay",
  "تقديري": "an estimate",
  "السعر أعلاه": "The price above is",
  "بعد تعديل الكميات. اطلب إعادة الحساب ليقرأ الموقع السعر النهائي من شي إن.": "after your quantity change. Ask for a recalculation so the site reads the final price from SHEIN.",
  "يجب أن يكون متجر شي إن موجّهاً إلى": "Your SHEIN store must be set to",
  "الإمارات (دبي)": "the UAE (Dubai)",
  "حتى تُقرأ الأسعار بالدولار بشكل صحيح.": "so prices are read in US dollars correctly.",
  "الرصيد": "Balance",
  "بلا رمز تحقق": "no OTP needed",
  "الرصيد لا يكفي لهذا الطلب": "Your balance does not cover this order",
  "ادفع بإحدى البوابات أدناه.": "Pay with one of the gateways below.",
  "ادفع من المحفظة": "Pay from wallet",
  "الوضع الداكن": "Dark mode",
  "يمكنك إغلاق الصفحة — سنُشعرك على هاتفك فور انتهاء القياس.": "You can close this page — we will notify your phone the moment it is done.",
  "أشعرني عند انتهاء القياس": "Notify me when it is done",
  "لصق الرابط": "Paste link",
  "مسح": "Clear",
  "أكمل الدفع": "Complete payment",
  "يُحذف الطلب بعد": "Order is removed in",
  "انتهت مهلة الدفع — سيُحذف هذا الطلب قريبًا": "The payment window has passed — this order will be removed shortly",
  "إتمام الدفع": "Complete payment",
  "أكمل دفع طلبك — الطلب غير المدفوع يُحذف بعد ساعة.": "Finish paying your order — an unpaid order is removed after an hour.",
  "الطلب غير موجود": "Order not found",
  "الطلب غير المدفوع يُحذف بعد ساعة من إنشائه. ابدأ طلبًا جديدًا.": "An unpaid order is removed an hour after it is created. Start a new one.",
  "هذا الطلب مدفوع بالفعل": "This order is already paid",
  "تتبّع الطلب": "Track the order",
  "تحقق من رمز موبي كاش": "Verify the MobiCash code",
  "رقم البطاقة": "Card number",
  "تأكيد الدفع": "Confirm payment",
  "إرسال رمز التحقق": "Send the code",
  "تعذّر الدفع من المحفظة": "Could not pay from the wallet",
  "فشل تهيئة بوابة الدفع": "Could not start the payment gateway",
  "أدخل رقم بطاقة موبي كاش": "Enter your MobiCash card number",
  "فشل إرسال رمز التحقق": "Could not send the code",
  "أدخل رمز التحقق": "Enter the code",
  "رمز التحقق خاطئ": "Wrong code",
  "تعذّر عرض كل أصناف سلتك هنا، فأُقفل تعديل الكميات حتى لا تُضبط على الصنف الخطأ. الإجمالي أعلاه صحيح — مقروء من صفحة الدفع في شي إن. لتعديل الكميات، غيّرها داخل تطبيق شي إن وأرسل الرابط من جديد.": "We could not list every line of your cart here, so quantity editing is locked to avoid changing the wrong item. The total above is correct — read from the SHEIN checkout page. To change quantities, change them in the SHEIN app and send the link again.",
  "تعذّر قراءة سعر الصرف. حدّث الصفحة أو راسلنا — لن نطلب منك الدفع برقم غير مؤكّد.": "We could not read the exchange rate. Refresh, or message us — we will not ask you to pay an unconfirmed figure.",
  "أعد الحساب لمعرفة السعر": "Recalculate to see the price",
  "أعد حساب السلة أولاً": "Recalculate the cart first",
  "جاري إعادة الحساب": "Recalculating",
  "راجع سلتك": "Review your cart",
  "الأسعار مقروءة من تطبيق شي إن نفسه — نفس الأرقام التي ندفعها.": "Prices read from the SHEIN app itself — the same figures we pay.",
  "اسمك ورقمك وعنوان الاستلام، ثم الدفع.": "Your name, number and address — then payment.",
  "إجمالي السلة": "CART TOTAL",
  "قيمة المنتجات": "Goods",
  "الشحن داخل شي إن": "Shipping",
  "عروض شي إن": "SHEIN offers",
  "مجاني": "Free",
  "بسعر المصرف اليوم": "At the bank rate today",
  "ادفع بـ": "Pay with",
  "مساعدة": "Help",
  "رسوم الشحن إلى ليبيا تُحسب لاحقاً": "Shipping to Libya is calculated later",
  "وفّرت": "You saved",
};

/**
 * هل نحن على شاشة عريضة؟
 *
 * الكمبيوتر ليس هاتفًا ممدودًا في هذا التصميم بل تخطيط آخر، فالفرق بينهما
 * يُقرأ من JS لا من CSS وحده. يبدأ بـ false ليطابق ما يرسمه الخادم، ثم
 * يصحّح نفسه عند أول رسم في المتصفح.
 */
export function useIsDesktop(minWidth = 900) {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const apply = () => setIs(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [minWidth]);
  return is;
}

export function translate(lang, text) {
  if (lang !== "en") return text;
  return EN[text] ?? text;
}

/** اللغة المختارة، محفوظة في المتصفح ومشتركة بين الشاشات. */
export function useLang() {
  const [lang, setLangState] = useState("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trend-lang");
      if (saved === "en" || saved === "ar") setLangState(saved);
    } catch { /* متصفح يمنع التخزين: تبقى العربية */ }
  }, []);

  const setLang = (next) => {
    setLangState(next);
    try { localStorage.setItem("trend-lang", next); } catch {}
  };

  return {
    lang,
    setLang,
    dir: lang === "en" ? "ltr" : "rtl",
    t: (text) => translate(lang, text),
  };
}
