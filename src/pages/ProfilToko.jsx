import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Save,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  FileText,
  AlertCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';

export default function ProfilToko() {
  const { storeProfile, updateStoreProfile } = useData();
  const fileInputRef = useRef(null);

  const initialForm = useMemo(
    () => ({
      nama: storeProfile?.nama || 'Qurmacel Store',
      pemilik: storeProfile?.pemilik || '',
      npwp: storeProfile?.npwp || '',
      alamat: storeProfile?.alamat || '',
      telepon: storeProfile?.telepon || '',
      email: storeProfile?.email || '',
      logo: storeProfile?.logo || '/logo.jpg',
      footerStruk: storeProfile?.footerStruk || 'Terima kasih telah berbelanja.',
    }),
    [storeProfile]
  );

  const [form, setForm] = useState(initialForm);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [logoError, setLogoError] = useState('');

  // Sinkronkan form saat data storeProfile berubah
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  // Cek apakah ada perubahan yang belum disimpan (dirty state)
  const isDirty = useMemo(() => {
    return (
      form.nama !== initialForm.nama ||
      form.pemilik !== initialForm.pemilik ||
      form.npwp !== initialForm.npwp ||
      form.alamat !== initialForm.alamat ||
      form.telepon !== initialForm.telepon ||
      form.email !== initialForm.email ||
      form.logo !== initialForm.logo ||
      form.footerStruk !== initialForm.footerStruk
    );
  }, [form, initialForm]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Format file harus berupa gambar (JPG, PNG, atau WEBP).');
      showToast('Format file harus berupa gambar', 'error');
      return;
    }

    // Maksimal 2MB
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Ukuran file maksimal 2 MB agar performa struk dan aplikasi tetap cepat.');
      showToast('Ukuran logo maksimal 2 MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({ ...prev, logo: event.target.result }));
      showToast('Logo berhasil dipilih. Jangan lupa klik Simpan Profil.', 'success');
    };
    reader.onerror = () => {
      setLogoError('Gagal membaca file gambar.');
      showToast('Gagal membaca file gambar', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setForm((prev) => ({ ...prev, logo: '/logo.jpg' }));
    setLogoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo dikembalikan ke logo bawaan Qurmacel POS', 'success');
  };

  const handleResetForm = () => {
    setForm(initialForm);
    setLogoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Perubahan dibatalkan, form kembali ke data tersimpan');
  };

  const handleSave = (e) => {
    e?.preventDefault();
    if (!form.nama.trim()) {
      showToast('Nama toko tidak boleh kosong', 'error');
      return;
    }

    try {
      updateStoreProfile({
        nama: form.nama.trim(),
        pemilik: form.pemilik.trim(),
        npwp: form.npwp.trim(),
        alamat: form.alamat.trim(),
        telepon: form.telepon.trim(),
        email: form.email.trim(),
        logo: form.logo,
        footerStruk: form.footerStruk.trim(),
      });
      showToast('Profil toko & pengaturan struk berhasil disimpan!');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan profil toko. Silakan coba lagi.', 'error');
    }
  };

  const MAX_FOOTER_CHARS = 120;
  const footerCharCount = (form.footerStruk || '').length;
  const isFooterOverLimit = footerCharCount > MAX_FOOTER_CHARS;

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Title & Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
                Profil Toko
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <Sparkles size={12} />
                Pusat Identitas Usaha
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Kelola branding, legalitas identitas usaha, kontak resmi, dan template struk kasir Qurmacel POS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Ada perubahan belum disimpan
              </span>
            )}
            <button
              type="button"
              onClick={handleResetForm}
              disabled={!isDirty}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={15} />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98"
            >
              <Save size={16} />
              Simpan Profil
            </button>
          </div>
        </div>

        {/* Main Grid: Form (2 Cols on large screens) + Receipt Preview (1 Col) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT: Complete Store Profile Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <LogoWatermark size="lg" />

              <form onSubmit={handleSave} className="relative z-10 space-y-6">
                {/* 1. BRANDING TOKO */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <Store size={16} className="text-emerald-600" />
                    Branding &amp; Logo Toko
                  </h2>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                    {/* Logo Upload & Preview */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-700">
                        Logo Resmi Toko
                      </label>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-2 shadow-xs group">
                          <img
                            src={form.logo || '/logo.jpg'}
                            alt="Logo Toko"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.jpg';
                            }}
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload-input"
                            />
                            <label
                              htmlFor="logo-upload-input"
                              className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition"
                            >
                              <Upload size={14} className="text-emerald-600" />
                              Unggah Logo Baru
                            </label>

                            {form.logo && form.logo !== '/logo.jpg' && (
                              <button
                                type="button"
                                onClick={handleResetLogo}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                              >
                                <RotateCcw size={14} />
                                Logo Bawaan
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Mendukung PNG, JPG, atau WEBP (maks. 2 MB). Logo ini akan muncul di login kasir, sidebar, kartu meja, dan cetak struk belanja.
                          </p>
                          {logoError && (
                            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                              <AlertCircle size={13} />
                              {logoError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Store Name Input */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Nama Toko / Usaha <span className="text-rose-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="cth: Qurmacel Store"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. IDENTITAS USAHA & KONTAK */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                    <User size={16} className="text-emerald-600" />
                    Identitas Usaha &amp; Legalitas
                  </h2>

                  <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Nama Pemilik / Penanggung Jawab
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Nama pemilik usaha"
                          value={form.pemilik}
                          onChange={(e) => setForm({ ...form, pemilik: e.target.value })}
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        NPWP Usaha <span className="text-[11px] text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <div className="relative">
                        <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="00.000.000.0-000.000"
                          value={form.npwp}
                          onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Alamat Lengkap Toko
                      </label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                        <textarea
                          rows={2}
                          placeholder="Jalan, Nomor, RT/RW, Kelurahan, Kecamatan, Kota"
                          value={form.alamat}
                          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                          className={`${inputClass} resize-none pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        No. Telepon / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="0812-xxxx-xxxx"
                          value={form.telepon}
                          onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Email Resmi
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="kontak@toko.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. FOOTER STRUK KASIR */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                      <Receipt size={16} className="text-emerald-600" />
                      Pesan Footer Struk Kasir
                    </h2>
                    <span
                      className={`text-xs font-semibold ${
                        isFooterOverLimit ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {footerCharCount} / {MAX_FOOTER_CHARS} karakter
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                    <textarea
                      rows={2}
                      maxLength={MAX_FOOTER_CHARS + 20}
                      placeholder="Pesan penutup struk (cth: Terima kasih atas kunjungan Anda!)"
                      value={form.footerStruk}
                      onChange={(e) => setForm({ ...form, footerStruk: e.target.value })}
                      className={`${inputClass} resize-none ${
                        isFooterOverLimit ? 'border-rose-400 focus:border-rose-500' : ''
                      }`}
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Pesan ini tercetak otomatis di bagian bawah struk kertas thermal 58mm &amp; 80mm.</span>
                      {isFooterOverLimit && (
                        <span className="font-semibold text-rose-600">Disarankan maks. 120 karakter</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Submit Action */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-400">
                    Semua modul kasir, struk, dan laporan membaca profil yang sama secara terpusat.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98"
                  >
                    <Save size={16} />
                    Simpan Profil
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Live Interactive Thermal Receipt Preview (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Receipt size={14} className="text-emerald-600" />
                  Live Preview Struk Kasir
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Thermal 58mm / 80mm
                </span>
              </div>

              {/* Realistic Paper Thermal Receipt */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-slate-100/70 p-4 shadow-sm">
                <div className="mx-auto max-w-[340px] rounded-lg bg-white p-5 shadow-md border-t-4 border-emerald-600 font-mono text-slate-800 text-xs">
                  {/* Store Header */}
                  <div className="text-center space-y-1 pb-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1 mb-1 border border-slate-200">
                      <img
                        src={form.logo || '/logo.jpg'}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/logo.jpg';
                        }}
                      />
                    </div>
                    <div className="font-extrabold text-sm uppercase tracking-wide text-slate-900">
                      {form.nama || 'Qurmacel Store'}
                    </div>
                    {form.alamat && (
                      <div className="text-[10.5px] text-slate-600 leading-tight">
                        {form.alamat}
                      </div>
                    )}
                    {form.telepon && (
                      <div className="text-[10px] text-slate-500">
                        Telp/WA: {form.telepon}
                      </div>
                    )}
                    {form.npwp && (
                      <div className="text-[9.5px] text-slate-400">
                        NPWP: {form.npwp}
                      </div>
                    )}
                  </div>

                  {/* Dashed Separator */}
                  <div className="border-t border-dashed border-slate-400 my-2" />

                  {/* Metadata */}
                  <div className="space-y-0.5 text-[10.5px] text-slate-600">
                    <div className="flex justify-between">
                      <span>No: TRX-20261109-001</span>
                      <span>Kasir: Admin</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu: 09/11/2026 11:45</span>
                      <span>Meja: Meja 02</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode: QRIS</span>
                      <span className="font-bold text-emerald-700">LUNAS</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-400 my-2" />

                  {/* Sample Items */}
                  <div className="space-y-1.5 py-1 text-[11px]">
                    <div>
                      <div className="font-bold text-slate-900">Kurma Medjool Premium 500g</div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>1 x Rp 65.000</span>
                        <span>Rp 65.000</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Air Nabeez Botol 330ml</div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>2 x Rp 12.000</span>
                        <span>Rp 24.000</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-400 my-2" />

                  {/* Totals */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp 89.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pajak (PPN 10%)</span>
                      <span>Rp 8.900</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-slate-900 text-xs border-t border-slate-300 pt-1 mt-1">
                      <span>TOTAL</span>
                      <span>Rp 97.900</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-400 my-3" />

                  {/* Dynamic Footer Struk Live */}
                  <div className="text-center space-y-1">
                    <div className="text-[11px] font-bold text-slate-800 leading-snug break-words">
                      {form.footerStruk || 'Terima kasih telah berbelanja.'}
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      Simulasi Tampilan Struk Kasir Nyata
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Qurmacel POS · Powered by POS System
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-center text-[11px] text-slate-500">
                  Preview ini memperbarui secara langsung saat Anda mengedit logo, nama toko, alamat, atau pesan footer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl transition-all ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white shadow-rose-900/30'
              : 'bg-slate-900 text-white shadow-slate-900/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
