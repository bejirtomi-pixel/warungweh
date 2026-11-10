import React, { useState } from 'react';
import { Menu, Shield, UserCheck, RefreshCw, X, AlertCircle } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  const {
    user,
    role,
    isSuperAdmin,
    isAdmin,
    isKasir,
    cashierOperator,
    currentUserDisplay,
    clearCashierOperator,
  } = useAuth();

  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Peran Badge Config
  const roleBadge = isSuperAdmin
    ? { label: 'SUPER ADMIN', bg: 'bg-purple-100 text-purple-700 border-purple-200' }
    : isAdmin
    ? { label: 'ADMIN', bg: 'bg-blue-100 text-blue-700 border-blue-200' }
    : { label: 'KASIR', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

  const handleConfirmSwitch = async () => {
    setSwitching(true);
    try {
      await clearCashierOperator();
      setConfirmSwitchOpen(false);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6 no-print">
      {/* Mobile menu button */}
      <button
        onClick={onOpenMobile}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={onToggleCollapse}
        className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:inline-flex"
        aria-label="Persempit sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Small logo on mobile/tablet */}
      <div className="flex items-center lg:hidden">
        <Logo size="sm" />
      </div>

      <div className="hidden md:flex flex-1 items-center">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* User Card & Petugas Kasir */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 py-1.5 pl-2 pr-3 bg-white shadow-2xs">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
              isSuperAdmin
                ? 'bg-purple-600'
                : isAdmin
                ? 'bg-blue-600'
                : 'bg-emerald-600'
            }`}
          >
            {currentUserDisplay.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-tight text-slate-800">
              {currentUserDisplay}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${roleBadge.bg}`}>
                {roleBadge.label}
              </span>
              {isKasir && cashierOperator?.name && (
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  (Aktif)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Ganti Petugas untuk Kasir */}
        {isKasir && cashierOperator?.name && (
          <button
            onClick={() => setConfirmSwitchOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-semibold border border-slate-200/80 transition shadow-2xs cursor-pointer"
            title="Selesaikan sesi tugas dan ganti ke petugas kasir berikutnya"
          >
            <RefreshCw size={13} />
            <span>Ganti Petugas</span>
          </button>
        )}
      </div>

      {/* Modal Konfirmasi Ganti Petugas Kasir */}
      {confirmSwitchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-4 ring-amber-50/50">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Ganti Petugas Kasir?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sesi tugas atas nama <strong className="text-slate-800">{cashierOperator?.name}</strong> akan ditutup dan dicatat ke Riwayat Aktivitas. Petugas kasir berikutnya akan diminta memasukkan namanya.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSwitchOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={switching}
                onClick={handleConfirmSwitch}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition disabled:opacity-60"
              >
                {switching ? 'Menutup Sesi...' : 'Ganti Petugas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
