// Adfali OnlineConfTrans via SOAP — confirms customer OTP and marks order as paid
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADFALI_ENDPOINT = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const PW = "123@xdsr$#!!";

function soapBody(method, params) {
  const fields = Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${method} xmlns="http://tempuri.org/">${fields}</${method}></soap:Body>
</soap:Envelope>`;
}

// POST /api/edfali/verify
// Body: { sessionId, otp, orderId }
export async function POST(req) {
  try {
    const { sessionId, otp, orderId } = await req.json();

    if (!sessionId || !otp) {
      return Response.json({ error: "sessionId و otp مطلوبان" }, { status: 400 });
    }

    const res = await fetch(ADFALI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": "http://tempuri.org/OnlineConfTrans" },
      body: soapBody("OnlineConfTrans", {
        Mobile:    process.env.EDFALI_MOBILE,
        Pin:       otp,
        sessionID: sessionId,
        PW,
      }),
      cache: "no-store",
    });
    const xml = await res.text();
    const value = xml.match(/<OnlineConfTransResult>([^<]*)<\/OnlineConfTransResult>/)?.[1]?.trim() ?? "";

    if (value.toUpperCase() !== "OK") {
      console.error("EDFALI VERIFY FAILED:", value, "session:", sessionId);
      return Response.json({ error: "رمز التحقق غير صحيح أو انتهت صلاحيته" }, { status: 400 });
    }

    if (orderId) {
      await Promise.all([
        supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
        supabaseAdmin.from("payments").update({ status: "paid" }).eq("order_id", orderId).eq("method", "edfali"),
      ]);
    }

    console.log("EDFALI PAID ✅ — order:", orderId);
    return Response.json({ success: true });

  } catch (err) {
    console.error("EDFALI VERIFY ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
