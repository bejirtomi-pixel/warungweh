/**
 * Vercel Serverless Function: User Management & Synchronization
 * Endpoint: GET, PUT /api/admin/users
 */

import { INITIAL_AUTH_ACCOUNTS, ROLES, USER_STATUS, normalizeRole } from '../../src/utils/userManagement.js';

export default async function handler(req, res) {
  const method = req.method;

  if (method !== 'GET' && method !== 'PUT' && method !== 'PATCH') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Metode HTTP tidak didukung.',
    });
  }

  try {
    const requesterRole = normalizeRole(
      req.headers?.['x-actor-role'] ||
      req.query?.requesterRole ||
      req.body?.requesterRole ||
      req.body?.updaterRole
    );

    // Kasir dilarang mengakses data atau administrasi pengguna
    if (requesterRole === ROLES.KASIR) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Kasir tidak diizinkan mengakses daftar pengguna atau administrasi akun.',
      });
    }

    if (method === 'GET') {
      // Kembalikan akun yang dikenali termasuk 5 akun autentikasi
      return res.status(200).json({
        success: true,
        count: INITIAL_AUTH_ACCOUNTS.length,
        users: INITIAL_AUTH_ACCOUNTS,
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const { targetUid, targetEmail, newRole, newStatus, permissions } = req.body || {};

      // Validasi Admin tidak boleh mengubah akun Super Admin
      const cleanTargetEmail = (targetEmail || '').toLowerCase().trim();
      const isTargetSuper = cleanTargetEmail === 'qurmacel@gmail.com' || targetUid === 'user-superadmin-qurmacel';

      if (requesterRole === ROLES.ADMIN) {
        if (isTargetSuper) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin tidak memiliki wewenang untuk mengubah akun Super Admin.',
          });
        }
        if (normalizeRole(newRole) === ROLES.SUPER_ADMIN) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin tidak memiliki wewenang untuk memberikan peran Super Admin.',
          });
        }
      }

      return res.status(200).json({
        success: true,
        targetUid,
        newRole: normalizeRole(newRole),
        newStatus: newStatus || USER_STATUS.APPROVED,
        permissions: permissions || [],
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Terjadi kesalahan pada backend users endpoint.',
    });
  }
}
