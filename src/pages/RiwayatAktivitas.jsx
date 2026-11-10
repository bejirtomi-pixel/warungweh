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
} from 'lucide-react';
import { fetchActivityLogs, formatActorInfo } from '../utils/activityLogger.js';

export default function RiwayatAktivitas() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs(200);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Filter logs dengan pencarian nama pelaku, aksi, modul, ID
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
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
  }, [logs, searchQuery, moduleFilter, roleFilter]);

  const formatActionName = (action = '') => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <History className="text-emerald-600" size={28} />
            Riwayat Aktivitas & Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit trail permanen atas setiap aksi Super Admin, Admin, nama petugas Kasir yang bertugas, dan pesanan pelanggan.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
          Segarkan Log
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama pelaku, aksi, sesi, order..."
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
              <option value="all">Semua Modul</option>
              <option value="TRANSAKSI">Kasir & POS</option>
              <option value="MEJA">Modul Meja</option>
              <option value="DINE_IN">Pesanan Dine In</option>
              <option value="BARANG">Katalog & Stok</option>
              <option value="USER_MANAGEMENT">Manajemen Pengguna</option>
              <option value="SETTINGS">Pengaturan</option>
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
              <option value="CUSTOMER">Pelanggan (QR Menu)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Waktu</th>
                <th className="px-5 py-3.5">Pelaku</th>
                <th className="px-5 py-3.5">Sumber</th>
                <th className="px-5 py-3.5">Modul & Aksi</th>
                <th className="px-5 py-3.5">Target / Konteks</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Belum ada catatan aktivitas yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
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
                            title="Lihat Rincian Perubahan"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Detail Expand Row */}
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
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${actor.badgeClass}`}>
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
                                <p className="font-semibold text-slate-700 mb-1">Rincian Data Perubahan (Audit Trail):</p>
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
    </div>
  );
}
