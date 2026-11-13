import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  ArrowRight,
  Database,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import {
  fetchActivityLogs,
  fetchAuditTrailLogs,
  formatActorInfo,
} from '../utils/activityLogger.js';

export default function RiwayatAktivitas() {
  // Tab State: 'activity' | 'audit'
  const [activeTab, setActiveTab] = useState('activity');

  // Logs States
  const [activityLogs, setActivityLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [acts, audits] = await Promise.all([
        fetchActivityLogs(200),
        fetchAuditTrailLogs(200),
      ]);
      setActivityLogs(acts);
      setAuditLogs(audits);
    } catch (err) {
      console.warn('Gagal memuat log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Filter Riwayat Aktivitas Operasional
  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const actor = formatActorInfo(log);

      const matchSearch =
        !q ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.actorName || '').toLowerCase().includes(q) ||
        (log.operatorName || '').toLowerCase().includes(q) ||
        (log.actorEmail || '').toLowerCase().includes(q) ||
        (actor.displayName || '').toLowerCase().includes(q) ||
        (actor.badgeText || '').toLowerCase().includes(q) ||
        (log.actorUid || '').toLowerCase().includes(q) ||
        (log.targetId || '').toLowerCase().includes(q) ||
        (log.sessionId || '').toLowerCase().includes(q) ||
        (log.orderId || '').toLowerCase().includes(q);

      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
      const matchRole = roleFilter === 'all' || log.actorRole === roleFilter;

      return matchSearch && matchModule && matchRole;
    });
  }, [activityLogs, searchQuery, moduleFilter, roleFilter]);

  // Filter Audit Trail Perubahan Data
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const actor = formatActorInfo(log);

      const matchSearch =
        !q ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.actorName || '').toLowerCase().includes(q) ||
        (log.operatorName || '').toLowerCase().includes(q) ||
        (log.actorEmail || '').toLowerCase().includes(q) ||
        (actor.displayName || '').toLowerCase().includes(q) ||
        (actor.badgeText || '').toLowerCase().includes(q) ||
        (log.targetId || '').toLowerCase().includes(q) ||
        (log.field || '').toLowerCase().includes(q) ||
        JSON.stringify(log.before || {}).toLowerCase().includes(q) ||
        JSON.stringify(log.after || {}).toLowerCase().includes(q);

      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
      const matchRole = roleFilter === 'all' || log.actorRole === roleFilter;

      return matchSearch && matchModule && matchRole;
    });
  }, [auditLogs, searchQuery, moduleFilter, roleFilter]);

  const formatActionName = (action = '') => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getModuleBadge = (mod = '') => {
    const m = String(mod).toUpperCase();
    if (m === 'MANAJEMEN_PENGGUNA' || m === 'USER_MANAGEMENT') {
      return { label: 'Manajemen Pengguna', cls: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    if (m === 'KATALOG_STOK' || m === 'BARANG') {
      return { label: 'Katalog & Stok', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (m === 'KASIR_POS' || m === 'TRANSAKSI' || m === 'DINE_IN' || m === 'MEJA') {
      return { label: 'Kasir & POS', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { label: mod || 'Umum', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <History className="text-emerald-600" size={28} />
            Riwayat Aktivitas &amp; Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan aktivitas operasional harian dan jejak perubahan data sensitif secara otomatis.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
          Segarkan Data
        </button>
      </div>

      {/* Tab Switcher: Riwayat Aktivitas vs Audit Trail */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Activity size={16} />
          Riwayat Aktivitas (Operasional)
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'activity' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activityLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database size={16} />
          Audit Trail (Perubahan Data &amp; Diff)
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'audit' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={
                activeTab === 'activity'
                  ? 'Cari nama pelaku, aksi, sesi, order...'
                  : 'Cari pelaku, data sebelum/sesudah, target ID...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-emerald-500"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-emerald-500"
            >
              <option value="all">Semua Bagian / Modul</option>
              <option value="MANAJEMEN_PENGGUNA">Manajemen Pengguna</option>
              <option value="KATALOG_STOK">Katalog dan Stok</option>
              <option value="KASIR_POS">Kasir dan POS</option>
              {activeTab === 'activity' && (
                <>
                  <option value="TRANSAKSI">Transaksi Penjualan</option>
                  <option value="MEJA">Modul Meja</option>
                  <option value="DINE_IN">Pesanan Dine In</option>
                  <option value="BARANG">Katalog Barang</option>
                  <option value="USER_MANAGEMENT">Manajemen Pengguna</option>
                </>
              )}
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-emerald-500"
            >
              <option value="all">Semua Peran Pelaku</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="KASIR">Kasir</option>
              {activeTab === 'activity' && <option value="CUSTOMER">Pelanggan (QR Menu)</option>}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RIWAYAT AKTIVITAS (OPERASIONAL HARIAN) */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Pelaku</th>
                  <th className="px-5 py-3.5">Sumber</th>
                  <th className="px-5 py-3.5">Modul &amp; Aktivitas</th>
                  <th className="px-5 py-3.5">Target / Konteks</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Belum ada catatan aktivitas operasional yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredActivityLogs.map((log) => {
                    const actor = formatActorInfo(log);
                    const isCustomer = log.source === 'CUSTOMER_QR' || log.actorRole === 'CUSTOMER';
                    const isExpanded = expandedLogId === log.id;
                    const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-';

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                            {dateStr}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                  {actor.displayName}
                                </span>
                                <span className="text-slate-300 font-medium text-xs">—</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${actor.badgeClass}`}
                                >
                                  {actor.badgeText}
                                </span>
                              </div>
                              {actor.accountEmail && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {actor.accountEmail}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isCustomer ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Smartphone size={12} />
                                HP Pelanggan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                <Laptop size={12} />
                                POS Kasir
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block">
                                {log.module}
                              </span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {formatActionName(log.action)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">
                            {log.sessionId && <span className="block font-mono text-[11px]">Sesi: {log.sessionId}</span>}
                            {log.orderId && <span className="block font-mono text-[11px]">Order: {log.orderId}</span>}
                            {log.targetId && !log.sessionId && !log.orderId && (
                              <span className="block font-mono text-[11px]">ID: {log.targetId}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {log.status === 'SUCCESS' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {log.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                              title="Lihat Rincian Aktivitas"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-3 shadow-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 pb-3">
                                  <div>
                                    <span className="text-slate-400 block text-[11px]">Identitas Akun Login:</span>
                                    <span className="font-semibold text-slate-700 font-mono">
                                      {log.actorEmail || (log.actorUid ? `UID: ${log.actorUid.slice(0, 12)}...` : '-')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[11px]">Petugas yang Bertugas:</span>
                                    <span className="font-bold text-slate-800 text-sm">
                                      {actor.displayName}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[11px]">Peran Sistem (Role):</span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${actor.badgeClass}`}
                                    >
                                      {actor.badgeText}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-slate-500 font-mono text-[11px]">
                                  <span>Log ID: {log.id}</span>
                                  <span>Waktu: {dateStr}</span>
                                  <span>Sumber: {log.source}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-700 mb-1">Keterangan / Rincian Operasional:</p>
                                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-56">
                                    {JSON.stringify(log.details || {}, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUDIT TRAIL (PERUBAHAN DATA PENTING & DIFF SEBELUM / SESUDAH) */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Pelaku Perubahan</th>
                  <th className="px-5 py-3.5">Bagian / Modul</th>
                  <th className="px-5 py-3.5">Tindakan</th>
                  <th className="px-5 py-3.5">Target Data</th>
                  <th className="px-5 py-3.5">Perubahan (Sebelum &rarr; Sesudah)</th>
                  <th className="px-5 py-3.5 text-right">Detail Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      Belum ada data perubahan penting yang tercatat di Audit Trail.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const actor = formatActorInfo(log);
                    const isExpanded = expandedLogId === log.id;
                    const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-';
                    const modBadge = getModuleBadge(log.module);

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                            {dateStr}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                  {actor.displayName}
                                </span>
                                <span className="text-slate-300 font-medium text-xs">—</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${actor.badgeClass}`}
                                >
                                  {actor.badgeText}
                                </span>
                              </div>
                              {actor.accountEmail && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {actor.accountEmail}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10.5px] font-bold border ${modBadge.cls}`}
                            >
                              {modBadge.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                              {formatActionName(log.action)}
                            </span>
                            {log.field && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Field: {log.field}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {log.targetId || '-'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-200 truncate max-w-[120px]">
                                {log.before === null
                                  ? '(Data Baru)'
                                  : typeof log.before === 'object'
                                  ? JSON.stringify(log.before).slice(0, 30) + '...'
                                  : String(log.before)}
                              </span>
                              <ArrowRight size={12} className="text-slate-400 shrink-0" />
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 truncate max-w-[120px]">
                                {log.after === null
                                  ? '(Dihapus)'
                                  : typeof log.after === 'object'
                                  ? JSON.stringify(log.after).slice(0, 30) + '...'
                                  : String(log.after)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                              title="Bandingkan Data Sebelum vs Sesudah"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-4 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div>
                                    <span className="text-slate-400 block text-[11px]">Audit ID:</span>
                                    <span className="font-mono font-bold text-slate-800">{log.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[11px]">Waktu Modifikasi:</span>
                                    <span className="font-semibold text-slate-700">{dateStr}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[11px]">Pelaku Modifikasi:</span>
                                    <span className="font-bold text-slate-800">
                                      {actor.displayName} ({actor.badgeText})
                                    </span>
                                  </div>
                                </div>

                                {/* Before vs After Comparison Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Data Sebelum */}
                                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-rose-800 text-xs flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                                        Data Sebelum Perubahan (Before)
                                      </span>
                                      {log.before === null && (
                                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                                          Entri Baru (Null)
                                        </span>
                                      )}
                                    </div>
                                    <pre className="bg-white border border-rose-100 p-3 rounded-lg text-rose-950 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                                      {log.before !== null
                                        ? JSON.stringify(log.before, null, 2)
                                        : '/* Tidak ada data sebelumnya (Entri dibuat pertama kali) */'}
                                    </pre>
                                  </div>

                                  {/* Data Sesudah */}
                                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-emerald-800 text-xs flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Data Sesudah Perubahan (After)
                                      </span>
                                      {log.after === null && (
                                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                                          Data Dihapus
                                        </span>
                                      )}
                                    </div>
                                    <pre className="bg-white border border-emerald-100 p-3 rounded-lg text-emerald-950 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                                      {log.after !== null
                                        ? JSON.stringify(log.after, null, 2)
                                        : '/* Data telah dihapus dari sistem */'}
                                    </pre>
                                  </div>
                                </div>

                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                                    <span className="font-semibold text-slate-700">Catatan Modifikasi: </span>
                                    {typeof log.details === 'object'
                                      ? JSON.stringify(log.details)
                                      : String(log.details)}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
