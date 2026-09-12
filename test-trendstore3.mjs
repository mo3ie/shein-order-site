import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

// 1. المنتج
console.log('1. فتح صفحة المنتج...');
await page.goto('https://www.trendstore-ly.com/products/7063ed1d-4017-418b-a533-8abac89ce8af', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts3-product.png' });
console.log('✅ صفحة المنتج محمّلة');

// 2. اختر variant (لون)
const blueBtn = page.locator('button').filter({ hasText: /blue|أزرق/i }).first();
if (await blueBtn.isVisible().catch(() => false)) {
  await blueBtn.click();
  await page.waitForTimeout(500);
  console.log('✅ اخترنا اللون: blue');
}

// اختر سعة
const storageBtn = page.locator('button').filter({ hasText: /256gb/i }).first();
if (await storageBtn.isVisible().catch(() => false)) {
  await storageBtn.click();
  await page.waitForTimeout(500);
  console.log('✅ اخترنا السعة: 256GB');
}

// 3. أضف للسلة
const addBtn = page.locator('button').filter({ hasText: /أضف إلى السلة/i }).first();
if (await addBtn.isVisible().catch(() => false)) {
  await addBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-ts3-after-add.png' });
  console.log('✅ نقرنا على أضف إلى السلة');
}

// تحقق localStorage
const cartData = await page.evaluate(() => {
  const keys = Object.keys(localStorage).filter(k => k.toLowerCase().includes('cart'));
  const result = {};
  keys.forEach(k => result[k] = localStorage.getItem(k));
  return result;
});
console.log('cart في localStorage:', JSON.stringify(cartData).substring(0, 300));

// 4. انتقل للسلة عبر الرابط في الصفحة
console.log('\n4. الانتقال للسلة...');
const cartLink = page.locator('a[href="/cart"]').first();
if (await cartLink.isVisible().catch(() => false)) {
  await cartLink.click();
} else {
  await page.goto('https://www.trendstore-ly.com/cart', { waitUntil: 'domcontentloaded' });
}
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts3-cart.png' });

const cartText = await page.locator('body').innerText();
console.log('محتوى السلة:', cartText.substring(0, 400));

// 5. ابحث عن زر إتمام الطلب
const proceedBtn = page.locator('button').filter({ hasText: /إتمام|الدفع|اكمل|ادفع/i }).first();
const proceedVisible = await proceedBtn.isVisible().catch(() => false);
console.log('\nزر إتمام الطلب:', proceedVisible ? '✅ موجود' : '❌ غير موجود');

if (proceedVisible) {
  await proceedBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-ts3-checkout.png' });
  console.log('✅ فُتح checkout');

  // ابحث عن الدفع عند الاستلام
  const cashText = await page.locator('text=/عند الاستلام/i').first().isVisible().catch(() => false);
  console.log('الدفع عند الاستلام:', cashText ? '✅ موجود' : '❌ غير موجود');
  await page.screenshot({ path: 'test-ts3-payment-modal.png' });
}

await browser.close();
console.log('\nاكتمل الاختبار');
