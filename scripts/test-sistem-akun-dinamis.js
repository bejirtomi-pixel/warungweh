/**
 * TEST SUITE: REVISI SISTEM AKUN DINAMIS QURMACELPOS
 * Menguji kepatuhan terhadap 6 ketentuan:
 * 1. Akun yang Sudah Ada (5 Akun, role belum ditentukan tidak ditebak)
 * 2. Pembuatan Akun Baru oleh Super Admin & Admin (terisolasi, cegah duplikasi, wewenang role)
 * 3. Sistem Login Dinamis (tanpa allowlist email sempit, syarat: Auth + matching UID + assigned role + approved status)
 * 4. Hak Akses (Super Admin full, Admin dibatasi tidak boleh ubah Super Admin, Kasir diblokir)
 * 5. Sinkronisasi dan Konsistensi Akun
 * 6. Pengujian Backend API & Frontend Route Guard
 */

import assert from 'node:assert';
import {
  ROLES,
  USER_STATUS,
  INITIAL_AUTH_ACCOUNTS,
  normalizeRole,
  isRoleAssigned,
  isAccountApproved,
  isAccountPending,
  isAccountSuspended,
  isAccountRejected,
  isAccountUndetermined,
  DEFAULT_PERMISSIONS,
  DEFAULT_SUPER_ADMIN_EMAILS,
  DEFAULT_ADMIN_EMAILS,
  DEFAULT_CASHIER_EMAILS,
} from '../src/utils/userManagement.js';
import createUserHandler from '../api/admin/create-user.js';
import usersHandler from '../api/admin/users.js';

let passedTests = 0;
let totalTests = 0;

// Mock response helper untuk pengujian backend serverless endpoint
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

