const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 1. Login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  console.log('1. LOGIN PAGE:', page.url());
  await page.screenshot({ path: '/c/Users/BMC/shein-order-site/ss1-login.png' });

  // 2. Google button
  const googleBtn = await page.locator('button:has-text("المتابعة بحساب جوجل")').count();
  console.log('2. Google button present:', googleBtn > 0);

  // 3. Capture supabase OAuth redirect
  let capturedOAuth = null;
  page.on('response', async res => {
    const u = res.url();
    if (u.includes('supabase') && (u.includes('oauth') || u.includes('authorize'))) {
      console.log('3. Supabase OAuth response:', u.substring(0, 300));
      const loc = res.headers()['location'];
      if (loc) {
        capturedOAuth = loc;
        console.log('   Location header (first 400):', loc.substring(0, 400));
      }
    }
  });

  // 4. Click Google button
  await page.locator('button:has-text("المتابعة بحساب جوجل")').click();
  await page.waitForTimeout(3500);
  const afterUrl = page.url();
  console.log('4. After click URL (300):', afterUrl.substring(0, 300));
  await page.screenshot({ path: '/c/Users/BMC/shein-order-site/ss2-after-google.png' });

  // 5. Check redirect_uri
  if (afterUrl.includes('accounts.google.com')) {
    const u = new URL(afterUrl);
    const redir = u.searchParams.get('redirect_uri');
    console.log('5. redirect_uri:', redir);
    console.log(redir && redir.includes('/auth/callback') ? '   ✅ Correct: /auth/callback' : '   ❌ Wrong redirect_uri');
  } else {
    console.log('5. No Google redirect yet. URL:', afterUrl.substring(0, 150));
  }
  if (capturedOAuth) {
    try {
      const u2 = new URL(capturedOAuth);
      const redir2 = u2.searchParams.get('redirect_uri');
      console.log('5b. OAuth location redirect_uri:', redir2);
    } catch(_){}
  }

  // 6. /auth/callback renders spinner
  const cb = await ctx.newPage();
  await cb.goto('http://localhost:3000/auth/callback');
  await cb.waitForLoadState('networkidle');
  console.log('6. /auth/callback:', cb.url());
  const spin = await cb.locator('text=جاري تسجيل الدخول').isVisible().catch(() => false);
  console.log('   Spinner visible:', spin);
  await cb.screenshot({ path: '/c/Users/BMC/shein-order-site/ss3-callback.png' });

  // 7. Middleware: /admin without cookie
  const noAuth = await ctx.newPage();
  await noAuth.goto('http://localhost:3000/admin');
  await noAuth.waitForLoadState('networkidle');
  const noAuthUrl = noAuth.url();
  console.log('7. /admin (no cookie):', noAuthUrl);
  console.log(noAuthUrl.includes('/login') ? '   ✅ Middleware: redirected to /login' : '   ❌ Middleware NOT working — reached admin without auth');
  await noAuth.screenshot({ path: '/c/Users/BMC/shein-order-site/ss4-admin-no-auth.png' });

  // 8. /admin WITH admin_role cookie
  const withAuth = await ctx.newPage();
  await withAuth.addCookies([{ name: 'admin_role', value: 'admin', domain: 'localhost', path: '/' }]);
  await withAuth.goto('http://localhost:3000/admin');
  await withAuth.waitForLoadState('networkidle');
  const withAuthUrl = withAuth.url();
  console.log('8. /admin (with cookie):', withAuthUrl);
  console.log(withAuthUrl.includes('/admin') && !withAuthUrl.includes('/login') ? '   ✅ Admin accessible with cookie' : '   ❌ Admin NOT accessible with cookie');
  await withAuth.screenshot({ path: '/c/Users/BMC/shein-order-site/ss5-admin-auth.png' });

  await browser.close();
  console.log('\nDone. Screenshots saved.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
