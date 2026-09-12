import { chromium } from 'playwright';

const MAGIC_LINK = "https://grazynglhjuuxesgusgd.supabase.co/auth/v1/verify?token=ca5061cf995074b63045960d44f9887e2ba1c7bbbe7b6705ce5e2715&type=magiclink&redirect_to=https://www.trendstore-ly.com";

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

async function shot(name) {
  await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, timeout: 8000 }).catch(e => console.log('  shot skipped:', e.message.slice(0,50)));
}

// 1. Use magic link to authenticate
console.log('\n=== 1. Magic link login ===');
try {
  await p.goto(MAGIC_LINK, { waitUntil: 'domcontentloaded', timeout: 15000 });
} catch(e) {
  await p.waitForTimeout(5000);
}
console.log('After magic link URL:', p.url().replace('https://www.trendstore-ly.com', '') || '/');
await shot('adm3-1-aftermagic');

// 2. Wait for any redirects to settle
await p.waitForTimeout(3000);
console.log('Settled URL:', p.url().replace('https://www.trendstore-ly.com', '') || '/');
await shot('adm3-2-settled');

// 3. Navigate to /admin
console.log('\n=== 2. /admin ===');
try {
  await p.goto('https://www.trendstore-ly.com/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
} catch(e) {
  await p.waitForTimeout(5000);
}
const adminUrl = p.url().replace('https://www.trendstore-ly.com', '') || '/';
console.log('Admin URL:', adminUrl);
await p.waitForTimeout(3000); // wait for client-side render
const bodyText = await p.locator('body').innerText().catch(() => '');
const hasAdmin = bodyText.includes('لوحة') || bodyText.includes('المنتجات') || bodyText.includes('الطلبات') || bodyText.includes('التحكم');
console.log('Admin dashboard visible:', hasAdmin ? '✅' : '❌');
console.log('Body preview:', bodyText.slice(0, 400).replace(/\s+/g, ' '));
await shot('adm3-3-adminpage');

await b.close();
console.log('\n=== Done ===');
