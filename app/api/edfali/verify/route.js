// Adfali OnlineConfTrans — confirms customer OTP and marks order as paid
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ADFALI_URL = "http://62.240.55.2:6187/BCDUssd/NewEdfali.asmx";
const PW = "123@xdsr$#!!";

function extractXml(xml) {
  return xml.match(/<string[^>]*>([^<]*)<\/string>/)?.[1]?.trim() ?? "";
}

// POST /api/edfali/verify
// Body: { sessionId, otp, orderId }
// Calls Adfali OnlineConfTrans, updates order status on success
export async function POST(req) {
  try {
    const { sessionId, otp, orderId } = await req.json();

    if (!sessionId || !otp) {
      return Response.json({ error: "sessionId و otp مطلوبان" }, { status: 400 });
    }

    const mobile = process.env.EDFALI_MOBILE;

    const url = new URL(`${ADFALI_URL}/OnlineConfTrans`);
    url.searchParams.set("Mobile",    mobile);
    url.searchParams.set("Pin",       otp);
    url.searchParams.set("sessionID", sessionId);
    url.searchParams.set("PW",        PW);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const xml = await res.text();
    const value = extractXml(xml);

    if (value !== "OK") {
      console.error("EDFALI VERIFY FAILED:", value, "session:", sessionId);
      return Response.json({ error: "رمز التحقق غير صحيح أو انتهت صلاحيته" }, { status: 400 });
    }

    // Update order status
    if (orderId) {
      await Promise.all([
        supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", orderId),
        supabaseAdmin.from("payments")
          .update({ status: "paid" })
          .eq("order_id", orderId)
          .eq("method", "edfali"),
      ]);
    }

    console.log("EDFALI PAID ✅ — order:", orderId);
    return Response.json({ success: true });

  } catch (err) {
    console.error("EDFALI VERIFY ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
