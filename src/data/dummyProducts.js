export const DEFAULT_CATEGORIES = ['Makanan', 'Minuman', 'Cemilan', 'Sembako', 'Lainnya'];

export const DEFAULT_UNITS = ['pcs', 'botol', 'bungkus', 'sachet', 'kg', 'liter'];

export const DEFAULT_SETTINGS = {
  storeName: 'WarungKu',
  address: 'Jl. Raya Warung No. 1',
  phone: '0812-3456-7890',
  footer: 'Terima kasih telah berbelanja.',
};

function makePlaceholder(label, c1, c2) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>`,
    `</linearGradient></defs>`,
    `<rect width="200" height="200" rx="32" fill="url(#g)"/>`,
    `<text x="100" y="132" font-size="84" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${label
      .charAt(0)
      .toUpperCase()}</text>`,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const IMAGE = {
  makanan: makePlaceholder('Makanan', '#7CC6FE', '#2F8FDC'),
  minuman: makePlaceholder('Minuman', '#60A5FA', '#2563EB'),
  cemilan: makePlaceholder('Cemilan', '#F7C873', '#E5A93B'),
  sembako: makePlaceholder('Sembako', '#A5B4FC', '#6366F1'),
  lainnya: makePlaceholder('Lainnya', '#94A3B8', '#475569'),
};

export const dummyProducts = [
  {
    id: 'PRD-IND-0001',
    barcode: '089686131141',
    name: 'Indomie Goreng',
    category: 'Makanan',
    purchasePrice: 2500,
    sellingPrice: 3500,
    stock: 24,
    unit: 'bungkus',
    image: IMAGE.makanan,
  },
  {
    id: 'PRD-AQU-0002',
    barcode: '089686280015',
    name: 'Aqua 600ml',
    category: 'Minuman',
    purchasePrice: 2500,
    sellingPrice: 4000,
    stock: 15,
    unit: 'botol',
    image: IMAGE.minuman,
  },
  {
    id: 'PRD-SOS-0003',
    barcode: '8991002101524',
    name: 'Teh Botol Sosro',
    category: 'Minuman',
    purchasePrice: 3000,
    sellingPrice: 5000,
    stock: 18,
    unit: 'botol',
    image: IMAGE.minuman,
  },
  {
    id: 'PRD-KOP-0004',
    barcode: '8991002101548',
    name: 'Kopi Sachet',
    category: 'Minuman',
    purchasePrice: 1000,
    sellingPrice: 1500,
    stock: 7,
    unit: 'sachet',
    image: IMAGE.minuman,
  },
  {
    id: 'PRD-GUL-0005',
    barcode: '8992760100118',
    name: 'Gula 1kg',
    category: 'Sembako',
    purchasePrice: 13000,
    sellingPrice: 16000,
    stock: 9,
    unit: 'kg',
    image: IMAGE.sembako,
  },
  {
    id: 'PRD-MIN-0006',
    barcode: '8992760100125',
    name: 'Minyak Goreng 1L',
    category: 'Sembako',
    purchasePrice: 16000,
    sellingPrice: 19000,
    stock: 12,
    unit: 'liter',
    image: IMAGE.sembako,
  },
  {
    id: 'PRD-ROT-0007',
    barcode: '8992760100132',
    name: 'Roti',
    category: 'Makanan',
    purchasePrice: 5000,
    sellingPrice: 7000,
    stock: 0,
    unit: 'bungkus',
    image: IMAGE.makanan,
  },
  {
    id: 'PRD-SUS-0008',
    barcode: '8992760100149',
    name: 'Susu UHT',
    category: 'Minuman',
    purchasePrice: 7000,
    sellingPrice: 10000,
    stock: 5,
    unit: 'botol',
    image: IMAGE.minuman,
  },
  {
    id: 'PRD-CHI-0009',
    barcode: '8998866201335',
    name: 'Chitato',
    category: 'Cemilan',
    purchasePrice: 7500,
    sellingPrice: 10000,
    stock: 11,
    unit: 'bungkus',
    image: IMAGE.cemilan,
  },
  {
    id: 'PRD-TEL-0010',
    barcode: '8993222700110',
    name: 'Telur Ayam 1kg',
    category: 'Sembako',
    purchasePrice: 24000,
    sellingPrice: 28000,
    stock: 3,
    unit: 'kg',
    image: IMAGE.sembako,
  },
];
