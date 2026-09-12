import { chromium } from "playwright";

const USERNAME = "0918621511";
const PASSWORD = "Jj17&%$#@";

const PAGES = [
  "https://merchant.moamalat.net/dashboard",
  "https://merchant.moamalat.net/transactions",
  "https://merchant.moamalat.net/profile",
  "https://merchant.moamalat.net/settings",
  "https://merchant.moamalat.net/integration",
  "https://merchant.moamalat.net/api",
  "https://merchant.moamalat.net/webhook",
  "https://merchant.moamalat.net/notification",
  "https://merchant.moamalat.net/terminal",
  "https://merchant.moamalat.net/terminal-settings",
];

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  // Login
  await page.goto("https://merchant.moamalat.net/login", { waitUntil: "networkidle" });
  await page.locator("input").nth(0).fill(USERNAME);
  await page.locator("input[type='password']").fill(PASSWORD);
  await page.locator("button[type='submit'], button:has-text('تسجيل الدخول')").click();
  await page.waitForTimeout(2000);

  if (page.url().includes("otp")) {
    console.log("⏳ أدخل OTP في المتصفح...");
    await page.waitForURL(url => !url.toString().includes("otp") && !url.toString().includes("login"), { timeout: 120000 });
  }

  console.log("✓ دخل:", page.url());

  // Try each page
  for (const url of PAGES) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 8000 });
      const finalUrl = page.url();
      if (finalUrl === url || !finalUrl.includes("login")) {
        const bodyText = await page.innerText("body").catch(() => "");
        const has = bodyText.substring(0, 300).replace(/\s+/g, " ");
        console.log(`\n[${url}] → ${finalUrl}`);
        console.log("  محتوى:", has);
        await page.screenshot({ path: `explore-${url.split("/").pop()}.png` });
      } else {
        console.log(`[${url}] → redirect to login (لا توجد)`);
      }
    } catch (e) {
      console.log(`[${url}] → خطأ: ${e.message.slice(0, 60)}`);
    }
  }

  console.log("\n→ انتهى الاستكشاف");
  await browser.close();
})();
