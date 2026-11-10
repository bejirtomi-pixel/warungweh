import React, { useState } from 'react';
import { UserCheck, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

export default function CashierShiftModal() {
  const { isKasir, cashierOperator, setCashierOperator } = useAuth();
  const [operatorNameInput, setOperatorNameInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hanya muncul jika role adalah Kasir dan belum memasukkan nama petugas yang bertugas
  if (!isKasir || Boolean(cashierOperator?.name)) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = operatorNameInput.trim();
    if (!clean) {
      setError('Nama petugas kasir wajib diisi.');
      return;
    }
    if (clean.length < 2) {
      setError('Nama petugas minimal 2 karakter.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await setCashierOperator(clean);
      setOperatorNameInput('');
    } catch (err) {
      setError('Gagal memulai sesi kasir. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 text-center">
        {/* Logo Toko */}
        <div className="flex justify-center">
          <Logo size="md" showText textClassName="font-bold text-slate-800 text-lg tracking-tight" />
        </div>

        {/* Icon & Title */}
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/50">
            <UserCheck size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Identitas Petugas Kasir
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Akun ini digunakan bersama. Masukkan nama Anda sebagai petugas yang sedang bertugas hari ini agar seluruh riwayat aktivitas dan transaksi tercatat atas nama Anda.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Petugas Kasir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Andi, Budi, Siti"
              value={operatorNameInput}
              onChange={(e) => {
                setOperatorNameInput(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-emerald-500 focus:border-emerald-500 font-semibold text-slate-800 placeholder:font-normal"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Shield size={13} className="text-emerald-600 shrink-0" />
            <span>Nama ini akan tercantum di Struk dan Audit Trail transaksi.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition disabled:opacity-60 cursor-pointer"
          >
            <Sparkles size={16} />
            {isSubmitting ? 'Memulai Sesi Tugas...' : 'Mulai Sesi Tugas Kasir'}
          </button>
        </form>
      </div>
    </div>
  );
}
