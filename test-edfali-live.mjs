/**
 * اختبار ادفع لي الحقيقي
 * يفتح المتصفح أمامك ويصل لخطوة إدخال الـ OTP — أنت تدخله بيدك
 *
 * Usage:  node test-edfali-live.mjs <رقم_هاتف_الزبون>
 * مثال:   node test-edfali-live.mjs 0912345678
 */
import { chromium } from 'playwright';

const customerPhone = process.argv[2];
if (!customerPhone) {
  console.error('❌ أدخل رقم هاتف الزبون: node test-edfali-live.mjs 0912345678');
  process.exit(1);
}

const SRK   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';
const BASE  = 'https://www.trendstore-ly.com';
const AMOUNT = 5;

const shot = (p, name) => p.screenshot({ path: `C:/Users/BMC/shein-order-site/${name}.png`, fullPage: false }).catch(() => {});

// ── مصادقة ──────────────────────────────────────────────────────────────────
console.log('⏳ إنشاء رابط تسجيل الدخول...');
const lr = await fetch('https://grazynglhjuuxesgusgd.supabase.co/auth/v1/admin/generate_link', {
  method: 'POST',
  headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'magiclink', email: 'mo3iemohamed@gmail.com', redirect_to: `${BASE}/auth/callback` }),
});
const { action_link } = await lr.json();
if (!action_link) { console.error('❌ فشل إنشاء رابط الدخول'); process.exit(1); }
console.log('✅ رابط الدخول جاهز');

const b   = await chromium.launch({ headless: false, slowMo: 200 });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p   = await ctx.newPage();

// Auth
await p.goto(action_link, { waitUntil: 'commit', timeout: 20000 }).catch(() => {});
await p.waitForTimeout(10000);
console.log('URL بعد Auth:', p.url().replace(BASE, '') || p.url());

await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
await p.waitForTimeout(5000);
await shot(p, 'edfali-0-home');
console.log('\n📱 اختبار شحن المحفظة —', AMOUNT, 'د.ل — هاتف:', customerPhone);

// ── فتح المحفظة ───────────────────────────────────────────────────────────
const walletBtn = p.locator('button', { hasText: 'محفظتي' }).first();
if (await walletBtn.count() === 0) {
  console.error('❌ زر المحفظة غير موجود');
  await shot(p, 'edfali-error-no-wallet');
  await b.close(); process.exit(1);
}
await walletBtn.click();
await p.waitForTimeout(3000);
await shot(p, 'edfali-1-wallet-modal');

// اطبع نص الصفحة لنرى ما هو مرئي
const bodyText = await p.locator('body').innerText().catch(() => '');
console.log('\n── نص Modal المحفظة ──');
console.log(bodyText.slice(0, 400).replace(/\s+/g, ' '));

// ── البحث عن أزرار التاب ─────────────────────────────────────────────────
const allBtns = await p.locator('button').allInnerTexts();
console.log('\n── كل الأزرار الظاهرة ──');
console.log(allBtns.filter(t => t.trim()).join(' | ').slice(0, 300));

// محاولة النقر على تاب الشحن بعدة طرق
let tabClicked = false;

// محاولة 1: بنص مطابق
const tab1 = p.getByRole('button', { name: 'شحن الرصيد', exact: true });
if (await tab1.count() > 0) {
  await tab1.first().click(); tabClicked = true;
  console.log('✅ نقر التاب — طريقة 1 (exact)');
}

// محاولة 2: بـ filter
if (!tabClicked) {
  const tab2 = p.locator('button').filter({ hasText: /^شحن الرصيد$/ });
  if (await tab2.count() > 0) {
    await tab2.first().click(); tabClicked = true;
    console.log('✅ نقر التاب — طريقة 2 (regex)');
  }
}

// محاولة 3: كل الأزرار التي تحتوي "شحن"
if (!tabClicked) {
  const tab3 = p.locator('button').filter({ hasText: 'شحن' });
  const cnt = await tab3.count();
  console.log('أزرار تحتوي "شحن":', cnt);
  if (cnt > 0) {
    await tab3.first().click(); tabClicked = true;
    console.log('✅ نقر التاب — طريقة 3 (contains شحن)');
  }
}

if (!tabClicked) {
  console.error('❌ لم يُعثر على تاب شحن الرصيد');
  await b.close(); process.exit(1);
}

await p.waitForTimeout(1500);
await shot(p, 'edfali-2-recharge-tab');

