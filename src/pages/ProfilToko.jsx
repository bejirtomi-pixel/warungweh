import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Save,
  RefreshCw,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';

export default function ProfilToko() {
  const { storeProfile, updateStoreProfile } = useData();
  const [form, setForm] = useState(storeProfile);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateStoreProfile(form);
    showToast('Profil toko berhasil disimpan');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Profil Toko</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informasi identitas dan branding Qurmacel Store.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <LogoWatermark size="lg" />

          {/* Header */}
          <div className="relative z-10 flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Logo preview - official logo.jpg */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                <Logo size="lg" imgClassName="max-h-full max-w-full rounded-xl" />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800">{form.nama}</p>
                <p className="text-xs text-slate-500">Logo resmi Qurmacel POS</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(storeProfile)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={15} />
                Reset
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
              >
                <Save size={15} />
                Simpan Profil
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="relative z-10 space-y-6 px-6 py-6">
            {/* Branding */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Store size={15} className="text-emerald-600" />
                Branding Toko
              </h2>
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Logo Toko</label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <Logo size="sm" imgClassName="rounded-lg" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">logo.jpg</p>
                      <p className="text-[11px] text-slate-400">Sumber logo resmi aplikasi</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Toko *</label>
                  <input
                    required
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Identity */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <User size={15} className="text-emerald-600" />
                Identitas Usaha
              </h2>
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Pemilik</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.pemilik}
                      onChange={(e) => setForm({ ...form, pemilik: e.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">NPWP</label>
                  <input
                    value={form.npwp}
                    onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Alamat Lengkap</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <textarea
                      rows={3}
                      value={form.alamat}
                      onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                      className={`${inputClass} resize-none pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">No. Telepon / WhatsApp</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.telepon}
                      onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt footer */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <Store size={15} className="text-emerald-600" />
                Footer Struk
              </h2>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                <textarea
                  rows={2}
                  value={form.footerStruk}
                  onChange={(e) => setForm({ ...form, footerStruk: e.target.value })}
                  className={`${inputClass} resize-none`}
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Pesan yang muncul di bagian bawah struk transaksi.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
              >
                <Save size={15} />
                Simpan Profil
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
