// Edfali (ادفع لي) — Step 2: OnlineConfTrans confirms customer OTP
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ENDPOINT = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const SYS_PW   = "123@xdsr$#!!";

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
    const { sessionId, otp, orderId } = await req.json();

    if (!sessionId || !otp)
      return Response.json({ error: "sessionId و otp مطلوبان" }, { status: 400 });

    if (!process.env.EDFALI_MOBILE)
      return Response.json({ error: "متغير EDFALI_MOBILE غير موجود" }, { status: 500 });

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

    if (orderId) {
      await Promise.all([
        supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
        supabaseAdmin.from("payments").update({ status: "paid" }).eq("order_id", orderId).eq("method", "edfali"),
      ]);
      console.log("[edfali/verify] order marked paid:", orderId);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("[edfali/verify] ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
