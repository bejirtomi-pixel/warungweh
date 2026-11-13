import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth';
import { db } from '../firebase.js';
import { logActivity, logAuditTrail } from './activityLogger.js';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  KASIR: 'KASIR',
};

export const USER_STATUS = {
  APPROVED: 'approved',
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
  BELUM_DITENTUKAN: 'belum_ditentukan',
};

// 5 Akun Terdaftar di Firebase Authentication (Pertahankan seluruhnya)
export const INITIAL_AUTH_ACCOUNTS = [
  {
    uid: 'user-superadmin-qurmacel',
    id: 'user-superadmin-qurmacel',
    email: 'qurmacel@gmail.com',
    username: 'qurmacel',
    displayName: 'Qurmacel',
    role: ROLES.SUPER_ADMIN,
    roleAlias: 'super_admin',
    status: USER_STATUS.APPROVED,
    statusAlias: 'active',
    permissions: ['*'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'user-admin-default',
    id: 'user-admin-default',
    email: 'admin@gmail.com',
    username: 'admin',
    displayName: 'Admin Toko',
    role: ROLES.ADMIN,
    roleAlias: 'admin',
    status: USER_STATUS.APPROVED,
    statusAlias: 'active',
    permissions: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'user-kasir-default',
    id: 'user-kasir-default',
    email: 'kasir@gmail.com',
    username: 'kasir',
    displayName: 'Kasir Toko',
    role: ROLES.KASIR,
    roleAlias: 'kasir',
    status: USER_STATUS.APPROVED,
    statusAlias: 'active',
    permissions: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'user-legacy-qurma1',
    id: 'user-legacy-qurma1',
    email: 'qurma1@gmail.com',
    username: 'qurma1',
    displayName: 'qurma1',
    role: 'belum_ditentukan',
    roleAlias: 'belum_ditentukan',
    status: 'belum_ditentukan',
    statusAlias: 'belum_ditentukan',
    permissions: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'user-legacy-kasir-qurmacel',
    id: 'user-legacy-kasir-qurmacel',
    email: 'kasir@qurmacel.com',
    username: 'kasir-qurmacel',
    displayName: 'Kasir Qurmacel',
    role: 'belum_ditentukan',
    roleAlias: 'belum_ditentukan',
    status: 'belum_ditentukan',
    statusAlias: 'belum_ditentukan',
    permissions: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_SUPER_ADMIN_EMAILS = ['qurmacel@gmail.com'];
export const DEFAULT_ADMIN_EMAILS = ['admin@gmail.com'];
export const DEFAULT_CASHIER_EMAILS = ['kasir@gmail.com'];

// Helper Status & Role Checking
export function isAccountApproved(status) {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'approved' || s === 'active';
}

export function isAccountPending(status) {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'pending' || s === 'menunggu';
}

export function isAccountSuspended(status) {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'suspended' || s === 'ditangguhkan';
}

export function isAccountRejected(status) {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'rejected' || s === 'ditolak';
}

export function isAccountUndetermined(status) {
  if (!status) return true;
  const s = String(status).toLowerCase().trim();
  return s === 'belum_ditentukan' || s === 'unknown' || s === 'unassigned';
}

export function normalizeRole(role) {
  if (!role) return 'belum_ditentukan';
  const r = String(role).toUpperCase().trim();
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN' || r === 'OWNER') return ROLES.SUPER_ADMIN;
  if (r === 'ADMIN') return ROLES.ADMIN;
  if (r === 'KASIR' || r === 'CASHIER') return ROLES.KASIR;
  if (r === 'BELUM_DITENTUKAN' || r === 'NONE' || r === 'UNASSIGNED') return 'belum_ditentukan';
  return 'belum_ditentukan';
}

export function isRoleAssigned(role) {
  const r = normalizeRole(role);
  return r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN || r === ROLES.KASIR;
}

// Modul & Daftar Granular Permission
export const PERMISSION_GROUPS = [
  {
    group: 'Halaman Utama',
    permissions: [
      { key: 'page.dashboard', label: 'Dashboard', desc: 'Melihat ringkasan data dan performa toko' },
      { key: 'page.barang', label: 'Halaman Barang', desc: 'Membuka master data barang dan stok' },
      { key: 'page.transaksi', label: 'Kasir POS & Transaksi', desc: 'Membuka mesin kasir dan antrean pesanan' },
      { key: 'page.meja', label: 'Manajemen Meja', desc: 'Mengelola tata letak dan status meja Dine In' },
      { key: 'page.laporan', label: 'Laporan Penjualan', desc: 'Melihat rekap transaksi, laba, dan grafik' },
      { key: 'page.informasi_barang', label: 'Informasi Barang', desc: 'Melihat promo, best seller, dan detail barang' },
      { key: 'page.pengaturan', label: 'Pengaturan', desc: 'Mengonfigurasi printer, pajak, dan aplikasi' },
      { key: 'page.profil_toko', label: 'Profil Toko', desc: 'Mengubah identitas toko dan footer struk' },
      { key: 'page.manajemen_pengguna', label: 'Manajemen Pengguna', desc: 'Mengelola hak akses, staf, dan persetujuan' },
      { key: 'page.riwayat_aktivitas', label: 'Riwayat Aktivitas', desc: 'Melihat jejak audit trail seluruh tindakan' },
    ],
  },
  {
    group: 'Operasional Meja',
    permissions: [
      { key: 'meja.view', label: 'Lihat Meja', desc: 'Melihat status meja di halaman meja' },
      { key: 'meja.qr_view', label: 'Tampilkan QR', desc: 'Membuka QR meja di layar kasir untuk pelanggan' },
      { key: 'meja.session_open', label: 'Buka Sesi Meja', desc: 'Memulai sesi baru untuk pelanggan di meja' },
      { key: 'meja.session_close', label: 'Tutup Sesi Meja', desc: 'Menutup sesi dan mengonfirmasi pelunasan tagihan' },
      { key: 'meja.create', label: 'Tambah Meja', desc: 'Menambahkan meja baru ke sistem' },
      { key: 'meja.update', label: 'Edit Meja', desc: 'Mengubah nama dan kapasitas meja' },
      { key: 'meja.deactivate', label: 'Nonaktifkan Meja', desc: 'Menandai meja sebagai nonaktif' },
      { key: 'meja.qr_manage', label: 'Regenerasi QR', desc: 'Memperbarui token QR meja' },
    ],
  },
  {
    group: 'Pesanan Dine In',
    permissions: [
      { key: 'dinein.view_orders', label: 'Lihat Antrean Pesanan', desc: 'Melihat pesanan masuk dari QR pelanggan' },
      { key: 'dinein.accept_order', label: 'Terima Pesanan', desc: 'Menerima pesanan pending dan memasukkannya ke tagihan sesi' },
      { key: 'dinein.reject_order', label: 'Tolak Pesanan', desc: 'Menolak pesanan pelanggan dengan alasan penolakan' },
      { key: 'dinein.update_order_status', label: 'Progres Pesanan', desc: 'Memperbarui status pesanan (Diproses / Siap Saji / Selesai)' },
      { key: 'dinein.view_session', label: 'Lihat Detail Sesi', desc: 'Melihat rincian pesanan dan total tagihan sesi' },
      { key: 'dinein.manage_payment', label: 'Proses Pembayaran Sesi', desc: 'Menerima pembayaran kasir / QRIS online' },
    ],
  },
  {
    group: 'Katalog Barang & Stok',
    permissions: [
      { key: 'barang.view', label: 'Lihat Katalog', desc: 'Melihat daftar produk dan stok' },
      { key: 'barang.create', label: 'Tambah Barang', desc: 'Membuat produk baru di master data' },
      { key: 'barang.update', label: 'Edit Barang & Harga', desc: 'Mengubah harga modal, harga jual, dan stok' },
      { key: 'barang.delete', label: 'Hapus Barang', desc: 'Menghapus barang dari sistem' },
    ],
  },
  {
    group: 'Kasir & Transaksi POS',
    permissions: [
      { key: 'transaksi.pos_access', label: 'Transaksi Penjualan', desc: 'Membuat pesanan baru dan menerima kasir' },
      { key: 'transaksi.discount', label: 'Memberikan Diskon', desc: 'Menerapkan potongan harga pada transaksi' },
      { key: 'transaksi.void', label: 'Batal / Void Transaksi', desc: 'Membatalkan transaksi yang sudah dibuat' },
      { key: 'transaksi.print_receipt', label: 'Cetak Struk', desc: 'Mencetak struk kasir' },
    ],
  },
  {
    group: 'Laporan & Keuangan',
    permissions: [
      { key: 'laporan.view', label: 'Lihat Laporan', desc: 'Membuka rekap harian, bulanan, dan laba' },
      { key: 'laporan.export', label: 'Ekspor / Cetak Laporan', desc: 'Mencetak atau mengunduh laporan PDF' },
    ],
  },
  {
    group: 'Pengguna & Akses Sistem',
    permissions: [
      { key: 'pengguna.view', label: 'Lihat Pengguna', desc: 'Melihat daftar staf dan status akun' },
      { key: 'pengguna.manage', label: 'Kelola Hak Akses', desc: 'Mengubah role dan izin pengguna' },
      { key: 'pengguna.approve', label: 'Setujui Pendaftaran', desc: 'Memverifikasi akun pendaftaran mandiri' },
    ],
  },
  {
    group: 'Pengaturan & Toko',
    permissions: [
      { key: 'pengaturan.view', label: 'Lihat Pengaturan', desc: 'Melihat konfigurasi toko' },
      { key: 'pengaturan.update', label: 'Ubah Pengaturan', desc: 'Menyimpan konfigurasi sistem dan profil toko' },
    ],
  },
];

// Default Permission Sets per Role
export const DEFAULT_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'], // Wildcard - akses seluruh fitur
  [ROLES.ADMIN]: [
    'page.dashboard',
    'page.barang',
    'page.transaksi',
    'page.meja',
    'page.laporan',
    'page.informasi_barang',
    'page.riwayat_aktivitas',
    'page.manajemen_pengguna',
    'pengguna.view',
    'pengguna.manage',
    'meja.view',
    'meja.qr_view',
    'meja.session_open',
    'meja.session_close',
    'meja.create',
    'meja.update',
    'meja.deactivate',
    'meja.qr_manage',
    'dinein.view_orders',
    'dinein.accept_order',
    'dinein.reject_order',
    'dinein.update_order_status',
    'dinein.view_session',
    'dinein.manage_payment',
    'barang.view',
    'barang.create',
    'barang.update',
    'transaksi.pos_access',
    'transaksi.discount',
    'transaksi.print_receipt',
    'laporan.view',
    'laporan.export',
    'pengaturan.view',
  ],
  [ROLES.KASIR]: [
    'page.dashboard',
    'page.transaksi',
    'page.meja',
    'meja.view',
    'meja.qr_view',
    'meja.session_open',
    'meja.session_close',
    'dinein.view_orders',
    'dinein.accept_order',
    'dinein.reject_order',
    'dinein.update_order_status',
    'dinein.view_session',
    'dinein.manage_payment',
    'transaksi.pos_access',
    'transaksi.print_receipt',
  ],
};

/**
 * Mendapatkan profil pengguna dari Firestore `app_users/{uid}`
 */
export async function fetchUserProfile(uid) {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'app_users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, uid: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn(`Gagal memuat profil pengguna (${uid}):`, err);
  }

  // Fallback cache lokal
  try {
    const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
    const found = localUsers.find((u) => u.uid === uid || u.id === uid);
    if (found) return found;
  } catch {}

  return null;
}

/**
 * Menyimpan profil pengguna ke Firestore `app_users/{uid}`
 */
export async function saveUserProfile(uid, data) {
  if (!uid) return false;
  try {
    const docRef = doc(db, 'app_users', uid);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`Gagal menyimpan profil pengguna (${uid}):`, err);
    return false;
  }
}

