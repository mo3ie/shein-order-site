import { chromium } from 'playwright';

const PRODUCT_ID = '7063ed1d-4017-418b-a533-8abac89ce8af';
const browser = await chromium.launch({ headless: false, slowMo: 400 });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

page.on('dialog', async dialog => {
  console.log('⚠️ Alert:', dialog.message());
  await dialog.accept();
});

// 1. صفحة المنتج
console.log('1. فتح المنتج...');
await page.goto(`https://www.trendstore-ly.com/products/${PRODUCT_ID}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts5-product.png' });

// 2. اختر اللون والسعة
console.log('2. اختيار variants...');
const colorBtn = page.locator('button').filter({ hasText: 'أسود' }).first();
await colorBtn.click();
await page.waitForTimeout(400);

const storageBtn = page.locator('button').filter({ hasText: '256GB' }).first();
await storageBtn.click();
await page.waitForTimeout(400);
console.log('✅ تم الاختيار: أسود + 256GB');

await page.screenshot({ path: 'test-ts5-selected.png' });

// 3. أضف للسلة
const addBtn = page.locator('button').filter({ hasText: /أضف إلى السلة/i }).first();
await addBtn.click();
await page.waitForTimeout(2000);
await page.screenshot({ path: 'test-ts5-after-add.png' });

const cartData = await page.evaluate(() => localStorage.getItem('trend_cart'));
console.log('السلة:', cartData ? JSON.parse(cartData).length + ' عنصر' : 'فارغة');

if (!cartData || cartData === '[]') {
  console.log('❌ الإضافة فشلت'); await browser.close(); process.exit(1);
}
console.log('✅ أُضيف للسلة!');

// 4. السلة
console.log('\n4. فتح السلة...');
await page.goto('https://www.trendstore-ly.com/cart', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-ts5-cart.png' });

const cartText = await page.locator('body').innerText();
console.log('محتوى السلة (300 حرف):', cartText.substring(0, 300));

// 5. زر إتمام الطلب
const proceedBtns = await page.locator('button').all();
for (const b of proceedBtns) {
  const t = await b.innerText().catch(() => '');
  if (t.trim()) console.log('زر:', t.trim());
}

const proceedBtn = page.locator('button').filter({ hasText: /إتمام|متابعة|الدفع/i }).first();
const proceedOk = await proceedBtn.isVisible().catch(() => false);
console.log('\nزر إتمام الطلب:', proceedOk ? '✅ موجود' : '❌ غير موجود');

if (proceedOk) {
  await proceedBtn.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-ts5-checkout-step.png' });
  console.log('URL:', page.url());

  const step = await page.locator('body').innerText();
  console.log('الخطوة:', step.substring(0, 300));

  // ابحث عن زر المتابعة للدفع
  const nextBtn = page.locator('button').filter({ hasText: /التالي|متابعة|اختر|الدفع/i }).first();
  if (await nextBtn.isVisible().catch(() => false)) {
    await nextBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-ts5-payment-modal.png' });

    const cashOption = await page.locator('text=/عند الاستلام/i').first().isVisible().catch(() => false);
    console.log('\nالدفع عند الاستلام في modal:', cashOption ? '✅ موجود' : '❌ غير موجود');

    if (!cashOption) {
      const modalText = await page.locator('body').innerText();
      console.log('محتوى Modal:', modalText.substring(0, 400));
    }
  }
}

await browser.close();
console.log('\nاكتمل الاختبار');
