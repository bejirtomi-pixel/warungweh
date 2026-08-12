import React, { useState } from 'react';
import {
  Store,
  Bell,
  Shield,
  Printer,
  CreditCard,
  Check,
  ToggleRight,
  ToggleLeft,
  CheckCircle2,
  FileText,
  Info,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openTestReceipt } from '../utils/receipt';

const tabs = [
  { id: 'profil', label: 'Profil & Branding', icon: Store },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
  { id: 'keamanan', label: 'Keamanan', icon: Shield },
  { id: 'printer', label: 'Printer Struk', icon: Printer },
  { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard },
];

function Toggle({ enabled, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button onClick={() => onChange(!enabled)} className="shrink-0 text-emerald-600" aria-label={label}>
        {enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
      </button>
    </div>
  );
}

export default function Pengaturan() {
  const { storeProfile, updateStoreProfile, printerSettings, updatePrinterSettings } = useData();
  const [activeTab, setActiveTab] = useState('profil');
  const [toast, setToast] = useState('');
  const [form, setForm] = useState(storeProfile);

  const paperSize = printerSettings.paperSize || '58';

  const [toggles, setToggles] = useState({
    notifTransaksi: true,
    notifStok: true,
    notifPromo: false,
    printerThermal: true,
    autoCetak: printerSettings.autoPrint,
  });

  const [paymentEnabled, setPaymentEnabled] = useState({
    Tunai: true,
    QRIS: true,
    Transfer: true,
    'Kartu Debit': false,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    updateStoreProfile(form);
    showToast('Profil toko berhasil disimpan');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Pengaturan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola pengaturan aplikasi Qurmacel POS.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-white text-slate-600 shadow-sm hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
            <LogoWatermark size="md" />

            <div className="relative z-10 border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-bold text-slate-800">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>

            <div className="relative z-10 p-6">
              {activeTab === 'profil' && (
                <form onSubmit={saveProfile} className="space-y-6">
                  {/* Logo preview */}
                  <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <Logo size="md" imgClassName="max-h-full max-w-full" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">Logo Toko (Qurmacel POS)</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Logo resmi aplikasi dari file <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-emerald-700">/logo.jpg</code>.
                        Logo ditampilkan di login, sidebar, struk, dan laporan.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                      <Check size={13} />
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Toko *</label>
                      <input
                        required
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Pemilik</label>
                      <input
                        value={form.pemilik}
                        onChange={(e) => setForm({ ...form, pemilik: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Alamat Toko</label>
                      <textarea
                        rows={2}
                        value={form.alamat}
                        onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">No. Telepon</label>
                      <input
                        value={form.telepon}
                        onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">Footer Struk</label>
                      <textarea
                        rows={2}
                        value={form.footerStruk}
                        onChange={(e) => setForm({ ...form, footerStruk: e.target.value })}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setForm(storeProfile)}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                    >
                      Simpan Profil
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'notifikasi' && (
                <div className="divide-y divide-slate-100">
                  <Toggle
                    enabled={toggles.notifTransaksi}
                    onChange={(v) => setToggles({ ...toggles, notifTransaksi: v })}
                    label="Notifikasi Transaksi"
                    desc="Kirim notifikasi setiap ada transaksi baru"
                  />
                  <Toggle
                    enabled={toggles.notifStok}
                    onChange={(v) => setToggles({ ...toggles, notifStok: v })}
                    label="Peringatan Stok Menipis"
                    desc="Beritahu saat stok barang di bawah batas minimum"
                  />
                  <Toggle
                    enabled={toggles.notifPromo}
                    onChange={(v) => setToggles({ ...toggles, notifPromo: v })}
                    label="Promo & Info Terbaru"
                    desc="Dapatkan informasi update fitur Qurmacel POS"
                  />
                </div>
              )}

              {activeTab === 'keamanan' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Pengaturan keamanan akun dan sesi login aplikasi.
                  </p>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-sm font-semibold text-slate-700">Ubah Password</p>
                    <p className="text-xs text-slate-500">Ganti password akun kasir Anda</p>
                  </div>
                  <Toggle
                    enabled
                    onChange={() => {}}
                    label="Autentikasi Dua Faktor"
                    desc="Tambahkan lapisan keamanan saat login"
                  />
                </div>
              )}

              {activeTab === 'printer' && (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Ukuran Kertas Struk</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: '58', label: '58 mm', desc: 'Printer thermal POS umum (Pilih ini untuk printer Anda)' },
                        { id: '80', label: '80 mm', desc: 'Printer thermal 80mm lebar' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            updatePrinterSettings({ paperSize: opt.id });
                            showToast(`Ukuran kertas struk diubah ke ${opt.id}mm`);
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${
                            paperSize === opt.id
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                            {paperSize === opt.id && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                                <Check size={12} />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Toggle
                    enabled={toggles.printerThermal}
                    onChange={(v) => setToggles({ ...toggles, printerThermal: v })}
                    label="Printer Thermal POS"
                    desc="Struk dicetak menggunakan printer termal melalui dialog cetak browser"
                  />
                  <Toggle
                    enabled={toggles.autoCetak}
                    onChange={(v) => {
                      setToggles({ ...toggles, autoCetak: v });
                      updatePrinterSettings({ autoPrint: v });
                    }}
                    label="Cetak Otomatis Setelah Transaksi"
                    desc="Struk langsung dicetak tanpa konfirmasi"
                  />

                  <button
                    onClick={() => openTestReceipt({ storeProfile, paperSize })}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                  >
                    <FileText size={16} />
                    Cetak Struk Uji ({paperSize}mm)
                  </button>

                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="text-[11px] leading-relaxed text-amber-800">
                      <p className="font-bold">Tips menyiapkan printer POS 58mm:</p>
                      <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                        <li>Instal driver printer & set default di Windows (Control Panel → Printers).</li>
                        <li>Di dialog cetak browser, pilih printer POS Anda.</li>
                        <li>Set ukuran kertas ke <b>58mm × 297mm</b> (atau sesuai kertas gulung).</li>
                        <li>Set <b>Margin: None</b> dan matikan <b>Header & Footer</b>.</li>
                        <li>Klik <b>Cetak Struk Uji</b> untuk memastikan semuanya berjalan.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pembayaran' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Aktifkan metode pembayaran yang tersedia.</p>
                  {Object.entries(paymentEnabled).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">{key}</p>
                      <button
                        onClick={() => setPaymentEnabled({ ...paymentEnabled, [key]: !value })}
                        className="text-emerald-600"
                        aria-label={key}
                      >
                        {value ? <ToggleRight size={30} /> : <ToggleLeft size={30} className="text-slate-300" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
