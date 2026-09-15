/**
 * حالة الطلب ومبلغه — تعريف واحد لكل الشاشات.
 *
 * كانت هذه الدوال مكتوبة ثلاث مرّات (طلباتي، حسابي، التتبّع) بألوان وتسميات
 * تختلف قليلاً بين نسخة وأخرى، فيرى الزبون الطلب نفسه بوصفين. تعريفها هنا
 * يجعل أي تعديل يصل الشاشات الثلاث معًا.
 */
export function statusLabel(s) {
  return {
    new: "جديد", paid: "مدفوع", confirmed: "مؤكد",
    ordered: "قيد المعالجة", processing: "قيد المعالجة",
    shipped: "في الشحن", delivered: "تم التسليم",
    completed: "منجز", cancelled: "ملغي",
  }[s] || s || "جديد";
}

/** لون الحالة بمتغيّرات الثيم، فيتبع الوضع الداكن مثل بقية الصفحة. */
export function statusColor(s) {
  if (["delivered", "completed"].includes(s)) return { color: "var(--t-green-ink)", bg: "var(--t-green-bg)", border: "var(--t-green-line)" };
  if (["paid", "confirmed"].includes(s))      return { color: "#a78bfa",            bg: "var(--t-chip)",     border: "var(--t-line)" };
  if (["shipped"].includes(s))                return { color: "var(--t-blue-ink)",  bg: "var(--t-blue-bg)",  border: "var(--t-blue-line)" };
  if (["ordered", "processing"].includes(s))  return { color: "var(--t-amber-ink)", bg: "var(--t-amber-bg)", border: "var(--t-amber-line)" };
  if (["cancelled"].includes(s))              return { color: "var(--t-red-ink)",   bg: "var(--t-red-bg)",   border: "var(--t-red-line)" };
  return { color: "var(--t-muted)", bg: "var(--t-chip)", border: "var(--t-line)" };
}

/** ما يدفعه الزبون فعلاً، بالعملة التي يدفع بها. */
export function lydOf(o) {
  const v = o?.final_total ?? o?.price_lyd;
  return v == null ? null : Number(v);
}

/** الطلب لا يُعدّ مدفوعًا حتى تقول بوابة (أو المحفظة) إنه كذلك. */
export function isPaid(o) {
  return !["new", "pending", null, undefined, ""].includes(o?.status);
}

export function fmtDate(d, { withTime = true } = {}) {
  if (!d) return "—";
  const dt = new Date(d);
  const date = dt.toLocaleDateString("ar-LY", { day: "2-digit", month: "long", year: "numeric" });
  return withTime
    ? `${date} — ${dt.toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" })}`
    : date;
}

/** اسم طريقة الدفع كما يعرفها الزبون. */
export function payLabel(m) {
  return {
    wallet: "المحفظة", mobicash: "موبي كاش", moamalat: "معاملات",
    edfali: "ادفع لي", masarafi: "مصرفي باي", yusor: "يسر باي", admin: "شحن إداري",
  }[m] || m || null;
}

/**
 * كم بقي من مهلة الدفع بالدقائق، أو null إن كان الطلب مدفوعًا.
 *
 * الطلب يُنشأ قبل الدفع، والطلب غير المدفوع يُحذف بعد ساعة من إنشائه. فالزبون
 * الذي أغلق الصفحة قبل الدفع يستحق أن يرى كم بقي له، لا أن يفاجأ باختفاء طلبه.
 */
export function minutesLeftToPay(o, windowMs = 60 * 60 * 1000) {
  if (!o || isPaid(o)) return null;
  const left = windowMs - (Date.now() - new Date(o.created_at).getTime());
  return left > 0 ? Math.ceil(left / 60000) : 0;
}
