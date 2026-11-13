import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Banknote,
  Smartphone,
  CheckCircle2,
  ReceiptText,
  X,
  ShoppingBag,
  Printer,
  Barcode,
  AlertTriangle,
  Table2,
  Truck,
  MapPin,
  Phone,
  Package,
  Search,
  Eye,
  CreditCard,
  Building,
  QrCode,
  Check,
  AlertCircle,
  Clock,
  Send,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Bell,
  RotateCcw,
  FileText,
  CheckCircle,
  XCircle,
  ChefHat,
  Tag,
  Layers,
  ChevronRight,
  RefreshCw,
  Info,
  Gift,
  Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoWatermark from '../components/common/LogoWatermark';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import { generateTableQrDataUrl } from '../utils/qrCode';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { openThermalReceipt, openOrderSlipReceipt } from '../utils/receipt';
import { getSession, getNotifPrefs } from '../utils/storage';

// Definisi metode pembayaran terkelompok
const ALL_PAYMENT_GROUPS = [
  {
    id: 'Tunai',
    label: 'Tunai',
    icon: Banknote,
    methods: [{ id: 'Tunai', label: 'Tunai', icon: Banknote }],
  },
  {
    id: 'QRIS',
    label: 'QRIS',
    icon: QrCode,
    methods: [{ id: 'QRIS', label: 'QRIS', icon: QrCode }],
  },
  {
    id: 'Digital',
    label: 'Dompet Digital',
    icon: Smartphone,
    methods: [
      { id: 'GoPay', label: 'GoPay', icon: Smartphone },
      { id: 'OVO', label: 'OVO', icon: Smartphone },
      { id: 'DANA', label: 'DANA', icon: Smartphone },
      { id: 'ShopeePay', label: 'ShopeePay', icon: Smartphone },
      { id: 'LinkAja', label: 'LinkAja', icon: Smartphone },
    ],
  },
  {
    id: 'Transfer',
    label: 'Transfer Bank',
    icon: Building,
    methods: [{ id: 'Transfer Bank', label: 'Transfer Bank', icon: Building }],
  },
  {
    id: 'Kartu',
    label: 'Kartu Debit / Kredit',
    icon: CreditCard,
    methods: [
      { id: 'Kartu Debit', label: 'Kartu Debit', icon: CreditCard },
      { id: 'Kartu Kredit', label: 'Kartu Kredit', icon: CreditCard },
    ],
  },
];

const COURIER_OPTIONS = [
  'Kurir Toko',
  'GrabExpress',
  'GoSend',
  'Maxim',
  'JNE',
  'SiCepat',
  'Anteraja',
  'Lainnya',
];

const CANCEL_REASONS = [
  'Bahan baku habis',
  'Meja penuh / tidak tersedia',
  'Pelanggan membatalkan pesanan',
  'Waktu tunggu terlalu lama',
  'Toko sedang tutup / istirahat',
  'Kesalahan input pesanan',
  'Lainnya',
];

function ProductCardImage({ foto, nama }) {
  const [error, setError] = useState(false);

  if (!foto || error) {
    return (
      <div className="flex aspect-square sm:aspect-auto sm:h-24 w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-slate-400">
        <Package size={24} />
      </div>
    );
  }

  return (
    <div className="aspect-square sm:aspect-auto sm:h-24 w-full overflow-hidden rounded-xl bg-slate-100">
      <img
        src={foto}
        alt={nama}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
    </div>
  );
}

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return `${Math.floor(diffHour / 24)} hari lalu`;
}

