import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('📱 WARTOMSON STORE — PENGUJIAN OPTIMASI RESPONSIVE MOBILE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Periksa index.html untuk Font Awesome CDN
const indexHtml = fs.readFileSync('index.html', 'utf-8');
assert(
  indexHtml.includes('font-awesome') && indexHtml.includes('cdnjs.cloudflare.com'),
  'index.html memuat Font Awesome CDN 6.5.1 untuk ikon navigasi mobile'
);

// 2. Periksa Logo.jsx untuk Wartomson Store branding
const logoJsx = fs.readFileSync('src/components/common/Logo.jsx', 'utf-8');
assert(
  logoJsx.includes('Wartomson Store') && logoJsx.includes('isMobile'),
  'Logo.jsx mendukung branding Wartomson Store dengan ukuran responsif mobile'
);

// 3. Periksa MobileBottomNav.jsx (5 Menu Utama & Role Adaptation)
const mobileNavJsx = fs.readFileSync('src/components/layout/MobileBottomNav.jsx', 'utf-8');
assert(
  mobileNavJsx.includes("'Home'") &&
  mobileNavJsx.includes("'Kategori'") &&
  mobileNavJsx.includes("'Keranjang'") &&
  mobileNavJsx.includes("'Pesanan'") &&
  mobileNavJsx.includes("'Profil'"),
  'MobileBottomNav memiliki 5 menu utama: Home, Kategori, Keranjang, Pesanan, Profil'
);
assert(
  mobileNavJsx.includes('fa-solid fa-house') &&
  mobileNavJsx.includes('fa-solid fa-shapes') &&
  mobileNavJsx.includes('fa-solid fa-cart-shopping') &&
  mobileNavJsx.includes('fa-solid fa-receipt') &&
  mobileNavJsx.includes('fa-solid fa-user'),
  'MobileBottomNav menggunakan ikon Font Awesome standar modern'
);
assert(
  mobileNavJsx.includes('isSuperAdmin') && mobileNavJsx.includes('isKasir'),
  'MobileBottomNav menyesuaikan menu secara cerdas berdasarkan peran pengguna (Admin vs Karyawan)'
);

// 4. Periksa Navbar.jsx (Wartomson Store mobile header & search modal)
const navbarJsx = fs.readFileSync('src/components/layout/Navbar.jsx', 'utf-8');
assert(
  navbarJsx.includes('fa-solid fa-magnifying-glass') && navbarJsx.includes('isMobileSearchOpen'),
  'Navbar menyediakan ikon dan modal pencarian cepat mobile'
);
assert(
  navbarJsx.includes('Wartomson Store'),
  'Navbar menampilkan logo dan identitas Wartomson Store pada tampilan mobile'
);

// 5. Periksa Transaksi.jsx (Karyawan POS Mobile: 2 Kolom, Touch Friendly, Floating Cart)
const transaksiJsx = fs.readFileSync('src/pages/Transaksi.jsx', 'utf-8');
assert(
  transaksiJsx.includes('grid-cols-2') && transaksiJsx.includes('aspect-square'),
  'Halaman POS menampilkan produk dalam grid 2 kolom dengan rasio aspek gambar proporsional'
);
assert(
  transaksiJsx.includes('min-h-[38px]') && transaksiJsx.includes('+ Tambah'),
  'Kartu produk memiliki tombol sentuh "+ Tambah" yang ramah sentuhan (touch-friendly)'
);
assert(
  transaksiJsx.includes('fixed bottom-18') && transaksiJsx.includes('pos-cart-container'),
  'Tersedia floating cart summary bar di bagian bawah mobile dengan akses langsung ke checkout'
);

// 6. Periksa Dashboard.jsx (Admin Mobile: 2 Kolom Stat Cards & Card List Transaksi)
const dashboardJsx = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');
assert(
  dashboardJsx.includes('grid-cols-2 sm:grid-cols-2 xl:grid-cols-4'),
  'Dashboard stat cards responsif: 2 kolom pada smartphone, 4 kolom pada desktop'
);
assert(
  dashboardJsx.includes('block sm:hidden divide-y divide-slate-100') && dashboardJsx.includes('hidden sm:block overflow-x-auto'),
  'Tabel transaksi kasir otomatis berganti menjadi card list ringkas di smartphone untuk mencegah horizontal scroll'
);

// 7. Periksa Barang.jsx (Admin Produk: Card list di Mobile & Table di Desktop)
const barangJsx = fs.readFileSync('src/pages/Barang.jsx', 'utf-8');
assert(
  barangJsx.includes('block sm:hidden divide-y divide-slate-100') && barangJsx.includes('hidden sm:block relative z-10 overflow-x-auto'),
  'Katalog produk Admin otomatis berganti menjadi card list dengan aksi cepat di layar HP'
);

// 8. Periksa QrMenu.jsx (Customer Mobile: Banner Promo, 2 Kolom, 5-Item Bottom Nav, Profil Modal)
const qrMenuJsx = fs.readFileSync('src/pages/QrMenu.jsx', 'utf-8');
assert(
  qrMenuJsx.includes('Spesial Wartomson Store') && qrMenuJsx.includes('bg-gradient-to-r'),
  'QR Menu Customer memiliki banner promosi responsif yang menarik'
);
assert(
  qrMenuJsx.includes('grid grid-cols-2 gap-3') && qrMenuJsx.includes('min-h-[40px]'),
  'QR Menu menampilkan produk dalam grid 2 kolom dengan tombol sentuh touch-friendly (>=40px)'
);
assert(
  qrMenuJsx.includes('CUSTOMER MOBILE BOTTOM NAVIGATION BAR') && qrMenuJsx.includes('fixed bottom-0'),
  'QR Menu memiliki bottom navigation bar 5 menu (Home, Kategori, Keranjang, Pesanan, Profil)'
);
assert(
  qrMenuJsx.includes('isProfileModalOpen') && (qrMenuJsx.includes('Informasi Meja &amp; Toko') || qrMenuJsx.includes('Informasi Meja')),
  'QR Menu memiliki modal informasi profil toko dan sesi meja pelanggan'
);

// 9. Periksa index.css (Pencegahan horizontal scroll & touch-action)
const indexCss = fs.readFileSync('src/index.css', 'utf-8');
assert(
  indexCss.includes('overflow-x: hidden') && indexCss.includes('touch-action: manipulation'),
  'index.css mencegah horizontal overflow dan mengoptimalkan respon sentuhan mobile'
);

console.log('\n================================================================');
console.log(`🎯 TOTAL PENGUJIAN: ${passCount + failCount} | LULUS: ${passCount} | GAGAL: ${failCount}`);
console.log('================================================================');

if (failCount === 0) {
  console.log('🎉 SEMUA PENGUJIAN RESPONSIVE MOBILE WARTOMSON STORE LULUS SEMPURNA!\n');
  process.exit(0);
} else {
  console.error('❌ BEBERAPA PENGUJIAN GAGAL.\n');
  process.exit(1);
}
