import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient }   from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: "order_id مطلوب" }, { status: 400 });
    }

    // التحقق من هوية المستخدم عبر Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return Response.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "المستخدم غير موثق" }, { status: 401 });
    }

    // جلب الطلب للتحقق منه
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, phone")
      .eq("id", order_id)
      .maybeSingle();

    if (!order) {
      return Response.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (order.user_id) {
      // الطلب مربوط بحساب آخر
      if (order.user_id === user.id) {
        return Response.json({ success: true, message: "الطلب مضاف لحسابك مسبقاً" });
      }
      return Response.json({ error: "هذا الطلب مربوط بحساب آخر" }, { status: 403 });
    }

    // ربط الطلب بالمستخدم
    await supabaseAdmin
      .from("orders")
      .update({ user_id: user.id })
      .eq("id", order_id);

    return Response.json({ success: true });
  } catch (err) {
    console.error("CLAIM ERROR:", err);
    return Response.json({ error: "خطأ في السيرفر" }, { status: 500 });
  }
}
