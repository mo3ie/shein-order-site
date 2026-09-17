/**
 * هل يصل الموقعُ إلى هذا العنوان؟
 *
 * الخادم كان يفحص نفقه بنفسه، فأخطأ الحكم: الطلب الخارج منه إلى نفقه يرتدّ
 * عليه عبر كلاودفلير ويفشل دائمًا (502)، بينما الزبائن يصلون بلا عطل. فظنّ
 * النفقَ الثابت ميتًا وحوّل عنه إلى نفق احتياطي لا داعي له.
 *
 * والحَكَم الصحيح هو هذا الموقع: مساره إلى خدمة التسعير هو نفسه مسار الزبون،
 * فما يراه هنا هو ما سيراه الزبون لا غير.
 *
 * الحارس رمزُ الخدمة المشترك، والعناوين المسموح فحصها محصورة في نفقَي الخدمة
 * وحدهما — حتى لا يصير هذا المسار أداةً لجلب عناوين أخرى باسم الخادم.
 */
const ALLOWED = [
  /^resolver\.trendstore-ly\.com$/,
  /^[a-z0-9-]+\.trycloudflare\.com$/,
];

export async function POST(req) {
  const expected = process.env.RESOLVER_AUTH_TOKEN || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || given !== expected) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body, url;
  try { body = await req.json(); url = body?.url; } catch { return Response.json({ ok: false, error: "bad body" }, { status: 400 }); }

  const clean = String(url || "").trim().replace(/\/+$/, "");
  let host;
  try {
    const u = new URL(clean);
    if (u.protocol !== "https:") throw new Error("not https");
    host = u.hostname;
  } catch {
    return Response.json({ ok: false, error: "bad url" }, { status: 400 });
  }
  if (!ALLOWED.some((re) => re.test(host))) {
    return Response.json({ ok: false, error: "host not allowed" }, { status: 400 });
  }

  // مسارٌ محدَّد للفحص، لأن العطل قد يصيب مسارًا دون آخر: كان `/health` يمرّ
  // بينما `/jobs` — وهو مسار الزبون فعلاً — يُردّ 502. ولا يُقبل إلا مسارا
  // الخدمة المعروفان، فلا يصير هذا بابًا لجلب ما نشاء باسم الخادم.
  const path = /^\/(health|jobs)(\/[\w-]{1,64})?$/.test(String(body?.path || ""))
    ? String(body.path) : "/health";
  const method = body?.method === "POST" ? "POST" : "GET";

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${clean}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${expected}`,
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify(body?.payload ?? {}) } : {}),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    const text = await res.text();
    let body2 = null;
    try { body2 = JSON.parse(text); } catch { /* صفحة خطأ من وسيط، لا JSON */ }
    return Response.json({
      // وصل الطلبُ الخدمةَ إن جاء ردٌّ JSON، ولو كان رفضًا: ما نقيسه الطريق.
      reached: body2 !== null,
      ok: res.ok && body2?.status === "ok",
      httpStatus: res.status,
      latencyMs: Date.now() - started,
    });
  } catch (e) {
    return Response.json({
      ok: false,
      httpStatus: 0,
      latencyMs: Date.now() - started,
      error: e.name === "AbortError" ? "timeout" : e.message,
    });
  }
}
