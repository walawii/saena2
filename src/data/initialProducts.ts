import { Product } from '../types';

// Helper to generate elegant modest fashion SVG illustration thumbnails
const createModestFashionSvg = (
  title: string,
  category: string,
  colorScheme: 'navy' | 'sage' | 'dusty-rose' | 'terracotta' | 'gold' | 'ivory' | 'charcoal'
) => {
  const themes = {
    navy: { bg: '#0F172A', accent: '#38BDF8', soft: '#1E293B', text: '#F8FAFC' },
    sage: { bg: '#2D3B36', accent: '#A7F3D0', soft: '#3E504A', text: '#F0FDF4' },
    'dusty-rose': { bg: '#4A2E35', accent: '#FECDD3', soft: '#643D47', text: '#FFF1F2' },
    terracotta: { bg: '#4C1D18', accent: '#FED7AA', soft: '#692821', text: '#FFF7ED' },
    gold: { bg: '#3B2F17', accent: '#FDE68A', soft: '#524221', text: '#FEFCE8' },
    ivory: { bg: '#27272A', accent: '#E4E4E7', soft: '#3F3F46', text: '#FAFAFA' },
    charcoal: { bg: '#18181B', accent: '#E2E8F0', soft: '#27272A', text: '#FFFFFF' },
  };

  const t = themes[colorScheme];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.bg}"/>
        <stop offset="100%" stop-color="${t.soft}"/>
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${t.accent}" stop-opacity="0.05"/>
      </linearGradient>
      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${t.accent}" stroke-opacity="0.05" stroke-width="1"/>
      </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="800" height="1000" fill="url(#bgGrad)"/>
    <rect width="800" height="1000" fill="url(#gridPattern)"/>
    
    <!-- Architectural Arches & Modest Silhouette Motif -->
    <path d="M 200 900 L 200 450 Q 200 200 400 200 Q 600 200 600 450 L 600 900 Z" fill="url(#accentGrad)" stroke="${t.accent}" stroke-opacity="0.2" stroke-width="2"/>
    
    <!-- Inner Arch Detail -->
    <path d="M 260 900 L 260 500 Q 260 300 400 300 Q 540 300 540 500 L 540 900" fill="none" stroke="${t.accent}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 4"/>
    
    <!-- Floating Minimal Modest Fashion Motif -->
    <g transform="translate(400, 480)" text-anchor="middle">
      <!-- Outer Robe / Silhouette Form -->
      <path d="M 0 -130 Q -50 -70 -70 20 Q -90 120 -110 240 L 110 240 Q 90 120 70 20 Q 50 -70 0 -130 Z" fill="${t.accent}" fill-opacity="0.15" stroke="${t.accent}" stroke-width="2"/>
      <!-- Soft Hijab Drape Contour -->
      <path d="M 0 -140 Q -40 -120 -45 -50 Q -50 10 0 40 Q 50 10 45 -50 Q 40 -120 0 -140 Z" fill="${t.accent}" fill-opacity="0.25" stroke="${t.accent}" stroke-width="1.5"/>
      <circle cx="0" cy="-70" r="16" fill="${t.accent}" fill-opacity="0.5"/>
    </g>

    <!-- Typography -->
    <text x="400" y="780" font-family="'Cormorant Garamond', Georgia, serif" font-size="34" font-weight="600" fill="${t.text}" text-anchor="middle" letter-spacing="1">${title}</text>
    <text x="400" y="820" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500" fill="${t.accent}" text-anchor="middle" letter-spacing="4" text-transform="uppercase">SAENA.ID · ${category}</text>
    <line x1="320" y1="845" x2="480" y2="845" stroke="${t.accent}" stroke-width="1" stroke-opacity="0.4"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'SAE-GMS-001',
    name: 'Ameera Silk Gamis Dress',
    slug: 'ameera-silk-gamis-dress',
    description: 'Ameera Silk Gamis Dress dirancang dengan material Mulberry Silk Crepe premium yang lembut, jatuh anggun, dan adem seharian. Dilengkapi cutting A-line elegan dengan detail manset kancing wudhu-friendly serta resleting depan tersembunyi yang ramah ibu menyusui (busui friendly). Cocok untuk acara formal, pengajian, maupun hari raya.',
    category: 'gamis',
    categoryName: 'Gamis',
    price: 389000,
    discountPrice: 329000,
    stock: 45,
    weight: 450,
    dimensions: { length: 30, width: 25, height: 4 },
    images: [
      createModestFashionSvg('Ameera Silk Gamis', 'Gamis Syar\'i', 'navy'),
      createModestFashionSvg('Ameera Silk Gamis - Detail', 'Koleksi Eksklusif', 'gold'),
      createModestFashionSvg('Ameera Silk Gamis - Manset', 'Wudhu Friendly', 'ivory')
    ],
    variants: [
      { id: 'v1-1', sku: 'SAE-GMS-001-NV-M', colorName: 'Midnight Navy', colorHex: '#0F172A', size: 'M', stock: 12 },
      { id: 'v1-2', sku: 'SAE-GMS-001-NV-L', colorName: 'Midnight Navy', colorHex: '#0F172A', size: 'L', stock: 15 },
      { id: 'v1-3', sku: 'SAE-GMS-001-NV-XL', colorName: 'Midnight Navy', colorHex: '#0F172A', size: 'XL', stock: 8 },
      { id: 'v1-4', sku: 'SAE-GMS-001-SG-M', colorName: 'Sage Mist', colorHex: '#2D3B36', size: 'M', stock: 5 },
      { id: 'v1-5', sku: 'SAE-GMS-001-SG-L', colorName: 'Sage Mist', colorHex: '#2D3B36', size: 'L', stock: 5 },
    ],
    colors: [
      { name: 'Midnight Navy', hex: '#0F172A' },
      { name: 'Sage Mist', hex: '#2D3B36' },
      { name: 'Dusty Rose', hex: '#4A2E35' },
    ],
    sizes: ['M', 'L', 'XL'],
    status: 'ACTIVE',
    rating: 4.9,
    reviewCount: 148,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'prod-2',
    sku: 'SAE-DRS-002',
    name: 'Zafira Pleated Dress Muslim',
    slug: 'zafira-pleated-dress-muslim',
    description: 'Dress muslim kontemporer dengan plisket vertikal presisi tinggi yang memberikan ilusi jenjang dan ramping. Dibuat dari kain Flowy Chiffon dengan furing katun adem 100% no terawang. Desain timeless dengan tali pinggang lepas-pasang.',
    category: 'dress-muslim',
    categoryName: 'Dress Muslim',
    price: 425000,
    discountPrice: 365000,
    stock: 32,
    weight: 500,
    dimensions: { length: 32, width: 25, height: 5 },
    images: [
      createModestFashionSvg('Zafira Pleated Dress', 'Dress Muslim', 'dusty-rose'),
      createModestFashionSvg('Zafira Pleated - Furing', 'Bahan Adem', 'ivory')
    ],
    variants: [
      { id: 'v2-1', sku: 'SAE-DRS-002-RS-S', colorName: 'Dusty Rose', colorHex: '#4A2E35', size: 'S', stock: 8 },
      { id: 'v2-2', sku: 'SAE-DRS-002-RS-M', colorName: 'Dusty Rose', colorHex: '#4A2E35', size: 'M', stock: 14 },
      { id: 'v2-3', sku: 'SAE-DRS-002-RS-L', colorName: 'Dusty Rose', colorHex: '#4A2E35', size: 'L', stock: 10 },
    ],
    colors: [
      { name: 'Dusty Rose', hex: '#4A2E35' },
      { name: 'Champagne Beige', hex: '#3B2F17' },
    ],
    sizes: ['S', 'M', 'L'],
    status: 'ACTIVE',
    rating: 4.8,
    reviewCount: 96,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'prod-3',
    sku: 'SAE-DST-003',
    name: 'Rayon Valencia Daster Chic Modern',
    slug: 'rayon-valencia-daster-chic-modern',
    description: 'Definisi baru daster rumahan yang modis dan nyaman. Terbuat dari 100% Rayon Twill Grade A tebal, dingin saat bersentuhan dengan kulit, tidak menciut, dan motif etnik minimalis yang chic dipakai jalan santai di sore hari.',
    category: 'daster',
    categoryName: 'Daster',
    price: 145000,
    discountPrice: 119000,
    stock: 60,
    weight: 300,
    dimensions: { length: 28, width: 20, height: 3 },
    images: [
      createModestFashionSvg('Valencia Daster Chic', 'Homewear Elegan', 'terracotta'),
      createModestFashionSvg('Valencia Daster - Motif', 'Rayon Twill Grade A', 'gold')
    ],
    variants: [
      { id: 'v3-1', sku: 'SAE-DST-003-TC-AS', colorName: 'Terracotta Earth', colorHex: '#4C1D18', size: 'All Size', stock: 35 },
      { id: 'v3-2', sku: 'SAE-DST-003-NV-AS', colorName: 'Navy Bloom', colorHex: '#0F172A', size: 'All Size', stock: 25 },
    ],
    colors: [
      { name: 'Terracotta Earth', hex: '#4C1D18' },
      { name: 'Navy Bloom', hex: '#0F172A' },
    ],
    sizes: ['All Size'],
    status: 'ACTIVE',
    rating: 4.9,
    reviewCount: 312,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'prod-4',
    sku: 'SAE-MUK-004',
    name: 'Khawla Royal Silk Mukena Eksklusif',
    slug: 'khawla-royal-silk-mukena-eksklusif',
    description: 'Mukena premium berbahan Armani Silk Original yang sangat lembut, berbobot pas, berkilau mewah namun tidak licin. Dilengkapi renda chantilly Prancis halus di sekeliling pinggiran dan tas mukena cantik ber-zipper gold.',
    category: 'mukena',
    categoryName: 'Mukena',
    price: 499000,
    discountPrice: 429000,
    stock: 28,
    weight: 600,
    dimensions: { length: 30, width: 25, height: 8 },
    images: [
      createModestFashionSvg('Khawla Royal Mukena', 'Armani Silk & Renda', 'sage'),
      createModestFashionSvg('Khawla Mukena Pouch', 'Tas Eksklusif', 'ivory')
    ],
    variants: [
      { id: 'v4-1', sku: 'SAE-MUK-004-SG-AS', colorName: 'Sage Pastel', colorHex: '#2D3B36', size: 'All Size', stock: 15 },
      { id: 'v4-2', sku: 'SAE-MUK-004-GD-AS', colorName: 'Warm Gold Pearl', colorHex: '#3B2F17', size: 'All Size', stock: 13 },
    ],
    colors: [
      { name: 'Sage Pastel', hex: '#2D3B36' },
      { name: 'Warm Gold Pearl', hex: '#3B2F17' },
    ],
    sizes: ['All Size'],
    status: 'ACTIVE',
    rating: 5.0,
    reviewCount: 88,
    isBestSeller: false,
    isFeatured: true,
    isNewArrival: true,
    createdAt: '2026-09-12T11:00:00Z',
  },
  {
    id: 'prod-5',
    sku: 'SAE-HJB-005',
    name: 'Madina Voal Scarf Laser Cut 115x115',
    slug: 'madina-voal-scarf-laser-cut',
    description: 'Jilbab segi empat andalan muslimah Saena. Menggunakan Ultrafine Voal import yang tegak paripurna di dahi tanpa perlu semprotan kaku. Tepian rapi dipotong dengan teknologi laser cut presisi. Tidak berdengung di telinga dan breathable.',
    category: 'hijab',
    categoryName: 'Hijab',
    price: 89000,
    discountPrice: 69000,
    stock: 120,
    weight: 120,
    dimensions: { length: 20, width: 20, height: 1 },
    images: [
      createModestFashionSvg('Madina Voal Scarf', 'Ultrafine Laser Cut', 'gold'),
      createModestFashionSvg('Madina Scarf Palet', 'Pilihan Warna Elegan', 'dusty-rose')
    ],
    variants: [
      { id: 'v5-1', sku: 'SAE-HJB-005-NV-AS', colorName: 'Navy Classic', colorHex: '#0F172A', size: 'All Size', stock: 40 },
      { id: 'v5-2', sku: 'SAE-HJB-005-BG-AS', colorName: 'Beige Almond', colorHex: '#3B2F17', size: 'All Size', stock: 50 },
      { id: 'v5-3', sku: 'SAE-HJB-005-RS-AS', colorName: 'Soft Rose', colorHex: '#4A2E35', size: 'All Size', stock: 30 },
    ],
    colors: [
      { name: 'Navy Classic', hex: '#0F172A' },
      { name: 'Beige Almond', hex: '#3B2F17' },
      { name: 'Soft Rose', hex: '#4A2E35' },
    ],
    sizes: ['All Size'],
    status: 'ACTIVE',
    rating: 4.9,
    reviewCount: 420,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    createdAt: '2026-08-01T07:00:00Z',
  },
  {
    id: 'prod-6',
    sku: 'SAE-SET-006',
    name: 'Nayra Linen Tunic & Culotte Set',
    slug: 'nayra-linen-tunic-culotte-set',
    description: 'Setelan dua potong tunik panjang dan celana kulot bermaterial Pure Linen Blend. Kerah shanghai minimalis, kantong fungsional di kedua sisi celana dan tunik. Tampil modern, sopan, dan formal tanpa repot mix and match.',
    category: 'setelan',
    categoryName: 'Setelan',
    price: 369000,
    discountPrice: 319000,
    stock: 35,
    weight: 550,
    dimensions: { length: 32, width: 26, height: 5 },
    images: [
      createModestFashionSvg('Nayra Linen Setelan', 'Tunic & Culotte Set', 'sage'),
      createModestFashionSvg('Nayra Setelan Detail', 'Linen Blend Premium', 'ivory')
    ],
    variants: [
      { id: 'v6-1', sku: 'SAE-SET-006-SG-M', colorName: 'Sage Green', colorHex: '#2D3B36', size: 'M', stock: 12 },
      { id: 'v6-2', sku: 'SAE-SET-006-SG-L', colorName: 'Sage Green', colorHex: '#2D3B36', size: 'L', stock: 15 },
      { id: 'v6-3', sku: 'SAE-SET-006-SG-XL', colorName: 'Sage Green', colorHex: '#2D3B36', size: 'XL', stock: 8 },
    ],
    colors: [
      { name: 'Sage Green', hex: '#2D3B36' },
      { name: 'Charcoal Grey', hex: '#18181B' },
    ],
    sizes: ['M', 'L', 'XL'],
    status: 'ACTIVE',
    rating: 4.8,
    reviewCount: 75,
    isBestSeller: false,
    isFeatured: false,
    isNewArrival: true,
    createdAt: '2026-09-18T12:00:00Z',
  },
  {
    id: 'prod-7',
    sku: 'SAE-ANK-007',
    name: 'Aisya Kids Gamis & Bergo Set',
    slug: 'aisya-kids-gamis-bergo-set',
    description: 'Set gamis anak perempuan lengkap dengan jilbab bergo instan. Menggunakan katun rayon organik yang luar biasa sejuk di kulit sensitif anak, bebas gerah saat beraktivitas di TPA atau hari raya.',
    category: 'anak',
    categoryName: 'Anak',
    price: 199000,
    discountPrice: 169000,
    stock: 40,
    weight: 350,
    dimensions: { length: 25, width: 20, height: 3 },
    images: [
      createModestFashionSvg('Aisya Kids Gamis', 'Gamis & Bergo Anak', 'dusty-rose')
    ],
    variants: [
      { id: 'v7-1', sku: 'SAE-ANK-007-RS-S', colorName: 'Berry Pink', colorHex: '#4A2E35', size: 'S', stock: 15 },
      { id: 'v7-2', sku: 'SAE-ANK-007-RS-M', colorName: 'Berry Pink', colorHex: '#4A2E35', size: 'M', stock: 15 },
      { id: 'v7-3', sku: 'SAE-ANK-007-RS-L', colorName: 'Berry Pink', colorHex: '#4A2E35', size: 'L', stock: 10 },
    ],
    colors: [
      { name: 'Berry Pink', hex: '#4A2E35' },
      { name: 'Soft Sage', hex: '#2D3B36' },
    ],
    sizes: ['S', 'M', 'L'],
    status: 'ACTIVE',
    rating: 4.9,
    reviewCount: 64,
    isBestSeller: false,
    isFeatured: false,
    isNewArrival: true,
    createdAt: '2026-09-10T14:00:00Z',
  },
  {
    id: 'prod-8',
    sku: 'SAE-ABY-008',
    name: 'Syaza Dubai Abaya Jetblack',
    slug: 'syaza-dubai-abaya-jetblack',
    description: 'Abaya khas Timur Tengah modern dengan warna hitam pekat Jetblack Bonanza. Bahan sangat sejuk, jatuh melayang sempurna, dan dihiasi detail kristal payet swarovski di bagian dada dan pergelangan tangan.',
    category: 'gamis',
    categoryName: 'Gamis',
    price: 489000,
    discountPrice: 439000,
    stock: 22,
    weight: 650,
    dimensions: { length: 35, width: 28, height: 5 },
    images: [
      createModestFashionSvg('Syaza Dubai Abaya', 'Jetblack Eksklusif', 'charcoal'),
      createModestFashionSvg('Syaza Dubai - Detail Payet', 'Swarovski Touch', 'gold')
    ],
    variants: [
      { id: 'v8-1', sku: 'SAE-ABY-008-BK-M', colorName: 'Jetblack Deep', colorHex: '#18181B', size: 'M', stock: 10 },
      { id: 'v8-2', sku: 'SAE-ABY-008-BK-L', colorName: 'Jetblack Deep', colorHex: '#18181B', size: 'L', stock: 8 },
      { id: 'v8-3', sku: 'SAE-ABY-008-BK-XL', colorName: 'Jetblack Deep', colorHex: '#18181B', size: 'XL', stock: 4 },
    ],
    colors: [
      { name: 'Jetblack Deep', hex: '#18181B' }
    ],
    sizes: ['M', 'L', 'XL'],
    status: 'ACTIVE',
    rating: 5.0,
    reviewCount: 112,
    isBestSeller: true,
    isFeatured: true,
    isNewArrival: false,
    createdAt: '2026-08-20T10:30:00Z',
  }
];