/**
 * Auto-bootstrap: Menjamin akun utama Super Admin, Admin, dan Kasir terkonfigurasi secara tepat
 */
export async function bootstrapSuperAdmin(firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const email = (firebaseUser.email || '').toLowerCase().trim();
  const isDefaultSuper = email === 'qurmacel@gmail.com';
  const isDefaultAdmin = email === 'admin@gmail.com';
  const isDefaultCashier = email === 'kasir@gmail.com';

  // Jika bukan 3 akun sistem awal, kembalikan profil dari database tanpa bootstrap paksa
  if (!isDefaultSuper && !isDefaultAdmin && !isDefaultCashier) {
    return await fetchUserProfile(firebaseUser.uid);
  }

  const existingProfile = await fetchUserProfile(firebaseUser.uid);

  // 1. Logika untuk SUPER ADMIN (qurmacel@gmail.com)
  if (isDefaultSuper) {
    const superProfile = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      email: 'qurmacel@gmail.com',
      username: 'qurmacel',
      displayName: existingProfile?.displayName || firebaseUser.displayName || 'qurmacel',
      photoURL: firebaseUser.photoURL || existingProfile?.photoURL || '',
      role: ROLES.SUPER_ADMIN,
      roleAlias: 'super_admin',
      status: USER_STATUS.APPROVED,
      statusAlias: 'active',
      permissions: ['*'],
      storeId: firebaseUser.uid,
      approvedAt: existingProfile?.approvedAt || new Date().toISOString(),
      approvedBy: 'SYSTEM_BOOTSTRAP',
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfile(firebaseUser.uid, superProfile);
    } catch (err) {
      console.warn('Gagal sinkron bootstrap Super Admin ke Firestore:', err);
    }

    return superProfile;
  }

  // 2. Logika untuk ADMIN AWAL (admin@gmail.com)
  if (isDefaultAdmin) {
    const adminPermissions = existingProfile?.permissions?.length
      ? existingProfile.permissions
      : DEFAULT_PERMISSIONS[ROLES.ADMIN];

    const adminProfile = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      email: 'admin@gmail.com',
      username: 'admin',
      displayName: existingProfile?.displayName || firebaseUser.displayName || 'admin',
      photoURL: firebaseUser.photoURL || existingProfile?.photoURL || '',
      role: ROLES.ADMIN,
      roleAlias: 'admin',
      status: existingProfile?.status || USER_STATUS.APPROVED,
      statusAlias: 'active',
      permissions: adminPermissions,
      approvedAt: existingProfile?.approvedAt || new Date().toISOString(),
      approvedBy: 'SYSTEM_BOOTSTRAP',
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfile(firebaseUser.uid, adminProfile);
    } catch (err) {
      console.warn('Gagal sinkron bootstrap Admin ke Firestore:', err);
    }

    return adminProfile;
  }

  // 3. Logika untuk KASIR AWAL (kasir@gmail.com)
  if (isDefaultCashier) {
    const cashierProfile = {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      email: 'kasir@gmail.com',
      username: 'kasir',
      displayName: existingProfile?.displayName || 'Kasir Toko',
      photoURL: firebaseUser.photoURL || existingProfile?.photoURL || '',
      role: ROLES.KASIR,
      roleAlias: 'kasir',
      status: existingProfile?.status || USER_STATUS.APPROVED,
      statusAlias: 'active',
      permissions: DEFAULT_PERMISSIONS[ROLES.KASIR],
      approvedAt: existingProfile?.approvedAt || new Date().toISOString(),
      approvedBy: 'SYSTEM_BOOTSTRAP',
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveUserProfile(firebaseUser.uid, cashierProfile);
    } catch (err) {
      console.warn('Gagal sinkron bootstrap Kasir ke Firestore:', err);
    }

    return cashierProfile;
  }

  return existingProfile;
}

