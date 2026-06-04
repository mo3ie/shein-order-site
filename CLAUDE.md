# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server on localhost:3000
npm run build    # production build
npm run lint     # eslint
```

## Architecture

**Purpose:** A Shein order proxy service for Libya — users paste a Shein cart link and upload a screenshot, OCR extracts the price, then they pay via Stripe or Libyan payment gateways (DPay).

**Stack:** Next.js 16 App Router · Supabase · Stripe · DPay · Tesseract.js (OCR) · Playwright

**Critical Next.js 16 rule:** `params` in route handlers is a `Promise` and must be awaited:
```js
export async function GET(req, { params }) {
  const { id } = await params; // required — accessing params.id directly returns undefined
}
```

### Supabase clients
- `lib/supabaseClient.js` — anon key, used in browser components
- `lib/supabaseAdmin.js` — service role key, used only in API routes

### Key Supabase tables
- `orders` — main orders table: `id, name, phone, cart_link, price, image_url, status, type, shipping, exchange_rate, price_lyd, final_total, created_at`
- `payments` — payment records: `order_id, method, status, amount`
- `settings` — row id=1 holds `exchange_rate` (USD → LYD rate)

### Order flow
1. User fills form on `/` (cart link + name + phone + screenshot)
2. Tesseract.js OCR extracts price from screenshot (`"Estimated Price"` or `"السعر المقدر"`)
3. Exchange rate fetched from `settings` table → price shown in USD and LYD
4. User clicks "إرسال الطلب" → payment modal opens
5. Two payment paths:
   - **Stripe** (`/api/checkout`) → redirect to Stripe → webhook at `/api/verify-stripe` → `/success`
   - **DPay** (`/api/dpay`) → supports: `moamalat`, `edfali`, `mobicash`, `masrefypay`, `yousrpay`, `saharpay` → redirect to DPay payment link → webhook at `/api/dpay/webhook` → `/success`
6. Both paths create order in DB via `POST /api/order` before redirecting to payment

### API routes
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/order` | GET, POST, PUT | fetch orders / create order / update status+shipping |
| `/api/checkout` | POST | create Stripe checkout session |
| `/api/dpay` | POST | create DPay payment session |
| `/api/dpay/webhook` | POST | DPay payment callback |
| `/api/verify` | POST | verify DPay session status |
| `/api/verify-stripe` | POST | verify Stripe session |

### Pages
- `/` — main order form
- `/track` — order tracking by ID
- `/my-orders` — user's order history
- `/success` — post-payment confirmation
- `/confirm` — order confirmation page
- `/admin` — admin panel (orders list)
- `/admin/completed` — completed orders
- `/admin/trash` — deleted orders
- `/account`, `/login`, `/signup`, `/user-login`, `/otp`, `/reset-password`, `/about`, `/contact`

### Styling
Most components use inline JS style objects (not Tailwind classes). The main background uses `/public/bg.png` and logo `/public/logo.png`.

### Price calculation
```
profit = price * 0.03
totalUSD = price + profit
priceLYD = totalUSD * exchangeRate  // exchange_rate from settings table
```

### Environment variables needed
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
DPAY_TOKEN
DPAY_MODE          # "Production" or sandbox
NEXT_PUBLIC_BASE_URL   # e.g. https://order.trendstore-ly.com
```
