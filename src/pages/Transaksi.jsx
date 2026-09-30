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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openThermalReceipt } from '../utils/receipt';
import { getSession, getNotifPrefs } from '../utils/storage';

const digitalMethods = [
  { id: 'DANA', label: 'DANA', icon: Smartphone },
  { id: 'OVO', label: 'OVO', icon: Smartphone },
  { id: 'GoPay', label: 'GoPay', icon: Smartphone },
  { id: 'ShopeePay', label: 'ShopeePay', icon: Smartphone },
  { id: 'Transfer Bank', label: 'Transfer Bank', icon: Smartphone },
];

const paymentCategories = [
  { id: 'Tunai', label: 'Tunai', icon: Banknote },
  { id: 'Digital', label: 'Pembayaran Digital', icon: Smartphone },
];

function ProductCardImage({ foto, nama }) {
  const [error, setError] = useState(false);

  if (!foto || error) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
        <ShoppingBag size={30} />
      </div>
    );
  }

  return (
    <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
      <img
        src={foto}
        alt={nama}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
      />
    </div>
  );
}

export default function Transaksi() {
  const {
    products,
    storeProfile,
    formatRupiah,
    formatAngka,
    completeTransaction,
    printerSettings,
    updatePrinterSettings,
    tables,
    createOrder,
    createDebt,
  } = useData();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);

  // PAYMENT
  const [paymentCategory, setPaymentCategory] = useState('Tunai');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paid, setPaid] = useState('');

  // CUSTOMER
  const [customer, setCustomer] = useState('');

  // SUMMARY
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');

  // RECEIPT
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // BARCODE
  const [scannerInput, setScannerInput] = useState('');
  const [scannerNotification, setScannerNotification] = useState(null);

  // TABLE
  const [selectedTable, setSelectedTable] = useState('');

  // ORDER TYPE
  const [orderType, setOrderType] = useState('Diambil');

  // DELIVERY - DATA PENERIMA
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryHouseNo, setDeliveryHouseNo] = useState('');
  const [deliveryRtRw, setDeliveryRtRw] = useState('');
  const [deliveryKelurahan, setDeliveryKelurahan] = useState('');
  const [deliveryKecamatan, setDeliveryKecamatan] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPosCode, setDeliveryPosCode] = useState('');
  const [deliveryAddressNote, setDeliveryAddressNote] = useState('');
  const [deliveryAltContact, setDeliveryAltContact] = useState('');

  // DELIVERY - DATA PENGIRIM
  const [deliverySenderName, setDeliverySenderName] = useState('');
  const [deliverySenderNote, setDeliverySenderNote] = useState('');

  // DELIVERY - DATA KURIR
  const [deliveryCourier, setDeliveryCourier] = useState('');
  const [deliveryCourierPhone, setDeliveryCourierPhone] = useState('');
  const [deliveryCourierType, setDeliveryCourierType] = useState('Kurir Toko');
  const [deliveryCost, setDeliveryCost] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');

  // ANIMATION
  const [cartPulse, setCartPulse] = useState(false);
  const [pressedProductId, setPressedProductId] = useState(null);

  const cartRef = useRef(null);
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const receiptPrintingRef = useRef(false);

  const paperSize = printerSettings?.paperSize || '58';
  const is80 = paperSize === '80';

  // =========================================================
  // PRODUCTS
  // =========================================================

  const filteredProducts = useMemo(() => {
    const keyword = String(search || '').toLowerCase();

    return products.filter((p) => {
      const nama = String(p.nama || '');
      const kode = String(p.kode || '');

      return (
        p.status === 'Aktif' &&
        (
          nama.toLowerCase().includes(keyword) ||
          kode.toLowerCase().includes(keyword)
        )
      );
    });
  }, [products, search]);

  const addToCart = (product) => {
    if (!product || product.stok <= 0) return;

    setPressedProductId(product.id);
    setCartPulse(true);

    setTimeout(() => {
      setPressedProductId(null);
    }, 300);

    setTimeout(() => {
      setCartPulse(false);
    }, 500);

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);

      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? {
                ...i,
                qty: Math.min(i.qty + 1, product.stok),
              }
            : i
        );
      }

      return [
        ...prev,
        {
          ...product,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => ({
          ...i,
          qty: i.id === id ? Math.max(0, i.qty + delta) : i.qty,
        }))
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // =========================================================
  // CALCULATION
  // =========================================================

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.harga || 0) * Number(item.qty || 0),
    0
  );

  const discountValue = Number(discount) || 0;
  const taxValue = Number(tax) || 0;
  const shippingCost = orderType === 'Dikirim'
    ? Number(deliveryCost) || 0
    : 0;

  const total = Math.max(
    0,
    subtotal - discountValue + taxValue + shippingCost
  );

  const paidValue = Number(paid) || 0;
  const change = paidValue - total;

  const isInstantPayment =
    paymentMethod === 'Hutang' ||
    paymentCategory === 'Hutang';

  const recordedPaid =
    isInstantPayment
      ? paidValue
      : paymentCategory === 'Tunai'
        ? paidValue
        : total;

  const recordedChange =
    isInstantPayment
      ? 0
      : paymentCategory === 'Tunai'
        ? (paidValue >= total ? paidValue - total : 0)
        : 0;

  // =========================================================
  // TABLE
  // =========================================================

  const activeTables = useMemo(
    () => tables.filter((t) => t.active),
    [tables]
  );

  const selectedTableData = useMemo(
    () => tables.find((t) => t.id === selectedTable),
    [tables, selectedTable]
  );

  // =========================================================
  // PAYMENT
  // =========================================================

  const isDigital = paymentCategory === 'Digital';
  const isDelivery = orderType === 'Dikirim';

  // Payment method groups per order type (Hutang is a status only, not a method)
  const paymentGroups = isDelivery
    ? [
        { id: 'Digital', label: 'Pembayaran Digital', icon: Smartphone },
        { id: 'COD', label: 'COD', icon: Banknote },
      ]
    : [
        { id: 'Tunai', label: 'Tunai', icon: Banknote },
        { id: 'Digital', label: 'Pembayaran Digital', icon: Smartphone },
      ];

  const selectPaymentGroup = (id) => {
    if (id === 'Digital') {
      setPaymentCategory('Digital');
      setPaymentMethod('');
      return;
    }
    setPaymentCategory(id);
    setPaymentMethod(id);
  };

  // =========================================================
  // CHECKOUT
  // =========================================================

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Prevent double transaction / double submit
    if (processingRef.current) return;
    processingRef.current = true;

    if (!isDelivery && !customer.trim()) {
      processingRef.current = false;
      alert('Nama pelanggan wajib diisi.');
      return;
    }

    if (isDelivery) {
      if (!deliveryName.trim()) {
        processingRef.current = false;
        alert('Nama penerima wajib diisi.');
        return;
      }

      if (!deliveryPhone.trim()) {
        processingRef.current = false;
        alert('No. HP penerima wajib diisi.');
        return;
      }

      if (!deliveryAddress.trim()) {
        processingRef.current = false;
        alert('Alamat pengiriman wajib diisi.');
        return;
      }

      if (!deliveryStreet.trim()) {
        processingRef.current = false;
        alert('Nama jalan wajib diisi.');
        return;
      }

      if (!deliveryHouseNo.trim()) {
        processingRef.current = false;
        alert('Nomor rumah wajib diisi.');
        return;
      }

      if (!deliveryRtRw.trim()) {
        processingRef.current = false;
        alert('RT/RW wajib diisi.');
        return;
      }

      if (!deliveryKelurahan.trim()) {
        processingRef.current = false;
        alert('Kelurahan/Desa wajib diisi.');
        return;
      }

      if (!deliveryKecamatan.trim()) {
        processingRef.current = false;
        alert('Kecamatan wajib diisi.');
        return;
      }

      if (!deliveryCity.trim()) {
        processingRef.current = false;
        alert('Kota/Kabupaten wajib diisi.');
        return;
      }
    }

    if (paymentCategory === 'Digital' && !paymentMethod) {
      processingRef.current = false;
      alert('Pilih metode pembayaran digital terlebih dahulu.');
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
      `TRX-${tanggal
        .split(' ')[0]
        .replace(/-/g, '')}-` +
      `${pad(now.getHours())}` +
      `${pad(now.getMinutes())}` +
      `${pad(now.getSeconds())}`;

    // =====================================================
    // PAYMENT STATUS (Lunas / Belum Lunas / Hutang)
    // =====================================================

    const paymentStatus =
      paymentMethod === 'Hutang' ||
      paymentCategory === 'Hutang'
        ? 'Hutang'
        : paymentCategory === 'Digital' ||
            paymentCategory === 'COD'
          ? 'Lunas'
          : paidValue >= total
            ? 'Lunas'
            : paidValue > 0
              ? 'Belum Lunas'
              : 'Hutang';

    // =====================================================
    // DELIVERY STATUS
    // =====================================================

    const deliveryStatus =
      isDelivery
        ? 'Menunggu'
        : null;

    // =====================================================
    // TRANSACTION DATA
    // =====================================================

    const fullDeliveryAddress = isDelivery
      ? [
          deliveryAddress,
          deliveryStreet ? `Jl. ${deliveryStreet}` : '',
          deliveryHouseNo ? `No. ${deliveryHouseNo}` : '',
          deliveryRtRw ? `RT/RW ${deliveryRtRw}` : '',
          deliveryKelurahan ? `Kel. ${deliveryKelurahan}` : '',
          deliveryKecamatan ? `Kec. ${deliveryKecamatan}` : '',
          deliveryCity,
          deliveryPosCode ? `Kode Pos ${deliveryPosCode}` : '',
        ]
          .filter(Boolean)
          .join(', ')
      : null;

    const trx = {
      id,
      tanggal,

      kasir:
        getSession()?.nama ||
        'Admin',

      customer:
        isDelivery
          ? deliveryName
          : customer,

      items: cart.map((item) => ({
        id: item.id,
        nama: item.nama,
        qty: item.qty,
        harga: item.harga,
      })),

      subtotal,
      discount: discountValue,
      tax: taxValue,
      shippingCost,
      total,

      paid: recordedPaid,
      change: recordedChange,

      paymentCategory,
      paymentMethod,

      // kompatibilitas data lama
      metode: paymentMethod,

      paymentStatus,

      status: 'Selesai',

      tableId:
        selectedTable || null,

      tableName:
        selectedTableData?.name || null,

      // DELIVERY
      orderType,

      deliveryCustomerId: null,

      deliveryName:
        isDelivery
          ? deliveryName
          : null,

      deliveryPhone:
        isDelivery
          ? deliveryPhone
          : null,

      deliveryAddress:
        isDelivery
          ? fullDeliveryAddress || deliveryAddress
          : null,

      deliveryStreet: isDelivery ? deliveryStreet : null,
      deliveryHouseNo: isDelivery ? deliveryHouseNo : null,
      deliveryRtRw: isDelivery ? deliveryRtRw : null,
      deliveryKelurahan: isDelivery ? deliveryKelurahan : null,
      deliveryKecamatan: isDelivery ? deliveryKecamatan : null,
      deliveryCity: isDelivery ? deliveryCity : null,
      deliveryPosCode: isDelivery ? deliveryPosCode : null,
      deliveryAddressNote: isDelivery ? deliveryAddressNote : null,
      deliveryAltContact: isDelivery ? deliveryAltContact : null,

      deliverySenderName: isDelivery ? (deliverySenderName || storeProfile?.nama || '') : null,
      deliverySenderNote: isDelivery ? deliverySenderNote : null,

      deliveryCourier:
        isDelivery
          ? deliveryCourier
          : null,

      deliveryCourierPhone: isDelivery ? deliveryCourierPhone : null,
      deliveryCourierType: isDelivery ? deliveryCourierType : null,

      deliveryCost:
        isDelivery
          ? shippingCost
          : 0,

      deliveryNote:
        isDelivery
          ? deliveryNote
          : null,

      deliveryStatus,
    };

    // =====================================================
    // SAVE TRANSACTION
    // =====================================================

    completeTransaction(trx);

    // =====================================================
    // DELIVERY ORDER
    // =====================================================

    if (isDelivery) {
      createOrder({
        type: orderType,

        customerId: null,

        customerName:
          deliveryName,

        customerPhone:
          deliveryPhone,

        customerAddress:
          fullDeliveryAddress || deliveryAddress,

        deliveryStreet,
        deliveryHouseNo,
        deliveryRtRw,
        deliveryKelurahan,
        deliveryKecamatan,
        deliveryCity,
        deliveryPosCode,
        deliveryAddressNote,
        deliveryAltContact,

        senderName: deliverySenderName || storeProfile?.nama || '',
        senderNote: deliverySenderNote,

        courier:
          deliveryCourier,

        courierPhone: deliveryCourierPhone,
        courierType: deliveryCourierType,

        shippingCost,

        courierNote:
          deliveryNote,

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

        notes:
          deliveryNote,
      });

      // ===================================================
      // DEBT
      // ===================================================

      if (paymentStatus === 'Hutang') {
        const debtorName = (isDelivery ? deliveryName : customer).trim();

        createDebt({
          customerId: null,

          customerName:
            debtorName || 'Umum',

          orderId:
            id,

          orderNumber:
            id,

          amount:
            total,
        });
      }
    }

    // =====================================================
    // RECEIPT
    // =====================================================

    const completed = {
      ...trx,
      paid: recordedPaid,
      change: recordedChange,
    };

    setLastTransaction(completed);
    setShowReceipt(true);

    // =====================================================
    // NOTIFICATIONS (sesuai pengaturan di Pengaturan)
    // =====================================================

    try {
      const prefs = getNotifPrefs();

      if (
        !('Notification' in window) ||
        Notification.permission === 'denied'
      ) {
        // fallback: toast/console, tidak error
      } else if (
        Notification.permission === 'granted'
      ) {
        if (prefs.notifTransaksi) {
          new Notification('Transaksi Baru — Qurmacel POS', {
            body: `${id} · ${formatRupiah(total)} · ${paymentStatus}`,
            tag: id,
          });
        }
      } else if (prefs.notifTransaksi) {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification('Transaksi Baru — Qurmacel POS', {
              body: `${id} · ${formatRupiah(total)} · ${paymentStatus}`,
              tag: id,
            });
          }
        });
      }

      if (prefs.notifStok) {
        const lowItems = cart.filter((item) => {
          const p = products.find((prod) => prod.id === item.id);
          return p && Number(p.stok || 0) <= 5;
        });
        if (lowItems.length > 0) {
          new Notification('Stok Menipis — Qurmacel POS', {
            body: `Stok ${lowItems.map((i) => i.nama).join(', ')} tinggal sedikit (≤ 5).`,
          });
        }
      }
    } catch (e) {
      // abaikan error notifikasi agar tidak mengganggu transaksi
    }

    // =====================================================
    // RESET
    // =====================================================

    setCart([]);
    setPaid('');
    setDiscount('');
    setTax('');

    setPaymentCategory('Tunai');
    setPaymentMethod('Tunai');

    setCustomer('');

    setSelectedTable('');

    setOrderType('Diambil');

    setDeliveryName('');
    setDeliveryPhone('');
    setDeliveryAddress('');
    setDeliveryStreet('');
    setDeliveryHouseNo('');
    setDeliveryRtRw('');
    setDeliveryKelurahan('');
    setDeliveryKecamatan('');
    setDeliveryCity('');
    setDeliveryPosCode('');
    setDeliveryAddressNote('');
    setDeliveryAltContact('');
    setDeliverySenderName('');
    setDeliverySenderNote('');
    setDeliveryCourier('');
    setDeliveryCourierPhone('');
    setDeliveryCourierType('Kurir Toko');
    setDeliveryCost('');
    setDeliveryNote('');

    // =====================================================
    // AUTO PRINT
    // =====================================================

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

  // =========================================================
  // PRINT RECEIPT
  // =========================================================

  const printReceipt = () => {
    if (!lastTransaction) return;
    if (receiptPrintingRef.current) return;

    receiptPrintingRef.current = true;
    openThermalReceipt({
      transaction: lastTransaction,
      storeProfile,
      paperSize,
    });

    setTimeout(() => {
      receiptPrintingRef.current = false;
    }, 800);
  };

  // =========================================================
  // BARCODE
  // =========================================================

  const showScannerNotif = (msg, type) => {
    setScannerNotification({
      msg,
      type,
    });

    setTimeout(() => {
      setScannerNotification(null);
    }, 3000);
  };

  const handleBarcodeScan = (kode) => {
    const trimmed = String(kode || '').trim();

    if (!trimmed) return;

    const product = products.find(
      (p) =>
        p.kode &&
        String(p.kode).toLowerCase() ===
          trimmed.toLowerCase()
    );

    if (!product) {
      showScannerNotif(
        `Produk dengan kode "${trimmed}" tidak ditemukan`,
        'error'
      );
      return;
    }

    if (product.stok <= 0) {
      showScannerNotif(
        `Stok "${product.nama}" habis!`,
        'warning'
      );
      return;
    }

    addToCart(product);

    showScannerNotif(
      `${product.nama} ditambahkan ke keranjang`,
      'success'
    );
  };

  const handleScannerKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();

    handleBarcodeScan(scannerInput);

    setScannerInput('');
  };

  useEffect(() => {
    if (
      !showReceipt &&
      scannerRef.current
    ) {
      scannerRef.current.focus();
    }
  }, [showReceipt]);

  // =========================================================
  // RECEIPT MODAL
  // =========================================================

  const renderReceiptModal = () => {
    if (
      !showReceipt ||
      !lastTransaction
    ) {
      return null;
    }

    const deliveryStatusClass =
      lastTransaction.deliveryStatus === 'Terkirim'
        ? 'font-bold text-emerald-600'
        : lastTransaction.deliveryStatus === 'Dibatalkan'
          ? 'font-bold text-red-600'
          : 'font-bold text-amber-600';

    const paymentStatusClass =
      lastTransaction.paymentStatus === 'Lunas'
        ? 'font-bold text-emerald-600'
        : lastTransaction.paymentStatus === 'Hutang'
          ? 'font-bold text-red-600'
          : 'font-bold text-amber-600';

    const receiptPaperClassName =
      'relative w-full rounded-t-2xl bg-white font-mono shadow-2xl ' +
      (is80
        ? 'max-w-sm'
        : 'max-w-[220px]');

    return (
      <div className="fixed inset-0 z-[60] flex overflow-y-auto p-4">
        <div className="absolute inset-0 z-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() =>
            setShowReceipt(false)
          }
        />

        <div className="pointer-events-auto relative z-10 m-auto flex w-full max-w-md flex-col items-center py-4">

          {/* SUCCESS */}
          <div className="mb-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-600 shadow-xl">
            <CheckCircle2 size={18} />
            Transaksi Berhasil!
          </div>

          {/* PAPER SIZE */}
          <div className="mb-3 flex items-center gap-1 rounded-xl bg-white p-1 shadow-xl">
            {['58', '80'].map((size) => (
              <button
                key={size}
                onClick={() =>
                  updatePrinterSettings({
                    paperSize: size,
                  })
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  paperSize === size
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {size} mm
              </button>
            ))}

            <span className="px-2 text-[10px] font-medium text-slate-400">
              ukuran kertas
            </span>
          </div>

          {/* RECEIPT PAPER */}
          <div
            id="receipt"
            className={receiptPaperClassName}
          >

            {/* STORE */}
            <div className="flex flex-col items-center border-b border-dashed border-slate-300 px-3 pb-3 pt-5 text-center">
              <Logo
                size="sm"
                imgClassName="rounded"
              />

              <p className="mt-1.5 text-[13px] font-extrabold leading-tight text-slate-900">
                {storeProfile.nama}
              </p>

              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                {storeProfile.alamat}
                <br />
                {storeProfile.telepon}
              </p>
            </div>

            {/* INFO */}
            <div className="border-b border-dashed border-slate-300 px-3 py-2.5 text-[10px] leading-relaxed text-slate-600">

              <div className="flex justify-between">
                <span className="text-slate-400">
                  No
                </span>

                <span className="text-right font-bold text-slate-800">
                  {lastTransaction.id}
                </span>
              </div>

              <div className="mt-0.5 flex justify-between">
                <span className="text-slate-400">
                  Waktu
                </span>

                <span>
                  {lastTransaction.tanggal}
                </span>
              </div>

              <div className="mt-0.5 flex justify-between">
                <span className="text-slate-400">
                  Kasir
                </span>

                <span>
                  {lastTransaction.kasir}
                </span>
              </div>

              <div className="mt-0.5 flex justify-between">
                <span className="text-slate-400">
                  Pelanggan
                </span>

                <span className="max-w-[70%] truncate">
                  {lastTransaction.customer}
                </span>
              </div>

              {lastTransaction.tableName && (
                <div className="mt-0.5 flex justify-between">
                  <span className="text-slate-400">
                    Meja
                  </span>

                  <span className="font-bold text-slate-800">
                    {lastTransaction.tableName}
                  </span>
                </div>
              )}

              {/* DELIVERY */}
              {lastTransaction.orderType === 'Dikirim' && (
                <>
                  <div className="mt-1 border-t border-dashed border-slate-200 pt-1">
                    <span className="text-xs font-bold text-slate-500">
                      PENGIRIMAN
                    </span>
                  </div>

                  <div className="mt-0.5 flex justify-between text-[9px]">
                    <span className="text-slate-400">
                      Tipe
                    </span>

                    <span>
                      Dikirim
                    </span>
                  </div>

                  <div className="mt-0.5 flex justify-between text-[9px]">
                    <span className="text-slate-400">
                      Penerima
                    </span>

                    <span className="max-w-[70%] truncate font-medium">
                      {lastTransaction.deliveryName}
                    </span>
                  </div>

                  {lastTransaction.deliveryPhone && (
                    <div className="mt-0.5 flex justify-between text-[9px]">
                      <span className="text-slate-400">
                        HP
                      </span>

                      <span>
                        {lastTransaction.deliveryPhone}
                      </span>
                    </div>
                  )}

                  {lastTransaction.deliveryAddress && (
                    <div className="mt-0.5 flex justify-between text-[9px]">
                      <span className="text-slate-400">
                        Alamat
                      </span>

                      <span className="max-w-[70%] truncate text-left">
                        {lastTransaction.deliveryAddress}
                      </span>
                    </div>
                  )}

                  {lastTransaction.deliveryCourier && (
                    <div className="mt-0.5 flex justify-between text-[9px]">
                      <span className="text-slate-400">
                        Kurir
                      </span>

                      <span>
                        {lastTransaction.deliveryCourier}
                        {lastTransaction.deliveryCourierType
                          ? ` (${lastTransaction.deliveryCourierType})`
                          : ''}
                      </span>
                    </div>
                  )}

                  {lastTransaction.deliveryCost > 0 && (
                    <div className="mt-0.5 flex justify-between text-[9px]">
                      <span className="text-slate-400">
                        Ongkir
                      </span>

                      <span className="text-sky-600">
                        +
                        {formatRupiah(
                          lastTransaction.deliveryCost
                        )}
                      </span>
                    </div>
                  )}

                  {lastTransaction.deliveryStatus && (
                    <div className="mt-0.5 flex justify-between text-[9px]">
                      <span className="text-slate-400">
                        Status Kirim
                      </span>

                      <span className={deliveryStatusClass}>
                        {lastTransaction.deliveryStatus}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* PAYMENT */}
              <div className="mt-0.5 flex justify-between">
                <span className="text-slate-400">
                  Metode
                </span>

                <span>
                  {lastTransaction.paymentMethod ||
                    lastTransaction.metode}
                </span>
              </div>

              {lastTransaction.paymentStatus && (
                <div className="mt-0.5 flex justify-between">
                  <span className="text-slate-400">
                    Status Bayar
                  </span>

                  <span className={paymentStatusClass}>
                    {lastTransaction.paymentStatus === 'Lunas'
                      ? 'LUNAS'
                      : lastTransaction.paymentStatus === 'Hutang'
                        ? 'HUTANG'
                        : 'BELUM LUNAS'}
                  </span>
                </div>
              )}
            </div>

            {/* ITEMS */}
            <div className="border-b border-dashed border-slate-300 px-3 py-2.5">
              {lastTransaction.items.map(
                (item, index) => (
                  <div
                    key={index}
                    className="mb-1.5"
                  >
                    <p className="text-[10.5px] font-bold leading-tight text-slate-800">
                      {item.nama}
                    </p>

                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {item.qty} ×{' '}
                        {formatAngka(item.harga)}
                      </span>

                      <span className="font-semibold text-slate-800">
                        {formatAngka(
                          item.harga *
                            item.qty
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* TOTAL */}
            <div className="px-3 py-2.5 text-[10.5px] leading-relaxed text-slate-600">

              <div className="flex justify-between">
                <span>
                  Subtotal
                </span>

                <span className="font-semibold text-slate-800">
                  {formatAngka(
                    lastTransaction.items.reduce(
                      (sum, item) =>
                        sum +
                        item.harga *
                          item.qty,
                      0
                    )
                  )}
                </span>
              </div>

              {lastTransaction.discount > 0 && (
                <div className="mt-1 flex justify-between">
                  <span>
                    Diskon
                  </span>

                  <span className="text-emerald-600">
                    -
                    {formatAngka(
                      lastTransaction.discount
                    )}
                  </span>
                </div>
              )}

              {lastTransaction.tax > 0 && (
                <div className="mt-1 flex justify-between">
                  <span>
                    Pajak
                  </span>

                  <span>
                    {formatAngka(
                      lastTransaction.tax
                    )}
                  </span>
                </div>
              )}

              {lastTransaction.orderType === 'Dikirim' &&
                lastTransaction.deliveryCost > 0 && (
                  <div className="mt-1 flex justify-between text-sky-600">
                    <span className="flex items-center gap-1">
                      <Truck size={10} />
                      Ongkir
                    </span>

                    <span className="font-semibold">
                      +
                      {formatAngka(
                        lastTransaction.deliveryCost
                      )}
                    </span>
                  </div>
                )}

              <div className="mt-1.5 flex justify-between border-t border-dashed border-slate-300 pt-1.5 text-[13px] font-extrabold text-slate-900">
                <span>
                  TOTAL
                </span>

                <span>
                  {formatAngka(
                    lastTransaction.total
                  )}
                </span>
              </div>

              <div className="mt-1.5 flex justify-between">
                <span>
                  Bayar
                </span>

                <span>
                  {formatAngka(
                    lastTransaction.paid
                  )}
                </span>
              </div>

              {lastTransaction.paymentMethod === 'Tunai' && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>
                    Kembali
                  </span>

                  <span>
                    {formatAngka(
                      lastTransaction.change
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex flex-col items-center border-t border-dashed border-slate-300 px-3 pb-4 pt-3 text-center">
              <p className="text-[9px] leading-relaxed text-slate-500">
                {storeProfile.footerStruk}
              </p>

              <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                <ReceiptText size={10} />
                Qurmacel POS · {paperSize}mm
              </p>
            </div>
          </div>

          {/* RECEIPT ACTION */}
          <div className="mt-3 flex w-full max-w-sm gap-3">
            <button
              onClick={printReceipt}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition hover:bg-emerald-500"
            >
              <Printer size={16} />
              Cetak Struk ({paperSize}mm)
            </button>

            <button
              onClick={() => {
                setShowReceipt(false);
                setLastTransaction(null);
              }}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-slate-700 shadow-xl transition hover:bg-slate-100"
            >
              Transaksi Baru
            </button>
          </div>

          <p className="mt-3 max-w-sm rounded-xl bg-white/10 px-4 py-2 text-center text-[10px] leading-relaxed text-white">
            Di dialog cetak: pilih printer POS{' '}
            <b>{paperSize}mm</b>, set{' '}
            <b>Margin: None</b> dan matikan{' '}
            <b>Header & Footer</b> untuk hasil struk yang rapi.
          </p>
        </div>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
            Transaksi / Kasir
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Pilih produk untuk membuat transaksi baru di Qurmacel Store.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">

          {/* =================================================
              PRODUCT AREA
          ================================================= */}

          <div className="min-w-0">

            {/* BARCODE */}
            <div className="relative mb-3">
              <Barcode
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500"
              />

              <input
                ref={scannerRef}
                type="text"
                value={scannerInput}
                onChange={(e) =>
                  setScannerInput(e.target.value)
                }
                onKeyDown={handleScannerKeyDown}
                placeholder="Scan barcode di sini..."
                className="w-full rounded-xl border-2 border-rose-200 bg-rose-50 py-2.5 pl-10 pr-3.5 text-sm font-mono outline-none transition placeholder:text-rose-400 focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />

              <AnimatePresence>
                {scannerNotification && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      scannerNotification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : scannerNotification.type === 'warning'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {scannerNotification.type === 'success' ? (
                      <CheckCircle2 size={15} />
                    ) : scannerNotification.type === 'warning' ? (
                      <AlertTriangle size={15} />
                    ) : (
                      <X size={15} />
                    )}

                    <span>
                      {scannerNotification.msg}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PRODUCTS */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <motion.button
                  key={product.id}
                  onClick={() =>
                    addToCart(product)
                  }
                  disabled={product.stok <= 0}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale:
                      pressedProductId ===
                      product.id
                        ? [
                            1,
                            0.98,
                            1,
                          ]
                        : 1,
                  }}
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-rose-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                    pressedProductId ===
                    product.id
                      ? 'ring-2 ring-rose-300'
                      : ''
                  }`}
                >
                  <ProductCardImage
                    foto={product.foto}
                    nama={product.nama}
                  />

                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
                    {product.nama}
                  </p>

                  <p className="mt-1 text-sm font-bold text-emerald-600">
                    {formatRupiah(
                      product.harga
                    )}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Stok:{' '}
                      <b
                        className={
                          product.stok <= 10
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }
                      >
                        {product.stok}
                      </b>
                    </span>

                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Plus size={13} />
                    </span>
                  </div>
                </motion.button>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <ShoppingCart
                    size={32}
                    className="text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Produk tidak ditemukan
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              CART / CHECKOUT
          ================================================= */}

          <div className="relative flex w-full min-h-[420px] max-h-[calc(100dvh-8rem)] self-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm xl:sticky xl:top-16">

            <LogoWatermark size="sm" />

            {/* CART HEADER */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Keranjang
                </h2>

                <p className="text-xs text-slate-500">
                  {cart.length} item dipilih
                </p>
              </div>

              <motion.div
                ref={cartRef}
                animate={
                  cartPulse
                    ? {
                        scale: [
                          1,
                          1.12,
                          0.96,
                          1.06,
                          1,
                        ],
                        rotate: [
                          0,
                          -4,
                          4,
                          -2,
                          0,
                        ],
                      }
                    : {
                        scale: 1,
                        rotate: 0,
                      }
                }
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"
              >
                <motion.div
                  animate={
                    cartPulse
                      ? {
                          rotate: [
                            0,
                            -10,
                            10,
                            -6,
                            0,
                          ],
                        }
                      : {
                          rotate: 0,
                        }
                  }
                  transition={{
                    duration: 0.45,
                  }}
                >
                  <ShoppingCart size={17} />
                </motion.div>
              </motion.div>
            </div>

            {/* CART ITEMS */}
            <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingCart
                    size={30}
                    className="text-slate-300"
                  />

                  <p className="mt-2 text-sm text-slate-400">
                    Keranjang masih kosong
                  </p>

                  <p className="text-xs text-slate-300">
                    Pilih produk dari daftar di sebelah kiri
                  </p>
                </div>
              ) : (
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                >
                  <ul className="space-y-2">
                    {cart.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{
                          opacity: 0,
                          x: 35,
                          scale: 0.92,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          x: -35,
                          scale: 0.92,
                        }}
                        transition={{
                          duration: 0.28,
                          ease: 'easeOut',
                        }}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.nama}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatRupiah(
                              item.harga
                            )}{' '}
                            × {item.qty}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(
                                item.id,
                                -1
                              )
                            }
                            className="rounded-md bg-white p-1 text-slate-500 shadow-sm transition hover:text-red-600"
                          >
                            <Minus size={13} />
                          </button>

                          <motion.span
                            key={`${item.id}-${item.qty}`}
                            initial={{
                              scale: 1.25,
                              opacity: 0.5,
                            }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                            }}
                            transition={{
                              duration: 0.18,
                            }}
                            className="w-6 text-center text-sm font-bold text-slate-700"
                          >
                            {item.qty}
                          </motion.span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQty(
                                item.id,
                                1
                              )
                            }
                            className="rounded-md bg-white p-1 text-slate-500 shadow-sm transition hover:text-emerald-600"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <motion.span
                          key={`${item.id}-price-${item.qty}`}
                          initial={{
                            scale: 1.08,
                          }}
                          animate={{
                            scale: 1,
                          }}
                          transition={{
                            duration: 0.18,
                          }}
                          className="w-20 text-right text-sm font-bold text-slate-800"
                        >
                          {formatRupiah(
                            item.harga *
                              item.qty
                          )}
                        </motion.span>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="rounded-md p-1 text-slate-300 transition hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </AnimatePresence>
              )}
            </div>

            {/* =================================================
                CHECKOUT AREA
            ================================================= */}

            <div className="relative z-10 flex max-h-[calc(100dvh-10rem)] flex-col overflow-y-auto space-y-4 border-t border-slate-100 bg-white px-5 py-4">

              {/* CUSTOMER FOR PICKUP */}
              {!isDelivery && (
                <div className="flex items-center gap-2">
                  <User
                    size={15}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    value={customer}
                    onChange={(e) =>
                      setCustomer(
                        e.target.value
                      )
                    }
                    placeholder="Nama pelanggan"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              )}

              {/* =================================================
                  ORDER TYPE
              ================================================= */}

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Truck
                    size={15}
                    className="text-slate-400"
                  />

                  <p className="text-xs font-bold text-slate-600">
                    Tipe Pesanan
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['Diambil', 'Dikirim'].map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setOrderType(type);

                          if (
                            type === 'Diambil'
                          ) {
                            setDeliveryName('');
                            setDeliveryPhone('');
                            setDeliveryAddress('');
                            setDeliveryStreet('');
                            setDeliveryHouseNo('');
                            setDeliveryRtRw('');
                            setDeliveryKelurahan('');
                            setDeliveryKecamatan('');
                            setDeliveryCity('');
                            setDeliveryPosCode('');
                            setDeliveryAddressNote('');
                            setDeliveryAltContact('');
                            setDeliverySenderName('');
                            setDeliverySenderNote('');
                            setDeliveryCourier('');
                            setDeliveryCourierPhone('');
                            setDeliveryCourierType('Kurir Toko');
                            setDeliveryCost('');
                            setDeliveryNote('');
                          }

                          // Reset payment to a valid default for the order type
                          selectPaymentGroup(
                            type === 'Dikirim'
                              ? 'COD'
                              : 'Tunai'
                          );
                        }}
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
                          orderType === type
                            ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-slate-50'
                        }`}
                      >
                        {type === 'Diambil' ? (
                          <ShoppingBag
                            size={15}
                          />
                        ) : (
                          <Truck size={15} />
                        )}

                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* =================================================
                  DELIVERY
              ================================================= */}

              {isDelivery && (
                <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4">

                  <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
                    <Package size={16} />
                    Form Pengiriman
                  </div>

                  {/* ================= DATA PENERIMA ================= */}
                  <div className="rounded-xl border border-rose-200 bg-white p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <User size={14} />
                      1. Data Penerima
                      <span className="font-medium normal-case text-slate-400">(wajib)</span>
                    </p>

                    <div className="space-y-2">
                      <input
                        value={deliveryName}
                        onChange={(e) => setDeliveryName(e.target.value)}
                        required
                        placeholder="Nama penerima *"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />

                      <input
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        required
                        placeholder="No. HP / WhatsApp *"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />

                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        required
                        placeholder="Alamat lengkap *"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={deliveryStreet}
                          onChange={(e) => setDeliveryStreet(e.target.value)}
                          required
                          placeholder="Nama jalan *"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                        <input
                          value={deliveryHouseNo}
                          onChange={(e) => setDeliveryHouseNo(e.target.value)}
                          required
                          placeholder="No. rumah *"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                      </div>

                      <input
                        value={deliveryRtRw}
                        onChange={(e) => setDeliveryRtRw(e.target.value)}
                        required
                        placeholder="RT / RW *"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={deliveryKelurahan}
                          onChange={(e) => setDeliveryKelurahan(e.target.value)}
                          required
                          placeholder="Kelurahan / Desa *"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                        <input
                          value={deliveryKecamatan}
                          onChange={(e) => setDeliveryKecamatan(e.target.value)}
                          required
                          placeholder="Kecamatan *"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                      </div>

                      <input
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        required
                        placeholder="Kota / Kabupaten *"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={deliveryPosCode}
                          onChange={(e) => setDeliveryPosCode(e.target.value)}
                          placeholder="Kode pos (opsional)"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                        <input
                          value={deliveryAltContact}
                          onChange={(e) => setDeliveryAltContact(e.target.value)}
                          placeholder="Kontak alternatif (opsional)"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                      </div>

                      <textarea
                        value={deliveryAddressNote}
                        onChange={(e) => setDeliveryAddressNote(e.target.value)}
                        placeholder="Catatan alamat, contoh: Rumah pagar hitam sebelah minimarket (opsional)"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </div>
                  </div>

                  {/* ================= DATA PENGIRIM ================= */}
                  <div className="rounded-xl border border-rose-200 bg-white p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <Truck size={14} />
                      2. Data Pengirim
                      <span className="font-medium normal-case text-slate-400">(dari Profil Toko)</span>
                    </p>

                    <div className="space-y-2">
                      <input
                        value={storeProfile?.nama || ''}
                        readOnly
                        placeholder="Nama toko"
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none"
                      />
                      <input
                        value={storeProfile?.telepon || ''}
                        readOnly
                        placeholder="No. HP toko"
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none"
                      />
                      <textarea
                        value={storeProfile?.alamat || ''}
                        readOnly
                        rows={2}
                        placeholder="Alamat toko"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 outline-none"
                      />
                      <input
                        value={deliverySenderName}
                        onChange={(e) => setDeliverySenderName(e.target.value)}
                        placeholder="Nama kasir / pengirim (opsional)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                      <textarea
                        value={deliverySenderNote}
                        onChange={(e) => setDeliverySenderNote(e.target.value)}
                        rows={2}
                        placeholder="Catatan pengiriman (opsional)"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </div>
                  </div>

                  {/* ================= DATA KURIR ================= */}
                  <div className="rounded-xl border border-rose-200 bg-white p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <Truck size={14} />
                      3. Data Kurir
                    </p>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={deliveryCourier}
                          onChange={(e) => setDeliveryCourier(e.target.value)}
                          placeholder="Nama kurir (opsional)"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                        <input
                          value={deliveryCourierPhone}
                          onChange={(e) => setDeliveryCourierPhone(e.target.value)}
                          placeholder="No. HP kurir (opsional)"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                        />
                      </div>

                      <select
                        value={deliveryCourierType}
                        onChange={(e) => setDeliveryCourierType(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      >
                        <option value="Kurir Toko">Kurir Toko</option>
                        <option value="Jasa Pengiriman">Jasa Pengiriman</option>
                      </select>

                      <textarea
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        rows={2}
                        placeholder="Catatan untuk kurir (opsional)"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </div>
                  </div>

                  {/* ================= DATA PESANAN (ongkir) ================= */}
                  <div className="rounded-xl border border-rose-200 bg-white p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <Package size={14} />
                      4. Data Pesanan
                    </p>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Ongkir (biaya pengiriman)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                    />
                  </div>
                </div>
              )}

              {/* =================================================
                  TABLE
              ================================================= */}

              {activeTables.length > 0 && (
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Table2
                      size={14}
                      className="text-slate-400"
                    />
                    Meja
                  </label>

                  <select
                    value={selectedTable}
                    onChange={(e) =>
                      setSelectedTable(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="">
                      — Pilih Meja (opsional) —
                    </option>

                    {activeTables.map(
                      (table) => (
                        <option
                          key={table.id}
                          value={table.id}
                        >
                          {table.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* =================================================
                  PAYMENT
              ================================================= */}

              <div>
                <p className="mb-2 text-xs font-bold text-slate-600">
                  Metode Pembayaran
                </p>
              </div>
               {/* MAIN PAYMENT */}
<div className="grid grid-cols-2 gap-3">
  {paymentGroups.map((group) => {
    const Icon = group.icon;
    const active = paymentCategory === group.id || (group.id === 'Digital' && paymentCategory === 'Digital');

    return (
      <button
        key={group.id}
        type="button"
        onClick={() => selectPaymentGroup(group.id)}
        className={`flex h-[76px] w-full flex-col items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-all ${
          active
            ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
            : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-slate-50'
        }`}
      >
        <Icon size={20} />
        <span className="text-center leading-tight">
          {group.label}
        </span>
      </button>
    );
  })}
</div>

              {/* =================================================
                  DIGITAL METHODS
              ================================================= */}

            <AnimatePresence initial={false}>
  {isDigital && (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl border border-rose-200 bg-rose-50/40 p-3"
    >
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-rose-600">
        Pilih Pembayaran Digital
      </p>

      <div className="grid grid-cols-2 gap-2">
        {digitalMethods.map((method) => {
          const Icon = method.icon;
          const active = paymentMethod === method.id;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setPaymentCategory('Digital');
                setPaymentMethod(method.id);
              }}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-all ${
                active
                  ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50'
              }`}
            >
              <Icon size={15} />
              <span>{method.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  )}
</AnimatePresence>

              {/* DIGITAL INFO */}
              {isDigital && paymentMethod && (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Pembayaran{' '}
                  <b>
                    {paymentMethod}
                  </b>{' '}
                  dikonfirmasi manual oleh kasir.
                </div>
              )}

              {/* =================================================
                  CASH PAYMENT
              ================================================= */}

              {paymentCategory === 'Tunai' && (
                <div className="space-y-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Jumlah Dibayar
                    </label>

                    <div className="flex items-center gap-2">
                      <Banknote
                        size={15}
                        className="shrink-0 text-slate-400"
                      />

                      <input
                        type="number"
                        min="0"
                        value={paid}
                        onChange={(e) =>
                          setPaid(
                            e.target.value
                          )
                        }
                        placeholder="Masukkan jumlah uang"
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      />
                    </div>
                  </div>

                  {paidValue >= total &&
                    total > 0 && (
                      <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        <span>
                          Kembalian
                        </span>

                        <span className="font-bold">
                          {formatRupiah(
                            change
                          )}
                        </span>
                      </div>
                    )}

                  {paidValue > 0 &&
                    paidValue < total && (
                      <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <span>
                          Kekurangan
                        </span>

                        <span className="font-bold">
                          {formatRupiah(
                            total -
                              paidValue
                          )}
                        </span>
                      </div>
                    )}
                </div>
              )}

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="space-y-2 border-t border-dashed border-slate-200 pt-3">

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Subtotal
                  </span>

                  <span className="font-medium text-slate-700">
                    {formatRupiah(
                      subtotal
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                  <span>
                    Diskon
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right text-xs outline-none focus:border-rose-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                  <span>
                    Pajak
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) =>
                      setTax(
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right text-xs outline-none focus:border-rose-400 focus:bg-white"
                  />
                </div>

                {isDelivery &&
                  shippingCost > 0 && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Truck size={13} />
                        Ongkir
                      </span>

                      <span className="font-medium text-rose-600">
                        +
                        {formatRupiah(
                          shippingCost
                        )}
                      </span>
                    </div>
                  )}

                {/* TOTAL */}
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                  <span className="text-sm font-bold text-slate-800">
                    Total
                  </span>

                  <span className="text-xl font-extrabold text-emerald-600">
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>

              {/* =================================================
                  PAYMENT STATUS PREVIEW
              ================================================= */}

              {cart.length > 0 && (
                (() => {
                  const previewStatus =
                    paymentMethod === 'Hutang' ||
                    paymentCategory === 'Hutang'
                      ? 'Hutang'
                      : paymentCategory === 'Digital' ||
                          paymentCategory === 'COD'
                        ? 'Lunas'
                        : paidValue >= total
                          ? 'Lunas'
                          : paidValue > 0
                            ? 'Belum Lunas'
                            : 'Hutang';

                  const statusColor =
                    previewStatus === 'Lunas'
                      ? 'bg-emerald-50 text-emerald-700'
                      : previewStatus === 'Belum Lunas'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-600';

                  return (
                    <div
                      className={`rounded-xl px-3 py-2.5 text-xs ${statusColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Status pembayaran</span>
                        <b>
                          {previewStatus === 'Lunas'
                            ? 'LUNAS'
                            : previewStatus === 'Belum Lunas'
                              ? 'BELUM LUNAS'
                              : 'HUTANG'}
                        </b>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* =================================================
                  CHECKOUT BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  cart.length === 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <CheckCircle2
                  size={18}
                />

                Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RECEIPT MODAL
      ===================================================== */}

      {renderReceiptModal()}
    </div>
  );
}