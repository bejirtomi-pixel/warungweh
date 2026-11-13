import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Upload,
  ImageOff,
  Tags,
  Barcode,
  Printer,
  Eye,
  Info,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Power,
  Ban,
  AlertTriangle,
  ShieldAlert,
  Coins,
  Layers,
  Check,
  ShoppingBag,
  Table2,
  Truck,
} from 'lucide-react';
import LogoWatermark from '../components/common/LogoWatermark';
import BarcodeLabel from '../components/common/BarcodeLabel';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import { useData } from '../context/DataContext';
import { fileToDataUrl } from '../utils/image';

const statusFilterOptions = ['Semua', 'Aktif', 'Nonaktif'];
const COMMON_UNITS = ['Pcs', 'botol', 'bungkus', 'sachet', 'kg', 'liter', 'kaleng', 'porsi', 'box'];

const emptyForm = {
  nama: '',
  kode: '',
  kategori: 'Minuman',
  hargaModal: '',
  harga: '',
  stok: '',
  minStok: '',
  satuan: 'Pcs',
  status: 'Aktif',
  foto: '',
  pajakAktif: false,
  pajakJenis: 'PPN',
  pajakPersen: 10,
  availableServices: ['pickup'],
};

function ProductThumb({ src, size = 'md' }) {
  const [error, setError] = React.useState(false);
  const box = size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-11 w-11 rounded-xl';

  if (!src || error) {
    return (
      <div
        className={`flex ${box} shrink-0 items-center justify-center border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700`}
      >
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
      className={`${box} shrink-0 border border-slate-200 bg-slate-100 object-cover shadow-xs`}
    />
  );
}

export default function Barang() {
  const {
    products,
    productMeta,
    categories,
    transactions,
    formatRupiah,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    minStockThreshold,
  } = useData();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [page, setPage] = useState(1);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [previewError, setPreviewError] = useState(false);

  // Status toggle confirmation modal
  const [statusConfirmModal, setStatusConfirmModal] = useState(null);

  // Delete modal state (with dependency check)
  const [deleteModal, setDeleteModal] = useState(null);

  // Category manager modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Barcode print label modal
  const [barcodePrintLabel, setBarcodePrintLabel] = useState(null);

  // Product detail drawer
  const [detailProduct, setDetailProduct] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState('');

  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  const perPage = 8;

  // Filter gabungan (search + category + status)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const nama = (p.nama || p.name || '').toLowerCase();
      const kode = (p.kode || p.kode_barang || p.barcode || '').toLowerCase();
      const kategori = (p.kategori || p.category || '').toLowerCase();
      const productStatus = (p.status || 'Aktif').toLowerCase();

      const matchSearch = !q || nama.includes(q) || kode.includes(q);
      const matchCategory =
        category === 'Semua' || kategori === category.toLowerCase();
      const matchStatus =
        status === 'Semua' || productStatus === status.toLowerCase();

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, category, status]);

  const isFiltered =
    search.trim() !== '' || category !== 'Semua' || status !== 'Semua';

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleResetFilter = () => {
    setSearch('');
    setCategory('Semua');
    setStatus('Semua');
    setPage(1);
    showToast('Filter pencarian direset');
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, availableServices: ['pickup'] });
    setPreviewError(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    const existingServices = Array.isArray(product.availableServices) && product.availableServices.length > 0
      ? [...product.availableServices]
      : (product.availableInPickup || product.availableInDineIn || product.availableInDelivery)
        ? [
            ...(product.availableInPickup ? ['pickup'] : []),
            ...(product.availableInDineIn ? ['dinein'] : []),
            ...(product.availableInDelivery ? ['delivery'] : []),
          ]
        : product.isDineInOnly
        ? ['dinein']
        : ['pickup'];

    setForm({
      nama: product.nama || '',
      kode: product.kode || '',
      kategori: product.kategori || 'Minuman',
      hargaModal: product.hargaModal ?? '',
      harga: product.harga ?? '',
      stok: product.stok ?? '',
      minStok:
        product.minStok !== undefined && product.minStok !== null
          ? product.minStok
          : '',
      satuan: product.satuan || 'Pcs',
      status: product.status || 'Aktif',
      foto: product.foto || '',
      pajakAktif: Boolean(product.pajakAktif),
      pajakJenis: product.pajakJenis || 'PPN',
      pajakPersen:
        product.pajakPersen !== undefined && product.pajakPersen !== null
          ? product.pajakPersen
          : 10,
      availableServices: existingServices,
    });
    setPreviewError(false);
    setModalOpen(true);
  };

  const handleToggleService = (srv) => {
    setForm((prev) => {
      const cur = Array.isArray(prev.availableServices) ? prev.availableServices : ['pickup'];
      const exists = cur.includes(srv);
      const next = exists ? cur.filter((s) => s !== srv) : [...cur, srv];
      return { ...prev, availableServices: next };
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((f) => ({ ...f, foto: dataUrl }));
      setPreviewError(false);
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah foto');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setNewCategory('');
    showToast(`Kategori "${trimmed}" ditambahkan`);
  };

  // Submit Tambah / Edit Barang
  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedNama = form.nama.trim();
    if (!trimmedNama) {
      showToast('Nama barang wajib diisi!');
      return;
    }

    const kode = form.kode.trim() || `BRG-${String(Date.now()).slice(-4)}`;

    // Pengecekan kode duplikat
    if (!editingId) {
      const duplicate = products.some(
        (p) => p.kode && p.kode.toLowerCase() === kode.toLowerCase()
      );
      if (duplicate) {
        showToast(`Kode "${kode}" sudah digunakan produk lain!`);
        return;
      }
    } else {
      const duplicate = products.some(
        (p) =>
          p.id !== editingId &&
          p.kode &&
          p.kode.toLowerCase() === kode.toLowerCase()
      );
      if (duplicate) {
        showToast(`Kode "${kode}" sudah digunakan produk lain!`);
        return;
      }
    }

    const payload = {
      ...form,
      nama: trimmedNama,
      kode,
      hargaModal: Math.max(0, Number(form.hargaModal) || 0),
      harga: Math.max(0, Number(form.harga) || 0),
      stok: Math.max(0, Number(form.stok) || 0),
      minStok: Math.max(0, Number(form.minStok) || 0),
      satuan: form.satuan.trim() || 'Pcs',
      pajakAktif: Boolean(form.pajakAktif),
      pajakJenis: form.pajakJenis || 'PPN',
      pajakPersen: Math.min(100, Math.max(0, Number(form.pajakPersen) || 0)),
      availableServices: Array.isArray(form.availableServices) ? form.availableServices : ['pickup'],
    };

    if (editingId) {
      updateProduct({ ...payload, id: editingId });
      showToast(`Barang "${trimmedNama}" berhasil diperbarui`);
    } else {
      addProduct(payload);
      setPage(1);
      showToast(`Barang "${trimmedNama}" berhasil ditambahkan`);
    }
    setModalOpen(false);
  };

  // =========================================================
  // 5. PENGELOLAAN STATUS (NONAKTIFKAN / AKTIFKAN)
  // =========================================================
  const handleRequestToggleStatus = (product) => {
    const nextStatus = product.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    setStatusConfirmModal({
      product,
      nextStatus,
    });
  };

  const handleConfirmToggleStatus = () => {
    if (!statusConfirmModal?.product) return;
    const { product, nextStatus } = statusConfirmModal;
    updateProduct({
      ...product,
      status: nextStatus,
    });
    setStatusConfirmModal(null);
    showToast(
      `Barang "${product.nama}" berhasil ${
        nextStatus === 'Aktif' ? 'diaktifkan kembali' : 'dinonaktifkan'
      }`
    );
  };

  // =========================================================
  // 5. PENGELOLAAN HAPUS PERMANEN (DENGAN CEK DEPENDENSI TRANSAKSI)
  // =========================================================
  const checkProductUsageInTransactions = (product) => {
    if (!product) return { isUsed: false, count: 0 };
    const matched = (transactions || []).filter((t) => {
      return (t.items || []).some(
        (it) =>
          it.id === product.id ||
          (product.kode && it.kode === product.kode) ||
          (it.nama && it.nama.toLowerCase() === product.nama.toLowerCase())
      );
    });
    return {
      isUsed: matched.length > 0,
      count: matched.length,
    };
  };

  const handleRequestDelete = (product) => {
    const usage = checkProductUsageInTransactions(product);
    setDeleteModal({
      product,
      isUsed: usage.isUsed,
      count: usage.count,
    });
  };

  const handleConfirmPermanentDelete = () => {
    if (!deleteModal?.product) return;
    deleteProduct(deleteModal.product.id);
    showToast(`Barang "${deleteModal.product.nama}" berhasil dihapus permanen`);
    setDeleteModal(null);
  };

  const handleDeactivateFromDeleteModal = () => {
    if (!deleteModal?.product) return;
    updateProduct({
      ...deleteModal.product,
      status: 'Nonaktif',
    });
    showToast(`Barang "${deleteModal.product.nama}" telah dinonaktifkan`);
    setDeleteModal(null);
  };

  // Cetak Barcode label
  const handlePrintBarcode = (product) => {
    setBarcodePrintLabel(product);
  };

  const handlePrintBarcodeConfirm = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) {
      showToast('Izinkan pop-up untuk mencetak barcode');
      return;
    }
    const svgEl = document.getElementById('barcode-print-preview');
    const svgData = svgEl ? svgEl.outerHTML : '';
    printWindow.document.write(`<!doctype html><html><head><title>Cetak Barcode</title>
<style>
  @page { size: auto; margin: 5mm; }
  body { font-family: monospace; text-align: center; margin: 0; padding: 0; }
  .label { display: inline-block; margin: 3mm; text-align: center; page-break-inside: avoid; }
  .name { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
  .price { font-size: 10px; margin-bottom: 2px; }
  svg { max-width: 50mm; }
</style></head><body>
<div class="label">
  <div class="name">${barcodePrintLabel.nama}</div>
  ${svgData}
  <div class="price">Rp ${Number(barcodePrintLabel.harga).toLocaleString('id-ID')}</div>
</div>
<script>window.onload = function(){ window.print(); window.close(); }<\/script>
</body></html>`);
    printWindow.document.close();
    setBarcodePrintLabel(null);
    showToast('Barcode dikirim ke printer');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
              Data Barang
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola daftar master produk, harga modal, harga jual, dan stok
              minimum toko.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98"
          >
            <Plus size={17} />
            <span>Tambah Barang</span>
          </button>
        </div>

        {/* Banner Penghubung ke Halaman Informasi Barang */}
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <Info size={17} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950">
                Pemisahan Peran: Data Barang vs Informasi Barang
              </p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                Halaman ini mengelola inventaris utama (nama, harga modal &amp; jual, stok, stok minimum, dan barcode). Untuk menandai <b>Best Seller</b>, mengatur <b>Promo Diskon</b>, <b>Buy 1 Get 1</b>, atau <b>Deskripsi produk</b>, kelola melalui menu Informasi Barang.
              </p>
            </div>
          </div>
          <Link
            to="/informasi-barang"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 font-bold text-emerald-700 shadow-2xs hover:bg-emerald-50 transition shrink-0 self-start sm:self-auto"
          >
            <Sparkles size={13} />
            <span>Ke Informasi Barang</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* =========================================================
            2. PENCARIAN DAN FILTER (BISA DIGUNAKAN BERSAMAAN + RESET)
        ========================================================= */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center">
          {/* Kolom Pencarian Barcode / Nama */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama barang atau kode / scan barcode..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Kategori */}
            <div className="relative">
              <Filter
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-7 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Semua">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Kelola Kategori */}
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              title="Kelola Daftar Kategori"
            >
              <Tags size={14} />
              <span>Kategori</span>
            </button>

            {/* Filter Status Aktif / Nonaktif */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {statusFilterOptions.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>

            {/* Tombol Reset Filter (Aktif bila ada pencarian atau filter) */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                title="Reset semua filter pencarian"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            1. TABEL DATA BARANG DENGAN INDIKATOR STOK MENIPIS
        ========================================================= */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <LogoWatermark size="lg" />

          {/* Card List untuk Smartphone (HP < 640px) */}
          <div className="block sm:hidden divide-y divide-slate-100 relative z-10">
            {paged.map((product) => {
              const threshold =
                Number(product.minStok) > 0
                  ? Number(product.minStok)
                  : Number(minStockThreshold) > 0
                  ? Number(minStockThreshold)
                  : 5;
              const currentStok = Number(product.stok || 0);
              const isOutOfStock = currentStok <= 0;
              const isLowStock = currentStok > 0 && currentStok <= threshold;

              return (
                <div key={product.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <ProductThumb src={product.foto} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {product.nama}
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            product.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {product.status || 'Aktif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono text-[10px]">{product.kode || '-'}</span>
                        <span>•</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px]">{product.kategori}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.availableServices?.includes('pickup') && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Pickup
                          </span>
                        )}
                        {product.availableServices?.includes('dinein') && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Dine In
                          </span>
                        )}
                        {product.availableServices?.includes('delivery') && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Delivery
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {formatRupiah(product.harga)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Stok</span>
                      {isOutOfStock ? (
                        <span className="inline-block rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Menipis ({currentStok} {product.satuan || 'pcs'})
                        </span>
                      ) : (
                        <span className="font-bold text-slate-700 text-xs">
                          {currentStok} {product.satuan || 'pcs'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-dashed border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Detail</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintBarcode(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 cursor-pointer"
                    >
                      <Barcode size={12} />
                      <span>Barcode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestToggleStatus(product)}
                      className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title={product.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      <Power size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(product)}
                      className="p-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Data Barang untuk Tablet & Desktop (>= 640px) */}
          <div className="hidden sm:block relative z-10 overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-3.5">Kode / Barcode</th>
                  <th className="px-5 py-3.5">Nama Barang</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5 text-right">Harga Modal</th>
                  <th className="px-5 py-3.5 text-right">Harga Jual</th>
                  <th className="px-5 py-3.5 text-center">Stok &amp; Satuan</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paged.map((product) => {
                  const threshold =
                    Number(product.minStok) > 0
                      ? Number(product.minStok)
                      : Number(minStockThreshold) > 0
                      ? Number(minStockThreshold)
                      : 5;
                  const currentStok = Number(product.stok || 0);
                  const isOutOfStock = currentStok <= 0;
                  const isLowStock = currentStok > 0 && currentStok <= threshold;

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* Kode Barang / Barcode */}
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">
                        {product.kode || '-'}
                      </td>

                      {/* Nama Barang + Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProductThumb src={product.foto} />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate">
                              {product.nama}
                            </span>
                            {metaMap[product.id]?.deskripsi && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {metaMap[product.id].deskripsi}
                              </span>
                            )}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {product.availableServices?.includes('pickup') && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Pickup
                                </span>
                              )}
                              {product.availableServices?.includes('dinein') && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Dine In
                                </span>
                              )}
                              {product.availableServices?.includes('delivery') && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Delivery
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {product.kategori}
                        </span>
                      </td>

                      {/* Harga Modal (Format Rupiah) */}
                      <td className="px-5 py-3.5 text-right font-medium text-slate-500">
                        {formatRupiah(product.hargaModal || 0)}
                      </td>

                      {/* Harga Jual (Format Rupiah + Badge Pajak) */}
                      <td className="px-5 py-3.5 text-right font-extrabold text-emerald-700">
                        <div>{formatRupiah(product.harga)}</div>
                        {product.pajakAktif && (
                          <div className="mt-0.5">
                            <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                              {product.pajakJenis || 'PPN'} {product.pajakPersen || 0}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Stok dan Satuan (Format Konsisten & Indikator Menipis) */}
                      <td className="px-5 py-3.5 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-extrabold text-rose-700">
                            Habis (0 {product.satuan || 'pcs'})
                          </span>
                        ) : isLowStock ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">
                              <AlertTriangle size={11} />
                              {currentStok} {product.satuan || 'pcs'}
                            </span>
                            <span className="text-[10px] text-amber-600 mt-0.5">
                              Menipis (≤ {threshold})
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {currentStok}{' '}
                            <span className="text-slate-400 font-normal">
                              {product.satuan || 'pcs'}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Status Aktif / Nonaktif */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            product.status === 'Aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {product.status === 'Aktif' ? (
                            <CheckCircle2 size={12} className="text-emerald-600" />
                          ) : (
                            <Ban size={12} className="text-slate-400" />
                          )}
                          <span>{product.status || 'Aktif'}</span>
                        </span>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {/* 4. Lihat Detail Drawer */}
                          <button
                            type="button"
                            onClick={() => setDetailProduct(product)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                            title="Lihat Detail Produk"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Cetak Barcode Label */}
                          <button
                            type="button"
                            onClick={() => handlePrintBarcode(product)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
                            title="Cetak Barcode"
                          >
                            <Barcode size={16} />
                          </button>

                          {/* Edit Barang */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                            title="Edit Barang"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* 5A. Nonaktifkan / Aktifkan Barang */}
                          <button
                            type="button"
                            onClick={() => handleRequestToggleStatus(product)}
                            className={`rounded-lg p-2 transition ${
                              product.status === 'Aktif'
                                ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-700'
                                : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title={
                              product.status === 'Aktif'
                                ? 'Nonaktifkan Barang (Sembunyikan dari Kasir)'
                                : 'Aktifkan Kembali Barang'
                            }
                          >
                            <Power size={16} />
                          </button>

                          {/* 5B. Hapus Permanen */}
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(product)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Hapus Permanen Barang"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State */}
            {paged.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <PackageX size={26} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">
                  Tidak Ada Barang Ditemukan
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  {isFiltered
                    ? 'Tidak ada barang yang cocok dengan kata kunci atau filter saat ini. Coba reset filter.'
                    : 'Belum ada data barang di katalog toko. Tambahkan barang baru sekarang.'}
                </p>
                {isFiltered ? (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <RotateCcw size={13} />
                    Reset Filter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                  >
                    <Plus size={14} />
                    Tambah Barang Sekarang
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3">
            <p className="text-xs text-slate-500">
              Menampilkan{' '}
              <b>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</b>–
              <b>{Math.min(currentPage * perPage, filtered.length)}</b> dari{' '}
              <b>{filtered.length}</b> barang
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          3. FORMULIR TAMBAH & EDIT BARANG (DIKELOMPOKKAN JELAS)
      ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingId ? 'Edit Data Barang' : 'Tambah Barang Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingId
                    ? 'Perbarui spesifikasi produk, harga, stok, atau status'
                    : 'Lengkapi formulir 4 bagian untuk mendaftarkan barang baru'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-5">
              {/* GRUP 1: INFORMASI UTAMA */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Package size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Informasi Utama Produk
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Nama Barang *
                    </label>
                    <input
                      required
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      className={inputClass}
                      placeholder="cth: Kopi Susu Gula Aren"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Kode Barang / Barcode
                    </label>
                    <input
                      value={form.kode}
                      onChange={(e) => setForm({ ...form, kode: e.target.value })}
                      className={inputClass}
                      placeholder="Dibuat otomatis jika kosong"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Bisa diisi manual atau dipindai dengan barcode scanner.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Kategori Produk *
                    </label>
                    <select
                      value={form.kategori}
                      onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                      className={inputClass}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Satuan Produk *
                    </label>
                    <input
                      required
                      value={form.satuan}
                      onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                      className={inputClass}
                      placeholder="cth: Pcs, botol, bungkus, kg"
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-slate-400 mr-1">Pilihan cepat:</span>
                      {COMMON_UNITS.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setForm({ ...form, satuan: u })}
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium border transition ${
                            form.satuan.toLowerCase() === u.toLowerCase()
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Foto Produk */}
                  <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Foto Produk (Opsional)
                    </label>
                    <div className="flex items-start gap-3">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {form.foto ? (
                          <>
                            <img
                              src={form.foto}
                              alt="Preview produk"
                              referrerPolicy="no-referrer"
                              onError={() => setPreviewError(true)}
                              onLoad={() => setPreviewError(false)}
                              className="h-full w-full object-cover"
                            />
                            {previewError && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <ImageOff size={18} />
                                <span className="mt-1 px-1 text-center text-[9px] leading-tight">
                                  Foto rusak
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setForm({ ...form, foto: '' });
                                setPreviewError(false);
                              }}
                              className="absolute right-1 top-1 rounded-full bg-rose-500 p-1 text-white shadow transition hover:bg-rose-600"
                              title="Hapus foto"
                            >
                              <X size={11} />
                            </button>
                          </>
                        ) : (
                          <ImageIcon size={22} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-3.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100">
                          <Upload size={15} />
                          <span>Pilih Foto dari Perangkat</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="mt-1 text-[11px] text-slate-400 leading-tight">
                          Gambar disimpan langsung di sistem dan tampil di kasir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRUP 2: INFORMASI HARGA & PAJAK */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Coins size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Informasi Harga &amp; Pajak
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Harga Modal (Beli) (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.hargaModal}
                      onChange={(e) => setForm({ ...form, hargaModal: e.target.value })}
                      className={inputClass}
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Harga pokok kulakan/modal barang.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Harga Jual (Rp) *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.harga}
                      onChange={(e) => setForm({ ...form, harga: e.target.value })}
                      className={inputClass}
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Harga jual yang dibayar oleh pelanggan.
                    </p>
                  </div>

                  {/* Pajak Barang Section */}
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Pajak Per Barang
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Kenakan tarif pajak khusus per unit untuk barang ini di kasir
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={Boolean(form.pajakAktif)}
                          onChange={(e) =>
                            setForm({ ...form, pajakAktif: e.target.checked })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                      </label>
                    </div>

                    {form.pajakAktif && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Jenis Pajak
                          </label>
                          <select
                            value={form.pajakJenis || 'PPN'}
                            onChange={(e) =>
                              setForm({ ...form, pajakJenis: e.target.value })
                            }
                            className={inputClass}
                          >
                            <option value="PPN">PPN (Pajak Pertambahan Nilai)</option>
                            <option value="PB1">PB1 / Pajak Restoran</option>
                            <option value="PPH">PPh</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Tarif Pajak (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={form.pajakPersen}
                              onChange={(e) =>
                                setForm({ ...form, pajakPersen: e.target.value })
                              }
                              className={`${inputClass} pr-8`}
                              placeholder="10"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              %
                            </span>
                          </div>
                          {Number(form.harga) > 0 && (
                            <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                              Pajak:{' '}
                              {formatRupiah(
                                Math.round(
                                  (Number(form.harga) *
                                    (Number(form.pajakPersen) || 0)) /
                                    100
                                )
                              )}{' '}
                              / {form.satuan || 'unit'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GRUP 3: INFORMASI STOK & BATAS MINIMUM */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Layers size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    3. Informasi Stok &amp; Batas Minimum
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Stok Saat Ini *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.stok}
                      onChange={(e) => setForm({ ...form, stok: e.target.value })}
                      className={inputClass}
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Jumlah unit fisik barang di toko.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Stok Minimum (Batas Peringatan)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.minStok}
                      onChange={(e) => setForm({ ...form, minStok: e.target.value })}
                      className={inputClass}
                      placeholder={String(minStockThreshold || 5)}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Bila stok $\le$ batas ini, sistem memberi tanda peringatan (default toko: {minStockThreshold || 5}).
                    </p>
                  </div>
                </div>
              </div>

              {/* GRUP 4: STATUS BARANG */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Power size={16} className="text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    4. Status Ketersediaan Barang
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                      form.status === 'Aktif'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs ring-1 ring-emerald-500/30'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="form-status"
                      value="Aktif"
                      checked={form.status === 'Aktif'}
                      onChange={() => setForm({ ...form, status: 'Aktif' })}
                      className="hidden"
                    />
                    <CheckCircle2 size={16} className={form.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Aktif (Tersedia di Kasir)</span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                      form.status === 'Nonaktif'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-2xs ring-1 ring-amber-500/30'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="form-status"
                      value="Nonaktif"
                      checked={form.status === 'Nonaktif'}
                      onChange={() => setForm({ ...form, status: 'Nonaktif' })}
                      className="hidden"
                    />
                    <Ban size={16} className={form.status === 'Nonaktif' ? 'text-amber-600' : 'text-slate-400'} />
                    <span>Nonaktif (Sembunyikan)</span>
                  </label>
                </div>
              </div>

              {/* GRUP 5: KETERSEDIAAN JENIS LAYANAN (PICKUP, DINE IN, DELIVERY) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      5. Ketersediaan Jenis Layanan (Katalog Kasir &amp; QR)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Bisa pilih lebih dari satu
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Tentukan jenis layanan di mana produk ini dapat ditampilkan dan dipesan. Default produk baru hanya aktif di layanan <b>Pickup</b>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Layanan 1: Pickup */}
                  <div
                    onClick={() => handleToggleService('pickup')}
                    className={`flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition select-none ${
                      (form.availableServices || []).includes('pickup')
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={16} className={(form.availableServices || []).includes('pickup') ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold">Layanan Pickup</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={(form.availableServices || []).includes('pickup')}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 pointer-events-none"
                      />
                    </div>
                    <p className="mt-2 text-[10.5px] leading-snug text-slate-500">
                      Produk tersedia dibawa pulang langsung di kasir (Default).
                    </p>
                  </div>

                  {/* Layanan 2: Dine In */}
                  <div
                    onClick={() => handleToggleService('dinein')}
                    className={`flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition select-none ${
                      (form.availableServices || []).includes('dinein')
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Table2 size={16} className={(form.availableServices || []).includes('dinein') ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold">Layanan Dine In</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={(form.availableServices || []).includes('dinein')}
                        onChange={() => {}}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 pointer-events-none"
                      />
                    </div>
                    <p className="mt-2 text-[10.5px] leading-snug text-slate-500">
                      Konsumsi di tempat &amp; QR Meja. Khusus makanan &amp; minuman.
                    </p>
                  </div>

                  {/* Layanan 3: Delivery */}
                  <div
                    onClick={() => handleToggleService('delivery')}
                    className={`flex flex-col justify-between rounded-xl border p-3 cursor-pointer transition select-none ${
                      (form.availableServices || []).includes('delivery')
                        ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-1 ring-amber-500/30'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className={(form.availableServices || []).includes('delivery') ? 'text-amber-600' : 'text-slate-400'} />
                        <span className="text-xs font-bold">Layanan Delivery</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={(form.availableServices || []).includes('delivery')}
                        onChange={() => {}}
                        className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 pointer-events-none"
                      />
                    </div>
                    <p className="mt-2 text-[10.5px] leading-snug text-slate-500">
                      Tersedia untuk pesanan antar kurir toko / ekspedisi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Simpan / Batal */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Barang Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          5A. DIALOG KONFIRMASI NONAKTIFKAN / AKTIFKAN BARANG
      ========================================================= */}
      {statusConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setStatusConfirmModal(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl border border-slate-200">
            <div
              className={`mx-auto flex h-13 w-13 items-center justify-center rounded-2xl ${
                statusConfirmModal.nextStatus === 'Nonaktif'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Power size={26} />
            </div>

            <h3 className="mt-3.5 text-base font-bold text-slate-800">
              {statusConfirmModal.nextStatus === 'Nonaktif'
                ? 'Nonaktifkan Barang?'
                : 'Aktifkan Barang Kembali?'}
            </h3>

            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {statusConfirmModal.nextStatus === 'Nonaktif' ? (
                <>
                  Barang <b>{statusConfirmModal.product.nama}</b> tidak akan lagi
                  tersedia di kasir untuk transaksi baru. Riwayat transaksi lama
                  dan laporan keuangan <b>tetap aman tersimpan</b>.
                </>
              ) : (
                <>
                  Barang <b>{statusConfirmModal.product.nama}</b> akan kembali
                  tersedia dan dapat dipilih di kasir untuk transaksi penjualan.
                </>
              )}
            </p>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setStatusConfirmModal(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs transition ${
                  statusConfirmModal.nextStatus === 'Nonaktif'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {statusConfirmModal.nextStatus === 'Nonaktif'
                  ? 'Ya, Nonaktifkan'
                  : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          5B. DIALOG HAPUS PERMANEN (DENGAN CEK DEPENDENSI TRANSAKSI)
      ========================================================= */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setDeleteModal(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {deleteModal.isUsed ? (
              /* KASUS 1: BARANG MASIH DIGUNAKAN DI TRANSAKSI -> DIBLOKIR! */
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                  <ShieldAlert size={28} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-800">
                  Penghapusan Permanen Ditolak
                </h3>

                <div className="mt-3 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200 text-left text-xs text-amber-900 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-amber-950">
                    Alasan Perlindungan Data:
                  </p>
                  <p>
                    Barang <b>{deleteModal.product.nama}</b> tercatat dalam{' '}
                    <b>{deleteModal.count} riwayat transaksi penjualan</b> sebelumnya.
                  </p>
                  <p className="text-amber-800 text-[11px]">
                    Menghapus barang ini secara permanen akan merusak konsistensi
                    pembukuan, nota transaksi, dan laporan omzet toko.
                  </p>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Solusi aman: <b>Nonaktifkan</b> barang ini agar tidak lagi muncul
                  di kasir tanpa menghapus riwayat transaksi lama.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteModal(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Tutup
                  </button>
                  {deleteModal.product.status === 'Aktif' && (
                    <button
                      type="button"
                      onClick={handleDeactivateFromDeleteModal}
                      className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-500 transition"
                    >
                      Nonaktifkan Barang Ini Saja
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* KASUS 2: BARANG BELUM PERNAH DITRANSAKSIKAN -> BISA DIHAPUS SETELAH KONFIRMASI */
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <Trash2 size={26} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-800">
                  Hapus Barang Permanen?
                </h3>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Barang <b>{deleteModal.product.nama}</b> belum pernah
                  ditransaksikan dan akan <b>dihapus permanen</b> dari katalog toko.
                  Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="mt-5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteModal(null)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPermanentDelete}
                    className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-500 transition"
                  >
                    Ya, Hapus Permanen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          KELOLA KATEGORI MODAL
      ========================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setCategoryModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Kelola Kategori</h3>
                <p className="text-xs text-slate-500">Tambah atau hapus kategori barang</p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nama kategori baru (cth: Snack)"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="submit"
                  disabled={!newCategory.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={15} />
                  <span>Tambah</span>
                </button>
              </form>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {categories.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Tags size={14} className="text-emerald-600" />
                      <span className="font-semibold text-slate-700">{c}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        deleteCategory(c);
                        if (category === c) setCategory('Semua');
                        showToast(`Kategori "${c}" dihapus`);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Hapus kategori"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Belum ada kategori.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CETAK BARCODE PREVIEW MODAL
      ========================================================= */}
      {barcodePrintLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setBarcodePrintLabel(null)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Cetak Barcode</h3>
                <p className="text-xs text-slate-500">
                  Pratinjau label barcode {barcodePrintLabel.nama}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBarcodePrintLabel(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              <p className="text-sm font-bold text-slate-800">{barcodePrintLabel.nama}</p>
              <div id="barcode-print-preview" className="bg-white p-2 border border-slate-200 rounded-xl">
                <BarcodeLabel
                  value={barcodePrintLabel.kode}
                  width={1.8}
                  height={55}
                  fontSize={11}
                />
              </div>
              <p className="text-base font-extrabold text-emerald-700">
                {formatRupiah(barcodePrintLabel.harga)}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Kode: {barcodePrintLabel.kode}
              </p>
            </div>
            <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setBarcodePrintLabel(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePrintBarcodeConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
              >
                <Printer size={15} />
                <span>Cetak Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. PRODUCT DETAIL DRAWER
      ========================================================= */}
      <ProductDetailDrawer
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        meta={detailProduct ? metaMap[detailProduct.id] : null}
        allowEditDescription={false}
        formatRupiah={formatRupiah}
        minStockThreshold={minStockThreshold}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
