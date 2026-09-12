import { chromium } from 'playwright';

const SB_URL = 'https://grazynglhjuuxesgusgd.supabase.co';
const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';
const BASE = 'https://www.trendstore-ly.com';

// Generate magic link
const res = await fetch(`${SB_URL}/auth/v1/admin/generate_link`, {
  method: 'POST',
  headers: {
    apikey: SRK,
    Authorization: `Bearer ${SRK}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ type: 'magiclink', email: 'mo3iemohamed@gmail.com', redirect_to: `${BASE}/auth/callback` }),
});
const linkData = await res.json();
const action_link = linkData.action_link || linkData.properties?.action_link;
if (!action_link) { console.error('فشل إنشاء magic link:', JSON.stringify(linkData)); process.exit(1); }

const b = await chromium.launch({ headless: true });
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 800 });

const shot = async (name) => p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png` }).catch(() => {});
const go = async (url, ms = 15000) => {
  try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: ms }); }
  catch { await p.waitForTimeout(2000); }
};

// ── Auth ─────────────────────────────────────────────────────────────────────
await go(action_link);
await p.waitForTimeout(8000);
console.log('Auth URL after callback:', p.url().replace(BASE, ''));

// ══ 1. Home page — search cursor fix ════════════════════════════════════════
await go(`${BASE}/`);
await p.waitForTimeout(4000);
const searchInput = p.locator('input[placeholder*="ابحث"]').first();
let searchOK = false;
try {
  await searchInput.click();
  await searchInput.type('آي', { delay: 80 });
  await p.waitForTimeout(500);
  const val = await searchInput.inputValue();
  searchOK = val === 'آي';
  console.log(`\n✅ 1. البحث — قيمة بعد الكتابة: "${val}" ${searchOK ? '✅ يعمل' : '❌ توقف'}`);
} catch (e) {
  console.log(`\n❌ 1. البحث — خطأ: ${e.message}`);
}
await shot('v-1-home-search');

// ══ 2. Sidebar favorites link ════════════════════════════════════════════════
const favLinks = await p.locator('a[href="/account?tab=favorites"]').count();
console.log(`\n${favLinks > 0 ? '✅' : '❌'} 2. رابط المفضلة في القائمة الجانبية — ${favLinks > 0 ? `موجود (${favLinks} مرة)` : 'غير موجود'}`);

// ══ 3. Admin orders — two tabs ═══════════════════════════════════════════════
await go(`${BASE}/admin/orders`);
await p.waitForTimeout(6000);
const adminText = await p.locator('body').innerText().catch(() => '');
const hasStoretab = adminText.includes('المتجر الإلكتروني');
const hasSheinTab = adminText.includes('طلبات شي');
console.log(`\n${hasStoretab ? '✅' : '❌'} 3a. تاب المتجر الإلكتروني — ${hasStoretab ? 'ظاهر' : 'غير موجود'}`);
console.log(`${hasSheinTab ? '✅' : '❌'} 3b. تاب طلبات شي إن — ${hasSheinTab ? 'ظاهر' : 'غير موجود'}`);
console.log(`   (preview: "${adminText.slice(0, 150).replace(/\s+/g, ' ')}")`);
await shot('v-2-admin-orders');

// Click Shein tab
const sheinTab = p.locator('button', { hasText: 'طلبات شي' });
if (await sheinTab.count() > 0) {
  await sheinTab.click();
  await p.waitForTimeout(2000);
  const sheinText = await p.locator('body').innerText().catch(() => '');
  const hasSheinTable = sheinText.includes('شي') && (sheinText.includes('اسم') || sheinText.includes('الاسم') || sheinText.includes('السعر') || sheinText.includes('رابط'));
  console.log(`${hasSheinTable ? '✅' : '⚠️'} 3c. جدول شي إن بعد النقر — ${hasSheinTable ? 'ظاهر' : 'لم تظهر بيانات'}`);
  await shot('v-3-admin-shein-tab');
}

// Click store tab & try opening detail modal
await go(`${BASE}/admin/orders`);
await p.waitForTimeout(5000);
const viewBtn = p.locator('button', { hasText: 'عرض' }).first();
if (await viewBtn.count() > 0) {
  await viewBtn.click();
  await p.waitForTimeout(1500);
  const modalText = await p.locator('body').innerText().catch(() => '');
  const hasModal = modalText.includes('تفاصيل الطلب') || modalText.includes('بيانات الزبون');
  console.log(`\n${hasModal ? '✅' : '❌'} 3d. Modal تفاصيل الطلب — ${hasModal ? 'يفتح' : 'لم يفتح'}`);
  await shot('v-4-admin-modal');
  // Close modal
  await p.keyboard.press('Escape');
} else {
  console.log('\n⚠️ 3d. Modal — لا توجد طلبات للاختبار');
}

