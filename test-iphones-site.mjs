import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 200 });
const page = await browser.newPage();
page.setDefaultTimeout(20000);

// افتح الصفحة الرئيسية
await page.goto('https://www.trendstore-ly.com', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'test-iphones-home.png', fullPage: false });

// انظر كم منتج يظهر
const links = await page.locator('a[href*="/products/"]').all();
console.log('عدد المنتجات في الصفحة الرئيسية:', links.length);

// افتح صفحة iPhone 13
await page.goto('https://www.trendstore-ly.com/products/e6aa46a4-12f2-4d26-a55c-418fdfe1fc3d', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-iphone13.png' });
console.log('✅ iPhone 13 محمّل');

// افتح صفحة iPhone 16 Pro Max
await page.goto('https://www.trendstore-ly.com/products/3ac134e4-5322-4689-b212-bdb565f93d69', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-iphone16promax.png' });
console.log('✅ iPhone 16 Pro Max محمّل');

// افتح iPhone 17 Air
await page.goto('https://www.trendstore-ly.com/products/62500759-7fb5-49ea-bf9d-898c405cbadf', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'test-iphone17air.png' });
console.log('✅ iPhone 17 Air محمّل');

await browser.close();
console.log('\nاكتمل');
