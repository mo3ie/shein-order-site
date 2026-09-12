import { chromium } from 'playwright';

const MAGIC = "https://grazynglhjuuxesgusgd.supabase.co/auth/v1/verify?token=6bdb27f94e07d074ff99250db20c7ae14ddb0be8a9b0e8381c0afce3&type=magiclink&redirect_to=https://www.trendstore-ly.com/auth/callback";

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

async function shot(name) {
  await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, timeout: 10000 }).catch(() => {});
}

// Auth via magic link
try {
  await p.goto(MAGIC, { waitUntil: 'commit', timeout: 20000 });
} catch { }
await p.waitForTimeout(10000); // wait for auth/callback to set session

// Navigate to /admin
console.log('\n=== Dashboard ===');
try {
  await p.goto('https://www.trendstore-ly.com/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
} catch { await p.waitForTimeout(3000); }
await p.waitForTimeout(4000);
const url1 = p.url().replace('https://www.trendstore-ly.com', '') || '/';
console.log('URL:', url1);
const dash = await p.locator('body').innerText().catch(() => '');
console.log('Has 1970:', dash.includes('1970') ? '❌' : '✅ لا يوجد');
console.log('Is admin page:', dash.includes('لوحة') || dash.includes('التحكم') ? '✅' : '❌');
await shot('d2-dashboard');

// Navigate to /admin/orders
console.log('\n=== Orders ===');
try {
  await p.goto('https://www.trendstore-ly.com/admin/orders', { waitUntil: 'domcontentloaded', timeout: 15000 });
} catch { await p.waitForTimeout(3000); }
await p.waitForTimeout(5000);
const url2 = p.url().replace('https://www.trendstore-ly.com', '') || '/';
console.log('URL:', url2);
const ord = await p.locator('body').innerText().catch(() => '');
console.log('Has 1970:', ord.includes('1970') ? '❌' : '✅ لا يوجد');
console.log('Is orders page:', ord.includes('الطلبات') && ord.includes('طلب') ? '✅' : '❌');
const dates = ord.match(/\d{2}\/\d{2}\/\d{4}/g) || [];
console.log('Dates visible:', dates.length > 0 ? dates.slice(0,3).join(', ') : '(لا تواريخ — store_orders فارغ؟)');
console.log('Preview:', ord.slice(0, 400).replace(/\s+/g, ' '));
await shot('d2-orders');

await b.close();
