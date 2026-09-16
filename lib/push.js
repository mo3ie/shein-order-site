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

/**
 * يسجّل الجهاز ويربطه بما ينتظره.
 *
 * @param {{jobId?: string, orderId?: string}} link ما ينتظره هذا الجهاز
 * @returns {Promise<boolean>} هل صار مشتركًا فعلاً
 */
export async function enablePush(link = {}) {
  if (!pushSupported()) return false;

  try {
    if (Notification.permission === "default") {
      const asked = await Notification.requestPermission();
      if (asked !== "granted") return false;
    }
    if (Notification.permission !== "granted") return false;

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
    }

    const { supabase } = await import("@/lib/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ subscription: sub.toJSON(), ...link }),
    });
    return true;
  } catch {
    // منع الإشعارات ليس عطلاً: الموقع يكمل عمله بلا شكوى.
    return false;
  }
}

/**
 * يربط تسجيلاً قائمًا بقياس أو طلب جديد بلا أن يسأل الإذن من جديد.
 * يُستدعى كلّما بدأ قياس: التسجيل واحد، وما ينتظره يتغيّر.
 */
export async function linkPush(link = {}) {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    if (!sub) return false;

    const { supabase } = await import("@/lib/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(session ? { authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ subscription: sub.toJSON(), ...link }),
    });
    return true;
  } catch {
    return false;
  }
}
