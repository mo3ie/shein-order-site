import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
});
const page = await ctx.newPage();

// اجمع كل طلبات الصور التي تذهب لـ Apple CDN
const imageRequests = new Set();
page.on('request', req => {
  const url = req.url();
  if (url.includes('as-images.apple.com/is/')) imageRequests.add(url);
});

const targets = [
  { name: 'iphone-16-pro-max', url: 'https://www.apple.com/iphone-16-pro/' },
  { name: 'iphone-14', url: 'https://www.apple.com/iphone-14/' },
];

for (const { name, url } of targets) {
  imageRequests.clear();
  console.log(`\nفتح: ${name}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
  } catch {}

  const found = [...imageRequests].map(u => {
    const m = u.match(/\/is\/([^?]+)/);
    return m ? m[1] : null;
  }).filter(Boolean);

  console.log(name, '→', found.slice(0, 6).join('\n   '));
}

await browser.close();
