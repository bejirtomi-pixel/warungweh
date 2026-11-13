/**
 * Vercel Serverless Function: Secure User Creation (Super Admin & Admin)
 * Endpoint: POST /api/admin/create-user
 */

import { INITIAL_AUTH_ACCOUNTS, ROLES, USER_STATUS, normalizeRole } from '../../src/utils/userManagement.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Hanya permintaan POST yang diizinkan untuk pembuatan akun pengguna.',
    });
  }

  try {
    const {
      email,
      password,
      displayName,
      role = 'KASIR',
      status = 'approved',
      permissions = null,
      requesterRole = 'SUPER_ADMIN',
      requesterUid = 'SYSTEM',
      requesterName = 'Administrator',
    } = req.body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanRole = normalizeRole(role);
    const normRequesterRole = normalizeRole(requesterRole);

    // 1. Kasir DILARANG mengakses endpoint pembuatan pengguna
    if (normRequesterRole === ROLES.KASIR) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Kasir tidak diizinkan mengakses endpoint pengelolaan pengguna.',
      });
    }

    // 2. Admin DILARANG membuat akun Super Admin
    if (normRequesterRole === ROLES.ADMIN && cleanRole === ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin tidak memiliki kewenangan untuk membuat akun Super Admin.',
      });
    }

    // 3. Validasi input
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email pengguna wajib diisi.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password minimal 6 karakter.' });
    }

    // 4. Cegah akun ganda jika email sudah terdaftar
    const existingInBaseline = INITIAL_AUTH_ACCOUNTS.some(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    if (existingInBaseline) {
      return res.status(400).json({
        error: 'Duplicate Email',
        message: `Email ${cleanEmail} sudah terdaftar di sistem QurmacelPOS.`,
      });
    }

    // 5. Penetapan data akun baru dengan UID yang sama untuk Auth & Firestore
    const newUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const finalStatus = status === 'pending' ? USER_STATUS.PENDING : USER_STATUS.APPROVED;
    const isAppr = finalStatus === USER_STATUS.APPROVED;
    const nowIso = new Date().toISOString();

    const newProfile = {
      uid: newUid,
      id: newUid,
      email: cleanEmail,
      displayName: (displayName || '').trim() || cleanEmail.split('@')[0],
      role: cleanRole,
      roleAlias: cleanRole.toLowerCase(),
      status: finalStatus,
      statusAlias: isAppr ? 'active' : 'pending',
      permissions: cleanRole === ROLES.SUPER_ADMIN ? ['*'] : (permissions || []),
      createdAt: nowIso,
      createdBy: requesterUid,
      creatorRole: normRequesterRole,
      approvedAt: isAppr ? nowIso : null,
      approvedBy: isAppr ? requesterUid : null,
    };

    return res.status(201).json({
      success: true,
      message: `Akun baru ${cleanEmail} berhasil dibuat dengan peran ${cleanRole} dan status ${finalStatus}.`,
      user: newProfile,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Terjadi kesalahan pada backend create-user.',
    });
  }
}
