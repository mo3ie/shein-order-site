const SUPABASE_URL = 'https://grazynglhjuuxesgusgd.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYXp5bmdsaGp1dXhlc2d1c2dkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3MDg5NSwiZXhwIjoyMDkxMTQ2ODk1fQ.FaV1GafqAdJ8n0F05c1ov_IqlYVuyeHIirREpobMzak';

// Apple Store CDN base
const CDN = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is';
const Q   = '?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1';

// دالة مساعدة لبناء رابط صورة Apple
const img  = (id) => `${CDN}/${id}${Q}`;
const imgs = (...ids) => ids.map(id => `${CDN}/${id}${Q}`);

const products = [
  // ─────────────────────────── iPhone 13 mini ───────────────────────────
  {
    name: 'iPhone 13 mini',
    category: 'هواتف',
    price: 2500,
    stock: 15,
    description: `شاشة Super Retina XDR 5.4 بوصة · شريحة A15 Bionic بنواة 6
كاميرا مزدوجة 12 ميجابكسل (رئيسية + زاوية واسعة) · كاميرا أمامية TrueDepth 12 ميجابكسل
بطارية 12 ساعة فيديو · شحن MagSafe + Qi · مقاومة الماء IP68 (6 م / 30 د)
5G · Face ID · iOS 17 (قابل للتحديث)`,
    image_url: img('iphone-13-mini-finish-select-2021-midnight'),
    images: imgs(
      'iphone-13-mini-finish-select-2021-midnight',
      'iphone-13-mini-finish-select-2021-starlight',
      'iphone-13-mini-finish-select-2021-blue',
      'iphone-13-mini-finish-select-2021-pink',
      'iphone-13-mini-finish-select-2021-red'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Midnight)', 'أبيض (Starlight)', 'أزرق (Blue)', 'وردي (Pink)', 'أحمر (PRODUCT RED)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 13 ───────────────────────────
  {
    name: 'iPhone 13',
    category: 'هواتف',
    price: 2900,
    stock: 20,
    description: `شاشة Super Retina XDR 6.1 بوصة · شريحة A15 Bionic بنواة 6
كاميرا مزدوجة 12 ميجابكسل مع Night Mode و Photographic Styles · كاميرا أمامية 12 ميجابكسل
بطارية 19 ساعة فيديو · شحن MagSafe + Qi · مقاومة الماء IP68 (6 م / 30 د)
5G · Face ID · Cinematic Mode للفيديو`,
    image_url: img('iphone-13-finish-select-2021-midnight'),
    images: imgs(
      'iphone-13-finish-select-2021-midnight',
      'iphone-13-finish-select-2021-starlight',
      'iphone-13-finish-select-2021-blue',
      'iphone-13-finish-select-2021-pink',
      'iphone-13-finish-select-2021-green',
      'iphone-13-finish-select-2021-red'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Midnight)', 'أبيض (Starlight)', 'أزرق (Blue)', 'وردي (Pink)', 'أخضر (Green)', 'أحمر (PRODUCT RED)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 13 Pro ───────────────────────────
  {
    name: 'iPhone 13 Pro',
    category: 'هواتف',
    price: 3900,
    stock: 12,
    description: `شاشة Super Retina XDR ProMotion 6.1 بوصة 120Hz · شريحة A15 Bionic بنواة 5 GPU
ثلاث كاميرات 12 ميجابكسل (رئيسية + تيليفوتو + زاوية واسعة) مع LiDAR Scanner
Macro Photography · ProRes Video · شحن MagSafe · مقاومة الماء IP68 (6 م / 30 د)
5G · Face ID · بطارية 22 ساعة`,
    image_url: img('iphone-13-pro-finish-select-2021-graphite'),
    images: imgs(
      'iphone-13-pro-finish-select-2021-graphite',
      'iphone-13-pro-finish-select-2021-gold',
      'iphone-13-pro-finish-select-2021-silver',
      'iphone-13-pro-finish-select-2021-sierrablue',
      'iphone-13-pro-finish-select-2022-alpine-green'
    ),
    variants: [
      { name: 'اللون', options: ['جرافيت (Graphite)', 'ذهبي (Gold)', 'فضي (Silver)', 'أزرق سييرا (Sierra Blue)', 'أخضر ألبيني (Alpine Green)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 13 Pro Max ───────────────────────────
  {
    name: 'iPhone 13 Pro Max',
    category: 'هواتف',
    price: 4400,
    stock: 10,
    description: `شاشة Super Retina XDR ProMotion 6.7 بوصة 120Hz · شريحة A15 Bionic بنواة 5 GPU
ثلاث كاميرات 12 ميجابكسل (رئيسية + تيليفوتو 3× + زاوية واسعة) مع LiDAR Scanner
ProRes Video 4K · Macro Photography · شحن MagSafe · IP68 (6 م / 30 د)
5G · Face ID · بطارية 28 ساعة (الأطول في تاريخ الأيفون حينها)`,
    image_url: img('iphone-13-pro-max-finish-select-2021-graphite'),
    images: imgs(
      'iphone-13-pro-max-finish-select-2021-graphite',
      'iphone-13-pro-max-finish-select-2021-gold',
      'iphone-13-pro-max-finish-select-2021-silver',
      'iphone-13-pro-max-finish-select-2021-sierrablue',
      'iphone-13-pro-max-finish-select-2022-alpine-green'
    ),
    variants: [
      { name: 'اللون', options: ['جرافيت (Graphite)', 'ذهبي (Gold)', 'فضي (Silver)', 'أزرق سييرا (Sierra Blue)', 'أخضر ألبيني (Alpine Green)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 14 ───────────────────────────
  {
    name: 'iPhone 14',
    category: 'هواتف',
    price: 3700,
    stock: 18,
    description: `شاشة Super Retina XDR 6.1 بوصة · شريحة A15 Bionic بنواة 5 GPU
كاميرا رئيسية 12 ميجابكسل مع Photonic Engine · كاميرا أمامية TrueDepth 12 ميجابكسل مع Autofocus
Action Mode للفيديو · Crash Detection · Emergency SOS via Satellite
5G · Face ID · مقاومة الماء IP68 · بطارية 20 ساعة`,
    image_url: img('iphone-14-finish-select-202209-midnight'),
    images: imgs(
      'iphone-14-finish-select-202209-midnight',
      'iphone-14-finish-select-202209-starlight',
      'iphone-14-finish-select-202209-blue',
      'iphone-14-finish-select-202209-purple',
      'iphone-14-finish-select-202209-red',
      'iphone-14-finish-select-202303-yellow'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Midnight)', 'أبيض (Starlight)', 'أزرق (Blue)', 'بنفسجي (Purple)', 'أحمر (PRODUCT RED)', 'أصفر (Yellow)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 14 Plus ───────────────────────────
  {
    name: 'iPhone 14 Plus',
    category: 'هواتف',
    price: 4100,
    stock: 12,
    description: `شاشة Super Retina XDR 6.7 بوصة كبيرة · شريحة A15 Bionic بنواة 5 GPU
كاميرا رئيسية 12 ميجابكسل مع Photonic Engine · Action Mode للفيديو
Crash Detection · Emergency SOS via Satellite · 5G · Face ID
مقاومة الماء IP68 · بطارية 26 ساعة (الأطول في الأيفون العادي)`,
    image_url: img('iphone-14-plus-finish-select-202209-midnight'),
    images: imgs(
      'iphone-14-plus-finish-select-202209-midnight',
      'iphone-14-plus-finish-select-202209-starlight',
      'iphone-14-plus-finish-select-202209-blue',
      'iphone-14-plus-finish-select-202209-purple',
      'iphone-14-plus-finish-select-202209-red',
      'iphone-14-plus-finish-select-202303-yellow'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Midnight)', 'أبيض (Starlight)', 'أزرق (Blue)', 'بنفسجي (Purple)', 'أحمر (PRODUCT RED)', 'أصفر (Yellow)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 14 Pro ───────────────────────────
  {
    name: 'iPhone 14 Pro',
    category: 'هواتف',
    price: 5200,
    stock: 10,
    description: `شاشة Super Retina XDR ProMotion 6.1 بوصة 120Hz مع Dynamic Island
شريحة A16 Bionic · كاميرا رئيسية 48 ميجابكسل (أول مرة في الأيفون) + تيليفوتو 3× + زاوية واسعة
ProRes Video 4K · كاميرا أمامية 12 ميجابكسل · Always-On Display
Crash Detection · Emergency SOS via Satellite · 5G · Face ID · IP68`,
    image_url: img('iphone-14-pro-finish-select-202209-spacblack'),
    images: imgs(
      'iphone-14-pro-finish-select-202209-spacblack',
      'iphone-14-pro-finish-select-202209-gold',
      'iphone-14-pro-finish-select-202209-silver',
      'iphone-14-pro-finish-select-202209-deeppurple'
    ),
    variants: [
      { name: 'اللون', options: ['أسود الفضاء (Space Black)', 'ذهبي (Gold)', 'فضي (Silver)', 'بنفسجي غامق (Deep Purple)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 14 Pro Max ───────────────────────────
  {
    name: 'iPhone 14 Pro Max',
    category: 'هواتف',
    price: 5800,
    stock: 8,
    description: `شاشة Super Retina XDR ProMotion 6.7 بوصة 120Hz مع Dynamic Island
شريحة A16 Bionic · كاميرا رئيسية 48 ميجابكسل + تيليفوتو 3× + زاوية واسعة + LiDAR
ProRes Video 4K · Always-On Display · كاميرا أمامية 12 ميجابكسل
Crash Detection · Emergency SOS via Satellite · 5G · Face ID · IP68 · بطارية 29 ساعة`,
    image_url: img('iphone-14-pro-max-finish-select-202209-spaceblack'),
    images: imgs(
      'iphone-14-pro-max-finish-select-202209-spaceblack',
      'iphone-14-pro-max-finish-select-202209-gold',
      'iphone-14-pro-max-finish-select-202209-silver',
      'iphone-14-pro-max-finish-select-202209-deeppurple'
    ),
    variants: [
      { name: 'اللون', options: ['أسود الفضاء (Space Black)', 'ذهبي (Gold)', 'فضي (Silver)', 'بنفسجي غامق (Deep Purple)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 15 ───────────────────────────
  {
    name: 'iPhone 15',
    category: 'هواتف',
    price: 4800,
    stock: 20,
    description: `شاشة Super Retina XDR 6.1 بوصة مع Dynamic Island · شريحة A16 Bionic
كاميرا رئيسية 48 ميجابكسل مع Photonic Engine · كاميرا أمامية 12 ميجابكسل مع Autofocus
USB-C (أول أيفون بمنفذ USB-C) · Emergency SOS via Satellite · Roadside Assistance
5G · Face ID · مقاومة الماء IP68 · بطارية 20 ساعة`,
    image_url: img('iphone-15-finish-select-202309-6-1inch-black'),
    images: imgs(
      'iphone-15-finish-select-202309-6-1inch-black',
      'iphone-15-finish-select-202309-6-1inch-blue',
      'iphone-15-finish-select-202309-6-1inch-green',
      'iphone-15-finish-select-202309-6-1inch-pink',
      'iphone-15-finish-select-202309-6-1inch-yellow'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Black)', 'أزرق (Blue)', 'أخضر (Green)', 'وردي (Pink)', 'أصفر (Yellow)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 15 Plus ───────────────────────────
  {
    name: 'iPhone 15 Plus',
    category: 'هواتف',
    price: 5300,
    stock: 15,
    description: `شاشة Super Retina XDR 6.7 بوصة مع Dynamic Island · شريحة A16 Bionic
كاميرا رئيسية 48 ميجابكسل · كاميرا أمامية 12 ميجابكسل مع Autofocus
USB-C · Emergency SOS via Satellite · 5G · Face ID · IP68
بطارية 26 ساعة · الشاشة الكبيرة بتقنية Dynamic Island`,
    image_url: img('iphone-15-plus-finish-select-202309-6-7inch-black'),
    images: imgs(
      'iphone-15-plus-finish-select-202309-6-7inch-black',
      'iphone-15-plus-finish-select-202309-6-7inch-blue',
      'iphone-15-plus-finish-select-202309-6-7inch-green',
      'iphone-15-plus-finish-select-202309-6-7inch-pink',
      'iphone-15-plus-finish-select-202309-6-7inch-yellow'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Black)', 'أزرق (Blue)', 'أخضر (Green)', 'وردي (Pink)', 'أصفر (Yellow)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 15 Pro ───────────────────────────
  {
    name: 'iPhone 15 Pro',
    category: 'هواتف',
    price: 6500,
    stock: 10,
    description: `شاشة Super Retina XDR ProMotion 6.1 بوصة 120Hz مع Dynamic Island · هيكل تيتانيوم
شريحة A17 Pro (أول شريحة 3nm) · كاميرا رئيسية 48 ميجابكسل + تيليفوتو 3× + زاوية واسعة + LiDAR
ProRes Video 4K 60fps عبر USB-C · Action Button · USB 3 سرعة
5G · Face ID · IP68 · بطارية 23 ساعة`,
    image_url: img('iphone-15-pro-finish-select-202309-6-1inch-blacktitanium'),
    images: imgs(
      'iphone-15-pro-finish-select-202309-6-1inch-blacktitanium',
      'iphone-15-pro-finish-select-202309-6-1inch-whitetitanium',
      'iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium',
      'iphone-15-pro-finish-select-202309-6-1inch-bluetitanium'
    ),
    variants: [
      { name: 'اللون', options: ['تيتانيوم أسود (Black Titanium)', 'تيتانيوم أبيض (White Titanium)', 'تيتانيوم طبيعي (Natural Titanium)', 'تيتانيوم أزرق (Blue Titanium)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 15 Pro Max ───────────────────────────
  {
    name: 'iPhone 15 Pro Max',
    category: 'هواتف',
    price: 7500,
    stock: 8,
    description: `شاشة Super Retina XDR ProMotion 6.7 بوصة 120Hz مع Dynamic Island · هيكل تيتانيوم
شريحة A17 Pro · كاميرا رئيسية 48 ميجابكسل + تيليفوتو 5× (حصري) + زاوية واسعة + LiDAR
ProRes Video 4K 60fps · Action Button · USB 3 · أطول زووم بصري في الأيفون
5G · Face ID · IP68 · بطارية 29 ساعة`,
    image_url: img('iphone-15-pro-max-finish-select-202309-6-7inch-blacktitanium'),
    images: imgs(
      'iphone-15-pro-max-finish-select-202309-6-7inch-blacktitanium',
      'iphone-15-pro-max-finish-select-202309-6-7inch-whitetitanium',
      'iphone-15-pro-max-finish-select-202309-6-7inch-naturaltitanium',
      'iphone-15-pro-max-finish-select-202309-6-7inch-bluetitanium'
    ),
    variants: [
      { name: 'اللون', options: ['تيتانيوم أسود (Black Titanium)', 'تيتانيوم أبيض (White Titanium)', 'تيتانيوم طبيعي (Natural Titanium)', 'تيتانيوم أزرق (Blue Titanium)'] },
      { name: 'السعة', options: ['256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 16 ───────────────────────────
  {
    name: 'iPhone 16',
    category: 'هواتف',
    price: 5800,
    stock: 20,
    description: `شاشة Super Retina XDR 6.1 بوصة مع Dynamic Island · شريحة A18
دعم Apple Intelligence (ذكاء اصطناعي) · Camera Control زر جديد للكاميرا
كاميرا رئيسية 48 ميجابكسل + كاميرا زاوية واسعة 12 ميجابكسل الجديدة · كاميرا أمامية 12 ميجابكسل
Spatial Video · USB-C · 5G · Face ID · IP68 · بطارية 22 ساعة`,
    image_url: img('iphone-16-finish-select-202409-6-1inch-black'),
    images: imgs(
      'iphone-16-finish-select-202409-6-1inch-black',
      'iphone-16-finish-select-202409-6-1inch-white',
      'iphone-16-finish-select-202409-6-1inch-pink',
      'iphone-16-finish-select-202409-6-1inch-teal',
      'iphone-16-finish-select-202409-6-1inch-ultramarine'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Black)', 'أبيض (White)', 'وردي (Pink)', 'سماوي (Teal)', 'كحلي (Ultramarine)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 16 Plus ───────────────────────────
  {
    name: 'iPhone 16 Plus',
    category: 'هواتف',
    price: 6400,
    stock: 15,
    description: `شاشة Super Retina XDR 6.7 بوصة مع Dynamic Island · شريحة A18
دعم Apple Intelligence · Camera Control · كاميرا رئيسية 48 ميجابكسل
كاميرا زاوية واسعة 12 ميجابكسل · Spatial Video · USB-C
5G · Face ID · IP68 · بطارية 27 ساعة (الأطول بين الأيفون العادي)`,
    image_url: img('iphone-16-plus-finish-select-202409-6-7inch-black'),
    images: imgs(
      'iphone-16-plus-finish-select-202409-6-7inch-black',
      'iphone-16-plus-finish-select-202409-6-7inch-white',
      'iphone-16-plus-finish-select-202409-6-7inch-pink',
      'iphone-16-plus-finish-select-202409-6-7inch-teal',
      'iphone-16-plus-finish-select-202409-6-7inch-ultramarine'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Black)', 'أبيض (White)', 'وردي (Pink)', 'سماوي (Teal)', 'كحلي (Ultramarine)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 16 Pro ───────────────────────────
  {
    name: 'iPhone 16 Pro',
    category: 'هواتف',
    price: 8000,
    stock: 10,
    description: `شاشة Super Retina XDR ProMotion 6.3 بوصة 120Hz · هيكل تيتانيوم (أحدث جيل)
شريحة A18 Pro · دعم كامل لـ Apple Intelligence · Camera Control
كاميرا رئيسية 48 ميجابكسل + تيليفوتو 5× + زاوية واسعة 48 ميجابكسل + LiDAR
4K 120fps ProRes · USB 3 · Action Button · 5G · Face ID · IP68`,
    image_url: img('iphone-16-pro-finish-select-202409-6-3inch-blacktitanium'),
    images: imgs(
      'iphone-16-pro-finish-select-202409-6-3inch-blacktitanium',
      'iphone-16-pro-finish-select-202409-6-3inch-whitetitanium',
      'iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium',
      'iphone-16-pro-finish-select-202409-6-3inch-deserttitanium'
    ),
    variants: [
      { name: 'اللون', options: ['تيتانيوم أسود (Black Titanium)', 'تيتانيوم أبيض (White Titanium)', 'تيتانيوم طبيعي (Natural Titanium)', 'تيتانيوم صحراوي (Desert Titanium)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 16 Pro Max ───────────────────────────
  {
    name: 'iPhone 16 Pro Max',
    category: 'هواتف',
    price: 9200,
    stock: 8,
    description: `شاشة Super Retina XDR ProMotion 6.9 بوصة 120Hz · هيكل تيتانيوم
شريحة A18 Pro · دعم كامل لـ Apple Intelligence · Camera Control
كاميرا رئيسية 48 ميجابكسل + تيليفوتو 5× + زاوية واسعة 48 ميجابكسل + LiDAR
4K 120fps ProRes · USB 3 · Action Button · 5G · Face ID · IP68 · بطارية 33 ساعة`,
    image_url: img('iphone-16-pro-max-finish-select-202409-6-9inch-blacktitanium'),
    images: imgs(
      'iphone-16-pro-max-finish-select-202409-6-9inch-blacktitanium',
      'iphone-16-pro-max-finish-select-202409-6-9inch-whitetitanium',
      'iphone-16-pro-max-finish-select-202409-6-9inch-naturaltitanium',
      'iphone-16-pro-max-finish-select-202409-6-9inch-deserttitanium'
    ),
    variants: [
      { name: 'اللون', options: ['تيتانيوم أسود (Black Titanium)', 'تيتانيوم أبيض (White Titanium)', 'تيتانيوم طبيعي (Natural Titanium)', 'تيتانيوم صحراوي (Desert Titanium)'] },
      { name: 'السعة', options: ['256GB', '512GB', '1TB'] }
    ]
  },

  // ─────────────────────────── iPhone 17 ───────────────────────────
  {
    name: 'iPhone 17',
    category: 'هواتف',
    price: 7000,
    stock: 15,
    description: `شاشة Super Retina XDR 6.1 بوصة ProMotion 120Hz (أول مرة في الأيفون العادي)
شريحة A19 · دعم Apple Intelligence المتطور · كاميرا رئيسية 48 ميجابكسل
كاميرا أمامية 24 ميجابكسل جديدة · Camera Control · هيكل ألومنيوم حديث
USB-C · 5G · Face ID · IP68 · بطارية 22 ساعة`,
    image_url: img('iphone-17-finish-select-202509-6-1inch-black'),
    images: imgs(
      'iphone-17-finish-select-202509-6-1inch-black',
      'iphone-17-finish-select-202509-6-1inch-white',
      'iphone-17-finish-select-202509-6-1inch-pink',
      'iphone-17-finish-select-202509-6-1inch-teal',
      'iphone-17-finish-select-202509-6-1inch-ultramarine'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Black)', 'أبيض (White)', 'وردي (Pink)', 'سماوي (Teal)', 'كحلي (Ultramarine)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 17 Air ───────────────────────────
  {
    name: 'iPhone 17 Air',
    category: 'هواتف',
    price: 7800,
    stock: 12,
    description: `أرفع أيفون في التاريخ (6.25 مم) · شاشة 6.6 بوصة ProMotion 120Hz
شريحة A19 · هيكل ألومنيوم فائق النحافة · كاميرا رئيسية 48 ميجابكسل واحدة
كاميرا أمامية 24 ميجابكسل · Apple Intelligence · Camera Control
USB-C · 5G · Face ID · IP68 · بطارية 23 ساعة`,
    image_url: img('iphone-17-air-finish-select-202509-6-6inch-black'),
    images: imgs(
      'iphone-17-air-finish-select-202509-6-6inch-black',
      'iphone-17-air-finish-select-202509-6-6inch-white',
      'iphone-17-air-finish-select-202509-6-6inch-pink',
      'iphone-17-air-finish-select-202509-6-6inch-skyblue'
    ),
    variants: [
      { name: 'اللون', options: ['أسود (Black)', 'أبيض (White)', 'وردي (Pink)', 'أزرق سماوي (Sky Blue)'] },
      { name: 'السعة', options: ['128GB', '256GB', '512GB'] }
    ]
  },

  // ─────────────────────────── iPhone 17 Pro ───────────────────────────
  {
    name: 'iPhone 17 Pro',
    category: 'هواتف',
    price: 10000,
    stock: 8,
    description: `شاشة Super Retina XDR ProMotion 6.3 بوصة 120Hz · هيكل تيتانيوم من الجيل الثاني
شريحة A19 Pro · دعم Apple Intelligence الكامل · كاميرا رئيسية 48 ميجابكسل
تيليفوتو 5× + زاوية واسعة 48 ميجابكسل + LiDAR · كاميرا أمامية 24 ميجابكسل
4K 120fps ProRes · Camera Control · Action Button · USB 3 · 5G · Face ID · IP68`,
    image_url: img('iphone-17-pro-finish-select-202509-6-3inch-blacktitanium'),
    images: imgs(
      'iphone-17-pro-finish-select-202509-6-3inch-blacktitanium',
      'iphone-17-pro-finish-select-202509-6-3inch-whitetitanium',
      'iphone-17-pro-finish-select-202509-6-3inch-naturaltitanium',
      'iphone-17-pro-finish-select-202509-6-3inch-deserttitanium'
    ),
    variants: [
      { name: 'اللون', options: ['تيتانيوم أسود (Black Titanium)', 'تيتانيوم أبيض (White Titanium)', 'تيتانيوم طبيعي (Natural Titanium)', 'تيتانيوم صحراوي (Desert Titanium)'] },
      { name: 'السعة', options: ['256GB', '512GB', '1TB'] }
    ]
  },
];

// إدراج المنتجات في Supabase
async function insertProducts() {
  console.log(`جاري إضافة ${products.length} منتج...`);
  let success = 0, failed = 0;

  for (const product of products) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(product)
    });

    const data = await res.json();
    if (res.ok && data[0]?.id) {
      console.log(`✅ ${product.name} → ${data[0].id}`);
      success++;
    } else {
      console.log(`❌ ${product.name} → ${JSON.stringify(data)}`);
      failed++;
    }
  }

  console.log(`\nالنتيجة: ${success} نجح · ${failed} فشل`);
}

insertProducts().catch(console.error);
