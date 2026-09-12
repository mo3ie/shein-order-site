import { chromium } from 'playwright';

const PRODUCT_ID = '7063ed1d-4017-418b-a533-8abac89ce8af';
const browser = await chromium.launch({ headless: false, slowMo: 400 });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

page.on('dialog', async dialog => {
  console.log('⚠️ Alert:', dialog.message());
  await dialog.accept();
});

// 1. أضف للسلة من المنتج
await page.goto(`https://www.trendstore-ly.com/products/${PRODUCT_ID}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.locator('button').filter({ hasText: 'أسود' }).first().click();
await page.waitForTimeout(300);
await page.locator('button').filter({ hasText: '256GB' }).first().click();
await page.waitForTimeout(300);
await page.locator('button').filter({ hasText: /أضف إلى السلة/i }).first().click();
await page.waitForTimeout(1500);
console.log('✅ المنتج في السلة');

// 2. السلة
await page.goto('https://www.trendstore-ly.com/cart', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'test-ts6-cart.png' });
console.log('✅ صفحة السلة');

// 3. تأكيد الطلب
const confirmBtn = page.locator('button').filter({ hasText: /تأكيد الطلب/i }).first();
console.log('زر تأكيد الطلب:', await confirmBtn.isVisible().catch(() => false) ? '✅' : '❌');
await confirmBtn.click();
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts6-after-confirm.png' });
console.log('URL بعد التأكيد:', page.url());

const bodyText = await page.locator('body').innerText();
console.log('المحتوى:', bodyText.substring(0, 400));

// 4. Modal الدفع
const cashVisible = await page.locator('text=/عند الاستلام/i').first().isVisible().catch(() => false);
console.log('\nالدفع عند الاستلام:', cashVisible ? '✅ موجود' : '❌ غير موجود');

await page.screenshot({ path: 'test-ts6-payment.png' });

// 5. انقر عند الاستلام
if (cashVisible) {
  const cashBtn = page.locator('text=/عند الاستلام/i').first();
  await cashBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-ts6-cash-selected.png' });

  // زر ادفع الآن
  const payBtn = page.locator('button').filter({ hasText: /ادفع|ارسل|تأكيد/i }).first();
  const payVisible = await payBtn.isVisible().catch(() => false);
  console.log('زر ادفع الآن:', payVisible ? '✅' : '❌');

  if (payVisible) {
    await payBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-ts6-success.png' });
    console.log('URL النهائي:', page.url());
    const finalText = await page.locator('body').innerText();
    console.log('الصفحة النهائية:', finalText.substring(0, 300));
  }
}

await browser.close();
console.log('\nاكتمل الاختبار');
