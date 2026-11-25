import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPush, NOTICES } from "@/lib/sendPush";
import { pollResolveJob } from "@/lib/resolver";

/**
 * خدمة التسعير تخبرنا أن قياسًا انتهى، فنُشعر صاحبه.
 *
 * القياس دقائق والزبون يغلق المتصفح — وهو تصرّف طبيعي قلنا له فيه صراحةً إن
 * بإمكانه ذلك. فبلا هذا النداء لا يعرف متى انتهى إلا بالعودة والسؤال. الخادم
 * يعرف رقم المهمة، والموقع يعرف من كان ينتظرها، فيلتقي الطرفان هنا.
 *
 * الحارس هو رمز الخدمة المشترك نفسه؛ ولا يقبل هذا المسار إلا منه.
 */
export async function POST(req) {
  const expected = process.env.RESOLVER_AUTH_TOKEN || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || given !== expected) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  const jobId = String(body?.jobId || "").trim();
  if (!jobId) return Response.json({ ok: false, error: "no jobId" }, { status: 400 });

  // The notice must say what the PAGE will say. The resolver reports "done" from its
  // own point of view, but the site still checks the result (e.g. a total far below
  // its own lines is refused as a misread) — announcing «سعر سلتك جاهز» for a price
  // the page then rejects is exactly the contradiction a customer saw. So the result
  // is read through the same shaping/validation the page uses before announcing it.
  let ok = body.status === "done";
  let usd = Number(body.priceUsd);
  if (ok) {
    try {
      const shaped = await pollResolveJob(jobId);
      if (shaped?.status === "done" && Number.isFinite(Number(shaped.estimatedPrice))) usd = Number(shaped.estimatedPrice);
    } catch (e) {
      console.warn(`[push/job-done] ${jobId} resolver said done but the site refuses it: ${e.code || ""} ${e.message || ""}`);
      ok = false;
    }
  }
  const rate = await currentRate();
  const lyd = ok && Number.isFinite(usd) && rate ? usd * rate.multiplier : null;

  const result = await sendPush(
    { jobId },
    ok ? NOTICES.priceReady(lyd, jobId) : NOTICES.priceFailed()
  );

  // القياس انتهى، فالاشتراك لم يعد ينتظره: يُفكّ الربط ليبقى الجهاز مشتركًا
  // لطلباته دون أن يتلقّى خبر قياس قديم مرّة أخرى.
  await supabaseAdmin.from("push_subscriptions").update({ job_id: null }).eq("job_id", jobId);

  console.log(`[push/job-done] ${jobId} ${body.status} → ${result.sent} device(s)`);
  return Response.json({ ok: true, ...result });
}

/** سعر الصرف والعمولة كما هما الآن، ليحمل الإشعار مبلغًا بالدينار لا بالدولار. */
async function currentRate() {
  try {
    const { data } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
    const rate = Number(data?.exchange_rate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    const commission = Number.isFinite(Number(data?.profit_rate)) ? Number(data.profit_rate) / 100 : 0.01;
    return { rate, multiplier: (1 + commission) * rate };
  } catch {
    return null;
  }
}