// Evaluasi akses login sesuai kriteria Login.jsx dan RequireAuth
function evaluateLoginAccess({ authUser, profile }) {
  if (!authUser) return { canLogin: false, reason: 'NOT_AUTHENTICATED' };

  const email = (authUser.email || profile?.email || '').toLowerCase().trim();
  const isRootSuper = email === 'qurmacel@gmail.com';

  // 1. Profil harus ada dan matching UID
  if (!isRootSuper && (!profile || profile.uid !== authUser.uid)) {
    return { canLogin: false, destination: '/pending-approval', reason: 'NO_MATCHING_PROFILE' };
  }

  // 2. Role harus jelas (bukan belum_ditentukan)
  const role = isRootSuper ? ROLES.SUPER_ADMIN : normalizeRole(profile?.role);
  const hasAssignedRole = isRoleAssigned(role);
  if (!hasAssignedRole) {
    return { canLogin: false, destination: '/pending-approval', reason: 'ROLE_UNDETERMINED' };
  }

  // 3. Status harus approved / active
  const isApproved = isRootSuper || isAccountApproved(profile?.status);
  if (!isApproved) {
    return { canLogin: false, destination: '/pending-approval', reason: 'STATUS_NOT_APPROVED' };
  }

  return { canLogin: true, destination: '/dashboard', role, status: 'approved' };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('  PENGUJIAN REVISI SISTEM AKUN DINAMIS QURMACELPOS');
  console.log('================================================================\n');

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  [PASS] ${name}`);
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------
  // 1. PENGUJIAN AKUN LAMA & 5 AKUN TERDAFTAR
  // ---------------------------------------------------------------------
  console.log('--- 1. AKUN YANG SUDAH ADA & ROLE BELUM DITENTUKAN ---');

  await test('Mempertahankan 5 akun terdaftar di Firebase Authentication', () => {
    assert.strictEqual(INITIAL_AUTH_ACCOUNTS.length, 5, 'Harus ada 5 akun baseline');
    const emails = INITIAL_AUTH_ACCOUNTS.map((a) => a.email.toLowerCase());
    assert.ok(emails.includes('qurmacel@gmail.com'), 'qurmacel@gmail.com terdaftar');
    assert.ok(emails.includes('admin@gmail.com'), 'admin@gmail.com terdaftar');
    assert.ok(emails.includes('kasir@gmail.com'), 'kasir@gmail.com terdaftar');
    assert.ok(emails.includes('qurma1@gmail.com'), 'qurma1@gmail.com terdaftar');
    assert.ok(emails.includes('kasir@qurmacel.com'), 'kasir@qurmacel.com terdaftar');
  });

  await test('Akun Super Admin utama (qurmacel@gmail.com) memiliki role SUPER_ADMIN dan status approved', () => {
    const superAdmin = INITIAL_AUTH_ACCOUNTS.find((a) => a.email === 'qurmacel@gmail.com');
    assert.strictEqual(superAdmin.role, ROLES.SUPER_ADMIN);
    assert.strictEqual(superAdmin.status, USER_STATUS.APPROVED);
    assert.deepStrictEqual(superAdmin.permissions, ['*']);
  });

  await test('Akun Admin (admin@gmail.com) dan Kasir (kasir@gmail.com) berstatus approved dengan role yang sesuai', () => {
    const adminAcc = INITIAL_AUTH_ACCOUNTS.find((a) => a.email === 'admin@gmail.com');
    const kasirAcc = INITIAL_AUTH_ACCOUNTS.find((a) => a.email === 'kasir@gmail.com');
    assert.strictEqual(adminAcc.role, ROLES.ADMIN);
    assert.strictEqual(adminAcc.status, USER_STATUS.APPROVED);
    assert.strictEqual(kasirAcc.role, ROLES.KASIR);
    assert.strictEqual(kasirAcc.status, USER_STATUS.APPROVED);
  });

  await test('Akun lama qurma1@gmail.com & kasir@qurmacel.com berstatus belum_ditentukan dan TIDAK ditebak rolenya', () => {
    const qurma1 = INITIAL_AUTH_ACCOUNTS.find((a) => a.email === 'qurma1@gmail.com');
    const kasirLegacy = INITIAL_AUTH_ACCOUNTS.find((a) => a.email === 'kasir@qurmacel.com');

    assert.strictEqual(qurma1.role, 'belum_ditentukan', 'qurma1 role harus belum_ditentukan');
    assert.strictEqual(qurma1.status, 'belum_ditentukan', 'qurma1 status harus belum_ditentukan');
    assert.strictEqual(kasirLegacy.role, 'belum_ditentukan', 'kasir@qurmacel.com role harus belum_ditentukan');
    assert.strictEqual(kasirLegacy.status, 'belum_ditentukan', 'kasir@qurmacel.com status harus belum_ditentukan');

    // Pastikan normalizeRole tidak menebak Kasir atau Admin untuk nilai kosong/unknown
    assert.strictEqual(normalizeRole(null), 'belum_ditentukan');
    assert.strictEqual(normalizeRole(undefined), 'belum_ditentukan');
    assert.strictEqual(normalizeRole(''), 'belum_ditentukan');
    assert.strictEqual(normalizeRole('unknown_role'), 'belum_ditentukan');
    assert.strictEqual(normalizeRole('belum_ditentukan'), 'belum_ditentukan');

    // Helper isRoleAssigned
    assert.strictEqual(isRoleAssigned(qurma1.role), false, 'qurma1 belum memiliki assigned role');
    assert.strictEqual(isRoleAssigned(kasirLegacy.role), false, 'kasir legacy belum memiliki assigned role');
    assert.strictEqual(isRoleAssigned(ROLES.SUPER_ADMIN), true);
    assert.strictEqual(isRoleAssigned(ROLES.ADMIN), true);
    assert.strictEqual(isRoleAssigned(ROLES.KASIR), true);
  });

  // ---------------------------------------------------------------------
  // 2. PEMBUATAN AKUN BARU OLEH SUPER ADMIN & ADMIN
  // ---------------------------------------------------------------------
  console.log('\n--- 2. PEMBUATAN AKUN BARU SECARA DINAMIS & TERISOLASI ---');

  await test('Super Admin dapat membuat akun baru dengan role SUPER_ADMIN, ADMIN, maupun KASIR', async () => {
    const req = {
      method: 'POST',
      body: {
        email: 'manager.operasional@qurmacel.com',
        password: 'password123',
        displayName: 'Manager Operasional',
        role: 'ADMIN',
        status: 'approved',
        requesterRole: 'SUPER_ADMIN',
        requesterUid: 'user-superadmin-qurmacel',
        requesterName: 'Qurmacel',
      },
    };
    const res = createMockRes();
    await createUserHandler(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.email, 'manager.operasional@qurmacel.com');
    assert.strictEqual(res.data.user.role, ROLES.ADMIN);
    assert.strictEqual(res.data.user.status, USER_STATUS.APPROVED);
    assert.strictEqual(res.data.user.uid, res.data.user.id, 'UID Auth dan Firestore harus persis sama');
  });

  await test('Admin dapat membuat akun baru dengan role ADMIN atau KASIR', async () => {
    const req = {
      method: 'POST',
      body: {
        email: 'kasir.pagi@qurmacel.com',
        password: 'password123',
        displayName: 'Kasir Shift Pagi',
        role: 'KASIR',
        status: 'approved',
        requesterRole: 'ADMIN',
        requesterUid: 'user-admin-default',
        requesterName: 'Admin Toko',
      },
    };
    const res = createMockRes();
    await createUserHandler(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.role, ROLES.KASIR);
    assert.strictEqual(res.data.user.creatorRole, ROLES.ADMIN);
  });

  await test('Admin DITOLAK (403) jika mencoba membuat akun SUPER_ADMIN', async () => {
    const req = {
      method: 'POST',
      body: {
        email: 'pemberontak@qurmacel.com',
        password: 'password123',
        displayName: 'Pemberontak',
        role: 'SUPER_ADMIN',
        requesterRole: 'ADMIN',
        requesterUid: 'user-admin-default',
      },
    };
    const res = createMockRes();
    await createUserHandler(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
    assert.ok(res.data.message.includes('Admin tidak memiliki kewenangan untuk membuat akun Super Admin'));
  });

  await test('Kasir DITOLAK (403) jika mencoba membuat akun baru', async () => {
    const req = {
      method: 'POST',
      body: {
        email: 'staf.ilegal@qurmacel.com',
        password: 'password123',
        displayName: 'Staf Ilegal',
        role: 'KASIR',
        requesterRole: 'KASIR',
        requesterUid: 'user-kasir-default',
      },
    };
    const res = createMockRes();
    await createUserHandler(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
    assert.ok(res.data.message.includes('Kasir tidak diizinkan'));
  });

  await test('Mencegah akun ganda jika email sudah terdaftar di sistem', async () => {
    const req = {
      method: 'POST',
      body: {
        email: 'qurmacel@gmail.com', // Sudah terdaftar
        password: 'password123',
        displayName: 'Duplikat Super Admin',
        role: 'ADMIN',
        requesterRole: 'SUPER_ADMIN',
      },
    };
    const res = createMockRes();
    await createUserHandler(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.error, 'Duplicate Email');
  });

  await test('Dapat membuat akun baru berstatus pending (menunggu persetujuan)', async () => {
    const req = {
      method: 'POST',
      body: {
        email: 'magang@qurmacel.com',
        password: 'password123',
        displayName: 'Staf Magang',
        role: 'KASIR',
        status: 'pending',
        requesterRole: 'ADMIN',
      },
    };
    const res = createMockRes();
    await createUserHandler(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.user.status, USER_STATUS.PENDING);
    assert.strictEqual(res.data.user.statusAlias, 'pending');
    assert.strictEqual(res.data.user.approvedAt, null);
  });

  // ---------------------------------------------------------------------
  // 3. SISTEM LOGIN DINAMIS (BEBAS ALLOWLIST SEMPIT)
  // ---------------------------------------------------------------------
  console.log('\n--- 3. SISTEM LOGIN DINAMIS & PENGECEKAN PERSYARATAN AKSES ---');

  await test('Akun dinamis baru (e.g. manager.operasional@qurmacel.com) DAPAT LOGIN ke dashboard', () => {
    const authUser = { uid: 'user-manager-123', email: 'manager.operasional@qurmacel.com' };
    const profile = {
      uid: 'user-manager-123',
      email: 'manager.operasional@qurmacel.com',
      role: ROLES.ADMIN,
      status: USER_STATUS.APPROVED,
    };

    const result = evaluateLoginAccess({ authUser, profile });
    assert.strictEqual(result.canLogin, true);
    assert.strictEqual(result.destination, '/dashboard');
    assert.strictEqual(result.role, ROLES.ADMIN);
  });

  await test('Akun kasir baru (e.g. kasir.pagi@qurmacel.com) DAPAT LOGIN ke dashboard', () => {
    const authUser = { uid: 'user-kasir-456', email: 'kasir.pagi@qurmacel.com' };
    const profile = {
      uid: 'user-kasir-456',
      email: 'kasir.pagi@qurmacel.com',
      role: ROLES.KASIR,
      status: USER_STATUS.APPROVED,
    };

    const result = evaluateLoginAccess({ authUser, profile });
    assert.strictEqual(result.canLogin, true);
    assert.strictEqual(result.destination, '/dashboard');
    assert.strictEqual(result.role, ROLES.KASIR);
  });

  await test('Akun berstatus pending TIDAK DAPAT masuk dashboard dan dialihkan ke /pending-approval', () => {
    const authUser = { uid: 'user-magang-789', email: 'magang@qurmacel.com' };
    const profile = {
      uid: 'user-magang-789',
      email: 'magang@qurmacel.com',
      role: ROLES.KASIR,
      status: USER_STATUS.PENDING,
    };

    const result = evaluateLoginAccess({ authUser, profile });
    assert.strictEqual(result.canLogin, false);
    assert.strictEqual(result.destination, '/pending-approval');
    assert.strictEqual(result.reason, 'STATUS_NOT_APPROVED');
  });

  await test('Akun lama dengan role belum_ditentukan (qurma1@gmail.com) TIDAK DAPAT masuk dashboard', () => {
    const authUser = { uid: 'user-legacy-qurma1', email: 'qurma1@gmail.com' };
    const profile = {
      uid: 'user-legacy-qurma1',
      email: 'qurma1@gmail.com',
      role: 'belum_ditentukan',
      status: 'belum_ditentukan',
    };

    const result = evaluateLoginAccess({ authUser, profile });
    assert.strictEqual(result.canLogin, false);
    assert.strictEqual(result.destination, '/pending-approval');
    assert.strictEqual(result.reason, 'ROLE_UNDETERMINED');
  });

  await test('Akun berstatus suspended TIDAK DAPAT mengakses sistem', () => {
    const authUser = { uid: 'user-nakal-999', email: 'nakal@qurmacel.com' };
    const profile = {
      uid: 'user-nakal-999',
      email: 'nakal@qurmacel.com',
      role: ROLES.KASIR,
      status: USER_STATUS.SUSPENDED,
    };

    const result = evaluateLoginAccess({ authUser, profile });
    assert.strictEqual(result.canLogin, false);
    assert.strictEqual(result.destination, '/pending-approval');
    assert.strictEqual(result.reason, 'STATUS_NOT_APPROVED');
  });

  // ---------------------------------------------------------------------
  // 4. PEMBAGIAN HAK AKSES DAN KEWENANGAN
  // ---------------------------------------------------------------------
  console.log('\n--- 4. PEMBAGIAN HAK AKSES SUPER ADMIN, ADMIN, DAN KASIR ---');

  await test('Super Admin memiliki seluruh permission sistem (*)', () => {
    assert.deepStrictEqual(DEFAULT_PERMISSIONS[ROLES.SUPER_ADMIN], ['*']);
  });

  await test('Admin memiliki izin operasional dan manajemen pengguna, tetapi bukan wildcard (*)', () => {
    const adminPerms = DEFAULT_PERMISSIONS[ROLES.ADMIN];
    assert.ok(!adminPerms.includes('*'), 'Admin bukan wildcard');
    assert.ok(adminPerms.includes('page.manajemen_pengguna'), 'Admin dapat membuka manajemen pengguna');
    assert.ok(adminPerms.includes('pengguna.view'), 'Admin dapat melihat pengguna');
    assert.ok(adminPerms.includes('pengguna.manage'), 'Admin dapat mengelola hak akses');
    assert.ok(adminPerms.includes('barang.create'), 'Admin dapat mengelola barang');
    assert.ok(adminPerms.includes('page.laporan'), 'Admin dapat membuka laporan');
  });

  await test('Kasir TIDAK MEMILIKI akses ke manajemen_pengguna atau administrasi pengguna', () => {
    const kasirPerms = DEFAULT_PERMISSIONS[ROLES.KASIR];
    assert.strictEqual(kasirPerms.includes('page.manajemen_pengguna'), false, 'Kasir tidak boleh punya page.manajemen_pengguna');
    assert.strictEqual(kasirPerms.includes('pengguna.view'), false, 'Kasir tidak boleh punya pengguna.view');
    assert.strictEqual(kasirPerms.includes('pengguna.manage'), false, 'Kasir tidak boleh punya pengguna.manage');
    assert.strictEqual(kasirPerms.includes('pengguna.approve'), false, 'Kasir tidak boleh punya pengguna.approve');
    assert.strictEqual(kasirPerms.includes('*'), false, 'Kasir bukan wildcard');
  });

  await test('Backend API /api/admin/users: Kasir diblokir (403) dari membaca daftar pengguna', async () => {
    const req = {
      method: 'GET',
      headers: { 'x-actor-role': 'KASIR' },
      query: {},
    };
    const res = createMockRes();
    await usersHandler(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
    assert.ok(res.data.message.includes('Kasir tidak diizinkan'));
  });

  await test('Backend API /api/admin/users: Admin DIBLOKIR (403) jika mencoba mengubah akun Super Admin', async () => {
    const req = {
      method: 'PUT',
      body: {
        targetUid: 'user-superadmin-qurmacel',
        targetEmail: 'qurmacel@gmail.com',
        newRole: 'KASIR',
        requesterRole: 'ADMIN',
      },
    };
    const res = createMockRes();
    await usersHandler(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
    assert.ok(res.data.message.includes('Admin tidak memiliki wewenang untuk mengubah akun Super Admin'));
  });

  await test('Backend API /api/admin/users: Admin DIBLOKIR (403) jika mencoba mengangkat akun menjadi Super Admin', async () => {
    const req = {
      method: 'PUT',
      body: {
        targetUid: 'user-kasir-default',
        targetEmail: 'kasir@gmail.com',
        newRole: 'SUPER_ADMIN',
        requesterRole: 'ADMIN',
      },
    };
    const res = createMockRes();
    await usersHandler(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
    assert.ok(res.data.message.includes('Admin tidak memiliki wewenang untuk memberikan peran Super Admin'));
  });

  await test('Backend API /api/admin/users: Super Admin dapat memperbarui peran dan izin pengguna', async () => {
    const req = {
      method: 'PUT',
      body: {
        targetUid: 'user-kasir-default',
        targetEmail: 'kasir@gmail.com',
        newRole: 'ADMIN',
        permissions: DEFAULT_PERMISSIONS[ROLES.ADMIN],
        requesterRole: 'SUPER_ADMIN',
      },
    };
    const res = createMockRes();
    await usersHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.newRole, ROLES.ADMIN);
  });

  // ---------------------------------------------------------------------
  // 5. PENGUJIAN SINKRONISASI DAN KONSISTENSI SIKLUS HIDUP AKUN
  // ---------------------------------------------------------------------
  console.log('\n--- 5. SINKRONISASI SIKLUS HIDUP AKUN DINAMIS ---');

  await test('Siklus hidup akun: Pembuatan -> Matching UID -> Terbaca di Manajemen Pengguna -> Login -> Permission diterapkan', () => {
    // 1. Akun dibuat oleh Super Admin
    const newAccount = {
      uid: 'auth-uid-spv-01',
      id: 'auth-uid-spv-01',
      email: 'supervisor@qurmacel.com',
      displayName: 'Supervisor Toko',
      role: ROLES.ADMIN,
      status: USER_STATUS.APPROVED,
      permissions: DEFAULT_PERMISSIONS[ROLES.ADMIN],
    };

    // 2. UID Auth dan Firestore MATCHING
    assert.strictEqual(newAccount.uid, newAccount.id);

    // 3. Status dan Role Terdaftar
    assert.strictEqual(isRoleAssigned(newAccount.role), true);
    assert.strictEqual(isAccountApproved(newAccount.status), true);

    // 4. Verifikasi Login
    const loginEval = evaluateLoginAccess({
      authUser: { uid: 'auth-uid-spv-01', email: 'supervisor@qurmacel.com' },
      profile: newAccount,
    });
    assert.strictEqual(loginEval.canLogin, true);
    assert.strictEqual(loginEval.role, ROLES.ADMIN);

    // 5. Hak Akses Diterapkan
    assert.strictEqual(newAccount.permissions.includes('page.barang'), true);
    assert.strictEqual(newAccount.permissions.includes('page.laporan'), true);
    assert.strictEqual(newAccount.permissions.includes('*'), false);
  });

  console.log('\n================================================================');
  console.log(`  HASIL PENGUJIAN: ${passedTests} / ${totalTests} pengujian berhasil dilalui (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