// ── المبلغ ────────────────────────────────────────────────────────────────
const amtInput = p.locator('input[type="number"]').first();
if (await amtInput.count() > 0) {
  await amtInput.fill(String(AMOUNT));
  console.log('✅ المبلغ:', AMOUNT, 'د.ل');
} else {
  console.error('❌ حقل المبلغ غير موجود');
  await b.close(); process.exit(1);
}

await p.waitForTimeout(800);

// ── اختيار ادفع لي ───────────────────────────────────────────────────────
const edfaliBtn = p.locator('button').filter({ hasText: 'ادفع لي' }).first();
if (await edfaliBtn.count() === 0) {
  console.error('❌ زر ادفع لي غير موجود');
  await shot(p, 'edfali-error-no-btn');
  await b.close(); process.exit(1);
}
await edfaliBtn.click();
await p.waitForTimeout(1000);
console.log('✅ تم اختيار ادفع لي');

// ── رقم الهاتف ───────────────────────────────────────────────────────────
const phoneInput = p.locator('input[type="tel"]').first();
if (await phoneInput.count() === 0) {
  console.error('❌ حقل الهاتف غير ظاهر');
  await shot(p, 'edfali-error-no-phone');
  await b.close(); process.exit(1);
}
await phoneInput.fill(customerPhone);
await p.waitForTimeout(500);
console.log('✅ الهاتف:', customerPhone);
await shot(p, 'edfali-3-ready-to-send');

// ── إرسال رمز التحقق ─────────────────────────────────────────────────────
const sendBtn = p.locator('button').filter({ hasText: /إرسال رمز التحقق/ }).first();
if (await sendBtn.count() === 0) {
  console.error('❌ زر الإرسال غير موجود');
  const btns = await p.locator('button').allInnerTexts();
  console.log('الأزرار:', btns.join(' | '));
  await b.close(); process.exit(1);
}

console.log('\n⏳ جاري الاتصال بخدمة ادفع لي...');
await sendBtn.click();

// انتظر حتى 40 ثانية لظهور حقل الـ OTP أو رسالة خطأ
let otpVisible = false;
let errorMsg   = '';
for (let i = 0; i < 40; i++) {
  await p.waitForTimeout(1000);
  const txt = await p.locator('body').innerText().catch(() => '');
  if (txt.includes('رمز التحقق') && (txt.includes('0000') || txt.includes('أُرسل'))) {
    otpVisible = true;
    break;
  }
  if (/خطأ|فشل|غير مسجل|خارج الحدود|غير موجود|تعذّر/.test(txt)) {
    errorMsg = txt.match(/[^\n]*(?:خطأ|فشل|غير مسجل|خارج الحدود|غير موجود|تعذّر)[^\n]*/)?.[0] || txt.slice(0, 150);
    break;
  }
  process.stdout.write(i % 5 === 0 ? `\n${i}s ` : '.');
}
console.log('');

await shot(p, 'edfali-4-after-send');

if (errorMsg) {
  console.error('\n❌ خطأ من الخدمة:', errorMsg.replace(/\s+/g, ' '));
  // اطبع النص الكامل للتشخيص
  const full = await p.locator('body').innerText().catch(() => '');
  console.log('── نص الصفحة ──');
  console.log(full.slice(0, 500).replace(/\s+/g, ' '));
  await b.close();
  process.exit(1);
}

if (!otpVisible) {
  console.error('❌ لم يظهر حقل OTP بعد 40 ثانية');
  const full = await p.locator('body').innerText().catch(() => '');
  console.log('── نص الصفحة ──');
  console.log(full.slice(0, 500).replace(/\s+/g, ' '));
  await b.close();
  process.exit(1);
}

console.log('\n✅ ✅ ✅ تم إرسال رمز التحقق SMS إلى:', customerPhone);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📲 أدخل الرمز في المتصفح المفتوح أمامك ثم اضغط "تأكيد"');
console.log('⏰ لديك 3 دقائق...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// انتظر 3 دقائق للمستخدم يدخل الـ OTP
let success = false;
for (let i = 0; i < 180; i++) {
  await p.waitForTimeout(1000);
  const txt = await p.locator('body').innerText().catch(() => '');
  if (txt.includes('تم شحن المحفظة بنجاح') || txt.includes('✅')) {
    success = true;
    break;
  }
}

await shot(p, 'edfali-5-final');
const finalText = await p.locator('body').innerText().catch(() => '');

if (success || finalText.includes('تم شحن')) {
  console.log('\n🎉 نجح الاختبار! تم شحن المحفظة بـ', AMOUNT, 'د.ل عبر ادفع لي ✅');
} else {
  console.log('\n⚠️  انتهى الوقت. آخر حالة:', finalText.slice(0, 200).replace(/\s+/g, ' '));
}

await b.close();
