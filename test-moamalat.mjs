import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const BASE = "http://localhost:3000";
const IMG  = "/tmp/test-price.png";

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const ctx     = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page    = await ctx.newPage();

// Collect console errors
const consoleErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", e => consoleErrors.push(e.message));

// ── 1. Load home page ─────────────────────────────────────────────────────
await page.goto(BASE, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/moa-01-home.png" });
console.log("STEP 1: home page loaded");

// ── 2. Fill form ──────────────────────────────────────────────────────────
await page.fill('input[placeholder*="shein.com"]', "https://www.shein.com/Cart");
await page.fill('input[placeholder*="اسمك"]', "محمد علي");
await page.fill('input[placeholder*="091"]', "0913456789");

// Upload image
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles(IMG);
console.log("STEP 2: form filled, image uploaded");

// ── 3. Inject price via React state (bypass OCR on 1x1 image) ─────────────
// Wait a bit for Tesseract to finish, then force-set price if it's 0
await page.waitForTimeout(4000);

// Check if price extracted
const priceText = await page.locator("text=تم استخراج السعر").textContent().catch(() => null);
if (!priceText) {
  console.log("OCR didn't find price — injecting price state via React DevTools fiber");
  // Find the React fiber root and set state
  await page.evaluate(() => {
    // Walk fiber tree to find component with setPrice
    const root = document.querySelector("#__NEXT_SCROLLABLE_CONTENT, main, body");
    const fiberKey = Object.keys(root).find(k => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance"));

    // Fallback: dispatch custom event — our component doesn't listen to this
    // Instead use a simpler hack: find the hidden file input and simulate OCR result
    // We'll just proceed with price=0 and let Playwright click submit to see validation
    // OR we can use window.__setPrice if we add a debug hook — we don't have that
    // Best path: use page.evaluate to find fiber and call setState

    let fiber = root?.[fiberKey];
    const traverse = (f, depth = 0) => {
      if (!f || depth > 50) return null;
      if (f.memoizedState) {
        // Look for a state hook that holds a number (price)
        let state = f.memoizedState;
        while (state) {
          if (typeof state.memoizedState === "number" && state.memoizedState === 0) {
            try { state.queue?.dispatch(25); } catch(e) {}
          }
          state = state.next;
        }
      }
      return traverse(f.child, depth + 1) || traverse(f.sibling, depth + 1);
    };
    traverse(fiber);
  });
  await page.waitForTimeout(500);
}

await page.screenshot({ path: "/tmp/moa-02-form-filled.png" });
console.log("STEP 3: form state set");

// ── 4. Click submit ───────────────────────────────────────────────────────
const submitBtn = page.locator("button", { hasText: "إرسال الطلب" });
await submitBtn.click();
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/moa-03-after-submit.png" });

// Check if payment modal appeared
const modalTitle = await page.locator("text=اختر طريقة الدفع").isVisible().catch(() => false);
console.log("STEP 4: payment modal visible =", modalTitle);

// ── 5. Click Moamalat button ──────────────────────────────────────────────
if (modalTitle) {
  const moaBtn = page.locator("button", { hasText: "معاملات" });
  const count  = await moaBtn.count();
  console.log("Moamalat buttons found:", count);
  await page.screenshot({ path: "/tmp/moa-04-modal.png" });

  if (count > 0) {
    await moaBtn.first().click();
    console.log("STEP 5: clicked Moamalat");

    // Wait for LightBox script to load and iframe to appear
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "/tmp/moa-05-after-moamalat-click.png" });

    // Check for LightBox iframe
    const frames    = page.frames();
    const lightbox  = await page.locator("iframe").count();
    const overlay   = await page.locator("[id*='lightbox'], [class*='lightbox'], [id*='moamalat']").count();
    console.log("iframes on page:", lightbox, "| overlay elements:", overlay);
    console.log("All frame URLs:", frames.map(f => f.url()));

    await page.screenshot({ path: "/tmp/moa-06-lightbox.png" });
  }
} else {
  // Validation errors — show them
  const errs = await page.locator("p[style*='ef4444']").allTextContents();
  console.log("Validation errors:", errs);
  await page.screenshot({ path: "/tmp/moa-04-validation-errors.png" });
}

// ── 6. Console errors report ──────────────────────────────────────────────
if (consoleErrors.length) {
  console.log("\nCONSOLE ERRORS:");
  consoleErrors.forEach(e => console.log("  ❌", e));
} else {
  console.log("\nNo console errors.");
}

await browser.close();
console.log("\nDone. Screenshots in /tmp/moa-*.png");
