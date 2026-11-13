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
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useData, isProductAvailableForService } from '../context/DataContext';

export default function QrMenu() {
  const { tableId, qrToken: urlQrToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const targetToken = urlQrToken || tableId || queryToken;

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
    updateOrderProcessingStatus,
  } = useData();

  // Kategori khusus Dine In: Hanya 2 kategori menu (Makanan dan Minuman)
  const categories = useMemo(() => ['Makanan', 'Minuman'], []);

  // Cari meja berdasarkan qrToken stabil ATAU tableId (backward compatibility)
  const currentTable = useMemo(() => {
    if (targetToken) {
      const found = tables.find((t) => t.qrToken === targetToken || t.id === targetToken);
      if (found) return found;
    }
    return tables.length > 0 ? tables[0] : { id: 'T01', name: 'Meja 01', qrToken: 'meja-01' };
  }, [tables, targetToken]);

  // Sesi Aktif untuk meja ini
  const activeSession = useMemo(() => {
    if (!currentTable) return null;
    return tableSessions.find(
      (s) => s.tableId === currentTable.id && s.status !== 'closed'
    );
  }, [tableSessions, currentTable]);

  // Seluruh pesanan pelanggan yang terikat dengan sesi meja ini
  const sessionOrders = useMemo(() => {
    if (!activeSession) return [];
    return orders.filter(
      (o) => (activeSession.orderIds || []).includes(o.id)
    );
  }, [activeSession, orders]);

  // Catalog Filters: Default kategori pertama adalah 'Makanan'
  const [selectedCategory, setSelectedCategory] = useState('Makanan');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State (disimpan lokal di memori HP pelanggan)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [orderNotesInput, setOrderNotesInput] = useState('');

  // Item Customize Modal
  const [customizeItem, setCustomizeItem] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Profile / Info Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'status'
  const [submitError, setSubmitError] = useState('');

  // Sinkronkan nama tamu dari sesi jika sudah ada
  useEffect(() => {
    if (activeSession?.customerName && !customerNameInput) {
      setCustomerNameInput(activeSession.customerName);
    }
  }, [activeSession, customerNameInput]);

  // Meta mapping (Promo / Best Seller)
  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  // Filter produk: Hanya tampilkan makanan berat dan minuman yang memang diperuntukkan untuk pemesanan Dine In
  const availableProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!isProductAvailableForService(p, 'dine_in')) return false;

        const cat = String(p.kategori || '').toLowerCase().trim();

        // Jangan tampilkan barang dagangan biasa, camilan, sembako, atau produk non-Dine In
        const isExcluded =
          cat.includes('sembako') ||
          cat.includes('cemilan') ||
          cat.includes('camilan') ||
          cat.includes('snack') ||
          cat.includes('rokok') ||
          cat.includes('sabun') ||
          cat.includes('lainnya');

        if (isExcluded && !p.isDineInOnly) {
          return false;
        }

        const isMakanan = cat.includes('makan') || p.isCooked === true;
        const isMinuman = cat.includes('minum');
        const isDineInExplicit = p.isDineInOnly === true;

        return isMakanan || isMinuman || isDineInExplicit;
      })
      .map((p) => {
        const cat = String(p.kategori || '').toLowerCase().trim();
        // Gunakan hanya dua kategori tampilan menu: Makanan dan Minuman
        const normalizedCategory = cat.includes('minum') ? 'Minuman' : 'Makanan';

        return {
          id: p.id,
          nama: p.nama,
          kategori: normalizedCategory,
          rawKategori: p.kategori,
          harga: p.harga,
          foto: p.foto,
          deskripsi: metaMap[p.id]?.deskripsi || '',
          stok: p.stok,
        };
      });
  }, [products, metaMap]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchCat = p.kategori === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.nama.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [availableProducts, selectedCategory, searchQuery]);

  // Customer Cancellation State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [customerCancelReason, setCustomerCancelReason] = useState('Ingin mengganti menu');
  const [customerCancelCustom, setCustomerCancelCustom] = useState('');
  const [cancelModalError, setCancelModalError] = useState('');

  // Pajak Transaksi
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

  // Customize item
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

  // Submit pesanan pelanggan (QR Menu)
  const handleSubmitOrder = async (e) => {
    e?.preventDefault();
    setSubmitError('');

    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = createUnifiedOrder({
        orderType: 'dine_in',
        source: 'qr_menu',
        tableId: currentTable.id,
        customerName: customerNameInput.trim() || `Tamu ${currentTable.name}`,
        customerPhone: '',
        items: cart,
        tax: cartTax,
        notes: orderNotesInput.trim(),
        initialOrderStatus: 'pending', // Menunggu konfirmasi kasir
      });

      if (res?.error) {
        setSubmitError(res.message);
        return;
      }

      setCart([]);
      setIsCartOpen(false);
      setActiveTab('status');
    } catch (err) {
      console.error('Gagal mengirim pesanan:', err);
      setSubmitError('Gagal mengirim pesanan. Silakan periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batalkan pesanan Dine In oleh pelanggan (Hanya sebelum dikonfirmasi kasir)
  const handleCustomerCancelOrder = () => {
    setCancelModalError('');
    if (!cancellingOrder) return;

    // Validasi ketat: pelanggan hanya boleh membatalkan jika status masih pending
    const isPending =
      cancellingOrder.orderStatus === 'pending' &&
      (!cancellingOrder.fulfillmentStatus || cancellingOrder.fulfillmentStatus === 'pending');

    if (!isPending) {
      setCancelModalError('Pesanan telah dikonfirmasi oleh kasir dan tidak dapat dibatalkan.');
      return;
    }

    const finalReason =
      customerCancelReason === 'Alasan lain...'
        ? customerCancelCustom.trim()
        : customerCancelReason;

    if (!finalReason) {
      setCancelModalError('Alasan pembatalan wajib diisi.');
      return;
    }

    try {
      updateOrderProcessingStatus(cancellingOrder.id, {
        orderStatus: 'cancelled',
        cancellationReason: `Dibatalkan Pelanggan: ${finalReason}`,
      });
      setCancellingOrder(null);
      setCustomerCancelReason('Ingin mengganti menu');
      setCustomerCancelCustom('');
    } catch (err) {
      console.error('Gagal membatalkan pesanan:', err);
      setCancelModalError(err.message || 'Gagal memproses pembatalan pesanan.');
    }
  };

  // Tampilan jika QR Meja tidak valid
  if (!currentTable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-800">Meja Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kode QR atau tautan meja tidak valid. Silakan scan ulang QR Code yang ada di meja atau hubungi kasir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28">
      {/* 1. HEADER BRANDING TOKO & INFORMASI MEJA */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              {storeProfile?.logo ? (
                <img src={storeProfile.logo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Utensils className="text-emerald-600" size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-slate-800 truncate">
                {storeProfile?.nama || 'Wartomson Store'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  <Utensils size={10} />
                  {currentTable.name}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {activeSession ? 'Terisi (Sesi Anda)' : 'Meja Siap Dipesan'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigasi: Menu vs Status Pesanan */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'menu' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-3 py-1.5 rounded-lg transition relative ${
                activeTab === 'status' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Status
              {sessionOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-600 text-white font-black">
                  {sessionOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Banner Status Meja */}
        {!activeSession ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3 shadow-2xs">
            <Utensils className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold block">Selamat Datang di {currentTable.name} • Wartomson Store</span>
              Silakan pilih menu makanan atau minuman Anda di bawah, lalu kirim pesanan untuk dinikmati langsung di meja.
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3 flex items-center justify-between shadow-2xs">
            <div className="text-xs text-emerald-900">
              <span className="font-bold block">{currentTable.name} • Sesi Aktif</span>
              <span className="text-[11px] text-emerald-700">Tamu: {activeSession.customerName}</span>
            </div>
            <button
              onClick={() => setActiveTab('status')}
              className="text-xs font-bold bg-white text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 transition cursor-pointer"
            >
              Status Pesanan ({sessionOrders.length})
            </button>
          </div>
        )}

        {/* TAB 1: MENU KATALOG */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            {/* Promo Banner Responsif */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-4 text-white shadow-md">
              <div className="relative z-10 space-y-1">
                <span className="inline-block rounded-md bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-900 shadow-2xs">
                  Spesial Wartomson Store
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Nikmati Hidangan Favorit &amp; Diskon Menarik
                </h2>
                <p className="text-[11px] text-emerald-100 line-clamp-2">
                  Pesan langsung dari smartphone Anda tanpa antre. Cepat, lezat, dan higienis!
                </p>
              </div>
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari makanan atau minuman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-emerald-500 shadow-2xs"
              />
            </div>

            {/* Categories: Strictly 2 display categories (Makanan dan Minuman) */}
            <div id="qr-categories-section" className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold text-center transition cursor-pointer flex items-center justify-center gap-2 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <i className={cat === 'Makanan' ? 'fa-solid fa-bowl-food' : 'fa-solid fa-mug-hot'}></i>
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <Utensils size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Tidak ada produk ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
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
                      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs transition active:scale-98 cursor-pointer hover:border-emerald-300 ${
                        isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                        {p.foto ? (
                          <img
                            src={p.foto}
                            alt={p.nama}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Utensils size={24} />
                          </div>
                        )}

                        {meta?.bestSeller && (
                          <span className="absolute top-1.5 left-1.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[8.5px] font-black text-white shadow-2xs">
                            Favorit
                          </span>
                        )}

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center">
                            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                              Habis
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Detail Info */}
                      <div className="mt-2 flex-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                          {p.kategori}
                        </span>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                          {p.nama}
                        </h3>
                        {p.deskripsi && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {p.deskripsi}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-black text-emerald-700">
                          {formatRupiah(p.harga)}
                        </p>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`mt-2.5 w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition shadow-2xs ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                        }`}
                      >
                        <Plus size={14} />
                        <span>+ Tambah</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STATUS PESANAN MEJA (REAL-TIME TRACKING) */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-800">Status Pesanan Meja</h2>
                <p className="text-xs text-slate-500">
                  {currentTable.name} • {activeSession ? `Sesi ${activeSession.id}` : 'Belum Ada Sesi'}
                </p>
              </div>

              {activeSession && (
                <button
                  onClick={() => setActiveTab('menu')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-500 transition"
                >
                  <Plus size={13} />
                  Pesan Tambahan
                </button>
              )}
            </div>

            {sessionOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Clock size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-700">Belum ada pesanan yang dikirim</p>
                <p className="text-[11px] text-slate-400">
                  Pilih makanan atau minuman dari menu dan kirim pesanan Anda ke kasir.
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-500"
                >
                  Buka Menu Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessionOrders.map((order) => {
                  const isPending = order.orderStatus === 'pending';
                  const isAccepted = order.orderStatus === 'confirmed';
                  const isCancelled = order.orderStatus === 'cancelled' || order.orderStatus === 'rejected';

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                      <Clock size={12} />
                      Menunggu Konfirmasi Kasir
                    </span>
                  );

                  if (isCancelled) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        <X size={12} />
                        Ditolak / Dibatalkan
                      </span>
                    );
                  } else if (order.fulfillmentStatus === 'served') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={12} />
                        Sudah Disajikan
                      </span>
                    );
                  } else if (order.fulfillmentStatus === 'ready') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        <CheckCircle2 size={12} />
                        Siap Disajikan
                      </span>
                    );
                  } else if (order.fulfillmentStatus === 'preparing' || isAccepted) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        <ChefHat size={12} />
                        Sedang Dimasak di Dapur
                      </span>
                    );
                  }

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-800">
                            #{order.orderNumber || order.id.slice(-6)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {statusBadge}
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 divide-y divide-slate-100">
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} className="pt-1.5 first:pt-0 flex justify-between text-xs">
                            <span className="text-slate-700">
                              <span className="font-bold">{it.qty}x</span> {it.nama}
                              {it.notes && (
                                <span className="block text-[10px] text-slate-400 italic">"{it.notes}"</span>
                              )}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatRupiah((Number(it.harga) || 0) * (Number(it.qty) || 1))}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.cancellationReason && (
                        <div className="rounded-xl bg-red-50 p-2.5 text-[11px] text-red-700 font-medium">
                          Alasan penolakan: {order.cancellationReason}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-bold">
                        <span className="text-slate-500">Total Pesanan Ini:</span>
                        <span className="text-emerald-700 text-sm">{formatRupiah(order.total)}</span>
                      </div>

                      {/* Tombol Batalkan HANYA untuk pesanan yang masih pending (belum dikonfirmasi kasir) */}
                      {isPending && (!order.fulfillmentStatus || order.fulfillmentStatus === 'pending') && (
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
                          <span className="text-[10px] text-amber-700 font-medium">
                            * Menunggu konfirmasi kasir
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingOrder(order);
                              setCustomerCancelReason('Ingin mengganti menu');
                              setCustomerCancelCustom('');
                              setCancelModalError('');
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                          >
                            <X size={12} />
                            <span>Batalkan Pesanan</span>
                          </button>
                        </div>
                      )}
                      {(!isPending || (order.fulfillmentStatus && order.fulfillmentStatus !== 'pending')) && !isCancelled && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400">
                            Pesanan telah dikonfirmasi kasir dan sedang diproses. Pembatalan mandiri tidak dapat dilakukan.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Sesi Total Summary */}
                {activeSession && (
                  <div
                    className={`rounded-2xl p-4 space-y-2 shadow-md ${
                      activeSession.paymentStatus === 'paid'
                        ? 'bg-emerald-900 text-white'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    <div className="flex justify-between text-xs text-emerald-200">
                      <span>Total Gabungan Sesi Meja:</span>
                      <span className="font-mono text-white font-bold">{activeSession.id}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-white/10">
                      <span className="text-xs font-medium text-emerald-100">
                        {activeSession.paymentStatus === 'paid' ? 'Status Tagihan:' : 'Tagihan Sementara:'}
                      </span>
                      <span className="text-xl font-black text-emerald-300">
                        {formatRupiah(activeSession.total)}
                      </span>
                    </div>
                    {activeSession.paymentStatus === 'paid' ? (
                      <div className="rounded-xl bg-emerald-800/80 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-300" />
                        <span>Tagihan Meja Ini Telah LUNAS di Kasir</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-emerald-300/80 italic">
                        * Pembayaran dapat diselesaikan di kasir saat selesai makan.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. FLOATING CART BOTTOM BAR */}
      {cart.length > 0 && activeTab === 'menu' && (
        <div className="fixed bottom-20 inset-x-4 z-40 mx-auto max-w-md">
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
                  Keranjang ({currentTable.name})
                </span>
                <span className="font-black text-sm">{formatRupiah(cartTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span>Lihat Keranjang</span>
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
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl space-y-4">
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Jumlah Pesanan</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="h-7 w-7 rounded-lg bg-white text-slate-700 flex items-center justify-center text-xs shadow-2xs hover:bg-slate-100"
                >
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-800">{itemQty}</span>
                <button
                  type="button"
                  onClick={() => setItemQty(itemQty + 1)}
                  className="h-7 w-7 rounded-lg bg-white text-slate-700 flex items-center justify-center text-xs shadow-2xs hover:bg-slate-100"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Item Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Pesanan <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="cth: Jangan pedas / es sedikit"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
            >
              Tambah ke Keranjang • {formatRupiah(customizeItem.harga * itemQty)}
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL KERANJANG PESANAN */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-emerald-600" />
                  Pesanan {currentTable.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeSession ? 'Pesanan akan digabung ke tagihan meja aktif' : 'Meja belum diaktifkan oleh kasir'}
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {submitError && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-start gap-2 border border-red-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

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
                  Nama Pemesan <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="cth: Kak Ahmad"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
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
                  <span>TOTAL PESANAN:</span>
                  <span className="text-emerald-700 text-base">{formatRupiah(cartTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              {!activeSession ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-amber-100 text-amber-800 font-bold text-xs cursor-not-allowed"
                  >
                    Menunggu Kasir Mengaktifkan Meja
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Beri tahu staf atau kasir untuk membuka sesi Meja {currentTable.name}.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50 active:scale-98"
                >
                  {isSubmitting ? (
                    <span>Mengirim ke Kasir...</span>
                  ) : (
                    <>
                      <span>Kirim Pesanan ke Kasir</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 6. MODAL BATALKAN PESANAN PELANGGAN */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs"
            onClick={() => setCancellingOrder(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800">Batalkan Pesanan</h3>
                <p className="text-xs text-slate-400">
                  #{cancellingOrder.orderNumber || cancellingOrder.id.slice(-6)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Alasan Pembatalan <span className="text-rose-500">*</span>
              </label>
              {[
                'Ingin mengganti menu',
                'Salah input jumlah pesanan',
                'Waktu tunggu terlalu lama',
                'Alasan lain...',
              ].map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={customerCancelReason === r}
                    onChange={(e) => setCustomerCancelReason(e.target.value)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{r}</span>
                </label>
              ))}

              {customerCancelReason === 'Alasan lain...' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customerCancelCustom}
                    onChange={(e) => setCustomerCancelCustom(e.target.value)}
                    placeholder="Tuliskan alasan pembatalan..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            {cancelModalError && (
              <p className="text-xs text-rose-600 font-bold">{cancelModalError}</p>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleCustomerCancelOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500"
              >
                Konfirmasi Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PROFIL & INFORMASI TOKO / MEJA */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs"
            onClick={() => setIsProfileModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <i className="fa-solid fa-store text-lg"></i>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {storeProfile?.nama || 'Wartomson Store'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Informasi Meja &amp; Toko</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Meja yang Digunakan:</span>
                  <span className="font-bold text-slate-800">{currentTable.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Tamu / Pelanggan:</span>
                  <span className="font-bold text-emerald-700">
                    {activeSession?.customerName || customerNameInput || 'Belum diisi'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Sesi:</span>
                  <span className="font-bold text-slate-800">
                    {activeSession ? 'Aktif' : 'Belum Ada Sesi'}
                  </span>
                </div>
                {activeSession && (
                  <div className="flex justify-between pt-1 border-t border-emerald-200/60">
                    <span className="text-slate-600 font-semibold">Total Tagihan Sesi:</span>
                    <span className="font-black text-emerald-800 text-sm">
                      {formatRupiah(activeSession.total)}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 text-slate-600">
                <div className="flex items-start gap-2">
                  <i className="fa-solid fa-location-dot text-slate-400 mt-0.5"></i>
                  <div>
                    <span className="font-bold text-slate-700 block">Alamat Toko</span>
                    <span>{storeProfile?.alamat || 'Pusat Kuliner Wartomson Store'}</span>
                  </div>
                </div>
                {storeProfile?.telepon && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <i className="fa-solid fa-phone text-slate-400"></i>
                    <div>
                      <span className="font-bold text-slate-700 block">Kontak Bantuan</span>
                      <span>{storeProfile.telepon}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 7. CUSTOMER MOBILE BOTTOM NAVIGATION BAR (SELALU DI BAWAH) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('menu');
              setIsProfileModalOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'menu' && !isProfileModalOpen
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
              activeTab === 'menu' && !isProfileModalOpen ? 'bg-emerald-50 text-emerald-600' : ''
            }`}>
              <i className="fa-solid fa-house text-sm"></i>
            </div>
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          {/* 2. Kategori */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('menu');
              setIsProfileModalOpen(false);
              const el = document.getElementById('qr-categories-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl">
              <i className="fa-solid fa-shapes text-sm"></i>
            </div>
            <span className="text-[10px] mt-0.5">Kategori</span>
          </button>

          {/* 3. Keranjang */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-emerald-600 transition cursor-pointer"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-xl">
              <i className="fa-solid fa-cart-shopping text-sm"></i>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white shadow-2xs">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Keranjang</span>
          </button>

          {/* 4. Pesanan */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('status');
              setIsProfileModalOpen(false);
            }}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'status' && !isProfileModalOpen
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`relative flex h-7 w-7 items-center justify-center rounded-xl transition ${
              activeTab === 'status' && !isProfileModalOpen ? 'bg-emerald-50 text-emerald-600' : ''
            }`}>
              <i className="fa-solid fa-receipt text-sm"></i>
              {sessionOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white shadow-2xs">
                  {sessionOrders.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Pesanan</span>
          </button>

          {/* 5. Profil */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer ${
              isProfileModalOpen
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
              isProfileModalOpen ? 'bg-emerald-50 text-emerald-600' : ''
            }`}>
              <i className="fa-solid fa-user text-sm"></i>
            </div>
            <span className="text-[10px] mt-0.5">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
