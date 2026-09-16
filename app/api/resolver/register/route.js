import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * خدمة التسعير تسجّل عنوانها بنفسها.
 *
 * العنوان كان مثبّتًا في متغيّر بيئة على Vercel، فحين ينقطع النفق الذي يحمله
 * تقف الخدمة حتى يتدخّل إنسان وينشر من جديد. الآن يعلن الخادم عن عنوانه عند كل
 * إقلاع — نفق دائم كان أو مؤقّتًا — فيتعافى المسار وحده.
 *
 * الحارس هو رمز الخدمة نفسه (RESOLVER_AUTH_TOKEN) الذي يتشاركه الطرفان أصلاً؛
 * لا أحد سواه يستطيع تحويل الموقع إلى عنوان آخر.
 */
export async function POST(req) {
  const expected = process.env.RESOLVER_AUTH_TOKEN || "";
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || given !== expected) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let url;
  try { ({ url } = await req.json()); } catch { return Response.json({ ok: false, error: "bad body" }, { status: 400 }); }

  const clean = String(url || "").trim().replace(/\/+$/, "");
  if (!/^https:\/\/[\w.-]+(:\d+)?$/.test(clean)) {
    // HTTPS فقط: الرمز يسافر مع كل طلب، ولا يُرسل على اتصال مكشوف.
    return Response.json({ ok: false, error: "url must be https" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("settings").update({ resolver_url: clean }).eq("id", 1);
  if (error) {
    console.error("[resolver/register] failed:", error.message);
    return Response.json({ ok: false, error: "write failed" }, { status: 500 });
  }

  console.log(`[resolver/register] resolver now at ${clean}`);
  return Response.json({ ok: true, url: clean });
}
