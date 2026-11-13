import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldAlert,
  XCircle,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAccountApproved, isRoleAssigned } from '../utils/userManagement.js';
import Logo from '../components/common/Logo';

export default function PendingApproval() {
  const navigate = useNavigate();
  const { user, userProfile, isPending, isSuspended, isRejected, reloadProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-redirect jika akun utama atau sudah approved dengan role yang jelas
  useEffect(() => {
    const email = (user?.email || userProfile?.email || '').toLowerCase().trim();
    const isRootSuper = email === 'qurmacel@gmail.com';
    const hasAssignedRole = isRoleAssigned(userProfile?.role) || isRootSuper;
    const isApproved = isAccountApproved(userProfile?.status) || isRootSuper;

    if (user && hasAssignedRole && isApproved) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, userProfile, navigate]);

  const status = userProfile?.status || (isRejected ? 'rejected' : isSuspended ? 'suspended' : 'pending');
  const isDenied = status === 'rejected';
  const isBlocked = status === 'suspended';
  const isAwaiting = !isDenied && !isBlocked;

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage('');
    try {
      const p = await reloadProfile();
      const email = (user?.email || p?.email || '').toLowerCase().trim();
      const isRootSuper = email === 'qurmacel@gmail.com';
      const hasAssignedRole = isRoleAssigned(p?.role) || isRootSuper;
      const isApproved = isAccountApproved(p?.status) || isRootSuper;

      if (hasAssignedRole && isApproved) {
        setMessage('Selamat! Akun Anda sudah disetujui dan aktif. Mengalihkan ke Dashboard...');
        setTimeout(() => navigate('/dashboard', { replace: true }), 800);
      } else if (p?.status === 'rejected') {
        setMessage('Permohonan pendaftaran akun Anda ditolak oleh Administrator.');
      } else if (!hasAssignedRole) {
        setMessage('Peran operasional akun Anda belum ditentukan oleh Administrator.');
      } else {
        setMessage('Status akun Anda masih dalam antrean verifikasi Administrator.');
      }
    } catch {
      setMessage('Gagal memperbarui status. Periksa koneksi internet Anda.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 text-center space-y-6">
        {/* Logo Toko */}
        <div className="flex justify-center">
          <Logo size="lg" showText textClassName="font-bold text-slate-800 text-xl tracking-tight" />
        </div>

        {/* Status Icon */}
        <div className="flex justify-center">
          {isDenied ? (
            <div className="h-20 w-20 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center ring-8 ring-red-50/50">
              <XCircle size={44} />
            </div>
          ) : isBlocked ? (
            <div className="h-20 w-20 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center ring-8 ring-rose-50/50">
              <ShieldAlert size={44} />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-8 ring-amber-50/50">
              <Clock size={40} className="animate-pulse" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">
            {isDenied
              ? 'Pendaftaran Akun Ditolak'
              : isBlocked
              ? 'Akses Akun Dinonaktifkan'
              : 'Menunggu Persetujuan Admin'}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {isDenied
              ? 'Permohonan pendaftaran akun Anda telah ditinjau dan ditolak oleh Super Admin. Anda tidak dapat mengakses operasional kasir.'
              : isBlocked
              ? 'Akun Anda saat ini ditangguhkan oleh Administrator toko. Silakan hubungi Super Admin untuk mengaktifkan kembali akun.'
              : 'Pendaftaran mandiri Anda berhasil dicatat. Demi keamanan toko, akun baru harus diverifikasi dan diberi hak akses oleh Super Admin sebelum dapat mengakses data operasional kasir.'}
          </p>
        </div>

        {/* User Card */}
        <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-100 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <User size={15} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">
              {userProfile?.displayName || user?.displayName || 'Pengguna Baru'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={15} className="text-slate-400 shrink-0" />
            <span className="text-slate-600 truncate">{userProfile?.email || user?.email}</span>
          </div>

          {userProfile?.rejectionReason && (
            <div className="pt-2 border-t border-slate-200/60 text-xs text-red-600">
              <span className="font-semibold text-slate-500">Alasan: </span>
              {userProfile.rejectionReason}
            </div>
          )}

          {userProfile?.suspensionReason && (
            <div className="pt-2 border-t border-slate-200/60 text-xs text-rose-600">
              <span className="font-semibold text-slate-500">Alasan Penangguhan: </span>
              {userProfile.suspensionReason}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status Saat Ini:</span>
            <span
              className={`font-bold px-2.5 py-0.5 rounded-full ${
                isDenied
                  ? 'bg-red-100 text-red-700'
                  : isBlocked
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isDenied ? 'Ditolak' : isBlocked ? 'Ditangguhkan' : 'Menunggu Verifikasi'}
            </span>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 ${
              message.includes('Selamat')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : message.includes('ditolak')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {message.includes('Selamat') ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {isAwaiting && (
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-60"
            >
              <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Memeriksa Persetujuan...' : 'Periksa Status Ulang'}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition"
          >
            <LogOut size={16} />
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
}
