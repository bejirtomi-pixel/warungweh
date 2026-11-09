import React, { useMemo, useState, useEffect } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ReceiptText,
  X,
  CheckCircle2,
  Truck,
  User,
  Phone,
  MapPin,
  Package,
  Search,
  Filter,
  Eye,
  CreditCard,
  Building,
  Smartphone,
  Banknote,
  QrCode,
  AlertCircle,
  Clock,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Check,
  Layers,
  DollarSign,
  Percent,
  ArrowUpRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openThermalReceipt } from '../utils/receipt';
import { openReportPrint } from '../utils/reportPrint';

// Opsi filter periode yang lengkap
const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari Terakhir' },
  { id: 'thisMonth', label: 'Bulan Ini' },
  { id: 'lastMonth', label: 'Bulan Sebelumnya' },
  { id: 'all', label: 'Semua Periode' },
  { id: 'custom', label: 'Rentang Tanggal Khusus' },
];

const PAYMENT_STATUS_OPTIONS = [
  { id: 'all', label: 'Semua Status Bayar' },
  { id: 'Lunas', label: 'Lunas' },
  { id: 'Belum Lunas', label: 'Belum Lunas' },
  { id: 'Hutang', label: 'Hutang' },
];

const ORDER_TYPE_OPTIONS = [
  { id: 'all', label: 'Semua Jenis Pesanan' },
  { id: 'Diambil', label: 'Pickup (Diambil)' },
  { id: 'Dikirim', label: 'Delivery (Dikirim)' },
];

const DELIVERY_STATUS_OPTIONS = [
  { id: 'all', label: 'Semua Status Pengiriman' },
  { id: 'Menunggu', label: 'Menunggu Dikemas' },
  { id: 'Diproses', label: 'Diproses' },
  { id: 'Dikirim', label: 'Sedang Dikirim' },
  { id: 'Terkirim', label: 'Terkirim (Selesai)' },
  { id: 'Dibatalkan', label: 'Dibatalkan' },
];

