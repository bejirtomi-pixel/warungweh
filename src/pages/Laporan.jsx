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
  Pencil,
  X,
  CheckCircle2,
  Truck,
  User,
  Phone,
  MapPin,
  Package,
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

const paymentStatusOptions = ['Lunas', 'Belum Lunas', 'Hutang'];
const deliveryStatusOptions = ['Menunggu', 'Terkirim', 'Dibatalkan'];

export default function Laporan() {
  const { transactions, storeProfile, formatRupiah, updateTransaction } = useData();
  const [period, setPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [toast, setToast] = useState('');

  const perPage = 8;

  const filtered = useMemo(() => {
  let list = [...transactions];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    list = list.filter((t) => {
      const date = new Date(t.tanggal);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    });
  }

  if (period === 'week') {
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diff);

    list = list.filter((t) => {
      const date = new Date(t.tanggal);
      return date >= startOfWeek;
    });
  }

  if (period === 'month') {
    list = list.filter((t) => {
      const date = new Date(t.tanggal);

      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth()
      );
    });
  }

  if (dateFrom) {
    list = list.filter(
      (t) => t.tanggal.slice(0, 10) >= dateFrom
    );
  }

  if (dateTo) {
    list = list.filter(
      (t) => t.tanggal.slice(0, 10) <= dateTo
    );
  }

  return list;
}, [transactions, period, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const omzet = filtered.reduce((sum, t) => sum + t.total, 0);
    const items = filtered.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0), 0);
    return { omzet, items, count: filtered.length, avg: filtered.length ? omzet / filtered.length : 0 };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const deliveryTransactions = useMemo(() => {
  return filtered.filter((t) => t.orderType === 'Dikirim');
}, [filtered]);
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openEdit = (trx) => {
    setEditing(trx);
    setEditForm({
      kasir: trx.kasir || 'Admin',
      customer: trx.customer || 'Umum',
      paymentMethod: trx.paymentMethod || trx.metode || 'Tunai',
      paymentStatus: trx.paymentStatus || 'Lunas',
      deliveryName: trx.deliveryName || '',
      deliveryPhone: trx.deliveryPhone || '',
      deliveryAddress: trx.deliveryAddress || '',
      deliveryCourier: trx.deliveryCourier || '',
      deliveryCost: Number(trx.shippingCost ?? trx.deliveryCost ?? 0),
      deliveryStatus: trx.deliveryStatus || 'Menunggu',
    });
  };

  const handleSaveEdit = () => {
    if (!editing || !editForm) return;

    const updates = {
      kasir: editForm.kasir,
      customer: editForm.customer,
      paymentMethod: editForm.paymentMethod,
      metode: editForm.paymentMethod,
      paymentStatus: editForm.paymentStatus,
    };

    if (editing.orderType === 'Dikirim') {
      Object.assign(updates, {
        deliveryName: editForm.deliveryName,
        deliveryPhone: editForm.deliveryPhone,
        deliveryAddress: editForm.deliveryAddress,
        deliveryCourier: editForm.deliveryCourier,
        shippingCost: Number(editForm.deliveryCost) || 0,
        deliveryCost: Number(editForm.deliveryCost) || 0,
        deliveryStatus: editForm.deliveryStatus,
      });

      // hitung ulang total bila ongkir berubah
      const subtotal = (editing.items || []).reduce(
        (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.harga) || 0),
        0
      );
      const discount = Number(editing.discount) || 0;
      const tax = Number(editing.tax) || 0;
      updates.total = Math.max(0, subtotal - discount + tax + updates.shippingCost);
    }

    updateTransaction(editing.id, updates);

    setEditing(null);
    setEditForm(null);
    showToast('Perubahan disimpan');
  };

  const deliveryTotal = deliveryTransactions.reduce(
    (sum, trx) => sum + (Number(trx.total) || 0),
    0
  );

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
          {/* On-screen caption */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50/40 px-6 py-4 print:hidden">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
                <ReceiptText size={16} />
                Tabel Penjualan
              </h2>
              <p className="mt-0.5 text-xs text-emerald-700/70">
                Rekapitulasi seluruh transaksi (Diambil &amp; Dikirim) beserta status pembayaran.
              </p>
            </div>
          </div>

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
           <table className="w-full min-w-[1080px] text-left text-sm">
  <thead>
    <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
      <th className="px-4 py-3.5 font-semibold">No. Transaksi</th>
      <th className="px-4 py-3.5 font-semibold">Tanggal</th>
      <th className="px-4 py-3.5 font-semibold">Kasir</th>
      <th className="px-4 py-3.5 font-semibold">Pelanggan</th>
      <th className="px-4 py-3.5 text-center font-semibold">Pesanan</th>
      <th className="px-4 py-3.5 text-center font-semibold">Item</th>
      <th className="px-4 py-3.5 text-center font-semibold">Pembayaran</th>
      <th className="px-4 py-3.5 text-center font-semibold">Status Bayar</th>
      <th className="px-4 py-3.5 text-right font-semibold">Total</th>
      <th className="px-4 py-3.5 text-center font-semibold">Aksi</th>
    </tr>
  </thead>

  <tbody className="divide-y divide-slate-50">
    {paged.map((trx) => {
      const isDelivery = trx.orderType === 'Dikirim';

      const paymentLabel =
        trx.paymentCategory === 'Digital'
          ? trx.paymentMethod || 'Digital'
          : 'Tunai';

      const paymentStatus = trx.paymentStatus || 'Lunas';

      return (
        <tr
          key={trx.id}
          className="bg-white transition hover:bg-emerald-50/40"
        >
          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-700">
            {trx.id}
          </td>

          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
            {trx.tanggal}
          </td>

          <td className="px-4 py-3.5 font-medium text-slate-700">
            {trx.kasir || 'Admin'}
          </td>

          <td className="px-4 py-3.5 font-medium text-slate-700">
            {trx.customer || 'Umum'}
          </td>

          <td className="px-4 py-3.5 text-center">
            <span
              className={
                isDelivery
                  ? 'rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600'
                  : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
              }
            >
              {isDelivery ? 'Dikirim' : 'Diambil'}
            </span>
          </td>

          <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
            {trx.items?.reduce(
              (sum, item) => sum + (Number(item.qty) || 0),
              0
            ) || 0}
          </td>

          <td className="px-4 py-3.5 text-center">
            {paymentStatus === 'Hutang' ? (
              <span className="whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                Hutang
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {paymentLabel}
              </span>
            )}
          </td>

          <td className="px-4 py-3.5 text-center">
            <span
              className={
                paymentStatus === 'Lunas'
                  ? 'whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600'
                  : paymentStatus === 'Belum Lunas'
                    ? 'whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600'
                    : 'whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600'
              }
            >
              {paymentStatus}
            </span>
          </td>

          <td className="px-4 py-3.5 text-right font-bold text-slate-800">
            {formatRupiah(trx.total)}
          </td>

          <td className="px-4 py-3.5 text-center no-print">
            <button
              onClick={() => openEdit(trx)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
              title="Edit transaksi"
            >
              <Pencil size={16} />
            </button>
          </td>
        </tr>
      );
    })}
  </tbody>

  {filtered.length > 0 && (
    <tfoot>
      <tr className="border-t border-slate-200 bg-slate-50/70">
        <td
          colSpan={9}
          className="px-4 py-3.5 text-right text-sm font-bold text-slate-700"
        >
          TOTAL
        </td>

        <td className="px-4 py-3.5 text-right text-sm font-extrabold text-emerald-600">
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

{/* =====================================================
    TABEL PENGIRIMAN (khusus tipe Dikirim)
===================================================== */}
<div className="relative mt-6 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm print-only print-area">
  {/* On-screen caption */}
  <div className="flex items-center justify-between border-b border-slate-100 bg-sky-50/40 px-6 py-4 print:hidden">
    <div>
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-sky-800">
        <Truck size={16} />
        Tabel Pengiriman
      </h2>
      <p className="mt-0.5 text-xs text-sky-700/70">
        Khusus transaksi tipe pesanan Dikirim — memuat penerima, kurir, dan status pengiriman.
      </p>
    </div>
  </div>

  {/* Print header */}
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
      <p className="text-sm font-bold text-slate-800">Laporan Pengiriman</p>
      <p className="text-xs text-slate-500">
        Periode: {dateFrom || 'Awal'} – {dateTo || 'Sekarang'}
      </p>
    </div>
  </div>

  <LogoWatermark size="lg" />

  {deliveryTransactions.length > 0 ? (
  <div className="relative z-10 overflow-x-auto">
    <table className="w-full min-w-[1050px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
          <th className="px-4 py-3.5 font-semibold">No. Transaksi</th>
          <th className="px-4 py-3.5 font-semibold">Pelanggan</th>
          <th className="px-4 py-3.5 font-semibold">Kurir</th>
          <th className="px-4 py-3.5 font-semibold">Alamat</th>
          <th className="px-4 py-3.5 text-right font-semibold">Ongkir</th>
          <th className="px-4 py-3.5 text-center font-semibold">
            Pembayaran
          </th>
          <th className="px-4 py-3.5 text-center font-semibold">
            Status Kirim
          </th>
          <th className="px-4 py-3.5 text-right font-semibold">Total</th>
          <th className="px-4 py-3.5 text-center font-semibold">Aksi</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-50">
        {deliveryTransactions.map((trx) => (
          <tr
            key={trx.id}
            className="bg-white transition hover:bg-blue-50/30"
          >
            <td className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-600">
              {trx.id}
            </td>

            <td className="px-4 py-3.5">
              <p className="font-semibold text-slate-700">
                {trx.deliveryName || trx.customer || 'Umum'}
              </p>

              {trx.deliveryPhone && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {trx.deliveryPhone}
                </p>
              )}
            </td>

            <td className="px-4 py-3.5 font-medium text-slate-700">
              {trx.deliveryCourier || '—'}
            </td>

            <td className="max-w-[260px] px-4 py-3.5">
              <p className="truncate text-slate-600">
                {trx.deliveryAddress || '—'}
              </p>
            </td>

            <td className="px-4 py-3.5 text-right font-medium text-slate-700">
              {formatRupiah(
                Number(trx.shippingCost ?? trx.deliveryCost ?? 0)
              )}
            </td>

            <td className="px-4 py-3.5 text-center">
              {trx.paymentStatus === 'Hutang' ? (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                  Hutang
                </span>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {trx.paymentCategory === 'Digital'
                      ? trx.paymentMethod || 'Digital'
                      : 'Tunai'}
                  </span>

                  <span
                    className={`text-[11px] font-semibold ${
                      trx.paymentStatus === 'Lunas'
                        ? 'text-emerald-600'
                        : trx.paymentStatus === 'Belum Lunas'
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {trx.paymentStatus || 'Lunas'}
                  </span>
                </div>
              )}
            </td>

            <td className="px-4 py-3.5 text-center">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  trx.deliveryStatus === 'Terkirim'
                    ? 'bg-emerald-50 text-emerald-600'
                    : trx.deliveryStatus === 'Dibatalkan'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-600'
                }`}
              >
                {trx.deliveryStatus || 'Menunggu'}
              </span>
            </td>

            <td className="px-4 py-3.5 text-right font-bold text-slate-800">
              {formatRupiah(Number(trx.total) || 0)}
            </td>

            <td className="px-4 py-3.5 text-center no-print">
              <button
                onClick={() => openEdit(trx)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                title="Edit pengiriman"
              >
                <Pencil size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>

      <tfoot>
        <tr className="border-t border-slate-200 bg-slate-50/70">
          <td
            colSpan={8}
            className="px-4 py-3.5 text-right text-sm font-bold text-slate-700"
          >
            TOTAL PENGIRIMAN
          </td>

          <td className="px-4 py-3.5 text-right text-sm font-extrabold text-blue-600">
            {formatRupiah(deliveryTotal)}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
) : (
  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <ReceiptText size={22} />
    </div>

    <p className="mt-3 text-sm font-semibold text-slate-700">
      Belum ada transaksi pengiriman
    </p>

    <p className="mt-1 max-w-sm text-xs text-slate-400">
      Transaksi dengan tipe pesanan Dikirim akan otomatis muncul di sini.
    </p>
  </div>
)}
</div>

{/* =====================================================
    EDIT MODAL
===================================================== */}

{editing && editForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
    <div
      className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      onClick={() => {
        setEditing(null);
        setEditForm(null);
      }}
    />

    <div className="relative z-10 my-6 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            Edit {editing.orderType === 'Dikirim' ? 'Transaksi Pengiriman' : 'Transaksi'}
          </h3>
          <p className="text-xs text-slate-500">No. {editing.id}</p>
        </div>

        <button
          onClick={() => {
            setEditing(null);
            setEditForm(null);
          }}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Kasir
            </label>
            <input
              value={editForm.kasir}
              onChange={(e) =>
                setEditForm({ ...editForm, kasir: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Pelanggan
            </label>
            <input
              value={editForm.customer}
              onChange={(e) =>
                setEditForm({ ...editForm, customer: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Metode Pembayaran
            </label>
            <input
              value={editForm.paymentMethod}
              onChange={(e) =>
                setEditForm({ ...editForm, paymentMethod: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Status Bayar
            </label>
            <select
              value={editForm.paymentStatus}
              onChange={(e) =>
                setEditForm({ ...editForm, paymentStatus: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              {paymentStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {editing.orderType === 'Dikirim' && (
          <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <Truck size={14} />
              Data Pengiriman
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User size={15} className="shrink-0 text-slate-400" />
                <input
                  value={editForm.deliveryName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deliveryName: e.target.value })
                  }
                  placeholder="Nama penerima"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-slate-400" />
                <input
                  value={editForm.deliveryPhone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deliveryPhone: e.target.value })
                  }
                  placeholder="No. HP penerima"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-2 shrink-0 text-slate-400" />
                <textarea
                  value={editForm.deliveryAddress}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deliveryAddress: e.target.value })
                  }
                  placeholder="Alamat pengiriman"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="shrink-0 text-slate-400" />
                  <input
                    value={editForm.deliveryCourier}
                    onChange={(e) =>
                      setEditForm({ ...editForm, deliveryCourier: e.target.value })
                    }
                    placeholder="Kurir"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <input
                  type="number"
                  min="0"
                  value={editForm.deliveryCost}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deliveryCost: e.target.value })
                  }
                  placeholder="Ongkir"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Status Kirim
                </label>
                <select
                  value={editForm.deliveryStatus}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deliveryStatus: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {deliveryStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <button
          onClick={() => {
            setEditing(null);
            setEditForm(null);
          }}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Batal
        </button>

        <button
          onClick={handleSaveEdit}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
        >
          <CheckCircle2 size={16} />
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
)}

{/* TOAST */}
{toast && (
  <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
    <CheckCircle2 size={16} className="text-emerald-400" />
    {toast}
  </div>
)}

</div>
</div>
);
}
