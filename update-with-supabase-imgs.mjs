const SUPABASE_URL = 'https://grazynglhjuuxesgusgd.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';

const BASE = 'https://grazynglhjuuxesgusgd.supabase.co/storage/v1/object/public/products/iphones/';
const s = (name) => `${BASE}${name}.jpg`;

const updates = [
  // iPhone 13 mini
  { id: 'fe0b4c58-2ce5-4b51-96ac-ab944b454760',
    image_url: s('13mini-midnight'),
    images: [s('13mini-midnight'), s('13mini-starlight'), s('13mini-blue'), s('13mini-pink')] },

  // iPhone 13
  { id: 'e6aa46a4-12f2-4d26-a55c-418fdfe1fc3d',
    image_url: s('13-midnight'),
    images: [s('13-midnight'), s('13-starlight'), s('13-blue'), s('13-pink')] },

  // iPhone 13 Pro
  { id: 'ba5de287-c7b1-4df2-80c0-8056591d8bcc',
    image_url: s('13pro-blacktitanium'),
    images: [s('13pro-blacktitanium'), s('13pro-whitetitanium'), s('13pro-naturaltitanium'), s('13pro-bluetitanium')] },

  // iPhone 13 Pro Max
  { id: 'd495eaff-3639-475f-89ba-f1932c7c2014',
    image_url: s('13pro-blacktitanium'),
    images: [s('13pro-blacktitanium'), s('13pro-whitetitanium'), s('13pro-naturaltitanium'), s('13pro-bluetitanium')] },

  // iPhone 14
  { id: 'ae5317ae-b6a4-4858-b244-7eb3598cfc3e',
    image_url: s('14-midnight'),
    images: [s('14-midnight'), s('14-starlight'), s('14-blue'), s('14-purple'), s('14-red'), s('14-yellow')] },

  // iPhone 14 Plus
  { id: '7c159578-c103-4324-bf95-ba476a2860c8',
    image_url: s('14plus-midnight'),
    images: [s('14plus-midnight'), s('14plus-starlight'), s('14plus-blue'), s('14plus-purple'), s('14plus-red'), s('14plus-yellow')] },

  // iPhone 14 Pro
  { id: '8435f05b-7fab-4d04-a761-9f1415c0500d',
    image_url: s('14pro-blacktitanium'),
    images: [s('14pro-blacktitanium'), s('14pro-whitetitanium'), s('14pro-naturaltitanium'), s('14pro-deserttitanium')] },

  // iPhone 14 Pro Max
  { id: 'fa61a5b1-1072-4eeb-8905-fc9d92665481',
    image_url: s('14pro-blacktitanium'),
    images: [s('14pro-blacktitanium'), s('14pro-whitetitanium'), s('14pro-naturaltitanium'), s('14pro-deserttitanium')] },

  // iPhone 15
  { id: 'ccf04426-2138-41f1-b289-2c55eb099399',
    image_url: s('15-black'),
    images: [s('15-black'), s('15-blue'), s('15-green'), s('15-pink'), s('15-yellow')] },

  // iPhone 15 Plus
  { id: '2055110c-26a2-4a8c-b3ee-d3b94708b6ba',
    image_url: s('15plus-black'),
    images: [s('15plus-black'), s('15plus-blue'), s('15plus-green'), s('15plus-pink'), s('15plus-yellow')] },

  // iPhone 15 Pro
  { id: '18a1e708-aba9-4921-b08c-8e626666aa90',
    image_url: s('15pro-blacktitanium'),
    images: [s('15pro-blacktitanium'), s('15pro-whitetitanium'), s('15pro-naturaltitanium'), s('15pro-bluetitanium')] },

  // iPhone 15 Pro Max (يستخدم نفس صور 15 Pro)
  { id: 'c1ca5e8f-7adc-4fbe-ab37-75d804a52036',
    image_url: s('15pro-blacktitanium'),
    images: [s('15pro-blacktitanium'), s('15pro-whitetitanium'), s('15pro-naturaltitanium'), s('15pro-bluetitanium')] },

  // iPhone 16
  { id: '6dcb2607-537c-4362-a385-9eb74cc55f56',
    image_url: s('16-black'),
    images: [s('16-black'), s('16-white'), s('16-pink'), s('16-teal'), s('16-ultramarine')] },

  // iPhone 16 Plus
  { id: '00450855-5063-4eb3-b8a0-1b1a987f1233',
    image_url: s('16plus-black'),
    images: [s('16plus-black'), s('16plus-white'), s('16plus-pink'), s('16plus-teal'), s('16plus-ultramarine')] },

  // iPhone 16 Pro
  { id: 'ac83302d-e6da-479b-8177-81d9f56f9e7e',
    image_url: s('16pro-blacktitanium'),
    images: [s('16pro-blacktitanium'), s('16pro-whitetitanium'), s('16pro-naturaltitanium'), s('16pro-deserttitanium')] },

  // iPhone 16 Pro Max (يستخدم نفس صور 16 Pro)
  { id: '3ac134e4-5322-4689-b212-bdb565f93d69',
    image_url: s('16pro-blacktitanium'),
    images: [s('16pro-blacktitanium'), s('16pro-whitetitanium'), s('16pro-naturaltitanium'), s('16pro-deserttitanium')] },

  // iPhone 17 (يستخدم صور 16)
  { id: '0efbaff1-72cb-4810-9fa3-2cb747283be6',
    image_url: s('16-black'),
    images: [s('16-black'), s('16-white'), s('16-pink'), s('16-teal'), s('16-ultramarine')] },

  // iPhone 17 Air
  { id: '62500759-7fb5-49ea-bf9d-898c405cbadf',
    image_url: s('16-black'),
    images: [s('16-black'), s('16-white'), s('16-pink'), s('16-teal')] },

  // iPhone 17 Pro
  { id: '7cdb4014-66d2-498d-af40-2c02e009b480',
    image_url: s('16pro-blacktitanium'),
    images: [s('16pro-blacktitanium'), s('16pro-whitetitanium'), s('16pro-naturaltitanium'), s('16pro-deserttitanium')] },

  // iPhone 17 Pro Max (الموجود مسبقاً)
  { id: '7063ed1d-4017-418b-a533-8abac89ce8af',
    image_url: s('16pro-blacktitanium'),
    images: [s('16pro-blacktitanium'), s('16pro-whitetitanium'), s('16pro-naturaltitanium'), s('16pro-deserttitanium')] },
];

let ok = 0, fail = 0;
for (const u of updates) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${u.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ image_url: u.image_url, images: u.images }),
  });
  if (res.ok) { ok++; process.stdout.write('✅'); }
  else { fail++; process.stdout.write('❌'); }
}
console.log(`\n\nتم: ${ok} نجح · ${fail} فشل`);
