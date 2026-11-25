/**
 * DISABLED (2026-11-25 security audit).
 *
 * Legacy Stripe / DPay endpoints. No page of the site uses them any more (SHEIN
 * orders are paid by wallet, Edfali, MobiCash, Moamalat, Yusor or Masarafi), but
 * they were still reachable and unsafe: /api/checkout charged an amount chosen by
 * the browser, and /api/verify + /api/verify-stripe marked ANY order paid from ANY
 * paid session — a 1-dinar session could "pay" a large cart. If Stripe/DPay are
 * ever brought back, they must load the amount from the order on the server and
 * bind the session to that order before marking anything paid.
 * The previous code is in git history (before this commit).
 */
export async function POST() {
  return Response.json({ success: false, error: "طريقة الدفع هذه غير متاحة" }, { status: 410 });
}
