/**
 * Client for the Trend SHEIN Resolver service.
 *
 * The resolver drives real SHEIN accounts with a headless browser, which cannot
 * run inside a Vercel serverless function — so it lives as a separate service
 * and is reached over HTTP. This module is the only place that knows its
 * address, and it is server-side only: the browser never learns the URL, the
 * token, or which Trend account produced a price.
 */

const RESOLVER_URL = process.env.RESOLVER_URL || "http://localhost:8787";
const RESOLVER_TOKEN = process.env.RESOLVER_AUTH_TOKEN || "";
// Two accounts, cleared and measured one after another, take a while.
const TIMEOUT_MS = Number(process.env.RESOLVER_TIMEOUT_MS || 240000);

/** Customer-facing message per failure. Never leaks account or session detail. */
const CUSTOMER_MESSAGE = {
  INVALID_LINK: "الرابط غير صالح — تأكد أنه رابط سلة مشتركة من شي إن.",
  CART_EMPTY: "السلة فارغة — تأكد من الرابط.",
  PRICE_NOT_FOUND: "تعذّر قراءة سعر هذه السلة. حاول مرة أخرى بعد قليل.",
  CART_CLEAR_FAILED: "تعذّر تجهيز النظام للتسعير. حاول مرة أخرى بعد قليل.",
  CART_EMPTY_VERIFICATION_FAILED: "تعذّر تجهيز النظام للتسعير. حاول مرة أخرى بعد قليل.",
  CART_IMPORT_MISMATCH: "تعذّر التحقق من محتويات السلة. حاول مرة أخرى بعد قليل.",
  LOGIN_REQUIRED: "الخدمة غير متاحة حالياً. حاول لاحقاً.",
  SESSION_EXPIRED: "الخدمة غير متاحة حالياً. حاول لاحقاً.",
  CAPTCHA: "الخدمة مشغولة حالياً. انتظر دقيقة وحاول مرة أخرى.",
  TIMEOUT: "استغرق التحقق وقتاً أطول من المتوقع. حاول مرة أخرى.",
  REGION_MISMATCH: "هذا الرابط غير مدعوم — تأكد أنه رابط سلة مشتركة.",
  RESOLVER_UNREACHABLE: "خدمة التسعير غير متاحة حالياً. حاول لاحقاً.",
  RESOLVER_FAILED: "تعذّر التحقق من السعر حالياً. حاول مرة أخرى بعد قليل.",
};

export class ResolverError extends Error {
  constructor(code, detail) {
    super(CUSTOMER_MESSAGE[code] || CUSTOMER_MESSAGE.RESOLVER_FAILED);
    this.code = code;
    this.detail = detail; // server logs only — never sent to the browser
  }
}

/** Accepts the shortened share link, the resolved landing URL, or a bare token. */
export function isSheinShareUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) return false;
  if (/^\d_[A-Za-z0-9]+$/.test(raw)) return true;
  try {
    const u = new URL(raw);
    if (!/(^|\.)shein\.com$/i.test(u.hostname)) return false;
    return !!(u.searchParams.get("shc") || u.searchParams.get("group_id"));
  } catch {
    return false;
  }
}

/**
 * Resolves a shared cart to the best price across Trend's account pool.
 *
 * @returns {Promise<{estimatedPrice:number, currency:string, itemCount:number,
 *                    source:string, groupId:string|null, checkedAt:string,
 *                    internal:object}>}
 *   `internal` is for server logs and DB columns only. Everything else is safe
 *   to show a customer.
 */
/** Shared fetch wrapper: adds auth, a timeout, and JSON parsing that survives an
 *  HTML error page from a proxy in front of the resolver. */