/**
 * Mengambil seluruh daftar pengguna dari Firestore + Initial Accounts (5 Akun Terdaftar)
 * JANGAN PERNAH MENEBAK ROLE jika role belum ditentukan.
 */
export async function fetchAllUsers() {
  try {
    let firestoreUsers = [];
    try {
      const colRef = collection(db, 'app_users');
      const snap = await getDocs(colRef);
      firestoreUsers = snap.docs.map((d) => ({ id: d.id, uid: d.id, ...d.data() }));
    } catch (err) {
      console.warn('Gagal mengambil app_users dari Firestore (mungkin auth diperlukan):', err);
    }

    // Merge dengan local storage cache
    let localUsers = [];
    try {
      const raw = localStorage.getItem('qurmacel_all_users');
      if (raw) localUsers = JSON.parse(raw);
    } catch {}

    const usersMap = new Map();

    // 1. Masukkan 5 akun autentikasi awal sebagai baseline
    INITIAL_AUTH_ACCOUNTS.forEach((acc) => {
      usersMap.set(acc.email.toLowerCase(), {
        ...acc,
        permissions: acc.permissions || (acc.role && DEFAULT_PERMISSIONS[acc.role]) || [],
      });
    });

    // 2. Timpa dengan localUsers jika ada perubahan yang tersimpan
    localUsers.forEach((u) => {
      const email = (u.email || '').toLowerCase().trim();
      if (email) {
        const prev = usersMap.get(email) || {};
        usersMap.set(email, { ...prev, ...u });
      }
    });

    // 3. Timpa dengan data Firestore yang terpercaya
    firestoreUsers.forEach((u) => {
      const email = (u.email || '').toLowerCase().trim();
      if (email) {
        const prev = usersMap.get(email) || {};
        usersMap.set(email, { ...prev, ...u, uid: u.uid || u.id });
      }
    });

    const merged = Array.from(usersMap.values());

    // 4. Pastikan peran dan status dinormalisasi TANPA MENEBAK
    return merged.map((u) => {
      const email = (u.email || '').toLowerCase().trim();
      if (email === 'qurmacel@gmail.com') {
        return {
          ...u,
          uid: u.uid || 'user-superadmin-qurmacel',
          username: u.username || 'qurmacel',
          displayName: u.displayName || 'Qurmacel',
          role: ROLES.SUPER_ADMIN,
          roleAlias: 'super_admin',
          status: USER_STATUS.APPROVED,
          statusAlias: 'active',
          permissions: ['*'],
        };
      }

      // Jangan menebak role jika tidak ada di profile
      const rawRole = u.role;
      const explicitRole = rawRole ? normalizeRole(rawRole) : 'belum_ditentukan';
      const rawStatus = u.status;
      const explicitStatus = rawStatus ? String(rawStatus).toLowerCase().trim() : 'belum_ditentukan';

      return {
        ...u,
        role: explicitRole,
        status: explicitStatus,
      };
    });
  } catch (err) {
    console.warn('Gagal mengambil daftar pengguna:', err);
    return INITIAL_AUTH_ACCOUNTS;
  }
}

