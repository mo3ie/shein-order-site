const SUPABASE_URL = 'https://grazynglhjuuxesgusgd.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';
const APPLE_CDN    = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/';
const APPLE_Q      = '?wid=800&hei=800&fmt=jpeg&qlt=90';
const STORAGE_URL  = `${SUPABASE_URL}/storage/v1/object/products/iphones/`;
const PUBLIC_BASE  = `${SUPABASE_URL}/storage/v1/object/public/products/iphones/`;

// قائمة الصور: [id_apple, اسم_الملف]
const images = [
  // iPhone 13 mini
  ['iphone-13-mini-midnight-select-2021',   '13mini-midnight'],
  ['iphone-13-mini-starlight-select-2021',  '13mini-starlight'],
  ['iphone-13-mini-blue-select-2021',       '13mini-blue'],
  ['iphone-13-mini-pink-select-2021',       '13mini-pink'],
  // iPhone 13
  ['iphone-13-midnight-select-2021',    '13-midnight'],
  ['iphone-13-starlight-select-2021',   '13-starlight'],
  ['iphone-13-blue-select-2021',        '13-blue'],
  ['iphone-13-pink-select-2021',        '13-pink'],
  // iPhone 13 Pro fallback (نستخدم 15 Pro)
  ['iphone-15-pro-finish-select-202309-6-1inch-blacktitanium',   '13pro-blacktitanium'],
  ['iphone-15-pro-finish-select-202309-6-1inch-whitetitanium',   '13pro-whitetitanium'],
  ['iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium', '13pro-naturaltitanium'],
  ['iphone-15-pro-finish-select-202309-6-1inch-bluetitanium',    '13pro-bluetitanium'],
  // iPhone 14
  ['iphone-14-midnight-select-202209',  '14-midnight'],
  ['iphone-14-starlight-select-202209', '14-starlight'],
  ['iphone-14-blue-select-202209',      '14-blue'],
  ['iphone-14-purple-select-202209',    '14-purple'],
  ['iphone-14-red-select-202209',       '14-red'],
  ['iphone-14-yellow-select-202303',    '14-yellow'],
  // iPhone 14 Plus
  ['iphone-14-plus-midnight-select-202209',  '14plus-midnight'],
  ['iphone-14-plus-starlight-select-202209', '14plus-starlight'],
  ['iphone-14-plus-blue-select-202209',      '14plus-blue'],
  ['iphone-14-plus-purple-select-202209',    '14plus-purple'],
  ['iphone-14-plus-red-select-202209',       '14plus-red'],
  ['iphone-14-plus-yellow-select-202303',    '14plus-yellow'],
  // iPhone 14 Pro fallback (نستخدم 16 Pro)
  ['iphone-16-pro-finish-select-202409-6-3inch-blacktitanium',   '14pro-blacktitanium'],
  ['iphone-16-pro-finish-select-202409-6-3inch-whitetitanium',   '14pro-whitetitanium'],
  ['iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium', '14pro-naturaltitanium'],
  ['iphone-16-pro-finish-select-202409-6-3inch-deserttitanium',  '14pro-deserttitanium'],
  // iPhone 15
  ['iphone-15-finish-select-202309-6-1inch-black',  '15-black'],
  ['iphone-15-finish-select-202309-6-1inch-blue',   '15-blue'],
  ['iphone-15-finish-select-202309-6-1inch-green',  '15-green'],
  ['iphone-15-finish-select-202309-6-1inch-pink',   '15-pink'],
  ['iphone-15-finish-select-202309-6-1inch-yellow', '15-yellow'],
  // iPhone 15 Plus
  ['iphone-15-plus-black-select-202309',  '15plus-black'],
  ['iphone-15-plus-blue-select-202309',   '15plus-blue'],
  ['iphone-15-plus-green-select-202309',  '15plus-green'],
  ['iphone-15-plus-pink-select-202309',   '15plus-pink'],
  ['iphone-15-plus-yellow-select-202309', '15plus-yellow'],
  // iPhone 15 Pro
  ['iphone-15-pro-finish-select-202309-6-1inch-blacktitanium',   '15pro-blacktitanium'],
  ['iphone-15-pro-finish-select-202309-6-1inch-whitetitanium',   '15pro-whitetitanium'],
  ['iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium', '15pro-naturaltitanium'],
  ['iphone-15-pro-finish-select-202309-6-1inch-bluetitanium',    '15pro-bluetitanium'],
  // iPhone 16
  ['iphone-16-finish-select-202409-6-1inch-black',       '16-black'],
  ['iphone-16-finish-select-202409-6-1inch-white',       '16-white'],
  ['iphone-16-finish-select-202409-6-1inch-pink',        '16-pink'],
  ['iphone-16-finish-select-202409-6-1inch-teal',        '16-teal'],
  ['iphone-16-finish-select-202409-6-1inch-ultramarine', '16-ultramarine'],
  // iPhone 16 Plus
  ['iphone-16-plus-black-select-202409',       '16plus-black'],
  ['iphone-16-plus-white-select-202409',       '16plus-white'],
  ['iphone-16-plus-pink-select-202409',        '16plus-pink'],
  ['iphone-16-plus-teal-select-202409',        '16plus-teal'],
  ['iphone-16-plus-ultramarine-select-202409', '16plus-ultramarine'],
  // iPhone 16 Pro
  ['iphone-16-pro-finish-select-202409-6-3inch-blacktitanium',   '16pro-blacktitanium'],
  ['iphone-16-pro-finish-select-202409-6-3inch-whitetitanium',   '16pro-whitetitanium'],
  ['iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium', '16pro-naturaltitanium'],
  ['iphone-16-pro-finish-select-202409-6-3inch-deserttitanium',  '16pro-deserttitanium'],
];

async function uploadImage(appleId, filename) {
  // 1. تحميل الصورة من Apple CDN
  const fetchRes = await fetch(APPLE_CDN + appleId + APPLE_Q, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  if (!fetchRes.ok) return { ok: false, reason: `fetch ${fetchRes.status}` };

  const buffer = await fetchRes.arrayBuffer();

  // 2. رفع إلى Supabase Storage
  const uploadRes = await fetch(STORAGE_URL + filename + '.jpg', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return { ok: false, reason: err.substring(0, 80) };
  }

  return { ok: true, url: PUBLIC_BASE + filename + '.jpg' };
}

const urlMap = {};
let ok = 0, fail = 0;

for (const [appleId, filename] of images) {
  const result = await uploadImage(appleId, filename);
  if (result.ok) {
    urlMap[filename] = result.url;
    ok++;
    process.stdout.write('✅');
  } else {
    fail++;
    console.log(`\n❌ ${filename}: ${result.reason}`);
  }
}

console.log(`\n\nنجح: ${ok} · فشل: ${fail}`);
console.log('\nخريطة الصور:');
for (const [k, v] of Object.entries(urlMap)) {
  console.log(`  ${k}: ${v}`);
}
