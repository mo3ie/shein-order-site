import { chromium } from 'playwright';

const MAGIC = "https://grazynglhjuuxesgusgd.supabase.co/auth/v1/verify?token=4c77857a3d546c5a80922ecb5b11a6e1a4aa89f6bd88bd3eaae237d2&type=magiclink&redirect_to=https://www.trendstore-ly.com/auth/callback";

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

async function shot(name) {
  await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, timeout: 10000 })
    .catch(() => {});
}

async function go(url, ms = 12000) {
  try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: ms }); }
  catch { await p.waitForTimeout(3000); }
}

// Auth
await go(MAGIC);
await p.waitForTimeout(8000);

// Dashboard
await go('https://www.trendstore-ly.com/admin');
await p.waitForTimeout(5000);
const dashText = await p.locator('body').innerText().catch(() => '');
const has1970dash = dashText.includes('1970');
console.log('Dashboard has 1970:', has1970dash ? '❌' : '✅ لا يوجد');
console.log('Dashboard preview:', dashText.slice(0, 400).replace(/\s+/g, ' '));
await shot('dates-1-dashboard');

// Orders page
await go('https://www.trendstore-ly.com/admin/orders');
await p.waitForTimeout(5000);
const ordText = await p.locator('body').innerText().catch(() => '');
const has1970ord = ordText.includes('1970');
console.log('\nOrders has 1970:', has1970ord ? '❌' : '✅ لا يوجد');
// Find date pattern in text
const dateMatches = ordText.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
console.log('Dates found:', dateMatches.slice(0, 5));
console.log('Orders preview:', ordText.slice(0, 500).replace(/\s+/g, ' '));
await shot('dates-2-orders');

await b.close();
