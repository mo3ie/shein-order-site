import { chromium } from "playwright";

export async function getSheinCart(url) {

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(5000);

  const totalPrice = await page.evaluate(() => {
    const priceElement = document.querySelector(".total-price");
    return priceElement ? priceElement.innerText : null;
  });

  await browser.close();

  return totalPrice;
}