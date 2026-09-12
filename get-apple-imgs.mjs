import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(20000);

const results = {};

const models = [
  { key: 'iphone13', url: 'https://www.apple.com/shop/buy-iphone/iphone-13' },
  { key: 'iphone13pro', url: 'https://www.apple.com/shop/buy-iphone/iphone-13-pro' },
  { key: 'iphone14', url: 'https://www.apple.com/shop/buy-iphone/iphone-14' },
  { key: 'iphone14pro', url: 'https://www.apple.com/shop/buy-iphone/iphone-14-pro' },
  { key: 'iphone15', url: 'https://www.apple.com/shop/buy-iphone/iphone-15' },
  { key: 'iphone15pro', url: 'https://www.apple.com/shop/buy-iphone/iphone-15-pro' },
  { key: 'iphone16', url: 'https://www.apple.com/shop/buy-iphone/iphone-16' },
  { key: 'iphone16pro', url: 'https://www.apple.com/shop/buy-iphone/iphone-16-pro' },
];

for (const { key, url } of models) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    // جلب كل الصور التي تحتوي على as-images.apple.com
    const imgUrls = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      return imgs
        .map(img => img.src || img.dataset.src || '')
        .filter(src => src.includes('as-images.apple.com') || src.includes('store.storeimages'));
    });

    // استخراج الـ identifier فقط
    const ids = [...new Set(imgUrls.map(u => {
      const m = u.match(/\/is\/([^?&]+)/);
      return m ? m[1] : null;
    }).filter(Boolean))];

    results[key] = ids.slice(0, 8);
    console.log(`${key}: ${ids.slice(0, 4).join(', ')}`);
  } catch (e) {
    console.log(`❌ ${key}: ${e.message.substring(0,50)}`);
  }
}

await browser.close();
console.log('\nالنتائج الكاملة:', JSON.stringify(results, null, 2));
