import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * حالة خدمة التسعير.
 *
 * حين تظهر للزبون "خدمة التسعير غير متاحة" لا يعرف أحد أين انقطع الخيط: الخدمة
 * نفسها، أم النفق الذي يوصلها، أم المتصفح داخلها. هذا المسار يسأل الخدمة
 * مباشرة ويعيد ما تقوله — فيصير العطل مقروءًا من لوحة الإدارة بدل التخمين.
 *
 * محمي بنفس رمز الأدمن؛ لا يُفصح عن عنوان الخدمة ولا رمزها للمتصفح.
 */
import { resolverUrl } from "@/lib/resolver";

/**
 * العنوان يُقرأ من نفس المصدر الذي يستعمله التسعير — أي من الإعدادات.
 *
 * كان يُقرأ هنا من متغيّر البيئة وحده، فصارت اللوحة تفحص نفقًا غير الذي تمرّ
 * منه طلبات الزبائن فعلاً: تقول "سليم" والخدمة واقفة، أو العكس. فحصٌ يكذب أسوأ
 * من لا فحص.
 */
const RESOLVER_TOKEN = process.env.RESOLVER_AUTH_TOKEN || "";

async function requireStaff(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("role").eq("id", user.id).single();
  return (profile?.role === "admin" || profile?.role === "employee") ? user : null;
}

export async function GET(req) {
  if (!(await requireStaff(req))) {
    return Response.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const base = await resolverUrl();
    const res = await fetch(`${base}/health`, {
      headers: RESOLVER_TOKEN ? { authorization: `Bearer ${RESOLVER_TOKEN}` } : {},
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* صفحة خطأ من وسيط، لا JSON */ }

    return Response.json({
      ok: res.ok && body?.status === "ok",
      // أيّ نفق تمرّ منه الطلبات الآن — لتُقرأ حالة العطل لا حالة عنوان قديم.
      via: base.replace(/^https?:\/\//, ""),
      httpStatus: res.status,
      latencyMs: Date.now() - started,
      // 502 من النفق يعني: الخدمة تعمل لكن لا أحد يصل إليها.
      detail: body
        ? { browser: !!body.browser?.launched, devices: body.devices ?? null, cache: body.cache?.entries ?? null }
        : { raw: text.slice(0, 120) },
    });
  } catch (e) {
    return Response.json({
      ok: false,
      httpStatus: 0,
      latencyMs: Date.now() - started,
      detail: { error: e.name === "AbortError" ? "لم تردّ خلال 12 ثانية" : e.message },
    });
  }
}