/**
 * Mengambil daftar pendaftaran mandiri yang berstatus pending
 */
export async function fetchRegistrationRequests() {
  try {
    const colRef = collection(db, 'registration_requests');
    const q = query(colRef, where('status', '==', USER_STATUS.PENDING));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Cross-check dengan app_users yang berstatus pending
    let pendingUsers = [];
    try {
      const usersCol = collection(db, 'app_users');
      const pendingUsersSnap = await getDocs(query(usersCol, where('status', '==', USER_STATUS.PENDING)));
      pendingUsers = pendingUsersSnap.docs.map((d) => ({
        id: `REQ-${d.id}`,
        uid: d.id,
        ...d.data(),
      }));
    } catch {}

    const mergedMap = new Map();
    list.forEach((item) => mergedMap.set(item.uid, item));
    pendingUsers.forEach((u) => {
      if (!mergedMap.has(u.uid)) {
        mergedMap.set(u.uid, {
          id: `REQ-${u.uid}`,
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || u.email?.split('@')[0] || 'Pengguna Baru',
          method: u.source?.includes('google') ? 'Google' : 'Email/Password',
          requestedAt: u.createdAt || new Date().toISOString(),
          status: USER_STATUS.PENDING,
        });
      }
    });

    // Merge dengan local storage cache
    try {
      const localReqs = JSON.parse(localStorage.getItem('qurmacel_registration_requests') || '[]');
      if (Array.isArray(localReqs)) {
        localReqs.forEach((lr) => {
          if (lr?.uid) {
            mergedMap.set(lr.uid, { ...(mergedMap.get(lr.uid) || {}), ...lr });
          }
        });
      }
    } catch {}

    const fullResult = Array.from(mergedMap.values()).filter((r) => r.status === USER_STATUS.PENDING);

    // Filter out akun resmi sistem agar tidak masuk antrean persetujuan
    const PRIMARY_EMAILS = ['qurmacel@gmail.com', 'admin@gmail.com', 'kasir@gmail.com'];
    const filteredRequests = fullResult.filter(
      (r) => !PRIMARY_EMAILS.includes((r.email || '').toLowerCase().trim())
    );

    filteredRequests.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));
    return filteredRequests;
  } catch (err) {
    console.warn('Gagal mengambil antrean pendaftaran:', err);
    try {
      const localReqs = JSON.parse(localStorage.getItem('qurmacel_registration_requests') || '[]');
      return Array.isArray(localReqs) ? localReqs.filter((r) => r.status === USER_STATUS.PENDING) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Super Admin atau Admin menyetujui pendaftaran mandiri
 */
export async function approveRegistrationRequest(
  requestId,
  uid,
  { role = ROLES.KASIR, permissions = null, approverRole = ROLES.SUPER_ADMIN, approverUid, approverName }
) {
  const normApproverRole = normalizeRole(approverRole);
  if (normApproverRole === ROLES.KASIR) {
    throw new Error('Kasir tidak memiliki wewenang untuk menyetujui akun.');
  }

  const assignedRole = normalizeRole(role);
  if (normApproverRole === ROLES.ADMIN && assignedRole === ROLES.SUPER_ADMIN) {
    throw new Error('Admin tidak memiliki wewenang untuk menetapkan peran Super Admin.');
  }

  const finalPermissions = permissions || (assignedRole === ROLES.SUPER_ADMIN ? ['*'] : DEFAULT_PERMISSIONS[assignedRole]) || [];
  const nowIso = new Date().toISOString();

  // 1. Coba verifikasi backend jika tersedia
  try {
    const res = await fetch('/api/admin/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        targetUid: uid,
        requestId,
        role: assignedRole,
        permissions: assignedRole === ROLES.SUPER_ADMIN ? ['*'] : finalPermissions,
        approverRole: normApproverRole,
        approverUid,
        approverName,
      }),
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Direct Firestore update
  try {
    await setDoc(doc(db, 'app_users', uid), {
      status: USER_STATUS.APPROVED,
      statusAlias: 'active',
      role: assignedRole,
      permissions: assignedRole === ROLES.SUPER_ADMIN ? ['*'] : finalPermissions,
      approvedAt: nowIso,
      approvedBy: approverUid,
      updatedAt: nowIso,
    }, { merge: true });
  } catch (err) {
    console.warn('Gagal update app_users di Firestore:', err);
  }

  if (requestId) {
    try {
      await setDoc(doc(db, 'registration_requests', requestId), {
        status: 'approved',
        resolvedAt: nowIso,
        resolvedBy: approverUid,
      }, { merge: true });
    } catch {}
  }

  // Update local storage cache
  try {
    const localReqs = JSON.parse(localStorage.getItem('qurmacel_registration_requests') || '[]');
    const updatedReqs = localReqs.map((r) =>
      r.id === requestId || r.uid === uid ? { ...r, status: 'approved', role: assignedRole, permissions: finalPermissions } : r
    );
    localStorage.setItem('qurmacel_registration_requests', JSON.stringify(updatedReqs));

    const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
    const updatedUsers = localUsers.map((u) =>
      u.uid === uid ? { ...u, status: USER_STATUS.APPROVED, role: assignedRole, permissions: finalPermissions } : u
    );
    localStorage.setItem('qurmacel_all_users', JSON.stringify(updatedUsers));
  } catch {}

  await logActivity({
    actorUid: approverUid,
    actorName: approverName,
    actorRole: normApproverRole,
    action: 'USER_APPROVED',
    module: 'USER_MANAGEMENT',
    targetId: uid,
    details: { assignedRole, permissionsCount: finalPermissions.length },
    status: 'SUCCESS',
  });

  await logAuditTrail({
    module: 'MANAJEMEN_PENGGUNA',
    action: 'USER_APPROVED',
    targetId: uid,
    field: 'status & role',
    before: { status: 'pending', role: null, permissions: [] },
    after: { status: 'approved', role: assignedRole, permissions: finalPermissions },
    actorUid: approverUid,
    actorName: approverName,
    actorRole: normApproverRole,
    details: { note: `Pendaftaran disetujui sebagai ${assignedRole}` },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Super Admin atau Admin menolak pendaftaran mandiri
 */
export async function rejectRegistrationRequest(
  requestId,
  uid,
  { reason = 'Tidak memenuhi syarat', approverRole = ROLES.SUPER_ADMIN, approverUid, approverName }
) {
  const normApproverRole = normalizeRole(approverRole);
  if (normApproverRole === ROLES.KASIR) {
    throw new Error('Kasir tidak memiliki wewenang untuk menolak akun.');
  }

  const nowIso = new Date().toISOString();

  // 1. Coba verifikasi backend jika tersedia
  try {
    const res = await fetch('/api/admin/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        targetUid: uid,
        requestId,
        reason,
        approverRole: normApproverRole,
        approverUid,
        approverName,
      }),
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Direct Firestore update
  if (uid) {
    try {
      await setDoc(doc(db, 'app_users', uid), {
        status: USER_STATUS.REJECTED,
        rejectionReason: reason,
        rejectedAt: nowIso,
        rejectedBy: approverUid,
        updatedAt: nowIso,
      }, { merge: true });
    } catch (err) {
      console.warn('Gagal update app_users rejection di Firestore:', err);
    }
  }

  if (requestId) {
    try {
      await setDoc(doc(db, 'registration_requests', requestId), {
        status: USER_STATUS.REJECTED,
        reason,
        resolvedAt: nowIso,
        resolvedBy: approverUid,
      }, { merge: true });
    } catch {}
  }

  // Update local storage cache
  try {
    const localReqs = JSON.parse(localStorage.getItem('qurmacel_registration_requests') || '[]');
    const updatedReqs = localReqs.map((r) =>
      r.id === requestId || r.uid === uid ? { ...r, status: USER_STATUS.REJECTED, rejectionReason: reason } : r
    );
    localStorage.setItem('qurmacel_registration_requests', JSON.stringify(updatedReqs));

    const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
    const updatedUsers = localUsers.map((u) =>
      u.uid === uid ? { ...u, status: USER_STATUS.REJECTED, rejectionReason: reason } : u
    );
    localStorage.setItem('qurmacel_all_users', JSON.stringify(updatedUsers));
  } catch {}

  await logActivity({
    actorUid: approverUid,
    actorName: approverName,
    actorRole: normApproverRole,
    action: 'USER_REJECTED',
    module: 'USER_MANAGEMENT',
    targetId: uid,
    details: { reason },
    status: 'SUCCESS',
  });

  await logAuditTrail({
    module: 'MANAJEMEN_PENGGUNA',
    action: 'USER_REJECTED',
    targetId: uid,
    field: 'status',
    before: { status: 'pending' },
    after: { status: 'rejected', reason },
    actorUid: approverUid,
    actorName: approverName,
    actorRole: normApproverRole,
    details: { reason },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Menangguhkan akun pengguna (SUSPEND)
 */
export async function suspendUser(
  targetUid,
  { reason = 'Akun ditangguhkan oleh Administrator', updaterRole = ROLES.SUPER_ADMIN, updaterUid, updaterName }
) {
  const normUpdaterRole = normalizeRole(updaterRole);
  if (normUpdaterRole === ROLES.KASIR) {
    throw new Error('Kasir tidak memiliki wewenang untuk menangguhkan akun pengguna.');
  }

  const allUsers = await fetchAllUsers();
  const targetUser = allUsers.find((u) => u.uid === targetUid || u.id === targetUid);
  const targetEmail = (targetUser?.email || '').toLowerCase().trim();

  // Admin tidak boleh menangguhkan akun Super Admin
  if (normUpdaterRole === ROLES.ADMIN) {
    if (targetUser?.role === ROLES.SUPER_ADMIN || targetEmail === 'qurmacel@gmail.com') {
      throw new Error('Admin tidak memiliki wewenang untuk menangguhkan akun Super Admin.');
    }
  }

  // Lindungi akun Super Admin utama dari penangguhan
  if (targetEmail === 'qurmacel@gmail.com') {
    throw new Error('Akun Super Admin Utama (qurmacel@gmail.com) dilindungi dan tidak dapat ditangguhkan.');
  }

  if (targetUser?.role === ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = allUsers.filter(
      (u) => u.role === ROLES.SUPER_ADMIN && isAccountApproved(u.status) && u.uid !== targetUid
    );
    if (activeSuperAdmins.length === 0) {
      throw new Error('Tidak dapat menangguhkan Super Admin terakhir dalam sistem.');
    }
  }

  const nowIso = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'app_users', targetUid), {
      status: USER_STATUS.SUSPENDED,
      suspensionReason: reason,
      suspendedAt: nowIso,
      suspendedBy: updaterUid,
      updatedAt: nowIso,
    });
  } catch (err) {
    console.warn('Gagal updateDoc app_users di Firestore:', err);
  }

  // Update local storage cache
  try {
    const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
    const updatedUsers = localUsers.map((u) =>
      u.uid === targetUid || u.id === targetUid ? { ...u, status: USER_STATUS.SUSPENDED, suspensionReason: reason } : u
    );
    localStorage.setItem('qurmacel_all_users', JSON.stringify(updatedUsers));
  } catch {}

  await logActivity({
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: normUpdaterRole,
    action: 'USER_SUSPENDED',
    module: 'USER_MANAGEMENT',
    targetId: targetUid,
    details: { reason },
    status: 'SUCCESS',
  });

  await logAuditTrail({
    module: 'MANAJEMEN_PENGGUNA',
    action: 'USER_SUSPENDED',
    targetId: targetUid,
    field: 'status',
    before: { status: targetUser?.status || 'approved' },
    after: { status: 'suspended', reason },
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: normUpdaterRole,
    details: { reason },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Mengaktifkan kembali akun yang ditangguhkan atau ditolak
 */
export async function reactivateUser(
  targetUid,
  { role, permissions, updaterRole = ROLES.SUPER_ADMIN, updaterUid, updaterName }
) {
  const normUpdaterRole = normalizeRole(updaterRole);
  if (normUpdaterRole === ROLES.KASIR) {
    throw new Error('Kasir tidak memiliki wewenang untuk mengaktifkan akun pengguna.');
  }

  const targetRole = normalizeRole(role);
  if (normUpdaterRole === ROLES.ADMIN && targetRole === ROLES.SUPER_ADMIN) {
    throw new Error('Admin tidak memiliki wewenang untuk menetapkan peran Super Admin.');
  }

  const nowIso = new Date().toISOString();
  const assignedPermissions =
    permissions || (targetRole === ROLES.SUPER_ADMIN ? ['*'] : DEFAULT_PERMISSIONS[targetRole]) || [];

  try {
    await updateDoc(doc(db, 'app_users', targetUid), {
      status: USER_STATUS.APPROVED,
      statusAlias: 'active',
      role: targetRole,
      permissions: targetRole === ROLES.SUPER_ADMIN ? ['*'] : assignedPermissions,
      rejectionReason: null,
      suspensionReason: null,
      reactivatedAt: nowIso,
      reactivatedBy: updaterUid,
      updatedAt: nowIso,
    });
  } catch (err) {
    console.warn('Gagal reactivateUser di Firestore:', err);
  }

  // Update local storage cache
  try {
    const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
    const updatedUsers = localUsers.map((u) =>
      u.uid === targetUid || u.id === targetUid
        ? {
            ...u,
            status: USER_STATUS.APPROVED,
            role: targetRole,
            permissions: assignedPermissions,
            rejectionReason: null,
            suspensionReason: null,
          }
        : u
    );
    localStorage.setItem('qurmacel_all_users', JSON.stringify(updatedUsers));
  } catch {}

  await logActivity({
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: normUpdaterRole,
    action: 'USER_REACTIVATED',
    module: 'USER_MANAGEMENT',
    targetId: targetUid,
    details: { role: targetRole, permissionsCount: assignedPermissions.length },
    status: 'SUCCESS',
  });

  await logAuditTrail({
    module: 'MANAJEMEN_PENGGUNA',
    action: 'USER_REACTIVATED',
    targetId: targetUid,
    field: 'status',
    before: { status: 'suspended' },
    after: { status: 'approved', role: targetRole, permissions: assignedPermissions },
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: normUpdaterRole,
    details: { note: 'Akun diaktifkan kembali' },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Memperbarui role dan granular permission pengguna
 */
export async function updateUserRoleAndPermissions(
  targetUid,
  { role, permissions, updaterRole = ROLES.SUPER_ADMIN, updaterUid, updaterName }
) {
  const normUpdaterRole = normalizeRole(updaterRole);
  if (normUpdaterRole === ROLES.KASIR) {
    throw new Error('Kasir tidak memiliki wewenang untuk mengubah hak akses pengguna.');
  }

  const allUsers = await fetchAllUsers();
  const targetUser = allUsers.find((u) => u.uid === targetUid || u.id === targetUid);
  const targetEmail = (targetUser?.email || '').toLowerCase().trim();
  const newRole = normalizeRole(role);

  // Admin tidak boleh mengubah akun Super Admin atau memberikan role Super Admin
  if (normUpdaterRole === ROLES.ADMIN) {
    if (targetUser?.role === ROLES.SUPER_ADMIN || targetEmail === 'qurmacel@gmail.com') {
      throw new Error('Admin tidak memiliki wewenang untuk mengubah akun Super Admin.');
    }
    if (newRole === ROLES.SUPER_ADMIN) {
      throw new Error('Admin tidak memiliki wewenang untuk memberikan peran Super Admin.');
    }
  }

  // Lindungi akun Super Admin utama agar tidak dapat diturunkan perannya
  if (targetEmail === 'qurmacel@gmail.com' && newRole !== ROLES.SUPER_ADMIN) {
    throw new Error('Peran Super Admin Utama (qurmacel@gmail.com) dilindungi dan tidak dapat diubah.');
  }

  // Cegah mengubah jika pengguna adalah Super Admin terakhir
  if (newRole !== ROLES.SUPER_ADMIN && targetUser?.role === ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = allUsers.filter(
      (u) => u.role === ROLES.SUPER_ADMIN && isAccountApproved(u.status) && u.uid !== targetUid
    );
    if (activeSuperAdmins.length === 0) {
      throw new Error('Tidak dapat mengubah peran ini: Sistem harus memiliki minimal satu Super Admin aktif.');
    }
  }

  const finalPermissions = newRole === ROLES.SUPER_ADMIN ? ['*'] : (permissions || DEFAULT_PERMISSIONS[newRole] || []);
  const nowIso = new Date().toISOString();

  try {
    await updateDoc(doc(db, 'app_users', targetUid), {
      role: newRole,
      permissions: finalPermissions,
      updatedAt: nowIso,
      updatedBy: updaterUid,
    });
  } catch (err) {
    console.warn('Gagal updateUserRoleAndPermissions di Firestore:', err);
  }

  // Update local storage cache
  try {
    const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
    const updatedUsers = localUsers.map((u) =>
      u.uid === targetUid || u.id === targetUid
        ? {
            ...u,
            role: newRole,
            permissions: finalPermissions,
            updatedAt: nowIso,
          }
        : u
    );
    localStorage.setItem('qurmacel_all_users', JSON.stringify(updatedUsers));
  } catch {}

  await logActivity({
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: normUpdaterRole,
    action: 'PERMISSION_UPDATED',
    module: 'USER_MANAGEMENT',
    targetId: targetUid,
    details: { newRole, permissionsCount: finalPermissions.length },
    status: 'SUCCESS',
  });

  await logAuditTrail({
    module: 'MANAJEMEN_PENGGUNA',
    action: 'USER_ROLE_PERMISSIONS_CHANGED',
    targetId: targetUid,
    field: 'role & permissions',
    before: { role: targetUser?.role, permissions: targetUser?.permissions },
    after: { role: newRole, permissions: finalPermissions },
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: normUpdaterRole,
    details: { note: `Peran dan granular permission diperbarui ke ${newRole}` },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Super Admin atau Admin membuat akun pengguna baru secara terisolasi tanpa me-logout sesi aktif
 */
export async function createUserIsolated({
  email,
  password,
  displayName,
  role = ROLES.KASIR,
  permissions = null,
  status = USER_STATUS.APPROVED,
  creatorRole = ROLES.SUPER_ADMIN,
  creatorUid = 'SUPER_ADMIN',
  creatorName = 'Super Admin',
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Email wajib diisi.');
  if (!password || password.length < 6) throw new Error('Password minimal 6 karakter.');

  // Validasi batas kewenangan
  const normCreatorRole = normalizeRole(creatorRole);
  const targetRole = normalizeRole(role);

  if (normCreatorRole === ROLES.KASIR) {
    throw new Error('Kasir tidak memiliki wewenang untuk membuat akun pengguna.');
  }

  if (normCreatorRole === ROLES.ADMIN && targetRole === ROLES.SUPER_ADMIN) {
    throw new Error('Admin tidak memiliki wewenang untuk membuat akun Super Admin.');
  }

  // Cegah akun ganda jika email sudah terdaftar
  const allUsers = await fetchAllUsers();
  const existingUser = allUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
  if (existingUser) {
    throw new Error(`Email ${cleanEmail} sudah terdaftar di sistem.`);
  }

  const firebaseConfig = {
    apiKey: 'AIzaSyDaXbPvELwyWgULzBVvHIRcOiqajyBqdGI',
    authDomain: 'warung-qurma.firebaseapp.com',
    projectId: 'warung-qurma',
    storageBucket: 'warung-qurma.firebasestorage.app',
    messagingSenderId: '512400134942',
    appId: '1:512400134942:web:1ac6ea07a013e2bcf26f0f',
  };

  const secondaryAppName = `SecondaryAuth_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    const newUid = cred.user.uid;

    const finalStatus = status === USER_STATUS.PENDING ? USER_STATUS.PENDING : USER_STATUS.APPROVED;
    const isAppr = finalStatus === USER_STATUS.APPROVED;
    const assignedPermissions =
      permissions || (targetRole === ROLES.SUPER_ADMIN ? ['*'] : DEFAULT_PERMISSIONS[targetRole]) || [];
    const nowIso = new Date().toISOString();

    const newProfile = {
      uid: newUid,
      id: newUid,
      email: cleanEmail,
      displayName: (displayName || '').trim() || cleanEmail.split('@')[0],
      role: targetRole,
      roleAlias: targetRole.toLowerCase(),
      status: finalStatus,
      statusAlias: isAppr ? 'active' : 'pending',
      permissions: targetRole === ROLES.SUPER_ADMIN ? ['*'] : assignedPermissions,
      createdAt: nowIso,
      createdBy: creatorUid,
      creatorRole: normCreatorRole,
      approvedAt: isAppr ? nowIso : null,
      approvedBy: isAppr ? creatorUid : null,
    };

    // Simpan ke Firestore app_users/{uid} dengan UID yang persis sama
    try {
      await setDoc(doc(db, 'app_users', newUid), newProfile);
    } catch (dbErr) {
      console.warn('Gagal menyimpan app_users di Firestore (tersimpan di cache):', dbErr);
    }

    if (!isAppr) {
      try {
        await setDoc(doc(db, 'registration_requests', `REQ-${newUid}`), {
          id: `REQ-${newUid}`,
          uid: newUid,
          email: cleanEmail,
          displayName: newProfile.displayName,
          method: 'Admin Provisioning',
          requestedAt: nowIso,
          status: USER_STATUS.PENDING,
        });
      } catch {}
    }

    // Logout secondary auth secara terisolasi tanpa memengaruhi auth utama
    await secondarySignOut(secondaryAuth);

    // Update local storage cache
    try {
      const localUsers = JSON.parse(localStorage.getItem('qurmacel_all_users') || '[]');
      const filtered = localUsers.filter((u) => (u.email || '').toLowerCase().trim() !== cleanEmail);
      filtered.push(newProfile);
      localStorage.setItem('qurmacel_all_users', JSON.stringify(filtered));
    } catch {}

    // Catat ke riwayat aktivitas
    await logActivity({
      actorUid: creatorUid,
      actorName: creatorName,
      actorRole: normCreatorRole,
      action: 'USER_CREATED',
      module: 'USER_MANAGEMENT',
      targetId: newUid,
      details: { email: cleanEmail, role: targetRole, status: finalStatus, displayName: newProfile.displayName },
      status: 'SUCCESS',
    });

    await logAuditTrail({
      module: 'MANAJEMEN_PENGGUNA',
      action: 'USER_CREATED',
      targetId: newUid,
      field: 'user_account',
      before: null,
      after: { email: cleanEmail, role: targetRole, status: finalStatus },
      actorUid: creatorUid,
      actorName: creatorName,
      actorRole: normCreatorRole,
      details: { note: `Akun baru ${cleanEmail} dibuat oleh ${creatorName} (${normCreatorRole})` },
      status: 'SUCCESS',
    });

    return newProfile;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error(`Email ${cleanEmail} sudah terdaftar di Firebase Authentication.`);
    }
    throw err;
  }
}
