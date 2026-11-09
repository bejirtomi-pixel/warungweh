import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Table2,
  Plus,
  Trash2,
  Upload,
  ImageOff,
  X,
  QrCode,
  Percent,
  AlertTriangle,
  Sparkles,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import GoogleIcon from '../components/common/GoogleIcon';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openTestReceipt } from '../utils/receipt';
import { getNotifPrefs, saveNotifPrefs } from '../utils/storage';

const tabs = [
  { id: 'profil', label: 'Profil & Branding', icon: Store },
  { id: 'pajak', label: 'Pajak Transaksi', icon: Percent },
  { id: 'meja', label: 'Meja & QRIS', icon: Table2 },
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
  const {
    settings,
    updateSettings,
    products,
    productMeta,
    storeProfile,
    updateStoreProfile,
    printerSettings,
    updatePrinterSettings,
    paymentMethods,
    updatePaymentSettings,
    tables,
    addTable,
    updateTable,
    deleteTable,
    formatRupiah,
  } = useData();
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [activeTab, setActiveTab] = useState('profil');
  const [toast, setToast] = useState('');

  const paperSize = printerSettings.paperSize || '58';

  const metaMap = React.useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  const [pajakForm, setPajakForm] = useState({
    aktif: Boolean(settings?.pajakTransaksiAktif),
    jenis: settings?.pajakTransaksiJenis || 'PPN',
    persen: settings?.pajakTransaksiPersen !== undefined ? settings.pajakTransaksiPersen : 10,
  });

  useEffect(() => {
    if (settings) {
      setPajakForm({
        aktif: Boolean(settings.pajakTransaksiAktif),
        jenis: settings.pajakTransaksiJenis || 'PPN',
        persen: settings.pajakTransaksiPersen !== undefined ? settings.pajakTransaksiPersen : 10,
      });
    }
  }, [settings?.pajakTransaksiAktif, settings?.pajakTransaksiJenis, settings?.pajakTransaksiPersen]);

  const [minStockInput, setMinStockInput] = useState(settings?.minStockThreshold || 5);
  useEffect(() => {
    if (settings?.minStockThreshold) {
      setMinStockInput(settings.minStockThreshold);
    }
  }, [settings?.minStockThreshold]);

  const [toggles, setTogglesState] = useState(() => {
    const prefs = getNotifPrefs();
    return {
      notifTransaksi: prefs.notifTransaksi ?? true,
      notifStok: prefs.notifStok ?? true,
      notifStokHabis: prefs.notifStokHabis ?? true,
      notifPromo: prefs.notifPromo ?? false,
      printerThermal: true,
      autoCetak: printerSettings?.autoPrint ?? true,
    };
  });

  const [browserNotifPerm, setBrowserNotifPerm] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const requestBrowserNotif = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserNotifPerm(perm);
        if (perm === 'granted') {
          showToast('Izin notifikasi browser berhasil diaktifkan');
        } else {
          showToast('Izin notifikasi browser belum diberikan');
        }
      } catch {
        showToast('Gagal meminta izin notifikasi browser');
      }
    }
  };

  const setToggles = (newVal, message) => {
    setTogglesState(newVal);
    saveNotifPrefs({
      notifTransaksi: newVal.notifTransaksi,
      notifStok: newVal.notifStok,
      notifStokHabis: newVal.notifStokHabis,
      notifPromo: newVal.notifPromo,
    });
    showToast(message || 'Pengaturan notifikasi berhasil diperbarui');
  };

  const savePajakSettings = (e) => {
    if (e) e.preventDefault();
    updateSettings({
      pajakTransaksiAktif: Boolean(pajakForm.aktif),
      pajakTransaksiJenis: pajakForm.jenis || 'PPN',
      pajakTransaksiPersen: Math.min(100, Math.max(0, Number(pajakForm.persen) || 0)),
    });
    showToast('Pengaturan pajak transaksi berhasil disimpan');
  };

  const handleMinStockChange = (e) => {
    const val = Number(e.target.value);
    setMinStockInput(e.target.value);
    if (val > 0) {
      updateSettings({ minStockThreshold: val });
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Status akun Google yang sedang dipakai untuk login (Google-only).
  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, (u) => {
        if (!u) {
          setGoogleLinked(false);
          setGoogleEmail('');
          return;
        }
        const prov = (u.providerData || []).find((p) => p.providerId === 'google.com');
        setGoogleLinked(Boolean(prov));
        setGoogleEmail(prov?.email || u.email || '');
      });
    } catch {
      // abaikan; jika auth tidak tersedia, tampilan koneksi tetap netral
    }
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

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
                <div className="space-y-6">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200 shadow-2xs">
                          <Store className="text-emerald-700" size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Pusat Identitas &amp; Legalitas Toko</h3>
                          <p className="text-xs text-slate-500">
                            Pengelolaan logo, nama toko, NPWP, alamat resmi, kontak, dan template struk kasir kini dipusatkan di halaman Profil Toko.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/profil-toko"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition shrink-0"
                      >
                        <span>Kelola Profil Toko</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Ringkasan Identitas Aktif */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Ringkasan Identitas Aktif (Single Source of Truth)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <Check size={12} />
                        Terintegrasi
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-2">
                        <img
                          src={storeProfile?.logo || '/logo.jpg'}
                          alt="Logo Toko"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/logo.jpg';
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 flex-1 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nama Toko</span>
                          <span className="font-bold text-slate-800 text-sm">{storeProfile?.nama || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nama Pemilik</span>
                          <span className="font-semibold text-slate-700">{storeProfile?.pemilik || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">NPWP Usaha</span>
                          <span className="font-semibold text-slate-700">{storeProfile?.npwp || 'Belum diisi'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">No. Telepon / WhatsApp</span>
                          <span className="font-semibold text-slate-700">{storeProfile?.telepon || '—'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block text-[11px]">Alamat Toko</span>
                          <span className="font-semibold text-slate-700">{storeProfile?.alamat || '—'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block text-[11px]">Pesan Footer Struk Kasir</span>
                          <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 block mt-1">
                            {storeProfile?.footerStruk || 'Terima kasih telah berbelanja.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pajak' && (
                <form onSubmit={savePajakSettings} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Pajak Transaksi Toko</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Konfigurasi pajak umum yang berlaku pada transaksi kasir.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Status Pajak Transaksi</p>
                        <p className="text-xs text-slate-500">
                          Aktifkan pemungutan pajak pada nota transaksi
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextAktif = !pajakForm.aktif;
                          setPajakForm({ ...pajakForm, aktif: nextAktif });
                          updateSettings({ pajakTransaksiAktif: nextAktif });
                          showToast(`Pajak transaksi ${nextAktif ? 'diaktifkan' : 'dinonaktifkan'}`);
                        }}
                        className="text-emerald-600 transition"
                      >
                        {pajakForm.aktif ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                      </button>
                    </div>

                    {pajakForm.aktif && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Jenis Pajak
                          </label>
                          <input
                            value={pajakForm.jenis}
                            onChange={(e) => setPajakForm({ ...pajakForm, jenis: e.target.value })}
                            className={inputClass}
                            placeholder="cth: PPN, PB1, Service"
                            required
                          />
                          <p className="mt-1 text-[11px] text-slate-400">
                            Nama pajak yang tercetak pada struk belanja.
                          </p>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            Tarif Pajak (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={pajakForm.persen}
                              onChange={(e) => setPajakForm({ ...pajakForm, persen: e.target.value })}
                              className={`${inputClass} pr-8`}
                              placeholder="10"
                              required
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              %
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Persentase pajak yang dihitung dari DPP transaksi.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anti Double-Taxation Explanatory Alert */}
                  <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                      <p className="font-bold text-emerald-900">Perlindungan Anti Pajak Ganda (No Double-Taxation):</p>
                      <p>
                        Sistem secara otomatis menerapkan Pajak Transaksi hanya pada barang yang <b>tidak memiliki Pajak Barang mandiri</b>.
                        Jika suatu barang sudah memiliki tarif pajak per item di menu Barang, barang tersebut tidak akan dikenakan Pajak Transaksi lagi.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                    >
                      Simpan Pengaturan Pajak
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'meja' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200 shadow-2xs">
                          <Table2 className="text-emerald-700" size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Pusat Manajemen Meja Dine-In</h3>
                          <p className="text-xs text-slate-500">
                            Pengelolaan meja, pelacakan pesanan aktif, ketersediaan meja, dan cetak QR stand meja kini dikelola mandiri pada menu Meja di sidebar.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/meja"
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition shrink-0"
                      >
                        <span>Buka Menu Meja</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status Ringkasan Meja
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Total: <strong className="text-slate-900">{tables?.length || 0} Meja Terdaftar</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                        <span className="text-xs text-slate-500 block">Total Meja Terdaftar</span>
                        <span className="text-xl font-black text-slate-800">{tables?.length || 0}</span>
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                        <span className="text-xs text-emerald-700 block">Meja Aktif</span>
                        <span className="text-xl font-black text-emerald-700">
                          {tables?.filter((t) => t.active !== false).length || 0}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                        <span className="text-xs text-slate-400 block">Nonaktif</span>
                        <span className="text-xl font-black text-slate-500">
                          {tables?.filter((t) => t.active === false).length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-xs text-sky-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5 text-sky-800">
                        <Info size={14} className="text-sky-600" />
                        Pembedaan Tegas QR Meja vs QRIS Pembayaran
                      </div>
                      <p className="text-sky-700 leading-relaxed text-[11px]">
                        • <strong>QR Meja:</strong> Digunakan untuk identifikasi meja fisik dan pemesanan mandiri tamu (dicetak dan diletakkan di stand meja).<br />
                        • <strong>QRIS:</strong> Standar pembayaran digital nasional yang terintegrasi di kasir bersama Tunai, DANA, OVO, GoPay, ShopeePay, dan Transfer Bank (dikelola pada tab <em>Pembayaran</em>).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifikasi' && (() => {
                const lowStockThreshold = Number(minStockInput) > 0 ? Number(minStockInput) : 5;
                const lowStockItems = products.filter(
                  (p) => p.status === 'Aktif' && Number(p.stok || 0) > 0 && Number(p.stok || 0) <= lowStockThreshold
                );
                const outOfStockItems = products.filter(
                  (p) => p.status === 'Aktif' && Number(p.stok || 0) <= 0
                );
                const activePromoItems = products.filter(
                  (p) => p.status === 'Aktif' && metaMap[p.id]?.promoActive
                );

                return (
                  <div className="space-y-6">
                    <div className="divide-y divide-slate-100">
                      <div>
                        <Toggle
                          enabled={toggles.notifTransaksi}
                          onChange={(v) => setToggles({ ...toggles, notifTransaksi: v }, `Notifikasi transaksi baru ${v ? 'diaktifkan' : 'dinonaktifkan'}`)}
                          label="Notifikasi Transaksi Baru"
                          desc="Kirim notifikasi di browser dan banner saat pembayaran transaksi baru selesai"
                        />
                        <div className="pb-3 pl-1 flex items-center gap-2">
                          <span className="text-xs text-slate-500">Izin Browser:</span>
                          {browserNotifPerm === 'granted' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <Check size={11} /> Diizinkan
                            </span>
                          ) : browserNotifPerm === 'denied' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Diblokir di Pengaturan Browser
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={requestBrowserNotif}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <Bell size={12} />
                              Minta Izin Notifikasi Browser
                            </button>
                          )}
                        </div>
                      </div>

                      <Toggle
                        enabled={toggles.notifStok}
                        onChange={(v) => setToggles({ ...toggles, notifStok: v }, `Peringatan stok menipis ${v ? 'diaktifkan' : 'dinonaktifkan'}`)}
                        label="Peringatan Stok Menipis"
                        desc="Tampilkan status peringatan saat stok produk berada di bawah batas minimum"
                      />

                      <Toggle
                        enabled={toggles.notifStokHabis}
                        onChange={(v) => setToggles({ ...toggles, notifStokHabis: v }, `Peringatan stok habis ${v ? 'diaktifkan' : 'dinonaktifkan'}`)}
                        label="Notifikasi Stok Habis"
                        desc="Tampilkan status peringatan saat produk aktif memiliki stok 0 (habis)"
                      />

                      <Toggle
                        enabled={toggles.notifPromo}
                        onChange={(v) => setToggles({ ...toggles, notifPromo: v }, `Info promo & update ${v ? 'diaktifkan' : 'dinonaktifkan'}`)}
                        label="Promo & Info Terbaru"
                        desc="Tampilkan ringkasan promosi aktif barang dan status versi aplikasi"
                      />
                    </div>

                    {/* Threshold Setting Section */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            Batas Minimum Stok (Threshold Peringatan)
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Produk aktif dengan stok sama atau di bawah angka ini akan ditandai menipis.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={minStockInput}
                            onChange={handleMinStockChange}
                            onBlur={() => {
                              const val = Math.max(1, Number(minStockInput) || 5);
                              setMinStockInput(val);
                              updateSettings({ minStockThreshold: val });
                              showToast(`Batas minimum stok disimpan (${val})`);
                            }}
                            className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-extrabold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                          />
                          <span className="text-xs font-semibold text-slate-500">Unit / Pcs</span>
                        </div>
                      </div>

                      {/* Live Status of Low Stock Products */}
                      <div className="pt-2 border-t border-slate-100">
                        {lowStockItems.length > 0 ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-900 flex-1">
                              <p className="font-bold">
                                Ditemukan {lowStockItems.length} barang aktif dengan stok menipis (≤ {lowStockThreshold}):
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {lowStockItems.slice(0, 6).map((item) => (
                                  <span
                                    key={item.id}
                                    className="rounded-md bg-white border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs"
                                  >
                                    {item.nama} · <b className="text-red-600">{item.stok} {item.satuan || 'pcs'}</b>
                                  </span>
                                ))}
                                {lowStockItems.length > 6 && (
                                  <span className="text-[11px] text-amber-700 py-0.5 font-medium">
                                    +{lowStockItems.length - 6} lainnya
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 flex items-center gap-2 text-xs text-emerald-800">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>Semua barang aktif saat ini berada dalam batas stok aman ({'>'} {lowStockThreshold} unit).</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Out of Stock Status Section */}
                    {outOfStockItems.length > 0 && (
                      <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 space-y-2">
                        <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                          <AlertTriangle size={16} className="text-red-600" />
                          <span>Peringatan Stok Habis (0 Unit)</span>
                        </div>
                        <p className="text-xs text-red-700">
                          Terdapat <b>{outOfStockItems.length}</b> barang aktif yang stoknya habis:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {outOfStockItems.slice(0, 8).map((item) => (
                            <span
                              key={item.id}
                              className="rounded-md bg-white border border-red-200 px-2 py-0.5 text-[11px] font-bold text-red-700"
                            >
                              {item.nama} (0 {item.satuan || 'pcs'})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Promos Section */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-emerald-600" />
                          <h4 className="text-sm font-bold text-slate-800">
                            Daftar Promo Aktif di Aplikasi
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          Versi Sistem: 2.4.0
                        </span>
                      </div>

                      {activePromoItems.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600">
                            Saat ini ada <b>{activePromoItems.length}</b> barang dengan promosi yang aktif:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {activePromoItems.map((item) => {
                              const meta = metaMap[item.id];
                              const promoDisc = meta?.promoType === 'persen' ? `${meta.promoValue}%` : formatRupiah(meta?.promoValue || 0);
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-bold text-slate-800 truncate">{item.nama}</p>
                                    <p className="text-[11px] text-slate-500">{meta?.promoTitle || 'Promosi Toko'}</p>
                                  </div>
                                  <span className="shrink-0 rounded-lg bg-red-100 text-red-700 px-2 py-1 text-[11px] font-extrabold">
                                    Potongan {promoDisc}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                          <Tag size={20} className="mx-auto text-slate-300 mb-1" />
                          <p className="text-xs font-semibold text-slate-600">
                            Saat ini tidak ada promo yang aktif di aplikasi.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Anda dapat mengaktifkan promo atau Buy 1 Get 1 melalui menu Informasi Barang.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'keamanan' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Pengaturan keamanan akun dan sesi login aplikasi.
                  </p>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <GoogleIcon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">Masuk dengan Google</p>
                          {googleLinked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <Check size={10} />
                              Terhubung
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Tidak aktif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {googleLinked
                            ? `Anda masuk dengan akun Google: ${googleEmail || auth.currentUser?.email || '-'}`
                            : 'Aplikasi ini menggunakan login Google-only.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-sm font-semibold text-slate-700">Keamanan Akun</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Kata sandi dan verifikasi identitas dikelola sepenuhnya oleh Google.
                      Untuk mengubah kata sandi atau keamanan akun, buka pengaturan akun Google Anda.
                    </p>
                  </div>
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Metode Pembayaran Kasir</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih metode pembayaran yang diizinkan untuk transaksi baru. Metode yang dinonaktifkan di sini otomatis tidak akan muncul di halaman Transaksi/Kasir.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        category: 'Tunai',
                        desc: 'Transaksi tunai fisik langsung di kasir.',
                        items: [
                          { id: 'Tunai', label: 'Tunai (Cash)', desc: 'Menerima pembayaran uang tunai fisik' },
                        ],
                      },
                      {
                        category: 'QRIS',
                        desc: 'Standar pembayaran digital satu QR untuk semua e-wallet & mobile banking.',
                        items: [
                          { id: 'QRIS', label: 'QRIS', desc: 'Scan QRIS dari semua aplikasi e-wallet & perbankan' },
                        ],
                      },
                      {
                        category: 'Dompet Digital (E-Wallet)',
                        desc: 'Pembayaran melalui aplikasi dompet digital nasional.',
                        items: [
                          { id: 'GoPay', label: 'GoPay', desc: 'Konfirmasi pembayaran via GoPay' },
                          { id: 'OVO', label: 'OVO', desc: 'Konfirmasi pembayaran via OVO' },
                          { id: 'DANA', label: 'DANA', desc: 'Konfirmasi pembayaran via DANA' },
                          { id: 'ShopeePay', label: 'ShopeePay', desc: 'Konfirmasi pembayaran via ShopeePay' },
                          { id: 'LinkAja', label: 'LinkAja', desc: 'Konfirmasi pembayaran via LinkAja' },
                        ],
                      },
                      {
                        category: 'Transfer Bank',
                        desc: 'Transfer langsung ke rekening toko (BCA, Mandiri, BRI, BNI, dll).',
                        items: [
                          { id: 'Transfer Bank', label: 'Transfer Bank', desc: 'Konfirmasi manual bukti transfer bank toko' },
                        ],
                      },
                      {
                        category: 'Kartu Debit & Kredit',
                        desc: 'Pembayaran melalui mesin EDC kartu perbankan.',
                        items: [
                          { id: 'Kartu Debit', label: 'Kartu Debit', desc: 'Menerima gesek/tap kartu debit bank' },
                          { id: 'Kartu Kredit', label: 'Kartu Kredit', desc: 'Menerima kartu kredit Visa / Mastercard' },
                        ],
                      },
                    ].map((group) => (
                      <div
                        key={group.category}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                      >
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {group.category}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{group.desc}</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {group.items.map((item) => {
                            const isEnabled = Boolean(paymentMethods?.[item.id] ?? true);

                            const handleToggle = () => {
                              const activeCount = Object.entries(paymentMethods || {}).filter(
                                ([k, v]) => Boolean(v)
                              ).length;

                              if (isEnabled && activeCount <= 1) {
                                showToast('Minimal satu metode pembayaran harus tetap aktif');
                                return;
                              }

                              const nextState = !isEnabled;
                              updatePaymentSettings({ [item.id]: nextState });
                              showToast(
                                `${item.label} ${nextState ? 'diaktifkan' : 'dinonaktifkan'}`
                              );
                            };

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between py-2.5"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{item.label}</p>
                                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleToggle}
                                  className="text-emerald-600 transition"
                                  aria-label={`Toggle ${item.label}`}
                                >
                                  {isEnabled ? (
                                    <ToggleRight size={28} className="text-emerald-600" />
                                  ) : (
                                    <ToggleLeft size={28} className="text-slate-300" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-600">
                    <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Status aktif/nonaktif di atas langsung berlaku untuk semua kasir pada halaman Transaksi. Pembayaran non-tunai tetap membutuhkan verifikasi manual bukti bayar oleh kasir untuk keamanan toko.
                    </p>
                  </div>
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