export default function Transaksi() {
  const { currentUserDisplay, cashierOperator } = useAuth();
  const defaultKasirName = currentUserDisplay || cashierOperator || 'Kasir';
  const [manualKasirName, setManualKasirName] = useState('');
  const activeKasirName = manualKasirName.trim() || defaultKasirName;

  // QRIS Simulation States
  const [qrisQrDataUrl, setQrisQrDataUrl] = useState('');
  const [isGeneratingQris, setIsGeneratingQris] = useState(false);

  const {
    products,
    productMeta,
    paymentMethods,
    storeProfile,
    settings,
    minStockThreshold,
    formatRupiah,
    completeTransaction,
    printerSettings,
    tables,
    tableSessions,
    orders,
    createUnifiedOrder,
    updateOrderProcessingStatus,
    closeTableSession,
    createDebt,
  } = useData();

  // Top View Navigation: 'pos' (Kasir POS) vs 'queue' (Antrean & Pesanan Unified)
  const [activeMainTab, setActiveMainTab] = useState('pos');

  // Search & Barcode in POS
  const [search, setSearch] = useState('');

  // Cart
  const [cart, setCart] = useState([]);

  // Payment
  const [paymentCategory, setPaymentCategory] = useState('Tunai');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paid, setPaid] = useState('');
  const [isDigitalConfirmed, setIsDigitalConfirmed] = useState(false);

  // Customer & Service Type
  // 'dine_in' | 'delivery' | 'pickup'
  const [orderType, setOrderType] = useState('dine_in');
  const [customer, setCustomer] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupCode, setPickupCode] = useState(() => `PU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [pickupTime, setPickupTime] = useState('15 menit');

  // Summary
  const [discount, setDiscount] = useState('');

  // Transaction Tax States (Pajak Transaksi)
  const [isPajakTransaksiActive, setIsPajakTransaksiActive] = useState(
    Boolean(settings?.pajakTransaksiAktif)
  );
  const [pajakTransaksiPersen, setPajakTransaksiPersen] = useState(
    settings?.pajakTransaksiPersen !== undefined ? settings.pajakTransaksiPersen : 10
  );
  const pajakTransaksiJenis = settings?.pajakTransaksiJenis || 'PPN';

  useEffect(() => {
    if (settings) {
      setIsPajakTransaksiActive(Boolean(settings.pajakTransaksiAktif));
      setPajakTransaksiPersen(
        settings.pajakTransaksiPersen !== undefined ? settings.pajakTransaksiPersen : 10
      );
    }
  }, [settings?.pajakTransaksiAktif, settings?.pajakTransaksiPersen]);

  // Modals & Notifications
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [scannerNotification, setScannerNotification] = useState(null);

  // URL Query Params (misal tableId dari Menu Meja)
  const [searchParams] = useSearchParams();

  // Table Selection for Dine In
  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    const paramTableId = searchParams.get('tableId');
    if (paramTableId) {
      setSelectedTable(paramTableId);
      setOrderType('dine_in');
    }
  }, [searchParams]);

  // Delivery Modal Fields
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryAddressNote, setDeliveryAddressNote] = useState('');
  const [deliveryCourier, setDeliveryCourier] = useState('Kurir Toko');
  const [deliveryCourierPhone, setDeliveryCourierPhone] = useState('');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryModalError, setDeliveryModalError] = useState('');

  // UI / Drawer States
  const [cartPulse, setCartPulse] = useState(false);
  const [pressedProductId, setPressedProductId] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Item Special Note Drawer/Modal
  const [editingItemNote, setEditingItemNote] = useState(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Unified Order Queue Filtering
  const [queueTypeFilter, setQueueTypeFilter] = useState('all'); // 'all' | 'dine_in' | 'delivery' | 'pickup'
  const [queueStatusFilter, setQueueStatusFilter] = useState('all'); // 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  const [queueSearch, setQueueSearch] = useState('');

  // Cancel Order Modal
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Bahan baku habis');
  const [cancelCustomText, setCancelCustomText] = useState('');

  // Pay Queue Order Modal
  const [payingOrder, setPayingOrder] = useState(null);
  const [queuePaidAmount, setQueuePaidAmount] = useState('');
  const [queuePayMethod, setQueuePayMethod] = useState('Tunai');
  const [queueQrisConfirmed, setQueueQrisConfirmed] = useState(false);

  const cartRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastScanRef = useRef({ code: '', time: 0 });
  const processingRef = useRef(false);
  const receiptPrintingRef = useRef(false);

  const paperSize = printerSettings?.paperSize || '58';

  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  // Helper Perhitungan Seluruh Jenis Promo Produk (Persen, Nominal, B1G1, B2G1, B3G1, B1G2, Gratis Topping)
  const getItemPromo = (item, meta) => {
    if (!item) return null;
    const isPromoActive = Boolean(meta?.promoActive || item.promoActive || item.promo || meta?.b1g1);
    if (!isPromoActive) return null;

    const today = new Date().toISOString().slice(0, 10);
    if (meta?.promoStartDate && today < meta.promoStartDate.slice(0, 10)) {
      return null;
    }
    if (meta?.promoEndDate && today > meta.promoEndDate.slice(0, 10)) {
      return null;
    }

    const pType = String(meta?.promoType || item.promoType || (meta?.b1g1 ? 'b1g1' : 'nominal')).toLowerCase();
    const schemeNote = String(meta?.b1g1Note || meta?.promoTitle || '').toLowerCase();
    const basePrice = Number(item.harga || 0);
    const totalQty = Number(item.qty || 1);

    // A. Diskon Persentase (%)
    // Contoh: harga Rp21.000 dengan diskon 2% menghasilkan potongan Rp420, harga akhir Rp20.580
    if (pType === 'persen') {
      const val = Number(meta?.promoValue || item.promoValue || item.diskonPersen || 0);
      if (val > 0) {
        const discountPerUnit = Math.round((basePrice * val) / 100);
        const netPricePerUnit = Math.max(0, basePrice - discountPerUnit);
        const totalDiscount = discountPerUnit * totalQty;
        return {
          type: 'persen',
          label: `Diskon ${val}%`,
          val,
          discountPerUnit,
          netPricePerUnit,
          totalDiscount,
          originalTotal: basePrice * totalQty,
          finalTotal: netPricePerUnit * totalQty,
        };
      }
    }

    // B. Potongan Harga Nominal (Rp)
    if (pType === 'nominal') {
      const val = Number(meta?.promoValue || item.promoValue || item.diskon || 0);
      if (val > 0) {
        const discountPerUnit = Math.min(basePrice, val);
        const netPricePerUnit = Math.max(0, basePrice - discountPerUnit);
        const totalDiscount = discountPerUnit * totalQty;
        return {
          type: 'nominal',
          label: `Potongan ${formatRupiah(val)}`,
          val,
          discountPerUnit,
          netPricePerUnit,
          totalDiscount,
          originalTotal: basePrice * totalQty,
          finalTotal: netPricePerUnit * totalQty,
        };
      }
    }

    // C. Gratis Topping
    if (pType === 'gratis_topping' || schemeNote.includes('topping')) {
      const toppingVal = Number(meta?.promoValue) || 3000;
      const discountPerUnit = Math.min(basePrice, toppingVal);
      const totalDiscount = discountPerUnit * totalQty;
      return {
        type: 'gratis_topping',
        label: `Gratis Topping (${formatRupiah(toppingVal)})`,
        val: toppingVal,
        discountPerUnit,
        netPricePerUnit: Math.max(0, basePrice - discountPerUnit),
        totalDiscount,
        originalTotal: basePrice * totalQty,
        finalTotal: (basePrice - discountPerUnit) * totalQty,
      };
    }

    // D. Beli 2 Gratis 1 (B2G1)
    if (pType === 'b2g1' || schemeNote.includes('beli 2 gratis 1') || schemeNote.includes('b2g1')) {
      const freeCount = Math.floor(totalQty / 3);
      const paidCount = totalQty - freeCount;
      const totalDiscount = freeCount * basePrice;
      return {
        type: 'b2g1',
        label: `Beli 2 Gratis 1 (${freeCount} gratis)`,
        freeCount,
        paidCount,
        discountPerUnit: 0,
        totalDiscount,
        originalTotal: basePrice * totalQty,
        finalTotal: paidCount * basePrice,
      };
    }

    // E. Beli 3 Gratis 1 (B3G1)
    if (pType === 'b3g1' || schemeNote.includes('beli 3 gratis 1') || schemeNote.includes('b3g1')) {
      const freeCount = Math.floor(totalQty / 4);
      const paidCount = totalQty - freeCount;
      const totalDiscount = freeCount * basePrice;
      return {
        type: 'b3g1',
        label: `Beli 3 Gratis 1 (${freeCount} gratis)`,
        freeCount,
        paidCount,
        discountPerUnit: 0,
        totalDiscount,
        originalTotal: basePrice * totalQty,
        finalTotal: paidCount * basePrice,
      };
    }

    // F. Beli 1 Gratis 2 (B1G2)
    if (pType === 'b1g2' || schemeNote.includes('beli 1 gratis 2') || schemeNote.includes('b1g2')) {
      const freeCount = Math.floor(totalQty / 3) * 2;
      const paidCount = totalQty - freeCount;
      const totalDiscount = freeCount * basePrice;
      return {
        type: 'b1g2',
        label: `Beli 1 Gratis 2 (${freeCount} gratis)`,
        freeCount,
        paidCount,
        discountPerUnit: 0,
        totalDiscount,
        originalTotal: basePrice * totalQty,
        finalTotal: paidCount * basePrice,
      };
    }

    // G. Beli 1 Gratis 1 (B1G1)
    if (pType === 'b1g1' || meta?.b1g1 || schemeNote.includes('beli 1 gratis 1') || schemeNote.includes('b1g1')) {
      const freeCount = Math.floor(totalQty / 2);
      const paidCount = totalQty - freeCount;
      const totalDiscount = freeCount * basePrice;
      return {
        type: 'b1g1',
        label: `Beli 1 Gratis 1 (${freeCount} gratis)`,
        freeCount,
        paidCount,
        discountPerUnit: 0,
        totalDiscount,
        originalTotal: basePrice * totalQty,
        finalTotal: paidCount * basePrice,
      };
    }

    return null;
  };

  const activeTables = useMemo(() => {
    return (tables || []).filter((t) => t.active !== false);
  }, [tables]);

  // Selected table active session check
  const selectedTableActiveSession = useMemo(() => {
    if (!selectedTable) return null;
    return (tableSessions || []).find(
      (s) => s.tableId === selectedTable && s.status !== 'closed'
    );
  }, [selectedTable, tableSessions]);

  const isDelivery = orderType === 'delivery';

  // Count pending unconfirmed orders (e.g. from QR Menu)
  const pendingOrdersCount = useMemo(() => {
    return (orders || []).filter((o) => o.orderStatus === 'pending').length;
  }, [orders]);

  const inProgressOrdersCount = useMemo(() => {
    return (orders || []).filter(
      (o) =>
        o.orderStatus !== 'cancelled' &&
        o.fulfillmentStatus !== 'completed' &&
        o.fulfillmentStatus !== 'delivered' &&
        o.fulfillmentStatus !== 'picked_up'
    ).length;
  }, [orders]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const regeneratePickupCode = () => {
    setPickupCode(`PU-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Filter payment groups according to enabled methods in Pengaturan
  const availablePaymentGroups = useMemo(() => {
    const pm = paymentMethods || {};

    const filteredGroups = ALL_PAYMENT_GROUPS.map((group) => {
      const activeMethods = group.methods.filter((m) => {
        // Hilangkan Tunai, QRIS, dan Kartu Debit/Kredit pada transaksi Delivery
        if (orderType === 'delivery') {
          if (m.id === 'Tunai' || m.id === 'QRIS' || m.id === 'Kartu Debit' || m.id === 'Kartu Kredit') {
            return false;
          }
        }
        if (pm[m.id] !== undefined) return Boolean(pm[m.id]);
        if (pm[group.id] !== undefined) return Boolean(pm[group.id]);
        return true;
      });

      return {
        ...group,
        methods: activeMethods,
      };
    }).filter((group) => {
      if (group.methods.length === 0) return false;
      // Khusus Delivery, jangan tampilkan grup Tunai, QRIS, atau Kartu sama sekali
      if (orderType === 'delivery' && (group.id === 'Tunai' || group.id === 'QRIS' || group.id === 'Kartu')) return false;
      return true;
    });

    // Pada Delivery HANYA diperbolehkan metode digital / transfer bank (Tidak ada Tunai / COD)
    return filteredGroups;
  }, [orderType, paymentMethods]);

  // Ensure current selected payment method is valid
  useEffect(() => {
    const allActiveMethodIds = [];
    availablePaymentGroups.forEach((g) => {
      g.methods.forEach((m) => allActiveMethodIds.push(m.id));
    });

    if (allActiveMethodIds.length > 0 && !allActiveMethodIds.includes(paymentMethod)) {
      const fallback = allActiveMethodIds[0];
      setPaymentMethod(fallback);
      if (fallback === 'Tunai' || fallback === 'COD') {
        setPaymentCategory(fallback);
      } else {
        setPaymentCategory('Digital');
      }
    }
  }, [availablePaymentGroups, paymentMethod]);

  const handleSelectPaymentGroup = (group) => {
    setIsDigitalConfirmed(false);
    if (group.id === 'Tunai' || group.id === 'COD') {
      setPaymentCategory(group.id);
      setPaymentMethod(group.id);
    } else {
      setPaymentCategory('Digital');
      if (group.methods.length === 1) {
        setPaymentMethod(group.methods[0].id);
      } else {
        const hasCurrent = group.methods.some((m) => m.id === paymentMethod);
        if (!hasCurrent && group.methods.length > 0) {
          setPaymentMethod(group.methods[0].id);
        }
      }
    }
  };

  // =========================================================
  // A & B. FILTER PRODUK (Satu kolom pencarian, produk aktif saja)
  // =========================================================

  const filteredProducts = useMemo(() => {
    const keyword = String(search || '').trim().toLowerCase();

    return products.filter((p) => {
      if (p.status !== 'Aktif') return false;
      if (!keyword) return true;

      const nama = String(p.nama || '').toLowerCase();
      const kode = String(p.kode || '').toLowerCase();

      return nama.includes(keyword) || kode.includes(keyword);
    });
  }, [products, search]);

  // =========================================================
  // C. CART ACTIONS
  // =========================================================

  const addToCart = (product) => {
    if (!product || Number(product.stok || 0) <= 0) {
      showToast(`Stok "${product?.nama}" habis!`);
      return;
    }

    setPressedProductId(product.id);
    setCartPulse(true);

    setTimeout(() => setPressedProductId(null), 200);
    setTimeout(() => setCartPulse(false), 350);

    const meta = metaMap[product.id];
    const today = new Date().toISOString().slice(0, 10);
    const isPromoValid =
      meta?.promoActive &&
      (!meta?.promoStartDate || today >= meta.promoStartDate.slice(0, 10)) &&
      (!meta?.promoEndDate || today <= meta.promoEndDate.slice(0, 10));

    let initialQty = 1;
    let promoToast = null;

    if (isPromoValid) {
      const pType = String(meta?.promoType || (meta?.b1g1 ? 'b1g1' : '')).toLowerCase();
      const schemeNote = String(meta?.b1g1Note || meta?.promoTitle || '').toLowerCase();
      const stock = Number(product.stok || 0);

      if ((pType === 'b3g1' || schemeNote.includes('beli 3 gratis 1') || schemeNote.includes('b3g1')) && stock >= 4) {
        initialQty = 4;
        promoToast = 'Promo Beli 3 Gratis 1: 4 item ditambahkan ke keranjang (1 gratis)!';
      } else if (
        (pType === 'b2g1' || schemeNote.includes('beli 2 gratis 1') || schemeNote.includes('b2g1')) &&
        stock >= 3
      ) {
        initialQty = 3;
        promoToast = 'Promo Beli 2 Gratis 1: 3 item ditambahkan ke keranjang (1 gratis)!';
      } else if (
        (pType === 'b1g2' || schemeNote.includes('beli 1 gratis 2') || schemeNote.includes('b1g2')) &&
        stock >= 3
      ) {
        initialQty = 3;
        promoToast = 'Promo Beli 1 Gratis 2: 3 item ditambahkan ke keranjang (2 gratis)!';
      } else if (
        (pType === 'b1g1' || meta?.b1g1 || schemeNote.includes('beli 1 gratis 1') || schemeNote.includes('b1g1')) &&
        stock >= 2
      ) {
        initialQty = 2;
        promoToast = 'Promo Beli 1 Gratis 1: 2 item ditambahkan ke keranjang (1 gratis)!';
      }
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);

      if (existing) {
        if (existing.qty >= product.stok) {
          showToast(`Stok ${product.nama} tersisa ${product.stok}`);
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      if (promoToast) {
        showToast(promoToast);
      }

      return [
        ...prev,
        {
          ...product,
          qty: initialQty,
          notes: '',
          pajakAktif: Boolean(product.pajakAktif),
          pajakJenis: product.pajakJenis || 'PPN',
          pajakPersen:
            product.pajakPersen !== undefined ? Number(product.pajakPersen) : 10,
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const nextQty = i.qty + delta;
          const maxStock = Number(i.stok) || 9999;
          if (nextQty > maxStock) {
            showToast(`Maksimal stok tercapai (${maxStock})`);
            return i;
          }
          return {
            ...i,
            qty: Math.max(0, nextQty),
          };
        })
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    showToast('Keranjang telah dikosongkan');
  };

  const handleOpenItemNoteModal = (item) => {
    setEditingItemNote(item);
    setTempNoteText(item.notes || '');
  };

  const handleSaveItemNote = () => {
    if (!editingItemNote) return;
    setCart((prev) =>
      prev.map((i) => (i.id === editingItemNote.id ? { ...i, notes: tempNoteText.trim() } : i))
    );
    setEditingItemNote(null);
    setTempNoteText('');
    showToast('Catatan item diperbarui');
  };

  // =========================================================
  // CALCULATION (Dual Tax, Promo Engine & Biaya Pengiriman)
  // =========================================================

  // Gross Subtotal (Harga Katalog Awal)
  const grossSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.harga || 0) * Number(item.qty || 0),
    0
  );

  // Total Potongan Seluruh Jenis Promo Produk (Persen, B1G1, Nominal)
  const totalItemPromoDiscount = cart.reduce((sum, item) => {
    const promo = getItemPromo(item, metaMap[item.id]);
    return sum + (promo?.totalDiscount || 0);
  }, 0);

  // Subtotal Netto setelah Promo
  const netSubtotal = Math.max(0, grossSubtotal - totalItemPromoDiscount);
  const subtotal = netSubtotal; // Kompatibilitas variabel struk & transaksi

  const totalQuantity = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const discountValue = Number(discount) || 0; // Diskon Tambahan Kasir (Voucher Manual)

  // 1. Pajak Barang (per produk kena pajak, dihitung dari harga net setelah promo)
  const totalPajakBarang = cart.reduce((sum, item) => {
    if (item.pajakAktif && Number(item.pajakPersen) > 0) {
      const promo = getItemPromo(item, metaMap[item.id]);
      const itemNet = promo ? promo.finalTotal : Number(item.harga || 0) * Number(item.qty || 0);
      const tax = Math.round((itemNet * Number(item.pajakPersen)) / 100);
      return sum + tax;
    }
    return sum;
  }, 0);

  // 2. Pajak Transaksi (Perlindungan Anti Pajak Ganda, basis DPP setelah promo & diskon)
  const nonPajakBarangSubtotal = cart.reduce((sum, item) => {
    if (!item.pajakAktif || !item.pajakPersen) {
      const promo = getItemPromo(item, metaMap[item.id]);
      return sum + (promo ? promo.finalTotal : Number(item.harga || 0) * Number(item.qty || 0));
    }
    return sum;
  }, 0);

  const dppTransaksiNet = Math.max(0, nonPajakBarangSubtotal - discountValue);
  const totalPajakTransaksi =
    isPajakTransaksiActive && Number(pajakTransaksiPersen) > 0
      ? Math.round((dppTransaksiNet * Number(pajakTransaksiPersen)) / 100)
      : 0;

  const totalPajak = totalPajakBarang + totalPajakTransaksi;
  const shippingCost = isDelivery ? Math.max(0, Number(deliveryCost) || 0) : 0;

  const total = Math.max(
    0,
    netSubtotal - discountValue + totalPajak + shippingCost
  );

  const paidValue = Number(paid) || 0;
  const isCashPayment = paymentMethod === 'Tunai';
  const change = Math.max(0, paidValue - total);
  const isCashInsufficient = isCashPayment && total > 0 && paidValue < total;

  const isDeliveryComplete = Boolean(
    deliveryName.trim() && deliveryPhone.trim() && deliveryAddress.trim()
  );

  // Barcode search handler
  const showScannerNotif = (msg, type) => {
    setScannerNotification({ msg, type });
    setTimeout(() => setScannerNotification(null), 3000);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const query = String(search || '').trim();
    if (!query) return;

    const now = Date.now();
    if (lastScanRef.current.code === query && now - lastScanRef.current.time < 400) {
      return;
    }
    lastScanRef.current = { code: query, time: now };

    const matchBarcode = products.find(
      (p) =>
        p.status === 'Aktif' &&
        p.kode &&
        String(p.kode).toLowerCase() === query.toLowerCase()
    );

    if (matchBarcode) {
      if (Number(matchBarcode.stok || 0) <= 0) {
        showScannerNotif(`Stok "${matchBarcode.nama}" habis!`, 'warning');
        return;
      }
      addToCart(matchBarcode);
      showScannerNotif(`${matchBarcode.nama} ditambahkan ke keranjang`, 'success');
      setSearch('');
      return;
    }

    if (filteredProducts.length === 1) {
      const single = filteredProducts[0];
      if (Number(single.stok || 0) <= 0) {
        showScannerNotif(`Stok "${single.nama}" habis!`, 'warning');
        return;
      }
      addToCart(single);
      showScannerNotif(`${single.nama} ditambahkan ke keranjang`, 'success');
      setSearch('');
      return;
    }

    if (filteredProducts.length === 0) {
      showScannerNotif(`Barang "${query}" tidak ditemukan!`, 'error');
    }
  };

  // Delivery modal save
  const handleSaveDeliveryModal = (e) => {
    if (e) e.preventDefault();
    setDeliveryModalError('');

    if (!deliveryName.trim()) {
      setDeliveryModalError('Nama penerima wajib diisi.');
      return;
    }
    const cleanPhone = deliveryPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setDeliveryModalError('Nomor HP/WhatsApp hanya boleh berisi angka (minimal 9 digit).');
      return;
    }
    if (!deliveryAddress.trim()) {
      setDeliveryModalError('Alamat lengkap pengiriman wajib diisi.');
      return;
    }

    setShowDeliveryModal(false);
    showToast('Data pengiriman delivery disimpan');
    setValidationError('');
  };

  // =========================================================
  // SUBMISSION: SIMPAN KE MEJA / SIMPAN ANTREAN (UNPAID)
  // =========================================================

  const handleSaveOrderToQueue = (isDirectPayment = false) => {
    setValidationError('');

    if (cart.length === 0) {
      setValidationError('Keranjang belanja masih kosong.');
      return;
    }

    if (orderType === 'dine_in' && !selectedTable) {
      setValidationError('Pilih nomor meja terlebih dahulu untuk layanan Dine In.');
      return;
    }

    if (orderType === 'delivery') {
      const cleanPhone = deliveryPhone.replace(/\D/g, '');
      if (!deliveryName.trim() || !cleanPhone || cleanPhone.length < 9 || !deliveryAddress.trim()) {
        setShowDeliveryModal(true);
        setValidationError('Lengkapi data pengiriman delivery (nama, nomor HP angka valid min. 9 digit, alamat).');
        return;
      }
    }

    if (isDirectPayment && isCashPayment && (!paid || paidValue < total)) {
      setValidationError('Uang tunai diterima kurang dari total pembayaran.');
      return;
    }

    if (isDirectPayment && paymentCategory === 'Digital' && !isDigitalConfirmed) {
      setValidationError('Harap konfirmasi verifikasi pembayaran digital / QRIS / Debit terlebih dahulu.');
      return;
    }

    if (processingRef.current) return;
    processingRef.current = true;

    const selectedTableData = activeTables.find((t) => t.id === selectedTable);
    const guestName =
      orderType === 'delivery'
        ? deliveryName.trim()
        : customer.trim() || (orderType === 'dine_in' ? `Tamu ${selectedTableData?.name || 'Meja'}` : 'Umum');

    const paymentStat = isDirectPayment ? 'paid' : 'unpaid';
    const payMeth = isDirectPayment ? paymentMethod : null;

    try {
      const created = createUnifiedOrder({
        orderType,
        source: 'pos_cashier',
        cashierName: activeKasirName,
        tableId: orderType === 'dine_in' ? selectedTable : null,
        customerName: guestName,
        customerPhone: orderType === 'delivery' ? deliveryPhone.replace(/\D/g, '').trim() : customerPhone.replace(/\D/g, '').trim(),
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : null,
        deliveryAddressNote: orderType === 'delivery' ? deliveryAddressNote.trim() : null,
        deliveryCourier: orderType === 'delivery' ? deliveryCourier : null,
        deliveryCourierPhone: orderType === 'delivery' ? deliveryCourierPhone.replace(/\D/g, '').trim() : null,
        shippingCost,
        pickupCode: orderType === 'pickup' ? pickupCode : null,
        pickupTime: orderType === 'pickup' ? pickupTime : null,
        items: cart.map((it) => ({
          id: it.id,
          nama: it.nama,
          harga: it.harga,
          qty: it.qty,
          notes: it.notes || '',
          pajakAktif: Boolean(it.pajakAktif),
          pajakJenis: it.pajakJenis,
          pajakPersen: it.pajakPersen,
        })),
        discount: discountValue + totalItemPromoDiscount,
        tax: totalPajak,
        paymentStatus: paymentStat,
        paymentMethod: payMeth,
        initialOrderStatus: 'confirmed', // pesanan kasir langsung berstatus confirmed
      });

      // Jika bayar langsung di kasir
      if (isDirectPayment) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const tanggalStr =
          `${now.getFullYear()}-` +
          `${pad(now.getMonth() + 1)}-` +
          `${pad(now.getDate())} ` +
          `${pad(now.getHours())}:` +
          `${pad(now.getMinutes())}`;

        const trx = {
          id: `TRX-${Date.now().toString().slice(-8)}`,
          orderId: created.id,
          orderNumber: created.orderNumber,
          tanggal: tanggalStr,
          kasir: activeKasirName,
          cashierName: activeKasirName,
          customer: guestName,
          items: cart.map((item) => ({
            id: item.id,
            nama: item.nama,
            qty: item.qty,
            harga: item.harga,
            notes: item.notes || '',
            pajakAktif: Boolean(item.pajakAktif),
            pajakJenis: item.pajakJenis || 'PPN',
            pajakPersen: item.pajakPersen || 0,
          })),
          subtotal: grossSubtotal,
          grossSubtotal,
          netSubtotal,
          promoDiscount: totalItemPromoDiscount,
          discount: discountValue + totalItemPromoDiscount,
          pajakBarang: totalPajakBarang,
          pajakTransaksi: totalPajakTransaksi,
          pajakTransaksiPersen: isPajakTransaksiActive ? Number(pajakTransaksiPersen) || 0 : 0,
          pajakTransaksiJenis,
          totalPajak,
          tax: totalPajak,
          shippingCost,
          total,
          paid: isCashPayment ? paidValue : total,
          change: isCashPayment ? change : 0,
          paymentCategory,
          paymentMethod,
          metode: paymentMethod,
          paymentStatus: 'Lunas',
          status: 'Selesai',
          orderType,
          tableId: orderType === 'dine_in' ? selectedTable : null,
          tableName: orderType === 'dine_in' ? selectedTableData?.name : null,
          pickupCode: orderType === 'pickup' ? pickupCode : null,
          pickupTime: orderType === 'pickup' ? pickupTime : null,
          deliveryName: orderType === 'delivery' ? deliveryName.trim() : null,
          deliveryPhone: orderType === 'delivery' ? deliveryPhone.trim() : null,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : null,
          deliveryCourier: orderType === 'delivery' ? deliveryCourier : null,
        };

        completeTransaction(trx);
        setLastTransaction(trx);
        setShowReceipt(true);
      } else {
        showToast(
          orderType === 'dine_in'
            ? `Pesanan disimpan ke Meja ${selectedTableData?.name || ''}`
            : 'Pesanan tersimpan di Antrean Kasir'
        );
      }

      // Reset cart and fields
      setCart([]);
      setPaid('');
      setDiscount('');
      setCustomer('');
      setCustomerPhone('');
      regeneratePickupCode();
      setIsDigitalConfirmed(false);
    } catch (err) {
      console.error('Error saat menyimpan pesanan:', err);
      setValidationError('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      processingRef.current = false;
    }
  };

  // =========================================================
  // QUEUE ACTIONS (CONFIRM, CANCEL, STATUS STEP, PAY)
  // =========================================================

  const handleConfirmOrder = (order) => {
    updateOrderProcessingStatus(order.id, {
      orderStatus: 'confirmed',
      fulfillmentStatus: 'preparing',
    });
    showToast(`Pesanan #${order.orderNumber || order.id.slice(-6)} dikonfirmasi!`);
  };

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order);
    setCancelReason('Bahan baku habis');
    setCancelCustomText('');
  };

  const handleConfirmCancelOrder = () => {
    if (!cancellingOrder) return;
    const finalReason =
      cancelReason === 'Lainnya' && cancelCustomText.trim()
        ? cancelCustomText.trim()
        : cancelReason;

    updateOrderProcessingStatus(cancellingOrder.id, {
      orderStatus: 'cancelled',
      cancellationReason: finalReason,
    });

    setCancellingOrder(null);
    showToast('Pesanan dibatalkan & stok dikembalikan otomatis');
  };

  const handleAdvanceFulfillment = (order) => {
    const cur = order.fulfillmentStatus || 'pending';
    let nextStatus = cur;

    if (cur === 'pending' || cur === 'preparing') {
      nextStatus = 'ready';
    } else if (cur === 'ready') {
      if (order.orderType === 'dine_in') {
        nextStatus = 'served';
      } else if (order.orderType === 'delivery') {
        nextStatus = 'delivering';
      } else {
        nextStatus = 'picked_up';
      }
    } else if (cur === 'delivering') {
      nextStatus = 'delivered';
    }

    updateOrderProcessingStatus(order.id, {
      fulfillmentStatus: nextStatus,
    });
    showToast(`Status diperbarui ke: ${nextStatus.toUpperCase()}`);
  };

  const handleOpenPayQueueOrder = (order) => {
    setPayingOrder(order);
    setQueuePaidAmount(String(order.total || ''));
    setQueuePayMethod(order.orderType === 'delivery' ? 'GoPay' : 'Tunai');
    setQueueQrisConfirmed(false);
  };

  const handleConfirmPayQueueOrder = () => {
    if (!payingOrder) return;
    const paidNum = Number(queuePaidAmount) || payingOrder.total;

    // Validasi Pembayaran Tunai
    if (queuePayMethod === 'Tunai' && paidNum < payingOrder.total) {
      showToast('Uang pembayaran tunai kurang dari total tagihan!', 'error');
      return;
    }

    // Validasi Pembayaran QRIS
    if (queuePayMethod === 'QRIS' && !queueQrisConfirmed) {
      showToast('Harap lakukan konfirmasi simulasi pembayaran QRIS terlebih dahulu.', 'error');
      return;
    }

    // Update status order menjadi paid. JANGAN menutup sesi meja!
    updateOrderProcessingStatus(payingOrder.id, {
      paymentStatus: 'paid',
      paymentMethod: queuePayMethod,
      cashierName: activeKasirName,
    });

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const tanggalStr =
      `${now.getFullYear()}-` +
      `${pad(now.getMonth() + 1)}-` +
      `${pad(now.getDate())} ` +
      `${pad(now.getHours())}:` +
      `${pad(now.getMinutes())}`;

    const trx = {
      id: `TRX-${Date.now().toString().slice(-8)}`,
      orderId: payingOrder.id,
      orderNumber: payingOrder.orderNumber,
      tanggal: tanggalStr,
      kasir: activeKasirName,
      cashierName: activeKasirName,
      customer: payingOrder.customerName || 'Umum',
      items: payingOrder.items || [],
      subtotal: payingOrder.subtotal,
      discount: payingOrder.discount || 0,
      tax: payingOrder.tax || 0,
      totalPajak: payingOrder.tax || 0,
      shippingCost: payingOrder.shippingCost || 0,
      total: payingOrder.total,
      paid: paidNum,
      change: Math.max(0, paidNum - payingOrder.total),
      paymentMethod: queuePayMethod,
      metode: queuePayMethod,
      paymentStatus: 'Lunas',
      status: 'Selesai',
      orderType: payingOrder.orderType,
      tableId: payingOrder.tableId,
      tableName: payingOrder.tableName,
      sessionId: payingOrder.sessionId,
      pickupCode: payingOrder.pickupCode,
    };

    completeTransaction(trx);
    setLastTransaction(trx);
    setShowReceipt(true);
    setPayingOrder(null);
    setQueueQrisConfirmed(false);
    showToast('Pembayaran berhasil diselesaikan');
  };

  const handlePrintKitchenSlip = (order) => {
    openOrderSlipReceipt({
      order,
      storeProfile,
      paperSize,
    });
  };

  // Filtered Queue Orders
  const filteredQueueOrders = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();

    return (orders || []).filter((o) => {
      // 1. Order Type Filter
      if (queueTypeFilter !== 'all' && o.orderType !== queueTypeFilter) {
        return false;
      }

      // 2. Status Filter
      if (queueStatusFilter !== 'all') {
        if (queueStatusFilter === 'pending' && o.orderStatus !== 'pending') return false;
        if (
          queueStatusFilter === 'preparing' &&
          !(o.orderStatus !== 'cancelled' && (o.fulfillmentStatus === 'preparing' || o.fulfillmentStatus === 'pending'))
        )
          return false;
        if (queueStatusFilter === 'ready' && o.fulfillmentStatus !== 'ready') return false;
        if (
          queueStatusFilter === 'completed' &&
          !['completed', 'served', 'delivered', 'picked_up'].includes(o.fulfillmentStatus)
        )
          return false;
        if (queueStatusFilter === 'cancelled' && o.orderStatus !== 'cancelled') return false;
      }

      // 3. Search query
      if (q) {
        const idMatch = String(o.id || '').toLowerCase().includes(q);
        const numMatch = String(o.orderNumber || '').toLowerCase().includes(q);
        const custMatch = String(o.customerName || '').toLowerCase().includes(q);
        const tableMatch = String(o.tableName || '').toLowerCase().includes(q);
        const pickupMatch = String(o.pickupCode || '').toLowerCase().includes(q);
        if (!idMatch && !numMatch && !custMatch && !tableMatch && !pickupMatch) return false;
      }

      return true;
    });
  }, [orders, queueTypeFilter, queueStatusFilter, queueSearch]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-3 py-4 sm:px-5 lg:px-6">
      <LogoWatermark size="lg" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-4">
        {/* =========================================================
            TOP NAV TABS: KASIR POS VS ANTREAN & PESANAN (UNIFIED)
        ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMainTab('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeMainTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingCart size={16} />
              <span>Kasir POS (Register)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('queue')}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeMainTab === 'queue'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers size={16} />
              <span>Antrean &amp; Manajemen Pesanan</span>

              {/* Pulsing Badge for Pending Orders */}
              {pendingOrdersCount > 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow-xs animate-pulse">
                  <Bell size={10} />
                  <span>{pendingOrdersCount} Baru</span>
                </span>
              ) : inProgressOrdersCount > 0 ? (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {inProgressOrdersCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pl-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Unified Order Engine: Dine In · Delivery · Pickup</span>
          </div>
        </div>

        {/* =========================================================
            VIEW 1: KASIR POS (REGISTER MODE)
        ========================================================= */}
        {activeMainTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
            {/* LEFT COLUMN: PRODUCT CATALOG & SEARCH (7 of 12 cols desktop) */}
            <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-7 space-y-3.5">
              {/* Unified Search & Barcode Input */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Cari nama, kode barang, atau scan barcode..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-24 text-xs sm:text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                    <Barcode size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-mono hidden sm:inline bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-600">
                      Enter
                    </span>
                  </div>
                </div>

                {/* Barcode Scanner Notification */}
                <AnimatePresence>
                  {scannerNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                        scannerNotification.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : scannerNotification.type === 'warning'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {scannerNotification.type === 'success' ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <AlertTriangle size={15} />
                      )}
                      <span>{scannerNotification.msg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Product Catalog Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredProducts.map((product) => {
                  const meta = metaMap[product.id];
                  const stokVal = Number(product.stok || 0);
                  const isOutOfStock = stokVal <= 0;
                  const threshold =
                    Number(product.minStok) > 0
                      ? Number(product.minStok)
                      : Number(minStockThreshold) > 0
                      ? Number(minStockThreshold)
                      : 5;
                  const isLowStock = stokVal > 0 && stokVal <= threshold;
                  const isPressed = pressedProductId === product.id;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-2.5 text-left transition-all duration-150 select-none ${
                        isOutOfStock
                          ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-md cursor-pointer active:scale-98'
                      } ${isPressed ? 'ring-2 ring-emerald-500 shadow-md' : 'shadow-2xs'}`}
                    >
                      <div className="relative">
                        <ProductCardImage foto={product.foto} nama={product.nama} />

                        {/* Tombol Info Barang Langsung di POS */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailProduct(product);
                          }}
                          className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-2xs hover:bg-emerald-600 hover:text-white transition"
                          title="Lihat Detail & Promo Barang"
                        >
                          <Info size={13} />
                        </button>

                        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                          {meta?.bestSeller && (
                            <span className="rounded-md bg-amber-500/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                              BEST SELLER
                            </span>
                          )}
                          {(meta?.promoActive || product.promo) && (
                            <span className="rounded-md bg-rose-600/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                              {meta?.promoType === 'b1g1' || meta?.b1g1
                                ? 'B1G1'
                                : meta?.promoType === 'persen'
                                ? `-${meta?.promoValue}%`
                                : 'PROMO'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                            {product.nama}
                          </h3>
                          <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                            {product.kategori || 'Umum'}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <div className="min-w-0">
                            <span className="text-xs font-black text-emerald-700 block truncate">
                              {formatRupiah(product.harga)}
                            </span>
                            <span
                              className={`inline-block text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isOutOfStock ? 'Habis' : `${stokVal} ${product.satuan || 'pcs'}`}
                            </span>
                          </div>

                          {/* Tombol Tambah Keranjang Sentuh Nyaman Khusus Smartphone */}
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className={`flex items-center justify-center gap-1 min-h-[38px] min-w-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                              isOutOfStock
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            }`}
                            title="Tambah ke Keranjang"
                          >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Tambah</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating Mobile Cart Bar (Hanya tampil di mobile ketika keranjang terisi) */}
              {cart.length > 0 && (
                <div className="fixed bottom-18 inset-x-3 z-30 lg:hidden animate-in slide-in-from-bottom duration-300 no-print">
                  <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                        <ShoppingCart size={18} />
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                          {totalQuantity}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-medium truncate">{cart.length} Produk Dipilih</span>
                        <span className="text-sm font-black text-white">{formatRupiah(total)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cartEl = document.getElementById('pos-cart-container');
                        if (cartEl) {
                          cartEl.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
                    >
                      <span>Lihat &amp; Bayar</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CART & UNIFIED CHECKOUT (5 of 12 cols desktop) */}
            <div id="pos-cart-container" className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <LogoWatermark size="sm" />

              {/* FIXED CART HEADER */}
              <div className="relative z-10 shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    ref={cartRef}
                    animate={
                      cartPulse
                        ? { scale: [1, 1.15, 0.95, 1], rotate: [0, -6, 6, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs"
                  >
                    <ShoppingCart size={16} />
                  </motion.div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Keranjang Kasir</h2>
                    <p className="text-[11px] text-slate-400">
                      {cart.length} item ({totalQuantity} pcs)
                    </p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
                  >
                    <Trash2 size={13} />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {/* SCROLLABLE CART ITEMS LIST */}
              <div className="relative z-10 flex-1 min-h-[140px] overflow-y-auto px-4 py-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 px-4">
                    <ShoppingCart size={28} className="text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-600">Keranjang masih kosong</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px]">
                      Klik menu di katalog atau scan barcode untuk menambahkan pesanan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="flex flex-col gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-2.5 transition hover:border-slate-300"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-800 break-words leading-snug">
                                  {item.nama}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const prod = products.find((p) => p.id === item.id) || item;
                                    setDetailProduct(prod);
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-emerald-700 transition"
                                  title="Lihat info & promo barang"
                                >
                                  <Info size={12} />
                                </button>
                              </div>

                              {/* Promo Detail Breakdown */}
                              {(() => {
                                const promo = getItemPromo(item, metaMap[item.id]);
                                if (!promo) return null;
                                return (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700 border border-rose-200">
                                      <Percent size={10} />
                                      {promo.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {formatRupiah(promo.originalTotal)}
                                    </span>
                                    <span className="text-[10px] font-bold text-rose-600">
                                      -{formatRupiah(promo.totalDiscount)}
                                    </span>
                                  </div>
                                );
                              })()}

                              {item.notes ? (
                                <p className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  Catatan: {item.notes}
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenItemNoteModal(item)}
                                  className="text-[10px] text-slate-400 hover:text-emerald-700 underline block mt-0.5"
                                >
                                  + Tambah catatan koki/dapur
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {item.notes && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenItemNoteModal(item)}
                                  className="text-[10px] text-slate-400 hover:text-slate-600 p-1"
                                  title="Ubah catatan"
                                >
                                  <Tag size={12} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                            <span className="text-[11px] font-semibold text-slate-500">
                              {formatRupiah(item.harga)}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, -1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs hover:border-rose-300 hover:text-rose-600 transition"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-slate-800">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs hover:border-emerald-300 hover:text-emerald-600 transition"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <div className="text-right min-w-[70px]">
                              {(() => {
                                const promo = getItemPromo(item, metaMap[item.id]);
                                if (promo) {
                                  return (
                                    <div>
                                      <span className="text-[10px] text-slate-400 line-through block">
                                        {formatRupiah(promo.originalTotal)}
                                      </span>
                                      <span className="font-black text-xs text-emerald-700">
                                        {formatRupiah(promo.finalTotal)}
                                      </span>
                                    </div>
                                  );
                                }
                                return (
                                  <span className="font-black text-xs text-slate-800">
                                    {formatRupiah(item.harga * item.qty)}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* ORDER TYPE, PAYMENT, SUMMARY & FIXED CHECKOUT */}
              <div className="relative z-10 shrink-0 max-h-[52vh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 space-y-3">
                {/* IDENTITAS KASIR PENERIMA PESANAN (Dapat Diisi & Diedit Manual) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <User size={13} className="text-emerald-600" />
                      <span>Kasir Penerima Pesanan:</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">(Manual / Otomatis)</span>
                  </div>
                  <input
                    type="text"
                    value={manualKasirName}
                    onChange={(e) => setManualKasirName(e.target.value)}
                    placeholder={defaultKasirName}
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3 Unified Order Types: Dine In, Delivery, Pickup */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Jenis Layanan Pesanan
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('dine_in');
                        setValidationError('');
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 text-xs font-bold transition ${
                        orderType === 'dine_in'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Table2 size={15} />
                      <span className="text-[11px]">Dine In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('delivery');
                        setValidationError('');
                        if (!isDeliveryComplete) {
                          setShowDeliveryModal(true);
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 text-xs font-bold transition ${
                        orderType === 'delivery'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Truck size={15} />
                      <span className="text-[11px]">Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderType('pickup');
                        setValidationError('');
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 text-xs font-bold transition ${
                        orderType === 'pickup'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ShoppingBag size={15} />
                      <span className="text-[11px]">Pickup</span>
                    </button>
                  </div>
                </div>

                {/* DINE IN: Table Selector & Table Session Detection */}
                {orderType === 'dine_in' && (
                  <div className="space-y-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Table2 size={13} className="text-emerald-600" />
                        <span>Pilih Nomor Meja *</span>
                      </label>
                      {selectedTableActiveSession && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          Sesi Aktif
                        </span>
                      )}
                    </div>

                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs outline-none transition focus:border-emerald-500 font-semibold"
                    >
                      <option value="">— Pilih Meja Pelanggan —</option>
                      {activeTables.map((t) => {
                        const hasSession = (tableSessions || []).some(
                          (s) => s.tableId === t.id && s.status !== 'closed'
                        );
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} (Kapasitas: {t.capacity || 4} orang) {hasSession ? '· Sedang Ada Tamu' : '· Kosong'}
                          </option>
                        );
                      })}
                    </select>

                    {/* Table Session Banner */}
                    {selectedTableActiveSession ? (
                      <div className="rounded-lg bg-indigo-50 p-2 text-[11px] text-indigo-900 border border-indigo-200 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Sesi: #{selectedTableActiveSession.id.slice(-6)}</span>
                          <span>Tagihan Saat Ini: {formatRupiah(selectedTableActiveSession.total)}</span>
                        </div>
                        <p className="text-indigo-700">
                          Pesanan baru ini akan otomatis digabungkan ke sesi meja ini sebagai <b>Pesanan Tambahan</b>.
                        </p>
                      </div>
                    ) : selectedTable ? (
                      <p className="text-[11px] text-emerald-700">
                        Meja saat ini kosong. Sesi baru akan dibuat otomatis untuk meja ini.
                      </p>
                    ) : null}

                    <div>
                      <input
                        type="text"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="Nama Tamu / Pelanggan (opsional)"
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs outline-none transition focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* DELIVERY: Summary Box */}
                {orderType === 'delivery' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Truck size={14} className="text-emerald-700" />
                        <span className="text-xs font-bold text-slate-800">Data Pengiriman (Delivery)</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDeliveryComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isDeliveryComplete ? 'Lengkap' : 'Belum Lengkap'}
                      </span>
                    </div>

                    {isDeliveryComplete ? (
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{deliveryName}</span>
                          <span className="text-slate-500 font-normal">{deliveryPhone}</span>
                        </div>
                        <p className="line-clamp-2 text-slate-500">{deliveryAddress}</p>
                        {shippingCost > 0 && (
                          <p className="text-emerald-700 font-bold pt-0.5">
                            Ongkir: {formatRupiah(shippingCost)} ({deliveryCourier})
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-800">
                        Nama penerima, no. HP, dan alamat pengiriman wajib diisi.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowDeliveryModal(true)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white py-1.5 px-3 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-50 transition"
                    >
                      <MapPin size={13} />
                      <span>{isDeliveryComplete ? 'Ubah Data Pengiriman' : 'Isi Data Pengiriman'}</span>
                    </button>
                  </div>
                )}

                {/* PICKUP: Details */}
                {orderType === 'pickup' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-amber-700" />
                        <span className="text-xs font-bold text-slate-800">Pengambilan Mandiri (Pickup)</span>
                      </div>
                      <button
                        type="button"
                        onClick={regeneratePickupCode}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:underline"
                      >
                        <RefreshCw size={10} />
                        <span>Acak Kode</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">Kode Pengambilan</span>
                        <span className="text-sm font-black text-amber-800 font-mono tracking-wider">
                          {pickupCode}
                        </span>
                      </div>
                      <div>
                        <select
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full h-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-emerald-500 font-semibold"
                        >
                          <option value="15 menit">Ambil dlm 15 mnt</option>
                          <option value="30 menit">Ambil dlm 30 mnt</option>
                          <option value="45 menit">Ambil dlm 45 mnt</option>
                          <option value="60 menit">Ambil dlm 1 jam</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="Nama Pemesan (opsional)"
                        className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="No. HP / WA (hanya angka)"
                        className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* METODE PEMBAYARAN */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Metode Pembayaran</label>
                    <span className="text-[11px] text-slate-400">
                      Dipilih: <b className="text-slate-700">{paymentMethod}</b>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {availablePaymentGroups.map((group) => {
                      const Icon = group.icon;
                      const isGroupActive =
                        (group.id === 'Tunai' && isCashPayment) ||
                        (group.id === 'COD' && paymentMethod === 'COD') ||
                        (group.id !== 'Tunai' &&
                          group.id !== 'COD' &&
                          group.methods.some((m) => m.id === paymentMethod));

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => handleSelectPaymentGroup(group)}
                          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                            isGroupActive
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{group.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-Methods: Dompet Digital / Kartu */}
                  {(() => {
                    const currentGroup = availablePaymentGroups.find((g) =>
                      g.methods.some((m) => m.id === paymentMethod)
                    );
                    if (!currentGroup || currentGroup.methods.length <= 1) return null;

                    return (
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Penyedia {currentGroup.label}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentGroup.methods.map((m) => {
                            const active = paymentMethod === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setPaymentMethod(m.id);
                                  setIsDigitalConfirmed(false);
                                }}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                                  active
                                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* QRIS SIMULASI (Scannable QR + Konfirmasi Pembayaran) */}
                  {paymentMethod === 'QRIS' && (
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <QrCode size={16} className="text-emerald-700" />
                          <span className="text-xs font-black text-emerald-950">QRIS Kasir (Simulasi Operasional)</span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isDigitalConfirmed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDigitalConfirmed ? 'LUNAS (TERKONFIRMASI)' : 'MENUNGGU PEMBAYARAN'}
                        </span>
                      </div>

                      {/* Tampilan QR Code Scannable */}
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-emerald-200">
                        {isGeneratingQris ? (
                          <div className="h-32 w-32 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                            <RefreshCw size={20} className="animate-spin text-emerald-600" />
                            <span className="text-[10px] font-bold">Membuat QRIS...</span>
                          </div>
                        ) : qrisQrDataUrl ? (
                          <div className="space-y-1.5 text-center">
                            <img
                              src={qrisQrDataUrl}
                              alt="QRIS Simulasi"
                              className="h-32 w-32 object-contain mx-auto rounded-lg border border-slate-100 shadow-2xs"
                            />
                            <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                              NMID: ID1020000000001 • {storeProfile?.nama || 'Qurmacel POS'}
                            </p>
                            <p className="text-xs font-black text-emerald-700">
                              Tagihan: {formatRupiah(total)}
                            </p>
                          </div>
                        ) : (
                          <div className="h-32 w-32 flex items-center justify-center text-slate-300">
                            <QrCode size={36} />
                          </div>
                        )}
                      </div>

                      {/* Tombol Konfirmasi Pembayaran QRIS */}
                      {isDigitalConfirmed ? (
                        <div className="flex items-center justify-between rounded-xl bg-emerald-100 p-2 text-xs font-bold text-emerald-900 border border-emerald-300">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-emerald-700" />
                            <span>Pembayaran QRIS Berhasil Dikonfirmasi</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDigitalConfirmed(false)}
                            className="text-[10px] underline text-emerald-700 hover:text-emerald-900"
                          >
                            Ubah
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDigitalConfirmed(true);
                            showToast('Pembayaran QRIS berhasil dikonfirmasi (Simulasi Lunas)');
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-98 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={14} />
                          <span>Konfirmasi Pembayaran (Simulasi Lunas)</span>
                        </button>
                      )}

                      <p className="text-[9.5px] text-slate-400 text-center leading-tight">
                        * Simulasi operasional kasir untuk mencatat status transaksi lunas tanpa transfer uang sungguhan.
                      </p>
                    </div>
                  )}

                  {/* KARTU DEBIT (Konfirmasi Manual Kasir) */}
                  {paymentMethod === 'Kartu Debit' && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={16} className="text-indigo-700" />
                          <span className="text-xs font-black text-indigo-950">Kartu Debit (Mesin EDC)</span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isDigitalConfirmed
                              ? 'bg-indigo-600 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDigitalConfirmed ? 'LUNAS (EDC BERHASIL)' : 'MENUNGGU VERIFIKASI EDC'}
                        </span>
                      </div>

                      {isDigitalConfirmed ? (
                        <div className="flex items-center justify-between rounded-xl bg-indigo-100 p-2 text-xs font-bold text-indigo-900 border border-indigo-300">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-indigo-700" />
                            <span>Transaksi Kartu Debit Dikonfirmasi Kasir</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDigitalConfirmed(false)}
                            className="text-[10px] underline text-indigo-700 hover:text-indigo-900"
                          >
                            Ubah
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDigitalConfirmed(true);
                            showToast('Transaksi Kartu Debit dikonfirmasi kasir (Lunas)');
                          }}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-98 flex items-center justify-center gap-1.5"
                        >
                          <CreditCard size={14} />
                          <span>Konfirmasi Pembayaran Mesin EDC Berhasil</span>
                        </button>
                      )}

                      <p className="text-[9.5px] text-slate-400 text-center leading-tight">
                        * Kasir memastikan struk mesin EDC telah keluar sebelum mengonfirmasi lunas.
                      </p>
                    </div>
                  )}

                  {/* DOMPET DIGITAL / TRANSFER BANK (Konfirmasi Lainnya) */}
                  {!isCashPayment && paymentMethod !== 'COD' && paymentMethod !== 'QRIS' && paymentMethod !== 'Kartu Debit' && (
                    <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 space-y-1.5">
                      <div className="flex items-start gap-2 text-[11px] text-slate-600">
                        <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800">Verifikasi {paymentMethod}</p>
                          <p className="text-[10px] text-slate-500">
                            Pastikan dana telah masuk sebelum transaksi diselesaikan.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-200/80 select-none">
                        <input
                          type="checkbox"
                          checked={isDigitalConfirmed}
                          onChange={(e) => setIsDigitalConfirmed(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Kasir telah memverifikasi pembayaran berhasil
                        </span>
                      </label>
                    </div>
                  )}

                  {/* CASH MANUAL INPUT */}
                  {isCashPayment && (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <label className="block text-xs font-bold text-slate-700">
                        Nominal Uang Diterima (Manual)
                      </label>
                      <div className="relative">
                        <Banknote
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="number"
                          min="0"
                          value={paid}
                          onChange={(e) => setPaid(e.target.value)}
                          placeholder="Ketik nominal uang diterima..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs font-bold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      {paidValue >= total && total > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-emerald-100/70 px-2.5 py-1.5 text-xs text-emerald-900 font-bold">
                          <span>Kembalian:</span>
                          <span>{formatRupiah(change)}</span>
                        </div>
                      )}
                      {isCashInsufficient && (
                        <div className="flex items-center justify-between rounded-lg bg-rose-100/70 px-2.5 py-1.5 text-xs text-rose-900 font-bold">
                          <span>Uang Kurang:</span>
                          <span>{formatRupiah(total - paidValue)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RINGKASAN PEMBAYARAN */}
                <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Awal (Katalog):</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(grossSubtotal)}</span>
                  </div>

                  {totalItemPromoDiscount > 0 && (
                    <div className="flex justify-between text-rose-700 bg-rose-50 px-2 py-1 rounded-lg font-bold">
                      <span className="flex items-center gap-1">
                        <Gift size={12} />
                        <span>Potongan Promo Produk:</span>
                      </span>
                      <span>-{formatRupiah(totalItemPromoDiscount)}</span>
                    </div>
                  )}

                  {totalItemPromoDiscount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Setelah Promo:</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(netSubtotal)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-slate-600">
                    <span>Diskon Tambahan Kasir:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-right text-xs outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {totalPajakBarang > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <span>Pajak Barang:</span>
                        <span className="text-[10px] text-slate-400">(per produk)</span>
                      </span>
                      <span className="font-semibold text-emerald-700">
                        +{formatRupiah(totalPajakBarang)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPajakTransaksiActive}
                        onChange={(e) => setIsPajakTransaksiActive(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="font-medium">
                        Pajak Transaksi {isPajakTransaksiActive ? `(${pajakTransaksiPersen}%)` : ''}:
                      </span>
                    </label>
                    <div>
                      {isPajakTransaksiActive ? (
                        <span className="font-semibold text-emerald-700">
                          +{formatRupiah(totalPajakTransaksi)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Nonaktif</span>
                      )}
                    </div>
                  </div>

                  {isDelivery && shippingCost > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Pengiriman ({deliveryCourier}):</span>
                      <span className="font-semibold text-emerald-700">
                        +{formatRupiah(shippingCost)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-200">
                    <span className="text-sm font-extrabold text-slate-800">Total Tagihan:</span>
                    <span className="text-base font-black text-emerald-700">
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>

                {/* Validation Error Banner */}
                {validationError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="flex-1 font-medium">{validationError}</span>
                    <button
                      type="button"
                      onClick={() => setValidationError('')}
                      className="p-0.5 text-rose-400 hover:text-rose-700"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* DUAL CHECKOUT BUTTONS: SIMPAN KE MEJA / ANTREAN vs BAYAR LANGSUNG */}
                <div className="pt-2 sticky bottom-0 bg-white space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveOrderToQueue(false)}
                      disabled={cart.length === 0}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 py-2.5 px-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChefHat size={15} />
                      <span>
                        {orderType === 'dine_in'
                          ? 'Simpan ke Meja'
                          : 'Simpan ke Antrean'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveOrderToQueue(true)}
                      disabled={cart.length === 0 || isCashInsufficient}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      <CheckCircle2 size={15} />
                      <span>Bayar Langsung</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 2: ANTREAN & MANAJEMEN PESANAN (UNIFIED ORDERS)
        ========================================================= */}
        {activeMainTab === 'queue' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Cari ID pesanan, nama tamu, meja, atau kode pickup..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Service Type Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-xs font-bold text-slate-400 mr-1">Layanan:</span>
                  {[
                    { id: 'all', label: 'Semua Layanan' },
                    { id: 'dine_in', label: 'Dine In' },
                    { id: 'delivery', label: 'Delivery' },
                    { id: 'pickup', label: 'Pickup' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setQueueTypeFilter(f.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shrink-0 ${
                        queueTypeFilter === f.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 mr-1">Status:</span>
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Menunggu Konfirmasi' },
                  { id: 'preparing', label: 'Dimasak / Diproses' },
                  { id: 'ready', label: 'Siap Saji / Kirim' },
                  { id: 'completed', label: 'Selesai' },
                  { id: 'cancelled', label: 'Dibatalkan' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setQueueStatusFilter(s.id)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                      queueStatusFilter === s.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredQueueOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <Layers size={36} className="mx-auto text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Tidak ada pesanan ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pesanan masuk dari Kasir POS atau QR Menu Meja akan ditampilkan di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredQueueOrders.map((order) => {
                  const isPending = order.orderStatus === 'pending';
                  const isCancelled = order.orderStatus === 'cancelled';
                  const isConfirmed = order.orderStatus === 'confirmed';
                  const isPaid = order.paymentStatus === 'paid';
                  const ful = order.fulfillmentStatus || 'pending';

                  return (
                    <div
                      key={order.id}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs transition hover:shadow-md ${
                        isPending
                          ? 'border-amber-300 ring-2 ring-amber-400/30'
                          : isCancelled
                          ? 'border-slate-200 opacity-60 bg-slate-50/70'
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-xs font-black text-slate-800">
                                #{order.orderNumber || order.id.slice(-6)}
                              </span>

                              {/* Order Type Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  order.orderType === 'dine_in'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : order.orderType === 'delivery'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {order.orderType === 'dine_in'
                                  ? `Dine In · ${order.tableName || 'Meja'}`
                                  : order.orderType === 'delivery'
                                  ? 'Delivery'
                                  : `Pickup · ${order.pickupCode || ''}`}
                              </span>

                              {/* Source Badge */}
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {order.source === 'qr_menu' ? 'QR Meja' : 'Kasir POS'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                              <Clock size={11} />
                              <span>{timeAgo(order.createdAt)}</span>
                              <span>·</span>
                              <span>{order.customerName || 'Umum'}</span>
                              <span>·</span>
                              <span className="text-slate-600 font-semibold">Kasir: {order.cashierName || order.kasir || 'Kasir'}</span>
                            </p>
                          </div>

                          {/* Payment Status Pill */}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPaid ? 'LUNAS' : 'BELUM BAYAR'}
                          </span>
                        </div>

                        {/* Status Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                          {isPending && (
                            <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                              <AlertCircle size={10} />
                              <span>Menunggu Konfirmasi Kasir</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              Dibatalkan: {order.cancellationReason || 'Alasan umum'}
                            </span>
                          )}
                          {!isCancelled && isConfirmed && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                              {ful === 'preparing'
                                ? 'Sedang Dimasak'
                                : ful === 'ready'
                                ? 'Siap Saji / Siap Kirim'
                                : ful === 'served'
                                ? 'Sudah Disajikan'
                                : ful === 'delivering'
                                ? 'Dalam Pengiriman'
                                : ful === 'delivered'
                                ? 'Terkirim'
                                : ful === 'picked_up'
                                ? 'Sudah Diambil'
                                : 'Diproses'}
                            </span>
                          )}
                        </div>

                        {/* Delivery / Pickup Info Detail if applicable */}
                        {order.orderType === 'delivery' && (
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-0.5">
                            <p className="font-semibold text-slate-800">
                              Alamat: {order.deliveryAddress}
                            </p>
                            {order.courier && (
                              <p className="text-slate-500">
                                Kurir: {order.courier} · Ongkir: {formatRupiah(order.shippingCost || 0)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Items list */}
                        <div className="py-2 space-y-1.5 border-t border-dashed border-slate-200 max-h-40 overflow-y-auto">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="flex justify-between items-baseline">
                                <span className="font-medium text-slate-800">
                                  {it.qty}x {it.nama}
                                </span>
                                <span className="text-slate-500 font-mono">
                                  {formatRupiah((Number(it.harga) || 0) * (Number(it.qty) || 1))}
                                </span>
                              </div>
                              {it.notes && (
                                <p className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                  Catatan: {it.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Grand Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-slate-800">
                          <span>Total:</span>
                          <span className="text-sm font-black text-emerald-700">
                            {formatRupiah(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        {isPending && (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(order)}
                              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-1.5 px-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                            >
                              <CheckCircle size={14} />
                              <span>Konfirmasi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(order)}
                              className="flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-white py-1.5 px-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                            >
                              <XCircle size={14} />
                              <span>Tolak / Batalkan</span>
                            </button>
                          </div>
                        )}

                        {!isCancelled && isConfirmed && (
                          <div className="flex items-center gap-1.5">
                            {ful === 'preparing' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceFulfillment(order)}
                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-1.5 px-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition"
                              >
                                <Check size={14} />
                                <span>Tandai Siap Saji / Kirim</span>
                              </button>
                            )}

                            {ful === 'ready' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceFulfillment(order)}
                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-1.5 px-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                              >
                                <CheckCircle2 size={14} />
                                <span>
                                  {order.orderType === 'dine_in'
                                    ? 'Sajikan ke Meja'
                                    : order.orderType === 'delivery'
                                    ? 'Kirim Pesanan'
                                    : 'Pesanan Diambil'}
                                </span>
                              </button>
                            )}

                            {ful === 'delivering' && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceFulfillment(order)}
                                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-700 py-1.5 px-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition"
                              >
                                <CheckCircle2 size={14} />
                                <span>Tandai Terkirim</span>
                              </button>
                            )}

                            {/* Payment Settlement Button if Unpaid */}
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayQueueOrder(order)}
                                className="flex items-center justify-center gap-1 rounded-xl bg-amber-500 py-1.5 px-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition"
                              >
                                <Banknote size={14} />
                                <span>Bayar</span>
                              </button>
                            )}

                            {/* Print Kitchen Slip */}
                            <button
                              type="button"
                              onClick={() => handlePrintKitchenSlip(order)}
                              className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                              title="Cetak Slip Dapur / Pesanan"
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          ITEM NOTE MODAL
      ========================================================= */}
      <AnimatePresence>
        {editingItemNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setEditingItemNote(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-800">
                Catatan Khusus: {editingItemNote.nama}
              </h3>
              <p className="text-xs text-slate-500">
                Instruksi khusus untuk dapur (misal: pedas, es dipisah, tanpa bawang).
              </p>
              <textarea
                rows={3}
                value={tempNoteText}
                onChange={(e) => setTempNoteText(e.target.value)}
                placeholder="Tuliskan catatan khusus..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItemNote(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemNote}
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
                >
                  Simpan Catatan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================
          CANCEL ORDER MODAL (WITH PREMADE REASONS & STOCK RESTORATION)
      ========================================================= */}
      <AnimatePresence>
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setCancellingOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertCircle size={20} />
                <span>Tolak / Batalkan Pesanan</span>
              </div>
              <p className="text-xs text-slate-600">
                Membatalkan pesanan <b>#{cancellingOrder.orderNumber || cancellingOrder.id.slice(-6)}</b> akan mengembalikan stok bahan/produk secara otomatis.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Alasan Penolakan:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CANCEL_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        cancelReason === r
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {cancelReason === 'Lainnya' && (
                <textarea
                  rows={2}
                  value={cancelCustomText}
                  onChange={(e) => setCancelCustomText(e.target.value)}
                  placeholder="Ketik alasan khusus pembatalan..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-rose-500"
                />
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelOrder}
                  className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-500"
                >
                  Konfirmasi Batalkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================
          PAY QUEUE ORDER MODAL
      ========================================================= */}
      <AnimatePresence>
        {payingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setPayingOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-3"
            >
              <h3 className="text-base font-bold text-slate-800">
                Penyelesaian Pembayaran Pesanan #{payingOrder.orderNumber || payingOrder.id.slice(-6)}
              </h3>
              <div className="flex justify-between text-xs font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span>Total Tagihan:</span>
                <span className="text-emerald-700 text-sm">{formatRupiah(payingOrder.total)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={queuePayMethod}
                  onChange={(e) => {
                    setQueuePayMethod(e.target.value);
                    setQueueQrisConfirmed(false);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500 font-semibold"
                >
                  {payingOrder.orderType === 'delivery' ? (
                    <>
                      <option value="GoPay">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="ShopeePay">ShopeePay</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                    </>
                  ) : (
                    <>
                      <option value="Tunai">Tunai</option>
                      <option value="QRIS">QRIS</option>
                      <option value="GoPay">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="DANA">DANA</option>
                      <option value="ShopeePay">ShopeePay</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Kartu Debit">Kartu Debit</option>
                    </>
                  )}
                </select>
                {payingOrder.orderType === 'delivery' && (
                  <p className="mt-1 text-[10px] text-amber-700 font-medium">
                    * Pesanan Delivery hanya menerima pembayaran dompet digital atau transfer bank.
                  </p>
                )}
              </div>

              {queuePayMethod === 'QRIS' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center space-y-2">
                  <span className="text-xs font-bold text-emerald-950 block">QRIS Dinamis Kasir (Simulasi)</span>
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-emerald-200">
                    <QrCode size={64} className="text-emerald-700" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Pelanggan memindai QRIS melalui m-banking atau e-wallet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQueueQrisConfirmed(true)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      queueQrisConfirmed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    {queueQrisConfirmed ? 'Pembayaran QRIS Berhasil Dikonfirmasi' : 'Konfirmasi Simulasi QRIS Berhasil'}
                  </button>
                </div>
              )}

              {queuePayMethod === 'Tunai' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Uang Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={queuePaidAmount}
                    onChange={(e) => setQueuePaidAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold outline-none focus:border-emerald-500"
                  />
                  {Number(queuePaidAmount) >= payingOrder.total ? (
                    <div className="flex justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-1 border border-emerald-200">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(Number(queuePaidAmount) - payingOrder.total)}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] font-bold text-rose-600">
                      Uang pembayaran kurang {formatRupiah(payingOrder.total - (Number(queuePaidAmount) || 0))}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayQueueOrder}
                  disabled={
                    (queuePayMethod === 'Tunai' && Number(queuePaidAmount) < payingOrder.total) ||
                    (queuePayMethod === 'QRIS' && !queueQrisConfirmed)
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Simpan &amp; Lunas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================
          DELIVERY MODAL
      ========================================================= */}
      <AnimatePresence>
        {showDeliveryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setShowDeliveryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Formulir Pengiriman (Delivery)</h3>
                    <p className="text-xs text-slate-500">Kelompok data penerima dan kurir pengiriman</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDeliveryModal} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
                {deliveryModalError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{deliveryModalError}</span>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-white">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
                    <User size={13} />
                    <span>1. Informasi Penerima (Wajib)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Penerima *</label>
                      <input
                        required
                        type="text"
                        value={deliveryName}
                        onChange={(e) => setDeliveryName(e.target.value)}
                        placeholder="Nama pelanggan / penerima"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Nomor HP / WhatsApp (Hanya Angka) *</label>
                      <input
                        required
                        type="tel"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="cth: 081234567890 (angka saja)"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Hanya angka (minimal 9 digit, tanpa huruf).</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Alamat Lengkap Pengiriman *</label>
                      <textarea
                        required
                        rows={3}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan kota..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none transition focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Patokan / Detail Alamat (Opsional)</label>
                      <input
                        type="text"
                        value={deliveryAddressNote}
                        onChange={(e) => setDeliveryAddressNote(e.target.value)}
                        placeholder="cth: Rumah pagar hitam depan pos satpam"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-white">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
                    <Truck size={13} />
                    <span>2. Informasi Pengiriman &amp; Kurir</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Pilihan Kurir</label>
                      <select
                        value={deliveryCourier}
                        onChange={(e) => setDeliveryCourier(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500"
                      >
                        {COURIER_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Biaya Pengiriman / Ongkir (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        value={deliveryCost}
                        onChange={(e) => setDeliveryCost(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">No. HP Kurir (Opsional)</label>
                      <input
                        type="tel"
                        value={deliveryCourierPhone}
                        onChange={(e) => setDeliveryCourierPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="cth: 081987654321 (angka saja)"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Catatan Pengiriman (Opsional)</label>
                      <input
                        type="text"
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        placeholder="cth: Kirim sebelum makan siang"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition active:scale-98"
                  >
                    Simpan &amp; Lanjutkan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================
          PRODUCT DETAIL DRAWER
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

      {/* =========================================================
          RECEIPT PREVIEW MODAL
      ========================================================= */}
      <AnimatePresence>
        {showReceipt && lastTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setShowReceipt(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 flex flex-col items-center max-h-[90vh] overflow-y-auto w-full max-w-sm rounded-3xl bg-slate-100 p-5 shadow-2xl"
            >
              <div className="relative overflow-hidden w-full max-w-[285px] rounded-2xl bg-white p-4 font-mono text-xs text-slate-800 shadow-2xl border border-slate-100">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.09] select-none">
                  <img src="/logo.jpg" alt="" className="w-3/4 object-contain grayscale" />
                </div>

                <div className="relative z-10">
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    <p className="font-bold text-sm">{storeProfile?.nama || 'Qurmacel POS'}</p>
                    <p className="text-[10px] text-slate-500">{storeProfile?.alamat || 'Jl. Toko'}</p>
                    <p className="text-[10px] font-bold text-slate-700 mt-1">
                      {lastTransaction.orderType === 'dine_in'
                        ? `[ DINE IN - ${lastTransaction.tableName || 'MEJA'} ]`
                        : lastTransaction.orderType === 'delivery'
                        ? '[ DELIVERY ]'
                        : `[ PICKUP - ${lastTransaction.pickupCode || ''} ]`}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{lastTransaction.id}</p>
                    <p className="text-[10px] text-slate-400">{lastTransaction.tanggal}</p>
                  </div>

                  <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300">
                    {lastTransaction.items?.map((it, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-xs font-bold break-words leading-tight">
                          {it.nama}
                          {it.notes && (
                            <span className="text-[9px] font-normal text-slate-500 ml-1">
                              ({it.notes})
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>
                            {it.qty} x {formatRupiah(it.harga)}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatRupiah(it.harga * it.qty)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="py-2 space-y-0.5 border-b border-dashed border-slate-300 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(lastTransaction.subtotal)}</span>
                    </div>
                    {lastTransaction.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Diskon:</span>
                        <span>-{formatRupiah(lastTransaction.discount)}</span>
                      </div>
                    )}
                    {lastTransaction.totalPajak > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Pajak:</span>
                        <span>+{formatRupiah(lastTransaction.totalPajak)}</span>
                      </div>
                    )}
                    {lastTransaction.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Ongkir:</span>
                        <span>+{formatRupiah(lastTransaction.shippingCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 text-xs border-t border-dashed border-slate-200">
                      <span>TOTAL:</span>
                      <span className="text-emerald-700">{formatRupiah(lastTransaction.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                      <span>Bayar ({lastTransaction.metode || lastTransaction.paymentMethod}):</span>
                      <span>{formatRupiah(lastTransaction.paid)}</span>
                    </div>
                    {lastTransaction.change > 0 && (
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>Kembali:</span>
                        <span>{formatRupiah(lastTransaction.change)}</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-center text-[10px] text-slate-400">
                    {storeProfile?.footerStruk || 'Terima kasih atas kunjungan Anda'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex w-full max-w-[285px] gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openThermalReceipt({
                      transaction: lastTransaction,
                      storeProfile,
                      paperSize,
                    });
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                >
                  <Printer size={14} />
                  <span>Cetak Struk</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
