import { createHmac } from "crypto";

const MID  = process.env.MOAMALAT_MERCHANT_ID;
const TID  = process.env.MOAMALAT_TERMINAL_ID;
const KEY  = process.env.MOAMALAT_SECURE_KEY;
const MODE = process.env.MOAMALAT_MODE; // "Production" | "Test"

export async function POST(req) {
  try {
    const { orderId, amountLYD } = await req.json();

    if (!orderId || !amountLYD) {
      return Response.json({ error: "orderId و amountLYD مطلوبان" }, { status: 400 });
    }

    // LYD → smallest unit (dirham: 1 LYD = 1000)
    const amountUnit = Math.round(Number(amountLYD) * 1000).toString();

    // Unix timestamp (seconds)
    const dateTimeLocalTrxn = Math.floor(Date.now() / 1000).toString();

    // HMAC-SHA256: fields sorted alphabetically by name
    // Amount, DateTimeLocalTrxn, MerchantId, MerchantReference, TerminalId
    const hashString = [
      `Amount=${amountUnit}`,
      `DateTimeLocalTrxn=${dateTimeLocalTrxn}`,
      `MerchantId=${MID}`,
      `MerchantReference=${orderId}`,
      `TerminalId=${TID}`,
    ].join("&");

    const keyBuf     = Buffer.from(KEY, "hex");
    const secureHash = createHmac("sha256", keyBuf).update(hashString).digest("hex").toUpperCase();

    const isProduction = MODE === "Production";
    const scriptUrl    = isProduction
      ? "https://npg.moamalat.net:6006/js/lightbox.js"
      : "https://tnpg.moamalat.net:6006/js/lightbox.js";

    return Response.json({
      success:           true,
      MID,
      TID,
      AmountTrxn:        amountUnit,
      MerchantReference: orderId,
      TrxDateTime:       dateTimeLocalTrxn,
      SecureHash:        secureHash,
      scriptUrl,
    });

  } catch (err) {
    console.error("MOAMALAT INIT ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
