import { chromium } from "playwright";

const USERNAME = "0918621511";
const PASSWORD = "Jj17&%$#@";

const WEBHOOK_SHEIN  = "https://order.trendstore-ly.com/api/moamalat/webhook";
const WEBHOOK_TREND  = "https://trendstore-ly.com/api/payment/moamalat/webhook";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page    = await browser.newPage();

  console.log("→ فتح بوابة معاملات...");
  await page.goto("https://merchant.moamalat.net/login", { waitUntil: "networkidle" });

  await page.locator("input").nth(0).fill(USERNAME);
  await page.locator("input[type='password']").fill(PASSWORD);
  await page.locator("button[type='submit'], button:has-text('تسجيل الدخول')").click();
  await page.waitForTimeout(2000);

  // OTP step
  if (page.url().includes("otp")) {
    console.log("⏳ أدخل رمز OTP في المتصفح ثم اضغط زر التأكيد...");
    console.log("   (الكود مرسل لرقم:", USERNAME, ")");
    // Wait until user completes OTP and we leave the otp page
    await page.waitForURL(url => !url.toString().includes("otp") && !url.toString().includes("login"), { timeout: 120000 });
    console.log("✓ تم التحقق! URL:", page.url());
  }

  await page.waitForTimeout(1500);
  await page.screenshot({ path: "wh-4-dashboard.png" });
  console.log("→ لوحة التحكم:", page.url());

  // Print page structure
  const navTexts = await page.$$eval("nav a, .sidebar a, aside a, [class*='nav'] a, [class*='side'] a, [class*='menu'] a", els =>
    els.map(e => ({ text: e.innerText.trim(), href: e.href })).filter(e => e.text)
  );
  console.log("→ روابط القائمة:");
  navTexts.forEach(l => console.log(`   "${l.text}" → ${l.href}`));

  const allBtns = await page.$$eval("a, button", els =>
    els.map(e => e.innerText.trim()).filter(t => t.length > 1 && t.length < 50)
  );
  console.log("→ كل العناصر:", [...new Set(allBtns)].slice(0, 50));

  // Navigate to settings / profile / integration
  const settingsLinks = await page.$$eval("a", els =>
    els.map(e => ({ text: e.innerText.trim(), href: e.href }))
       .filter(e => /setting|config|webhook|integration|profile|حساب|إعداد|تكامل|notification/i.test(e.text + e.href))
  );
  console.log("→ روابط الإعدادات:", settingsLinks);

  if (settingsLinks.length > 0) {
    console.log("→ فتح:", settingsLinks[0].href);
    await page.goto(settingsLinks[0].href);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "wh-5-settings.png" });
    const texts2 = await page.$$eval("a, button, label, h1, h2, h3, p", els =>
      els.map(e => e.innerText.trim()).filter(t => t.length > 1)
    );
    console.log("→ محتوى صفحة الإعدادات:", [...new Set(texts2)].slice(0, 60));
  }

  await page.screenshot({ path: "wh-6-final.png" });
  console.log("→ انتهى — الصور محفوظة");
  await browser.close();
})();
