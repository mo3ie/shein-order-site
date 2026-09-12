const SUPABASE_URL = 'https://grazynglhjuuxesgusgd.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';

const CDN = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/';
const Q   = '?wid=800&hei=800&fmt=jpeg&qlt=90';
const img  = (id) => `${CDN}${id}${Q}`;
const imgs = (...ids) => ids.map(id => img(id));

// Fallbacks للنماذج التي لم نجد لها صور مباشرة
const F13PRO  = img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium'); // شكل مشابه
const F14PRO  = img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium');
const F15PMAX = img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium');
const F16PMAX = img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium');
const F17     = img('iphone-16-finish-select-202409-6-1inch-black');
const F17PRO  = img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium');

const updates = [
  // ─── iPhone 13 mini ───
  {
    id: 'fe0b4c58-2ce5-4b51-96ac-ab944b454760',
    image_url: img('iphone-13-mini-midnight-select-2021'),
    images: imgs(
      'iphone-13-mini-midnight-select-2021',
      'iphone-13-mini-starlight-select-2021',
      'iphone-13-mini-blue-select-2021',
      'iphone-13-mini-pink-select-2021',
    ),
  },
  // ─── iPhone 13 ───
  {
    id: 'e6aa46a4-12f2-4d26-a55c-418fdfe1fc3d',
    image_url: img('iphone-13-midnight-select-2021'),
    images: imgs(
      'iphone-13-midnight-select-2021',
      'iphone-13-starlight-select-2021',
      'iphone-13-blue-select-2021',
      'iphone-13-pink-select-2021',
    ),
  },
  // ─── iPhone 13 Pro (fallback → 15 Pro aesthetics) ───
  {
    id: 'ba5de287-c7b1-4df2-80c0-8056591d8bcc',
    image_url: F13PRO,
    images: [
      img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-whitetitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-bluetitanium'),
    ],
  },
  // ─── iPhone 13 Pro Max (fallback) ───
  {
    id: 'd495eaff-3639-475f-89ba-f1932c7c2014',
    image_url: F13PRO,
    images: [
      img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-whitetitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-bluetitanium'),
    ],
  },
  // ─── iPhone 14 ───
  {
    id: 'ae5317ae-b6a4-4858-b244-7eb3598cfc3e',
    image_url: img('iphone-14-midnight-select-202209'),
    images: imgs(
      'iphone-14-midnight-select-202209',
      'iphone-14-starlight-select-202209',
      'iphone-14-blue-select-202209',
      'iphone-14-purple-select-202209',
      'iphone-14-red-select-202209',
      'iphone-14-yellow-select-202303',
    ),
  },
  // ─── iPhone 14 Plus ───
  {
    id: '7c159578-c103-4324-bf95-ba476a2860c8',
    image_url: img('iphone-14-plus-midnight-select-202209'),
    images: imgs(
      'iphone-14-plus-midnight-select-202209',
      'iphone-14-plus-starlight-select-202209',
      'iphone-14-plus-blue-select-202209',
      'iphone-14-plus-purple-select-202209',
      'iphone-14-plus-red-select-202209',
      'iphone-14-plus-yellow-select-202303',
    ),
  },
  // ─── iPhone 14 Pro (fallback → 16 Pro) ───
  {
    id: '8435f05b-7fab-4d04-a761-9f1415c0500d',
    image_url: F14PRO,
    images: [
      img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-whitetitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-deserttitanium'),
    ],
  },
  // ─── iPhone 14 Pro Max (fallback) ───
  {
    id: 'fa61a5b1-1072-4eeb-8905-fc9d92665481',
    image_url: F14PRO,
    images: [
      img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-whitetitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-deserttitanium'),
    ],
  },
  // ─── iPhone 15 ───
  {
    id: 'ccf04426-2138-41f1-b289-2c55eb099399',
    image_url: img('iphone-15-finish-select-202309-6-1inch-black'),
    images: imgs(
      'iphone-15-finish-select-202309-6-1inch-black',
      'iphone-15-finish-select-202309-6-1inch-blue',
      'iphone-15-finish-select-202309-6-1inch-green',
      'iphone-15-finish-select-202309-6-1inch-pink',
      'iphone-15-finish-select-202309-6-1inch-yellow',
    ),
  },
  // ─── iPhone 15 Plus ───
  {
    id: '2055110c-26a2-4a8c-b3ee-d3b94708b6ba',
    image_url: img('iphone-15-plus-black-select-202309'),
    images: imgs(
      'iphone-15-plus-black-select-202309',
      'iphone-15-plus-blue-select-202309',
      'iphone-15-plus-green-select-202309',
      'iphone-15-plus-pink-select-202309',
      'iphone-15-plus-yellow-select-202309',
    ),
  },
  // ─── iPhone 15 Pro ───
  {
    id: '18a1e708-aba9-4921-b08c-8e626666aa90',
    image_url: img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium'),
    images: imgs(
      'iphone-15-pro-finish-select-202309-6-1inch-blacktitanium',
      'iphone-15-pro-finish-select-202309-6-1inch-whitetitanium',
      'iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium',
      'iphone-15-pro-finish-select-202309-6-1inch-bluetitanium',
    ),
  },
  // ─── iPhone 15 Pro Max (fallback → 15 Pro) ───
  {
    id: 'c1ca5e8f-7adc-4fbe-ab37-75d804a52036',
    image_url: F15PMAX,
    images: [
      img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-whitetitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium'),
      img('iphone-15-pro-finish-select-202309-6-1inch-bluetitanium'),
    ],
  },
  // ─── iPhone 16 ───
  {
    id: '6dcb2607-537c-4362-a385-9eb74cc55f56',
    image_url: img('iphone-16-finish-select-202409-6-1inch-black'),
    images: imgs(
      'iphone-16-finish-select-202409-6-1inch-black',
      'iphone-16-finish-select-202409-6-1inch-white',
      'iphone-16-finish-select-202409-6-1inch-pink',
      'iphone-16-finish-select-202409-6-1inch-teal',
      'iphone-16-finish-select-202409-6-1inch-ultramarine',
    ),
  },
  // ─── iPhone 16 Plus ───
  {
    id: '00450855-5063-4eb3-b8a0-1b1a987f1233',
    image_url: img('iphone-16-plus-black-select-202409'),
    images: imgs(
      'iphone-16-plus-black-select-202409',
      'iphone-16-plus-white-select-202409',
      'iphone-16-plus-pink-select-202409',
      'iphone-16-plus-teal-select-202409',
      'iphone-16-plus-ultramarine-select-202409',
    ),
  },
  // ─── iPhone 16 Pro ───
  {
    id: 'ac83302d-e6da-479b-8177-81d9f56f9e7e',
    image_url: img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
    images: imgs(
      'iphone-16-pro-finish-select-202409-6-3inch-blacktitanium',
      'iphone-16-pro-finish-select-202409-6-3inch-whitetitanium',
      'iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium',
      'iphone-16-pro-finish-select-202409-6-3inch-deserttitanium',
    ),
  },
  // ─── iPhone 16 Pro Max (fallback → 16 Pro) ───
  {
    id: '3ac134e4-5322-4689-b212-bdb565f93d69',
    image_url: F16PMAX,
    images: [
      img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-whitetitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-deserttitanium'),
    ],
  },
  // ─── iPhone 17 (fallback → 16) ───
  {
    id: '0efbaff1-72cb-4810-9fa3-2cb747283be6',
    image_url: F17,
    images: [
      img('iphone-16-finish-select-202409-6-1inch-black'),
      img('iphone-16-finish-select-202409-6-1inch-white'),
      img('iphone-16-finish-select-202409-6-1inch-pink'),
      img('iphone-16-finish-select-202409-6-1inch-teal'),
      img('iphone-16-finish-select-202409-6-1inch-ultramarine'),
    ],
  },
  // ─── iPhone 17 Air (fallback → 16) ───
  {
    id: '62500759-7fb5-49ea-bf9d-898c405cbadf',
    image_url: F17,
    images: [
      img('iphone-16-finish-select-202409-6-1inch-black'),
      img('iphone-16-finish-select-202409-6-1inch-white'),
      img('iphone-16-finish-select-202409-6-1inch-pink'),
      img('iphone-16-finish-select-202409-6-1inch-teal'),
    ],
  },
  // ─── iPhone 17 Pro (fallback → 16 Pro) ───
  {
    id: '7cdb4014-66d2-498d-af40-2c02e009b480',
    image_url: F17PRO,
    images: [
      img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-whitetitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-deserttitanium'),
    ],
  },
  // ─── iPhone 17 Pro Max (existing product — update variants & images) ───
  {
    id: '7063ed1d-4017-418b-a533-8abac89ce8af',
    image_url: F17PRO,
    images: [
      img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-whitetitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium'),
      img('iphone-16-pro-finish-select-202409-6-3inch-deserttitanium'),
    ],
  },
];

async function updateProduct(update) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${update.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ image_url: update.image_url, images: update.images }),
  });
  return res.ok;
}

let ok = 0, fail = 0;
for (const u of updates) {
  const success = await updateProduct(u);
  if (success) { ok++; process.stdout.write('✅'); }
  else { fail++; process.stdout.write('❌'); }
}
console.log(`\n\nتم: ${ok} نجح · ${fail} فشل`);
