import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const p = await b.newPage();

async function goWait(url, ms = 5000) {
  // Don't wait for full load - just fire and wait manually
  p.goto(url).catch(() => {});
  await p.waitForTimeout(ms);
}

async function shot(name) {
  try { await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png` }); }
  catch(e) { console.log('  screenshot error:', e.message.substring(0,60)); }
}

await p.setViewportSize({ width: 1280, height: 800 });

// 1. Homepage
console.log('\n=== 1. Homepage ===');
await goWait('https://www.trendstore-ly.com', 8000);
const title = await p.title().catch(() => '?');
console.log('Title:', title);
const searchEl = await p.locator('input[placeholder*="ابحث"]').count();
console.log('Search input:', searchEl > 0 ? '✅' : '❌');
const prodLinks = await p.locator('a[href*="/products/"]').count();
console.log('Product links on page:', prodLinks, prodLinks > 0 ? '✅' : '(still loading)');
await shot('t1-home');

// 2. Search
console.log('\n=== 2. Search ===');
try {
  const inp = p.locator('input[placeholder*="ابحث"]').first();
  await inp.fill('iPhone 13');
  await p.waitForTimeout(2500);
  const afterSearch = await p.locator('a[href*="/products/"]').count();
  console.log('Links after "iPhone 13":', afterSearch);
  await shot('t2-search');

  // Clear
  await inp.fill('');
  await p.waitForTimeout(500);
} catch(e) {
  console.log('Search error:', e.message.substring(0,100));
}

// 3. Product page
console.log('\n=== 3. Product page ===');
await goWait('https://www.trendstore-ly.com/products/e6aa46a4-12f2-4d26-a55c-418fdfe1fc3d', 7000);
const url3 = p.url();
console.log('URL:', url3);
const h1 = await p.locator('h1').first().textContent().catch(() => '?');
console.log('H1:', h1?.trim().substring(0, 60));
const heartBtns = await p.locator('button[title]').allInnerTexts().catch(() => []);
const titleAttrs = [];
for (const btn of await p.locator('button[title]').all()) {
  titleAttrs.push(await btn.getAttribute('title'));
}
console.log('Button titles:', titleAttrs);
await shot('t3-product');

// 4. Cart
console.log('\n=== 4. Cart ===');
await goWait('https://www.trendstore-ly.com/cart', 5000);
const cartH1 = await p.locator('h1').first().textContent().catch(() => '?');
console.log('Cart H1:', cartH1?.trim());
await shot('t4-cart');

// 5. Admin (not logged in)
console.log('\n=== 5. Admin (no login) ===');
await goWait('https://www.trendstore-ly.com/admin', 5000);
const adminUrl = p.url();
console.log('/admin redirects to:', adminUrl.replace('https://www.trendstore-ly.com', ''));
await shot('t5-admin');

// 6. Products page
console.log('\n=== 6. Products page ===');
await goWait('https://www.trendstore-ly.com/products', 5000);
const prods = await p.locator('a[href*="/products/"]').count();
console.log('Products listed:', prods);
await shot('t6-products');

await b.close();
console.log('\n=== All tests complete ===');
