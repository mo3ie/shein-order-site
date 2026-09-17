import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "node:crypto";

/**
 * السعر الذي قِسناه يُحفظ، فلا يُقاس مرّتين.
 *
 * إنشاء الطلب كان يعيد قياس السلة ليتثبّت من السعر — بحقّ، فسعرٌ يأتي من
 * المتصفح لا يُصدَّق — لكنه كان يتّكل على مخبّأ الخدمة الذي يعيش خمس عشرة
 * دقيقة. والزبون يقيس سلته، ثم يملأ اسمه وعنوانه ويرفع صورة ويختار طريقة دفع،
 * فيمضي أكثر من ذلك؛ فيسقط المخبّأ، ويبدأ قياسٌ حقيقي يستغرق دقائق، وتنتهي
 * مهلة الأربعين ثانية: "فشل الطلب" بعد انتظار، على سلة قِيست للتوّ.
 *
 * فصار القياس يُحفظ هنا لحظة تمامه — من الخادم، لا من المتصفح — ويقرأه إنشاء
 * الطلب. لا قياس ثانٍ، ولا اتّكال على ذاكرة الخدمة، ولا فرق في الأمان: الرقم
 * في الحالتين من قياسنا نحن.
 *
 * والصلاحية ساعة واحدة: أطول من رحلة الزبون، وأقصر من أن تتحرّك فيها عروض شي
 * إن تحرّكًا يُعتدّ به.
 */
const QUOTE_TTL_MINUTES = 60;

/** مفتاح الكميات — بنفس صياغة الخدمة، وإلا لم يلتقِ المحفوظ بالمطلوب. */
export function quantitiesKey(quantities) {
  if (!Array.isArray(quantities)) return "";
  // الطرفان يسمّيان الحقل باسمين: الموقع يطلب `wanted`، والخدمة تُبلّغ
  // `quantity` عمّا طبّقته فعلاً. مفتاحٌ يقبل واحدًا دون الآخر لا يلتقي بنفسه.
  return quantities
    .map((q) => ({ name: q.name, n: Number(q.wanted ?? q.quantity ?? 1) }))
    .filter((q) => q.n > 1)
    .map((q) => `${String(q.name).slice(0, 20)}x${q.n}`)
    .sort()
    .join("+");
}

/** مفتاح الرابط — الرمز المميّز داخل رابط المشاركة. */
export function linkKeyOf(shareUrl) {
  const raw = String(shareUrl || "").trim();
  const m = raw.match(/shc=([\w-]+)/) || raw.match(/\/([\w-]{8,})(?:\?|$)/);
  return (m ? m[1] : raw).slice(0, 120);
}

/** يحفظ قياسًا تمّ. الإخفاق هنا لا يُفشل شيئًا: الطلب سيقيس من جديد وقتها. */
export async function saveQuote(shareUrl, quantities, result) {
  try {
    const price = Number(result?.estimatedPrice);
    if (!Number.isFinite(price) || price <= 0) return;

    let cartShotUrl = null;
    if (result.screenshotBase64) {
      try {
        const bytes = Buffer.from(result.screenshotBase64, "base64");
        const key = `cart-shots/${Date.now()}-${randomUUID().slice(0, 8)}.png`;
        const { error } = await supabaseAdmin.storage
          .from("orders-images").upload(key, bytes, { contentType: "image/png", upsert: false });
        if (!error) {
          cartShotUrl = supabaseAdmin.storage.from("orders-images").getPublicUrl(key).data.publicUrl;
        }
      } catch { /* الصورة زينة للإدارة، لا شرط للطلب */ }
    }

    await supabaseAdmin.from("shein_price_quotes").insert({
      link_key: linkKeyOf(shareUrl),
      qty_key: quantitiesKey(quantities),
      price_usd: price,
      item_count: result.itemCount ?? null,
      breakdown: result.breakdown ?? null,
      cart_shot_url: cartShotUrl,
      price_source: result.source ?? null,
      group_id: result.groupId ? String(result.groupId) : null,
    });
  } catch (e) {
    console.error(`[quote] save failed: ${e.message}`);
  }
}

/** أحدث قياس صالح لهذه السلة بهذه الكميات، أو لا شيء. */
export async function findQuote(shareUrl, quantities) {
  try {
    const since = new Date(Date.now() - QUOTE_TTL_MINUTES * 60 * 1000).toISOString();
    const { data } = await supabaseAdmin
      .from("shein_price_quotes")
      .select("*")
      .eq("link_key", linkKeyOf(shareUrl))
      .eq("qty_key", quantitiesKey(quantities))
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  } catch (e) {
    console.error(`[quote] lookup failed: ${e.message}`);
    return null;
  }
}
