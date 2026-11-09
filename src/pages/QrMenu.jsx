import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Utensils,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Receipt,
  RotateCcw,
  ChefHat,
  MessageSquare,
} from 'lucide-react';
import { useData } from '../context/DataContext';

export default function QrMenu() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    tables = [],
    products = [],
    productMeta = [],
    tableSessions = [],
    orders = [],
    storeProfile,
    settings,
    formatRupiah,
    createUnifiedOrder,
  } = useData();

  // Selected Table
  const currentTable = useMemo(() => {
    return tables.find((t) => t.id === tableId);
  }, [tables, tableId]);

  // Active Session for this table
  const activeSession = useMemo(() => {
    return tableSessions.find(
      (s) => s.tableId === tableId && s.status !== 'closed'
    );
  }, [tableSessions, tableId]);

  // Orders in this active session
  const sessionOrders = useMemo(() => {
    if (!activeSession) return [];
    return orders.filter(
      (o) => (activeSession.orderIds || []).includes(o.id) && o.orderStatus !== 'cancelled'
    );
  }, [activeSession, orders]);

  // Catalog Filters
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State (stored locally in state for this customer)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [orderNotesInput, setOrderNotesInput] = useState('');

  // Item Customize Modal
  const [customizeItem, setCustomizeItem] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Success / Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'status'

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(['Semua']);
    products.forEach((p) => {
      if (p.kategori) list.add(p.kategori);
    });
    return Array.from(list);
  }, [products]);

  // Meta mapping (Promo / Best Seller)
  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  // Filtered products (only active products with valid prices)
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.status !== 'Nonaktif');
  }, [products]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.kategori === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.nama.toLowerCase().includes(q) ||
        (p.kode && p.kode.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [availableProducts, selectedCategory, searchQuery]);

  // Tax settings
  const isTaxActive = Boolean(settings?.pajakTransaksiAktif);
  const taxPercent = Number(settings?.pajakTransaksiPersen) || 10;
  const taxType = settings?.pajakTransaksiJenis || 'PPN';

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.harga) || 0) * (Number(item.qty) || 0), 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    if (!isTaxActive) return 0;
    return Math.round((cartSubtotal * taxPercent) / 100);
  }, [isTaxActive, cartSubtotal, taxPercent]);

  const cartTotal = cartSubtotal + cartTax;
  const cartItemCount = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  // Add item clicked -> open customize modal
  const handleOpenCustomize = (product) => {
    if (Number(product.stok || 0) <= 0) return;
    setCustomizeItem(product);
    setItemQty(1);
    setItemNotes('');
  };

  const handleAddToCart = () => {
    if (!customizeItem) return;
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.id === customizeItem.id && it.notes === itemNotes.trim()
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].qty += itemQty;
        return next;
      }
      return [
        ...prev,
        {
          id: customizeItem.id,
          nama: customizeItem.nama,
          harga: customizeItem.harga,
          qty: itemQty,
          notes: itemNotes.trim(),
          foto: customizeItem.foto,
        },
      ];
    });
    setCustomizeItem(null);
  };

  const handleUpdateCartQty = (idx, delta) => {
    setCart((prev) => {
      const next = [...prev];
      const nextQty = (next[idx].qty || 1) + delta;
      if (nextQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx].qty = nextQty;
      return next;
    });
  };

  // Submit Order via createUnifiedOrder
  const handleSubmitOrder = async (e) => {
    e?.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newOrder = createUnifiedOrder({
        orderType: 'dine_in',
        source: 'qr_menu',
        tableId: currentTable.id,
        customerName: customerNameInput.trim() || `Tamu ${currentTable.name}`,
        customerPhone: '',
        items: cart,
        tax: cartTax,
        notes: orderNotesInput.trim(),
        initialOrderStatus: 'pending', // menunggu konfirmasi kasir
      });

      setSubmittedOrder(newOrder);
      setCart([]);
      setIsCartOpen(false);
      setActiveTab('status');
    } catch (err) {
      console.error('Gagal mengirim pesanan:', err);
      alert('Gagal mengirim pesanan. Silakan periksa koneksi dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Table Invalid
  if (!currentTable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-800">Meja Tidak Ditemukan</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Kode meja tidak valid atau meja belum didaftarkan di sistem kasir. Silakan tanyakan kepada staf atau kasir.
          </p>
        </div>
      </div>
    );
  }

  // Render Table Inactive
  if (currentTable.active === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-4">
            <Clock size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-800">{currentTable.name} Sedang Ditutup</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Meja ini sedang dinonaktifkan untuk sementara. Silakan tanyakan meja kosong lainnya kepada staf kami.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28">
      {/* 1. STORE & TABLE HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-3 shadow-2xs">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <img
                src={storeProfile?.logo || '/logo.jpg'}
                alt="Logo Toko"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/logo.jpg';
                }}
              />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">
                {storeProfile?.nama || 'Qurmacel Store'}
              </h1>
              <p className="text-[11px] text-slate-500">Pemesanan Mandiri Digital</p>
            </div>
          </div>

          {/* Table Badge */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-right shadow-2xs">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-700">
              Dine-In
            </span>
            <span className="font-black text-xs text-emerald-900">{currentTable.name}</span>
          </div>
        </div>

        {/* Tab Switcher (Menu vs Status Pesanan Sesi) */}
        {activeSession && (
          <div className="mx-auto mt-2.5 flex max-w-md rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 rounded-lg py-1.5 transition ${
                activeTab === 'menu'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Katalog Menu
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 rounded-lg py-1.5 transition flex items-center justify-center gap-1.5 ${
                activeTab === 'status'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Pesanan Meja</span>
              <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] text-white">
                {sessionOrders.length}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="mx-auto max-w-md px-4 pt-4">
        {activeTab === 'status' ? (
          /* ============================================================ */
          /* STATUS PESANAN AKTIF MEJA (SESI GABUNGAN)                    */
          /* ============================================================ */
          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sesi Aktif
                  </span>
                  <h2 className="text-base font-black text-slate-800">{currentTable.name}</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Satu Tagihan Sesi
                </span>
              </div>

              {/* Tagihan Konsolidasi Sementara */}
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2">
                <div className="flex justify-between text-xs text-emerald-900">
                  <span>Subtotal Seluruh Pesanan:</span>
                  <span className="font-bold">{formatRupiah(activeSession.subtotal)}</span>
                </div>
                {Number(activeSession.tax) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-900">
                    <span>Pajak:</span>
                    <span>+{formatRupiah(activeSession.tax)}</span>
                  </div>
                )}
                <div className="border-t border-emerald-200 pt-2 flex justify-between text-sm font-black text-emerald-950">
                  <span>TOTAL TAGIHAN MEJA:</span>
                  <span className="text-base">{formatRupiah(activeSession.total)}</span>
                </div>
                <p className="text-[10px] text-emerald-700 italic pt-1">
                  * Pembayaran diselesaikan di kasir saat Anda selesai bersantap.
                </p>
              </div>

              {/* Rincian Pesanan per Order */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock size={13} />
                  Riwayat Pesanan Dalam Sesi Ini ({sessionOrders.length})
                </h3>

                {sessionOrders.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">Belum ada pesanan.</p>
                ) : (
                  sessionOrders.map((ord, idx) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-700">
                          Order #{idx + 1} · {ord.orderNumber || ord.id.slice(-6)}
                        </span>
                        {/* Fulfillment Badge */}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ord.fulfillmentStatus === 'served'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.fulfillmentStatus === 'ready'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.fulfillmentStatus === 'preparing'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ord.fulfillmentStatus === 'served'
                            ? 'Sudah Disajikan'
                            : ord.fulfillmentStatus === 'ready'
                            ? 'Siap Saji'
                            : ord.fulfillmentStatus === 'preparing'
                            ? 'Sedang Dimasak'
                            : 'Menunggu Konfirmasi Kasir'}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs">
                        {ord.items.map((it, i) => (
                          <div key={i} className="py-1.5 flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {it.qty}x {it.nama}
                              </p>
                              {it.notes && (
                                <p className="text-[10px] text-slate-400 italic">"{it.notes}"</p>
                              )}
                            </div>
                            <span className="text-slate-600 font-mono">
                              {formatRupiah(it.harga * it.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Button Tambah Pesanan Lagi */}
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-98"
              >
                <Plus size={16} />
                Pesan Menu Tambahan
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* KATALOG MENU PELANGGAN (MOBILE-FIRST)                        */
          /* ============================================================ */
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari makanan / minuman favorit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Horizontal Scrollable Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product List */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
                <Utensils size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Menu tidak ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-1">Coba kata kunci atau kategori lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((p) => {
                  const meta = metaMap[p.id];
                  const isOutOfStock = Number(p.stok || 0) <= 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && handleOpenCustomize(p)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 transition select-none ${
                        isOutOfStock
                          ? 'border-slate-200 bg-slate-100/60 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md cursor-pointer active:scale-98'
                      }`}
                    >
                      {/* Photo & Badges */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {p.foto ? (
                          <img
                            src={p.foto}
                            alt={p.nama}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Utensils size={28} className="text-slate-300" />
                        )}

                        {/* Best Seller / Promo Badges */}
                        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                          {meta?.bestSeller && (
                            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[8.5px] font-black text-white shadow-2xs">
                              Best Seller
                            </span>
                          )}
                          {meta?.promoActive && (
                            <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[8.5px] font-black text-white shadow-2xs">
                              Promo
                            </span>
                          )}
                        </div>

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center">
                            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                              Habis
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="mt-2 flex-1">
                        <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                          {p.kategori || 'Umum'}
                        </span>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                          {p.nama}
                        </h3>
                        <p className="mt-1 text-xs font-black text-emerald-700">
                          {formatRupiah(p.harga)}
                        </p>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`mt-2 w-full inline-flex items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold transition ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        <Plus size={13} />
                        Tambah
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. FLOATING CART BOTTOM BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 mx-auto max-w-md">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-xl shadow-emerald-700/30 transition hover:bg-emerald-500 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white font-black text-xs">
                {cartItemCount}
              </div>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-bold text-emerald-100">
                  Keranjang Pesanan
                </span>
                <span className="font-black text-sm">{formatRupiah(cartTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span>Lihat &amp; Kirim</span>
              <ArrowRight size={15} />
            </div>
          </button>
        </div>
      )}

      {/* 4. MODAL CUSTOMIZE MENU (QTY & CATATAN) */}
      {customizeItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs"
            onClick={() => setCustomizeItem(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {customizeItem.kategori}
                </span>
                <h3 className="text-base font-black text-slate-800">{customizeItem.nama}</h3>
                <p className="text-xs font-black text-emerald-700">
                  {formatRupiah(customizeItem.harga)}
                </p>
              </div>
              <button
                onClick={() => setCustomizeItem(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Qty Selector */}
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Jumlah Porsi</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setItemQty((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center text-xs font-black text-slate-800">
                    {itemQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setItemQty((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Special Note */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Catatan Khusus <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="cth: Jangan pedas, es dipisah, sedikit gula"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-98"
            >
              <span>Tambahkan ke Keranjang · {formatRupiah(customizeItem.harga * itemQty)}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. CART DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-emerald-600" />
                  Pesanan {currentTable.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeSession ? 'Pesanan akan digabung ke tagihan meja aktif' : 'Sesi meja baru akan dibuat otomatis'}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 divide-y divide-slate-100">
              {cart.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 leading-snug">{item.nama}</p>
                    <p className="text-xs font-black text-emerald-700 mt-0.5">
                      {formatRupiah(item.harga)}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">"{item.notes}"</p>
                    )}
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateCartQty(idx, -1)}
                      className="h-6 w-6 rounded bg-white text-slate-700 flex items-center justify-center text-xs shadow-2xs hover:bg-slate-100"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateCartQty(idx, 1)}
                      className="h-6 w-6 rounded bg-white text-slate-700 flex items-center justify-center text-xs shadow-2xs hover:bg-slate-100"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Name & Notes */}
            <div className="border-t border-slate-100 p-5 space-y-3 bg-slate-50/50">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Tamu / Pemesan <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="cth: Kak Ahmad"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500"
                />
              </div>

              {/* Calculations */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(cartSubtotal)}</span>
                </div>
                {isTaxActive && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {taxType} ({taxPercent}%)
                    </span>
                    <span>+{formatRupiah(cartTax)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900 text-sm">
                  <span>TOTAL PESANAN INI:</span>
                  <span className="text-emerald-700 text-base">{formatRupiah(cartTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <span>Mengirim Pesanan...</span>
                ) : (
                  <>
                    <span>Kirim Pesanan ke Dapur</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
