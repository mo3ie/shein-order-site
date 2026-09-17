import { randomUUID } from "node:crypto";
import { saveQuote } from "@/lib/priceQuote";
import { startResolveJob, pollResolveJob, ResolverError, logResolve, isSheinShareUrl } from "@/lib/resolver";

// The resolver drives a real browser; keep this route on the Node runtime and
// give it room to finish two accounts.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Short-lived result cache, so a repeat submit is instant and costs SHEIN
 * nothing. The de-duplication that used to live here now sits in the resolver
 * itself: it owns the job queue, and it is the only process that survives long
 * enough to hold one.
 */
const recent = new Map(); // shareUrl -> { at, result }
// عشر دقائق لا ثلاثون: هذا المخبّأ يُري الزبون سعرًا دون أن يقيس، وسعرٌ عمره
// نصف ساعة قد لا يكون سعر شي إن الآن — فيبني الزبون قراره على رقم ماضٍ.
const RECENT_TTL_MS = 10 * 60 * 1000;

function cacheGet(url) {
  const hit = recent.get(url);
  if (!hit) return null;
  if (Date.now() - hit.at > RECENT_TTL_MS) { recent.delete(url); return null; }
  return hit.result;
}

/** Customer-facing shape. No account id, no session, no internal reason. */
function publicPayload(result) {
  return {
    status: "verified",
    currency: result.currency,
    estimatedPrice: result.estimatedPrice,
    itemCount: result.itemCount,
    source: result.source,
    checkedAt: result.checkedAt,
    // The cart's lines, so the customer can set the quantities SHEIN's share
    // link throws away: three of one shirt arrive as a single line of one.
    // The screenshot is deliberately NOT sent to the browser -- it is ~300KB
    // and only the admin needs it; the order route fetches it server-side.
    items: (result.items || []).map((i) => ({
      name: i.name,
      variant: i.variant,
      unitRetailUsd: i.unitRetailUsd,
      unitSaleUsd: i.unitSaleUsd,
      quantity: i.quantity ?? 1,
      offerEndsIn: i.offerEndsIn ?? null,
      // A cropped thumbnail (~15KB) so the customer recognises the line at a
      // glance; three near-identical shirts read the same in words.
      image: i.imageBase64 ? `data:image/png;base64,${i.imageBase64}` : null,
    })),
    breakdown: result.breakdown || null,
    itemsComplete: result.itemsComplete !== false,
  };
}

export async function POST(req) {
  const requestId = randomUUID().slice(0, 8);
  let url, quantities;
  try {
    ({ url, quantities } = await req.json());
  } catch {
    return Response.json(
      { success: false, code: "INVALID_LINK", message: "طلب غير صالح." },
      { status: 400 }
    );
  }

  const shareUrl = String(url || "").trim();
  console.log(`[resolve ${requestId}] REQUEST RECEIVED`);

  if (!isSheinShareUrl(shareUrl)) {
    console.log(`[resolve ${requestId}] rejected: not a SHEIN share link`);
    return Response.json(
      {
        success: false,
        code: "INVALID_LINK",
        message: "يجب أن يكون رابط سلة مشتركة من شي إن.",
      },
      { status: 400 }
    );
  }

  // A cart priced with quantities set is a different measurement from the same
  // link priced one-of-each, so it must never be answered from the plain cache.
  const wantsQuantities = Array.isArray(quantities) && quantities.some((q) => Number(q.wanted) > 1);
  const cached = wantsQuantities ? null : cacheGet(shareUrl);
  if (cached) {
    console.log(`[resolve ${requestId}] served from cache`);
    return Response.json({ success: true, ...cached, cached: true });
  }

  try {
    // Quantities make this a different measurement of the same link: the cart
    // is priced with them set, not with one of each.
    const qty = Array.isArray(quantities)
      ? quantities.filter((q) => Number(q.wanted) > 1)
      : null;
    const { jobId, joined } = await startResolveJob(shareUrl, { quantities: qty?.length ? qty : null });
    console.log(`[resolve ${requestId}] job=${jobId}${joined ? " (joined an existing run)" : ""}`);
    // 202: the work has started. The browser polls GET for the result — holding
    // this request open for minutes breaks on every timeout in the chain.
    return Response.json({ success: true, status: "pending", jobId }, { status: 202 });
  } catch (e) {
    const code = e instanceof ResolverError ? e.code : "RESOLVER_FAILED";
    // Detail stays in the server log; the customer gets the friendly message.
    console.error(`[resolve ${requestId}] FAILED code=${code} detail=${e.detail || e.message}`);
    return Response.json(
      { success: false, code, message: e.message },
      { status: code === "INVALID_LINK" ? 400 : 502 }
    );
  }
}


/**
 * Poll a running job.
 *
 *   GET /api/resolve-cart?job=<id>&url=<share url>
 *
 * `url` is only used to seed the result cache once the job finishes.
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job");
  const shareUrl = (searchParams.get("url") || "").trim();
  const requestId = randomUUID().slice(0, 8);

  if (!jobId) {
    return Response.json(
      { success: false, code: "INVALID_LINK", message: "طلب غير صالح." },
      { status: 400 }
    );
  }

  try {
    const out = await pollResolveJob(jobId);
    if (out.status === "pending") {
      return Response.json({
        success: true,
        status: "pending",
        elapsedMs: out.elapsedMs,
        queue: out.queue || null,
        averageMs: out.averageMs ?? null,
      });
    }
    logResolve(requestId, out.groupId, out);
    const payload = publicPayload(out);
    // Only a one-of-each result is cached against the bare link; a quantity
    // price belongs to one customer's choice, not to the link itself.
    if (shareUrl && !(out.quantitiesApplied || []).length) {
      recent.set(shareUrl, { at: Date.now(), result: payload });
    }

    // احفظ القياس لإنشاء الطلب. كان الطلب يعيد القياس متّكلاً على ذاكرة الخدمة
    // (خمس عشرة دقيقة)، والزبون يقضي أطول من ذلك في اسمه وعنوانه وصورته
    // ودفعه — فيسقط المخبّأ ويفشل الطلب على سلة قِيست للتوّ.
    if (shareUrl) {
      await saveQuote(shareUrl, out.quantitiesApplied || [], out);
    }

    return Response.json({ success: true, ...payload });
  } catch (e) {
    const code = e instanceof ResolverError ? e.code : "RESOLVER_FAILED";
    console.error(`[resolve ${requestId}] job ${jobId} FAILED code=${code} detail=${e.detail || e.message}`);
    return Response.json({ success: false, code, message: e.message }, { status: 502 });
  }
}