function toDateString(d) {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTrxDate(trx) {
  if (!trx) return null;
  const raw = trx.tanggal || trx.date;
  if (!raw) return null;
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getTrxDateString(trx) {
  const d = getTrxDate(trx);
  return toDateString(d);
}

function isCancelled(trx) {
  const s = String(trx?.status || '').toLowerCase();
  return s === 'dibatalkan' || s === 'batal';
}

export default function Laporan() {
  const {
    transactions,
    orders,
    storeProfile,
    formatRupiah,
    updateTransaction,
    updateOrderStatus,
    printerSettings,
  } = useData();

  // Navigation tab: 'ringkasan' | 'penjualan' | 'pengiriman'
  const [activeTab, setActiveTab] = useState('ringkasan');

  // Filter Periode
  const [period, setPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filters Penjualan Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [pagePenjualan, setPagePenjualan] = useState(1);
  const perPagePenjualan = 10;

  // Filters Pengiriman Tab
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [pagePengiriman, setPagePengiriman] = useState(1);
  const perPagePengiriman = 10;

  // Modals
  const [detailTrx, setDetailTrx] = useState(null);
  const [deliveryStatusModal, setDeliveryStatusModal] = useState(null);
  const [editDeliveryStatus, setEditDeliveryStatus] = useState('Menunggu');
  const [editDeliveryNote, setEditDeliveryNote] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Preset Date Handlers
  const handlePeriodChange = (val) => {
    setPeriod(val);
    const now = new Date();

    if (val === 'today') {
      const todayStr = toDateString(now);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (val === '7days') {
      const sevenDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      setDateFrom(toDateString(sevenDays));
      setDateTo(toDateString(now));
    } else if (val === 'thisMonth') {
      const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateFrom(toDateString(startThisMonth));
      setDateTo(toDateString(endThisMonth));
    } else if (val === 'lastMonth') {
      const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(toDateString(startLastMonth));
      setDateTo(toDateString(endLastMonth));
    } else if (val === 'all') {
      setDateFrom('');
      setDateTo('');
    }
    // reset pagination
    setPagePenjualan(1);
    setPagePengiriman(1);
  };

  const handleDateFromChange = (newVal) => {
    setDateFrom(newVal);
    setPeriod('custom');
    if (dateTo && newVal > dateTo) {
      setDateTo(newVal);
    }
    setPagePenjualan(1);
    setPagePengiriman(1);
  };

  const handleDateToChange = (newVal) => {
    setDateTo(newVal);
    setPeriod('custom');
    if (dateFrom && newVal < dateFrom) {
      setDateFrom(newVal);
    }
    setPagePenjualan(1);
    setPagePengiriman(1);
  };

  const resetDateFilters = () => {
    setPeriod('all');
    setDateFrom('');
    setDateTo('');
    setPagePenjualan(1);
    setPagePengiriman(1);
  };

  // =========================================================================
  // 1. FILTERING DATA BERDASARKAN PERIODE
  // =========================================================================
  const periodFilteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const dStr = getTrxDateString(t);
      if (!dStr) return period === 'all';

      if (period === 'all') return true;

      if (dateFrom && dStr < dateFrom) return false;
      if (dateTo && dStr > dateTo) return false;

      return true;
    });
  }, [transactions, period, dateFrom, dateTo]);

  // Transaksi Valid (Tidak Dibatalkan) untuk perhitungan finansial
  const validTransactions = useMemo(() => {
    return periodFilteredTransactions.filter((t) => !isCancelled(t));
  }, [periodFilteredTransactions]);

  // =========================================================================
  // 2. KARTU RINGKASAN & STATISTIK FINANSIAL (Akurat & Terpisah)
  // =========================================================================
  const summaryMetrics = useMemo(() => {
    // Omzet Total (sudah memperhitungkan diskon, pajak, dan ongkir sebenarnya)
    const totalOmzet = validTransactions.reduce(
      (sum, t) => sum + (Number(t.total) || 0),
      0
    );

    // Pemisahan Nilai Ongkir dari Omzet Penjualan Barang murni
    const totalOngkir = validTransactions.reduce(
      (sum, t) => sum + (Number(t.shippingCost ?? t.deliveryCost ?? 0)),
      0
    );

    const omzetBarangMurni = Math.max(0, totalOmzet - totalOngkir);

    // Total Pajak (Pajak Barang + Pajak Transaksi)
    const totalPajak = validTransactions.reduce(
      (sum, t) => sum + (Number(t.totalPajak ?? t.tax ?? 0)),
      0
    );

    // Total Diskon
    const totalDiskon = validTransactions.reduce(
      (sum, t) => sum + (Number(t.discount) || 0),
      0
    );

    // Barang Terjual: dihitung dari akumulasi kuantitas pcs item, bukan jumlah baris produk
    const totalBarangTerjual = validTransactions.reduce((sum, t) => {
      const items = Array.isArray(t.items) ? t.items : [];
      return sum + items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    }, 0);

    // Rata-rata per transaksi valid (pembagi benar)
    const countValid = validTransactions.length;
    const avgPerTransaksi = countValid > 0 ? Math.round(totalOmzet / countValid) : 0;

    // Hitung status pembayaran
    const lunasCount = validTransactions.filter((t) => (t.paymentStatus || 'Lunas') === 'Lunas').length;
    const belumLunasCount = validTransactions.filter((t) => t.paymentStatus === 'Belum Lunas').length;
    const hutangCount = validTransactions.filter((t) => t.paymentStatus === 'Hutang').length;
    const dibatalkanCount = periodFilteredTransactions.filter((t) => isCancelled(t)).length;

    return {
      totalOmzet,
      totalOngkir,
      omzetBarangMurni,
      totalPajak,
      totalDiskon,
      totalBarangTerjual,
      countValid,
      avgPerTransaksi,
      lunasCount,
      belumLunasCount,
      hutangCount,
      dibatalkanCount,
    };
  }, [validTransactions, periodFilteredTransactions]);

  // =========================================================================
  // 3. RINGKASAN METODE PEMBAYARAN (Tanpa Perhitungan Ganda)
  // =========================================================================
  const paymentMethodSummary = useMemo(() => {
    const summary = {
      Tunai: { id: 'Tunai', label: 'Tunai (Cash)', count: 0, total: 0, icon: Banknote },
      QRIS: { id: 'QRIS', label: 'QRIS', count: 0, total: 0, icon: QrCode },
      Digital: {
        id: 'Digital',
        label: 'Dompet Digital',
        count: 0,
        total: 0,
        icon: Smartphone,
        breakdown: {
          GoPay: { count: 0, total: 0 },
          OVO: { count: 0, total: 0 },
          DANA: { count: 0, total: 0 },
          ShopeePay: { count: 0, total: 0 },
          LinkAja: { count: 0, total: 0 },
          Lainnya: { count: 0, total: 0 },
        },
      },
      Transfer: { id: 'Transfer', label: 'Transfer Bank', count: 0, total: 0, icon: Building },
      Kartu: { id: 'Kartu', label: 'Kartu Debit / Kredit', count: 0, total: 0, icon: CreditCard },
      COD: { id: 'COD', label: 'COD (Bayar di Tempat)', count: 0, total: 0, icon: Truck },
      Hutang: { id: 'Hutang', label: 'Hutang / Kasbon', count: 0, total: 0, icon: AlertCircle },
    };

    validTransactions.forEach((trx) => {
      const amt = Number(trx.total) || 0;
      const cat = String(trx.paymentCategory || '').trim();
      const meth = String(trx.paymentMethod || trx.metode || '').trim();

      if (cat === 'Tunai' || meth === 'Tunai') {
        summary.Tunai.count += 1;
        summary.Tunai.total += amt;
      } else if (cat === 'QRIS' || meth === 'QRIS') {
        summary.QRIS.count += 1;
        summary.QRIS.total += amt;
      } else if (
        cat === 'Digital' ||
        ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'].includes(meth)
      ) {
        summary.Digital.count += 1;
        summary.Digital.total += amt;

        if (summary.Digital.breakdown[meth]) {
          summary.Digital.breakdown[meth].count += 1;
          summary.Digital.breakdown[meth].total += amt;
        } else {
          summary.Digital.breakdown.Lainnya.count += 1;
          summary.Digital.breakdown.Lainnya.total += amt;
        }
      } else if (cat === 'Transfer' || meth.toLowerCase().includes('transfer')) {
        summary.Transfer.count += 1;
        summary.Transfer.total += amt;
      } else if (
        cat === 'Kartu' ||
        meth.toLowerCase().includes('kartu') ||
        meth.toLowerCase().includes('debit') ||
        meth.toLowerCase().includes('kredit')
      ) {
        summary.Kartu.count += 1;
        summary.Kartu.total += amt;
      } else if (cat === 'COD' || meth === 'COD') {
        summary.COD.count += 1;
        summary.COD.total += amt;
      } else if (cat === 'Hutang' || meth === 'Hutang' || trx.paymentStatus === 'Hutang') {
        summary.Hutang.count += 1;
        summary.Hutang.total += amt;
      } else {
        summary.Tunai.count += 1;
        summary.Tunai.total += amt;
      }
    });

    return summary;
  }, [validTransactions]);

  // =========================================================================
  // 4. TABEL PENJUALAN (Dengan Pencarian, Filter & Pagination)
  // =========================================================================
  const filteredPenjualan = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return periodFilteredTransactions.filter((trx) => {
      // Pencarian
      if (q) {
        const idMatch = String(trx.id || '').toLowerCase().includes(q);
        const kasirMatch = String(trx.kasir || '').toLowerCase().includes(q);
        const custMatch = String(trx.customer || trx.deliveryName || '').toLowerCase().includes(q);
        if (!idMatch && !kasirMatch && !custMatch) return false;
      }

      // Filter status pembayaran
      if (paymentStatusFilter !== 'all') {
        const status = trx.paymentStatus || 'Lunas';
        if (status !== paymentStatusFilter) return false;
      }

      // Filter tipe pesanan
      if (orderTypeFilter !== 'all') {
        const type = trx.orderType || (trx.isDelivery ? 'Dikirim' : 'Diambil');
        if (type !== orderTypeFilter) return false;
      }

      return true;
    });
  }, [periodFilteredTransactions, searchQuery, paymentStatusFilter, orderTypeFilter]);

  const totalPagesPenjualan = Math.max(1, Math.ceil(filteredPenjualan.length / perPagePenjualan));
  const currentPagePenjualan = Math.min(pagePenjualan, totalPagesPenjualan);
  const pagedPenjualan = filteredPenjualan.slice(
    (currentPagePenjualan - 1) * perPagePenjualan,
    currentPagePenjualan * perPagePenjualan
  );

  const totalOmzetFilteredPenjualan = useMemo(() => {
    return filteredPenjualan
      .filter((t) => !isCancelled(t))
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  }, [filteredPenjualan]);

  // =========================================================================
  // 5. TABEL PENGIRIMAN (Khusus Pesanan Delivery)
  // =========================================================================
  const deliveryTransactions = useMemo(() => {
    return periodFilteredTransactions.filter(
      (t) => t.orderType === 'Dikirim' || t.isDelivery === true
    );
  }, [periodFilteredTransactions]);

  const filteredPengiriman = useMemo(() => {
    const q = deliverySearch.trim().toLowerCase();

    return deliveryTransactions.filter((trx) => {
      if (q) {
        const idMatch = String(trx.id || '').toLowerCase().includes(q);
        const nameMatch = String(trx.deliveryName || trx.customer || '').toLowerCase().includes(q);
        const phoneMatch = String(trx.deliveryPhone || '').toLowerCase().includes(q);
        const courierMatch = String(trx.deliveryCourier || '').toLowerCase().includes(q);
        const addrMatch = String(trx.deliveryAddress || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !courierMatch && !addrMatch) {
          return false;
        }
      }

      if (deliveryStatusFilter !== 'all') {
        const status = trx.deliveryStatus || 'Menunggu';
        if (status !== deliveryStatusFilter) return false;
      }

      return true;
    });
  }, [deliveryTransactions, deliverySearch, deliveryStatusFilter]);

  const totalPagesPengiriman = Math.max(1, Math.ceil(filteredPengiriman.length / perPagePengiriman));
  const currentPagePengiriman = Math.min(pagePengiriman, totalPagesPengiriman);
  const pagedPengiriman = filteredPengiriman.slice(
    (currentPagePengiriman - 1) * perPagePengiriman,
    currentPagePengiriman * perPagePengiriman
  );

  const deliveryFinancials = useMemo(() => {
    const validDeliv = filteredPengiriman.filter((t) => !isCancelled(t));
    const totalDeliv = validDeliv.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const totalOngkir = validDeliv.reduce(
      (sum, t) => sum + (Number(t.shippingCost ?? t.deliveryCost ?? 0)),
      0
    );
    return { totalDeliv, totalOngkir, count: validDeliv.length };
  }, [filteredPengiriman]);

  // =========================================================================
  // 6. ACTION HANDLERS: CETAK, EKSPOR & DETAIL
  // =========================================================================
  const getPeriodLabelText = () => {
    if (period === 'today') return 'Hari Ini (' + (dateFrom || toDateString(new Date())) + ')';
    if (period === '7days') return `7 Hari Terakhir (${dateFrom} s.d. ${dateTo})`;
    if (period === 'thisMonth') return `Bulan Ini (${dateFrom} s.d. ${dateTo})`;
    if (period === 'lastMonth') return `Bulan Sebelumnya (${dateFrom} s.d. ${dateTo})`;
    if (period === 'custom' && dateFrom && dateTo) return `${dateFrom} s.d. ${dateTo}`;
    if (dateFrom || dateTo) return `${dateFrom || 'Awal'} s.d. ${dateTo || 'Sekarang'}`;
    return 'Semua Periode';
  };

  const handlePrint = () => {
    const isPengirimanTab = activeTab === 'pengiriman';
    const periodLabel = getPeriodLabelText();

    if (isPengirimanTab) {
      openReportPrint({
        title: 'Laporan Pengiriman (Delivery)',
        subtitle: 'Rekapitulasi Khusus Pesanan Dikirim QurmacelPOS',
        periodLabel,
        storeProfile,
        summaryCards: [
          {
            label: 'Total Nilai Delivery',
            value: formatRupiah(deliveryFinancials.totalDeliv),
            subtext: `${deliveryFinancials.count} pesanan delivery`,
          },
          {
            label: 'Total Biaya Ongkir',
            value: formatRupiah(deliveryFinancials.totalOngkir),
            subtext: 'Penerimaan ongkos kirim',
          },
          {
            label: 'Pesanan Terkirim',
            value: filteredPengiriman.filter((t) => t.deliveryStatus === 'Terkirim').length,
            subtext: 'Selesai diterima',
          },
          {
            label: 'Dalam Proses / Kirim',
            value: filteredPengiriman.filter(
              (t) => (t.deliveryStatus || 'Menunggu') !== 'Terkirim' && !isCancelled(t)
            ).length,
            subtext: 'Menunggu / jalan',
          },
        ],
        columns: [
          { header: 'No. Transaksi', accessor: (r) => r.id, align: 'left', width: '15%' },
          { header: 'Tanggal', accessor: (r) => r.tanggal, align: 'left', width: '13%' },
          {
            header: 'Penerima & HP',
            accessor: (r) => `<b>${r.deliveryName || r.customer || 'Umum'}</b><br/><small>${r.deliveryPhone || '-'}</small>`,
            align: 'left',
            width: '18%',
          },
          { header: 'Kurir', accessor: (r) => r.deliveryCourier || 'Kurir Toko', align: 'left', width: '12%' },
          { header: 'Alamat', accessor: (r) => r.deliveryAddress || '-', align: 'left', width: '20%' },
          {
            header: 'Ongkir',
            accessor: (r) => formatRupiah(Number(r.shippingCost ?? r.deliveryCost ?? 0)),
            align: 'right',
            width: '10%',
          },
          {
            header: 'Status Kirim',
            accessor: (r) => `<span class="badge ${r.deliveryStatus === 'Terkirim' ? 'badge-success' : r.deliveryStatus === 'Dibatalkan' ? 'badge-danger' : 'badge-info'}">${r.deliveryStatus || 'Menunggu'}</span>`,
            align: 'center',
            width: '12%',
          },
          {
            header: 'Total',
            accessor: (r) => `<b>${formatRupiah(r.total)}</b>`,
            align: 'right',
            key: 'total',
            width: '10%',
          },
        ],
        rows: filteredPengiriman,
        footerTotals: {
          total: formatRupiah(deliveryFinancials.totalDeliv),
        },
      });
    } else {
      openReportPrint({
        title: 'Laporan Penjualan',
        subtitle: 'Rekapitulasi Penjualan & Transaksi QurmacelPOS',
        periodLabel,
        storeProfile,
        summaryCards: [
          {
            label: 'Total Omzet',
            value: formatRupiah(summaryMetrics.totalOmzet),
            subtext: `Barang: ${formatRupiah(summaryMetrics.omzetBarangMurni)} · Ongkir: ${formatRupiah(summaryMetrics.totalOngkir)}`,
          },
          {
            label: 'Jumlah Transaksi',
            value: `${summaryMetrics.countValid} Trx`,
            subtext: `${summaryMetrics.lunasCount} Lunas · ${summaryMetrics.belumLunasCount + summaryMetrics.hutangCount} Piutang/Hutang`,
          },
          {
            label: 'Barang Terjual',
            value: `${summaryMetrics.totalBarangTerjual} pcs`,
            subtext: 'Akumulasi kuantitas produk',
          },
          {
            label: 'Rata-rata / Trx',
            value: formatRupiah(summaryMetrics.avgPerTransaksi),
            subtext: 'Omzet / Transaksi valid',
          },
        ],
        columns: [
          { header: 'No. Transaksi', accessor: (r) => r.id, align: 'left', width: '16%' },
          { header: 'Tanggal', accessor: (r) => r.tanggal, align: 'left', width: '13%' },
          { header: 'Kasir', accessor: (r) => r.kasir || 'Admin', align: 'left', width: '10%' },
          { header: 'Pelanggan', accessor: (r) => r.customer || 'Umum', align: 'left', width: '13%' },
          {
            header: 'Pesanan',
            accessor: (r) => (r.orderType === 'Dikirim' ? 'Delivery' : 'Pickup'),
            align: 'center',
            width: '8%',
          },
          {
            header: 'Item',
            accessor: (r) => (r.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0) + ' pcs',
            align: 'center',
            width: '7%',
          },
          {
            header: 'Pembayaran',
            accessor: (r) => r.paymentMethod || r.metode || 'Tunai',
            align: 'center',
            width: '11%',
          },
          {
            header: 'Status Bayar',
            accessor: (r) => `<span class="badge ${r.paymentStatus === 'Lunas' ? 'badge-success' : r.paymentStatus === 'Belum Lunas' ? 'badge-warning' : 'badge-danger'}">${r.paymentStatus || 'Lunas'}</span>`,
            align: 'center',
            width: '10%',
          },
          {
            header: 'Total',
            accessor: (r) => `<b>${formatRupiah(r.total)}</b>`,
            align: 'right',
            key: 'total',
            width: '12%',
          },
        ],
        rows: filteredPenjualan,
        footerTotals: {
          total: formatRupiah(totalOmzetFilteredPenjualan),
        },
      });
    }
  };

  const handleExportCSV = () => {
    const isPengirimanTab = activeTab === 'pengiriman';

    if (isPengirimanTab) {
      const header = [
        'No. Transaksi',
        'Tanggal',
        'Penerima',
        'No. HP',
        'Kurir',
        'Alamat Lengkap',
        'Ongkir',
        'Metode Pembayaran',
        'Status Pembayaran',
        'Status Pengiriman',
        'Total',
      ];
      const rows = filteredPengiriman.map((t) => [
        t.id,
        t.tanggal,
        t.deliveryName || t.customer || 'Umum',
        t.deliveryPhone || '',
        t.deliveryCourier || 'Kurir Toko',
        t.deliveryAddress || '',
        t.shippingCost ?? t.deliveryCost ?? 0,
        t.paymentMethod || t.metode || 'Tunai',
        t.paymentStatus || 'Lunas',
        t.deliveryStatus || 'Menunggu',
        t.total ?? 0,
      ]);
      downloadCSV(header, rows, `laporan-pengiriman-${Date.now()}`);
    } else {
      const header = [
        'No. Transaksi',
        'Tanggal',
        'Kasir',
        'Pelanggan',
        'Tipe Pesanan',
        'Jumlah Item (pcs)',
        'Subtotal',
        'Diskon',
        'Pajak Barang',
        'Pajak Transaksi',
        'Total Pajak',
        'Ongkir',
        'Total',
        'Metode Pembayaran',
        'Status Pembayaran',
        'Status Pengiriman',
      ];
      const rows = filteredPenjualan.map((t) => [
        t.id,
        t.tanggal,
        t.kasir || 'Admin',
        t.customer || 'Umum',
        t.orderType || (t.isDelivery ? 'Dikirim' : 'Diambil'),
        (t.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0),
        t.subtotal ?? 0,
        t.discount ?? 0,
        t.pajakBarang ?? 0,
        t.pajakTransaksi ?? 0,
        t.totalPajak ?? t.tax ?? 0,
        t.shippingCost ?? t.deliveryCost ?? 0,
        t.total ?? 0,
        t.paymentMethod || t.metode || 'Tunai',
        t.paymentStatus || 'Lunas',
        t.deliveryStatus || '-',
      ]);
      downloadCSV(header, rows, `laporan-penjualan-${Date.now()}`);
    }
    showToast('File CSV berhasil diunduh');
  };

  const downloadCSV = (header, rows, filename) => {
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const str = cell === null || cell === undefined ? '' : String(cell);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenDeliveryStatusModal = (trx) => {
    setDeliveryStatusModal(trx);
    setEditDeliveryStatus(trx.deliveryStatus || 'Menunggu');
    setEditDeliveryNote(trx.deliveryNote || '');
  };

  const handleSaveDeliveryStatus = () => {
    if (!deliveryStatusModal) return;

    updateTransaction(deliveryStatusModal.id, {
      deliveryStatus: editDeliveryStatus,
      deliveryNote: editDeliveryNote,
    });

    if (typeof updateOrderStatus === 'function') {
      updateOrderStatus(deliveryStatusModal.id, {
        status: editDeliveryStatus,
        deliveryStatus: editDeliveryStatus,
        notes: editDeliveryNote,
      });
    }

    showToast(`Status pengiriman ${deliveryStatusModal.id} diperbarui`);
    setDeliveryStatusModal(null);
  };

  const handleReprintReceipt = (trx) => {
    if (!trx) return;
    openThermalReceipt({
      transaction: trx,
      storeProfile,
      paperSize: printerSettings?.paperSize || '58',
    });
    showToast('Membuka struk transaksi...');
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background Watermark */}
      <LogoWatermark size="xl" opacity="opacity-[0.05]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* =========================================================
            HEADER & GLOBAL ACTION TOOLBAR
        ========================================================= */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Laporan Penjualan &amp; Pengiriman
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                QurmacelPOS
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Pusat pemantauan transaksi, omzet aktual, analisis metode pembayaran, dan status kurir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-98"
            >
              <Printer size={15} className="text-slate-600" />
              <span>Cetak Laporan</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 active:scale-98"
            >
              <FileSpreadsheet size={15} className="text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-500 active:scale-98"
            >
              <Download size={15} />
              <span>Unduh / Simpan</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            A. FILTER PERIODE TERPADU (Benar-benar Memengaruhi Data)
        ========================================================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
                <Calendar size={15} className="text-emerald-600" />
                Periode:
              </span>

              {/* Preset Selector */}
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                {PERIOD_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>

              {/* Custom Date Pickers */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                  title="Tanggal Awal"
                />
                <span className="text-xs text-slate-400 font-medium">s.d.</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                  title="Tanggal Akhir"
                />
              </div>

              {(dateFrom || dateTo || period !== 'all') && (
                <button
                  type="button"
                  onClick={resetDateFilters}
                  className="inline-flex items-center gap-1 rounded-xl p-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                  title="Reset filter periode"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            {/* Active Counter Indicator */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <ReceiptText size={13} className="text-emerald-600" />
                <b>{periodFilteredTransactions.length}</b> transaksi ditemukan
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================
            F. NAVIGASI TAB LAPORAN (Ringkasan, Penjualan, Pengiriman)
        ========================================================= */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'ringkasan'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp size={16} />
            <span>Ringkasan &amp; Analisis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('penjualan')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'penjualan'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ReceiptText size={16} />
            <span>Tabel Penjualan</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'penjualan'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {periodFilteredTransactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pengiriman')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'pengiriman'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck size={16} />
            <span>Tabel Pengiriman (Delivery)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'pengiriman'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {deliveryTransactions.length}
            </span>
          </button>
        </div>

        {/* =========================================================
            TAB 1: RINGKASAN & ANALISIS
        ========================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            {/* B. 4 KARTU RINGKASAN UTAMA */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {/* Kartu 1: Total Omzet */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Omzet
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {formatRupiah(summaryMetrics.totalOmzet)}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Barang: <b className="text-slate-700">{formatRupiah(summaryMetrics.omzetBarangMurni)}</b> · Ongkir: <b className="text-slate-700">{formatRupiah(summaryMetrics.totalOngkir)}</b>
                </p>
              </div>

              {/* Kartu 2: Jumlah Transaksi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Jumlah Transaksi
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <ReceiptText size={20} />
                  </div>
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {summaryMetrics.countValid} <span className="text-sm font-semibold text-slate-400">Trx</span>
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  {summaryMetrics.lunasCount} Lunas · {summaryMetrics.belumLunasCount + summaryMetrics.hutangCount} Tertunda · {summaryMetrics.dibatalkanCount} Batal
                </p>
              </div>

              {/* Kartu 3: Barang Terjual (Total Qty Pcs) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Barang Terjual
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Package size={20} />
                  </div>
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {summaryMetrics.totalBarangTerjual} <span className="text-sm font-semibold text-slate-400">pcs</span>
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Total kuantitas barang laku pada periode terpilih
                </p>
              </div>

              {/* Kartu 4: Rata-rata per Transaksi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Rata-rata / Transaksi
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <DollarSign size={20} />
                  </div>
                </div>
                <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {formatRupiah(summaryMetrics.avgPerTransaksi)}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Dihitung dari total omzet dibagi transaksi valid
                </p>
              </div>
            </div>

            {/* RINCIAN PAJAK & BIAYA PENGIRIMAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-400">Total Pajak Terkumpul</span>
                <p className="mt-1 text-base font-extrabold text-slate-800">
                  {formatRupiah(summaryMetrics.totalPajak)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Termasuk Pajak Barang &amp; Pajak Transaksi
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-400">Total Ongkos Kirim Delivery</span>
                <p className="mt-1 text-base font-extrabold text-emerald-700">
                  {formatRupiah(summaryMetrics.totalOngkir)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Dari {deliveryTransactions.length} pesanan tipe Dikirim
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-400">Total Potongan Diskon</span>
                <p className="mt-1 text-base font-extrabold text-rose-600">
                  {formatRupiah(summaryMetrics.totalDiskon)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Potongan harga promosi yang telah diberikan
                </p>
              </div>
            </div>

            {/* D. RINGKASAN METODE PEMBAYARAN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Ringkasan Penggunaan Metode Pembayaran
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rincian transaksi dan nominal berdasarkan metode bayar (tanpa perhitungan ganda).
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Total Penerimaan: <b className="text-emerald-700">{formatRupiah(summaryMetrics.totalOmzet)}</b>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Object.values(paymentMethodSummary).map((method) => {
                  const Icon = method.icon;
                  const percent =
                    summaryMetrics.totalOmzet > 0
                      ? Math.round((method.total / summaryMetrics.totalOmzet) * 100)
                      : 0;

                  return (
                    <div
                      key={method.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 transition hover:bg-white hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
                            <Icon size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {method.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {percent}%
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-[11px] text-slate-500">
                          {method.count} transaksi
                        </span>
                        <span className="text-xs font-black text-slate-800">
                          {formatRupiah(method.total)}
                        </span>
                      </div>

                      {/* Dompet Digital Specific Breakdown */}
                      {method.id === 'Digital' && method.count > 0 && (
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                            Rincian Provider:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(method.breakdown).map(([provider, data]) => {
                              if (data.count === 0) return null;
                              return (
                                <span
                                  key={provider}
                                  className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-700 shadow-2xs"
                                >
                                  <b>{provider}</b>: {data.count} ({formatRupiah(data.total)})
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RINGKASAN STATUS PENGIRIMAN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Truck size={17} className="text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Status Pengiriman Delivery
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('pengiriman')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                >
                  <span>Buka Tabel Pengiriman</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-center">
                  <span className="text-[11px] font-semibold text-blue-700">Menunggu Dikemas</span>
                  <p className="mt-1 text-lg font-black text-blue-900">
                    {deliveryTransactions.filter((t) => (t.deliveryStatus || 'Menunggu') === 'Menunggu' && !isCancelled(t)).length}
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-center">
                  <span className="text-[11px] font-semibold text-indigo-700">Sedang Diproses / Kirim</span>
                  <p className="mt-1 text-lg font-black text-indigo-900">
                    {deliveryTransactions.filter((t) => ['Diproses', 'Dikirim'].includes(t.deliveryStatus) && !isCancelled(t)).length}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <span className="text-[11px] font-semibold text-emerald-700">Terkirim / Selesai</span>
                  <p className="mt-1 text-lg font-black text-emerald-900">
                    {deliveryTransactions.filter((t) => t.deliveryStatus === 'Terkirim').length}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center">
                  <span className="text-[11px] font-semibold text-rose-700">Dibatalkan</span>
                  <p className="mt-1 text-lg font-black text-rose-900">
                    {deliveryTransactions.filter((t) => t.deliveryStatus === 'Dibatalkan' || isCancelled(t)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: TABEL LAPORAN PENJUALAN
        ========================================================= */}
        {activeTab === 'penjualan' && (
          <div className="space-y-4">
            {/* Filter Toolbar Penjualan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagePenjualan(1);
                    }}
                    placeholder="Cari no. transaksi, kasir, atau pelanggan..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => {
                      setPaymentStatusFilter(e.target.value);
                      setPagePenjualan(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={orderTypeFilter}
                    onChange={(e) => {
                      setOrderTypeFilter(e.target.value);
                      setPagePenjualan(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                  >
                    {ORDER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {(searchQuery || paymentStatusFilter !== 'all' || orderTypeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPaymentStatusFilter('all');
                        setOrderTypeFilter('all');
                        setPagePenjualan(1);
                      }}
                      className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition"
                      title="Reset filter"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Penjualan */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <LogoWatermark size="lg" opacity="opacity-[0.06]" />

              <div className="relative z-10 overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-4 py-3.5">No. Transaksi</th>
                      <th className="px-4 py-3.5">Tanggal &amp; Waktu</th>
                      <th className="px-4 py-3.5">Kasir</th>
                      <th className="px-4 py-3.5">Pelanggan</th>
                      <th className="px-4 py-3.5 text-center">Jenis Pesanan</th>
                      <th className="px-4 py-3.5 text-center">Item (pcs)</th>
                      <th className="px-4 py-3.5 text-center">Metode Bayar</th>
                      <th className="px-4 py-3.5 text-center">Status Bayar</th>
                      <th className="px-4 py-3.5 text-right">Total</th>
                      <th className="px-4 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pagedPenjualan.map((trx) => {
                      const isDeliv = trx.orderType === 'Dikirim' || trx.isDelivery;
                      const isTrxCancelled = isCancelled(trx);
                      const itemCount = (trx.items || []).reduce(
                        (s, it) => s + (Number(it.qty) || 0),
                        0
                      );
                      const paymentMethod = trx.paymentMethod || trx.metode || 'Tunai';
                      const paymentStatus = trx.paymentStatus || 'Lunas';

                      return (
                        <tr
                          key={trx.id}
                          className={`transition hover:bg-slate-50/80 ${
                            isTrxCancelled ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                            <span>{trx.id}</span>
                            {isTrxCancelled && (
                              <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-rose-700">
                                Batal
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                            {trx.tanggal || trx.date}
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-slate-700">
                            {trx.kasir || 'Admin'}
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-slate-800">
                            {trx.customer || trx.deliveryName || 'Umum'}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isDeliv
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isDeliv ? <Truck size={10} /> : <ShoppingBag size={10} />}
                              <span>{isDeliv ? 'Delivery' : 'Pickup'}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                            {itemCount}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {paymentMethod}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                paymentStatus === 'Lunas'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : paymentStatus === 'Belum Lunas'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              }`}
                            >
                              {paymentStatus}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-black text-slate-800">
                            <div>{formatRupiah(trx.total)}</div>
                            {trx.shippingCost > 0 && (
                              <div className="text-[10px] font-normal text-slate-400">
                                Ongkir: +{formatRupiah(trx.shippingCost)}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setDetailTrx(trx)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 transition"
                              title="Lihat detail transaksi"
                            >
                              <Eye size={12} />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPenjualan.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <ReceiptText size={32} className="mx-auto text-slate-300" />
                          <p className="mt-2 text-xs font-bold text-slate-700">
                            Tidak ada transaksi penjualan
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Coba sesuaikan kata kunci pencarian atau filter periode.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {filteredPenjualan.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-800">
                        <td colSpan={8} className="px-4 py-3 text-right text-xs uppercase tracking-wider">
                          Total Omzet Penjualan (Halaman &amp; Filter Ini):
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-black text-emerald-700">
                          {formatRupiah(totalOmzetFilteredPenjualan)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination Penjualan */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
                <span className="text-xs text-slate-500">
                  Menampilkan <b>{filteredPenjualan.length === 0 ? 0 : (currentPagePenjualan - 1) * perPagePenjualan + 1}</b>–
                  <b>{Math.min(currentPagePenjualan * perPagePenjualan, filteredPenjualan.length)}</b> dari{' '}
                  <b>{filteredPenjualan.length}</b> transaksi
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPagePenjualan((p) => Math.max(1, p - 1))}
                    disabled={currentPagePenjualan === 1}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPagesPenjualan }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPagePenjualan(p)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        currentPagePenjualan === p
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPagePenjualan((p) => Math.min(totalPagesPenjualan, p + 1))}
                    disabled={currentPagePenjualan === totalPagesPenjualan}
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
            TAB 3: TABEL LAPORAN PENGIRIMAN (DELIVERY)
        ========================================================= */}
        {activeTab === 'pengiriman' && (
          <div className="space-y-4">
            {/* Filter Toolbar Pengiriman */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={deliverySearch}
                    onChange={(e) => {
                      setDeliverySearch(e.target.value);
                      setPagePengiriman(1);
                    }}
                    placeholder="Cari penerima, no. HP, kurir, alamat, atau no. trx..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={deliveryStatusFilter}
                    onChange={(e) => {
                      setDeliveryStatusFilter(e.target.value);
                      setPagePengiriman(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
                  >
                    {DELIVERY_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {(deliverySearch || deliveryStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeliverySearch('');
                        setDeliveryStatusFilter('all');
                        setPagePengiriman(1);
                      }}
                      className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition"
                      title="Reset filter pengiriman"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Pengiriman */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xs">
              <LogoWatermark size="lg" opacity="opacity-[0.06]" />

              <div className="relative z-10 overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-blue-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      <th className="px-4 py-3.5">No. Transaksi</th>
                      <th className="px-4 py-3.5">Nama Penerima</th>
                      <th className="px-4 py-3.5">Nomor HP</th>
                      <th className="px-4 py-3.5">Kurir</th>
                      <th className="px-4 py-3.5">Alamat Pengiriman</th>
                      <th className="px-4 py-3.5 text-right">Ongkir</th>
                      <th className="px-4 py-3.5 text-center">Status Bayar</th>
                      <th className="px-4 py-3.5 text-center">Status Pengiriman</th>
                      <th className="px-4 py-3.5 text-right">Total Transaksi</th>
                      <th className="px-4 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pagedPengiriman.map((trx) => {
                      const deliveryStatus = trx.deliveryStatus || 'Menunggu';
                      const paymentStatus = trx.paymentStatus || 'Lunas';
                      const shippingCost = Number(trx.shippingCost ?? trx.deliveryCost ?? 0);

                      return (
                        <tr key={trx.id} className="transition hover:bg-blue-50/30">
                          <td className="px-4 py-3.5 font-mono font-bold text-blue-700">
                            {trx.id}
                          </td>

                          <td className="px-4 py-3.5 font-bold text-slate-800">
                            {trx.deliveryName || trx.customer || 'Umum'}
                          </td>

                          <td className="px-4 py-3.5 font-medium text-slate-600">
                            {trx.deliveryPhone || '—'}
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-slate-700">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                              {trx.deliveryCourier || 'Kurir Toko'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600 max-w-[240px]">
                            <p className="line-clamp-2" title={trx.deliveryAddress}>
                              {trx.deliveryAddress || '—'}
                            </p>
                            {trx.deliveryAddressNote && (
                              <p className="text-[10px] text-slate-400 italic">
                                Patokan: {trx.deliveryAddressNote}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                            {formatRupiah(shippingCost)}
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                paymentStatus === 'Lunas'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : paymentStatus === 'Belum Lunas'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              }`}
                            >
                              {paymentStatus}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                deliveryStatus === 'Terkirim'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : deliveryStatus === 'Dibatalkan'
                                  ? 'bg-rose-100 text-rose-800'
                                  : deliveryStatus === 'Diproses' || deliveryStatus === 'Dikirim'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {deliveryStatus}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right font-black text-slate-800">
                            {formatRupiah(trx.total)}
                          </td>

                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenDeliveryStatusModal(trx)}
                                className="rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-700 shadow-2xs hover:bg-blue-50 transition"
                                title="Perbarui status pengiriman"
                              >
                                Ubah Status
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailTrx(trx)}
                                className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:text-emerald-700 transition"
                                title="Lihat detail lengkap"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPengiriman.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <Truck size={32} className="mx-auto text-slate-300" />
                          <p className="mt-2 text-xs font-bold text-slate-700">
                            Tidak ada pesanan pengiriman (Delivery)
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Pesanan dengan jenis Delivery akan otomatis tercatat di sini.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {filteredPengiriman.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-blue-50/50 font-bold text-slate-800">
                        <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wider">
                          Total Nilai Delivery:
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-black text-emerald-700">
                          {formatRupiah(deliveryFinancials.totalOngkir)}
                        </td>
                        <td colSpan={2}></td>
                        <td className="px-4 py-3 text-right text-sm font-black text-blue-800">
                          {formatRupiah(deliveryFinancials.totalDeliv)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination Pengiriman */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
                <span className="text-xs text-slate-500">
                  Menampilkan <b>{filteredPengiriman.length === 0 ? 0 : (currentPagePengiriman - 1) * perPagePengiriman + 1}</b>–
                  <b>{Math.min(currentPagePengiriman * perPagePengiriman, filteredPengiriman.length)}</b> dari{' '}
                  <b>{filteredPengiriman.length}</b> pengiriman
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPagePengiriman((p) => Math.max(1, p - 1))}
                    disabled={currentPagePengiriman === 1}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPagesPengiriman }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPagePengiriman(p)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        currentPagePengiriman === p
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPagePengiriman((p) => Math.min(totalPagesPengiriman, p + 1))}
                    disabled={currentPagePengiriman === totalPagesPengiriman}
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
            MODAL 1: LIHAT DETAIL TRANSAKSI LENGKAP
        ========================================================= */}
        {detailTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setDetailTrx(null)}
            />

            <div className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ReceiptText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      Detail Transaksi #{detailTrx.id}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {detailTrx.tanggal} · Kasir: {detailTrx.kasir || 'Admin'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailTrx(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Modal */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tipe Pesanan</span>
                    <span className="font-bold text-slate-800">
                      {detailTrx.orderType === 'Dikirim' ? 'Delivery (Dikirim)' : 'Pickup (Diambil)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Status Pembayaran</span>
                    <span
                      className={`font-bold ${
                        detailTrx.paymentStatus === 'Lunas'
                          ? 'text-emerald-700'
                          : detailTrx.paymentStatus === 'Belum Lunas'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {detailTrx.paymentStatus || 'Lunas'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Metode Bayar</span>
                    <span className="font-bold text-slate-800">
                      {detailTrx.paymentMethod || detailTrx.metode || 'Tunai'}
                    </span>
                  </div>
                </div>

                {/* Info Pengiriman jika Delivery */}
                {(detailTrx.orderType === 'Dikirim' || detailTrx.isDelivery) && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 border-b border-blue-200/60 pb-1">
                      <Truck size={13} />
                      <span>Informasi Pengiriman</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">Penerima:</span>{' '}
                        <b className="text-slate-800">{detailTrx.deliveryName || detailTrx.customer}</b>
                      </div>
                      <div>
                        <span className="text-slate-400">No. HP:</span>{' '}
                        <b className="text-slate-800">{detailTrx.deliveryPhone || '—'}</b>
                      </div>
                      <div>
                        <span className="text-slate-400">Kurir:</span>{' '}
                        <b className="text-slate-800">{detailTrx.deliveryCourier || 'Kurir Toko'}</b>
                      </div>
                      <div>
                        <span className="text-slate-400">Status Kirim:</span>{' '}
                        <b className="text-blue-800">{detailTrx.deliveryStatus || 'Menunggu'}</b>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Alamat:</span>{' '}
                        <span className="text-slate-700">{detailTrx.deliveryAddress || '—'}</span>
                      </div>
                      {detailTrx.deliveryAddressNote && (
                        <div className="col-span-2 text-slate-500 italic">
                          Patokan: {detailTrx.deliveryAddressNote}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Daftar Item Barang */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1">
                    Daftar Barang Belanja
                  </h4>
                  <div className="space-y-1.5">
                    {(detailTrx.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-100"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate">{it.nama}</p>
                          <p className="text-[10px] text-slate-400">
                            {it.qty} x {formatRupiah(it.harga)}
                            {it.pajakAktif && (
                              <span className="ml-1 text-emerald-700">
                                [+Pajak {it.pajakPersen}%]
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="font-bold text-slate-800">
                          {formatRupiah((Number(it.harga) || 0) * (Number(it.qty) || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rincian Finansial */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(detailTrx.subtotal)}
                    </span>
                  </div>
                  {detailTrx.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon:</span>
                      <span className="font-semibold">-{formatRupiah(detailTrx.discount)}</span>
                    </div>
                  )}
                  {detailTrx.pajakBarang > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak Barang:</span>
                      <span className="font-semibold text-emerald-700">
                        +{formatRupiah(detailTrx.pajakBarang)}
                      </span>
                    </div>
                  )}
                  {detailTrx.pajakTransaksi > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak Transaksi:</span>
                      <span className="font-semibold text-emerald-700">
                        +{formatRupiah(detailTrx.pajakTransaksi)}
                      </span>
                    </div>
                  )}
                  {detailTrx.shippingCost > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Ongkos Kirim ({detailTrx.deliveryCourier || 'Kurir'}):</span>
                      <span className="font-semibold text-emerald-700">
                        +{formatRupiah(detailTrx.shippingCost)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-slate-800 pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-emerald-700">{formatRupiah(detailTrx.total)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Uang Diterima:</span>
                    <span>{formatRupiah(detailTrx.paid)}</span>
                  </div>
                  {detailTrx.change > 0 && (
                    <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(detailTrx.change)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => setDetailTrx(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-white transition"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => handleReprintReceipt(detailTrx)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                >
                  <Printer size={14} />
                  <span>Cetak Ulang Struk Kasir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL 2: UBAH STATUS PENGIRIMAN
        ========================================================= */}
        {deliveryStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setDeliveryStatusModal(null)}
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Truck size={17} className="text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Perbarui Status Pengiriman
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      No. {deliveryStatusModal.id} · {deliveryStatusModal.deliveryName || deliveryStatusModal.customer}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryStatusModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Pengiriman Baru:
                  </label>
                  <select
                    value={editDeliveryStatus}
                    onChange={(e) => setEditDeliveryStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="Menunggu">Menunggu Dikemas</option>
                    <option value="Diproses">Diproses / Sedang Dikemas</option>
                    <option value="Dikirim">Sedang Dikirim / Jalan</option>
                    <option value="Terkirim">Terkirim (Sudah Diterima)</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Kurir / Resi (Opsional):
                  </label>
                  <input
                    type="text"
                    value={editDeliveryNote}
                    onChange={(e) => setEditDeliveryNote(e.target.value)}
                    placeholder="cth: Diserahkan ke satpam / no resi GRB-12345"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
                  Mengubah status pengiriman tidak akan mengubah data keuangan atau riwayat transaksi.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setDeliveryStatusModal(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeliveryStatus}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-500 transition"
                >
                  Simpan Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xl">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
