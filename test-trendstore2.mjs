import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

// 1. صفحة المنتجات
console.log('1. فتح صفحة المنتجات...');
await page.goto('https://www.trendstore-ly.com', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

// خذ لقطة شاشة أكبر
await page.screenshot({ path: 'test-ts2-home.png', fullPage: true });

// ابحث عن أي روابط منتجات
const allLinks = await page.locator('a').all();
const productUrls = [];
for (const link of allLinks) {
  const href = await link.getAttribute('href').catch(() => null);
  if (href && href.includes('/products/')) productUrls.push(href);
}
console.log('روابط المنتجات:', productUrls.slice(0, 5));

// ابحث عن أي صور أو بطاقات
const images = await page.locator('img').count();
const cards = await page.locator('[class*="card"], [class*="product"]').count();
console.log('الصور:', images, '| البطاقات:', cards);

// اعرض المحتوى النصي
const bodyText = await page.locator('body').innerText();
console.log('أول 500 حرف من الصفحة:', bodyText.substring(0, 500));

// إذا وجدنا رابط منتج، افتحه
if (productUrls.length > 0) {
  const url = productUrls[0].startsWith('http') ? productUrls[0] : 'https://www.trendstore-ly.com' + productUrls[0];
  console.log('\n2. فتح منتج:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-ts2-product.png', fullPage: false });

  // أضف للسلة
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    const text = await btn.innerText().catch(() => '');
    console.log('زر:', text);
  }

  const addBtn = page.locator('button').filter({ hasText: /أضف|سلة|إضافة/i }).first();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ أُضيف للسلة');
  }
}

// السلة
console.log('\n3. فتح السلة...');
await page.goto('https://www.trendstore-ly.com/cart', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts2-cart.png', fullPage: false });

const cartText = await page.locator('body').innerText();
console.log('محتوى السلة (أول 300 حرف):', cartText.substring(0, 300));

// ابحث عن زر الدفع
const allBtns = await page.locator('button').all();
for (const btn of allBtns) {
  const t = await btn.innerText().catch(() => '');
  if (t.trim()) console.log('زر السلة:', t.trim());
}

await browser.close();
console.log('\nاكتمل');