export const INITIAL_CATEGORIES = [
  { slug: 'gamis', name: 'Gamis Syar\'i', count: 28, description: 'Potongan A-line anggun, syar\'i dan wudhu-friendly' },
  { slug: 'dress-muslim', name: 'Dress Muslim', count: 19, description: 'Dress pesta dan kasual wanita muslimah modern' },
  { slug: 'daster', name: 'Daster Chic', count: 14, description: 'Homewear rayon dingin nan modis untuk di rumah' },
  { slug: 'mukena', name: 'Mukena Silk', count: 16, description: 'Perlengkapan sholat sutra dengan renda lembut' },
  { slug: 'hijab', name: 'Voal & Hijab', count: 35, description: 'Segi empat voal ultrafine dan pashmina ceruti' },
  { slug: 'setelan', name: 'Setelan Muslim', count: 12, description: 'One set tunik & kulot praktis siap pakai' },
  { slug: 'anak', name: 'Busana Muslim Anak', count: 15, description: 'Pakaian muslimah cilik bahan lembut adem' },
  { slug: 'best-seller', name: 'Best Seller', count: 24, description: 'Produk paling dicintai pelanggan Saena.id' }
];

export const INITIAL_VOUCHERS = [
  {
    id: 'vouc-1',
    code: 'SAENABARU',
    type: 'PERCENTAGE' as const,
    value: 10,
    minimumPurchase: 150000,
    maximumDiscount: 50000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 142,
    perUserLimit: 1,
    active: true,
    description: 'Diskon 10% s.d Rp 50.000 untuk pelanggan baru'
  },
  {
    id: 'vouc-2',
    code: 'GRATISONGKIR',
    type: 'FIXED' as const,
    value: 20000,
    minimumPurchase: 250000,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 89,
    perUserLimit: 2,
    active: true,
    description: 'Potongan ongkir Rp 20.000 dengan belanja min. Rp 250.000'
  },
  {
    id: 'vouc-3',
    code: 'SAENASPECIAL',
    type: 'FIXED' as const,
    value: 50000,
    minimumPurchase: 400000,
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-10-31T23:59:59Z',
    usageLimit: 200,
    usedCount: 31,
    perUserLimit: 1,
    active: true,
    description: 'Potongan langsung Rp 50.000 min. belanja Rp 400.000'
  }
];
