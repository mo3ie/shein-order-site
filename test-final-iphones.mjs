import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 200 });
const page = await browser.newPage();
page.setDefaultTimeout(20000);

const products = [
  { name: 'iPhone 13', id: 'e6aa46a4-12f2-4d26-a55c-418fdfe1fc3d' },
  { name: 'iPhone 14', id: 'ae5317ae-b6a4-4858-b244-7eb3598cfc3e' },
  { name: 'iPhone 15 Pro', id: '18a1e708-aba9-4921-b08c-8e626666aa90' },
  { name: 'iPhone 16', id: '6dcb2607-537c-4362-a385-9eb74cc55f56' },
  { name: 'iPhone 16 Pro', id: 'ac83302d-e6da-479b-8177-81d9f56f9e7e' },
];

for (const { name, id } of products) {
  await page.goto(`https://www.trendstore-ly.com/products/${id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `test-final-${name.replace(/ /g, '-')}.png` });
  // تحقق من الصورة الرئيسية
  const hasImg = await page.locator('img[src*="apple.com"]').first().isVisible().catch(() => false);
  console.log(`${name}: صورة Apple = ${hasImg ? '✅' : '❌'}`);
}

// الصفحة الرئيسية
await page.goto('https://www.trendstore-ly.com', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'test-final-home.png', fullPage: false });
const productCount = await page.locator('a[href*="/products/"]').count();
console.log(`\nالمنتجات في الصفحة الرئيسية: ${productCount}`);

await browser.close();
