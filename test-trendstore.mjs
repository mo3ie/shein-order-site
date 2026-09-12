import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
page.setDefaultTimeout(25000);

// 1. الصفحة الرئيسية
console.log('1. فتح الصفحة الرئيسية...');
await page.goto('https://www.trendstore-ly.com', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts-home.png' });
console.log('✅ الصفحة الرئيسية - URL:', page.url());

// 2. ابحث عن منتجات
const productLinks = await page.locator('a[href*="/products/"]').all();
console.log('عدد المنتجات:', productLinks.length);

if (productLinks.length > 0) {
  // 3. افتح أول منتج
  console.log('3. فتح صفحة منتج...');
  const href = await productLinks[0].getAttribute('href');
  await page.goto('https://www.trendstore-ly.com' + href, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-ts-product.png' });
  console.log('✅ صفحة المنتج - URL:', page.url());

  // 4. أضف للسلة
  const addBtn = page.locator('button').filter({ hasText: /أضف|سلة/i }).first();
  const btnVisible = await addBtn.isVisible().catch(() => false);
  if (btnVisible) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    console.log('✅ أُضيف للسلة');
  } else {
    console.log('⚠️ زر الإضافة للسلة غير مرئي');
  }
}

// 5. السلة
console.log('5. فتح السلة...');
await page.goto('https://www.trendstore-ly.com/cart', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'test-ts-cart.png' });
console.log('✅ السلة - URL:', page.url());

// 6. ابحث عن زر الدفع
const checkoutBtn = page.locator('button').filter({ hasText: /إتمام|الدفع|checkout/i }).first();
const checkoutVisible = await checkoutBtn.isVisible().catch(() => false);
console.log('زر إتمام الطلب:', checkoutVisible ? '✅ مرئي' : '⚠️ غير مرئي');

if (checkoutVisible) {
  await checkoutBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-ts-modal.png' });
  console.log('✅ Modal الدفع مفتوح');

  // 7. ابحث عن الدفع عند الاستلام
  const cashOption = page.locator('text=/عند الاستلام|نقداً|cash/i').first();
  const cashVisible = await cashOption.isVisible().catch(() => false);
  console.log('الدفع عند الاستلام في modal:', cashVisible ? '✅ موجود' : '❌ غير موجود');

  await page.screenshot({ path: 'test-ts-payment.png' });
}

await browser.close();
console.log('\nاكتمل الاختبار');
