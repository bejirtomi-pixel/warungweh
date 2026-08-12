import React, { useMemo, useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ReceiptText,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import LogoWatermark from '../components/common/LogoWatermark';
import { useData } from '../context/DataContext';

const periodOptions = [
  { id: 'all', label: 'Semua Periode' },
  { id: 'today', label: 'Hari Ini' },
  { id: 'week', label: 'Minggu Ini' },
  { id: 'month', label: 'Bulan Ini' },
];

export default function Laporan() {
  const { transactions, storeProfile, formatRupiah } = useData();
  const [period, setPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const perPage = 8;

  const filtered = useMemo(() => {
    let list = transactions;
    if (dateFrom) list = list.filter((t) => t.tanggal.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter((t) => t.tanggal.slice(0, 10) <= dateTo);
    return list;
  }, [transactions, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const omzet = filtered.reduce((sum, t) => sum + t.total, 0);
    const items = filtered.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0), 0);
    return { omzet, items, count: filtered.length, avg: filtered.length ? omzet / filtered.length : 0 };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const header = ['No. Transaksi', 'Tanggal', 'Kasir', 'Pelanggan', 'Metode', 'Jumlah Item', 'Total'];
    const rows = filtered.map((t) => [
      t.id,
      t.tanggal,
      t.kasir,
      t.customer,
      t.metode,
      t.items.reduce((s, i) => s + i.qty, 0),
      t.total,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-qurmacel-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: 'Total Omzet',
      value: formatRupiah(totals.omzet),
      icon: TrendingUp,
      accent: 'bg-emerald-500',
    },
    {
      label: 'Jumlah Transaksi',
      value: totals.count,
      icon: ReceiptText,
      accent: 'bg-sky-500',
    },
    {
      label: 'Barang Terjual',
      value: totals.items,
      icon: TrendingDown,
      accent: 'bg-violet-500',
    },
    {
      label: 'Rata-rata / Transaksi',
      value: formatRupiah(totals.avg),
      icon: Calendar,
      accent: 'bg-amber-500',
    },
  ];

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">Laporan Penjualan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Rekapitulasi penjualan dan transaksi Qurmacel Store.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Printer size={16} />
              Cetak
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
            >
              <Download size={16} />
              Unduh
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            {periodOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative">
              <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <span className="text-xs text-slate-400">s.d.</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <p className="text-xs text-slate-400">
            {filtered.length} transaksi ditemukan
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.accent} text-white shadow-md`}>
                  <Icon size={22} />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">{s.label}</p>
                <p className="mt-1 text-lg font-extrabold tracking-tight text-slate-800 sm:text-xl">
                  {s.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Table with watermark */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print-only print-area">
          {/* Report header with logo (print) */}
          <div className="hidden border-b border-slate-200 px-6 py-5 sm:flex sm:items-center sm:justify-between print:flex">
            <div className="flex items-center gap-3">
              <Logo size="sm" imgClassName="rounded-lg" />
              <div>
                <p className="text-base font-extrabold text-slate-800">{storeProfile.nama}</p>
                <p className="text-xs text-slate-500">
                  {storeProfile.alamat} · {storeProfile.telepon}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Laporan Penjualan</p>
              <p className="text-xs text-slate-500">
                Periode: {dateFrom || 'Awal'} – {dateTo || 'Sekarang'}
              </p>
            </div>
          </div>

          <LogoWatermark size="lg" />

          <div className="relative z-10 overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5 font-semibold">No. Transaksi</th>
                  <th className="px-5 py-3.5 font-semibold">Tanggal</th>
                  <th className="px-5 py-3.5 font-semibold">Pelanggan</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Item</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Metode</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((trx) => (
                  <tr key={trx.id} className="bg-white transition hover:bg-emerald-50/40">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-700">
                      {trx.id}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{trx.tanggal}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{trx.customer}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-700">
                      {trx.items.reduce((s, i) => s + i.qty, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {trx.metode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                      {formatRupiah(trx.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50/70">
                    <td colSpan={5} className="px-5 py-3.5 text-right text-sm font-bold text-slate-700">
                      TOTAL
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-extrabold text-emerald-600">
                      {formatRupiah(totals.omzet)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            {paged.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ReceiptText size={32} className="text-slate-200" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Belum ada transaksi</p>
                <p className="text-xs text-slate-400">Tidak ada data laporan pada periode ini.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
            <p className="text-xs text-slate-500">
              Menampilkan <b>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</b>–
              <b>{Math.min(currentPage * perPage, filtered.length)}</b> dari{' '}
              <b>{filtered.length}</b> transaksi
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                    currentPage === p
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Print footer */}
          <div className="hidden border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-400 print:block">
            Dicetak dari Qurmacel POS — {new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
}
