"use client";

/**
 * إشعارات الهاتف من جانب المتصفح.
 *
 * القياس يستغرق دقائق ويكمل على خادمنا، فالزبون يغلق الصفحة ويمضي. بلا إشعار
 * لا يعرف متى انتهى إلا بأن يعود ويتفقّد بنفسه. هذه الوحدة تسجّل جهازه عند
 * خدمة الدفع (Web Push) وتربط التسجيل بما ينتظره: رقم القياس أو رقم الطلب.
 *
 * الإذن يُطلب عند فعل يفهمه الزبون (ضغط "تحقق من السلة") لا عند فتح الصفحة،
 * فالطلب المجرّد يُرفض ولا يُسأل ثانية.
 *
 * والقاعدة الحاكمة هنا: **الإذن ليس اشتراكًا**. كان الموقع يسجّل الجهاز مرّة
 * واحدة، حين يكون الإذن `default` — فإن مُنح الإذن ثم أخفق الحفظ (شبكة انقطعت،
 * اشتراك ألغاه المتصفح، عامل خدمة أُزيل) لم يُعَد المحاولة أبدًا: الإذن ممنوح
 * والزبون يرى ذلك، ولا إشعار يصله ما بقي. فصار كل نداء هنا يتحقّق من الاشتراك
 * نفسه لا من الإذن وحده، ويُصلحه إن غاب.
 */

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/** المتصفح يقبل مفتاح VAPID كمصفوفة بايتات لا كنصّ base64url. */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window
    && !!VAPID;
}

/** الحالة الحالية بلا أي سؤال: default | granted | denied | unsupported */
export function pushState() {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

/** آخر سبب فشل — يُقرأ من الواجهة لتقول للزبون ما جرى بدل أن تصمت. */
let lastReason = null;
export function pushFailureReason() { return lastReason; }

async function saveSubscription(sub, link) {
  const { supabase } = await import("@/lib/supabaseClient");
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ subscription: sub.toJSON(), ...link }),
  });
  // الحفظ إمّا تمّ أو لم يتمّ؛ ابتلاعُ الردّ هو ما أخفى العطل أوّل مرّة.
  if (!res.ok) throw new Error(`subscribe endpoint returned ${res.status}`);
  return true;
}

/**
 * يضمن أن هذا الجهاز مشترك فعلاً، ويربطه بما ينتظره.
 *
 * لا يسأل الإذن: يُستدعى حين يكون ممنوحًا أصلاً، عند فتح الصفحة وعند كل قياس،
 * فيُصلح أي اشتراك ضائع بلا أن يزعج الزبون بسؤال ثانٍ.
 *
 * @param {{jobId?: string, orderId?: string}} link
 */
export async function syncPush(link = {}) {
  if (!pushSupported()) { lastReason = "unsupported"; return false; }
  if (Notification.permission !== "granted") { lastReason = "not-granted"; return false; }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
    }

    await saveSubscription(sub, link);
    lastReason = null;
    return true;
  } catch (e) {
    lastReason = e?.message || String(e);
    console.error("[push] sync failed:", lastReason);
    return false;
  }
}

/**
 * يسأل الإذن إن لزم، ثم يسجّل.
 *
 * @param {{jobId?: string, orderId?: string}} link ما ينتظره هذا الجهاز
 * @returns {Promise<boolean>} هل صار مشتركًا فعلاً
 */
export async function enablePush(link = {}) {
  if (!pushSupported()) { lastReason = "unsupported"; return false; }

  try {
    if (Notification.permission === "default") {
      const asked = await Notification.requestPermission();
      if (asked !== "granted") { lastReason = "denied"; return false; }
    }
    if (Notification.permission !== "granted") { lastReason = "denied"; return false; }
  } catch (e) {
    lastReason = e?.message || String(e);
    return false;
  }

  return syncPush(link);
}

/**
 * يربط تسجيلاً قائمًا بقياس أو طلب جديد بلا أن يسأل الإذن من جديد.
 * يُستدعى كلّما بدأ قياس: التسجيل واحد، وما ينتظره يتغيّر — وإن كان التسجيل
 * ضائعًا أُعيد إنشاؤه هنا بدل أن يُهمَل الخبر.
 */
export async function linkPush(link = {}) {
  return syncPush(link);
}
