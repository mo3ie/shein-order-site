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
 * والصلاحية عشرون دقيقة، لا ساعة.
 *
 * الساعة كانت تخدم الزبون البطيء وتفتح بابًا لخسارة: عروض شي إن وأسعارها
 * تتحرّك، فسلّةٌ قِيست قبل ساعة قد تكون اليوم أغلى مما نحاسب عليه — ونحن من
 * يدفع الفرق. وعشرون دقيقة تكفي رحلة الزبون المعتادة (اسم، عنوان، صورة، دفع)
 * وتُبقي الرقم قريبًا من الحقيقة. وما جاوزها يُقاس من جديد، لا يُقبل كما هو.
 */
const QUOTE_TTL_MINUTES = 20;

/** مفتاح الكميات — بنفس صياغة الخدمة، وإلا لم يلتقِ المحفوظ بالمطلوب. */
export function quantitiesKey(quantities) {
  if (!Array.isArray(quantities)) return "";
  // المفتاح يصف **التغيير**، لا الكمية.
  //
  // كان يعدّ كل صفٍّ كميته أكثر من واحد تغييرًا، فسلّةٌ فيها صنف كميته 2 في شي
  // إن أصلاً — والزبون لم يمسّها — تُحفظ بمفتاح فارغ عند القياس (فالخدمة لم
  // تغيّر شيئًا) وتُطلب بمفتاح فيه ذلك الصنف عند الطلب. فلا يلتقي المحفوظ
  // بالمطلوب، ويسقط الطلب إلى قياس جديد بلا داعٍ — وهو ما أفشل طلبًا حقيقيًّا
  // على سلّة سعرها محفوظ عندنا منذ دقيقتين.
  //
  // فالقاعدة: صفٌّ من الخدمة (`quantity` بلا `wanted`) هو تغيير طبّقته فعلاً.
  // وصفٌّ من الموقع تغييرٌ فقط إن خالف ما جاء في رابط المشاركة (`shared`).
  return quantities
    .map((q) => {
      if (q.wanted == null && q.quantity != null) return { name: q.name, n: Number(q.quantity) };
      const wanted = Number(q.wanted ?? 1);
      const shared = Number(q.shared ?? 1);
      return wanted !== shared ? { name: q.name, n: wanted } : null;
    })
    .filter((q) => q && Number.isFinite(q.n) && q.n > 0)
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

/**
 * كل ما يحتاجه الموظف ليشتري السلة كما قيست — لا الإجمالي وحده.
 *
 * كان الطلب يحفظ الرقم وتفصيله ولقطة شاشة واحدة (تُظهر سطرين أو ثلاثة فقط)،
 * فيفتح الموظف الرابط ويخمّن: أيّ مقاس؟ أيّ لون؟ كم قطعة؟ ومن أيّ حساب قِيس
 * السعر؟ هنا تُحفظ الأصناف كاملة (الاسم، اللون/المقاس، البائع، سعر القطعة،
 * الكمية، صورة مصغّرة لكل صنف كملف لا كنصّ base64 داخل الطلب)، والحساب الذي
 * قاس، ووقت القياس، وهل القائمة كاملة.
 */
export async function buildDetails(result) {
  const items = Array.isArray(result?.items) ? result.items : [];
  const stamp = `${Date.now()}-${randomUUID().slice(0, 6)}`;
  const out = await Promise.all(items.map(async (i, n) => {
    let image = null;
    if (i.imageBase64) {
      try {
        const key = `cart-items/${stamp}-${n}.png`;
        const { error } = await supabaseAdmin.storage.from("orders-images")
          .upload(key, Buffer.from(i.imageBase64, "base64"), { contentType: "image/png", upsert: false });
        if (!error) image = supabaseAdmin.storage.from("orders-images").getPublicUrl(key).data.publicUrl;
      } catch { /* صورة الصنف مساعدة لا شرط */ }
    }
    return {
      name: i.name ?? null, variant: i.variant ?? null, seller: i.seller ?? null,
      unitRetailUsd: i.unitRetailUsd ?? null, unitSaleUsd: i.unitSaleUsd ?? null,
      quantity: Number(i.quantity ?? 1) || 1, image,
    };
  }));
  return {
    items: out,
    itemCount: result?.itemCount ?? out.length,
    itemsComplete: result?.itemsComplete !== false,
    account: result?.internal?.selectedAccount ?? null,
    accountLabel: result?.internal?.selectedAccountLabel ?? null,
    appTotalUsd: result?.appTotalUsd ?? null,
    quantitiesApplied: result?.quantitiesApplied ?? [],
    checkedAt: result?.checkedAt ?? new Date().toISOString(),
  };
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
      details: await buildDetails(result).catch(() => null),
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
