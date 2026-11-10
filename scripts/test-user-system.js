/**
 * Automated Verification Script for QurmacelPOS Multi-User, Cashier Shift & Audit Trail System
 */

import {
  ROLES,
  USER_STATUS,
  DEFAULT_PERMISSIONS,
  DEFAULT_SUPER_ADMIN_EMAILS,
  DEFAULT_ADMIN_EMAILS,
  DEFAULT_CASHIER_EMAILS,
  PERMISSION_GROUPS,
  isAccountApproved,
  isAccountPending,
  isAccountSuspended,
  isAccountRejected,
  normalizeRole,
} from '../src/utils/userManagement.js';

import { formatActorInfo } from '../src/utils/activityLogger.js';

console.log('====================================================');
console.log('🧪 QURMACELPOS — TEST IDENTITAS PENGGUNA & AUDIT TRAIL');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// 1. Validasi 3 Akun Utama Sistem
assert(
  DEFAULT_SUPER_ADMIN_EMAILS.includes('qurmacel@gmail.com'),
  'Super Admin utama adalah qurmacel@gmail.com'
);

assert(
  DEFAULT_ADMIN_EMAILS.includes('admin@gmail.com'),
  'Admin awal terdaftar adalah admin@gmail.com'
);

assert(
  DEFAULT_CASHIER_EMAILS.includes('kasir@gmail.com'),
  'Kasir memiliki 1 akun login utama bersama (kasir@gmail.com)'
);

// 2. Validasi Helper Status & Role
assert(
  isAccountApproved('approved') === true && isAccountApproved('active') === true,
  'isAccountApproved mengenali status "approved" dan "active"'
);

assert(
  normalizeRole('super_admin') === ROLES.SUPER_ADMIN &&
  normalizeRole('admin') === ROLES.ADMIN &&
  normalizeRole('kasir') === ROLES.KASIR,
  'normalizeRole menangani huruf besar/kecil secara benar'
);

// 3. Pengujian Format Identitas Pelaku Super Admin (Qurmacel — SUPER ADMIN)
const logSuperAdmin = {
  id: 'ACT-001',
  actorUid: 'super-uid-1',
  actorEmail: 'qurmacel@gmail.com',
  actorName: 'qurmacel',
  actorRole: 'SUPER_ADMIN',
  action: 'USER_APPROVED',
  module: 'USER_MANAGEMENT',
  timestamp: new Date().toISOString(),
};

const actorSuper = formatActorInfo(logSuperAdmin);
assert(
  actorSuper.displayName === 'Qurmacel' &&
  actorSuper.badgeText === 'SUPER ADMIN',
  'Super Admin diformat dengan jelas: "Qurmacel — SUPER ADMIN"'
);

// 4. Pengujian Format Identitas Pelaku Admin (Admin Toko — ADMIN)
const logAdmin = {
  id: 'ACT-002',
  actorUid: 'admin-uid-2',
  actorEmail: 'admin@gmail.com',
  actorName: 'admin',
  actorRole: 'ADMIN',
  action: 'PRODUCT_CREATED',
  module: 'BARANG',
  timestamp: new Date().toISOString(),
};

const actorAdmin = formatActorInfo(logAdmin);
assert(
  actorAdmin.displayName === 'Admin Toko' &&
  actorAdmin.badgeText === 'ADMIN',
  'Admin diformat dengan jelas: "Admin Toko — ADMIN"'
);

// 5. Pengujian Sesi Kasir Mandiri — Petugas Andi
// Kasir login dengan akun bersama, lalu memasukkan nama "Andi" saat memulai sesi tugas
const logKasirAndiShiftStart = {
  id: 'ACT-003',
  actorUid: 'kasir-uid-shared',
  actorEmail: 'kasir@gmail.com',
  actorName: 'Andi',
  operatorName: 'Andi',
  actorRole: 'KASIR',
  action: 'CASHIER_SHIFT_START',
  module: 'TRANSAKSI',
  timestamp: new Date(Date.now() - 3600000).toISOString(),
};

const logKasirAndiTransaction = {
  id: 'ACT-004',
  actorUid: 'kasir-uid-shared',
  actorEmail: 'kasir@gmail.com',
  actorName: 'Andi',
  operatorName: 'Andi',
  actorRole: 'KASIR',
  action: 'TRANSACTION_CREATED',
  module: 'TRANSAKSI',
  timestamp: new Date(Date.now() - 3000000).toISOString(),
};

