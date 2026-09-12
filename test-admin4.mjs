import { chromium } from 'playwright';

const MAGIC_LINK = "https://grazynglhjuuxesgusgd.supabase.co/auth/v1/verify?token=9b0fdd980811fb51f8b7b19aa5d1b4cd692c0c696d5e037bf8e7b2ca&type=magiclink&redirect_to=https://www.trendstore-ly.com/auth/callback";

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

async function shot(name) {
  await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, timeout: 10000 }).catch(e => console.log('  shot skipped:', e.message.slice(0,60)));
}

// 1. Follow magic link → lands on /auth/callback#access_token=...
console.log('\n=== 1. Magic link → /auth/callback ===');
try {
  await p.goto(MAGIC_LINK, { waitUntil: 'commit', timeout: 20000 });
} catch(e) {
  console.log('  goto error:', e.message.slice(0,80));
}
await p.waitForTimeout(2000);
let url = p.url().replace('https://www.trendstore-ly.com', '');
console.log('URL after magic link:', url.split('?')[0].split('#')[0] || '/');

// 2. Wait for /auth/callback to process (sets session + redirects)
console.log('\n=== 2. Waiting for auth/callback to process ===');
await p.waitForTimeout(8000); // auth/callback needs time to setSession and redirect
url = p.url().replace('https://www.trendstore-ly.com', '') || '/';
console.log('URL after wait:', url.split('#')[0] || '/');
await shot('adm4-1-aftercallback');

// 3. Navigate to /admin
console.log('\n=== 3. Navigate to /admin ===');
try {
  await p.goto('https://www.trendstore-ly.com/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
} catch(e) {
  console.log('  goto /admin error:', e.message.slice(0,80));
  await p.waitForTimeout(3000);
}
url = p.url().replace('https://www.trendstore-ly.com', '') || '/';
console.log('Admin URL:', url.split('#')[0] || '/');

await p.waitForTimeout(3000);
const bodyText = await p.locator('body').innerText().catch(() => '');
const hasAdmin = bodyText.includes('لوحة') || bodyText.includes('التحكم') || bodyText.includes('المنتجات') || bodyText.includes('الطلبات');
console.log('Admin dashboard visible:', hasAdmin ? '✅' : '❌');
if (!hasAdmin) {
  console.log('Page text:', bodyText.slice(0, 300).replace(/\s+/g, ' '));
}
await shot('adm4-2-adminpage');

await b.close();
console.log('\n=== Done ===');
