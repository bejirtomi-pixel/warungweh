import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoWatermark from '../components/common/LogoWatermark';
import ProductDetailDrawer from '../components/ProductDetailDrawer';
import { useData } from '../context/DataContext';
import { openThermalReceipt } from '../utils/receipt';
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

function ProductCardImage({ foto, nama }) {
  const [error, setError] = useState(false);

  if (!foto || error) {
    return (
      <div className="flex h-20 sm:h-24 w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-slate-400">
        <Package size={24} />
      </div>
    );
  }

  return (
    <div className="h-20 sm:h-24 w-full overflow-hidden rounded-xl bg-slate-100">
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

export default function Transaksi() {
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
    createOrder,
    createDebt,
  } = useData();

  // Search & Barcode
  const [search, setSearch] = useState('');

  // Cart
  const [cart, setCart] = useState([]);

  // Payment
  const [paymentCategory, setPaymentCategory] = useState('Tunai');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paid, setPaid] = useState('');
  const [isDigitalConfirmed, setIsDigitalConfirmed] = useState(false);

  // Customer
  const [customer, setCustomer] = useState('');

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

  // Receipt Modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // Scanner Notification
  const [scannerNotification, setScannerNotification] = useState(null);

  // Table
  const [selectedTable, setSelectedTable] = useState('');

  // Order Type ('Diambil' = Pickup, 'Dikirim' = Delivery)
  const [orderType, setOrderType] = useState('Diambil');

  // Ringkas Delivery Fields (Sesuai Spesifikasi Baru)
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

  const cartRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastScanRef = useRef({ code: '', time: 0 });
  const processingRef = useRef(false);
  const receiptPrintingRef = useRef(false);

  const paperSize = printerSettings?.paperSize || '58';
  const is80 = paperSize === '80';

  const metaMap = useMemo(() => {
    const map = {};
    for (const m of productMeta || []) {
      if (m && m.productId) map[m.productId] = m;
    }
    return map;
  }, [productMeta]);

  const activeTables = useMemo(() => {
    return (tables || []).filter((t) => t.active !== false);
  }, [tables]);

  const isDelivery = orderType === 'Dikirim';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Filter payment groups according to enabled methods in Pengaturan
  const availablePaymentGroups = useMemo(() => {
    const pm = paymentMethods || {};

    const filteredGroups = ALL_PAYMENT_GROUPS.map((group) => {
      const activeMethods = group.methods.filter((m) => {
        if (pm[m.id] !== undefined) return Boolean(pm[m.id]);
        if (pm[group.id] !== undefined) return Boolean(pm[group.id]);
        return true;
      });

      return {
        ...group,
        methods: activeMethods,
      };
    }).filter((group) => group.methods.length > 0);

    // COD for delivery
    if (orderType === 'Dikirim') {
      return [
        {
          id: 'COD',
          label: 'COD (Bayar di Tempat)',
          icon: Banknote,
          methods: [{ id: 'COD', label: 'COD (Bayar di Tempat)', icon: Banknote }],
        },
        ...filteredGroups,
      ];
    }

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
      // Produk nonaktif tidak boleh muncul dalam katalog transaksi
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
    // Produk yang stoknya habis tidak boleh ditambahkan ke keranjang
    if (!product || Number(product.stok || 0) <= 0) {
      showToast(`Stok "${product?.nama}" habis!`);
      return;
    }

    setPressedProductId(product.id);
    setCartPulse(true);

    setTimeout(() => setPressedProductId(null), 200);
    setTimeout(() => setCartPulse(false), 350);

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

      return [
        ...prev,
        {
          ...product,
          qty: 1,
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

  // =========================================================
  // G. CALCULATION (Dual Tax & Biaya Pengiriman)
  // =========================================================

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.harga || 0) * Number(item.qty || 0),
    0
  );

  const totalQuantity = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const discountValue = Number(discount) || 0;

  // 1. Pajak Barang (per produk yang kena pajak)
  const totalPajakBarang = cart.reduce((sum, item) => {
    if (item.pajakAktif && Number(item.pajakPersen) > 0) {
      const itemSub = Number(item.harga || 0) * Number(item.qty || 0);
      const tax = Math.round((itemSub * Number(item.pajakPersen)) / 100);
      return sum + tax;
    }
    return sum;
  }, 0);

  // 2. Pajak Transaksi (Perlindungan Anti Pajak Ganda: hanya barang non-pajak-barang)
  const nonPajakBarangSubtotal = cart.reduce((sum, item) => {
    if (!item.pajakAktif || !item.pajakPersen) {
      return sum + Number(item.harga || 0) * Number(item.qty || 0);
    }
    return sum;
  }, 0);

  const dppTransaksiNet = Math.max(0, nonPajakBarangSubtotal - discountValue);
  const totalPajakTransaksi =
    isPajakTransaksiActive && Number(pajakTransaksiPersen) > 0
      ? Math.round((dppTransaksiNet * Number(pajakTransaksiPersen)) / 100)
      : 0;

  const totalPajak = totalPajakBarang + totalPajakTransaksi;

  // Biaya pengiriman hanya ditambahkan untuk pesanan Delivery
  const shippingCost = isDelivery ? Math.max(0, Number(deliveryCost) || 0) : 0;

  const total = Math.max(
    0,
    subtotal - discountValue + totalPajak + shippingCost
  );

  const paidValue = Number(paid) || 0;
  const isCashPayment = paymentMethod === 'Tunai';
  const change = Math.max(0, paidValue - total);
  const isCashInsufficient = isCashPayment && total > 0 && paidValue < total;

  // Cek kelengkapan Delivery
  const isDeliveryComplete = Boolean(
    deliveryName.trim() && deliveryPhone.trim() && deliveryAddress.trim()
  );

  // =========================================================
  // B. BARCODE SCANNER HANDLER
  // =========================================================

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
    // Cegah duplikasi penekanan Enter/scan berulang dalam 400ms
    if (lastScanRef.current.code === query && now - lastScanRef.current.time < 400) {
      return;
    }
    lastScanRef.current = { code: query, time: now };

    // Cari kecocokan tepat pada kode / barcode
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

    // Jika filtered list tersisa tepat 1 produk aktif
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

  // Auto-focus search input
  useEffect(() => {
    if (!showReceipt && !showDeliveryModal && !detailProduct && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showReceipt, showDeliveryModal, detailProduct]);

  // =========================================================
  // E. DELIVERY MODAL ACTIONS
  // =========================================================

  const handleSaveDeliveryModal = (e) => {
    if (e) e.preventDefault();
    setDeliveryModalError('');

    if (!deliveryName.trim()) {
      setDeliveryModalError('Nama penerima wajib diisi.');
      return;
    }
    if (!deliveryPhone.trim()) {
      setDeliveryModalError('Nomor HP/WhatsApp penerima wajib diisi.');
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
  // H. CHECKOUT & PENYELESAIAN TRANSAKSI
  // =========================================================

  const handleCheckout = () => {
    setValidationError('');

    // 1. Validasi isi keranjang
    if (cart.length === 0) {
      setValidationError('Keranjang belanja masih kosong.');
      return;
    }

    if (processingRef.current) return;
    processingRef.current = true;

    // 2. Validasi pembayaran Tunai
    if (isCashPayment) {
      if (!paid || paidValue < total) {
        processingRef.current = false;
        setValidationError('Uang tunai yang diterima kurang dari total pembayaran.');
        return;
      }
    }

    // 3. Validasi pesanan Delivery
    if (isDelivery) {
      if (!deliveryName.trim()) {
        processingRef.current = false;
        setValidationError('Nama penerima wajib diisi untuk pesanan Delivery.');
        setShowDeliveryModal(true);
        return;
      }
      if (!deliveryPhone.trim()) {
        processingRef.current = false;
        setValidationError('Nomor HP/WhatsApp penerima wajib diisi.');
        setShowDeliveryModal(true);
        return;
      }
      if (!deliveryAddress.trim()) {
        processingRef.current = false;
        setValidationError('Alamat lengkap pengiriman wajib diisi.');
        setShowDeliveryModal(true);
        return;
      }
    }

    // Validasi metode digital
    if (paymentCategory === 'Digital' && !paymentMethod) {
      processingRef.current = false;
      setValidationError('Pilih metode pembayaran terlebih dahulu.');
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    const tanggal =
      `${now.getFullYear()}-` +
      `${pad(now.getMonth() + 1)}-` +
      `${pad(now.getDate())} ` +
      `${pad(now.getHours())}:` +
      `${pad(now.getMinutes())}`;

    const id =
      `TRX-${tanggal.split(' ')[0].replace(/-/g, '')}-` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const paymentStatus =
      paymentMethod === 'Hutang' || paymentCategory === 'Hutang'
        ? 'Hutang'
        : paymentCategory === 'Digital' || paymentCategory === 'COD' || isCashPayment
        ? 'Lunas'
        : paidValue >= total
        ? 'Lunas'
        : paidValue > 0
        ? 'Belum Lunas'
        : 'Hutang';

    const deliveryStatus = isDelivery ? 'Menunggu' : null;

    const recordedPaid =
      isCashPayment
        ? paidValue
        : paymentCategory === 'Hutang'
        ? 0
        : total;

    const recordedChange =
      isCashPayment
        ? Math.max(0, paidValue - total)
        : 0;

    const selectedTableData = activeTables.find((t) => t.id === selectedTable);

    const trx = {
      id,
      tanggal,
      kasir: getSession()?.nama || 'Admin',
      // Pickup: Nama pelanggan opsional, default 'Umum'
      customer: isDelivery ? deliveryName.trim() : customer.trim() || 'Umum',
      items: cart.map((item) => ({
        id: item.id,
        nama: item.nama,
        qty: item.qty,
        harga: item.harga,
        pajakAktif: Boolean(item.pajakAktif),
        pajakJenis: item.pajakJenis || 'PPN',
        pajakPersen: item.pajakPersen || 0,
      })),
      subtotal,
      discount: discountValue,
      pajakBarang: totalPajakBarang,
      pajakTransaksi: totalPajakTransaksi,
      pajakTransaksiPersen: isPajakTransaksiActive ? Number(pajakTransaksiPersen) || 0 : 0,
      pajakTransaksiJenis,
      totalPajak,
      tax: totalPajak,
      shippingCost,
      total,
      paid: recordedPaid,
      change: recordedChange,
      paymentCategory,
      paymentMethod,
      metode: paymentMethod,
      paymentStatus,
      status: 'Selesai',
      tableId: selectedTable || null,
      tableName: selectedTableData?.name || null,
      orderType,
      deliveryCustomerId: null,
      deliveryName: isDelivery ? deliveryName.trim() : null,
      deliveryPhone: isDelivery ? deliveryPhone.trim() : null,
      deliveryAddress: isDelivery ? deliveryAddress.trim() : null,
      deliveryAddressNote: isDelivery ? deliveryAddressNote?.trim() || null : null,
      deliveryCourier: isDelivery ? deliveryCourier?.trim() || 'Kurir Toko' : null,
      deliveryCourierPhone: isDelivery ? deliveryCourierPhone?.trim() || null : null,
      deliveryCost: isDelivery ? shippingCost : 0,
      deliveryNote: isDelivery ? deliveryNote?.trim() || null : null,
      deliveryStatus,
    };

    // Simpan transaksi & kurangi stok produk secara atomik
    completeTransaction(trx);

    // Jika pesanan delivery, catat pesanan order pengiriman
    if (isDelivery) {
      createOrder({
        type: orderType,
        customerId: null,
        customerName: deliveryName.trim(),
        customerPhone: deliveryPhone.trim(),
        customerAddress: deliveryAddress.trim(),
        deliveryAddressNote,
        courier: deliveryCourier || 'Kurir Toko',
        courierPhone: deliveryCourierPhone,
        shippingCost,
        courierNote: deliveryNote,
        items: cart.map((item) => ({
          id: item.id,
          nama: item.nama,
          qty: item.qty,
          harga: item.harga,
        })),
        total,
        paymentCategory,
        paymentMethod,
        paymentStatus,
        notes: deliveryNote,
      });

      if (paymentStatus === 'Hutang') {
        createDebt({
          customerId: null,
          customerName: deliveryName.trim() || 'Umum',
          orderId: id,
          orderNumber: id,
          amount: total,
        });
      }
    }

    // Siapkan data struk
    const completed = {
      ...trx,
      paid: recordedPaid,
      change: recordedChange,
    };

    setLastTransaction(completed);
    setShowReceipt(true);

    // Browser Notification
    try {
      const prefs = getNotifPrefs();
      if ('Notification' in window && Notification.permission === 'granted') {
        if (prefs?.notifTransaksi) {
          new Notification('Transaksi Baru — QurmacelPOS', {
            body: `${id} · ${formatRupiah(total)} · ${paymentStatus}`,
            tag: id,
          });
        }
      }
    } catch {
      // ignore
    }

    // Reset Form Kasir
    setCart([]);
    setPaid('');
    setDiscount('');
    setCustomer('');
    setSelectedTable('');
    setOrderType('Diambil');
    setDeliveryName('');
    setDeliveryPhone('');
    setDeliveryAddress('');
    setDeliveryAddressNote('');
    setDeliveryCourier('Kurir Toko');
    setDeliveryCourierPhone('');
    setDeliveryCost('');
    setDeliveryNote('');
    setIsDigitalConfirmed(false);

    // Auto print if enabled
    if (printerSettings?.autoPrint) {
      setTimeout(() => {
        openThermalReceipt({
          transaction: completed,
          storeProfile,
          paperSize,
        });
      }, 300);
    }

    processingRef.current = false;
  };

  const printReceipt = () => {
    if (!lastTransaction || receiptPrintingRef.current) return;
    receiptPrintingRef.current = true;
    openThermalReceipt({
      transaction: lastTransaction,
      storeProfile,
      paperSize,
    });
    setTimeout(() => {
      receiptPrintingRef.current = false;
    }, 1500);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-3 py-4 sm:px-5 lg:px-6">
      {/* Watermark logo */}
      <LogoWatermark size="lg" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* =========================================================
              LEFT COLUMN: PRODUCT CATALOG & SEARCH (7 of 12 cols desktop)
          ========================================================= */}
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

            {/* A. Compact Product Catalog Grid */}
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
                    {/* Top: Compact Image & Badges */}
                    <div className="relative">
                      <ProductCardImage foto={product.foto} nama={product.nama} />

                      {/* Marketing Badges (Best Seller & Promo) */}
                      <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                        {meta?.bestSeller && (
                          <span className="rounded-md bg-amber-500/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                            Best Seller
                          </span>
                        )}
                        {meta?.promoActive && (
                          <span className="rounded-md bg-rose-500/95 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            Promo
                          </span>
                        )}
                      </div>

                      {/* Detail Drawer Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailProduct(product);
                        }}
                        title="Lihat detail produk"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 backdrop-blur-xs text-slate-500 shadow-2xs transition hover:bg-white hover:text-emerald-700"
                      >
                        <Eye size={12} />
                      </button>
                    </div>

                    {/* Middle: Category, Name & Price */}
                    <div className="mt-2 flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block truncate">
                        {product.kategori || 'Umum'}
                      </span>
                      <h3
                        title={product.nama}
                        className="text-xs font-bold text-slate-800 leading-snug line-clamp-1"
                      >
                        {product.nama}
                      </h3>

                      <div className="mt-1 flex items-baseline gap-1 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-emerald-700">
                          {formatRupiah(product.harga)}
                        </span>
                        {product.pajakAktif && (
                          <span className="text-[8.5px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            +{product.pajakJenis || 'PPN'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Stock Status & Add Action */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-bold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Habis'
                          : isLowStock
                          ? `Sisa ${stokVal}`
                          : `Stok: ${stokVal}`}
                      </span>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(product);
                        }}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-500 active:scale-95'
                        }`}
                        title={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
                  <ShoppingCart size={32} className="text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Produk tidak ditemukan
                  </p>
                  <p className="text-xs text-slate-400">
                    Coba sesuaikan kata kunci atau scan barcode barang yang aktif.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              C. RIGHT COLUMN: CART & CHECKOUT (5 of 12 cols desktop)
          ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <LogoWatermark size="sm" />

            {/* AREA 1: FIXED CART HEADER */}
            <div className="relative z-10 shrink-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
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
                  <h2 className="text-sm font-bold text-slate-800">Keranjang Belanja</h2>
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
                  title="Kosongkan keranjang"
                >
                  <Trash2 size={13} />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* AREA 2: SCROLLABLE CART ITEMS LIST (No clipping, comfortable vertical scroll) */}
            <div className="relative z-10 flex-1 min-h-[140px] overflow-y-auto px-4 py-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 px-4">
                  <ShoppingCart size={28} className="text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    Keranjang masih kosong
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">
                    Klik produk di katalog atau scan barcode untuk menambahkan barang.
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
                        {/* Top: Item Name, Tax Badge & Remove */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 break-words leading-snug">
                              {item.nama}
                            </h4>
                            {item.pajakAktif && (
                              <span className="mt-0.5 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-200">
                                {item.pajakJenis || 'PPN'} {item.pajakPersen || 0}%
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-white transition shrink-0"
                            title="Hapus barang"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Bottom: Unit Price, Controls & Subtotal */}
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

                          <div className="text-right font-black text-xs text-slate-800 min-w-[70px]">
                            {formatRupiah(item.harga * item.qty)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* AREA 3: ORDER TYPE, PAYMENT, SUMMARY & FIXED CHECKOUT BUTTON */}
            <div className="relative z-10 shrink-0 max-h-[52vh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 space-y-3">
              {/* D. Order Type Toggle: Pickup vs Delivery */}
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('Diambil');
                      setValidationError('');
                    }}
                    className={`flex h-8 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition ${
                      orderType === 'Diambil'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag size={13} />
                    <span>Pickup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('Dikirim');
                      setValidationError('');
                      if (!isDeliveryComplete) {
                        setShowDeliveryModal(true);
                      }
                    }}
                    className={`flex h-8 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition ${
                      orderType === 'Dikirim'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck size={13} />
                    <span>Delivery</span>
                  </button>
                </div>
              </div>

              {/* D. PICKUP: Table Selector only (Customer name is optional) */}
              {!isDelivery ? (
                activeTables.length > 0 ? (
                  <div>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="">— Tanpa Meja (Bungkus / Kasir) —</option>
                      {activeTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null
              ) : (
                /* D & E. DELIVERY SUMMARY BOX */
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck size={14} className="text-emerald-700" />
                      <span className="text-xs font-bold text-slate-800">
                        Data Pengiriman (Delivery)
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDeliveryComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
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

              {/* F. METODE PEMBAYARAN */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Metode Pembayaran
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Dipilih: <b className="text-slate-700">{paymentMethod}</b>
                  </span>
                </div>

                {/* Main Payment Group Buttons */}
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
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{group.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Methods: Dompet Digital (GoPay, OVO, DANA, ShopeePay, LinkAja), Kartu, etc. */}
                {(() => {
                  const currentGroup = availablePaymentGroups.find((g) =>
                    g.methods.some((m) => m.id === paymentMethod)
                  );
                  if (!currentGroup || currentGroup.methods.length <= 1) return null;

                  return (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Pilih Penyedia {currentGroup.label}:
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

                {/* Non-Cash / Digital Payment Info & Confirmation Check */}
                {!isCashPayment && paymentMethod !== 'COD' && (
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 space-y-2">
                    <div className="flex items-start gap-2 text-[11px] text-slate-600">
                      {paymentCategory === 'QRIS' ? (
                        <QrCode size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-slate-800">
                          Konfirmasi Pembayaran {paymentMethod}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Pastikan dana sudah masuk ke rekening toko / EDC sebelum transaksi diselesaikan.
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
                        Kasir telah memeriksa &amp; memverifikasi pembayaran berhasil
                      </span>
                    </label>
                  </div>
                )}

                {/* CASH MANUAL INPUT (Tanpa preset nominal, input manual murni) */}
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

                    {/* Change / Shortage Preview */}
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

              {/* G. RINGKASAN PEMBAYARAN */}
              <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-slate-600">
                  <span>Diskon:</span>
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

                {/* Pajak Barang */}
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

                {/* Pajak Transaksi */}
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

                {/* Ongkir (Hanya Delivery) */}
                {isDelivery && shippingCost > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Pengiriman ({deliveryCourier}):</span>
                    <span className="font-semibold text-emerald-700">
                      +{formatRupiah(shippingCost)}
                    </span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-sm font-extrabold text-slate-800">
                    Total Pembayaran:
                  </span>
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

              {/* H. PROMINENT CHECKOUT BUTTON */}
              <div className="pt-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isCashInsufficient}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {cart.length === 0
                      ? 'Keranjang Kosong'
                      : isCashInsufficient
                      ? `Uang Kurang (${formatRupiah(total - paidValue)})`
                      : `Bayar Sekarang • ${formatRupiah(total)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          E. DESAIN ULANG MODAL DELIVERY (RINGKAS & TEPAT SASARAN)
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
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Formulir Pengiriman (Delivery)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kelompok data penerima dan informasi kurir pengiriman
                    </p>
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

              {/* Body Modal */}
              <form onSubmit={handleSaveDeliveryModal} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
                {deliveryModalError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{deliveryModalError}</span>
                  </div>
                )}

                {/* KELOMPOK 1: DATA PENERIMA */}
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-white">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
                    <User size={13} />
                    <span>1. Informasi Penerima (Wajib)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Nama Penerima *
                      </label>
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
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Nomor HP / WhatsApp *
                      </label>
                      <input
                        required
                        type="tel"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        placeholder="cth: 0812-3456-7890"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    {/* Satu Kolom Alamat Lengkap yang Cukup Besar */}
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Alamat Lengkap Pengiriman *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Tuliskan alamat lengkap pengiriman: nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, dan kota..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                      />
                    </div>

                    {/* Patokan / Catatan Tambahan (Opsional) */}
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Patokan / Detail Alamat (Opsional)
                      </label>
                      <input
                        type="text"
                        value={deliveryAddressNote}
                        onChange={(e) => setDeliveryAddressNote(e.target.value)}
                        placeholder="cth: Rumah pagar hitam depan masjid / samping pos satpam"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                </div>

                {/* KELOMPOK 2: INFORMASI PENGIRIMAN & KURIR */}
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-white">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
                    <Truck size={13} />
                    <span>2. Informasi Pengiriman &amp; Kurir</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Pilihan Kurir
                      </label>
                      <select
                        value={deliveryCourier}
                        onChange={(e) => setDeliveryCourier(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500"
                      >
                        {COURIER_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Biaya Pengiriman / Ongkir (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={deliveryCost}
                        onChange={(e) => setDeliveryCost(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold outline-none transition focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        No. HP / WhatsApp Kurir (Opsional)
                      </label>
                      <input
                        type="tel"
                        value={deliveryCourierPhone}
                        onChange={(e) => setDeliveryCourierPhone(e.target.value)}
                        placeholder="cth: 0819-8765-4321"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Catatan Pengiriman (Opsional)
                      </label>
                      <input
                        type="text"
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        placeholder="cth: Jangan dibanting / kirim sebelum jam 2"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs outline-none transition focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Modal Actions */}
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
          RECEIPT PREVIEW MODAL (WATERMARK & STRUK RESMI)
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
              {/* Receipt Preview Paper with Subtle Watermark Logo */}
              <div className="relative overflow-hidden w-full max-w-[285px] rounded-2xl bg-white p-4 font-mono text-xs text-slate-800 shadow-2xl border border-slate-100">
                {/* Watermark Logo QurmacelPOS */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.09] select-none">
                  <img src="/logo.jpg" alt="" className="w-3/4 object-contain grayscale" />
                </div>

                <div className="relative z-10">
                  <div className="text-center pb-2 border-b border-dashed border-slate-300">
                    <div className="mx-auto flex h-10 w-full items-center justify-center overflow-hidden mb-1">
                      <img src="/logo.jpg" alt="Logo" className="max-h-full object-contain" />
                    </div>
                    <p className="font-bold text-sm">{storeProfile?.nama || 'Qurmacel POS'}</p>
                    <p className="text-[10px] text-slate-500">{storeProfile?.alamat || 'Jl. Toko'}</p>
                    {storeProfile?.telepon && (
                      <p className="text-[10px] text-slate-500">Telp: {storeProfile.telepon}</p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5">{lastTransaction.id}</p>
                    <p className="text-[10px] text-slate-400">{lastTransaction.tanggal}</p>
                  </div>

                  <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300">
                    {lastTransaction.items?.map((it, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-xs font-bold break-words leading-tight">
                          {it.nama}
                          {it.pajakAktif && (
                            <span className="text-[9px] font-normal text-slate-500 ml-1">
                              [{it.pajakJenis || 'PPN'} {it.pajakPersen}%]
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
                    {lastTransaction.pajakBarang > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Pajak Barang:</span>
                        <span>+{formatRupiah(lastTransaction.pajakBarang)}</span>
                      </div>
                    )}
                    {lastTransaction.pajakTransaksi > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Pajak Transaksi ({lastTransaction.pajakTransaksiPersen || 0}%):</span>
                        <span>+{formatRupiah(lastTransaction.pajakTransaksi)}</span>
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
                  <p className="text-center text-[9px] text-slate-400">Dicetak oleh Qurmacel POS</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex w-full max-w-[285px] gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                >
                  Transaksi Baru
                </button>
                <button
                  type="button"
                  onClick={printReceipt}
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
