import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Percent,
  Gift,
  FileText,
  Search,
  Package,
  PackageX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  Eye,
  ArrowRight,
  Filter,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  Tag,
  Check,
  RotateCcw,
} from 'lucide-react';
import LogoWatermark from '../components/common/LogoWatermark';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import { useData } from '../context/DataContext';

// HANYA DUA KATEGORI UTAMA
const MAIN_TABS = [
  {
    id: 'deskripsi',
    label: 'Deskripsi & Best Seller',
    icon: Star,
    desc: 'Pengelolaan status Best Seller dan deskripsi informasi produk secara terpadu.',
  },
  {
    id: 'promo',
    label: 'Promo',
    icon: Percent,
    desc: 'Semua promosi: Diskon Persentase (%), Diskon Nominal (Rp), dan Buy 1 Get 1.',
  },
];

const B1G1_PRESETS = [
  'Beli 1 Gratis 1',
  'Beli 2 Gratis 1',
  'Beli 3 Gratis 1',
  'Beli 1 Gratis 2',
  'Gratis Topping / Tambahan',
];

function ProductThumb({ src, alt }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
        <Package size={20} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || 'Foto produk'}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover shadow-2xs"
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function InformasiBarang() {
  const { products, productMeta, updateProductMeta, formatRupiah, categories } = useData();

  // Tab aktif (HANYA DUA KATEGORI UTAMA)
  const [tab, setTab] = useState('deskripsi');

  // Filter Tab 1: Deskripsi & Best Seller
  const [searchDeskripsi, setSearchDeskripsi] = useState('');
  const [categoryFilterDeskripsi, setCategoryFilterDeskripsi] = useState('Semua');
  const [statusFilterDeskripsi, setStatusFilterDeskripsi] = useState('all'); // 'all', 'best_seller', 'has_desc', 'no_desc'
  const [pageDeskripsi, setPageDeskripsi] = useState(1);
  const perPageDeskripsi = 8;

  // Filter Tab 2: Promo
  const [searchPromo, setSearchPromo] = useState('');
  const [typeFilterPromo, setTypeFilterPromo] = useState('all'); // 'all', 'persen', 'nominal', 'b1g1'
  const [statusFilterPromo, setStatusFilterPromo] = useState('all'); // 'all', 'active', 'inactive'

  // Modal / Drawer States
  const [detailProduct, setDetailProduct] = useState(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromoProduct, setEditingPromoProduct] = useState(null); // null if adding new promo

  // Promo Form State
  const [promoFormProductId, setPromoFormProductId] = useState('');
  const [promoFormTitle, setPromoFormTitle] = useState('');
  const [promoFormType, setPromoFormType] = useState('persen'); // 'persen', 'nominal', 'b1g1'
  const [promoFormValue, setPromoFormValue] = useState('');
  const [promoFormB1G1Scheme, setPromoFormB1G1Scheme] = useState('Beli 1 Gratis 1');
  const [promoFormCustomB1G1, setPromoFormCustomB1G1] = useState('');
  const [promoFormHasPeriod, setPromoFormHasPeriod] = useState(false);
  const [promoFormStartDate, setPromoFormStartDate] = useState('');
  const [promoFormEndDate, setPromoFormEndDate] = useState('');
  const [promoFormNote, setPromoFormNote] = useState('');
  const [promoFormActive, setPromoFormActive] = useState(true);
  const [promoFormError, setPromoFormError] = useState('');

  // Delete Promo Confirm Modal
  const [confirmDeletePromoId, setConfirmDeletePromoId] = useState(null);

  // Toast
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  // Statistik Ringkasan
  const counts = useMemo(() => {
    let bestSellerCount = 0;
    let descCount = 0;
    let promoCount = 0;
    let promoPersen = 0;
    let promoNominal = 0;
    let promoB1g1 = 0;

    for (const p of products) {
      const m = metaMap[p.id];
      if (m?.bestSeller) bestSellerCount++;
      if (m?.deskripsi && m.deskripsi.trim().length > 0) descCount++;

      const isPromoActive = Boolean(m?.promoActive || m?.b1g1);
      if (isPromoActive) {
        promoCount++;
        const pType = m?.promoType === 'b1g1' || m?.b1g1 ? 'b1g1' : m?.promoType || 'persen';
        if (pType === 'persen') promoPersen++;
        else if (pType === 'nominal') promoNominal++;
        else if (pType === 'b1g1') promoB1g1++;
      }
    }

    return {
      bestSellerCount,
      descCount,
      promoCount,
      promoPersen,
      promoNominal,
      promoB1g1,
    };
  }, [products, metaMap]);

  // =========================================================================
  // 1. DATA TAB 1: DESKRIPSI & BEST SELLER
  // =========================================================================
  const filteredDeskripsi = useMemo(() => {
    const q = searchDeskripsi.trim().toLowerCase();

    return products.filter((p) => {
      const nama = (p.nama || '').toLowerCase();
      const kode = (p.kode || '').toLowerCase();
      const kategori = (p.kategori || '').toLowerCase();

      const matchSearch = !q || nama.includes(q) || kode.includes(q) || kategori.includes(q);
      const matchCategory =
        categoryFilterDeskripsi === 'Semua' || p.kategori === categoryFilterDeskripsi;

      const m = metaMap[p.id];
      const isBS = Boolean(m?.bestSeller);
      const hasDesc = Boolean(m?.deskripsi && m.deskripsi.trim().length > 0);

      let matchStatus = true;
      if (statusFilterDeskripsi === 'best_seller') matchStatus = isBS;
      else if (statusFilterDeskripsi === 'has_desc') matchStatus = hasDesc;
      else if (statusFilterDeskripsi === 'no_desc') matchStatus = !hasDesc;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchDeskripsi, categoryFilterDeskripsi, statusFilterDeskripsi, metaMap]);

  const totalPagesDeskripsi = Math.max(1, Math.ceil(filteredDeskripsi.length / perPageDeskripsi));
  const currentPageDeskripsi = Math.min(pageDeskripsi, totalPagesDeskripsi);
  const pagedDeskripsi = filteredDeskripsi.slice(
    (currentPageDeskripsi - 1) * perPageDeskripsi,
    currentPageDeskripsi * perPageDeskripsi
  );

  // Quick Toggle Best Seller
  const handleToggleBestSeller = (p) => {
    const current = Boolean(metaMap[p.id]?.bestSeller);
    const next = !current;
    updateProductMeta(p.id, { bestSeller: next });
    showToast(next ? `"${p.nama}" ditandai sebagai Best Seller` : `"${p.nama}" dihapus dari Best Seller`);
  };

  // Save changes from ProductDetailDrawer
  const handleSaveCatalogFromDrawer = ({ bestSeller, bestSellerNote, deskripsi }) => {
    if (!detailProduct) return;
    updateProductMeta(detailProduct.id, {
      bestSeller,
      bestSellerNote,
      deskripsi,
    });
    showToast(`Perubahan Best Seller & Deskripsi "${detailProduct.nama}" berhasil disimpan`);
    setDetailProduct(null);
  };

  // =========================================================================
  // 2. DATA TAB 2: PROMO (Diskon Persen, Diskon Nominal, Buy 1 Get 1)
  // =========================================================================
  // Daftar produk yang memiliki promo terkonfigurasi
  const promoProductList = useMemo(() => {
    const list = [];

    for (const p of products) {
      const m = metaMap[p.id];
      const hasPromo = Boolean(
        m?.promoActive ||
        m?.b1g1 ||
        m?.promoTitle ||
        Number(m?.promoValue) > 0 ||
        m?.b1g1Note
      );

      if (hasPromo) {
        const isB1G1 = Boolean(m?.b1g1 || m?.promoType === 'b1g1');
        const promoType = isB1G1 ? 'b1g1' : m?.promoType === 'nominal' ? 'nominal' : 'persen';
        const isActive = Boolean(m?.promoActive || m?.b1g1);

        list.push({
          product: p,
          meta: m,
          promoType,
          isActive,
        });
      }
    }

    // Filter promo
    const q = searchPromo.trim().toLowerCase();

    return list.filter((item) => {
      const p = item.product;
      const m = item.meta;
      const nama = (p.nama || '').toLowerCase();
      const kode = (p.kode || '').toLowerCase();
      const title = (m?.promoTitle || '').toLowerCase();

      const matchSearch = !q || nama.includes(q) || kode.includes(q) || title.includes(q);

      let matchType = true;
      if (typeFilterPromo !== 'all') {
        matchType = item.promoType === typeFilterPromo;
      }

      let matchStatus = true;
      if (statusFilterPromo === 'active') matchStatus = item.isActive;
      else if (statusFilterPromo === 'inactive') matchStatus = !item.isActive;

      return matchSearch && matchType && matchStatus;
    });
  }, [products, metaMap, searchPromo, typeFilterPromo, statusFilterPromo]);

  // Buka Modal Tambah Promo Baru
  const handleOpenAddPromo = (preselectedProductId = '') => {
    setEditingPromoProduct(null);
    setPromoFormProductId(preselectedProductId || (products.length > 0 ? products[0].id : ''));
    setPromoFormTitle('');
    setPromoFormType('persen');
    setPromoFormValue('');
    setPromoFormB1G1Scheme('Beli 1 Gratis 1');
    setPromoFormCustomB1G1('');
    setPromoFormHasPeriod(false);
    setPromoFormStartDate('');
    setPromoFormEndDate('');
    setPromoFormNote('');
    setPromoFormActive(true);
    setPromoFormError('');
    setPromoModalOpen(true);
  };

  // Buka Modal Edit Promo
  const handleOpenEditPromo = (item) => {
    const p = item.product;
    const m = item.meta;
    setEditingPromoProduct(p);
    setPromoFormProductId(p.id);
    setPromoFormTitle(m?.promoTitle || '');
    setPromoFormType(item.promoType);
    setPromoFormValue(m?.promoValue ? String(m.promoValue) : '');

    const scheme = m?.b1g1Note || '';
    if (B1G1_PRESETS.includes(scheme)) {
      setPromoFormB1G1Scheme(scheme);
      setPromoFormCustomB1G1('');
    } else {
      setPromoFormB1G1Scheme(scheme ? 'Lainnya' : 'Beli 1 Gratis 1');
      setPromoFormCustomB1G1(scheme || '');
    }

    const hasDates = Boolean(m?.promoStartDate || m?.promoEndDate);
    setPromoFormHasPeriod(hasDates);
    setPromoFormStartDate(m?.promoStartDate || '');
    setPromoFormEndDate(m?.promoEndDate || '');
    setPromoFormNote(m?.promoNote || '');
    setPromoFormActive(Boolean(m?.promoActive || m?.b1g1));
    setPromoFormError('');
    setPromoModalOpen(true);
  };

  // Quick Toggle Promo Aktif / Nonaktif
  const handleTogglePromoStatus = (item) => {
    const p = item.product;
    const nextStatus = !item.isActive;

    if (item.promoType === 'b1g1') {
      updateProductMeta(p.id, {
        b1g1: nextStatus,
        promoActive: nextStatus,
      });
    } else {
      updateProductMeta(p.id, {
        promoActive: nextStatus,
        b1g1: false,
      });
    }

    showToast(nextStatus ? `Promo "${p.nama}" diaktifkan` : `Promo "${p.nama}" dinonaktifkan`);
  };

  // Simpan Promo (Tambah / Edit)
  const handleSavePromo = (e) => {
    e.preventDefault();
    setPromoFormError('');

    if (!promoFormProductId) {
      setPromoFormError('Pilih produk yang ingin diberikan promo.');
      return;
    }

    const targetProduct = products.find((p) => p.id === promoFormProductId);
    if (!targetProduct) {
      setPromoFormError('Produk tidak ditemukan.');
      return;
    }

    let promoValueNum = 0;
    let b1g1SchemeFinal = '';

    if (promoFormType === 'persen') {
      promoValueNum = Number(promoFormValue) || 0;
      if (promoValueNum <= 0 || promoValueNum > 100) {
        setPromoFormError('Nilai diskon persentase harus antara 1% sampai 100%.');
        return;
      }
    } else if (promoFormType === 'nominal') {
      promoValueNum = Number(promoFormValue) || 0;
      if (promoValueNum <= 0) {
        setPromoFormError('Nilai potongan nominal harus lebih besar dari 0.');
        return;
      }
      if (promoValueNum >= Number(targetProduct.harga || 0)) {
        setPromoFormError('Potongan diskon nominal tidak boleh melebihi atau menyamai harga asli produk.');
        return;
      }
    } else if (promoFormType === 'b1g1') {
      b1g1SchemeFinal =
        promoFormB1G1Scheme === 'Lainnya'
          ? promoFormCustomB1G1.trim() || 'Buy 1 Get 1'
          : promoFormB1G1Scheme;
      if (!b1g1SchemeFinal) {
        setPromoFormError('Pilih atau tulis skema promo Buy 1 Get 1.');
        return;
      }
    }

    if (promoFormHasPeriod && promoFormStartDate && promoFormEndDate) {
      if (promoFormStartDate > promoFormEndDate) {
        setPromoFormError('Tanggal mulai promo tidak boleh melewati tanggal berakhir.');
        return;
      }
    }

    const isB1G1 = promoFormType === 'b1g1';

    updateProductMeta(promoFormProductId, {
      promoActive: promoFormActive,
      promoTitle: promoFormTitle.trim() || (isB1G1 ? b1g1SchemeFinal : promoFormType === 'persen' ? `Diskon ${promoValueNum}%` : `Potongan ${formatRupiah(promoValueNum)}`),
      promoType: promoFormType,
      promoValue: promoValueNum,
      promoNote: promoFormNote.trim(),
      promoStartDate: promoFormHasPeriod ? promoFormStartDate : '',
      promoEndDate: promoFormHasPeriod ? promoFormEndDate : '',
      b1g1: isB1G1 ? promoFormActive : false,
      b1g1Note: isB1G1 ? b1g1SchemeFinal : '',
    });

    setPromoModalOpen(false);
    showToast(`Promo untuk "${targetProduct.nama}" berhasil disimpan`);
  };

  // Hapus Promo dari Produk
  const handleConfirmDeletePromo = () => {
    if (!confirmDeletePromoId) return;

    updateProductMeta(confirmDeletePromoId, {
      promoActive: false,
      promoTitle: '',
      promoType: 'persen',
      promoValue: 0,
      promoNote: '',
      promoStartDate: '',
      promoEndDate: '',
      b1g1: false,
      b1g1Note: '',
    });

    showToast('Promo berhasil dihapus');
    setConfirmDeletePromoId(null);
  };

  // Preview harga promo
  const selectedProductForModal = products.find((p) => p.id === promoFormProductId);
  const previewDiscountedPrice = useMemo(() => {
    if (!selectedProductForModal) return 0;
    const base = Number(selectedProductForModal.harga || 0);
    if (promoFormType === 'persen') {
      const p = Number(promoFormValue) || 0;
      return Math.max(0, base - (base * p) / 100);
    }
    if (promoFormType === 'nominal') {
      const n = Number(promoFormValue) || 0;
      return Math.max(0, base - n);
    }
    return base;
  }, [selectedProductForModal, promoFormType, promoFormValue]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background Watermark */}
      <LogoWatermark size="xl" opacity="opacity-[0.05]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Informasi Barang &amp; Promosi
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                Katalog &amp; Promo
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Kelola status Best Seller, deskripsi produk, dan seluruh program promosi toko dalam dua kategori terpadu.
            </p>
          </div>

          <Link
            to="/barang"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition self-start sm:self-auto"
          >
            <Package size={15} className="text-emerald-600" />
            <span>Kelola Data Barang (Stok &amp; Harga Modal)</span>
            <ArrowRight size={13} className="text-slate-400" />
          </Link>
        </div>

        {/* =========================================================
            DUA TAB KATEGORI UTAMA (Deskripsi & Best Seller vs Promo)
        ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {MAIN_TABS.map(({ id, label, icon: Icon, desc }) => {
            const isActive = tab === id;
            const badgeCount =
              id === 'deskripsi'
                ? `${counts.bestSellerCount} Best Seller`
                : `${counts.promoCount} Promo Aktif`;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-col text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden select-none ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      isActive
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {badgeCount}
                  </span>
                </div>

                <h3 className="text-base font-black tracking-tight">{label}</h3>
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    isActive ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* =========================================================
            KATEGORI 1: DESKRIPSI & BEST SELLER
        ========================================================= */}
        {tab === 'deskripsi' && (
          <div className="space-y-4">
            {/* Filter & Search Bar Deskripsi */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchDeskripsi}
                    onChange={(e) => {
                      setSearchDeskripsi(e.target.value);
                      setPageDeskripsi(1);
                    }}
                    placeholder="Cari nama barang atau kode barcode..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilterDeskripsi}
                    onChange={(e) => {
                      setCategoryFilterDeskripsi(e.target.value);
                      setPageDeskripsi(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilterDeskripsi}
                    onChange={(e) => {
                      setStatusFilterDeskripsi(e.target.value);
                      setPageDeskripsi(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="all">Semua Status</option>
                    <option value="best_seller">Hanya Best Seller</option>
                    <option value="has_desc">Sudah Ada Deskripsi</option>
                    <option value="no_desc">Belum Ada Deskripsi</option>
                  </select>

                  {(searchDeskripsi || categoryFilterDeskripsi !== 'Semua' || statusFilterDeskripsi !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchDeskripsi('');
                        setCategoryFilterDeskripsi('Semua');
                        setStatusFilterDeskripsi('all');
                        setPageDeskripsi(1);
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                      title="Reset filter"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Product List Deskripsi & Best Seller */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <LogoWatermark size="lg" opacity="opacity-[0.06]" />

              <div className="relative z-10 divide-y divide-slate-100">
                {pagedDeskripsi.map((p) => {
                  const m = metaMap[p.id];
                  const isBS = Boolean(m?.bestSeller);
                  const hasDesc = Boolean(m?.deskripsi && m.deskripsi.trim().length > 0);

                  return (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 transition hover:bg-slate-50/70"
                    >
                      {/* Product Thumbnail & Essential Info */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <ProductThumb src={p.foto} alt={p.nama} />

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-sm sm:text-base truncate">
                              {p.nama}
                            </span>

                            {isBS && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                <Star size={10} className="fill-amber-500 text-amber-500" />
                                Best Seller
                              </span>
                            )}

                            {hasDesc ? (
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                Deskripsi Ada
                              </span>
                            ) : (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                Belum Ada Deskripsi
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            {p.kode && <span className="font-mono text-slate-500">{p.kode}</span>}
                            <span>·</span>
                            <span>{p.kategori}</span>
                            <span>·</span>
                            <span>Stok {p.stok} {p.satuan || 'pcs'}</span>
                            <span>·</span>
                            <span className="font-bold text-emerald-700">{formatRupiah(p.harga)}</span>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.availableServices?.includes('pickup') && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Pickup
                              </span>
                            )}
                            {p.availableServices?.includes('dinein') && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Dine In
                              </span>
                            )}
                            {p.availableServices?.includes('delivery') && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Delivery
                              </span>
                            )}
                          </div>

                          {/* Catatan / Cuplikan Deskripsi */}
                          {isBS && m?.bestSellerNote && (
                            <p className="text-[11px] text-amber-800/90 italic">
                              Catatan: "{m.bestSellerNote}"
                            </p>
                          )}
                          {hasDesc && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 italic max-w-xl">
                              "{m.deskripsi}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Best Seller Toggle & Kelola Drawer Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quick Best Seller Switch */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                            Best Seller:
                          </span>
                          <Toggle
                            checked={isBS}
                            onChange={() => handleToggleBestSeller(p)}
                            label={`Toggle best seller ${p.nama}`}
                          />
                        </div>

                        {/* Open Drawer Button */}
                        <button
                          type="button"
                          onClick={() => setDetailProduct(p)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition active:scale-98"
                        >
                          <Edit3 size={13} />
                          <span>Kelola Deskripsi &amp; Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredDeskripsi.length === 0 && (
                  <div className="py-14 text-center text-slate-400">
                    <PackageX size={32} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-700">
                      Tidak ada produk ditemukan
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sesuaikan kata kunci pencarian atau reset filter kategori.
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination Deskripsi */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3.5">
                <p className="text-xs text-slate-500">
                  Menampilkan <b>{filteredDeskripsi.length === 0 ? 0 : (currentPageDeskripsi - 1) * perPageDeskripsi + 1}</b>–
                  <b>{Math.min(currentPageDeskripsi * perPageDeskripsi, filteredDeskripsi.length)}</b> dari{' '}
                  <b>{filteredDeskripsi.length}</b> produk
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPageDeskripsi((pg) => Math.max(1, pg - 1))}
                    disabled={currentPageDeskripsi === 1}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPagesDeskripsi }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setPageDeskripsi(pg)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        currentPageDeskripsi === pg
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPageDeskripsi((pg) => Math.min(totalPagesDeskripsi, pg + 1))}
                    disabled={currentPageDeskripsi === totalPagesDeskripsi}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            KATEGORI 2: PROMO (Diskon Persen, Diskon Nominal, Buy 1 Get 1)
        ========================================================= */}
        {tab === 'promo' && (
          <div className="space-y-4">
            {/* Promo Header Toolbar & Metric Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Total Promo: <b>{promoProductList.length}</b>
                </span>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                  Diskon %: <b>{counts.promoPersen}</b>
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  Diskon Rp: <b>{counts.promoNominal}</b>
                </span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 border border-violet-200">
                  Buy 1 Get 1: <b>{counts.promoB1g1}</b>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddPromo()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 active:scale-98 transition shrink-0"
              >
                <Plus size={16} />
                <span>Tambah Promo Baru</span>
              </button>
            </div>

            {/* Filter Toolbar Promo */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchPromo}
                    onChange={(e) => setSearchPromo(e.target.value)}
                    placeholder="Cari promo berdasarkan nama produk atau judul promo..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={typeFilterPromo}
                    onChange={(e) => setTypeFilterPromo(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="all">Semua Jenis Promo</option>
                    <option value="persen">Diskon Persentase (%)</option>
                    <option value="nominal">Diskon Nominal (Rp)</option>
                    <option value="b1g1">Buy 1 Get 1 (B1G1)</option>
                  </select>

                  <select
                    value={statusFilterPromo}
                    onChange={(e) => setStatusFilterPromo(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Hanya Promo Aktif</option>
                    <option value="inactive">Promo Nonaktif</option>
                  </select>

                  {(searchPromo || typeFilterPromo !== 'all' || statusFilterPromo !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchPromo('');
                        setTypeFilterPromo('all');
                        setStatusFilterPromo('all');
                      }}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                      title="Reset filter promo"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Promo Cards Grid */}
            <div className="relative">
              <LogoWatermark size="lg" opacity="opacity-[0.06]" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promoProductList.map((item) => {
                  const p = item.product;
                  const m = item.meta;
                  const isB1G1 = item.promoType === 'b1g1';
                  const basePrice = Number(p.harga || 0);

                  // Calculate discounted price
                  let discountedPrice = basePrice;
                  if (item.promoType === 'persen') {
                    discountedPrice = Math.max(0, basePrice - (basePrice * (Number(m?.promoValue) || 0)) / 100);
                  } else if (item.promoType === 'nominal') {
                    discountedPrice = Math.max(0, basePrice - (Number(m?.promoValue) || 0));
                  }

                  const hasPeriod = Boolean(m?.promoStartDate || m?.promoEndDate);

                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 bg-white ${
                        item.isActive
                          ? 'border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md'
                          : 'border-slate-200/60 bg-slate-50/60 opacity-75'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Product Info & Badge Promo */}
                        <div className="flex items-start gap-3">
                          <ProductThumb src={p.foto} alt={p.nama} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                              {p.kategori}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm truncate" title={p.nama}>
                              {p.nama}
                            </h4>
                            <p className="text-xs text-slate-400">
                              Harga Asli: <span className="font-semibold text-slate-600">{formatRupiah(basePrice)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Promo Detail Box */}
                        <div
                          className={`rounded-xl p-3 space-y-1.5 border ${
                            item.promoType === 'persen'
                              ? 'bg-rose-50/50 border-rose-200/80 text-rose-900'
                              : item.promoType === 'nominal'
                              ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                              : 'bg-violet-50/50 border-violet-200/80 text-violet-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">
                              {m?.promoTitle || (isB1G1 ? 'Buy 1 Get 1' : 'Promo Diskon')}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                item.promoType === 'persen'
                                  ? 'bg-rose-200 text-rose-900'
                                  : item.promoType === 'nominal'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-violet-200 text-violet-900'
                              }`}
                            >
                              {item.promoType === 'persen'
                                ? `Diskon ${m?.promoValue}%`
                                : item.promoType === 'nominal'
                                ? `Potongan ${formatRupiah(m?.promoValue)}`
                                : 'Buy 1 Get 1'}
                            </span>
                          </div>

                          {/* Price Calculation / B1G1 Scheme */}
                          {isB1G1 ? (
                            <p className="text-xs font-bold text-violet-800">
                              Skema: {m?.b1g1Note || 'Beli 1 Gratis 1'}
                            </p>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-black text-rose-700">
                                {formatRupiah(discountedPrice)}
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                {formatRupiah(basePrice)}
                              </span>
                            </div>
                          )}

                          {/* Periode Promo */}
                          {hasPeriod && (
                            <p className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/50">
                              <Calendar size={11} />
                              <span>
                                {m?.promoStartDate || 'Mulai'} s.d. {m?.promoEndDate || 'Selesai'}
                              </span>
                            </p>
                          )}

                          {/* Catatan Syarat */}
                          {m?.promoNote && (
                            <p className="text-[10px] text-slate-500 italic">
                              "{m.promoNote}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Status Toggle */}
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={item.isActive}
                            onChange={() => handleTogglePromoStatus(item)}
                            label={`Toggle promo ${p.nama}`}
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              item.isActive ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {item.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPromo(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
                            title="Edit promo"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeletePromoId(p.id)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition"
                            title="Hapus promo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {promoProductList.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                    <Percent size={36} className="text-slate-300" />
                    <h3 className="mt-3 text-sm font-bold text-slate-700">
                      Belum ada promo yang terdaftar
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Tambahkan promo diskon persentase, diskon nominal, atau Buy 1 Get 1 untuk produk pilihan Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddPromo()}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                    >
                      <Plus size={15} />
                      <span>Tambah Promo Pertama</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL TAMBAH & EDIT PROMO (Semua Jenis Promo dalam 1 Form)
        ========================================================= */}
        {promoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setPromoModalOpen(false)}
            />

            <div className="relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Percent size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {editingPromoProduct ? 'Edit Pengaturan Promo' : 'Tambah Promo Baru'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Diskon persentase, diskon nominal, atau Buy 1 Get 1
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPromoModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSavePromo} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
                {promoFormError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 font-semibold">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{promoFormError}</span>
                  </div>
                )}

                {/* 1. Pilih Produk */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pilih Produk *
                  </label>
                  {editingPromoProduct ? (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <ProductThumb src={editingPromoProduct.foto} alt={editingPromoProduct.nama} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">
                          {editingPromoProduct.nama}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Harga Asli: <b>{formatRupiah(editingPromoProduct.harga)}</b> · Stok {editingPromoProduct.stok}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={promoFormProductId}
                      onChange={(e) => setPromoFormProductId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      {products.map((p) => {
                        const m = metaMap[p.id];
                        const hasActivePromo = Boolean(m?.promoActive || m?.b1g1);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.nama} — {formatRupiah(p.harga)} {hasActivePromo ? '(Sedang Promo)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* 2. Judul / Nama Promo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul / Nama Promo (Opsional)
                  </label>
                  <input
                    type="text"
                    value={promoFormTitle}
                    onChange={(e) => setPromoFormTitle(e.target.value)}
                    placeholder="cth: Flash Sale Weekend, Spesial Gajian, Beli 2 Gratis 1"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* 3. Jenis Promo (Diskon %, Diskon Rp, Buy 1 Get 1) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jenis Promo *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPromoFormType('persen')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                        promoFormType === 'persen'
                          ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs ring-1 ring-rose-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Percent size={16} className="mb-1 text-rose-600" />
                      <span>Diskon %</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPromoFormType('nominal')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                        promoFormType === 'nominal'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Tag size={16} className="mb-1 text-emerald-600" />
                      <span>Potongan Rp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPromoFormType('b1g1')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                        promoFormType === 'b1g1'
                          ? 'border-violet-500 bg-violet-50 text-violet-800 shadow-xs ring-1 ring-violet-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Gift size={16} className="mb-1 text-violet-600" />
                      <span>Buy 1 Get 1</span>
                    </button>
                  </div>
                </div>

                {/* 4. Nilai / Skema Promo */}
                {promoFormType === 'persen' && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 space-y-2">
                    <label className="block text-xs font-bold text-rose-900">
                      Nilai Diskon Persentase (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={promoFormValue}
                        onChange={(e) => setPromoFormValue(e.target.value)}
                        placeholder="cth: 10, 20, 50"
                        className="w-full rounded-xl border border-rose-300 bg-white py-2 px-3 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        %
                      </span>
                    </div>

                    {selectedProductForModal && Number(promoFormValue) > 0 && (
                      <div className="flex items-center justify-between text-[11px] pt-1 text-rose-800 font-semibold">
                        <span>Harga Asli: {formatRupiah(selectedProductForModal.harga)}</span>
                        <span>Harga Promo: <b>{formatRupiah(previewDiscountedPrice)}</b></span>
                      </div>
                    )}
                  </div>
                )}

                {promoFormType === 'nominal' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
                    <label className="block text-xs font-bold text-emerald-900">
                      Nilai Potongan Diskon (Rp) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={promoFormValue}
                        onChange={(e) => setPromoFormValue(e.target.value)}
                        placeholder="cth: 5000, 10000"
                        className="w-full rounded-xl border border-emerald-300 bg-white py-2 px-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>

                    {selectedProductForModal && Number(promoFormValue) > 0 && (
                      <div className="flex items-center justify-between text-[11px] pt-1 text-emerald-800 font-semibold">
                        <span>Harga Asli: {formatRupiah(selectedProductForModal.harga)}</span>
                        <span>Harga Promo: <b>{formatRupiah(previewDiscountedPrice)}</b></span>
                      </div>
                    )}
                  </div>
                )}

                {promoFormType === 'b1g1' && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 space-y-2">
                    <label className="block text-xs font-bold text-violet-900">
                      Pilihan Skema Buy 1 Get 1 *
                    </label>
                    <select
                      value={promoFormB1G1Scheme}
                      onChange={(e) => setPromoFormB1G1Scheme(e.target.value)}
                      className="w-full rounded-xl border border-violet-300 bg-white py-2 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-violet-500"
                    >
                      {B1G1_PRESETS.map((scheme) => (
                        <option key={scheme} value={scheme}>
                          {scheme}
                        </option>
                      ))}
                      <option value="Lainnya">Lainnya (Tulis Keterangan Sendiri)</option>
                    </select>

                    {promoFormB1G1Scheme === 'Lainnya' && (
                      <input
                        type="text"
                        value={promoFormCustomB1G1}
                        onChange={(e) => setPromoFormCustomB1G1(e.target.value)}
                        placeholder="cth: Beli 1 Gratis Minuman Es Teh"
                        className="w-full rounded-xl border border-violet-300 bg-white py-2 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-violet-500"
                      />
                    )}
                  </div>
                )}

                {/* 5. Periode Promo */}
                <div className="rounded-xl border border-slate-200 p-3 space-y-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={promoFormHasPeriod}
                        onChange={(e) => setPromoFormHasPeriod(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Batasi Periode Waktu Promo
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {promoFormHasPeriod ? 'Periode Dibatasi' : 'Berlaku Selamanya'}
                    </span>
                  </div>

                  {promoFormHasPeriod && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Tanggal Mulai
                        </label>
                        <input
                          type="date"
                          value={promoFormStartDate}
                          onChange={(e) => setPromoFormStartDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Tanggal Selesai
                        </label>
                        <input
                          type="date"
                          value={promoFormEndDate}
                          onChange={(e) => setPromoFormEndDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Catatan Syarat / Ketentuan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Promo (Opsional)
                  </label>
                  <input
                    type="text"
                    value={promoFormNote}
                    onChange={(e) => setPromoFormNote(e.target.value)}
                    placeholder="cth: Khusus pembelian langsung di kasir / maks 2 pcs"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 7. Status Promo Aktif */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Status Promo Langsung Aktif
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Jika aktif, badge promo langsung tampil pada katalog kasir.
                    </span>
                  </div>
                  <Toggle
                    checked={promoFormActive}
                    onChange={(val) => setPromoFormActive(val)}
                    label="Status aktif promo"
                  />
                </div>

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPromoModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 active:scale-98 transition"
                  >
                    Simpan Promo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus Promo */}
        {confirmDeletePromoId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setConfirmDeletePromoId(null)}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Hapus Pengaturan Promo?
              </h3>
              <p className="text-xs text-slate-500">
                Promo pada produk ini akan dihapus dan produk akan kembali dijual dengan harga reguler.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeletePromoId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePromo}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-xs"
                >
                  Hapus Promo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Detail & Catalog Drawer (Untuk Tab 1) */}
        <ProductDetailDrawer
          isOpen={Boolean(detailProduct)}
          onClose={() => setDetailProduct(null)}
          product={detailProduct}
          meta={detailProduct ? metaMap[detailProduct.id] : null}
          allowEditCatalog={true}
          onSaveCatalog={handleSaveCatalogFromDrawer}
          formatRupiah={formatRupiah}
        />

        {/* Toast Feedback */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
