import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    // ✅ حالة 2: جلب كل الطلبات (الأدمن)
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

    const user = null;

    const { name, phone, cart_link, price, image_url } = body;

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
// 🔹 تحديث حالة الطلب
export async function PUT(req){

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