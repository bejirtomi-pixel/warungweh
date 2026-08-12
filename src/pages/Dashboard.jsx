import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
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

  const stats = useMemo(() => {
    const today = transactions.filter((t) => t.tanggal.startsWith('2026-08-10'));
    const omzetToday = today.reduce((sum, t) => sum + t.total, 0);
    const totalOmzet = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalItems = products.reduce((sum, p) => sum + p.stok, 0);
    return {
      omzetToday,
      totalOmzet,
      transactionsToday: today.length,
      totalTransactions: transactions.length,
      totalProducts: products.length,
      totalItems,
    };
  }, [transactions, products]);

  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  const chartData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const values = [420000, 680000, 510000, 790000, 630000, 940000, 860000];
    const max = Math.max(...values);
    return { days, values, max };
  }, []);

  const topProducts = useMemo(() => {
    const countMap = {};
    transactions.forEach((t) => {
      t.items.forEach((it) => {
        countMap[it.nama] = (countMap[it.nama] || 0) + it.qty;
      });
    });
    return Object.entries(countMap)
      .map(([nama, qty]) => ({ nama, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  const statCards = [
    {
      label: 'Omzet Hari Ini',
      value: formatRupiah(stats.omzetToday),
      icon: CircleDollarSign,
      accent: 'bg-emerald-500',
      badge: '+12%',
      trend: 'up',
    },
    {
      label: 'Transaksi Hari Ini',
      value: stats.transactionsToday,
      icon: ReceiptText,
      accent: 'bg-sky-500',
      badge: '+8%',
      trend: 'up',
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
      {/* Watermark */}
      <LogoWatermark size="lg" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan kinerja toko Qurmacel Store hari ini.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.accent} text-white shadow-md`}>
                    <Icon size={22} />
                  </div>
                  {card.badge && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        card.trend === 'up'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {card.trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Chart + Top products */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Grafik Penjualan</h2>
                <p className="text-xs text-slate-500">7 hari terakhir</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <TrendingUp size={13} />
                +18% minggu ini
              </span>
            </div>
            <div className="flex h-52 items-end justify-between gap-2 sm:gap-3">
              {chartData.values.map((value, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 group-hover:opacity-90 ${
                        value === chartData.max
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-t from-emerald-500/70 to-emerald-300/70'
                      }`}
                      style={{ height: `${(value / chartData.max) * 100}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white group-hover:block">
                      {formatRupiah(value)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{chartData.days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top products */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-800">Produk Terlaris</h2>
            <div className="space-y-3">
              {topProducts.map((product, i) => {
                const barWidth = (product.qty / topProducts[0].qty) * 100;
                return (
                  <div key={product.nama}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          {i + 1}
                        </span>
                        {product.nama}
                      </span>
                      <span className="font-semibold text-slate-800">{product.qty} pcs</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              to="/transaksi"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Mulai Transaksi <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-800">Transaksi Terbaru</h2>
            <Link to="/laporan" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Lihat semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">No. Transaksi</th>
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-5 py-3 font-semibold">Kasir</th>
                  <th className="px-5 py-3 font-semibold">Metode</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((trx) => (
                  <tr key={trx.id} className="transition hover:bg-emerald-50/40">
                    <td className="px-5 py-3 font-medium text-emerald-700">{trx.id}</td>
                    <td className="px-5 py-3 text-slate-600">{trx.tanggal}</td>
                    <td className="px-5 py-3 text-slate-600">{trx.kasir}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {trx.metode}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      {formatRupiah(trx.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {recent.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ReceiptText size={26} className="text-slate-200" />
                <p className="mt-2 text-sm font-semibold text-slate-600">Belum ada transaksi</p>
                <p className="text-xs text-slate-400">
                  Mulai transaksi pertama Anda melalui halaman Transaksi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
