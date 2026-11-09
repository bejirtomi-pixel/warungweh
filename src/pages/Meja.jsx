import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table2,
  Plus,
  Search,
  QrCode,
  Download,
  Printer,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Utensils,
  ShoppingBag,
  X,
  Check,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Receipt,
  ToggleLeft,
  ToggleRight,
  Users,
  DollarSign,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import LogoWatermark from '../components/common/LogoWatermark';
import {
  generateTableQrDataUrl,
  downloadTableQr,
  printTableStandCard,
} from '../utils/qrCode';

export default function Meja() {
  const navigate = useNavigate();
  const {
    tables = [],
    tableSessions = [],
    orders = [],
    addTable,
    updateTable,
    deleteTable,
    regenerateTableQr,
    closeTableSession,
    transactions = [],
    storeProfile,
    formatRupiah,
  } = useData();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua'); // 'semua' | 'tersedia' | 'terisi' | 'billing' | 'nonaktif'

  // Modal States (Tambah & Edit Meja)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tableToEdit, setTableToEdit] = useState(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableCapacityInput, setTableCapacityInput] = useState(4);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState('');

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQrTable, setActiveQrTable] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isQrLoading, setIsQrLoading] = useState(false);

  // Detail Modal (Table Session)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTableForDetail, setSelectedTableForDetail] = useState(null);

  // Settlement / Tutup Sesi Modal
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [sessionToSettle, setSessionToSettle] = useState(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('Tunai');

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Helper mendapatkan Sesi Aktif per Meja (Satu Meja = Satu Sesi Aktif)
  const getTableSession = (tableId) => {
    return tableSessions.find((s) => s.tableId === tableId && s.status !== 'closed');
  };

  // Fallback map untuk legacy transaksi yang belum lunas
  const legacyUnpaidMap = useMemo(() => {
    const map = {};
    for (const trx of transactions || []) {
      if (trx && trx.tableId) {
        const isUnpaid = trx.paymentStatus === 'Belum Lunas' || trx.paymentStatus === 'Hutang';
        if (isUnpaid) {
          if (!map[trx.tableId] || new Date(trx.tanggal) > new Date(map[trx.tableId].tanggal)) {
            map[trx.tableId] = trx;
          }
        }
      }
    }
    return map;
  }, [transactions]);

  // Statistik Meja Terintegrasi (4 Kartu Statistik)
  const stats = useMemo(() => {
    const total = tables.length;
    let available = 0;
    let occupied = 0;
    let billing = 0;
    let inactive = 0;
    let totalActiveRevenue = 0;

    for (const t of tables) {
      if (t.active === false) {
        inactive += 1;
      } else {
        const session = getTableSession(t.id);
        const legacyTrx = legacyUnpaidMap[t.id];

        if (session) {
          totalActiveRevenue += Number(session.total) || 0;
          if (session.status === 'billing') {
            billing += 1;
          } else {
            occupied += 1;
          }
        } else if (legacyTrx) {
          occupied += 1;
          totalActiveRevenue += Number(legacyTrx.total) || 0;
        } else {
          available += 1;
        }
      }
    }

    const activeTotal = available + occupied + billing;
    const occupancyRate = activeTotal > 0 ? Math.round(((occupied + billing) / activeTotal) * 100) : 0;

    return {
      total,
      available,
      occupied,
      billing,
      inactive,
      totalActiveRevenue,
      occupancyRate,
    };
  }, [tables, tableSessions, legacyUnpaidMap]);

  // Filter daftar meja
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const isTableActive = table.active !== false;
      const session = getTableSession(table.id);
      const legacyTrx = legacyUnpaidMap[table.id];
      const hasActive = Boolean(session || legacyTrx);
      const isBilling = session?.status === 'billing';

      if (statusFilter === 'tersedia' && (!isTableActive || hasActive)) return false;
      if (statusFilter === 'terisi' && (!isTableActive || !hasActive || isBilling)) return false;
      if (statusFilter === 'billing' && (!isTableActive || !isBilling)) return false;
      if (statusFilter === 'nonaktif' && isTableActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          table.name.toLowerCase().includes(q) ||
          (table.id && table.id.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [tables, tableSessions, legacyUnpaidMap, statusFilter, searchQuery]);

  // QR Generator
  const openQrModal = async (table) => {
    setActiveQrTable(table);
    setQrModalOpen(true);
    setIsQrLoading(true);
    try {
      // Direct payload ke halaman publik QR Menu
      const payload = `${window.location.origin}/menu/${table.id}?token=${table.qrToken || table.id}`;
      const url = await generateTableQrDataUrl(payload, { width: 450 });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat kode QR meja', 'error');
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!activeQrTable) return;
    try {
      setIsQrLoading(true);
      const newToken = regenerateTableQr(activeQrTable.id);
      const updatedTable = { ...activeQrTable, qrToken: newToken };
      setActiveQrTable(updatedTable);

      const payload = `${window.location.origin}/menu/${updatedTable.id}?token=${newToken}`;
      const url = await generateTableQrDataUrl(payload, { width: 450 });
      setQrDataUrl(url);
      showToast(`QR Code ${updatedTable.name} berhasil diperbarui!`);
    } catch (err) {
      console.error(err);
      showToast('Gagal memperbarui QR meja', 'error');
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !activeQrTable) return;
    const filename = `QR-Menu-${activeQrTable.name.replace(/\s+/g, '-').toLowerCase()}`;
    downloadTableQr(qrDataUrl, filename);
    showToast('Gambar QR Code berhasil diunduh');
  };

  const handlePrintCard = () => {
    if (!qrDataUrl || !activeQrTable) return;
    printTableStandCard({
      storeProfile,
      table: activeQrTable,
      qrDataUrl,
    });
  };

  // Detail Modal
  const openDetailModal = (table) => {
    setSelectedTableForDetail(table);
    setDetailModalOpen(true);
  };

  // Tambah Meja Baru
  const handleOpenAddModal = () => {
    setTableNameInput(`Meja ${tables.length + 1}`);
    setTableCapacityInput(4);
    setFormError('');
    setAddModalOpen(true);
  };

  const handleSaveNewTable = (e) => {
    e.preventDefault();
    const name = tableNameInput.trim();
    if (!name) {
      setFormError('Nama meja tidak boleh kosong.');
      return;
    }
    const isDuplicate = tables.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      setFormError(`Nama meja "${name}" sudah terdaftar.`);
      return;
    }

    addTable({
      name,
      capacity: Number(tableCapacityInput) || 4,
    });
    setAddModalOpen(false);
    showToast(`"${name}" berhasil ditambahkan.`);
  };

  // Edit Meja
  const handleOpenEditModal = (table) => {
    setTableToEdit(table);
    setTableNameInput(table.name);
    setTableCapacityInput(table.capacity || 4);
    setFormError('');
    setEditModalOpen(true);
  };

  const handleSaveEditTable = (e) => {
    e.preventDefault();
    const name = tableNameInput.trim();
    if (!name) {
      setFormError('Nama meja tidak boleh kosong.');
      return;
    }
    const isDuplicate = tables.some(
      (t) => t.id !== tableToEdit.id && t.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      setFormError(`Nama meja "${name}" sudah digunakan.`);
      return;
    }

    updateTable({
      id: tableToEdit.id,
      name,
      capacity: Number(tableCapacityInput) || 4,
    });
    setEditModalOpen(false);
    showToast(`Meja "${name}" berhasil diperbarui.`);
  };

  // Toggle Active
  const handleToggleActive = (table) => {
    const session = getTableSession(table.id);
    if (session && table.active !== false) {
      showToast('Meja tidak dapat dinonaktifkan saat sedang memiliki sesi aktif.', 'error');
      return;
    }
    const nextActive = table.active === false;
    updateTable({ id: table.id, active: nextActive });
    showToast(`"${table.name}" ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
  };

  // Hapus Meja dengan VALIDASI TRANSAKSI / SESI AKTIF
  const handleOpenDeleteConfirm = (table) => {
    setTableToDelete(table);
    const session = getTableSession(table.id);
    const legacyTrx = legacyUnpaidMap[table.id];

    if (session) {
      setDeleteBlockedReason(
        `Meja "${table.name}" sedang memiliki Table Session aktif (${formatRupiah(
          session.total
        )}) dengan ${session.orderIds?.length || 0} pesanan. Selesaikan dan tutup sesi meja terlebih dahulu sebelum menghapus.`
      );
    } else if (legacyTrx) {
      setDeleteBlockedReason(
        `Meja "${table.name}" masih memiliki transaksi belum lunas (${formatRupiah(
          legacyTrx.total
        )}). Selesaikan transaksi di kasir terlebih dahulu.`
      );
    } else {
      setDeleteBlockedReason('');
    }
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!tableToDelete || deleteBlockedReason) return;
    deleteTable(tableToDelete.id);
    setDeleteModalOpen(false);
    showToast(`Meja "${tableToDelete.name}" berhasil dihapus.`);
  };

  // Tutup Sesi Meja
  const handleOpenSettleModal = (session) => {
    setSessionToSettle(session);
    setSettleModalOpen(true);
  };

  const handleConfirmCloseSession = () => {
    if (!sessionToSettle) return;
    try {
      closeTableSession(sessionToSettle.id, {
        paymentMethod: settlePaymentMethod,
        paymentCategory: settlePaymentMethod === 'Tunai' ? 'Tunai' : 'Digital',
        paid: sessionToSettle.total,
        change: 0,
        kasir: 'Admin',
      });
      setSettleModalOpen(false);
      setDetailModalOpen(false);
      showToast(`Sesi "${sessionToSettle.tableName}" berhasil diselesaikan & meja kembali tersedia.`);
    } catch (err) {
      console.error(err);
      showToast('Gagal menutup sesi meja.', 'error');
    }
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
                Manajemen Meja &amp; Table Session
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <Utensils size={12} />
                Dine-In Management
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Satu Meja = Satu Sesi Aktif = Satu Tagihan Gabungan. Terintegrasi penuh dengan QR Menu pelanggan dan kasir POS.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98 shrink-0"
          >
            <Plus size={16} />
            Tambah Meja Baru
          </button>
        </div>

        {/* 1. DASHBOARD STATISTIK MEJA (4 KARTU + OKUPANSI) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Total Meja */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Meja</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Table2 size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
              <span className="text-xs text-slate-400">Unit</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Seluruh meja terdaftar</p>
          </div>

          {/* Meja Tersedia */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tersedia</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <Check size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800">{stats.available}</span>
              <span className="text-xs font-semibold text-emerald-700">Meja</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">Siap ditempati pelanggan</p>
          </div>

          {/* Meja Terisi */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Terisi (Sesi Aktif)</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-900">{stats.occupied}</span>
              <span className="text-xs font-bold text-amber-700">Meja</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700 truncate">
              {stats.totalActiveRevenue > 0
                ? `Tagihan: ${formatRupiah(stats.totalActiveRevenue)}`
                : 'Sedang ada pesanan'}
            </p>
          </div>

          {/* Okupansi & Nonaktif */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Okupansi</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{stats.occupancyRate}%</span>
              {stats.inactive > 0 && (
                <span className="text-[11px] text-slate-400">({stats.inactive} nonaktif)</span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. FILTER & PENCARIAN MEJA */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'semua', label: 'Semua Meja', count: stats.total },
              { id: 'tersedia', label: 'Tersedia', count: stats.available },
              { id: 'terisi', label: 'Terisi', count: stats.occupied },
              { id: 'nonaktif', label: 'Nonaktif', count: stats.inactive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    statusFilter === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor / nama meja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        {/* 3. DAFTAR KARTU MEJA (GRID VIEW) */}
        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Table2 size={32} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-800">Tidak ada meja ditemukan</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {searchQuery
                ? `Tidak ada meja yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada meja dalam kategori ini. Silakan buat meja baru.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTables.map((table) => {
              const isTableActive = table.active !== false;
              const session = getTableSession(table.id);
              const legacyTrx = legacyUnpaidMap[table.id];
              const isOccupied = isTableActive && Boolean(session || legacyTrx);

              // Ambil pesanan dalam sesi aktif ini
              const currentSessionOrders = session
                ? orders.filter(
                    (o) => (session.orderIds || []).includes(o.id) && o.orderStatus !== 'cancelled'
                  )
                : [];

              return (
                <div
                  key={table.id}
                  className={`group relative overflow-hidden rounded-2xl border transition duration-200 flex flex-col justify-between ${
                    !isTableActive
                      ? 'border-slate-200 bg-slate-50/70 opacity-70'
                      : isOccupied
                      ? 'border-amber-300 bg-gradient-to-b from-amber-50/40 to-white shadow-xs'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <LogoWatermark size="sm" />

                  {/* Top Bar: Name, Capacity, & Status Badge */}
                  <div className="relative z-10 p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {table.id}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.2 text-[9.5px] font-semibold text-slate-600">
                            <Users size={10} />
                            {table.capacity || 4} Kursi
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 leading-tight mt-0.5">
                          {table.name}
                        </h3>
                      </div>

                      {/* Status Badges */}
                      {!isTableActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          Nonaktif
                        </span>
                      ) : isOccupied ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Terisi (Sesi)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Tersedia
                        </span>
                      )}
                    </div>

                    {/* Middle Info: Table Session Information */}
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 min-h-[72px] flex flex-col justify-center">
                      {!isTableActive ? (
                        <p className="text-xs text-slate-400 italic text-center">
                          Meja dinonaktifkan sementara
                        </p>
                      ) : session ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1">
                              <ShoppingBag size={13} className="text-amber-600" />
                              {currentSessionOrders.length} Pesanan Tergabung
                            </span>
                            <span className="font-extrabold text-amber-900">
                              {formatRupiah(session.total)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="truncate max-w-[120px]">
                              {session.customerName || 'Tamu'}
                            </span>
                            <span className="text-amber-700 font-semibold">Tagihan Sesi</span>
                          </div>
                        </div>
                      ) : legacyTrx ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Tagihan Aktif</span>
                            <span className="font-extrabold text-amber-900">
                              {formatRupiah(legacyTrx.total)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Siap digunakan tamu
                          </span>
                          <span className="text-[11px] text-slate-400">Kosong</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="relative z-10 border-t border-slate-100 bg-white/90 px-4 py-3 flex items-center justify-between gap-2">
                    {/* Left: QR Stand Meja Button */}
                    <button
                      onClick={() => openQrModal(table)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition"
                      title="Lihat / Cetak QR Stand Meja"
                    >
                      <QrCode size={13} className="text-emerald-600" />
                      <span>QR Meja</span>
                    </button>

                    {/* Center & Right Actions */}
                    <div className="flex items-center gap-1">
                      {isOccupied ? (
                        <button
                          onClick={() => openDetailModal(table)}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition"
                        >
                          <Eye size={13} />
                          Detail Sesi
                        </button>
                      ) : isTableActive ? (
                        <button
                          onClick={() => navigate(`/transaksi?tableId=${table.id}`)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                          title="Buka pesanan kasir untuk meja ini"
                        >
                          <Utensils size={13} />
                          Pesan
                        </button>
                      ) : null}

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(table)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Edit nama & kapasitas meja"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Toggle Active Button */}
                      <button
                        onClick={() => handleToggleActive(table)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title={isTableActive ? 'Nonaktifkan meja' : 'Aktifkan meja'}
                      >
                        {isTableActive ? (
                          <ToggleRight size={17} className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={17} className="text-slate-400" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleOpenDeleteConfirm(table)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus meja"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: TAMBAH MEJA BARU (DENGAN KAPASITAS KURSI)             */}
      {/* ============================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Table2 size={18} className="text-emerald-600" />
                Tambah Meja Baru
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewTable} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Nomor / Nama Meja <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="cth: Meja 01, VIP Room, Outdoor 2"
                  value={tableNameInput}
                  onChange={(e) => {
                    setTableNameInput(e.target.value);
                    setFormError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                {formError && (
                  <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formError}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Kapasitas Kursi (Orang)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tableCapacityInput}
                  onChange={(e) => setTableCapacityInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
                >
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT MEJA (NAMA & KAPASITAS)                          */}
      {/* ============================================================== */}
      {editModalOpen && tableToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setEditModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 size={17} className="text-emerald-600" />
                Ubah Nama &amp; Kapasitas Meja
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTable} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Nama Meja <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={tableNameInput}
                  onChange={(e) => {
                    setTableNameInput(e.target.value);
                    setFormError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                {formError && (
                  <p className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formError}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Kapasitas Kursi (Orang)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tableCapacityInput}
                  onChange={(e) => setTableCapacityInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS MEJA (DENGAN PROTEKSI SESI AKTIF)   */}
      {/* ============================================================== */}
      {deleteModalOpen && tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                {deleteBlockedReason ? (
                  <AlertTriangle size={18} className="text-amber-500" />
                ) : (
                  <Trash2 size={18} className="text-rose-600" />
                )}
                {deleteBlockedReason ? 'Tidak Dapat Menghapus Meja' : 'Konfirmasi Hapus Meja'}
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteBlockedReason ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertCircle size={15} />
                    Validasi Sesi / Transaksi Aktif Menolak Tindakan Ini
                  </p>
                  <p className="leading-relaxed">{deleteBlockedReason}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Apakah Anda yakin ingin menghapus <strong>"{tableToDelete.name}"</strong>? Data identitas meja ini akan dihapus permanen.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {deleteBlockedReason ? 'Tutup' : 'Batal'}
                </button>
                {!deleteBlockedReason && (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
                  >
                    Ya, Hapus Meja
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: MANAJEMEN QR MEJA (PREVIEW, DOWNLOAD, CETAK STAND)    */}
      {/* ============================================================== */}
      {qrModalOpen && activeQrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setQrModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-emerald-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    QR Menu &amp; Stand Meja
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeQrTable.name} · Kapasitas {activeQrTable.capacity || 4} Orang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-lg">
                {isQrLoading ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-emerald-600" />
                    <span>Menghasilkan QR Code...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${activeQrTable.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Gagal memuat QR</span>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">{activeQrTable.name}</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                  Pelanggan cukup memindai QR ini melalui kamera HP untuk melihat katalog menu dan memesan langsung.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={isQrLoading || !qrDataUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <Download size={14} className="text-emerald-600" />
                  Unduh PNG
                </button>
                <button
                  type="button"
                  onClick={handlePrintCard}
                  disabled={isQrLoading || !qrDataUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
                >
                  <Printer size={14} />
                  Cetak Stand Meja
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleRegenerateQr}
                  disabled={isQrLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
                >
                  <RefreshCw size={12} className={isQrLoading ? 'animate-spin' : ''} />
                  Regenerate QR Token (Keamanan Kode)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: DETAIL TABLE SESSION (SATU MEJA = SATU SESI GABUNGAN)  */}
      {/* ============================================================== */}
      {detailModalOpen && selectedTableForDetail && (() => {
        const session = getTableSession(selectedTableForDetail.id);
        const legacyTrx = legacyUnpaidMap[selectedTableForDetail.id];
        const sessionOrdersList = session
          ? orders.filter(
              (o) => (session.orderIds || []).includes(o.id) && o.orderStatus !== 'cancelled'
            )
          : [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setDetailModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <Utensils size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Table Session: {selectedTableForDetail.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kapasitas: {selectedTableForDetail.capacity || 4} Orang ·{' '}
                      <span className="font-bold text-amber-600">Satu Tagihan Gabungan</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {session ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-200">
                      <div>
                        <span className="block text-slate-400 text-[10px]">ID Sesi Aktif</span>
                        <span className="font-mono font-bold text-slate-800">{session.id}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">Mulai Sesi</span>
                        <span className="font-semibold text-slate-700">
                          {new Date(session.startedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">Pelanggan</span>
                        <span className="font-semibold text-slate-700">{session.customerName || 'Tamu'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px]">Status Pembayaran</span>
                        <span className="font-bold text-amber-700">
                          {session.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR'}
                        </span>
                      </div>
                    </div>

                    {/* Daftar Seluruh Pesanan dalam Sesi (Multiple Orders) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Pesanan Dalam Sesi Ini ({sessionOrdersList.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailModalOpen(false);
                            navigate(`/transaksi?tableId=${selectedTableForDetail.id}`);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Plus size={13} />
                          Tambah Pesanan Meja
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {sessionOrdersList.map((ord, idx) => (
                          <div
                            key={ord.id}
                            className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                              <span className="font-mono font-bold text-slate-800">
                                Order #{idx + 1} ({ord.orderNumber || ord.id.slice(-6)})
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">
                                  {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                                    ord.fulfillmentStatus === 'served'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ord.fulfillmentStatus === 'ready'
                                      ? 'bg-blue-100 text-blue-800'
                                      : ord.fulfillmentStatus === 'preparing'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {ord.fulfillmentStatus === 'served'
                                    ? 'Disajikan'
                                    : ord.fulfillmentStatus === 'ready'
                                    ? 'Siap Saji'
                                    : ord.fulfillmentStatus === 'preparing'
                                    ? 'Dimasak'
                                    : 'Menunggu'}
                                </span>
                              </div>
                            </div>

                            <div className="divide-y divide-slate-100 text-xs">
                              {ord.items.map((it, i) => (
                                <div key={i} className="py-1 flex justify-between">
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      {it.qty}x {it.nama}
                                    </span>
                                    {it.notes && (
                                      <span className="text-[10px] text-slate-400 block italic">
                                        "{it.notes}"
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-slate-700">
                                    {formatRupiah(it.harga * it.qty)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tagihan Konsolidasi Sesi */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-700">
                        <span>Subtotal Sesi Gabungan:</span>
                        <span className="font-mono font-bold">{formatRupiah(session.subtotal)}</span>
                      </div>
                      {Number(session.tax) > 0 && (
                        <div className="flex justify-between text-slate-700">
                          <span>Pajak Transaksi:</span>
                          <span className="font-mono font-bold">+{formatRupiah(session.tax)}</span>
                        </div>
                      )}
                      <div className="border-t border-amber-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                        <span>TOTAL TAGIHAN GABUNGAN:</span>
                        <span className="text-amber-900 text-base font-black">
                          {formatRupiah(session.total)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : legacyTrx ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Transaksi Kasir Berjalan: <strong>{legacyTrx.id}</strong> ({formatRupiah(legacyTrx.total)})
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Tidak ada sesi aktif pada meja ini.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Tutup
                </button>

                {session && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenSettleModal(session)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-98"
                    >
                      <CreditCard size={14} />
                      Bayar &amp; Tutup Sesi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* MODAL 6: SETTLE & TUTUP SESI MEJA (PEMBAYARAN GABUNGAN)        */}
      {/* ============================================================== */}
      {settleModalOpen && sessionToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSettleModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Penyelesaian Sesi {sessionToSettle.tableName}
              </h3>
              <button
                onClick={() => setSettleModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <span className="text-xs font-semibold text-emerald-800 block">Total Tagihan Sesi</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">
                {formatRupiah(sessionToSettle.total)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={settlePaymentMethod}
                onChange={(e) => setSettlePaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="Tunai">Tunai (Cash)</option>
                <option value="QRIS">QRIS Kasir</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="DANA">DANA</option>
                <option value="ShopeePay">ShopeePay</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Kartu Debit">Kartu Debit</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Setelah pembayaran selesai, seluruh pesanan sesi ditandai Lunas, meja otomatis berstatus Tersedia, dan transaksi tercatat pada laporan.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSettleModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseSession}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500"
              >
                Konfirmasi Lunas &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl transition-all ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white shadow-rose-900/30'
              : 'bg-slate-900 text-white shadow-slate-900/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
