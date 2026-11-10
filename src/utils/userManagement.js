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
import { logActivity } from './activityLogger.js';

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
};

// Akun Utama Resmi Berdasarkan Keputusan Sistem
export const DEFAULT_SUPER_ADMIN_EMAILS = ['qurmacel@gmail.com'];
export const DEFAULT_ADMIN_EMAILS = ['admin@gmail.com'];
export const DEFAULT_CASHIER_EMAILS = ['kasir@gmail.com', 'kasir@qurmacel.com'];

// Helper Status & Role Checking
export function isAccountApproved(status) {
  if (!status) return false;
  const s = String(status).toLowerCase().trim();
  return s === 'approved' || s === 'active';
}

export function isAccountPending(status) {
  if (!status) return true;
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

export function normalizeRole(role) {
  if (!role) return ROLES.KASIR;
  const r = String(role).toUpperCase().trim();
  if (r === 'SUPER_ADMIN' || r === 'SUPERADMIN' || r === 'OWNER') return ROLES.SUPER_ADMIN;
  if (r === 'ADMIN') return ROLES.ADMIN;
  return ROLES.KASIR;
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
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn(`Gagal memuat profil pengguna (${uid}):`, err);
  }
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
 * Auto-bootstrap: Menjamin akun utama Super Admin dan Admin terkonfigurasi secara tepat dan langsung aktif
 */
export async function bootstrapSuperAdmin(firebaseUser) {
  if (!firebaseUser?.uid) return null;

  const email = (firebaseUser.email || '').toLowerCase().trim();
  const isDefaultSuper = email === 'qurmacel@gmail.com';
  const isDefaultAdmin = email === 'admin@gmail.com';
  const isDefaultCashier = DEFAULT_CASHIER_EMAILS.includes(email);

  // Jika bukan akun utama, kembalikan profil dari database tanpa bootstrap khusus
  if (!isDefaultSuper && !isDefaultAdmin && !isDefaultCashier) {
    return await fetchUserProfile(firebaseUser.uid);
  }

  const existingProfile = await fetchUserProfile(firebaseUser.uid);

  // 1. Logika untuk SUPER ADMIN (qurmacel@gmail.com)
  if (isDefaultSuper) {
    const superProfile = {
      uid: firebaseUser.uid,
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

    // Simpan ke Firestore secara asynchronous
    saveUserProfile(firebaseUser.uid, superProfile).catch((err) => {
      console.warn('Gagal sinkron bootstrap Super Admin ke Firestore:', err);
    });

    return superProfile;
  }

  // 2. Logika untuk ADMIN AWAL (admin@gmail.com)
  if (isDefaultAdmin) {
    const adminPermissions = existingProfile?.permissions?.length
      ? existingProfile.permissions
      : DEFAULT_PERMISSIONS[ROLES.ADMIN];

    const adminProfile = {
      uid: firebaseUser.uid,
      email: 'admin@gmail.com',
      username: 'admin',
      displayName: existingProfile?.displayName || firebaseUser.displayName || 'admin',
      photoURL: firebaseUser.photoURL || existingProfile?.photoURL || '',
      role: ROLES.ADMIN,
      roleAlias: 'admin',
      status: USER_STATUS.APPROVED,
      statusAlias: 'active',
      permissions: adminPermissions,
      approvedAt: existingProfile?.approvedAt || new Date().toISOString(),
      approvedBy: 'SYSTEM_BOOTSTRAP',
      updatedAt: new Date().toISOString(),
    };

    // Simpan ke Firestore secara asynchronous
    saveUserProfile(firebaseUser.uid, adminProfile).catch((err) => {
      console.warn('Gagal sinkron bootstrap Admin ke Firestore:', err);
    });

    return adminProfile;
  }

  // 3. Logika untuk KASIR UTAMA
  if (isDefaultCashier) {
    const cashierProfile = {
      uid: firebaseUser.uid,
      email,
      username: 'kasir',
      displayName: existingProfile?.displayName || 'Kasir Toko',
      photoURL: firebaseUser.photoURL || existingProfile?.photoURL || '',
      role: ROLES.KASIR,
      roleAlias: 'kasir',
      status: USER_STATUS.APPROVED,
      statusAlias: 'active',
      permissions: DEFAULT_PERMISSIONS[ROLES.KASIR],
      approvedAt: existingProfile?.approvedAt || new Date().toISOString(),
      approvedBy: 'SYSTEM_BOOTSTRAP',
      updatedAt: new Date().toISOString(),
    };

    saveUserProfile(firebaseUser.uid, cashierProfile).catch((err) => {
      console.warn('Gagal sinkron bootstrap Kasir ke Firestore:', err);
    });

    return cashierProfile;
  }

  return existingProfile;
}

/**
 * Mengambil seluruh daftar pengguna dari Firestore
 */
export async function fetchAllUsers() {
  try {
    const colRef = collection(db, 'app_users');
    const snap = await getDocs(colRef);
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Pastikan akun utama selalu muncul dengan peran dan status yang benar
    return users.map((u) => {
      const email = (u.email || '').toLowerCase().trim();
      if (email === 'qurmacel@gmail.com') {
        return {
          ...u,
          username: u.username || 'qurmacel',
          role: ROLES.SUPER_ADMIN,
          roleAlias: 'super_admin',
          status: USER_STATUS.APPROVED,
          permissions: ['*'],
        };
      }
      if (email === 'admin@gmail.com') {
        return {
          ...u,
          username: u.username || 'admin',
          role: ROLES.ADMIN,
          roleAlias: 'admin',
          status: USER_STATUS.APPROVED,
          permissions: u.permissions?.length ? u.permissions : DEFAULT_PERMISSIONS[ROLES.ADMIN],
        };
      }
      return u;
    });
  } catch (err) {
    console.warn('Gagal mengambil daftar pengguna:', err);
    return [];
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
    const usersCol = collection(db, 'app_users');
    const pendingUsersSnap = await getDocs(query(usersCol, where('status', '==', USER_STATUS.PENDING)));
    const pendingUsers = pendingUsersSnap.docs.map((d) => ({
      id: `REQ-${d.id}`,
      uid: d.id,
      ...d.data(),
    }));

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

    const result = Array.from(mergedMap.values());

    // PENTING: Filter out akun utama resmi agar tidak pernah muncul di antrean persetujuan
    const PRIMARY_EMAILS = ['qurmacel@gmail.com', 'admin@gmail.com', ...DEFAULT_CASHIER_EMAILS];
    const filteredRequests = result.filter(
      (r) => !PRIMARY_EMAILS.includes((r.email || '').toLowerCase().trim())
    );

    filteredRequests.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));
    return filteredRequests;
  } catch (err) {
    console.warn('Gagal mengambil antrean pendaftaran:', err);
    return [];
  }
}

