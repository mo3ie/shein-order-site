import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Verify the caller is an admin/employee via Bearer token (same pattern as
// /api/admin/employees). Returns the user or null.
async function requireStaff(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("role").eq("id", user.id).single();
  return (profile?.role === "admin" || profile?.role === "employee") ? user : null;
}

// 🔹 لجلب الطلبات (GET)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // 🧹 حذف الطلبات المحذوفة بعد 30 يوم (يبقى كما هو)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await supabaseAdmin
      .from("orders")
      .delete()
      .eq("status", "deleted")
      .lt("created_at", thirtyDaysAgo.toISOString());

    // ✅ حالة 1: جلب طلب واحد (التتبع)
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle(); // 🔥 مهم

      if (error) {
        console.error("GET ORDER ERROR:", error);

        return Response.json({
          success: false,
          message: "خطأ في جلب الطلب",
        });
      }

      if (!data) {
        return Response.json({
          success: false,
          message: "الطلب غير موجود",
        });
      }

      return Response.json({ success: true, order: data });
    }

    // ✅ حالة 2: جلب كل الطلبات (الأدمن) — يتطلب صلاحية موظف/أدمن
    // بدون هذا الحاجز كان أي شخص يجلب كل بيانات الزبائن (أسماء/هواتف/روابط).
    const staff = await requireStaff(req);
    if (!staff) {
      return Response.json({ success: false, message: "غير مصرّح" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET ALL ERROR:", error);

      return Response.json({
        success: false,
        message: "خطأ في جلب الطلبات",
      });
    }

    return Response.json({ success: true, data });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return Response.json({
      success: false,
      message: "خطأ في السيرفر",
    });
  }
}

// 🔹 لإرسال الطلب (POST)
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    const { name, phone, cart_link, price, image_url, user_id } = body;

   const { data, error } = await supabaseAdmin
  .from("orders")
  .insert([
    {
      name,
      phone,
      cart_link,
      image_url,
      type: "shein",
      status: "new",
      price,
      ...(user_id ? { user_id } : {}),
    }
  ])
  .select()
  .single();

if (!data) {
  return Response.json({
    success: false,
    message: "فشل إنشاء الطلب",
  });
}

const orderId = data.id;
  

    if (error) {
  console.error("SUPABASE ERROR:", error);

  return Response.json({
    success: false, // ✅ صح
    message: error.message,
  });
}

return Response.json({
  success: true,
 id: data.id
});


  } catch (err) {
    console.error("SERVER ERROR:", err);
    return Response.json({ success: false, error: err.message });
  }
}
// 🔹 تحديث حالة الطلب — يتطلب صلاحية موظف/أدمن
export async function PUT(req){

  const staff = await requireStaff(req);
  if (!staff) {
    return Response.json({ success: false, message: "غير مصرّح" }, { status: 403 });
  }

  const body = await req.json();

  const { id, status, shipping, exchange_rate, price_lyd, final_total } = body;

const { data, error } = await supabaseAdmin
  .from("orders")
  .update({
    status,
    shipping,
    exchange_rate,
    price_lyd,
    final_total
  })
  .eq("id", id);

  return Response.json({ success: true, data, error });
}