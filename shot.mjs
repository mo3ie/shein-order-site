import { chromium } from "playwright";
const OUT = "C:/Users/BMC/trend-store";
const browser = await chromium.launch();

async function shot(name, vp, theme, path="/") {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch(e){} }, theme);
  await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 120000 }).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/shot-${name}.png`, fullPage: false });
  console.log("shot-" + name + ".png");
  await ctx.close();
}

const desktop = { width: 1280, height: 860 };
const mobile  = { width: 390, height: 844 };
await shot("home-desktop-dark",  desktop, "dark");
await shot("home-desktop-light", desktop, "light");
await shot("home-mobile-dark",   mobile,  "dark");
await shot("home-mobile-light",  mobile,  "light");
await browser.close();
