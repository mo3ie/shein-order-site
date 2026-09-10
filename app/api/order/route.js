import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveSharedCart, isSheinShareUrl } from "@/lib/resolver";

export const runtime = "nodejs";
// Vercel caps function duration well below a full resolve (~75s). Order
// creation therefore relies on the resolver's cache: the customer verified the
// price seconds earlier, so the same cart is still cached and comes back in a
// few seconds. A cache miss must fail fast rather than hang until the platform
// kills the request mid-write.
export const maxDuration = 60;

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

    // The price is re-derived on the server. Before the resolver existed the
    // client sent whatever OCR produced and it was stored verbatim, so a crafted
    // request could set any price for any cart. The browser's number is now
    // treated as a hint and checked against a fresh read of the real cart.
    let verifiedPrice = null;
    let priceSource = "unverified";
    if (!isSheinShareUrl(cart_link)) {
      return Response.json(
        { success: false, message: "رابط السلة غير صالح." },
        { status: 400 }
      );
    }
    try {
      const resolved = await resolveSharedCart(cart_link, { maxWaitMs: 35000 });
      verifiedPrice = resolved.estimatedPrice;
      priceSource = resolved.source;
      console.log(
        `[order] cart=${resolved.groupId} items=${resolved.itemCount}` +
        ` verified=$${verifiedPrice} account=${resolved.internal.selectedAccount}` +
        ` clientSaid=${price}`
      );
    } catch (e) {
      console.error(`[order] price verification failed: ${e.code} ${e.detail || e.message}`);
      const timedOut = e.code === "TIMEOUT";
      return Response.json(
        {
          success: false,
          code: e.code || "RESOLVER_FAILED",
          message: timedOut
            ? "انتهت صلاحية التحقق من السعر. اضغط \"تحقق من السلة والسعر\" مرة أخرى ثم أرسل الطلب."
            : e.message,
        },
        { status: 502 }
      );
    }

    // A client price above the verified one would undercharge nobody but us; a
    // client price below it would let a customer pay less than the cart costs.
    // Either way the verified figure is what gets stored.
    const clientPrice = Number(price);
    if (Number.isFinite(clientPrice) && Math.abs(clientPrice - verifiedPrice) > 0.01) {
      console.warn(
        `[order] client price ${clientPrice} != verified ${verifiedPrice} — using verified`
      );
    }

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
      // Only the verified figure is stored. `price_source` is logged rather than
      // written: adding a column to the live orders table is a schema change and
      // is not mine to make.
      price: verifiedPrice,
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