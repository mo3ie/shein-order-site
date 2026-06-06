import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const KEY = process.env.MOAMALAT_SECURE_KEY;

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("MOAMALAT WEBHOOK:", JSON.stringify(body, null, 2));

    const {
      MerchantId,
      TerminalId,
      SecureHash,
      DateTimeLocalTrxn,
      Amount,
      Currency,
      MerchantReference,
      SystemReference,
      TxnType,
      Message,
    } = body;

    // ── Verify SecureHash ──────────────────────────────────────────────
    // Fields sorted alphabetically: Amount, Currency, DateTimeLocalTrxn, MerchantId, TerminalId
    const hashString = [
      `Amount=${Amount}`,
      `Currency=${Currency}`,
      `DateTimeLocalTrxn=${DateTimeLocalTrxn}`,
      `MerchantId=${MerchantId}`,
      `TerminalId=${TerminalId}`,
    ].join("&");

    const keyBuf       = Buffer.from(KEY, "hex");
    const expectedHash = createHmac("sha256", keyBuf).update(hashString).digest("hex").toUpperCase();

    if (SecureHash !== expectedHash) {
      console.error("MOAMALAT: Invalid SecureHash", { received: SecureHash, expected: expectedHash });
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const orderId = MerchantReference;

    // TxnType 1 = Sale (successful payment)
    if (String(TxnType) === "1") {
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .update({ status: "paid" })
          .eq("id", orderId),

        supabaseAdmin
          .from("payments")
          .update({ status: "paid", gateway_ref: SystemReference })
          .eq("order_id", orderId)
          .eq("method", "moamalat"),
      ]);

      console.log(`MOAMALAT: Order ${orderId} marked paid. Ref: ${SystemReference}`);
    } else {
      // TxnType 2=Refund, 3=Void Sale, 4=Void Refund
      console.log(`MOAMALAT: TxnType ${TxnType} — Message: ${Message}`);
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error("MOAMALAT WEBHOOK ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
