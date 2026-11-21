// Edfali (ادفع لي) — Step 2: OnlineConfTrans confirms customer OTP
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// العنوان من المصرف، وقابل للتغيير بلا نشر.
//
// كان عنوان IP خامًا على HTTP ومقيَّدًا بقائمة عناوين، فكان أي تغيير من المصرف
// يوقف الدفع حتى يُنشر الموقع من جديد. أرسل المصرف نطاقًا على HTTPS
// (2026-09-19)، وجُعل قابلاً للضبط من البيئة حتى لا نعيد هذه الدورة.
const ENDPOINT = process.env.EDFALI_ENDPOINT || "https://edfali.bcd.ly/api/BCDUssd/NewEdfali.asmx";
// SECURITY: the Edfali system password must never be hardcoded in source (it
// was previously committed to git — rotate it with the provider). Read from env.
const SYS_PW   = process.env.EDFALI_SYS_PW;

function buildSoap(method, params) {
  const fields = Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join("");
  return `<?xml version="1.0" encoding="utf-8"?>\
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
xmlns:xsd="http://www.w3.org/2001/XMLSchema" \
xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\
<soap:Body><${method} xmlns="http://tempuri.org/">${fields}</${method}></soap:Body>\
</soap:Envelope>`;
}

// POST /api/edfali/verify
// Body: { sessionId, otp, orderId }
export async function POST(req) {
  try {
    const { otp, orderId } = await req.json();

    if (!orderId || !otp)
      return Response.json({ error: "orderId و otp مطلوبان" }, { status: 400 });

    // The session comes from the row written at initiate, never the browser:
    // a session opened for a small amount must not mark a large order paid.
    const { data: payment } = await supabaseAdmin
      .from("payments").select("id, payment_session")
      .eq("order_id", orderId).eq("method", "edfali").eq("status", "pending")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!payment?.payment_session)
      return Response.json({ error: "لم تبدأ عملية الدفع لهذا الطلب" }, { status: 400 });
    const sessionId = payment.payment_session;

    if (!process.env.EDFALI_MOBILE)
      return Response.json({ error: "متغير EDFALI_MOBILE غير موجود" }, { status: 500 });

    if (!SYS_PW)
      return Response.json({ error: "متغير EDFALI_SYS_PW غير موجود" }, { status: 500 });

    console.log(`[edfali/verify] session: ${sessionId}, order: ${orderId}`);

    const res = await fetch(ENDPOINT, {
      method:  "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction":   '"http://tempuri.org/OnlineConfTrans"',
      },
      body: buildSoap("OnlineConfTrans", {
        Mobile:    process.env.EDFALI_MOBILE,
        Pin:       otp,
        sessionID: sessionId,
        PW:        SYS_PW,
      }),
      cache: "no-store",
    });

    const xml = await res.text();
    console.log(`[edfali/verify] HTTP ${res.status} | raw:`, xml);

    const value = xml.match(/<OnlineConfTransResult>([^<]*)<\/OnlineConfTransResult>/)?.[1]?.trim() ?? "";
    console.log("[edfali/verify] result:", value);

    if (value.toUpperCase() !== "OK") {
      return Response.json({ error: `[${value}] رمز التحقق غير صحيح أو انتهت صلاحيته` }, { status: 400 });
    }

    {
      await Promise.all([
        supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
        supabaseAdmin.from("payments").update({ status: "paid" }).eq("id", payment.id),
      ]);
      console.log("[edfali/verify] order marked paid:", orderId);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("[edfali/verify] ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