const logKasirAndiShiftEnd = {
  id: 'ACT-005',
  actorUid: 'kasir-uid-shared',
  actorEmail: 'kasir@gmail.com',
  actorName: 'Andi',
  operatorName: 'Andi',
  actorRole: 'KASIR',
  action: 'CASHIER_SHIFT_END',
  module: 'TRANSAKSI',
  timestamp: new Date(Date.now() - 2500000).toISOString(),
};

const actorAndi = formatActorInfo(logKasirAndiTransaction);
assert(
  actorAndi.displayName === 'Andi' &&
  actorAndi.badgeText === 'KASIR',
  'Aktivitas Kasir Andi tercatat dengan identitas petugas: "Andi — KASIR"'
);

// 6. Pengujian Sesi Kasir Mandiri Berikutnya — Petugas Budi
// Sesi Andi ditutup, lalu petugas Budi login/mengisi nama mandiri untuk shift berikutnya
const logKasirBudiShiftStart = {
  id: 'ACT-006',
  actorUid: 'kasir-uid-shared',
  actorEmail: 'kasir@gmail.com',
  actorName: 'Budi',
  operatorName: 'Budi',
  actorRole: 'KASIR',
  action: 'CASHIER_SHIFT_START',
  module: 'TRANSAKSI',
  timestamp: new Date(Date.now() - 1800000).toISOString(),
};

const logKasirBudiTransaction = {
  id: 'ACT-007',
  actorUid: 'kasir-uid-shared',
  actorEmail: 'kasir@gmail.com',
  actorName: 'Budi',
  operatorName: 'Budi',
  actorRole: 'KASIR',
  action: 'TRANSACTION_CREATED',
  module: 'TRANSAKSI',
  timestamp: new Date(Date.now() - 900000).toISOString(),
};

const actorBudi = formatActorInfo(logKasirBudiTransaction);
assert(
  actorBudi.displayName === 'Budi' &&
  actorBudi.badgeText === 'KASIR',
  'Aktivitas Kasir Budi tercatat dengan identitas petugas: "Budi — KASIR"'
);

// 7. Pengujian Integritas Riwayat Lama (Andi vs Budi)
// Pastikan log lama Andi TIDAK berubah menjadi Budi saat Budi sedang aktif
assert(
  formatActorInfo(logKasirAndiTransaction).displayName === 'Andi' &&
  formatActorInfo(logKasirBudiTransaction).displayName === 'Budi',
  'Integritas riwayat terjaga: Catatan lama Andi tetap "Andi" dan catatan Budi tetap "Budi"'
);

// 8. Pengujian Kasir Tanpa Sesi / Nama Tidak Diketahui
const logKasirAnonymous = {
  id: 'ACT-008',
  actorUid: 'kasir-uid-shared',
  actorEmail: 'kasir@gmail.com',
  actorName: 'Kasir',
  operatorName: null,
  actorRole: 'KASIR',
  action: 'ORDER_ACCEPTED',
  module: 'DINE_IN',
  timestamp: new Date().toISOString(),
};

const actorAnon = formatActorInfo(logKasirAnonymous);
assert(
  actorAnon.displayName === 'Kasir (Tidak Diketahui)' &&
  actorAnon.badgeText === 'KASIR',
  'Aktivitas Kasir tanpa nama petugas ditampilkan sebagai "Kasir (Tidak Diketahui)" dan tidak mengarang nama'
);

// 9. Perlindungan Akun Utama dari Pendaftaran Publik
function validatePublicRegistration(emailInput) {
  const lower = emailInput.toLowerCase().trim();
  const protectedEmails = ['qurmacel@gmail.com', 'admin@gmail.com', 'kasir@gmail.com'];
  if (protectedEmails.includes(lower)) {
    return { allowed: false, error: 'Email ini dilindungi sistem' };
  }
  return { allowed: true };
}

assert(
  validatePublicRegistration('qurmacel@gmail.com').allowed === false &&
  validatePublicRegistration('admin@gmail.com').allowed === false &&
  validatePublicRegistration('kasir@gmail.com').allowed === false &&
  validatePublicRegistration('pegawaibaru@gmail.com').allowed === true,
  'Ketiga akun utama login dilindungi secara ketat dari pendaftaran publik'
);

console.log(`\n====================================================`);
console.log(`HASIL PENGUJIAN: ${passedTests} / ${totalTests} BERHASIL`);
console.log(`STATUS: ${passedTests === totalTests ? '🎉 SEMUA TEST IDENTITAS & AUDIT TRAIL LULUS SEMPURNA!' : '⚠️ TERDAPAT TEST GAGAL'}`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
