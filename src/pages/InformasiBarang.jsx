import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';

const TABS = [
  { id: 'bestSeller', label: 'Best Seller', icon: Star },
  { id: 'promo', label: 'Promo Barang', icon: Percent },
  { id: 'b1g1', label: 'Buy 1 Get 1', icon: Gift },
  { id: 'deskripsi', label: 'Deskripsi Produk', icon: FileText },
];

const B1G1_OPTIONS = ['Beli 1 Gratis 1', 'Beli 2 Gratis 1', 'Beli 3 Gratis 1', 'Beli 1 Gratis 2'];

function ProductThumb({ src }) {
  const [error, setError] = React.useState(false);

  if (!src || error) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700">
        <Package size={18} />
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
      className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover shadow-sm"
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition ${
        checked ? 'bg-emerald-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function InformasiBarang() {
  const { products, productMeta, updateProductMeta, formatRupiah } = useData();
  const [tab, setTab] = useState('bestSeller');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [toast, setToast] = useState('');

  const perPage = 8;

  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  const defaultDraftFor = (id) => {
    const meta = metaMap[id] || {};
    return {
      bestSeller: Boolean(meta.bestSeller),
      bestSellerNote: meta.bestSellerNote || '',
      promoActive: Boolean(meta.promoActive),
      promoTitle: meta.promoTitle || '',
      promoType: meta.promoType === 'persen' ? 'persen' : 'nominal',
      promoValue: meta.promoValue || 0,
      promoNote: meta.promoNote || '',
      b1g1: Boolean(meta.b1g1),
      b1g1Note: meta.b1g1Note || '',
      deskripsi: meta.deskripsi || '',
    };
  };

  useEffect(() => {
    const next = {};
    for (const p of products) {
      const meta = metaMap[p.id] || {};
      next[p.id] = {
        bestSeller: Boolean(meta.bestSeller),
        bestSellerNote: meta.bestSellerNote || '',
        promoActive: Boolean(meta.promoActive),
        promoTitle: meta.promoTitle || '',
        promoType: meta.promoType === 'persen' ? 'persen' : 'nominal',
        promoValue: meta.promoValue || 0,
        promoNote: meta.promoNote || '',
        b1g1: Boolean(meta.b1g1),
        b1g1Note: meta.b1g1Note || '',
        deskripsi: meta.deskripsi || '',
      };
    }
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDraft = (p) => drafts[p.id] || defaultDraftFor(p.id);

  const patchDraft = (id, patch) => {
    setDrafts((d) => {
      const base = d[id] || defaultDraftFor(id);
      return { ...d, [id]: { ...base, ...patch } };
    });
  };

  const commitMeta = (id, patch) => {
    updateProductMeta(id, patch);
    patchDraft(id, patch);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const nama = (p.nama || '').toLowerCase();
      const kode = (p.kode || '').toLowerCase();
      const kategori = (p.kategori || '').toLowerCase();
      return (
        nama.includes(q) ||
        kode.includes(q) ||
        kategori.includes(q)
      );
    });
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const switchTab = (id) => {
    setTab(id);
    setPage(1);
  };

  const saveBestSeller = (p) => {
    const d = getDraft(p);
    commitMeta(p.id, {
      bestSeller: d.bestSeller,
      bestSellerNote: d.bestSellerNote,
    });
    showToast(`Best Seller "${p.nama}" disimpan`);
  };

  const toggleBestSeller = (p) => {
    const next = !getDraft(p).bestSeller;
    commitMeta(p.id, { bestSeller: next });
    showToast(
      next
        ? `"${p.nama}" ditandai Best Seller`
        : `"${p.nama}" bukan Best Seller lagi`
    );
  };

  const savePromo = (p) => {
    const d = getDraft(p);
    if (d.promoActive && Number(d.promoValue) <= 0) {
      showToast('Isi nilai potongan promo dulu');
      return;
    }
    commitMeta(p.id, {
      promoActive: d.promoActive,
      promoTitle: d.promoTitle,
      promoType: d.promoType,
      promoValue: Number(d.promoValue) || 0,
      promoNote: d.promoNote,
    });
    showToast(`Promo "${p.nama}" disimpan`);
  };

  const togglePromo = (p) => {
    const next = !getDraft(p).promoActive;
    commitMeta(p.id, { promoActive: next });
    showToast(next ? `Promo "${p.nama}" aktif` : `Promo "${p.nama}" nonaktif`);
  };

  const saveB1G1 = (p) => {
    const d = getDraft(p);
    commitMeta(p.id, { b1g1: d.b1g1, b1g1Note: d.b1g1Note });
    showToast(`B1G1 "${p.nama}" disimpan`);
  };

  const toggleB1G1 = (p) => {
    const next = !getDraft(p).b1g1;
    commitMeta(p.id, { b1g1: next });
    showToast(next ? `B1G1 "${p.nama}" aktif` : `B1G1 "${p.nama}" nonaktif`);
  };

  const saveDeskripsi = (p) => {
    const d = getDraft(p);
    commitMeta(p.id, { deskripsi: d.deskripsi });
    showToast(`Deskripsi "${p.nama}" disimpan`);
  };

  const effectivePrice = (p, d) => {
    const base = Number(p.harga) || 0;
    if (!d.promoActive || base <= 0) return base;
    const val = Number(d.promoValue) || 0;
    const disc = d.promoType === 'persen' ? (base * val) / 100 : val;
    return Math.max(0, base - disc);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Informasi Barang</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola penilaian best seller, promo, buy 1 get 1, dan deskripsi produk. Data nama,
              harga, stok, &amp; kategori otomatis mengikuti Data Barang.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
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
              placeholder="Cari nama, kode, atau kategori barang..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <p className="text-xs text-slate-400">
            {filtered.length} dari {products.length} barang
          </p>
        </div>

        {/* List */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <LogoWatermark size="lg" />

          <div className="relative z-10">
            {paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <PackageX size={26} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">Tidak ada barang ditemukan</p>
                <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paged.map((p) => {
                  const d = getDraft(p);
                  const price = effectivePrice(p, d);
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col gap-4 px-5 py-4 transition hover:bg-emerald-50/30 lg:flex-row lg:items-center"
                    >
                      {/* Product info (always from table Barang) */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ProductThumb src={p.foto} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate font-semibold text-slate-800">{p.nama}</p>
                            {d.bestSeller && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                <Star size={10} /> Best Seller
                              </span>
                            )}
                            {d.promoActive && (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                PROMO
                              </span>
                            )}
                            {d.b1g1 && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                                B1G1
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {p.kode} · {p.kategori} · Stok {p.stok} {p.satuan}
                          </p>
                          <p className="mt-1 text-sm">
                            {d.promoActive && price < Number(p.harga || 0) ? (
                              <>
                                <span className="font-bold text-red-600">{formatRupiah(price)}</span>{' '}
                                <span className="text-xs text-slate-400 line-through">
                                  {formatRupiah(p.harga)}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-emerald-700">{formatRupiah(p.harga)}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Tab-specific controls */}
                      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-96">
                        {tab === 'bestSeller' && (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-slate-600">Tandai Best Seller (penilaian toko)</span>
                              <Toggle
                                checked={d.bestSeller}
                                onChange={() => toggleBestSeller(p)}
                                label={`Toggle best seller ${p.nama}`}
                              />
                            </div>
                            <input
                              value={d.bestSellerNote}
                              onChange={(e) =>
                                patchDraft(p.id, { bestSellerNote: e.target.value })
                              }
                              placeholder="Catatan / urutan (opsional)"
                              className={inputClass}
                            />
                            <button
                              onClick={() => saveBestSeller(p)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98]"
                            >
                              <CheckCircle2 size={15} />
                              Simpan Best Seller
                            </button>
                          </>
                        )}

                        {tab === 'promo' && (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-slate-600">Aktifkan Promo</span>
                              <Toggle
                                checked={d.promoActive}
                                onChange={() => togglePromo(p)}
                                label={`Toggle promo ${p.nama}`}
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                value={d.promoTitle}
                                onChange={(e) => patchDraft(p.id, { promoTitle: e.target.value })}
                                placeholder="Judul promo (cth: Diskon Akhir Bulan)"
                                className={`${inputClass} sm:col-span-2`}
                              />
                              <input
                                type="number"
                                min="0"
                                value={d.promoValue}
                                onChange={(e) => patchDraft(p.id, { promoValue: e.target.value })}
                                placeholder={d.promoType === 'persen' ? 'Diskon %' : 'Potongan Rp'}
                                className={inputClass}
                              />
                              <select
                                value={d.promoType}
                                onChange={(e) => patchDraft(p.id, { promoType: e.target.value })}
                                className={inputClass}
                              >
                                <option value="nominal">Potongan Rp</option>
                                <option value="persen">Diskon %</option>
                              </select>
                              <input
                                value={d.promoNote}
                                onChange={(e) => patchDraft(p.id, { promoNote: e.target.value })}
                                placeholder="Keterangan promo (opsional)"
                                className={`${inputClass} sm:col-span-2`}
                              />
                            </div>
                            <button
                              onClick={() => savePromo(p)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98]"
                            >
                              <CheckCircle2 size={15} />
                              Simpan Promo
                            </button>
                          </>
                        )}

                        {tab === 'b1g1' && (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-slate-600">Aktifkan Buy 1 Get 1</span>
                              <Toggle
                                checked={d.b1g1}
                                onChange={() => toggleB1G1(p)}
                                label={`Toggle B1G1 ${p.nama}`}
                              />
                            </div>
                            <select
                              value={d.b1g1Note}
                              onChange={(e) => patchDraft(p.id, { b1g1Note: e.target.value })}
                              className={inputClass}
                            >
                              <option value="">Pilih jenis promo B1G1...</option>
                              {B1G1_OPTIONS.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => saveB1G1(p)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98]"
                            >
                              <CheckCircle2 size={15} />
                              Simpan B1G1
                            </button>
                          </>
                        )}

                        {tab === 'deskripsi' && (
                          <>
                            <textarea
                              value={d.deskripsi}
                              onChange={(e) => patchDraft(p.id, { deskripsi: e.target.value })}
                              placeholder={`Deskripsi ${p.nama}...`}
                              rows={2}
                              maxLength={500}
                              className={`${inputClass} resize-none`}
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[11px] text-slate-400">{d.deskripsi.length}/500</span>
                              <button
                                onClick={() => saveDeskripsi(p)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.98]"
                              >
                                <CheckCircle2 size={15} />
                                Simpan
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
            <p className="text-xs text-slate-500">
              Menampilkan{' '}
              <b>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</b>–
              <b>{Math.min(currentPage * perPage, filtered.length)}</b> dari <b>{filtered.length}</b> barang
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((pg) => Math.max(1, pg - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                    currentPage === pg
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage((pg) => Math.min(totalPages, pg + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
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