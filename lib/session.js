import { supabase } from "@/lib/supabaseClient";

/**
 * جلسة صالحة، أو لا جلسة — ولا شيء بينهما.
 *
 * الجلسة قد تموت في المتصفح وهي ظاهرة: رمزٌ مخزَّن لم يعد الخادم يعترف به
 * (تجديد فاشل، أو لسانان تسابقا على رمز التجديد نفسه). عندها يبقى الموقع
 * يرسله مع كل طلب فيُردّ: رفعُ الصورة يعود 403 "signature verification failed"
 * فنقول للزبون "فشل رفع الصورة"، والمحفظة تعود 401 فنقول "فشل في الطلب" —
 * رسالتان تصفان العَرَض لا العلّة، والزبون يعيد المحاولة إلى ما لا نهاية.
 *
 * فالقاعدة هنا: نتحقّق قبل العمل، ونحاول التجديد مرّة، فإن استعصى نمحو الجلسة
 * الميتة محليًّا. ومحوها ليس خسارة: أكثر المسارات — رفع الصورة وإنشاء الطلب —
 * تعمل بلا تسجيل دخول أصلاً، فيمضي الزبون في طلبه بدل أن يقف.
 */
export async function ensureSession() {
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session || null;
  } catch { session = null; }
  if (!session) return null;

  // هل يعترف الخادم بهذا الرمز؟ سؤال واحد يحسم، ولا يكلّف شيئًا.
  try {
    const { error } = await supabase.auth.getUser(session.access_token);
    if (!error) return session;
  } catch { /* نمضي إلى التجديد */ }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data?.session) return data.session;
  } catch { /* نمضي إلى المحو */ }

  try { await supabase.auth.signOut({ scope: "local" }); } catch {}
  return null;
}

/** ترويسة الإذن لطلبات الخادم، فارغة إن لم تكن هناك جلسة حيّة. */
export async function authHeaders() {
  const session = await ensureSession();
  return session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {};
}

/** هل انكسر هذا الخطأ بسبب الإذن؟ */
export function isAuthError(err) {
  const m = String(err?.message || err || "").toLowerCase();
  const status = Number(err?.status || err?.statusCode || 0);
  return status === 401 || status === 403 ||
    m.includes("signature verification") || m.includes("jwt") ||
    m.includes("unauthorized") || m.includes("invalid token");
}
