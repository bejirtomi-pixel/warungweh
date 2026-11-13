import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CircleDollarSign,
  ReceiptText,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ShoppingCart,
  Calendar,
  Clock,
  User,
  Eye,
  Printer,
  X,
  Tag,
  CheckCircle2,
  Store,
  ChevronRight,
  Sparkles,
  Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';
import { openThermalReceipt } from '../utils/receipt';

// Helper: Parsing tanggal transaksi yang aman lintas format dan browser
function parseTrxDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof dateValue === 'string') {
    // Format "YYYY-MM-DD HH:mm" -> ganti spasi dengan "T" agar ISO valid
    const isoCandidate =
      dateValue.includes(' ') && !dateValue.includes('T')
        ? dateValue.replace(' ', 'T')
        : dateValue;
    const parsed = new Date(isoCandidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    // Fallback regex jika format YYYY-MM-DD
    const m = dateValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      return new Date(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10)
      );
    }
  }
  const fallback = new Date(dateValue);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

// Helper: Memeriksa apakah dua tanggal berada di hari yang sama (mengabaikan jam)
function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Helper: Filter hanya transaksi yang valid dan berhasil (bukan dibatalkan/retur penuh)
function isValidTransaction(t) {
  if (!t) return false;
  if (t.status === 'Dibatalkan' || t.status === 'Batal') return false;
  if (t.deliveryStatus === 'Dibatalkan') return false;
  if (t.paymentStatus === 'Batal' || t.paymentStatus === 'Dibatalkan') return false;
  return true;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    products,
    transactions,
    storeProfile,
    printerSettings,
    minStockThreshold,
    formatRupiah,
  } = useData();

  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );
  const safeTransactions = useMemo(
    () => (Array.isArray(transactions) ? transactions : []),
    [transactions]
  );

  // State modal detail transaksi
  const [selectedTrx, setSelectedTrx] = useState(null);
  // State interaktif grafik (indeks hari yang disorot/dipilih, default ke hari ini = 6)
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);

  // Transaksi yang sah (berhasil)
  const validTransactions = useMemo(() => {
    return safeTransactions.filter(isValidTransaction);
  }, [safeTransactions]);

  // Tanggal acuan hari ini dan kemarin
  const { today, yesterday, formattedCurrentDate } = useMemo(() => {
    const now = new Date();
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const y = new Date(t);
    y.setDate(y.getDate() - 1);

    const f = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return { today: t, yesterday: y, formattedCurrentDate: f };
  }, []);

  // Transaksi hari ini & kemarin
  const todayTransactions = useMemo(() => {
    return validTransactions.filter((t) => {
      const d = parseTrxDate(t.tanggal || t.date || t.createdAt);
      return isSameDay(d, today);
    });
  }, [validTransactions, today]);

  const yesterdayTransactions = useMemo(() => {
    return validTransactions.filter((t) => {
      const d = parseTrxDate(t.tanggal || t.date || t.createdAt);
      return isSameDay(d, yesterday);
    });
  }, [validTransactions, yesterday]);

  // =========================================================
  // 1. PERHITUNGAN KARTU STATISTIK
  // =========================================================

  // A. Omzet Hari Ini
  const omzetToday = useMemo(() => {
    return todayTransactions.reduce(
      (sum, t) => sum + (Number(t.total) || 0),
      0
    );
  }, [todayTransactions]);

  const omzetYesterday = useMemo(() => {
    return yesterdayTransactions.reduce(
      (sum, t) => sum + (Number(t.total) || 0),
      0
    );
  }, [yesterdayTransactions]);

  const omzetChange = useMemo(() => {
    if (omzetYesterday > 0) {
      return ((omzetToday - omzetYesterday) / omzetYesterday) * 100;
    }
    return omzetToday > 0 ? 100 : 0;
  }, [omzetToday, omzetYesterday]);

  // B. Jumlah Transaksi Hari Ini
  const countToday = todayTransactions.length;
  const countYesterday = yesterdayTransactions.length;
  const countChange = useMemo(() => {
    if (countYesterday > 0) {
      return ((countToday - countYesterday) / countYesterday) * 100;
    }
    return countToday > 0 ? 100 : 0;
  }, [countToday, countYesterday]);

  // C. Total Produk Aktif
  const activeProducts = useMemo(() => {
    return safeProducts.filter((p) => p.status !== 'Nonaktif');
  }, [safeProducts]);

  const totalCategories = useMemo(() => {
    const cats = new Set(
      activeProducts.map((p) => p.kategori || 'Umum').filter(Boolean)
    );
    return cats.size;
  }, [activeProducts]);

  // D. Jumlah Produk dengan Stok Menipis
  // Aturan ketat: Menghitung banyaknya jenis produk (SKU count), BUKAN total unit fisik gabungan!
  const thresholdGlobal =
    Number(minStockThreshold) > 0 ? Number(minStockThreshold) : 5;

  const lowStockProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const minLimit = Number(p.minStok || p.minStock || thresholdGlobal);
      const currentStock = Number(p.stok || 0);
      return currentStock <= minLimit;
    });
  }, [activeProducts, thresholdGlobal]);

  const outOfStockProducts = useMemo(() => {
    return activeProducts.filter((p) => Number(p.stok || 0) <= 0);
  }, [activeProducts]);

  // Format persentase helper
  const formatPercentBadge = (val) => {
    const num = Math.round(val);
    if (num > 0) return `+${num}%`;
    return `${num}%`;
  };

  // Definisi 4 kartu statistik
  const statCards = [
    {
      id: 'omzet-today',
      label: 'Omzet Hari Ini',
      value: formatRupiah(omzetToday),
      subtext:
        omzetYesterday > 0
          ? `Kemarin: ${formatRupiah(omzetYesterday)}`
          : 'Total omzet hari ini',
      icon: CircleDollarSign,
      accent: 'bg-emerald-600',
      badgeText: formatPercentBadge(omzetChange),
      trend:
        omzetChange > 0 ? 'up' : omzetChange < 0 ? 'down' : 'neutral',
      to: '/laporan',
      actionLabel: 'Lihat Laporan',
    },
    {
      id: 'transactions-today',
      label: 'Jumlah Transaksi Hari Ini',
      value: `${countToday} Transaksi`,
      subtext:
        countYesterday > 0
          ? `Kemarin: ${countYesterday} transaksi`
          : 'Transaksi berhasil hari ini',
      icon: ReceiptText,
      accent: 'bg-sky-600',
      badgeText: formatPercentBadge(countChange),
      trend:
        countChange > 0 ? 'up' : countChange < 0 ? 'down' : 'neutral',
      to: '/transaksi',
      actionLabel: 'Buka Kasir',
    },
    {
      id: 'total-products',
      label: 'Total Produk Aktif',
      value: `${activeProducts.length} Produk`,
      subtext: `${totalCategories} kategori produk terdaftar`,
      icon: Package,
      accent: 'bg-violet-600',
      badgeText: 'Katalog Aktif',
      trend: 'neutral',
      to: '/barang',
      actionLabel: 'Kelola Barang',
    },
    {
      id: 'low-stock-products',
      label: 'Produk Stok Menipis',
      value: `${lowStockProducts.length} Produk`,
      subtext:
        lowStockProducts.length === 0
          ? 'Semua produk dalam batas aman'
          : outOfStockProducts.length > 0
            ? `${outOfStockProducts.length} produk stok kosong (0)`
            : `Stok ≤ batas minimum (${thresholdGlobal})`,
      icon: lowStockProducts.length > 0 ? AlertTriangle : CheckCircle2,
      accent:
        lowStockProducts.length > 0
          ? outOfStockProducts.length > 0
            ? 'bg-rose-600'
            : 'bg-amber-500'
          : 'bg-emerald-600',
      badgeText:
        lowStockProducts.length === 0
          ? 'Stok Aman'
          : outOfStockProducts.length > 0
            ? 'Perlu Restok'
            : 'Perhatian',
      badgeStyle:
        lowStockProducts.length === 0
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : outOfStockProducts.length > 0
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-amber-50 text-amber-800 border-amber-200',
      trend: lowStockProducts.length > 0 ? 'warning' : 'safe',
      to: '/barang',
      actionLabel: 'Periksa Stok',
    },
  ];

  // =========================================================
  // 2. DATA GRAFIK 7 HARI TERAKHIR
  // =========================================================
  const chartDays = useMemo(() => {
    const list = [];
    const now = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - i);

      const dayTrx = validTransactions.filter((t) => {
        const trxDate = parseTrxDate(t.tanggal || t.date || t.createdAt);
        return isSameDay(trxDate, d);
      });

      const omzet = dayTrx.reduce(
        (sum, t) => sum + (Number(t.total) || 0),
        0
      );
      const count = dayTrx.length;

      const dayName = d
        .toLocaleDateString('id-ID', { weekday: 'short' })
        .replace('.', '');
      const dateFormatted = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      });
      const fullDate = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const isDayToday = i === 0;

      list.push({
        date: d,
        dayName,
        dateFormatted,
        fullDate,
        isToday: isDayToday,
        omzet,
        count,
      });
    }

    return list;
  }, [validTransactions]);

  const totalWeeklyOmzet = useMemo(() => {
    return chartDays.reduce((sum, d) => sum + d.omzet, 0);
  }, [chartDays]);

  const totalWeeklyTransactions = useMemo(() => {
    return chartDays.reduce((sum, d) => sum + d.count, 0);
  }, [chartDays]);

  // Perbandingan dengan 7 hari sebelumnya (H-13 s/d H-7)
  const previous7DaysOmzet = useMemo(() => {
    const now = new Date();
    const startPrev = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    startPrev.setDate(startPrev.getDate() - 13);
    const endPrev = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    endPrev.setDate(endPrev.getDate() - 7);

    return validTransactions
      .filter((t) => {
        const d = parseTrxDate(t.tanggal || t.date || t.createdAt);
        return d && d >= startPrev && d <= endPrev;
      })
      .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  }, [validTransactions]);

  const weeklyGrowth = useMemo(() => {
    if (previous7DaysOmzet > 0) {
      return (
        ((totalWeeklyOmzet - previous7DaysOmzet) / previous7DaysOmzet) * 100
      );
    }
    return totalWeeklyOmzet > 0 ? 100 : 0;
  }, [totalWeeklyOmzet, previous7DaysOmzet]);

  // Skala maksimum untuk grafik
  const maxChartValue = useMemo(() => {
    const rawMax = Math.max(...chartDays.map((d) => d.omzet), 0);
    if (rawMax === 0) return 100000;
    // Berikan ruang visual 15% di atas nilai tertinggi
    return Math.ceil(rawMax * 1.15);
  }, [chartDays]);

  // Koordinat polyline SVG overlay grafik
  const chartSvgPath = useMemo(() => {
    if (chartDays.length === 0) return '';
    const step = 100 / chartDays.length;

    const points = chartDays.map((d, idx) => {
      const x = (idx + 0.5) * step;
      const ratio = Math.min(1, Math.max(0, d.omzet / maxChartValue));
      // y: 0% berada di atas, 100% di bawah. Rentang efektif 15% - 90%
      const y = 92 - ratio * 77;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return points.join(' ');
  }, [chartDays, maxChartValue]);

  // Titik aktif yang sedang dipilih atau disorot
  const activeDay = useMemo(() => {
    if (
      hoveredDayIndex !== null &&
      chartDays[hoveredDayIndex] !== undefined
    ) {
      return chartDays[hoveredDayIndex];
    }
    // Default ke hari ini (indeks terakhir)
    return chartDays[chartDays.length - 1];
  }, [chartDays, hoveredDayIndex]);

  // =========================================================
  // 3. TRANSAKSI TERBARU (MAKSIMAL 5)
  // =========================================================
  const recentTransactions = useMemo(() => {
    return [...validTransactions]
      .sort((a, b) => {
        const dateA =
          parseTrxDate(a.tanggal || a.date || a.createdAt)?.getTime() || 0;
        const dateB =
          parseTrxDate(b.tanggal || b.date || b.createdAt)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [validTransactions]);

  // Format tanggal & jam untuk baris tabel transaksi
  const formatDateTime = (val) => {
    const d = parseTrxDate(val);
    if (!d) return val || '-';
    const dateStr = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr}, ${timeStr}`;
  };

  // Cetak struk dari modal detail
  const handlePrintReceipt = (trx) => {
    if (!trx) return;
    openThermalReceipt({
      transaction: trx,
      storeProfile,
      paperSize: printerSettings?.paperSize || '58',
    });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      {/* Watermark logo QurmacelPOS */}
      <LogoWatermark size="lg" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* =========================================================
            HEADER DASHBOARD DENGAN TANGGAL AKTUAL & QUICK ACTIONS
        ========================================================= */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-800 sm:text-2xl">
                Dashboard
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/80">
                <Store size={12} />
                {storeProfile?.nama || 'Qurmacel POS'}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>{formattedCurrentDate}</span>
              <span className="text-slate-300">·</span>
              <span>Ringkasan performa penjualan toko hari ini.</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/transaksi"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-500 active:scale-98"
            >
              <ShoppingCart size={16} />
              <span>Buka Kasir</span>
            </Link>
            <Link
              to="/laporan"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
            >
              <ReceiptText size={16} className="text-slate-500" />
              <span className="hidden sm:inline">Laporan</span>
            </Link>
          </div>
        </div>

        {/* =========================================================
            A. EMPAT KARTU STATISTIK (DAPAT DIKLIK & TERHUBUNG)
        ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.id}
                to={card.to}
                className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                title={`Buka ${card.label}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div
                      className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${card.accent} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
                    >
                      <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </div>

                    <span
                      className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-full border px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold ${
                        card.badgeStyle
                          ? card.badgeStyle
                          : card.trend === 'up'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : card.trend === 'down'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {card.trend === 'up' && <ArrowUpRight size={11} className="sm:hidden" />}
                      {card.trend === 'up' && <ArrowUpRight size={13} className="hidden sm:inline" />}
                      {card.trend === 'down' && <ArrowDownRight size={11} className="sm:hidden" />}
                      {card.trend === 'down' && <ArrowDownRight size={13} className="hidden sm:inline" />}
                      <span className="truncate max-w-[70px] sm:max-w-none">{card.badgeText}</span>
                    </span>
                  </div>

                  <p className="mt-2.5 sm:mt-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-base sm:text-2xl font-black tracking-tight text-slate-800 truncate">
                    {card.value}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-slate-500 truncate pr-1">
                    {card.subtext}
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors shrink-0">
                    <span className="hidden sm:inline">{card.actionLabel}</span>
                    <ChevronRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5 sm:w-3.5 sm:h-3.5"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* =========================================================
            B. GRAFIK PENJUALAN 7 HARI TERAKHIR (INTERAKTIF & RESPONSIF)
        ========================================================= */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
          {/* Header Grafik */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Grafik Penjualan
                </h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  7 Hari Terakhir
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Tren akumulasi omzet harian toko berdasarkan data transaksi riil.
              </p>
            </div>

            {totalWeeklyOmzet > 0 && (
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <p className="text-[11px] font-medium text-slate-400">
                    Total 7 Hari
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    {formatRupiah(totalWeeklyOmzet)}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                    weeklyGrowth >= 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                  title="Dibandingkan periode 7 hari sebelumnya"
                >
                  {weeklyGrowth >= 0 ? (
                    <TrendingUp size={13} />
                  ) : (
                    <ArrowDownRight size={13} />
                  )}
                  {formatPercentBadge(weeklyGrowth)} vs 7 hr lalu
                </span>
              </div>
            )}
          </div>

          {/* Kondisi Empty State jika belum ada transaksi dalam 7 hari terakhir */}
          {totalWeeklyOmzet === 0 && totalWeeklyTransactions === 0 ? (
            <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Belum Ada Penjualan dalam 7 Hari Terakhir
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 max-w-md">
                    Grafik omzet harian akan otomatis terisi secara proporsional
                    begitu transaksi berhasil disimpan di kasir.
                  </p>
                </div>
              </div>
              <Link
                to="/transaksi"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 active:scale-98"
              >
                <ShoppingCart size={14} />
                <span>Buka Kasir Sekarang</span>
              </Link>
            </div>
          ) : (
            <div className="pt-5">
              {/* Highlight bar info interaktif untuk hari yang disorot/dipilih */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-700">
                    {activeDay.fullDate}
                  </span>
                  {activeDay.isToday && (
                    <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                      Hari Ini
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    Jumlah:{' '}
                    <strong className="text-slate-800">
                      {activeDay.count} transaksi
                    </strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    Omzet:{' '}
                    <strong className="font-extrabold text-emerald-700 text-sm">
                      {formatRupiah(activeDay.omzet)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Area Grafik Bar + Garis Kontinu */}
              <div className="relative pt-6">
                {/* Garis batas referensi skala horizontal (100%, 50%, 0%) */}
                <div className="pointer-events-none absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between text-[10px] text-slate-400 select-none">
                  <div className="border-b border-dashed border-slate-200 flex justify-between pb-0.5">
                    <span>{formatRupiah(maxChartValue)}</span>
                    <span className="text-slate-300">Batas Maks</span>
                  </div>
                  <div className="border-b border-dashed border-slate-100 flex justify-between pb-0.5">
                    <span>{formatRupiah(Math.round(maxChartValue / 2))}</span>
                    <span className="text-slate-300">50%</span>
                  </div>
                  <div className="border-b border-slate-200 flex justify-between pb-0.5">
                    <span>Rp 0</span>
                    <span className="text-slate-300">Dasar</span>
                  </div>
                </div>

                {/* Kolom Bar Interaktif */}
                <div className="relative z-10 flex h-48 items-end justify-between gap-2 sm:gap-4 pb-2">
                  {chartDays.map((day, idx) => {
                    const ratio = Math.min(1, Math.max(0, day.omzet / maxChartValue));
                    // Bar height proporsional: 0% menghasilkan tinggi minimal 3px agar terlihat slotnya
                    const barHeightPercent =
                      day.omzet > 0
                        ? Math.max(ratio * 100, 8)
                        : 3;
                    const isSelected =
                      hoveredDayIndex === idx ||
                      (hoveredDayIndex === null && day.isToday);

                    return (
                      <div
                        key={`bar-${day.dateFormatted}-${idx}`}
                        onMouseEnter={() => setHoveredDayIndex(idx)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        onClick={() => setHoveredDayIndex(idx)}
                        className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end"
                      >
                        {/* Tooltip Mengambang saat bar disorot */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="pointer-events-none absolute -top-11 z-30 whitespace-nowrap rounded-xl bg-slate-900 px-2.5 py-1 text-center text-[10px] font-bold text-white shadow-xl"
                            >
                              <div>{formatRupiah(day.omzet)}</div>
                              <div className="text-[9px] font-normal text-slate-300">
                                {day.count} trx
                              </div>
                              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Batang Bar Proporsional dengan gradient */}
                        <div className="relative w-full max-w-[42px] flex items-end justify-center h-full">
                          {/* Track latar belakang */}
                          <div className="absolute inset-x-0 bottom-0 top-0 rounded-t-xl bg-slate-50/70" />

                          {/* Bar data */}
                          <div
                            className={`w-full rounded-t-xl transition-all duration-300 ${
                              day.omzet > 0
                                ? isSelected
                                  ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/40'
                                  : 'bg-gradient-to-t from-emerald-500 to-emerald-400 group-hover:from-emerald-600 group-hover:to-emerald-400'
                                : 'bg-slate-200'
                            }`}
                            style={{ height: `${barHeightPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SVG Polyline Kurva Tren di atas bar */}
                <svg
                  className="pointer-events-none absolute inset-x-0 top-6 h-48 w-full z-20"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points={chartSvgPath}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className="opacity-80"
                  />
                </svg>

                {/* Label Hari & Tanggal di bawah kolom */}
                <div className="flex justify-between gap-2 sm:gap-4 pt-2 border-t border-slate-200">
                  {chartDays.map((day, idx) => {
                    const isSelected =
                      hoveredDayIndex === idx ||
                      (hoveredDayIndex === null && day.isToday);

                    return (
                      <button
                        key={`label-${day.dateFormatted}-${idx}`}
                        type="button"
                        onClick={() => setHoveredDayIndex(idx)}
                        className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-1 transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">
                          {day.dayName}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight">
                          {day.dateFormatted}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            C. TRANSAKSI TERBARU (MAKSIMAL 5 TRANSAKSI TERAKHIR)
        ========================================================= */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Header Tabel */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Transaksi Terbaru
              </h2>
              <p className="text-xs text-slate-500">
                5 aktivitas transaksi kasir yang paling baru diselesaikan.
              </p>
            </div>

            {/* Sesuai ketentuan: Tombol Lihat Semua mengarah ke halaman Transaksi */}
            <Link
              to="/transaksi"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 hover:border-emerald-300"
            >
              <span>Lihat Semua</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Card List untuk Layar Mobile (HP < 640px) */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {recentTransactions.map((trx, index) => {
              const paymentMethod =
                trx.paymentMethod || trx.metode || 'Tunai';
              const isDigital =
                trx.paymentCategory === 'Digital' ||
                ['QRIS', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Transfer Bank'].includes(paymentMethod);
              const paymentStatus = trx.paymentStatus || 'Lunas';
              const orderType = trx.orderType || (trx.isDelivery ? 'Delivery' : 'Pickup');

              return (
                <div key={trx.id || index} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700">
                      <span>{trx.id}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          orderType === 'Delivery' || orderType === 'Dikirim'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {orderType === 'Delivery' || orderType === 'Dikirim' ? 'Delivery' : 'Pickup'}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      {formatRupiah(Number(trx.total) || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      <span>{formatDateTime(trx.tanggal || trx.date || trx.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={11} className="text-slate-400" />
                      <span>{trx.kasir || 'Admin'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          isDigital
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : paymentMethod === 'Hutang'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {paymentMethod}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          paymentStatus === 'Lunas'
                            ? 'text-emerald-700 bg-emerald-100/60'
                            : paymentStatus === 'Hutang'
                              ? 'text-rose-700 bg-rose-100/60'
                              : 'text-amber-700 bg-amber-100/60'
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTrx(trx)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      <Eye size={12} />
                      <span>Detail</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Transaksi */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-5 py-3">Nomor Transaksi</th>
                  <th className="px-5 py-3">Tanggal &amp; Waktu</th>
                  <th className="px-5 py-3">Kasir</th>
                  <th className="px-5 py-3">Metode Pembayaran</th>
                  <th className="px-5 py-3 text-right">Total Pembayaran</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((trx, index) => {
                  const paymentMethod =
                    trx.paymentMethod || trx.metode || 'Tunai';
                  const isDigital =
                    trx.paymentCategory === 'Digital' ||
                    ['QRIS', 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja', 'Transfer Bank'].includes(paymentMethod);
                  const paymentStatus = trx.paymentStatus || 'Lunas';
                  const orderType = trx.orderType || (trx.isDelivery ? 'Delivery' : 'Pickup');

                  return (
                    <tr
                      key={trx.id || index}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      {/* 1. Nomor Transaksi */}
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-emerald-700">
                        <div className="flex items-center gap-1.5">
                          <span>{trx.id}</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                              orderType === 'Delivery' || orderType === 'Dikirim'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {orderType === 'Delivery' || orderType === 'Dikirim' ? 'Delivery' : 'Pickup'}
                          </span>
                        </div>
                      </td>

                      {/* 2. Tanggal dan Waktu */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>{formatDateTime(trx.tanggal || trx.date || trx.createdAt)}</span>
                        </div>
                      </td>

                      {/* 3. Kasir */}
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span>{trx.kasir || 'Admin'}</span>
                        </div>
                      </td>

                      {/* 4. Metode Pembayaran */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              isDigital
                                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                : paymentMethod === 'Hutang'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {paymentMethod}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              paymentStatus === 'Lunas'
                                ? 'text-emerald-700 bg-emerald-100/60'
                                : paymentStatus === 'Hutang'
                                  ? 'text-rose-700 bg-rose-100/60'
                                  : 'text-amber-700 bg-amber-100/60'
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* 5. Total Pembayaran */}
                      <td className="px-5 py-3.5 text-right font-black text-slate-800">
                        {formatRupiah(Number(trx.total) || 0)}
                      </td>

                      {/* 6. Aksi untuk melihat detail */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTrx(trx)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                          title="Lihat Rincian Transaksi"
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty State jika belum ada transaksi sama sekali */}
            {recentTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <ReceiptText size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-700">
                  Belum Ada Transaksi yang Tercatat
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-sm">
                  Transaksi kasir yang telah diselesaikan akan secara otomatis
                  muncul pada tabel ini.
                </p>
                <Link
                  to="/transaksi"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500"
                >
                  <ShoppingCart size={14} />
                  Mulai Transaksi Pertama
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL DETAIL TRANSAKSI
      ========================================================= */}
      <AnimatePresence>
        {selectedTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTrx(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ReceiptText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Rincian Transaksi
                    </h3>
                    <p className="font-mono text-xs font-semibold text-emerald-700">
                      {selectedTrx.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600 transition"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Isi Detail */}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4 text-xs">
                {/* Info Metadata */}
                <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-200/70 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Waktu Transaksi</span>
                    <strong className="text-slate-800 font-semibold">
                      {formatDateTime(selectedTrx.tanggal || selectedTrx.date || selectedTrx.createdAt)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kasir</span>
                    <strong className="text-slate-800 font-semibold">
                      {selectedTrx.kasir || 'Admin'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pelanggan / Tipe</span>
                    <strong className="text-slate-800 font-semibold">
                      {selectedTrx.customer || 'Umum'} · {selectedTrx.orderType || (selectedTrx.isDelivery ? 'Delivery' : 'Pickup')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Metode / Status Bayar</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-800">
                        {selectedTrx.metode || selectedTrx.paymentMethod || 'Tunai'}
                      </span>
                      <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 font-bold text-[10px]">
                        {selectedTrx.paymentStatus || 'Lunas'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabel Barang yang Dibeli */}
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">
                    Daftar Barang ({selectedTrx.items?.length || 0} item)
                  </h4>
                  <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    {selectedTrx.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">
                            {item.nama}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>
                              {item.qty} x {formatRupiah(item.harga)}
                            </span>
                            {item.pajakAktif && (
                              <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 px-1 py-0.2 text-[9px] font-semibold">
                                {item.pajakJenis || 'PPN'} {item.pajakPersen}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="font-bold text-slate-800 text-right">
                          {formatRupiah((Number(item.harga) || 0) * (Number(item.qty) || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rincian Finansial & Pajak */}
                <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatRupiah(selectedTrx.subtotal || 0)}</span>
                  </div>

                  {Number(selectedTrx.discount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Diskon</span>
                      <span className="text-rose-600 font-semibold">
                        -{formatRupiah(selectedTrx.discount)}
                      </span>
                    </div>
                  )}

                  {Number(selectedTrx.pajakBarang) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pajak Barang</span>
                      <span>+{formatRupiah(selectedTrx.pajakBarang)}</span>
                    </div>
                  )}

                  {Number(selectedTrx.pajakTransaksi) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Pajak Transaksi ({selectedTrx.pajakTransaksiPersen || 0}%)
                      </span>
                      <span>+{formatRupiah(selectedTrx.pajakTransaksi)}</span>
                    </div>
                  )}

                  {Number(selectedTrx.shippingCost || selectedTrx.deliveryCost) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Ongkos Kirim</span>
                      <span>
                        +{formatRupiah(selectedTrx.shippingCost || selectedTrx.deliveryCost)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-slate-800 pt-2 border-t border-slate-200">
                    <span>TOTAL</span>
                    <span className="text-emerald-700 font-black text-base">
                      {formatRupiah(selectedTrx.total || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Uang Diterima ({selectedTrx.metode || selectedTrx.paymentMethod || 'Tunai'})</span>
                    <span>{formatRupiah(selectedTrx.paid || selectedTrx.total)}</span>
                  </div>

                  {Number(selectedTrx.change) > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Kembalian</span>
                      <span className="text-emerald-700 font-semibold">
                        {formatRupiah(selectedTrx.change)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal: Cetak Struk & Tutup */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedTrx)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition active:scale-98"
                >
                  <Printer size={14} />
                  <span>Cetak Struk</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
