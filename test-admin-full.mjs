import { chromium } from 'playwright';

const MAGIC_LINK = "https://grazynglhjuuxesgusgd.supabase.co/auth/v1/verify?token=5db6615a71fb992cb807d18248328fcfc530a126e0973defdd26e437&type=magiclink&redirect_to=https://www.trendstore-ly.com/auth/callback";

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

async function shot(name) {
  await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, timeout: 10000, fullPage: false })
    .catch(e => console.log('  shot skipped:', e.message.slice(0, 50)));
}

async function go(url, ms = 12000) {
  try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: ms }); }
  catch(e) { await p.waitForTimeout(3000); }
}

// ── Auth ──────────────────────────────────────────────
await go(MAGIC_LINK);
await p.waitForTimeout(8000);
console.log('Settled on:', p.url().replace('https://www.trendstore-ly.com','') || '/');

// ── 1. Admin dashboard ────────────────────────────────
console.log('\n=== 1. لوحة التحكم ===');
await go('https://www.trendstore-ly.com/admin');
await p.waitForTimeout(4000);
const adminUrl = p.url().replace('https://www.trendstore-ly.com','') || '/';
console.log('URL:', adminUrl);
const body = await p.locator('body').innerText().catch(() => '');
const hasStats = body.includes('لوحة') || body.includes('التحكم');
console.log('Dashboard loaded:', hasStats ? '✅' : '❌');
console.log('Stats visible:', body.includes('المنتجات') && body.includes('الطلبات') ? '✅' : '❌');
await shot('af-1-dashboard');

// ── 2. Admin Products ─────────────────────────────────
console.log('\n=== 2. المنتجات ===');
await go('https://www.trendstore-ly.com/admin/products');
await p.waitForTimeout(4000);
const prodUrl = p.url().replace('https://www.trendstore-ly.com','') || '/';
console.log('URL:', prodUrl);
const prodBody = await p.locator('body').innerText().catch(() => '');
const hasProds = prodBody.includes('منتج') || prodBody.includes('iPhone') || prodBody.includes('إضافة');
console.log('Products page:', hasProds ? '✅' : '❌');
console.log('Preview:', prodBody.slice(0,200).replace(/\s+/g,' '));
await shot('af-2-products');

// ── 3. Admin Orders ───────────────────────────────────
console.log('\n=== 3. الطلبات ===');
await go('https://www.trendstore-ly.com/admin/orders');
await p.waitForTimeout(4000);
const ordUrl = p.url().replace('https://www.trendstore-ly.com','') || '/';
console.log('URL:', ordUrl);
const ordBody = await p.locator('body').innerText().catch(() => '');
const hasOrds = ordBody.includes('طلب') || ordBody.includes('الطلبات') || ordBody.includes('حالة');
console.log('Orders page:', hasOrds ? '✅' : '❌');
console.log('Preview:', ordBody.slice(0,200).replace(/\s+/g,' '));
await shot('af-3-orders');

// ── 4. Sidebar links ──────────────────────────────────
console.log('\n=== 4. روابط الشريط الجانبي ===');
await go('https://www.trendstore-ly.com/admin');
await p.waitForTimeout(3000);
const links = await p.locator('a[href*="/admin"]').allInnerTexts().catch(() => []);
console.log('Sidebar links:', links.map(l => l.trim()).filter(l => l).join(' | '));
await shot('af-4-sidebar');

await b.close();
console.log('\n=== Done ===');
