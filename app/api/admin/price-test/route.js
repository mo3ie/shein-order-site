import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { startResolveJob, pollResolveJob, isSheinShareUrl } from "@/lib/resolver";

/**
 * Admin-only price diagnostics.
 *
 * The storefront deliberately shows one number in dinars. This returns
 * everything behind it — SHEIN's own lines, which account read them, the phase
 * timings and the item list — so a suspect total can be checked against what
 * SHEIN actually displayed instead of argued about.
 *
 * Admin-gated by the same bearer token the admin panel already uses; nothing
 * here is reachable from the storefront.
 */
async function requireAdmin(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false, status: 401, error: "غير مصرح" };

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { ok: false, status: 401, error: "جلسة غير صالحة" };

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "admin" && profile.role !== "employee")) {
    return { ok: false, status: 403, error: "هذه الصفحة للمشرفين فقط" };
  }
  return { ok: true, user };
}

/** POST — start a measurement. Body: { url, quantities?, noCache? } */
export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "طلب غير صالح" }, { status: 400 }); }

  const url = String(body.url || "").trim();
  if (!isSheinShareUrl(url)) {
    return Response.json({ error: "رابط السلة غير صالح" }, { status: 400 });
  }

  const qty = Array.isArray(body.quantities)
    ? body.quantities.filter((q) => Number(q.wanted) > 1)
    : null;

  try {
    const { jobId, joined } = await startResolveJob(url, {
      quantities: qty?.length ? qty : null,
      noCache: body.noCache === true,
    });
    return Response.json({ success: true, jobId, joined });
  } catch (e) {
    return Response.json({ error: e.message, code: e.code || "RESOLVER_FAILED" }, { status: 502 });
  }
}

/** GET ?job=<id> — the full, unshaped result. */
export async function GET(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const jobId = new URL(req.url).searchParams.get("job");
  if (!jobId) return Response.json({ error: "job مطلوب" }, { status: 400 });

  try {
    const out = await pollResolveJob(jobId, { raw: true });
    return Response.json({ success: true, ...out });
  } catch (e) {
    return Response.json(
      { success: false, error: e.message, code: e.code || "RESOLVER_FAILED" },
      { status: 200 }   // a failed measurement is a result to display, not an HTTP error
    );
  }
}
