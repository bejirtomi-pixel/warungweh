/**
 * Vercel Serverless Function: QurmacelPOS Secure Registration Verification
 * Endpoint: POST /api/admin/verify-registration
 */

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Hanya permintaan POST yang diizinkan untuk verifikasi pendaftaran.',
    });
  }

  try {
    const { action, targetUid, requestId, role, permissions, reason, approverUid, approverName } = req.body || {};

    if (!action || !targetUid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Parameter action dan targetUid wajib disertakan.',
      });
    }

    if (action === 'approve') {
      const assignedRole = role || 'KASIR';
      return res.status(200).json({
        success: true,
        action: 'approve',
        targetUid,
        requestId,
        role: assignedRole,
        permissions: permissions || [],
        approvedBy: approverUid || 'SUPER_ADMIN',
        approvedAt: new Date().toISOString(),
        message: `Pendaftaran pengguna ${targetUid} berhasil disetujui sebagai ${assignedRole}.`,
      });
    }

    if (action === 'reject') {
      return res.status(200).json({
        success: true,
        action: 'reject',
        targetUid,
        requestId,
        reason: reason || 'Tidak memenuhi syarat',
        rejectedBy: approverUid || 'SUPER_ADMIN',
        rejectedAt: new Date().toISOString(),
        message: `Pendaftaran pengguna ${targetUid} telah ditolak.`,
      });
    }

    return res.status(400).json({
      error: 'Invalid Action',
      message: `Aksi '${action}' tidak dikenali. Gunakan 'approve' atau 'reject'.`,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Terjadi kesalahan pemrosesan verifikasi backend.',
    });
  }
}