async function call(path, init = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${RESOLVER_URL}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(RESOLVER_TOKEN ? { authorization: `Bearer ${RESOLVER_TOKEN}` } : {}),
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      // A gateway timing out returns an HTML page, not JSON. Say so plainly
      // instead of surfacing "Unexpected token '<'".
      throw new ResolverError("RESOLVER_UNREACHABLE", `non-JSON from resolver (HTTP ${res.status})`);
    }
    return { res, body };
  } catch (e) {
    if (e instanceof ResolverError) throw e;
    throw new ResolverError(e.name === "AbortError" ? "TIMEOUT" : "RESOLVER_UNREACHABLE", e.message);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Starts a resolve job. Returns immediately with a job id.
 *
 * Resolving takes minutes; nothing in the chain tolerates a request held open
 * that long (the Cloudflare tunnel cuts at 100s). So the work is started here
 * and collected by polling.
 */
export async function startResolveJob(shareUrl, { quantities = null, noCache = false } = {}) {
  if (!isSheinShareUrl(shareUrl)) throw new ResolverError("INVALID_LINK", shareUrl);
  const { res, body } = await call("/jobs", {
    method: "POST",
    body: JSON.stringify({
      url: shareUrl, clearCart: true,
      ...(quantities ? { quantities } : {}),
      ...(noCache ? { noCache: true } : {}),
    }),
  });
  if (res.status !== 202 || !body.jobId) {
    const code = body?.error?.code || "RESOLVER_FAILED";
    throw new ResolverError(CUSTOMER_MESSAGE[code] ? code : "RESOLVER_FAILED", body?.error?.message);
  }
  return { jobId: body.jobId, joined: !!body.joined };
}

/** Polls one job. Returns {status:'pending'} or the finished cart. */
export async function pollResolveJob(jobId, { raw = false } = {}) {
  const { body } = await call(`/jobs/${encodeURIComponent(jobId)}`, { method: "GET" });
  if (raw && body.status !== "pending" && body.status !== "error") {
    return { status: "done", raw: body };
  }
  if (body.status === "pending") {
    // Carry the queue through so the customer sees where they stand instead of
    // an unexplained wait: pricing runs on one device, so the line is real.
    return {
      status: "pending",
      elapsedMs: body.elapsedMs,
      queue: body.queue || null,
      averageMs: body.averageMs ?? null,
    };
  }
  if (body.status === "error") {
    const code = body.error?.code || "RESOLVER_FAILED";
    throw new ResolverError(CUSTOMER_MESSAGE[code] ? code : "RESOLVER_FAILED", body.error?.message);
  }
  return { status: "done", quantitiesApplied: body.quantitiesApplied || [], ...shapeResult(body) };
}

/** Maps the resolver payload into what the site needs. */
function shapeResult(body) {
  // Accept both: the resolver reports job state in `status` and the cart's own
  // state in `cartStatus`; older builds put the cart status in `status`.
  if (body?.status !== "done" && body?.status !== "success") {
    throw new ResolverError("RESOLVER_FAILED", `unexpected resolver status ${body?.status}`);
  }
  if (!body.selected) throw new ResolverError("PRICE_NOT_FOUND", "no account produced a price");
  const price = Number(body.selected.priceUsd);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ResolverError("PRICE_NOT_FOUND", `bad price: ${body.selected.priceUsd}`);
  }
  return {
    estimatedPrice: price,
    // SHEIN's own lines behind that price. The customer sees only a total; the
    // admin needs to be able to check it against what SHEIN displayed.
    breakdown: body.breakdown || null,
    appTotalUsd: body.appTotalUsd ?? null,
    // Cart lines, so the customer can set quantities SHEIN's share link drops.
    items: Array.isArray(body.items) ? body.items : [],
    screenshotBase64: body.screenshotBase64 || null,
    currency: body.currency || "USD",
    itemCount: body.itemCount ?? null,
    source: body.selected.priceSource,
    groupId: body.groupId ?? null,
    checkedAt: body.checkedAt,
    internal: {
      selectedAccount: body.selected.accountId,
      reason: body.selected.reason,
      accounts: (body.accounts || []).map((a) => ({
        accountId: a.accountId,
        status: a.status,
        errorCode: a.errorCode ?? null,
        items: a.actualItems ?? null,
        estimated: a.estimatedPriceUsd ?? null,
      })),
    },
  };
}

/**
 * Runs a resolve to completion by starting a job and polling it.
 *
 * Used server-side where waiting is acceptable (order creation). The customer
 * path uses startResolveJob/pollResolveJob directly so the browser can show
 * progress instead of hanging.
 */
export async function resolveSharedCart(shareUrl, { maxWaitMs = TIMEOUT_MS, quantities = null } = {}) {
  const { jobId } = await startResolveJob(shareUrl, { quantities });
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    const out = await pollResolveJob(jobId);
    if (out.status === "done") return out;
    if (Date.now() > deadline) throw new ResolverError("TIMEOUT", `job ${jobId} still pending`);
  }
}

/** One-line server log of a resolve. No cookies, no tokens, no account creds. */
export function logResolve(requestId, groupId, result) {
  console.log(`[resolve ${requestId}] groupId=${groupId} items=${result.itemCount}`);
  for (const a of result.internal.accounts) {
    console.log(
      `[resolve ${requestId}]   ${a.accountId}: status=${a.status}` +
        ` items=${a.items ?? "-"} estimated=${a.estimated != null ? "$" + a.estimated : "-"}` +
        (a.errorCode ? ` error=${a.errorCode}` : "")
    );
  }
  console.log(
    `[resolve ${requestId}] BEST=${result.internal.selectedAccount}` +
      ` PRICE=$${result.estimatedPrice} SOURCE=${result.source}`
  );
}
