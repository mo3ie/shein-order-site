import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

// Override screenshot to never throw
async function shot(name) {
  await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, timeout: 5000 }).catch(e => console.log('  shot skipped:', e.message.slice(0,40)));
}

// Navigate and wait for load
async function go(url, ms = 10000) {
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: ms });
  } catch(e) {
    await p.waitForTimeout(2000);
  }
}

// 1. Check admin when NOT logged in
console.log('\n=== 1. /admin (not logged in) ===');
await go('https://www.trendstore-ly.com/admin');
console.log('URL:', p.url().replace('https://www.trendstore-ly.com', '') || '/');
await shot('adm1-unauth');

// 2. Go to login page
console.log('\n=== 2. Login page ===');
await go('https://www.trendstore-ly.com/login');
console.log('URL:', p.url().replace('https://www.trendstore-ly.com', '') || '/');
const emailFields = await p.locator('input[type="email"]').count();
const passFields  = await p.locator('input[type="password"]').count();
console.log('Email fields:', emailFields, '| Pass fields:', passFields);
await shot('adm2-loginpage');

// 3. Fill & submit
if (emailFields > 0 && passFields > 0) {
  console.log('\n=== 3. Submitting login ===');
  await p.locator('input[type="email"]').first().fill('mo3iemohamed@gmail.com');
  await p.locator('input[type="password"]').first().fill('Mo3ie@2025');
  await shot('adm3-filled');
  try {
    await Promise.all([
      p.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
      p.locator('button[type="submit"]').first().click()
    ]);
  } catch(e) {
    await p.waitForTimeout(4000);
  }
  console.log('After login URL:', p.url().replace('https://www.trendstore-ly.com', '') || '/');
  await shot('adm4-afterlogin');
} else {
  console.log('Login form not found');
  const text = await p.locator('body').innerText().catch(() => '');
  console.log('Body preview:', text.slice(0, 200));
}

// 4. Navigate to /admin
console.log('\n=== 4. /admin after login ===');
await go('https://www.trendstore-ly.com/admin');
console.log('URL:', p.url().replace('https://www.trendstore-ly.com', '') || '/');
const bodyText = await p.locator('body').innerText().catch(() => '');
const hasAdmin = bodyText.includes('لوحة') || bodyText.includes('المنتجات') || bodyText.includes('الطلبات') || bodyText.includes('admin');
console.log('Admin dashboard visible:', hasAdmin ? '✅' : '❌');
console.log('Body preview:', bodyText.slice(0, 300).replace(/\n+/g, ' '));
await shot('adm5-adminpage');

await b.close();
console.log('\n=== Done ===');
