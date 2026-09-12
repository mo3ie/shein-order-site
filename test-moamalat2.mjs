import { chromium } from "playwright";
const IMG = "/tmp/test-price.png";
const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
const networkErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", e => consoleErrors.push(e.message));
page.on("requestfailed", r => networkErrors.push(`${r.url()} — ${r.failure()?.errorText}`));

// 1. Load page
await page.goto(BASE, { waitUntil: "networkidle" });
console.log("1. Page loaded");

// 2. Fill form
await page.fill('input[placeholder*="shein.com"]', "https://www.shein.com/Cart");
await page.fill('input[placeholder*="اسم"]', "محمد علي");
await page.fill('input[type="tel"]', "0913456789");
await page.locator('input[type="file"]').setInputFiles(IMG);
console.log("2. Form filled");

// 3. Wait for OCR / price to appear
await page.waitForFunction(
  () => document.body.innerText.includes("تم استخراج") || document.body.innerText.includes("لم يُعثر"),
  { timeout: 15000 }
).catch(() => console.log("OCR timeout — continuing"));
console.log("3. OCR done");

// 4. Click submit → open payment modal
await page.locator("button").filter({ hasText: "إرسال" }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/m2-modal.png" });

// Detect modal by looking for any button containing معاملات
const moaBtn = page.locator("button").filter({ hasText: "معاملات" });
const visible = await moaBtn.isVisible().catch(() => false);
console.log("4. Moamalat button visible:", visible, "| count:", await moaBtn.count());

if (!visible) {
  console.log("Modal not open — checking validation errors...");
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log("Page text snippet:", bodyText);
  await browser.close();
  process.exit(1);
}

// 5. Click Moamalat
console.log("5. Clicking Moamalat button...");
await page.screenshot({ path: "/tmp/m2-before-click.png" });
await moaBtn.click();

// 6. Wait for LightBox (script load + iframe injection)
console.log("6. Waiting for LightBox to appear...");
let lightboxFound = false;

for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(1000);
  const iframes = await page.locator("iframe").count();
  const scripts = await page.evaluate(() =>
    [...document.querySelectorAll("script")].map(s => s.src).filter(s => s.includes("moamalat"))
  );
  const divOverlays = await page.evaluate(() =>
    [...document.querySelectorAll("div")].filter(d =>
      d.id?.toLowerCase().includes("light") ||
      d.className?.toString().toLowerCase().includes("light") ||
      d.style?.zIndex > 1000
    ).length
  );
  console.log(`  t=${i+1}s: iframes=${iframes}, moamalat scripts=${scripts.length}, high-z divs=${divOverlays}`);
  if (scripts.length > 0) console.log("  script src:", scripts);
  if (iframes > 0 || divOverlays > 0) { lightboxFound = true; break; }
}

await page.screenshot({ path: "/tmp/m2-lightbox.png" });

// 7. Console / network errors
console.log("\n── Console errors ──");
consoleErrors.forEach(e => console.log("  ❌", e));
if (!consoleErrors.length) console.log("  none");

console.log("\n── Network failures ──");
networkErrors.forEach(e => console.log("  ❌", e));
if (!networkErrors.length) console.log("  none");

console.log("\n── Result ──");
console.log(lightboxFound ? "✅ LightBox appeared" : "❌ LightBox did NOT appear");

await page.waitForTimeout(2000);
await browser.close();
