import { chromium } from "playwright";

const USERNAME = "11149189278";
const PASSWORD = "170928";

const DETAILS = `We need to configure the webhook notification URL for our Web Terminal TID 42524546.

Please enable server-to-server payment notifications (webhook) for our online Lightbox integration.

The notification should be sent via POST method after each successful transaction.

We will provide the webhook URL once you confirm this service is available and how to configure it.

Merchant ID: 11149189278
Terminal ID: 42524546

Thank you.`;

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page    = await browser.newPage();

  await page.goto("https://npg.moamalat.net/Portal/Account/Login", { waitUntil: "networkidle" });
  await page.locator("input:not([type='password']):not([type='hidden']):visible").first().fill(USERNAME);
  await page.locator("input[type='password']:visible").first().fill(PASSWORD);
  await page.locator("button:has-text('Send OTP')").click();
  await page.waitForTimeout(1500);

  console.log("⏳ أدخل OTP واضغط Signin...");
  await page.waitForURL(url => !url.toString().includes("login") && !url.toString().includes("Account"), { timeout: 120000 });
  console.log("✓ دخل:", page.url());
  await page.waitForTimeout(1000);

  await page.goto("https://npg.moamalat.net/Portal/SupportTicketManagement/SupportTicket/Requests", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.selectOption("select[name='terminalNodeId']", { label: "42524546" });
  await page.waitForTimeout(300);
  await page.selectOption("select[name='servirityId']", { label: "High" });
  await page.waitForTimeout(300);
  await page.selectOption("select[name='SelectedRequest']", { label: "Online Help desk Support" });
  await page.waitForTimeout(300);
  await page.fill("textarea[name='details']", DETAILS);

  await page.screenshot({ path: "npg-ticket-filled.png" });
  console.log("→ الفورم مليء");

  await page.locator("button:has-text('Send')").click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "npg-ticket-sent.png" });
  console.log("→ URL بعد الإرسال:", page.url());

  const responseText = await page.innerText("body").catch(() => "");
  console.log("→ الرد:", responseText.replace(/\s+/g, " ").substring(0, 500));

  await browser.close();
})();
