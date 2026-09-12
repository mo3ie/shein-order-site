import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

async function goWait(url, ms = 6000) {
  p.goto(url).catch(() => {});
  await p.waitForTimeout(ms);
}

async function shot(name) {
  try { await p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, fullPage: false }); }
  catch(e) { console.log('  screenshot error:', e.message.substring(0,60)); }
}

// 1. Check deployment - look for new commit marker
console.log('\n=== 1. Site live check ===');
await goWait('https://www.trendstore-ly.com', 8000);
const title = await p.title().catch(() => '?');
console.log('Title:', title);
await shot('admin-test-1-home');

// 2. /admin unauthenticated
console.log('\n=== 2. /admin (not logged in) ===');
await goWait('https://www.trendstore-ly.com/admin', 6000);
const urlAfterAdmin = p.url();
console.log('Redirected to:', urlAfterAdmin.replace('https://www.trendstore-ly.com', '') || '/');
await shot('admin-test-2-unauth');

// 3. Login with credentials
console.log('\n=== 3. Login ===');
await goWait('https://www.trendstore-ly.com/login', 6000);
const loginUrl = p.url();
console.log('Login page URL:', loginUrl.replace('https://www.trendstore-ly.com', ''));
await shot('admin-test-3-login-page');

// Fill login form
try {
  const emailInput = p.locator('input[type="email"], input[name="email"]').first();
  const passInput = p.locator('input[type="password"]').first();
  await emailInput.fill('mo3iemohamed@gmail.com');
  await passInput.fill('Mo3ie@2025');  // attempt
  await shot('admin-test-4-filled');

  // Submit
  const submitBtn = p.locator('button[type="submit"]').first();
  await submitBtn.click();
  await p.waitForTimeout(5000);
  const afterLogin = p.url();
  console.log('After login attempt URL:', afterLogin.replace('https://www.trendstore-ly.com', ''));
  await shot('admin-test-5-after-login');
} catch(e) {
  console.log('Login form error:', e.message.substring(0, 100));
  await shot('admin-test-4-error');
}

// 4. Try /admin after login
console.log('\n=== 4. /admin after login ===');
await goWait('https://www.trendstore-ly.com/admin', 7000);
const adminUrl = p.url();
console.log('Admin URL after login:', adminUrl.replace('https://www.trendstore-ly.com', ''));
const pageText = await p.locator('body').innerText().catch(() => '');
const isAdminPage = pageText.includes('أدمن') || pageText.includes('admin') || pageText.includes('طلب') || pageText.includes('إدارة');
console.log('Admin content visible:', isAdminPage ? '✅' : '❌');
console.log('Page preview:', pageText.substring(0, 200).replace(/\n/g, ' '));
await shot('admin-test-6-admin-page');

await b.close();
console.log('\n=== Done ===');
