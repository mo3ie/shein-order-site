import { chromium } from 'playwright';

const PRODUCT_ID = '7063ed1d-4017-418b-a533-8abac89ce8af';
const browser = await chromium.launch({ headless: false, slowMo: 400 });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

// التقط أي alerts
page.on('dialog', async dialog => {
  console.log('⚠️ Alert:', dialog.message());
  await dialog.accept();
});

// 1. افتح صفحة المنتج
console.log('1. فتح صفحة المنتج...');
await page.goto(`https://www.trendstore-ly.com/products/${PRODUCT_ID}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// 2. احصل على هيكل الـ variants من API
const productData = await page.evaluate(async (id) => {
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}, PRODUCT_ID);

console.log('Variants في المنتج:', JSON.stringify(productData?.variants));
console.log('اسم المنتج:', productData?.name, '| السعر:', productData?.price, '| المخزون:', productData?.stock);

// 3. اختر أول خيار من كل variant group
if (productData?.variants?.length > 0) {
  for (const variant of productData.variants) {
    const firstOption = variant.options[0];
    console.log(`اختيار ${variant.name}: ${firstOption}`);
    const btn = page.locator('button').filter({ hasText: firstOption }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      console.log(`✅ اخترنا ${variant.name}: ${firstOption}`);
    } else {
      console.log(`⚠️ لم نجد زر "${firstOption}" لـ "${variant.name}"`);
    }
  }
}

await page.screenshot({ path: 'test-ts4-variants.png' });

// 4. أضف للسلة
const addBtn = page.locator('button').filter({ hasText: /أضف إلى السلة/i }).first();
await addBtn.click();
await page.waitForTimeout(2000);
await page.screenshot({ path: 'test-ts4-after-add.png' });

// تحقق localStorage
const cartData = await page.evaluate(() => localStorage.getItem('trend_cart'));
console.log('\nالسلة في localStorage:', cartData);

if (cartData && cartData !== '[]') {
  console.log('✅ المنتج أُضيف للسلة بنجاح!');

  // 5. انتقل للسلة
  console.log('\n5. فتح السلة...');
  await page.goto('https://www.trendstore-ly.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-ts4-cart.png' });

  const cartCount = await page.locator('text=/منتج/').first().innerText().catch(() => '');
  console.log('عدد المنتجات:', cartCount);

  // 6. زر إتمام الطلب
  const proceedBtn = page.locator('button').filter({ hasText: /إتمام|الدفع/i }).first();
  const visible = await proceedBtn.isVisible().catch(() => false);
  console.log('زر إتمام الطلب:', visible ? '✅ موجود' : '❌ غير موجود');

  if (visible) {
    await proceedBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-ts4-step1.png' });

    // قد يطلب اختيار عنوان أولاً
    const bodyText = await page.locator('body').innerText();
    console.log('الخطوة الحالية:', bodyText.substring(0, 200));

    // ابحث عن أزرار المتابعة
    const allBtns2 = await page.locator('button').all();
    for (const b of allBtns2) {
      const t = await b.innerText().catch(() => '');
      if (t.trim()) console.log('زر:', t.trim());
    }
  }
} else {
  console.log('❌ السلة لا تزال فارغة بعد الإضافة');
}

await browser.close();
console.log('\nاكتمل الاختبار');
