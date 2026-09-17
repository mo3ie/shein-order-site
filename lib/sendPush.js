import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * إرسال الإشعارات من الخادم.
 *
 * تُستدعى من ثلاثة مواضع: انتهاء قياس سلة (يبلّغنا به الخادم نفسه)، وتغيّر حالة
 * الطلب من اللوحة، والدفع. الاشتراك المنتهي يُحذف بصمت — المتصفحات تُبطل
 * الاشتراكات من تلقائها، ومحاولة الإرسال إليها مرّة بعد مرّة عبث.
 */
let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@trendstore-ly.com", pub, priv);
  configured = true;
  return true;
}

/**
 * @param {object} filter  أحد: { jobId } أو { orderId } أو { userId }
 * @param {{title:string, body:string, url?:string, tag?:string, important?:boolean}} payload
 */
export async function sendPush(filter, payload) {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID keys missing — notification skipped");
    return { sent: 0, failed: 0 };
  }

  let q = supabaseAdmin.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (filter.jobId) q = q.eq("job_id", filter.jobId);
  else if (filter.orderId) q = q.eq("order_id", filter.orderId);
  else if (filter.userId) q = q.eq("user_id", filter.userId);
  else return { sent: 0, failed: 0 };

  const { data: subs } = await q;
  if (!subs?.length) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  const dead = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body
      );
      sent++;
    } catch (e) {
      // 404/410 = اشتراك أبطله المتصفح. غيرهما قد يكون عطلاً عابرًا.
      if (e.statusCode === 404 || e.statusCode === 410) dead.push(s.id);
      else console.error(`[push] send failed (${e.statusCode}):`, e.body || e.message);
    }
  }));

  if (dead.length) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", dead);
  }
  return { sent, failed: subs.length - sent };
}

/** نصوص الإشعارات في مكان واحد، فتُقرأ كصوت واحد لا كرسائل متفرّقة. */
export const NOTICES = {
  // الإشعار يحمل رقم القياس معه.
  //
  // كان يفتح الصفحة الرئيسية وحدها، فيصل الزبون إلى شاشة "أضف سلة" ولا يرى
  // نتيجته: هو يعرف أنها جهزت — الإشعار قاله — فيظنّ الموقع أضاعها ويقيس من
  // جديد. الرقمُ في الرابط يجعل الصفحة تعرف أيّ قياس تُحضر بلا تخمين.
  priceReady: (lyd, jobId) => ({
    title: "سعر سلتك جاهز",
    body: lyd ? `الإجمالي ${Math.round(lyd)} د.ل — افتح لإكمال طلبك.` : "انتهى قياس سلتك — افتح لإكمال طلبك.",
    url: jobId ? `/?job=${encodeURIComponent(jobId)}` : "/",
    tag: "price-ready",
    important: true,
  }),
  priceFailed: () => ({
    title: "تعذّر قياس سلتك",
    body: "لم نتمكّن من قراءة سعر السلة. افتح الموقع وحاول مرّة أخرى.",
    url: "/",
    tag: "price-failed",
  }),
  paid: (lyd) => ({
    title: "تم استلام دفعتك",
    body: `${lyd ? Math.round(lyd) + " د.ل — " : ""}بدأنا العمل على طلبك.`,
    url: "/my-orders",
    tag: "order-paid",
  }),
  ordered: () => ({
    title: "تم شراء طلبك",
    body: "اشترينا سلتك من شي إن وهي قيد التجهيز.",
    url: "/my-orders",
    tag: "order-ordered",
  }),
  shipped: () => ({
    title: "تم شحن طلبك",
    body: "طلبك في الطريق — مدّة الشحن المتوقّعة من 10 إلى 15 يومًا.",
    url: "/my-orders",
    tag: "order-shipped",
  }),
  delivered: () => ({
    title: "تم تسليم طلبك",
    body: "استلمت طلبك — شكرًا لثقتك بترند.",
    url: "/my-orders",
    tag: "order-delivered",
  }),
};
