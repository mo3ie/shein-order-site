import { chromium } from 'playwright';

const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';
const BASE = 'https://www.trendstore-ly.com';

// Fresh magic link
const lr = await fetch('https://grazynglhjuuxesgusgd.supabase.co/auth/v1/admin/generate_link', {
  method: 'POST',
  headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'magiclink', email: 'mo3iemohamed@gmail.com', redirect_to: `${BASE}/auth/callback` }),
});
const { action_link } = await lr.json();
console.log('Magic link generated:', action_link ? '✅' : '❌');

const b = await chromium.launch({ headless: false }); // non-headless to see what's happening
const p = await b.newPage();
await p.setViewportSize({ width: 1440, height: 900 });

const shot = (name) => p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, fullPage: false }).catch(() => {});

// Auth
console.log('Navigating to magic link...');
await p.goto(action_link, { waitUntil: 'commit', timeout: 20000 }).catch(() => {});
await p.waitForTimeout(12000);
console.log('After auth URL:', p.url().replace(BASE, ''));
await shot('ao-1-after-auth');

// Navigate to admin/orders
console.log('\nNavigating to /admin/orders...');
await p.goto(`${BASE}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
await p.waitForTimeout(7000);
const url = p.url().replace(BASE, '');
console.log('URL:', url);
await shot('ao-2-orders-page');

const text = await p.locator('body').innerText().catch(() => '');
console.log('\n── محتوى الصفحة (500 حرف أول) ──');
console.log(text.slice(0, 500).replace(/\s+/g, ' '));

console.log('\n── فحص التبويبات ──');
console.log('المتجر الإلكتروني:', text.includes('المتجر الإلكتروني') ? '✅' : '❌');
console.log('طلبات شي إن:',       text.includes('طلبات شي') ? '✅' : '❌');
console.log('عرض (modal btn):',   text.includes('عرض') ? '✅' : '❌');

// Try clicking Shein tab
const sheinTab = p.locator('button', { hasText: 'طلبات شي' }).first();
if (await sheinTab.count() > 0) {
  console.log('\nنقر على تاب شي إن...');
  await sheinTab.click();
  await p.waitForTimeout(2000);
  await shot('ao-3-shein-tab');
  const t2 = await p.locator('body').innerText().catch(() => '');
  console.log('السعر (دولار):', t2.includes('$') ? '✅' : '⚠️');
  console.log('رابط السلة:',   t2.includes('رابط') ? '✅' : '⚠️');
}

// Try opening detail modal
await p.goto(`${BASE}/admin/orders`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
await p.waitForTimeout(5000);
const firstView = p.locator('button', { hasText: 'عرض' }).first();
if (await firstView.count() > 0) {
  console.log('\nنقر على زر عرض...');
  await firstView.click();
  await p.waitForTimeout(2000);
  await shot('ao-4-modal');
  const mt = await p.locator('body').innerText().catch(() => '');
  console.log('Modal مفتوح:', mt.includes('تفاصيل الطلب') || mt.includes('بيانات الزبون') ? '✅' : '❌');
  console.log('variants ظاهرة:', mt.includes('السعة') || mt.includes('اللون') ? '✅' : '⚠️ (لا توجد variants في الطلبات)');
}

await b.close();
console.log('\n── انتهى ──');
