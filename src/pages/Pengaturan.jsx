import React, { useState, useEffect } from 'react';
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
  Loader2,
  Unlink,
} from 'lucide-react';
import { onAuthStateChanged, linkWithPopup, unlink, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { googleProvider } from '../config/auth';
import GoogleIcon from '../components/common/GoogleIcon';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openTestReceipt } from '../utils/receipt';
import { getNotifPrefs, saveNotifPrefs } from '../utils/storage';

const tabs = [
  { id: 'profil', label: 'Profil & Branding', icon: Store },
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
  const { storeProfile, updateStoreProfile, printerSettings, updatePrinterSettings, tables, addTable, updateTable, deleteTable } = useData();
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('profil');
  const [toast, setToast] = useState('');
  const [form, setForm] = useState(storeProfile || { nama: '', pemilik: '', alamat: '', telepon: '', email: '', footerStruk: '' });

  const paperSize = printerSettings.paperSize || '58';

  const [toggles, setTogglesState] = useState(() => {
    const prefs = getNotifPrefs();
    return {
      notifTransaksi: prefs.notifTransaksi ?? true,
      notifStok: prefs.notifStok ?? true,
      notifPromo: prefs.notifPromo ?? false,
      printerThermal: true,
      autoCetak: printerSettings?.autoPrint ?? true,
    };
  });

  const setToggles = (newVal) => {
    setTogglesState(newVal);
    saveNotifPrefs({
      notifTransaksi: newVal.notifTransaksi,
      notifStok: newVal.notifStok,
      notifPromo: newVal.notifPromo,
    });
  };

  const [paymentEnabled, setPaymentEnabled] = useState({
    Tunai: true,
    QRIS: true,
    Transfer: true,
    'Kartu Debit': false,
  });

  const [tableForm, setTableForm] = useState({ name: '' });
  const [editingTable, setEditingTable] = useState(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [previewTable, setPreviewTable] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Status koneksi Google untuk akun Qurma yang sedang login.
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

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    setGoogleBusy(true);
    try {
      await linkWithPopup(auth.currentUser, googleProvider);
      showToast('Akun Google berhasil dihubungkan');
    } catch (err) {
      const code = err && err.code ? err.code : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      if (code === 'auth/credential-already-in-use' || code === 'auth/account-exists-with-different-credential') {
        showToast('Akun Google ini sudah terhubung ke akun lain. Gunakan akun Google lain.');
        return;
      }
      showToast('Gagal menghubungkan Google. Coba lagi.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!auth.currentUser) return;
    setGoogleBusy(true);
    try {
      await unlink(auth.currentUser, GoogleAuthProvider.PROVIDER_ID);
      showToast('Koneksi Google dilepas dari akun Qurma');
    } catch (err) {
      showToast('Gagal melepas koneksi Google.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    updateStoreProfile(form);
    showToast('Profil toko berhasil disimpan');
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    const name = tableForm.name.trim();
    if (!name) return;
    addTable({ name });
    setTableForm({ name: '' });
    setTableModalOpen(false);
    showToast(`Meja "${name}" berhasil ditambahkan`);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setTableForm({ name: table.name });
    setTableModalOpen(true);
  };

  const handleUpdateTable = (e) => {
    e.preventDefault();
    const name = tableForm.name.trim();
    if (!name || !editingTable) return;
    updateTable({ id: editingTable.id, name });
    setEditingTable(null);
    setTableForm({ name: '' });
    setTableModalOpen(false);
    showToast(`Meja berhasil diperbarui`);
  };

  const handleToggleTableActive = (table) => {
    updateTable({ id: table.id, active: !table.active });
    showToast(`Meja "${table.name}" ${table.active ? 'dinonaktifkan' : 'diaktifkan'}`);
  };

  const handleDeleteTable = (table) => {
    deleteTable(table.id);
    showToast(`Meja "${table.name}" dihapus`);
  };

  const handleQrisUpload = (table, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateTable({ id: table.id, qrisImage: reader.result });
      showToast(`QRIS "${table.name}" berhasil diunggah`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveQris = (table) => {
    updateTable({ id: table.id, qrisImage: '' });
    showToast(`QRIS "${table.name}" dihapus`);
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

              {activeTab === 'meja' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Daftar Meja</p>
                      <p className="text-xs text-slate-500">Kelola meja dan QRIS pembayaran per meja</p>
                    </div>
                    <button
                      onClick={() => { setEditingTable(null); setTableForm({ name: '' }); setTableModalOpen(true); }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                    >
                      <Plus size={15} />
                      Tambah Meja
                    </button>
                  </div>

                  {tables.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center">
                      <Table2 size={32} className="text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada meja</p>
                      <p className="text-xs text-slate-400">Klik "Tambah Meja" untuk membuat meja baru</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {tables.map((table) => (
                      <div
                        key={table.id}
                        className={`rounded-2xl border p-4 transition ${
                          table.active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <Table2 size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">{table.name}</p>
                              {!table.active && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                  Nonaktif
                                </span>
                              )}
                              {table.qrisImage && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  <QrCode size={10} />
                                  QRIS Aktif
                                </span>
                              )}
                              {!table.qrisImage && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                  QRIS Belum Diunggah
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Dibuat: {new Date(table.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleTableActive(table)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                              title={table.active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {table.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              onClick={() => handleEditTable(table)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                              title="Edit nama meja"
                            >
                              <Store size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTable(table)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Hapus meja"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* QRIS section */}
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="mb-2 text-xs font-semibold text-slate-600">QRIS Pembayaran</p>
                          {table.qrisImage ? (
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => setPreviewTable(table)}
                                className="shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm transition hover:shadow-md"
                              >
                                <img
                                  src={table.qrisImage}
                                  alt={`QRIS ${table.name}`}
                                  className="h-20 w-20 object-contain"
                                />
                              </button>
                              <div className="flex-1 space-y-2">
                                <p className="text-xs text-slate-500">QRIS sudah diunggah. Pelanggan akan memindai QR ini saat pembayaran.</p>
                                <div className="flex gap-2">
                                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                                    <Upload size={12} />
                                    Ganti
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleQrisUpload(table, e)}
                                    />
                                  </label>
                                  <button
                                    onClick={() => handleRemoveQris(table)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                  >
                                    <Trash2 size={12} />
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 py-6 text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                <ImageOff size={22} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-amber-700">QRIS belum tersedia untuk meja ini</p>
                                <p className="text-[11px] text-amber-500">Unggah gambar QRIS asli dari merchant</p>
                              </div>
                              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-amber-600">
                                <Upload size={13} />
                                Upload QRIS
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleQrisUpload(table, e)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table add/edit modal */}
                  {tableModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { setTableModalOpen(false); setEditingTable(null); }} />
                      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                          <h3 className="text-base font-bold text-slate-800">
                            {editingTable ? 'Edit Meja' : 'Tambah Meja'}
                          </h3>
                          <button onClick={() => { setTableModalOpen(false); setEditingTable(null); }} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                            <X size={18} />
                          </button>
                        </div>
                        <form onSubmit={editingTable ? handleUpdateTable : handleAddTable} className="space-y-4 px-6 py-5">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Meja *</label>
                            <input
                              required
                              value={tableForm.name}
                              onChange={(e) => setTableForm({ name: e.target.value })}
                              placeholder="cth: Meja 1"
                              className={inputClass}
                            />
                          </div>
                          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button type="button" onClick={() => { setTableModalOpen(false); setEditingTable(null); }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                              Batal
                            </button>
                            <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500">
                              {editingTable ? 'Simpan' : 'Tambah'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* QRIS preview modal */}
                  {previewTable && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPreviewTable(null)} />
                      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                          <h3 className="text-base font-bold text-slate-800">QRIS {previewTable.name}</h3>
                          <button onClick={() => setPreviewTable(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                            <X size={18} />
                          </button>
                        </div>
                        <div className="flex flex-col items-center gap-4 px-6 py-8">
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <img
                              src={previewTable.qrisImage}
                              alt={`QRIS ${previewTable.name}`}
                              className="h-56 w-56 object-contain"
                            />
                          </div>
                          <p className="text-sm font-bold text-slate-800">{previewTable.name}</p>
                          <p className="text-xs text-slate-400">Scan QR ini untuk membayar di {previewTable.name}</p>
                        </div>
                        <div className="border-t border-slate-100 px-6 py-4">
                          <button
                            onClick={() => setPreviewTable(null)}
                            className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="text-[11px] leading-relaxed text-amber-800">
                      <p className="font-bold">Tips QRIS per meja:</p>
                      <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                        <li>Gunakan QRIS asli dari merchant/payment provider Anda.</li>
                        <li>Unggah gambar QRIS sebagai foto/template dari provider.</li>
                        <li>Setiap meja bisa memiliki QRIS yang berbeda jika diperlukan.</li>
                        <li>QRIS palsu tidak akan bisa menerima pembayaran nyata.</li>
                      </ol>
                    </div>
                  </div>
                </div>
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
                              Belum terhubung
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {googleLinked
                            ? `Akun Google: ${googleEmail || auth.currentUser?.email || '-'}`
                            : 'Hubungkan akun Google agar bisa masuk dengan tombol "Masuk dengan Google" di halaman login.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      {googleLinked ? (
                        <button
                          type="button"
                          disabled={googleBusy}
                          onClick={handleUnlinkGoogle}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          {googleBusy ? <Loader2 size={15} className="animate-spin" /> : <Unlink size={15} />}
                          Lepas Koneksi Google
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={googleBusy}
                          onClick={handleLinkGoogle}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {googleBusy ? <Loader2 size={15} className="animate-spin" /> : <GoogleIcon size={15} />}
                          Hubungkan Google
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-sm font-semibold text-slate-700">Lupa Password</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Gunakan tombol "Lupa password?" di halaman login. Tautan reset akan dikirim ke email akun Qurma.
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