/**
 * Super Admin menyetujui pendaftaran mandiri
 */
export async function approveRegistrationRequest(
  requestId,
  uid,
  { role = ROLES.KASIR, permissions = null, approverUid, approverName }
) {
  const finalPermissions = permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS[ROLES.KASIR];
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
        role,
        permissions: role === ROLES.SUPER_ADMIN ? ['*'] : finalPermissions,
        approverUid,
        approverName,
      }),
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Direct Firestore update (Standard Client Flow)
  await updateDoc(doc(db, 'app_users', uid), {
    status: USER_STATUS.APPROVED,
    statusAlias: 'active',
    role,
    permissions: role === ROLES.SUPER_ADMIN ? ['*'] : finalPermissions,
    approvedAt: nowIso,
    approvedBy: approverUid,
    updatedAt: nowIso,
  });

  if (requestId) {
    try {
      await updateDoc(doc(db, 'registration_requests', requestId), {
        status: 'approved',
        resolvedAt: nowIso,
        resolvedBy: approverUid,
      });
    } catch {}
  }

  await logActivity({
    actorUid: approverUid,
    actorName: approverName,
    actorRole: ROLES.SUPER_ADMIN,
    action: 'USER_APPROVED',
    module: 'USER_MANAGEMENT',
    targetId: uid,
    details: { assignedRole: role, permissionsCount: (role === ROLES.SUPER_ADMIN ? ['*'] : finalPermissions).length },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Super Admin menolak pendaftaran mandiri
 */
export async function rejectRegistrationRequest(
  requestId,
  uid,
  { reason = 'Tidak memenuhi syarat', approverUid, approverName }
) {
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
        approverUid,
        approverName,
      }),
    });
    if (res.ok) {
      return true;
    }
  } catch {}

  // 2. Direct Firestore update (Standard Client Flow)
  if (uid) {
    await updateDoc(doc(db, 'app_users', uid), {
      status: USER_STATUS.REJECTED,
      rejectionReason: reason,
      rejectedAt: nowIso,
      rejectedBy: approverUid,
      updatedAt: nowIso,
    });
  }

  if (requestId) {
    try {
      await updateDoc(doc(db, 'registration_requests', requestId), {
        status: USER_STATUS.REJECTED,
        reason,
        resolvedAt: nowIso,
        resolvedBy: approverUid,
      });
    } catch {}
  }

  await logActivity({
    actorUid: approverUid,
    actorName: approverName,
    actorRole: ROLES.SUPER_ADMIN,
    action: 'USER_REJECTED',
    module: 'USER_MANAGEMENT',
    targetId: uid,
    details: { reason },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Menangguhkan akun pengguna (SUSPEND)
 */
export async function suspendUser(targetUid, { reason = 'Akun ditangguhkan oleh Super Admin', updaterUid, updaterName }) {
  const allUsers = await fetchAllUsers();
  const targetUser = allUsers.find((u) => u.uid === targetUid);

  // Lindungi akun Super Admin utama dari penangguhan
  const targetEmail = (targetUser?.email || '').toLowerCase().trim();
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
  await updateDoc(doc(db, 'app_users', targetUid), {
    status: USER_STATUS.SUSPENDED,
    suspensionReason: reason,
    suspendedAt: nowIso,
    suspendedBy: updaterUid,
    updatedAt: nowIso,
  });

  await logActivity({
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: ROLES.SUPER_ADMIN,
    action: 'USER_SUSPENDED',
    module: 'USER_MANAGEMENT',
    targetId: targetUid,
    details: { reason },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Mengaktifkan kembali akun yang ditangguhkan atau ditolak
 */
export async function reactivateUser(targetUid, { role, permissions, updaterUid, updaterName }) {
  const nowIso = new Date().toISOString();
  const assignedPermissions = permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS[ROLES.KASIR];

  await updateDoc(doc(db, 'app_users', targetUid), {
    status: USER_STATUS.APPROVED,
    statusAlias: 'active',
    role,
    permissions: role === ROLES.SUPER_ADMIN ? ['*'] : assignedPermissions,
    rejectionReason: null,
    suspensionReason: null,
    reactivatedAt: nowIso,
    reactivatedBy: updaterUid,
    updatedAt: nowIso,
  });

  await logActivity({
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: ROLES.SUPER_ADMIN,
    action: 'USER_REACTIVATED',
    module: 'USER_MANAGEMENT',
    targetId: targetUid,
    details: { role, permissionsCount: assignedPermissions.length },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Memperbarui role dan granular permission pengguna
 */
export async function updateUserRoleAndPermissions(targetUid, { role, permissions, updaterUid, updaterName }) {
  const allUsers = await fetchAllUsers();
  const targetUser = allUsers.find((u) => u.uid === targetUid);
  const targetEmail = (targetUser?.email || '').toLowerCase().trim();

  // Lindungi akun Super Admin utama agar tidak dapat diturunkan perannya
  if (targetEmail === 'qurmacel@gmail.com' && role !== ROLES.SUPER_ADMIN) {
    throw new Error('Peran Super Admin Utama (qurmacel@gmail.com) dilindungi dan tidak dapat diubah.');
  }

  // Cegah mengubah jika pengguna adalah Super Admin terakhir
  if (role !== ROLES.SUPER_ADMIN && targetUser?.role === ROLES.SUPER_ADMIN) {
    const activeSuperAdmins = allUsers.filter(
      (u) => u.role === ROLES.SUPER_ADMIN && isAccountApproved(u.status) && u.uid !== targetUid
    );
    if (activeSuperAdmins.length === 0) {
      throw new Error('Tidak dapat mengubah peran ini: Sistem harus memiliki minimal satu Super Admin aktif.');
    }
  }

  const nowIso = new Date().toISOString();
  await updateDoc(doc(db, 'app_users', targetUid), {
    role,
    permissions: role === ROLES.SUPER_ADMIN ? ['*'] : permissions,
    updatedAt: nowIso,
    updatedBy: updaterUid,
  });

  await logActivity({
    actorUid: updaterUid,
    actorName: updaterName,
    actorRole: ROLES.SUPER_ADMIN,
    action: 'PERMISSION_UPDATED',
    module: 'USER_MANAGEMENT',
    targetId: targetUid,
    details: { newRole: role, permissionsCount: permissions.length },
    status: 'SUCCESS',
  });

  return true;
}

/**
 * Super Admin membuat akun pengguna baru secara terisolasi tanpa me-logout sesi aktif
 */
export async function createUserIsolated({
  email,
  password,
  displayName,
  role = ROLES.KASIR,
  permissions = null,
  creatorUid,
  creatorName,
}) {
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
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const newUid = cred.user.uid;

    const assignedPermissions = permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS[ROLES.KASIR];
    const nowIso = new Date().toISOString();

    const newProfile = {
      uid: newUid,
      email: email.trim(),
      displayName: displayName.trim() || email.split('@')[0],
      role,
      status: USER_STATUS.APPROVED,
      statusAlias: 'active',
      permissions: role === ROLES.SUPER_ADMIN ? ['*'] : assignedPermissions,
      createdAt: nowIso,
      createdBy: creatorUid,
      approvedAt: nowIso,
      approvedBy: creatorUid,
    };

    // Simpan ke Firestore
    await setDoc(doc(db, 'app_users', newUid), newProfile);

    // Logout secondary app agar tidak ada session zombie
    await secondarySignOut(secondaryAuth);

    // Log ke activity history
    await logActivity({
      actorUid: creatorUid,
      actorName: creatorName,
      actorRole: ROLES.SUPER_ADMIN,
      action: 'USER_CREATED',
      module: 'USER_MANAGEMENT',
      targetId: newUid,
      details: { email: email.trim(), role, displayName: newProfile.displayName },
      status: 'SUCCESS',
    });

    return newProfile;
  } finally {
    try {
      // Secondary auth cleanup
    } catch {}
  }
}