// ══ 4. Customer /orders page ══════════════════════════════════════════════════
await go(`${BASE}/orders`);
await p.waitForTimeout(5000);
const ordersText = await p.locator('body').innerText().catch(() => '');
const hasOrdersPage = ordersText.includes('طلباتي');
const hasNewOrderBtn = ordersText.includes('طلب جديد');
const hasPrintBtn = ordersText.includes('طباعة');
console.log(`\n${hasOrdersPage ? '✅' : '❌'} 4a. صفحة طلباتي — ${hasOrdersPage ? 'ظاهرة' : 'لم تظهر'}`);
console.log(`${hasNewOrderBtn ? '✅' : '⚠️'} 4b. زر طلب جديد — ${hasNewOrderBtn ? 'موجود' : 'غير موجود'}`);
// Expand first order if any
const firstCard = p.locator('.rounded-2xl.overflow-hidden').first();
if (await firstCard.count() > 0) {
  await firstCard.click();
  await p.waitForTimeout(1000);
  const expandedText = await p.locator('body').innerText().catch(() => '');
  const showPrint = expandedText.includes('طباعة الوصل');
  console.log(`${showPrint ? '✅' : '⚠️'} 4c. زر طباعة الوصل — ${showPrint ? 'ظاهر' : 'غير ظاهر (لا توجد طلبات؟)'}`);
}
await shot('v-5-orders');

// ══ 5. Wallet modal — DPay methods ═══════════════════════════════════════════
await go(`${BASE}/`);
await p.waitForTimeout(4000);
// Click wallet button in sidebar
const walletBtn = p.locator('button', { hasText: 'محفظتي' }).first();
if (await walletBtn.count() > 0) {
  await walletBtn.click();
  await p.waitForTimeout(1500);
  const walletText = await p.locator('body').innerText().catch(() => '');
  const hasWallet = walletText.includes('محفظتي') || walletText.includes('الرصيد');
  console.log(`\n${hasWallet ? '✅' : '❌'} 5a. Modal المحفظة — ${hasWallet ? 'يفتح' : 'لم يفتح'}`);
  // Go to recharge tab — use first() to avoid strict mode error
  const rechargeTab = p.locator('button', { hasText: 'شحن الرصيد' }).first();
  if (await rechargeTab.count() > 0) {
    await rechargeTab.click();
    await p.waitForTimeout(800);
    const rechText = await p.locator('body').innerText().catch(() => '');
    const hasEdf2 = rechText.includes('ادفع لي');
    const hasMoam2 = rechText.includes('معاملات');
    const hasYousr = rechText.includes('يسر باي');
    const hasMobi = rechText.includes('موبي كاش');
    console.log(`${hasEdf2 ? '✅' : '❌'} 5b. ادفع لي — ${hasEdf2 ? 'ظاهر' : 'غير موجود'}`);
    console.log(`${hasMoam2 ? '✅' : '❌'} 5c. معاملات — ${hasMoam2 ? 'ظاهر' : 'غير موجود'}`);
    console.log(`${hasYousr ? '✅' : '❌'} 5d. يسر باي — ${hasYousr ? 'ظاهر' : 'غير موجود'}`);
    console.log(`${hasMobi ? '✅' : '❌'} 5e. موبي كاش — ${hasMobi ? 'ظاهر' : 'غير موجود'}`);
  }
  await shot('v-6-wallet');
}

// ══ 6. Favorites page ════════════════════════════════════════════════════════
await go(`${BASE}/account?tab=favorites`);
await p.waitForTimeout(5000);
const favText = await p.locator('body').innerText().catch(() => '');
const hasFavPage = favText.includes('المفضلة') || favText.includes('منتج محفوظ');
console.log(`\n${hasFavPage ? '✅' : '❌'} 6. صفحة المفضلة — ${hasFavPage ? 'تفتح' : 'لم تفتح'}`);
await shot('v-7-favorites');

await b.close();
console.log('\n── انتهى الاختبار ──');
