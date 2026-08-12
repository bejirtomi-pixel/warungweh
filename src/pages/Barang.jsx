import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  PackageX,
  X,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';

const categories = ['Semua', 'Minuman', 'Makanan', 'Cemilan'];
const statusOptions = ['Semua', 'Aktif', 'Nonaktif'];

const emptyForm = { nama: '', kode: '', kategori: 'Minuman', harga: '', stok: '', satuan: 'Pcs', status: 'Aktif', foto: '' };

function ProductThumb({ src, size = 'md' }) {
  const [error, setError] = React.useState(false);
  const box =
    size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl';

  if (!src || error) {
    return (
      <div className={`flex ${box} shrink-0 items-center justify-center bg-emerald-100 text-emerald-700`}>
        <Package size={size === 'sm' ? 15 : 18} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Foto produk"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${box} shrink-0 object-cover shadow-sm`}
    />
  );
}

export default function Barang() {
  const { products, formatRupiah, addProduct, updateProduct, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState('');

  const perPage = 8;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.kode.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'Semua' || p.kategori === category;
      const matchStatus = status === 'Semua' || p.status === status;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setForm({
      nama: product.nama,
      kode: product.kode,
      kategori: product.kategori,
      harga: product.harga,
      stok: product.stok,
      satuan: product.satuan,
      status: product.status,
      foto: product.foto || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      harga: Number(form.harga) || 0,
      stok: Number(form.stok) || 0,
    };
    if (editingId) {
      updateProduct({ ...payload, id: editingId });
      showToast('Barang berhasil diperbarui');
    } else {
      addProduct({ ...payload, kode: form.kode || `BRG-${String(Date.now()).slice(-4)}` });
      setPage(1);
      showToast('Barang berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteProduct(id);
    setConfirmDelete(null);
    showToast('Barang berhasil dihapus');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Data Barang</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola daftar produk, harga, dan stok Qurmacel Store.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Plus size={17} />
            Tambah Barang
          </button>
        </div>

        {/* Filter toolbar */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau kode barang..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table with watermark */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <LogoWatermark size="lg" />

          <div className="relative z-10 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5 font-semibold">Kode</th>
                  <th className="px-5 py-3.5 font-semibold">Nama Barang</th>
                  <th className="px-5 py-3.5 font-semibold">Kategori</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Harga</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Stok</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((product) => (
                  <tr key={product.id} className="bg-white transition hover:bg-emerald-50/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">
                      {product.kode}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={product.foto} />
                        <span className="font-semibold text-slate-800">{product.nama}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {product.kategori}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                      {formatRupiah(product.harga)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`font-bold ${product.stok <= 10 ? 'text-red-600' : 'text-slate-700'}`}
                      >
                        {product.stok}
                      </span>
                      <span className="ml-1 text-xs text-slate-400">{product.satuan}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {product.status === 'Aktif' && <CheckCircle2 size={12} />}
                        {product.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(product)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paged.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <PackageX size={26} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">Tidak ada barang ditemukan</p>
                <p className="text-xs text-slate-400">Coba ubah kata kunci atau filter pencarian.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
            <p className="text-xs text-slate-500">
              Menampilkan <b>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</b>–
              <b>{Math.min(currentPage * perPage, filtered.length)}</b> dari{' '}
              <b>{filtered.length}</b> barang
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingId ? 'Edit Barang' : 'Tambah Barang'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingId ? 'Perbarui informasi produk' : 'Isi data produk baru'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Barang *</label>
                  <input
                    required
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className={inputClass}
                    placeholder="cth: Kopi Susu"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Kode Barang</label>
                  <input
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    className={inputClass}
                    placeholder="cth: BRG-013"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Kategori *</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    className={inputClass}
                  >
                    <option>Minuman</option>
                    <option>Makanan</option>
                    <option>Cemilan</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Satuan</label>
                  <input
                    value={form.satuan}
                    onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                    className={inputClass}
                    placeholder="cth: Pcs"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Harga Jual (Rp) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.harga}
                    onChange={(e) => setForm({ ...form, harga: e.target.value })}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Stok *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stok}
                    onChange={(e) => setForm({ ...form, stok: e.target.value })}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Link Foto Produk</label>
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      {form.foto ? (
                        <img
                          src={form.foto}
                          alt="Preview foto produk"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={(e) => {
                            e.currentTarget.style.display = '';
                          }}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={form.foto}
                        onChange={(e) => setForm({ ...form, foto: e.target.value })}
                        className={inputClass}
                        placeholder="https://contoh.com/gambar-produk.jpg"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Tempel URL gambar produk. Kosongkan jika tidak ada foto.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
                  <div className="flex gap-3">
                    {['Aktif', 'Nonaktif'].map((s) => (
                      <label
                        key={s}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                          form.status === s
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={form.status === s}
                          onChange={() => setForm({ ...form, status: s })}
                          className="hidden"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">Hapus Barang?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Barang <b>{confirmDelete.nama}</b> akan dihapus permanen dari daftar.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 transition hover:bg-red-500"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

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
