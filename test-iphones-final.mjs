import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();
page.setDefaultTimeout(20000);

const checks = [
  { name: 'iPhone 13',     id: 'e6aa46a4-12f2-4d26-a55c-418fdfe1fc3d' },
  { name: 'iPhone 14 Pro', id: '8435f05b-7fab-4d04-a761-9f1415c0500d' },
  { name: 'iPhone 15',     id: 'ccf04426-2138-41f1-b289-2c55eb099399' },
  { name: 'iPhone 16 Pro', id: 'ac83302d-e6da-479b-8177-81d9f56f9e7e' },
];

for (const { name, id } of checks) {
  await page.goto(`https://www.trendstore-ly.com/products/${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const imgSrc = await page.locator('img').first().getAttribute('src').catch(() => '');
  const hasImg = imgSrc.includes('supabase.co');
  console.log(`${name}: صورة Supabase = ${hasImg ? '✅' : '❌'} (${imgSrc.substring(0, 60)})`);

  await page.screenshot({ path: `verify-${name.replace(/ /g, '-')}.png` });
}

await browser.close();
