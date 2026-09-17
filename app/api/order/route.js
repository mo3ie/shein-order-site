import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveSharedCart, isSheinShareUrl } from "@/lib/resolver";
import { sendPush, NOTICES } from "@/lib/sendPush";
import { findQuote } from "@/lib/priceQuote";

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

    // 🧹 الطلب غير المدفوع يُحذف بعد ساعة.
    //
    // الطلب يُنشأ قبل الدفع (البوابة تحتاج رقم طلب تُحوّل إليه)، فمحاولة دفع
    // مهجورة كانت تترك صفًّا إلى الأبد: يظهر للأدمن كطلب لم يُشترَ، ويخلط
    // الحسابات. كان يُخفى بعد ساعة فقط؛ الآن يُحذف فعلاً. والمدفوع لا يُمسّ —
    // الشرط على الحالة "new" وحدها.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: stale } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("status", "new")
      .lt("created_at", hourAgo);

    if (stale?.length) {
      // حالة "new" وحدها ليست دليلاً كافيًا: لو نجح الدفع وفشل تحديث الحالة
      // لحظتها، لبقي الطلب "new" وهو مدفوع فعلاً. فالشرط الحقيقي هو ألّا يوجد
      // صفّ دفع ناجح — عندها فقط يُحذف.
      const ids = stale.map((o) => o.id);
      const { data: paidRows } = await supabaseAdmin
        .from("payments")
        .select("order_id")
        .in("order_id", ids)
        .in("status", ["paid", "success", "completed"]);
      const paid = new Set((paidRows || []).map((p) => p.order_id));
      const doomed = ids.filter((id) => !paid.has(id));

      if (doomed.length) {
        await supabaseAdmin.from("payments").delete().in("order_id", doomed);
        await supabaseAdmin.from("orders").delete().in("id", doomed);
        console.log(`[order] removed ${doomed.length} unpaid order(s) older than an hour`);
      }
    }

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

    const { name, phone, cart_link, price, image_url, user_id, quantities, address, note, images } = body;

    // The price is re-derived on the server. Before the resolver existed the
    // client sent whatever OCR produced and it was stored verbatim, so a crafted
    // request could set any price for any cart. The browser's number is now
    // treated as a hint and checked against a fresh read of the real cart.
    let verifiedPrice = null;
    let priceSource = "unverified";
    let breakdown = null;
    let cartShotBase64 = null;
    let extraUsd = 0;
    let cartShotUrl = null;
    if (!isSheinShareUrl(cart_link)) {
      return Response.json(
        { success: false, message: "رابط السلة غير صالح." },
        { status: 400 }
      );
    }
    // القياس المحفوظ أوّلاً.
    //
    // الرقم هنا من قياسنا نحن لا من المتصفح، سواء قرأناه من السجلّ أو أعدنا
    // القياس — فالثقة واحدة والأمان واحد. والفرق أن الزبون لا ينتظر دقائق على
    // سلة قِيست قبل قليل، ولا يُردّ بـ"فشل الطلب" لأن ذاكرة الخدمة نسيت.
    const quote = await findQuote(cart_link, Array.isArray(quantities) ? quantities : null);
    if (quote) {
      verifiedPrice = Number(quote.price_usd);
      priceSource = quote.price_source || "quote";
      breakdown = quote.breakdown || null;
      cartShotUrl = quote.cart_shot_url || null;
      console.log(
        `[order] using stored quote ${quote.id} $${verifiedPrice}` +
        ` measured ${new Date(quote.created_at).toISOString()} clientSaid=${price}`
      );
    } else try {
      // The app path takes minutes; 35s was sized for the old web reader and
      // would time out before a real cart was ever read.
      // Quantities go to the resolver, which sets them in SHEIN's own cart and
      // re-reads the checkout. SHEIN recomputes promotions and the free-shipping
      // threshold itself, which no arithmetic here could do: taking one line
      // from 1 to 3 on the test cart made shipping free and grew the promotion.
      // Vercel kills this function at maxDuration (60s) and answers with a
      // plain-text error page, which the browser then tried to read as JSON --
      // "Unexpected token 'A', \"An error o\"...". So the budget here must stay
      // well inside that limit.
      //
      // It does not need to be longer: the customer has just confirmed a price,
      // so the resolver holds that exact measurement in its cache (keyed by the
      // link AND the quantities) and answers in seconds. Only a stale or
      // evicted entry costs a real measurement, and that is what the timeout
      // message tells them to redo.
      const resolved = await resolveSharedCart(cart_link, {
        maxWaitMs: 40 * 1000,
        quantities: Array.isArray(quantities) ? quantities : null,
      });
      verifiedPrice = resolved.estimatedPrice;
      priceSource = resolved.source;
      breakdown = resolved.breakdown || null;
      cartShotBase64 = resolved.screenshotBase64 || null;

      // Quantities above the one SHEIN's share link reports are charged at that
      // line's own unit price. This is the second half of a deliberate two-step:
      // the browser shows an instant estimate, and this is the figure that is
      // actually stored and charged.
      // `verifiedPrice` already reflects the requested quantities, because the
      // cart was priced with them set. The browser's estimate is only compared
      // against it, never added to it.
      if (Array.isArray(quantities) && quantities.some((q) => Number(q.wanted) > 1)) {
        console.log(`[order] priced with quantities: ` +
          quantities.filter((q) => Number(q.wanted) > 1)
            .map((q) => `${String(q.name).slice(0, 20)}x${q.wanted}`).join(', '));
      }
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

    // Park the cart screenshot in storage so the admin can check a price against
    // what SHEIN actually displayed. A failed upload must never fail an order.
    if (cartShotBase64) {
      try {
        const bytes = Buffer.from(cartShotBase64, "base64");
        const key = `cart-shots/${Date.now()}-${randomUUID().slice(0, 8)}.png`;
        const { error: upErr } = await supabaseAdmin.storage
          .from("orders-images")
          .upload(key, bytes, { contentType: "image/png", upsert: false });
        if (upErr) throw upErr;
        cartShotUrl = supabaseAdmin.storage.from("orders-images").getPublicUrl(key).data.publicUrl;
      } catch (e) {
        console.error(`[order] cart screenshot upload failed: ${e.message}`);
      }
    }

    // What the customer actually owes, in the currency they pay in.
    //
    // Only the dollar figure was stored and the dinar total was filled in by the
    // admin later, so a fresh order showed "—" instead of its amount on
    // "طلباتي" and on the account page. The rate is read here from the same
    // settings row the site quotes from, so the stored number is the number the
    // customer was shown.
    let lydTotal = null;
    let usedRate = null;
    try {
      const { data: settings } = await supabaseAdmin
        .from("settings").select("exchange_rate, profit_rate").eq("id", 1).single();
      const rate = Number(settings?.exchange_rate);
      // العمولة من الإعدادات لا من الشيفرة. كانت مكتوبة هنا 1% بينما اللوحة
      // تحرّر رقمًا آخر، فكان زرّ العمولة يغيّر رقمًا لا يدخل حساب أحد.
      const commission = Number.isFinite(Number(settings?.profit_rate))
        ? Number(settings.profit_rate) / 100
        : 0.01;
      if (Number.isFinite(rate) && rate > 0) {
        usedRate = rate;
        lydTotal = Number((verifiedPrice * (1 + commission) * rate).toFixed(2));
      }
    } catch (e) {
      console.error(`[order] exchange rate unavailable: ${e.message}`);
    }

    // These columns are additive and may not exist on an older database, so the
    // insert falls back to the base row rather than losing the order.
    const extraColumns = {
      ...(lydTotal != null ? { price_lyd: lydTotal, final_total: lydTotal } : {}),
      // سعر الصرف المستعمل يُحفظ مع الطلب، فيبقى الرقم قابلاً للمراجعة مهما
      // تغيّرت الإعدادات بعده.
      ...(usedRate != null ? { exchange_rate: usedRate } : {}),
      // ونسبة العمولة كذلك: الطلب يُسعَّر بأرقام لحظته، ويبقى بها مهما تغيّرت
      // الإعدادات بعده. بلا ذلك يعيد الأدمن حساب طلبات الأمس بسعر اليوم.
      ...(usedCommission != null ? { profit_rate: usedCommission } : {}),
      // سعر الصرف المستعمل يُحفظ مع الطلب: الرقم يبقى قابلاً للمراجعة بعد
      // أي تغيير لاحق في الإعدادات.
      ...(usedRate != null ? { exchange_rate: usedRate } : {}),
      ...(cartShotUrl ? { cart_shot_url: cartShotUrl } : {}),
      ...(breakdown || address || extraUsd
        ? { price_breakdown: { ...(breakdown || {}), quantities: quantities || [], note: note || null, images: images || [], source: priceSource } }
        : {}),
      ...(address ? { delivery_address: [address.city, address.area, address.note].filter(Boolean).join(" — ") } : {}),
      ...(address?.geo ? { delivery_geo: address.geo } : {}),
    };

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
      ...extraColumns,
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

  // خبر الحالة يصل هاتف الزبون.
  //
  // كان يعرف بحال طلبه إن فتح الموقع وسأل، أو إن راسله موظف على واتساب يدويًّا.
  // تغيّر الحالة هنا هو اللحظة التي يستحقّ أن يُخبَر فيها، فيُرسل الإشعار من
  // موضع التغيير نفسه — لا من الواجهة، حتى لا يضيع الخبر إن غُيّرت الحالة من
  // مكان آخر. وفشل الإرسال لا يُفشل التحديث.
  if (!error && ["ordered", "shipped", "delivered", "paid"].includes(status)) {
    try {
      const notice = { ordered: NOTICES.ordered, shipped: NOTICES.shipped,
                       delivered: NOTICES.delivered, paid: NOTICES.paid }[status];
      const { data: order } = await supabaseAdmin
        .from("orders").select("user_id, final_total, price_lyd").eq("id", id).maybeSingle();

      // الجهاز المرتبط بالطلب أولاً (قد يكون زبونًا بلا حساب)، ثم أجهزة صاحبه.
      const sent = await sendPush({ orderId: id }, notice(order?.final_total ?? order?.price_lyd));
      if (!sent.sent && order?.user_id) {
        await sendPush({ userId: order.user_id }, notice(order?.final_total ?? order?.price_lyd));
      }
    } catch (e) {
      console.error(`[order] status notification failed: ${e.message}`);
    }
  }

  return Response.json({ success: true, data, error });
}