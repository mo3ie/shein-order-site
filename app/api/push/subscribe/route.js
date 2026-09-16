import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * تسجيل جهاز لاستقبال الإشعارات.
 *
 * يُستدعى مرّة عند منح الإذن، ثم مع كل قياس أو طلب جديد لربط الجهاز بما ينتظره.
 * المفتاح هو endpoint المتصفح نفسه، فإعادة التسجيل تحدّث الصفّ ولا تضاعفه.
 *
 * التسجيل مفتوح بلا حساب: أكثر الزبائن يقيسون سلة قبل أن يسجّلوا دخولهم،
 * والاشتراك بلا مالك ما زال يستحقّ أن يُخبَر بنتيجة قياسه. ومن كان داخلاً
 * يُربط اشتراكه بحسابه ليصله خبر طلباته كلها.
 */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  const sub = body?.subscription;
  const endpoint = String(sub?.endpoint || "");
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    return Response.json({ ok: false, error: "bad subscription" }, { status: 400 });
  }

  // الحساب إن وُجد — الجلسة تعيش في المتصفح، فالرمز يأتي في الترويسة.
  let userId = null;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    userId = user?.id ?? null;
  }

  const row = {
    endpoint, p256dh, auth,
    user_agent: (req.headers.get("user-agent") || "").slice(0, 200),
    last_seen: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
    ...(body.jobId ? { job_id: String(body.jobId) } : {}),
    ...(body.orderId ? { order_id: String(body.orderId) } : {}),
  };

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" });

  if (error) {
    console.error("[push/subscribe] failed:", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
