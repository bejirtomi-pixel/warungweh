import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  CircleDollarSign,
} from 'lucide-react';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { products, transactions, formatRupiah } = useData();

  const safeProducts = Array.isArray(products) ? products : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const toDate = (value) => {
    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startOfDay = (date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const endOfDay = (date) => {
    const result = startOfDay(date);
    result.setDate(result.getDate() + 1);
    return result;
  };

  const getTotal = (transaction) => {
    return Number(transaction?.total) || 0;
  };

  const isInRange = (date, start, end) => {
    return date && date >= start && date < end;
  };

  // =========================
  // STATISTIK
  // =========================
  const stats = useMemo(() => {
    const now = new Date();

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayStart);

    const todayTransactions = safeTransactions.filter((transaction) => {
      const date = toDate(transaction?.tanggal || transaction?.date);

      return isInRange(date, todayStart, todayEnd);
    });

    const yesterdayTransactions = safeTransactions.filter((transaction) => {
      const date = toDate(transaction?.tanggal || transaction?.date);

      return isInRange(date, yesterdayStart, yesterdayEnd);
    });

    const omzetToday = todayTransactions.reduce(
      (sum, transaction) => sum + getTotal(transaction),
      0
    );

    const omzetYesterday = yesterdayTransactions.reduce(
      (sum, transaction) => sum + getTotal(transaction),
      0
    );

    const omzetChange =
      omzetYesterday > 0
        ? ((omzetToday - omzetYesterday) / omzetYesterday) * 100
        : omzetToday > 0
          ? 100
          : 0;

    const transactionChange =
      yesterdayTransactions.length > 0
        ? ((todayTransactions.length - yesterdayTransactions.length) /
            yesterdayTransactions.length) *
          100
        : todayTransactions.length > 0
          ? 100
          : 0;

    const totalOmzet = safeTransactions.reduce(
      (sum, transaction) => sum + getTotal(transaction),
      0
    );

    const totalItems = safeProducts.reduce(
      (sum, product) => sum + (Number(product?.stok) || 0),
      0
    );

    return {
      omzetToday,
      omzetYesterday,
      omzetChange,
      transactionChange,
      totalOmzet,
      transactionsToday: todayTransactions.length,
      totalTransactions: safeTransactions.length,
      totalProducts: safeProducts.length,
      totalItems,
    };
  }, [safeProducts, safeTransactions]);

  // =========================
  // TRANSAKSI TERBARU
  // =========================
  const recent = useMemo(() => {
    return [...safeTransactions]
      .sort((a, b) => {
        const dateA = toDate(a?.tanggal || a?.date)?.getTime() || 0;
        const dateB = toDate(b?.tanggal || b?.date)?.getTime() || 0;

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [safeTransactions]);

  // =========================
  // GRAFIK 7 HARI TERAKHIR
  // =========================
  const chartData = useMemo(() => {
    const now = new Date();
    const days = [];
    const values = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = startOfDay(now);
      date.setDate(date.getDate() - i);

      const nextDate = endOfDay(date);

      const omzet = safeTransactions
        .filter((transaction) => {
          const transactionDate = toDate(
            transaction?.tanggal || transaction?.date
          );

          return isInRange(transactionDate, date, nextDate);
        })
        .reduce(
          (sum, transaction) => sum + getTotal(transaction),
          0
        );

      const label = date
        .toLocaleDateString('id-ID', {
          weekday: 'short',
        })
        .replace('.', '');

      days.push(label);
      values.push(omzet);
    }

    const max = Math.max(...values, 1);

    const currentStart = startOfDay(now);
    currentStart.setDate(currentStart.getDate() - 6);

    const currentEnd = endOfDay(now);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);

    const previousEnd = new Date(currentStart);

    const currentTotal = safeTransactions
      .filter((transaction) => {
        const date = toDate(transaction?.tanggal || transaction?.date);

        return isInRange(date, currentStart, currentEnd);
      })
      .reduce(
        (sum, transaction) => sum + getTotal(transaction),
        0
      );

    const previousTotal = safeTransactions
      .filter((transaction) => {
        const date = toDate(transaction?.tanggal || transaction?.date);

        return isInRange(date, previousStart, previousEnd);
      })
      .reduce(
        (sum, transaction) => sum + getTotal(transaction),
        0
      );

    const weeklyChange =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : currentTotal > 0
          ? 100
          : 0;

    return {
      days,
      values,
      max,
      weeklyChange,
    };
  }, [safeTransactions]);

  // =========================
  // GARIS GRAFIK (POINTS)
  // =========================
  const chartLinePoints = useMemo(() => {
    const max = chartData.max || 1;
    const step = 100 / 7;

    return chartData.values
      .map((value, index) => {
        const flexHeight =
          value > 0
            ? Math.max((value / max) * 100, 8)
            : 3;

        const x = (index + 0.5) * step;
        const y = 100 - flexHeight;

        return `${x},${y}`;
      })
      .join(' ');
  }, [chartData]);

  // =========================
  // FORMAT PERSENTASE
  // =========================
  const formatPercent = (value) => {
    const rounded = Math.round(Number(value) || 0);

    if (rounded > 0) {
      return `+${rounded}%`;
    }

    return `${rounded}%`;
  };

  // =========================
  // STAT CARDS
  // =========================
  const statCards = [
    {
      label: 'Omzet Hari Ini',
      value: formatRupiah(stats.omzetToday),
      icon: CircleDollarSign,
      accent: 'bg-emerald-500',
      badge: formatPercent(stats.omzetChange),
      trend:
        stats.omzetChange > 0
          ? 'up'
          : stats.omzetChange < 0
            ? 'down'
            : null,
    },
    {
      label: 'Transaksi Hari Ini',
      value: stats.transactionsToday,
      icon: ReceiptText,
      accent: 'bg-sky-500',
      badge: formatPercent(stats.transactionChange),
      trend:
        stats.transactionChange > 0
          ? 'up'
          : stats.transactionChange < 0
            ? 'down'
            : null,
    },
    {
      label: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      accent: 'bg-violet-500',
      badge: 'Aktif',
      trend: null,
    },
    {
      label: 'Stok Tersedia',
      value: stats.totalItems,
      icon: ShoppingCart,
      accent: 'bg-amber-500',
      badge: 'Unit',
      trend: null,
    },
  ];

  return (
    <div className="relative px-4 py-6 lg:px-6">
      <LogoWatermark size="lg" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Ringkasan kinerja toko Qurmacel Store hari ini.
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.accent} text-white shadow-md`}
                  >
                    <Icon size={22} />
                  </div>

                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      card.trend === 'up'
                        ? 'bg-emerald-50 text-emerald-600'
                        : card.trend === 'down'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {card.trend === 'up' && (
                      <ArrowUpRight size={13} />
                    )}

                    {card.trend === 'down' && (
                      <ArrowDownRight size={13} />
                    )}

                    {card.badge}
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* =================================================
            GRAFIK PENJUALAN (SEPARATE SECTION)
        ================================================= */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Grafik Penjualan
              </h2>

              <p className="text-xs text-slate-500">
                Omzet 7 hari terakhir
              </p>
            </div>

            <span
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                chartData.weeklyChange >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {chartData.weeklyChange >= 0 ? (
                <TrendingUp size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}

              {formatPercent(chartData.weeklyChange)}
            </span>
          </div>

          <div>
            {/* BARS + LINE (aligned) */}
            <div className="relative h-56">
              <div className="flex h-56 items-end justify-between gap-2 sm:gap-3">
                {chartData.values.map((value, index) => {
                  const maxValue = chartData.max || 1;

                  const flexHeight =
                    value > 0
                      ? Math.max((value / maxValue) * 100, 8)
                      : 3;

                  return (
                    <div
                      key={`${chartData.days[index]}-${index}`}
                      className="group relative flex min-w-0 flex-1 flex-col items-center justify-end self-stretch"
                    >
                      <div className="relative w-full flex items-end justify-center">
                        <div
                          className="w-full max-w-[38px] rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-300/70 transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-400"
                          style={{ height: `${flexHeight}%` }}
                        />
                      </div>

                      <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white group-hover:block">
                        {formatRupiah(value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* LINE CHART OVERLAY */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polyline
                  points={chartLinePoints}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* DAY LABELS */}
            <div className="mt-2 flex justify-between gap-2 sm:gap-3">
              {chartData.days.map((day, index) => (
                <span
                  key={`label-${index}`}
                  className="min-w-0 flex-1 text-center text-xs font-medium text-slate-400"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* =================================================
            TRANSAKSI TERBARU (SEPARATE SECTION)
        ================================================= */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-800">
              Transaksi Terbaru
            </h2>

            <Link
              to="/laporan"
              className="shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Lihat semua →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
                  <th className="px-5 py-3 font-semibold">
                    No. Transaksi
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Waktu
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Kasir
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Metode
                  </th>

                  <th className="px-5 py-3 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {recent.map((transaction, index) => {
                  const paymentMethod =
                    transaction?.paymentMethod ||
                    transaction?.metode ||
                    '-';

                  const isDigital =
                    transaction?.paymentCategory === 'digital' ||
                    ['QRIS', 'Transfer', 'E-Wallet'].includes(
                      paymentMethod
                    );

                  return (
                    <tr
                      key={transaction?.id || index}
                      className="transition hover:bg-emerald-50/40"
                    >
                      <td className="px-5 py-3 font-medium text-emerald-700">
                        {transaction?.id || '-'}
                      </td>

                      <td className="px-5 py-3 text-slate-600">
                        {transaction?.tanggal ||
                          transaction?.date ||
                          '-'}
                      </td>

                      <td className="px-5 py-3 text-slate-600">
                        {transaction?.kasir || 'Admin'}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isDigital
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {paymentMethod}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right font-bold text-slate-800">
                        {formatRupiah(getTotal(transaction))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {recent.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ReceiptText
                  size={26}
                  className="text-slate-200"
                />

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Belum ada transaksi
                </p>

                <p className="text-xs text-slate-400">
                  Mulai transaksi pertama Anda melalui halaman
                  Transaksi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}