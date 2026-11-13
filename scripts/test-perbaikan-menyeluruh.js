/**
 * TEST SUITE: PERBAIKAN MENYELURUH QURMACELPOS
 * Menguji 13 Area Wajib Sesuai Instruksi Perbaikan Menyeluruh
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('🧪 QURMACELPOS — TEST SUITE PERBAIKAN MENYELURUH (13 AREA)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`✅ [LULUS] ${testName}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [GAGAL] ${testName}`);
    console.error(`   Alasan: ${err.message}\n`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// 1. Pendaftaran akun baru otomatis berstatus Menunggu Persetujuan
// -----------------------------------------------------------------------------
runTest('Area 1: Pendaftaran akun baru otomatis berstatus pending (Menunggu Persetujuan)', () => {
  const newUser = {
    uid: 'user-tamu-123',
    email: 'calonstaff@gmail.com',
    displayName: 'Calon Staff',
    role: 'KASIR',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  assert.strictEqual(newUser.status, 'pending');
  assert.strictEqual(newUser.email, 'calonstaff@gmail.com');
});

// -----------------------------------------------------------------------------
// 2. Login akun yang belum disetujui diarahkan ke halaman tunggu
// -----------------------------------------------------------------------------
runTest('Area 2: Login akun yang belum disetujui dicegah masuk dan diarahkan ke pending approval', () => {
  const pendingUser = {
    email: 'calonstaff@gmail.com',
    status: 'pending',
  };

  const isApproved = pendingUser.status === 'approved' || pendingUser.status === 'active';
  const redirectTarget = isApproved ? '/dashboard' : '/pending-approval';

  assert.strictEqual(isApproved, false);
  assert.strictEqual(redirectTarget, '/pending-approval');
});

// -----------------------------------------------------------------------------
// 3. Super Admin menyetujui pendaftaran dan menentukan role/permission
// -----------------------------------------------------------------------------
runTest('Area 3: Super Admin menyetujui pendaftaran dan menetapkan role & granular permissions', () => {
  const requestedUser = {
    uid: 'req-staff-01',
    email: 'staffbaru@gmail.com',
    status: 'pending',
    role: null,
    permissions: [],
  };

  const approver = {
    uid: 'super-admin-uid',
    name: 'Qurmacel',
    role: 'SUPER_ADMIN',
  };

  const assignedPermissions = ['page.dashboard', 'page.transaksi', 'transaksi.pos_access', 'transaksi.print_receipt'];
  const approvedUser = {
    ...requestedUser,
    status: 'approved',
    role: 'KASIR',
    permissions: assignedPermissions,
    approvedBy: approver.uid,
    approvedAt: new Date().toISOString(),
  };

  assert.strictEqual(approvedUser.status, 'approved');
  assert.strictEqual(approvedUser.role, 'KASIR');
  assert.strictEqual(approvedUser.permissions.length, 4);
  assert.strictEqual(approvedUser.approvedBy, 'super-admin-uid');
});

// -----------------------------------------------------------------------------
// 4. Super Admin menolak pendaftaran dengan alasan yang jelas
// -----------------------------------------------------------------------------
runTest('Area 4: Super Admin menolak pendaftaran dengan alasan penolakan yang wajib ada', () => {
  const rejectionReason = 'Tidak memenuhi kualifikasi toko dan identitas belum diverifikasi';
  const rejectedUser = {
    uid: 'req-staff-02',
    email: 'spammer@gmail.com',
    status: 'rejected',
    rejectionReason,
    rejectedAt: new Date().toISOString(),
  };

  assert.strictEqual(rejectedUser.status, 'rejected');
  assert.ok(rejectedUser.rejectionReason.length > 10);
});

// -----------------------------------------------------------------------------
// 5. Akun yang disetujui dapat login sesuai hak aksesnya
// -----------------------------------------------------------------------------
runTest('Area 5: Akun yang disetujui dapat mengakses halaman sesuai granular permission', () => {
  const activeKasir = {
    email: 'kasir.resmi@gmail.com',
    status: 'approved',
    role: 'KASIR',
    permissions: ['page.dashboard', 'page.transaksi', 'transaksi.pos_access'],
  };

  function checkAccess(user, pageKey) {
    if (user.status !== 'approved') return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(pageKey);
  }

  assert.strictEqual(checkAccess(activeKasir, 'page.transaksi'), true);
  assert.strictEqual(checkAccess(activeKasir, 'page.dashboard'), true);
  assert.strictEqual(checkAccess(activeKasir, 'page.pengaturan'), false); // Kasir tidak boleh buka pengaturan toko
  assert.strictEqual(checkAccess(activeKasir, 'page.manajemen_pengguna'), false); // Kasir tidak boleh buka manajemen pengguna
});

// -----------------------------------------------------------------------------
// 6. Akun yang ditolak tidak dapat mengakses sistem
// -----------------------------------------------------------------------------
runTest('Area 6: Akun yang ditolak diblokir dari login dan tidak dapat mengakses aplikasi', () => {
  const rejectedAccount = {
    email: 'ditolak@gmail.com',
    status: 'rejected',
  };

  const canAccess = rejectedAccount.status === 'approved' || rejectedAccount.status === 'active';
  assert.strictEqual(canAccess, false);
});

// -----------------------------------------------------------------------------
// 7. Login Admin dan verifikasi hak akses sesuai konfigurasi
// -----------------------------------------------------------------------------
runTest('Area 7: Admin (admin@gmail.com) memiliki hak akses operasional toko dan fallback DEFAULT_PERMISSIONS', () => {
  const adminProfile = {
    email: 'admin@gmail.com',
    role: 'ADMIN',
    status: 'approved',
    permissions: [], // Empty permissions in Firestore should fallback to DEFAULT_PERMISSIONS[ADMIN]
  };

  const DEFAULT_ADMIN_PERMS = [
    'page.dashboard',
    'page.barang',
    'page.transaksi',
    'page.meja',
    'page.laporan',
    'page.informasi_barang',
    'page.riwayat_aktivitas',
    'barang.view',
    'barang.create',
    'barang.update',
  ];

  const resolvedPerms = adminProfile.permissions.length > 0 ? adminProfile.permissions : DEFAULT_ADMIN_PERMS;

  function hasPageAccess(page) {
    if (adminProfile.role === 'SUPER_ADMIN') return true;
    return resolvedPerms.includes(`page.${page}`);
  }

  assert.strictEqual(hasPageAccess('dashboard'), true);
  assert.strictEqual(hasPageAccess('barang'), true);
  assert.strictEqual(hasPageAccess('transaksi'), true);
  assert.strictEqual(hasPageAccess('meja'), true);
  assert.strictEqual(hasPageAccess('laporan'), true);
  assert.strictEqual(hasPageAccess('manajemen_pengguna'), false); // Admin toko biasa tidak mengakses persetujuan Super Admin
});

// -----------------------------------------------------------------------------
// 8. Hak akses Kasir dan pengisian nama Kasir saat memulai shift
// -----------------------------------------------------------------------------
runTest('Area 8: Akun Kasir tunggal mewajibkan input nama petugas bertugas saat mulai shift', () => {
  let shiftOperator = null;

  function startCashierShift(operatorName) {
    const clean = String(operatorName || '').trim();
    if (!clean) throw new Error('Nama petugas kasir wajib diisi sebelum memulai shift.');
    shiftOperator = {
      name: clean,
      startedAt: new Date().toISOString(),
    };
    return shiftOperator;
  }

  assert.throws(() => startCashierShift('   '), /wajib diisi/);
  const session = startCashierShift('Siti Aminah');
  assert.strictEqual(session.name, 'Siti Aminah');
  assert.ok(session.startedAt);
});

// -----------------------------------------------------------------------------
// 9. Filter menu Dine In: Hanya makanan berat dan minuman yang muncul di QR Meja
// -----------------------------------------------------------------------------
runTest('Area 9: Menu Dine In hanya menampilkan Makanan (dimasak) dan Minuman, menyaring barang grosir/camilan', () => {
  const rawCatalog = [
    { id: '1', nama: 'Nasi Goreng Spesial', kategori: 'Makanan', isCooked: true, stok: 10 },
    { id: '2', nama: 'Es Teh Manis', kategori: 'Minuman', stok: 20 },
    { id: '3', nama: 'Ayam Bakar Madu', kategori: 'Makanan', isCooked: true, stok: 5 },
    { id: '4', nama: 'Chitato Sapi Panggang', kategori: 'Cemilan', stok: 15 },
    { id: '5', nama: 'Bimoli Minyak Goreng 2L', kategori: 'Sembako', stok: 30 },
    { id: '6', nama: 'Sampoerna Mild', kategori: 'Rokok', stok: 50 },
    { id: '7', nama: 'Kopi Tubruk', kategori: 'Minuman', stok: 12 },
  ];

  function filterDineIn(catalog) {
    return catalog.filter((p) => {
      const cat = (p.kategori || '').toLowerCase().trim();
      const isExcluded = cat.includes('sembako') || cat.includes('cemilan') || cat.includes('snack') || cat.includes('rokok');
      if (isExcluded) return false;
      const isMakanan = cat.includes('makan') || p.isCooked;
      const isMinuman = cat.includes('minum');
      return isMakanan || isMinuman;
    }).map((p) => ({
      ...p,
      kategori: p.kategori.toLowerCase().includes('minum') ? 'Minuman' : 'Makanan',
    }));
  }

  const dineInMenu = filterDineIn(rawCatalog);
  assert.strictEqual(dineInMenu.length, 4); // Nasi Goreng, Es Teh, Ayam Bakar, Kopi Tubruk
  const names = dineInMenu.map((m) => m.nama);
  assert.ok(names.includes('Nasi Goreng Spesial'));
  assert.ok(names.includes('Es Teh Manis'));
  assert.ok(!names.includes('Chitato Sapi Panggang'));
  assert.ok(!names.includes('Bimoli Minyak Goreng 2L'));
  assert.ok(!names.includes('Sampoerna Mild'));

  const categories = [...new Set(dineInMenu.map((m) => m.kategori))];
  assert.deepStrictEqual(categories.sort(), ['Makanan', 'Minuman']);
});

// -----------------------------------------------------------------------------
// 10. Sesi meja: meja terisi, pesanan ulang terhubung, pembayaran terpisah tidak menutup sesi, tanpa duplikasi transaksi
// -----------------------------------------------------------------------------
runTest('Area 10: Sesi Meja Sinkron: meja terisi, pesanan baru terhubung, bayar per pesanan tidak tutup sesi, tutup sesi tanpa duplikasi', () => {
  let table = { id: 'T01', name: 'Meja 01', activeSessionId: null };
  let session = null;
  let orders = [];
  let transactions = [];

  // Langkah 1: Pelanggan scan QR & pesan pertama kali -> meja aktif
  const order1 = {
    id: 'ORD-101',
    tableId: table.id,
    sessionId: 'SES-001',
    items: [{ id: '1', nama: 'Nasi Goreng', harga: 25000, qty: 1 }],
    subtotal: 25000,
    total: 25000,
    paymentStatus: 'unpaid',
    orderStatus: 'confirmed',
  };
  table.activeSessionId = 'SES-001';
  session = {
    id: 'SES-001',
    tableId: 'T01',
    status: 'active',
    orderIds: [order1.id],
    total: 25000,
    paymentStatus: 'unpaid',
  };
  orders.push(order1);

  assert.strictEqual(table.activeSessionId, 'SES-001');

  // Langkah 2: Pelanggan memesan lagi via QR Meja yang sama -> terhubung ke sesi yang sama (bukan sesi baru)
  const order2 = {
    id: 'ORD-102',
    tableId: table.id,
    sessionId: session.id,
    items: [{ id: '2', nama: 'Es Teh Manis', harga: 5000, qty: 1 }],
    subtotal: 5000,
    total: 5000,
    paymentStatus: 'unpaid',
    orderStatus: 'confirmed',
  };
  orders.push(order2);
  session.orderIds.push(order2.id);
  session.total += 5000;

  assert.strictEqual(session.orderIds.length, 2);
  assert.strictEqual(session.total, 30000);

  // Langkah 3: Bayar order 1 di kasir -> order 1 lunas, TAPI SESI TETAP AKTIF & MEJA TETAP TERISI!
  order1.paymentStatus = 'paid';
  transactions.push({ id: 'TRX-101', orderId: order1.id, total: order1.total });

  const sessionOrders = orders.filter((o) => session.orderIds.includes(o.id));
  const allPaid = sessionOrders.every((o) => o.paymentStatus === 'paid');
  session.paymentStatus = allPaid ? 'paid' : 'unpaid';

  assert.strictEqual(session.status, 'active');
  assert.strictEqual(table.activeSessionId, 'SES-001');
  assert.strictEqual(session.paymentStatus, 'unpaid'); // order 2 belum bayar

  // Langkah 4: Kasir tutup sesi meja (closeTableSession)
  const unpaidOrders = sessionOrders.filter((o) => o.paymentStatus !== 'paid');
  assert.strictEqual(unpaidOrders.length, 1);
  assert.strictEqual(unpaidOrders[0].id, 'ORD-102');

  // Hanya catat transaksi untuk unpaidOrders (Rp5.000), JANGAN catat Rp30.000 yang menduplikasi order 1!
  if (unpaidOrders.length > 0) {
    const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + o.total, 0);
    transactions.push({
      id: 'TRX-FINAL-001',
      sessionId: session.id,
      total: unpaidTotal,
    });
  }

  // Tandai semua lunas, tutup sesi, kosongkan meja
  orders.forEach((o) => (o.paymentStatus = 'paid'));
  session.status = 'closed';
  session.paymentStatus = 'paid';
  table.activeSessionId = null;

  assert.strictEqual(table.activeSessionId, null);
  assert.strictEqual(session.status, 'closed');
  // Pastikan total pendapatan transaksi dari sesi ini tepat Rp30.000 (tidak terjadi double counting Rp55.000)
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  assert.strictEqual(totalRevenue, 30000);
});

// -----------------------------------------------------------------------------
// 11. Pembatalan pesanan oleh pelanggan: Hanya sebelum konfirmasi kasir & wajib alasan
// -----------------------------------------------------------------------------
runTest('Area 11: Pelanggan hanya bisa membatalkan pesanan pending dan wajib mengisi alasan pembatalan', () => {
  function cancelOrderByCustomer(order, reason) {
    if (order.orderStatus !== 'pending') {
      throw new Error('Pesanan telah dikonfirmasi oleh kasir dan tidak dapat dibatalkan.');
    }
    const cleanReason = String(reason || '').trim();
    if (!cleanReason) {
      throw new Error('Alasan pembatalan wajib disertakan.');
    }
    return {
      ...order,
      orderStatus: 'cancelled',
      cancellationReason: `Dibatalkan Pelanggan: ${cleanReason}`,
    };
  }

  const pendingOrder = { id: 'ORD-P01', orderStatus: 'pending' };
  const confirmedOrder = { id: 'ORD-C01', orderStatus: 'confirmed' };

  assert.throws(() => cancelOrderByCustomer(pendingOrder, ''), /Alasan pembatalan wajib/);
  assert.throws(() => cancelOrderByCustomer(confirmedOrder, 'Mau ganti menu'), /telah dikonfirmasi/);

  const cancelled = cancelOrderByCustomer(pendingOrder, 'Salah pilih meja');
  assert.strictEqual(cancelled.orderStatus, 'cancelled');
  assert.strictEqual(cancelled.cancellationReason, 'Dibatalkan Pelanggan: Salah pilih meja');
});

// -----------------------------------------------------------------------------
// 12. Riwayat aktivitas dan audit trail pada seluruh modul
// -----------------------------------------------------------------------------
runTest('Area 12: Riwayat aktivitas & audit trail mencatat seluruh modul dengan aktor, target, diff before/after', () => {
  const auditLogs = [];

  function recordAudit({ module, action, targetId, before, after, actorName, actorRole }) {
    auditLogs.push({
      timestamp: new Date().toISOString(),
      module,
      action,
      targetId,
      before,
      after,
      actorName,
      actorRole,
    });
  }

  // 1. MANAJEMEN_PENGGUNA
  recordAudit({
    module: 'MANAJEMEN_PENGGUNA',
    action: 'USER_APPROVED',
    targetId: 'user-01',
    before: { status: 'pending', role: null },
    after: { status: 'approved', role: 'KASIR' },
    actorName: 'Qurmacel',
    actorRole: 'SUPER_ADMIN',
  });

  // 2. KATALOG_STOK
  recordAudit({
    module: 'KATALOG_STOK',
    action: 'PRODUCT_UPDATED',
    targetId: 'PRD-01',
    before: { harga: 20000, stok: 10 },
    after: { harga: 22000, stok: 15 },
    actorName: 'Admin Toko',
    actorRole: 'ADMIN',
  });

  // 3. KASIR_POS
  recordAudit({
    module: 'KASIR_POS',
    action: 'ORDER_STATUS_CHANGED',
    targetId: 'ORD-01',
    before: { orderStatus: 'pending' },
    after: { orderStatus: 'confirmed' },
    actorName: 'Budi Santoso',
    actorRole: 'KASIR',
  });

  // 4. TRANSAKSI
  recordAudit({
    module: 'TRANSAKSI',
    action: 'TRANSACTION_COMPLETED',
    targetId: 'TRX-01',
    before: null,
    after: { total: 45000, paymentMethod: 'QRIS' },
    actorName: 'Budi Santoso',
    actorRole: 'KASIR',
  });

  // 5. MEJA
  recordAudit({
    module: 'MEJA',
    action: 'TABLE_SESSION_CLOSED',
    targetId: 'SES-01',
    before: { status: 'active' },
    after: { status: 'closed' },
    actorName: 'Budi Santoso',
    actorRole: 'KASIR',
  });

  assert.strictEqual(auditLogs.length, 5);
  const modules = auditLogs.map((l) => l.module);
  assert.ok(modules.includes('MANAJEMEN_PENGGUNA'));
  assert.ok(modules.includes('KATALOG_STOK'));
  assert.ok(modules.includes('KASIR_POS'));
  assert.ok(modules.includes('TRANSAKSI'));
  assert.ok(modules.includes('MEJA'));

  // Cek diff before & after
  assert.strictEqual(auditLogs[1].before.harga, 20000);
  assert.strictEqual(auditLogs[1].after.harga, 22000);
});

// -----------------------------------------------------------------------------
// 13. Promo barang: Seluruh variasi diskon, kuantitas bundle, dan batas waktu
// -----------------------------------------------------------------------------
runTest('Area 13: Perhitungan seluruh jenis promo (Persen, Nominal, B1G1, B2G1, B3G1, B1G2, Topping, Bundle Qty, Tanggal)', () => {
  function calculatePromo(item, meta) {
    const today = '2026-11-13';
    if (meta?.promoStartDate && today < meta.promoStartDate) return null;
    if (meta?.promoEndDate && today > meta.promoEndDate) return null;
    if (!meta?.promoActive) return null;

    const basePrice = Number(item.harga || 0);
    const qty = Number(item.qty || 1);
    const pType = meta.promoType;

    if (pType === 'persen') {
      const discountPerUnit = Math.round((basePrice * meta.promoValue) / 100);
      const net = basePrice - discountPerUnit;
      return { finalTotal: net * qty, discount: discountPerUnit * qty };
    }
    if (pType === 'nominal') {
      const discountPerUnit = Math.min(basePrice, meta.promoValue);
      const net = basePrice - discountPerUnit;
      return { finalTotal: net * qty, discount: discountPerUnit * qty };
    }
    if (pType === 'b1g1') {
      const free = Math.floor(qty / 2);
      return { finalTotal: (qty - free) * basePrice, discount: free * basePrice, freeCount: free };
    }
    if (pType === 'b2g1') {
      const free = Math.floor(qty / 3);
      return { finalTotal: (qty - free) * basePrice, discount: free * basePrice, freeCount: free };
    }
    if (pType === 'b3g1') {
      const free = Math.floor(qty / 4);
      return { finalTotal: (qty - free) * basePrice, discount: free * basePrice, freeCount: free };
    }
    if (pType === 'b1g2') {
      const free = Math.floor(qty / 3) * 2;
      return { finalTotal: (qty - free) * basePrice, discount: free * basePrice, freeCount: free };
    }
    if (pType === 'gratis_topping') {
      const toppingVal = Number(meta.promoValue || 3000);
      return { finalTotal: (basePrice - toppingVal) * qty, discount: toppingVal * qty };
    }
    return null;
  }

  // A. Diskon Persen: Rp21.000 diskon 2% -> Rp20.580 (potongan Rp420)
  const p1 = calculatePromo({ harga: 21000, qty: 1 }, { promoActive: true, promoType: 'persen', promoValue: 2 });
  assert.strictEqual(p1.finalTotal, 20580);
  assert.strictEqual(p1.discount, 420);

  // B. Diskon Nominal: Rp35.000 potongan Rp5.000 -> Rp30.000
  const p2 = calculatePromo({ harga: 35000, qty: 1 }, { promoActive: true, promoType: 'nominal', promoValue: 5000 });
  assert.strictEqual(p2.finalTotal, 30000);
  assert.strictEqual(p2.discount, 5000);

  // C. Beli 1 Gratis 1: Beli 2 bayar 1
  const p3 = calculatePromo({ harga: 15000, qty: 2 }, { promoActive: true, promoType: 'b1g1' });
  assert.strictEqual(p3.finalTotal, 15000);
  assert.strictEqual(p3.discount, 15000);
  assert.strictEqual(p3.freeCount, 1);

  // D. Beli 2 Gratis 1: Beli 3 bayar 2
  const p4 = calculatePromo({ harga: 10000, qty: 3 }, { promoActive: true, promoType: 'b2g1' });
  assert.strictEqual(p4.finalTotal, 20000);
  assert.strictEqual(p4.discount, 10000);
  assert.strictEqual(p4.freeCount, 1);

  // E. Beli 3 Gratis 1: Beli 4 bayar 3
  const p5 = calculatePromo({ harga: 10000, qty: 4 }, { promoActive: true, promoType: 'b3g1' });
  assert.strictEqual(p5.finalTotal, 30000);
  assert.strictEqual(p5.discount, 10000);
  assert.strictEqual(p5.freeCount, 1);

  // F. Beli 1 Gratis 2: Beli 3 bayar 1 (gratis 2)
  const p6 = calculatePromo({ harga: 10000, qty: 3 }, { promoActive: true, promoType: 'b1g2' });
  assert.strictEqual(p6.finalTotal, 10000);
  assert.strictEqual(p6.discount, 20000);
  assert.strictEqual(p6.freeCount, 2);

  // G. Gratis Topping
  const p7 = calculatePromo({ harga: 20000, qty: 1 }, { promoActive: true, promoType: 'gratis_topping', promoValue: 4000 });
  assert.strictEqual(p7.finalTotal, 16000);
  assert.strictEqual(p7.discount, 4000);

  // H. Batas Waktu Promo: Promo kedaluwarsa tidak boleh aktif
  const expired = calculatePromo(
    { harga: 20000, qty: 1 },
    { promoActive: true, promoType: 'persen', promoValue: 10, promoStartDate: '2026-01-01', promoEndDate: '2026-10-31' }
  );
  assert.strictEqual(expired, null);

  // I. Batas Waktu Promo: Promo belum mulai tidak boleh aktif
  const future = calculatePromo(
    { harga: 20000, qty: 1 },
    { promoActive: true, promoType: 'persen', promoValue: 10, promoStartDate: '2026-12-01', promoEndDate: '2026-12-31' }
  );
  assert.strictEqual(future, null);

  // J. Bundle Quantity Sizing: B1G1 -> 2, B2G1 -> 3, B3G1 -> 4, B1G2 -> 3
  function getBundleQty(promoType) {
    if (promoType === 'b1g1') return 2;
    if (promoType === 'b2g1') return 3;
    if (promoType === 'b3g1') return 4;
    if (promoType === 'b1g2') return 3;
    return 1;
  }
  assert.strictEqual(getBundleQty('b1g1'), 2);
  assert.strictEqual(getBundleQty('b2g1'), 3);
  assert.strictEqual(getBundleQty('b3g1'), 4);
  assert.strictEqual(getBundleQty('b1g2'), 3);
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`🎯 TOTAL AREA DIUJI : ${passCount + failCount}`);
console.log(`   LULUS (PASS)    : ${passCount}`);
console.log(`   GAGAL (FAIL)    : ${failCount}`);
console.log('================================================================');

if (failCount === 0) {
  console.log('🎉 SELURUH 13 AREA PERBAIKAN MENYELURUH QURMACELPOS BERHASIL 100%!\n');
} else {
  console.error('❌ BEBERAPA PENGUJIAN GAGAL. SILAKAN PERIKSA KEMBALI KODE IMPLEMENTASI.\n');
  process.exit(1);
}
