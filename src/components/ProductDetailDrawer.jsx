import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Barcode as BarcodeIcon,
  Tag,
  Star,
  Percent,
  Gift,
  FileText,
  Edit3,
  Check,
  AlertCircle,
  Copy,
  CheckCheck,
  ShoppingBag,
  Table2,
  Truck,
} from 'lucide-react';
import BarcodeLabel from './common/BarcodeLabel';

export default function ProductDetailDrawer({
  isOpen,
  onClose,
  product,
  meta,
  allowEditDescription = false,
  onSaveDescription,
  allowEditCatalog = false,
  onSaveCatalog,
  formatRupiah,
  minStockThreshold = 5,
}) {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [bestSellerDraft, setBestSellerDraft] = useState(false);
  const [bestSellerNoteDraft, setBestSellerNoteDraft] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync draft when product/meta changes or drawer opens
  useEffect(() => {
    if (product) {
      setDescDraft(meta?.deskripsi || '');
      setBestSellerDraft(Boolean(meta?.bestSeller));
      setBestSellerNoteDraft(meta?.bestSellerNote || '');
      setIsEditingDesc(false);
      setImageError(false);
    }
  }, [product, meta, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentDesc = meta?.deskripsi || '';
  const today = new Date().toISOString().slice(0, 10);
  const isDateValid =
    (!meta?.promoStartDate || today >= meta.promoStartDate.slice(0, 10)) &&
    (!meta?.promoEndDate || today <= meta.promoEndDate.slice(0, 10));
  const isPromoActive = Boolean((meta?.promoActive || meta?.b1g1) && isDateValid);
  const promoType = meta?.promoType || (meta?.b1g1 ? 'b1g1' : 'nominal');
  const promoValue = Number(meta?.promoValue) || 0;

  // Calculate discounted price
  const basePrice = Number(product.harga || 0);
  let effectivePrice = basePrice;
  let discountAmount = 0;
  if (isPromoActive && basePrice > 0) {
    if (promoType === 'persen' && promoValue > 0) {
      discountAmount = Math.round((basePrice * promoValue) / 100);
      effectivePrice = Math.max(0, basePrice - discountAmount);
    } else if (promoType === 'nominal' && promoValue > 0) {
      discountAmount = Math.min(basePrice, promoValue);
      effectivePrice = Math.max(0, basePrice - discountAmount);
    }
  }

  const handleCopyCode = () => {
    if (!product.kode) return;
    navigator.clipboard?.writeText?.(product.kode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveDesc = () => {
    if (onSaveDescription) {
      onSaveDescription(descDraft.trim());
    }
    setIsEditingDesc(false);
  };

  const handleSaveCatalog = () => {
    if (onSaveCatalog) {
      onSaveCatalog({
        bestSeller: bestSellerDraft,
        bestSellerNote: bestSellerNoteDraft.trim(),
        deskripsi: descDraft.trim(),
      });
    }
  };

  const threshold =
    Number(product.minStok) > 0
      ? Number(product.minStok)
      : Number(minStockThreshold) > 0
      ? Number(minStockThreshold)
      : 5;
  const isLowStock = Number(product.stok || 0) <= threshold && Number(product.stok || 0) > 0;
  const isOutOfStock = Number(product.stok || 0) <= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        {/* Drawer container: Bottom Sheet on Mobile, Right Panel on Desktop */}
        <div className="absolute inset-0 pointer-events-none flex justify-end">
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="pointer-events-auto flex flex-col w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Detail Produk</h2>
                  <p className="text-xs text-slate-400">Informasi spesifikasi & promosi produk</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Tutup panel detail"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Product Visual & Basic Info */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
                  {product.foto && !imageError ? (
                    <img
                      src={product.foto}
                      alt={product.nama}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Package size={28} />
                      <span className="text-[10px] font-medium">Tanpa Foto</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <Tag size={12} />
                      {product.kategori || 'Umum'}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                        product.status === 'Nonaktif'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100/60 text-emerald-800'
                      }`}
                    >
                      {product.status || 'Aktif'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {product.nama}
                  </h3>

                  {product.kode && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-medium text-slate-600">
                        <BarcodeIcon size={14} className="text-slate-400" />
                        {product.kode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        title="Salin kode produk"
                      >
                        {copiedCode ? (
                          <CheckCheck size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode Visualization (if code exists) */}
              {product.kode && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 flex flex-col items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-100 w-full flex justify-center">
                    <BarcodeLabel value={product.kode} width={1.6} height={42} fontSize={11} />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-mono">
                    Scan barcode ini pada kasir
                  </span>
                </div>
              )}

              {/* Key Metrics: Price & Stock (4-card grid) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Harga Modal */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Harga Modal</span>
                  <div className="mt-1 text-base font-bold text-slate-700">
                    {formatRupiah ? formatRupiah(product.hargaModal || 0) : `Rp ${(Number(product.hargaModal) || 0).toLocaleString('id-ID')}`}
                  </div>
                  <span className="text-[10px] text-slate-400">Harga beli toko</span>
                </div>

                {/* Harga Jual */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Harga Jual</span>
                  <div className="mt-1">
                    {isPromoActive && effectivePrice < basePrice ? (
                      <div>
                        <div className="text-base font-extrabold text-red-600">
                          {formatRupiah ? formatRupiah(effectivePrice) : `Rp ${effectivePrice.toLocaleString('id-ID')}`}
                        </div>
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatRupiah ? formatRupiah(basePrice) : `Rp ${basePrice.toLocaleString('id-ID')}`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-base font-extrabold text-emerald-700">
                        {formatRupiah ? formatRupiah(basePrice) : `Rp ${basePrice.toLocaleString('id-ID')}`}
                      </div>
                    )}
                    {product.pajakAktif && (
                      <span className="mt-0.5 inline-block rounded-md bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                        Kena {product.pajakJenis || 'PPN'} {product.pajakPersen || 0}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Stok Tersedia */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Stok Tersedia</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span
                      className={`text-base font-extrabold ${
                        isOutOfStock
                          ? 'text-red-600'
                          : isLowStock
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {product.stok}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{product.satuan || 'pcs'}</span>
                  </div>
                  {isOutOfStock ? (
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-red-600">
                      Stok Habis
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-600">
                      Stok Menipis (≤ {threshold})
                    </span>
                  ) : (
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-emerald-600">
                      Stok Aman
                    </span>
                  )}
                </div>

                {/* Stok Minimum */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Stok Minimum</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-slate-700">
                      {threshold}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{product.satuan || 'pcs'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {Number(product.minStok) > 0 ? 'Khusus produk ini' : 'Batas default toko'}
                  </span>
                </div>
              </div>

              {/* Ketersediaan Jenis Layanan (Pickup, Dine In, Delivery) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ketersediaan Layanan Toko
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                      product.availableServices?.includes('pickup')
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-100 bg-slate-50/70 text-slate-400 opacity-60'
                    }`}
                  >
                    <ShoppingBag size={15} className={product.availableServices?.includes('pickup') ? 'text-emerald-600' : 'text-slate-300'} />
                    <span className="text-[11px] font-bold mt-1">Pickup</span>
                    <span className="text-[9.5px]">
                      {product.availableServices?.includes('pickup') ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                      product.availableServices?.includes('dinein')
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                        : 'border-slate-100 bg-slate-50/70 text-slate-400 opacity-60'
                    }`}
                  >
                    <Table2 size={15} className={product.availableServices?.includes('dinein') ? 'text-indigo-600' : 'text-slate-300'} />
                    <span className="text-[11px] font-bold mt-1">Dine In</span>
                    <span className="text-[9.5px]">
                      {product.availableServices?.includes('dinein') ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                      product.availableServices?.includes('delivery')
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-slate-100 bg-slate-50/70 text-slate-400 opacity-60'
                    }`}
                  >
                    <Truck size={15} className={product.availableServices?.includes('delivery') ? 'text-amber-600' : 'text-slate-300'} />
                    <span className="text-[11px] font-bold mt-1">Delivery</span>
                    <span className="text-[9.5px]">
                      {product.availableServices?.includes('delivery') ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kelola Best Seller & Deskripsi (Ketika dibuka dari Informasi Barang) */}
              {allowEditCatalog && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Kelola Best Seller &amp; Deskripsi
                      </h4>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bestSellerDraft}
                        onChange={(e) => setBestSellerDraft(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Best Seller: <b className={bestSellerDraft ? 'text-amber-700' : 'text-slate-500'}>{bestSellerDraft ? 'Aktif' : 'Nonaktif'}</b>
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Catatan Best Seller (Opsional)
                    </label>
                    <input
                      type="text"
                      value={bestSellerNoteDraft}
                      onChange={(e) => setBestSellerNoteDraft(e.target.value)}
                      placeholder="cth: Menu favorit pelanggan, Paling laku minggu ini"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Deskripsi Produk
                    </label>
                    <textarea
                      rows={4}
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      placeholder={`Tulis deskripsi detail produk "${product.nama}"...`}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCatalog}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 active:scale-98 transition"
                  >
                    <Check size={14} />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              )}

              {/* Status Badges Section (Best Seller, Promo, B1G1) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status Promosi & Penjualan
                </h4>

                <div className="space-y-2">
                  {/* Best Seller Status */}
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                      meta?.bestSeller
                        ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                        : 'border-slate-200 bg-slate-50/40 text-slate-500'
                    }`}
                  >
                    <Star
                      size={18}
                      className={meta?.bestSeller ? 'text-amber-500 fill-amber-500 shrink-0 mt-0.5' : 'text-slate-300 shrink-0 mt-0.5'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">
                          {meta?.bestSeller ? 'Produk Best Seller' : 'Bukan Best Seller'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            meta?.bestSeller
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          {meta?.bestSeller ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {meta?.bestSeller && meta?.bestSellerNote && (
                        <p className="mt-1 text-xs text-amber-800/90 italic">
                          "{meta.bestSellerNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Promo Status */}
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                      isPromoActive
                        ? 'border-red-200 bg-red-50/60 text-red-900'
                        : 'border-slate-200 bg-slate-50/40 text-slate-500'
                    }`}
                  >
                    <Percent
                      size={18}
                      className={isPromoActive ? 'text-red-500 shrink-0 mt-0.5' : 'text-slate-300 shrink-0 mt-0.5'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">
                          {isPromoActive
                            ? meta?.promoTitle || 'Promo Diskon Aktif'
                            : 'Tidak Ada Promo Diskon'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isPromoActive
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          {isPromoActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {isPromoActive && (
                        <div className="mt-1 text-xs text-red-800/90 space-y-0.5">
                          <p className="font-semibold">
                            Potongan:{' '}
                            {promoType === 'persen'
                              ? `${promoValue}%`
                              : formatRupiah
                              ? formatRupiah(promoValue)
                              : `Rp ${promoValue.toLocaleString('id-ID')}`}
                          </p>
                          {meta?.promoNote && <p className="italic">"{meta.promoNote}"</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* B1G1 Status */}
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                      meta?.b1g1
                        ? 'border-violet-200 bg-violet-50/60 text-violet-900'
                        : 'border-slate-200 bg-slate-50/40 text-slate-500'
                    }`}
                  >
                    <Gift
                      size={18}
                      className={meta?.b1g1 ? 'text-violet-500 shrink-0 mt-0.5' : 'text-slate-300 shrink-0 mt-0.5'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">
                          {meta?.b1g1 ? 'Promo Buy 1 Get 1' : 'Tidak Ada Promo B1G1'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            meta?.b1g1
                              ? 'bg-violet-100 text-violet-800'
                              : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          {meta?.b1g1 ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {meta?.b1g1 && meta?.b1g1Note && (
                        <p className="mt-1 text-xs font-semibold text-violet-700">
                          {meta.b1g1Note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deskripsi Produk Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-800">Deskripsi Produk</h4>
                  </div>
                  {allowEditDescription && !isEditingDesc && (
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shadow-xs"
                    >
                      <Edit3 size={13} />
                      {currentDesc ? 'Ubah Deskripsi' : 'Tambah Deskripsi'}
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-3">
                    <textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      placeholder={`Tulis deskripsi detail produk "${product.nama}"...`}
                      rows={4}
                      maxLength={500}
                      autoFocus
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {descDraft.length}/500 karakter
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDescDraft(currentDesc);
                            setIsEditingDesc(false);
                          }}
                          className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDesc}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-95"
                        >
                          <Check size={14} />
                          Simpan Deskripsi
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {currentDesc.trim() ? (
                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {currentDesc}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 px-4">
                        <AlertCircle size={22} className="text-slate-300" />
                        <p className="mt-1.5 text-xs font-medium text-slate-500">
                          Belum ada deskripsi untuk produk ini
                        </p>
                        {allowEditDescription ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingDesc(true)}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            <Edit3 size={13} />
                            Tulis deskripsi sekarang
                          </button>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Deskripsi dapat ditambahkan melalui menu Informasi Barang.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">ID: {product.id}</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
