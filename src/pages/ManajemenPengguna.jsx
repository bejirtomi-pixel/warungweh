import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  Edit3,
  Lock,
  Mail,
  User,
  Sliders,
  Info,
  Calendar,
  Key,
  Ban,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ROLES,
  USER_STATUS,
  PERMISSION_GROUPS,
  DEFAULT_PERMISSIONS,
  fetchAllUsers,
  fetchRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  suspendUser,
  reactivateUser,
  updateUserRoleAndPermissions,
  createUserIsolated,
  isAccountApproved,
  isAccountPending,
  isAccountSuspended,
  isAccountRejected,
} from '../utils/userManagement.js';

export default function ManajemenPengguna() {
  const { user: currentStaff, role: staffRole, isSuperAdmin, isKasir } = useAuth();

  // Tab State: 'all' | 'pending' | 'active' | 'suspended' | 'matrix'
  const [activeTab, setActiveTab] = useState('pending');

  // Data States
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Feedback State
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });
  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 4500);
  };

  // Modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignRole, setAssignRole] = useState(ROLES.KASIR);
  const [assignPermissions, setAssignPermissions] = useState(DEFAULT_PERMISSIONS[ROLES.KASIR]);
  const [isApproving, setIsApproving] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Bukan staf resmi Qurmacel');
  const [isRejecting, setIsRejecting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState(ROLES.KASIR);
  const [editPermissions, setEditPermissions] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('Penonaktifan oleh Administrator');
  const [isSuspending, setIsSuspending] = useState(false);

  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [reactivatingUser, setReactivatingUser] = useState(null);
  const [reactivateRole, setReactivateRole] = useState(ROLES.KASIR);
  const [reactivatePermissions, setReactivatePermissions] = useState(DEFAULT_PERMISSIONS[ROLES.KASIR]);
  const [isReactivating, setIsReactivating] = useState(false);

  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState(ROLES.KASIR);
  const [newStatus, setNewStatus] = useState('approved');
  const [newPermissions, setNewPermissions] = useState(DEFAULT_PERMISSIONS[ROLES.KASIR]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load All Data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [allU, allR] = await Promise.all([fetchAllUsers(), fetchRegistrationRequests()]);
      setUsers(allU);
      setRequests(allR);
    } catch {
      showFeedback('Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Kasir DILARANG mengakses halaman Manajemen Pengguna
  if (staffRole === ROLES.KASIR || isKasir) {
    return (
      <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-red-200 text-center space-y-4 shadow-sm">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas untuk Kasir</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Kasir tidak memiliki izin untuk mengakses halaman Manajemen Pengguna dan daftar akun staf.
        </p>
      </div>
    );
  }

  // Filtered Users Collections
  const activeUsers = useMemo(() => {
    return users.filter((u) => isAccountApproved(u.status));
  }, [users]);

  const suspendedUsers = useMemo(() => {
    return users.filter((u) => isAccountSuspended(u.status) || isAccountRejected(u.status));
  }, [users]);

  const pendingUsersCount = requests.length;

  // Toggle permission helper
  const togglePermission = (list, setList, key) => {
    if (list.includes('*')) {
      const allKeys = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key)).filter((k) => k !== key);
      setList(allKeys);
      return;
    }
    if (list.includes(key)) {
      setList(list.filter((k) => k !== key));
    } else {
      setList([...list, key]);
    }
  };

  // Helper change roles
  const handleRoleChangeForNew = (r) => {
    setNewRole(r);
    setNewPermissions(DEFAULT_PERMISSIONS[r] || []);
  };

  const handleRoleChangeForEdit = (r) => {
    setEditRole(r);
    setEditPermissions(DEFAULT_PERMISSIONS[r] || []);
  };

  const handleRoleChangeForApprove = (r) => {
    setAssignRole(r);
    setAssignPermissions(DEFAULT_PERMISSIONS[r] || []);
  };

  const handleRoleChangeForReactivate = (r) => {
    setReactivateRole(r);
    setReactivatePermissions(DEFAULT_PERMISSIONS[r] || []);
  };

  // Action Handlers
  const handleOpenDetail = (userOrReq) => {
    setSelectedUserDetail(userOrReq);
    setDetailModalOpen(true);
  };

  const handleOpenApproveFromDetail = () => {
    if (!selectedUserDetail) return;
    const req = selectedUserDetail;
    setDetailModalOpen(false);
    setSelectedRequest(req);
    setAssignRole(ROLES.KASIR);
    setAssignPermissions(DEFAULT_PERMISSIONS[ROLES.KASIR]);
    setApproveModalOpen(true);
  };

  const handleOpenRejectFromDetail = () => {
    if (!selectedUserDetail) return;
    const req = selectedUserDetail;
    setDetailModalOpen(false);
    setSelectedRequest(req);
    setRejectReason('Bukan staf resmi Qurmacel');
    setRejectModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      await approveRegistrationRequest(selectedRequest.id, selectedRequest.uid, {
        role: assignRole,
        permissions: assignRole === ROLES.SUPER_ADMIN ? ['*'] : assignPermissions,
        approverRole: staffRole,
        approverUid: currentStaff?.uid || 'STAFF',
        approverName: currentStaff?.displayName || 'Administrator',
      });
      showFeedback(`Akun ${selectedRequest.email} berhasil disetujui sebagai ${assignRole}!`);
      setApproveModalOpen(false);
      setSelectedRequest(null);
      loadAllData();
    } catch (err) {
      showFeedback(err.message || 'Gagal menyetujui akun', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    setIsRejecting(true);
    try {
      await rejectRegistrationRequest(selectedRequest.id, selectedRequest.uid, {
        reason: rejectReason,
        approverRole: staffRole,
        approverUid: currentStaff?.uid || 'STAFF',
        approverName: currentStaff?.displayName || 'Administrator',
      });
      showFeedback(`Pendaftaran ${selectedRequest.email} berhasil ditolak`);
      setRejectModalOpen(false);
      setSelectedRequest(null);
      loadAllData();
    } catch (err) {
      showFeedback(err.message || 'Gagal menolak akun', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenEdit = (user) => {
    if (user.role === ROLES.SUPER_ADMIN && !isSuperAdmin) {
      showFeedback('Admin tidak memiliki izin untuk mengubah akun Super Admin', 'error');
      return;
    }
    setEditingUser(user);
    setEditRole(user.role === 'belum_ditentukan' ? ROLES.KASIR : (user.role || ROLES.KASIR));
    setEditPermissions(user.permissions || DEFAULT_PERMISSIONS[user.role || ROLES.KASIR] || []);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    try {
      await updateUserRoleAndPermissions(editingUser.uid, {
        role: editRole,
        permissions: editRole === ROLES.SUPER_ADMIN ? ['*'] : editPermissions,
        updaterRole: staffRole,
        updaterUid: currentStaff?.uid || 'STAFF',
        updaterName: currentStaff?.displayName || 'Administrator',
      });
      showFeedback(`Hak akses untuk ${editingUser.displayName || editingUser.email} berhasil diperbarui!`);
      setEditModalOpen(false);
      loadAllData();
    } catch (err) {
      showFeedback(err.message || 'Gagal memperbarui hak akses pengguna', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenSuspend = (user) => {
    if (user.role === ROLES.SUPER_ADMIN && !isSuperAdmin) {
      showFeedback('Admin tidak memiliki izin untuk menangguhkan akun Super Admin', 'error');
      return;
    }
    setSuspendingUser(user);
    setSuspendReason('Penonaktifan sementara oleh Administrator');
    setSuspendModalOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingUser) return;
    setIsSuspending(true);
    try {
      await suspendUser(suspendingUser.uid, {
        reason: suspendReason,
        updaterRole: staffRole,
        updaterUid: currentStaff?.uid || 'STAFF',
        updaterName: currentStaff?.displayName || 'Administrator',
      });
      showFeedback(`Akun ${suspendingUser.displayName || suspendingUser.email} telah dinonaktifkan.`);
      setSuspendModalOpen(false);
      setSuspendingUser(null);
      loadAllData();
    } catch (err) {
      showFeedback(err.message || 'Gagal menonaktifkan akun', 'error');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleOpenReactivate = (user) => {
    if (user.role === ROLES.SUPER_ADMIN && !isSuperAdmin) {
      showFeedback('Admin tidak memiliki izin untuk mengaktifkan akun Super Admin', 'error');
      return;
    }
    setReactivatingUser(user);
    const r = user.role === 'belum_ditentukan' ? ROLES.KASIR : (user.role || ROLES.KASIR);
    setReactivateRole(r);
    setReactivatePermissions(user.permissions?.length ? user.permissions : DEFAULT_PERMISSIONS[r]);
    setReactivateModalOpen(true);
  };

  const handleConfirmReactivate = async () => {
    if (!reactivatingUser) return;
    setIsReactivating(true);
    try {
      await reactivateUser(reactivatingUser.uid, {
        role: reactivateRole,
        permissions: reactivateRole === ROLES.SUPER_ADMIN ? ['*'] : reactivatePermissions,
        updaterRole: staffRole,
        updaterUid: currentStaff?.uid || 'STAFF',
        updaterName: currentStaff?.displayName || 'Administrator',
      });
      showFeedback(`Akun ${reactivatingUser.displayName || reactivatingUser.email} berhasil diaktifkan kembali!`);
      setReactivateModalOpen(false);
      setReactivatingUser(null);
      loadAllData();
    } catch (err) {
      showFeedback(err.message || 'Gagal mengaktifkan kembali akun', 'error');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      showFeedback('Email dan Password wajib diisi', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showFeedback('Password minimal 6 karakter', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await createUserIsolated({
        email: newEmail.trim(),
        password: newPassword,
        displayName: newName.trim(),
        role: newRole,
        status: newStatus,
        permissions: newRole === ROLES.SUPER_ADMIN ? ['*'] : newPermissions,
        creatorRole: staffRole,
        creatorUid: currentStaff?.uid || 'STAFF',
        creatorName: currentStaff?.displayName || 'Administrator',
      });

      showFeedback(`Pengguna baru (${newEmail}) berhasil dibuat dengan status ${newStatus === 'approved' ? 'Disetujui' : 'Menunggu Persetujuan'}!`);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole(ROLES.KASIR);
      setNewStatus('approved');
      setNewPermissions(DEFAULT_PERMISSIONS[ROLES.KASIR]);
      setAddUserModalOpen(false);
      if (newStatus === 'approved') {
        setActiveTab('active');
      } else {
        setActiveTab('pending');
      }
      loadAllData();
    } catch (err) {
      showFeedback(err.message || 'Gagal membuat pengguna baru', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Helper search filter
  const applyFilter = (list) => {
    return list.filter((u) => {
      const matchSearch =
        (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-600" size={28} />
            Manajemen Pengguna & Verifikasi Akun
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verifikasi pendaftaran mandiri, pembagian peran Super Admin & Admin, penetapan hak akses granular.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddUserModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition"
          >
            <UserPlus size={16} />
            + Tambah Pengguna
          </button>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Segarkan Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.show && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4 TAB UTAMA PERSYARATAN SISTEM */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          Semua Pengguna ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition relative ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock size={16} />
          Menunggu Persetujuan
          {pendingUsersCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${activeTab === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white animate-pulse'}`}>
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck size={16} />
          Pengguna Aktif ({activeUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('suspended')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'suspended'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX size={16} />
          Ditangguhkan ({suspendedUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ml-auto ${
            activeTab === 'matrix'
              ? 'bg-slate-200 text-slate-800'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Sliders size={15} />
          Matriks Izin Default
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB: MENUNGGU PERSETUJUAN (VERIFIKASI PENDAFTARAN)       */}
      {/* ======================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <p className="font-bold">Antrean Verifikasi Pendaftaran Pengguna Baru</p>
              <p className="mt-0.5 text-amber-800">
                Setiap pendaftaran mandiri melalui formulir email maupun akun Google akan otomatis ditahan di sini. Pengguna tidak memiliki akses apapun ke data transaksi dan toko sebelum Super Admin menentukan role dan granular permission.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {requests.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-800 text-base">Tidak Ada Pendaftaran Menunggu Persetujuan</p>
                <p className="text-xs text-slate-400">
                  Semua permohonan pendaftaran mandiri telah diproses atau belum ada pendaftaran baru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Nama Pengguna</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Metode Pendaftaran</th>
                      <th className="px-5 py-3.5">Tanggal Pendaftaran</th>
                      <th className="px-5 py-3.5">Status Verifikasi</th>
                      <th className="px-5 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                              {(req.displayName || req.email || 'P').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">
                              {req.displayName || 'Pengguna Baru'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs sm:text-sm font-medium text-slate-600">
                          {req.email}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {req.method?.toLowerCase() === 'google' ? 'Google Sign-In' : 'Email & Password'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={12} className="text-amber-600 animate-pulse" />
                            Menunggu Persetujuan
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(req)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition inline-flex items-center gap-1"
                              title="Lihat Detail Pendaftaran"
                            >
                              <Info size={13} />
                              Lihat Detail
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setAssignRole(ROLES.KASIR);
                                setAssignPermissions(DEFAULT_PERMISSIONS[ROLES.KASIR]);
                                setApproveModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-500 transition inline-flex items-center gap-1"
                              title="Setujui dan beri hak akses"
                            >
                              <Check size={14} />
                              Setujui
                            </button>

                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setRejectReason('Bukan staf resmi Qurmacel');
                                setRejectModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition inline-flex items-center gap-1"
                              title="Tolak pendaftaran"
                            >
                              <X size={14} />
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: SEMUA PENGGUNA                                      */}
      {/* ======================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-emerald-500"
              >
                <option value="all">Semua Peran</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.KASIR}>Kasir</option>
                <option value="belum_ditentukan">Belum Ditentukan</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Pengguna</th>
                    <th className="px-5 py-3.5">Peran</th>
                    <th className="px-5 py-3.5">Status Akun</th>
                    <th className="px-5 py-3.5">Granular Permission</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applyFilter(users).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        Tidak ada data pengguna yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    applyFilter(users).map((u) => {
                      const isSuper = u.role === ROLES.SUPER_ADMIN;
                      const isAdminRole = u.role === ROLES.ADMIN;
                      const isKasirRole = u.role === ROLES.KASIR;
                      const isCurrentUser = u.uid === currentStaff?.uid;
                      const permCount = (u.permissions || []).includes('*')
                        ? 'Semua Fitur (*)'
                        : `${(u.permissions || []).length} Izin`;

                      return (
                        <tr key={u.uid || u.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSuper
                                    ? 'bg-purple-600 text-white'
                                    : isAdminRole
                                    ? 'bg-blue-600 text-white'
                                    : isKasirRole
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                  {u.displayName || 'Tanpa Nama'}
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                                      Anda
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isSuper
                                  ? 'bg-purple-100 text-purple-700'
                                  : isAdminRole
                                  ? 'bg-blue-100 text-blue-700'
                                  : isKasirRole
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <Shield size={12} />
                              {isSuper ? 'SUPER ADMIN' : isAdminRole ? 'ADMIN' : isKasirRole ? 'KASIR' : 'Belum Ditentukan'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isAccountApproved(u.status)
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isAccountPending(u.status)
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isAccountRejected(u.status)
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : isAccountSuspended(u.status)
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isAccountApproved(u.status)
                                ? 'Disetujui'
                                : isAccountPending(u.status)
                                ? 'Menunggu'
                                : isAccountRejected(u.status)
                                ? 'Ditolak'
                                : isAccountSuspended(u.status)
                                ? 'Ditangguhkan'
                                : 'Belum Ditentukan'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {permCount}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isSuper && !isSuperAdmin ? (
                              <span className="text-[11px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                                Khusus Super Admin
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenDetail(u)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold"
                                  title="Detail Pengguna"
                                >
                                  Detail
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs transition inline-flex items-center gap-1"
                                >
                                  <Edit3 size={13} />
                                  Edit Izin
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PENGGUNA AKTIF                                      */}
      {/* ======================================================== */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Nama & Akun</th>
                    <th className="px-5 py-3.5">Peran</th>
                    <th className="px-5 py-3.5">Tanggal Aktif / Disetujui</th>
                    <th className="px-5 py-3.5">Cakupan Izin</th>
                    <th className="px-5 py-3.5 text-right">Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applyFilter(activeUsers).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        Tidak ada pengguna aktif yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    applyFilter(activeUsers).map((u) => {
                      const isSuper = u.role === ROLES.SUPER_ADMIN;
                      const isAdminRole = u.role === ROLES.ADMIN;
                      const isKasirRole = u.role === ROLES.KASIR;
                      const isCurrentUser = u.uid === currentStaff?.uid;
                      const permCount = (u.permissions || []).includes('*')
                        ? 'Full System Access (*)'
                        : `${(u.permissions || []).length} Fitur Terpilih`;

                      return (
                        <tr key={u.uid || u.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSuper ? 'bg-purple-600 text-white' : isAdminRole ? 'bg-blue-600 text-white' : isKasirRole ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                                }`}
                              >
                                {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                  {u.displayName || 'Tanpa Nama'}
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                                      Anda
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isSuper
                                  ? 'bg-purple-100 text-purple-700'
                                  : isAdminRole
                                  ? 'bg-blue-100 text-blue-700'
                                  : isKasirRole
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <Shield size={12} />
                              {isSuper ? 'SUPER ADMIN' : isAdminRole ? 'ADMIN' : isKasirRole ? 'KASIR' : 'Belum Ditentukan'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">
                            {u.approvedAt ? new Date(u.approvedAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {permCount}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isSuper && !isSuperAdmin ? (
                              <span className="text-[11px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                                Khusus Super Admin
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-xs transition inline-flex items-center gap-1"
                                >
                                  <Edit3 size={13} />
                                  Edit Izin
                                </button>

                                {!isCurrentUser && (
                                  <button
                                    onClick={() => handleOpenSuspend(u)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs transition inline-flex items-center gap-1"
                                    title="Tangguhkan Akun"
                                  >
                                    <Ban size={13} />
                                    Tangguhkan
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: DITANGGUHKAN / DITOLAK                              */}
      {/* ======================================================== */}
      {activeTab === 'suspended' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {suspendedUsers.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-800">Tidak ada akun yang ditangguhkan atau ditolak</p>
                <p className="text-xs text-slate-400">Seluruh akun yang terdaftar berada dalam status aktif atau pending.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Pengguna</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Alasan Penolakan / Penangguhan</th>
                      <th className="px-5 py-3.5">Waktu Update</th>
                      <th className="px-5 py-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suspendedUsers.map((u) => {
                      const reason = u.rejectionReason || u.suspensionReason || 'Tidak ada catatan alasan';
                      const isRejected = u.status === USER_STATUS.REJECTED;

                      return (
                        <tr key={u.uid} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                                {(u.displayName || u.email || 'X').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm">{u.displayName || 'Pengguna'}</p>
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isRejected
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isRejected ? 'Ditolak' : 'Ditangguhkan'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                            {reason}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-400">
                            {u.rejectedAt || u.suspendedAt || u.updatedAt
                              ? new Date(u.rejectedAt || u.suspendedAt || u.updatedAt).toLocaleDateString('id-ID')
                              : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleOpenReactivate(u)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-500 transition inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={13} />
                              Aktifkan Kembali
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: MATRIKS IZIN DEFAULT                                */}
      {/* ======================================================== */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Sliders className="text-emerald-600" size={22} />
              Matriks Standar Granular Permission QurmacelPOS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pemetaan izin default antara Super Admin (Akses Penuh), Admin (Operasional & Manajemen), dan Kasir (Operasional Transaksi POS & Meja).
            </p>
          </div>

          <div className="space-y-6">
            {PERMISSION_GROUPS.map((grp) => (
              <div key={grp.group} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{grp.group}</h3>
                <div className="divide-y divide-slate-200/60">
                  {grp.permissions.map((p) => {
                    const inKasir = (DEFAULT_PERMISSIONS[ROLES.KASIR] || []).includes(p.key);
                    const inAdmin = (DEFAULT_PERMISSIONS[ROLES.ADMIN] || []).includes(p.key);
                    return (
                      <div key={p.key} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <p className="font-semibold text-slate-800">{p.label}</p>
                          <p className="text-[11px] text-slate-400">{p.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${inKasir ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/60 text-slate-400'}`}>
                            Kasir: {inKasir ? 'Ya' : 'Tidak'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${inAdmin ? 'bg-blue-100 text-blue-800' : 'bg-slate-200/60 text-slate-400'}`}>
                            Admin: {inAdmin ? 'Ya' : 'Tidak'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-purple-100 text-purple-800">
                            Super: Full
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: LIHAT DETAIL PENDAFTARAN / PENGGUNA             */}
      {/* ======================================================== */}
      {detailModalOpen && selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Info size={18} className="text-emerald-600" />
                Rincian Detail Akun
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">UID Firebase:</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedUserDetail.uid || selectedUserDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Lengkap:</span>
                  <span className="font-bold text-slate-800">{selectedUserDetail.displayName || 'Tanpa Nama'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium text-slate-700">{selectedUserDetail.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode Pendaftaran:</span>
                  <span className="font-bold text-slate-800">
                    {selectedUserDetail.method || (selectedUserDetail.source?.includes('google') ? 'Google' : 'Email/Password')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Pengajuan:</span>
                  <span className="text-slate-700">
                    {selectedUserDetail.requestedAt || selectedUserDetail.createdAt
                      ? new Date(selectedUserDetail.requestedAt || selectedUserDetail.createdAt).toLocaleString('id-ID')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Status Saat Ini:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                    {selectedUserDetail.status || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Tutup
              </button>
              {selectedUserDetail.status === USER_STATUS.PENDING && (
                <>
                  <button
                    onClick={handleOpenRejectFromDetail}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={handleOpenApproveFromDetail}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-sm"
                  >
                    Setujui Akun
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SETUJUI PENDAFTARAN & TENTUKAN PERMISSION        */}
      {/* ======================================================== */}
      {approveModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col shadow-2xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Persetujuan Akun & Hak Akses</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan peran dan hak akses untuk <span className="font-bold text-slate-700">{selectedRequest.displayName || selectedRequest.email}</span>
                </p>
              </div>
              <button onClick={() => setApproveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Pilih Peran (Role)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { r: ROLES.KASIR, label: 'Kasir', desc: 'Akses transaksi POS, meja, dan cetak struk' },
                    { r: ROLES.ADMIN, label: 'Admin', desc: 'Akses barang, laporan, meja, transaksi' },
                    ...(isSuperAdmin ? [{ r: ROLES.SUPER_ADMIN, label: 'Super Admin', desc: 'Akses penuh ke seluruh sistem toko' }] : []),
                  ].map(({ r, label, desc }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChangeForApprove(r)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        assignRole === r
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-slate-800 text-xs sm:text-sm">{label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permission Checklist */}
              {assignRole !== ROLES.SUPER_ADMIN && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Konfigurasi Granular Permission
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      {assignPermissions.length} Izin Dipilih
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1 border border-slate-100 p-3 rounded-2xl bg-slate-50">
                    {PERMISSION_GROUPS.map((grp) => (
                      <div key={grp.group} className="space-y-1.5">
                        <p className="text-[11px] font-black text-slate-500 uppercase">{grp.group}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {grp.permissions.map((p) => {
                            const checked = assignPermissions.includes(p.key) || assignPermissions.includes('*');
                            return (
                              <label
                                key={p.key}
                                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs cursor-pointer hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(assignPermissions, setAssignPermissions, p.key)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-semibold text-slate-700">{p.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={isApproving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-60 flex items-center gap-1.5"
              >
                {isApproving ? 'Memproses Persetujuan...' : 'Setujui & Aktifkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TOLAK PENDAFTARAN                               */}
      {/* ======================================================== */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="font-bold text-red-600 text-base flex items-center gap-2">
                <AlertTriangle size={18} />
                Tolak Pendaftaran Akun
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pengguna <span className="font-semibold text-slate-700">{selectedRequest.displayName || selectedRequest.email}</span> tidak akan dapat mengakses aplikasi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Alasan Penolakan</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-red-500"
                placeholder="Contoh: Bukan staf resmi Qurmacel"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Bukan staf resmi', 'Data tidak sesuai', 'Pendaftaran ganda'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setRejectReason(sug)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md shadow-red-600/30 hover:bg-red-500 disabled:opacity-60"
              >
                {isRejecting ? 'Memproses Penolakan...' : 'Konfirmasi Tolak Pendaftaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: EDIT HAK AKSES PENGGUNA                         */}
      {/* ======================================================== */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Edit Peran & Granular Permission</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingUser.displayName || editingUser.email} ({editingUser.email})
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Pilih Peran Utama</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[ROLES.KASIR, ROLES.ADMIN, ...(isSuperAdmin ? [ROLES.SUPER_ADMIN] : [])].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChangeForEdit(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        editRole === r
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {editRole !== ROLES.SUPER_ADMIN && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 uppercase">Izin Akses Granular</p>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      {editPermissions.length} Izin
                    </span>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-64 overflow-y-auto">
                    {PERMISSION_GROUPS.map((grp) => (
                      <div key={grp.group} className="space-y-1.5">
                        <p className="text-[11px] font-black text-slate-500 uppercase">{grp.group}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {grp.permissions.map((p) => {
                            const checked = editPermissions.includes(p.key) || editPermissions.includes('*');
                            return (
                              <label
                                key={p.key}
                                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs cursor-pointer hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(editPermissions, setEditPermissions, p.key)}
                                  className="rounded text-emerald-600"
                                />
                                <span className="font-semibold text-slate-700">{p.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-60 flex items-center gap-1.5"
              >
                {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: TANGGUHKAN AKUN                                 */}
      {/* ======================================================== */}
      {suspendModalOpen && suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="font-bold text-rose-600 text-base flex items-center gap-2">
                <ShieldAlert size={18} />
                Tangguhkan Akun Pengguna
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Akun <span className="font-semibold text-slate-700">{suspendingUser.displayName || suspendingUser.email}</span> akan dinonaktifkan sementara dan dipindahkan ke tab Ditangguhkan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Alasan Penangguhan</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-rose-500"
                placeholder="Contoh: Cuti atau penonaktifan sementara"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={isSuspending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60"
              >
                {isSuspending ? 'Memproses...' : 'Tangguhkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: AKTIFKAN KEMBALI AKUN                           */}
      {/* ======================================================== */}
      {reactivateModalOpen && reactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="font-bold text-emerald-600 text-base flex items-center gap-2">
                <CheckCircle2 size={18} />
                Aktifkan Kembali Akun
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pulihkan status akun <span className="font-semibold text-slate-700">{reactivatingUser.displayName || reactivatingUser.email}</span> menjadi aktif.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tetapkan Peran</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[ROLES.KASIR, ROLES.ADMIN, ...(isSuperAdmin ? [ROLES.SUPER_ADMIN] : [])].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChangeForReactivate(r)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      reactivateRole === r
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReactivateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReactivate}
                disabled={isReactivating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-60"
              >
                {isReactivating ? 'Memproses...' : 'Pulihkan & Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: TAMBAH PENGGUNA TERISOLASI (SUPER ADMIN)        */}
      {/* ======================================================== */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <UserPlus className="text-emerald-600" size={18} />
                  Tambah Akun Pengguna Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akun dibuat secara aman tanpa memutus sesi Super Admin Anda.
                </p>
              </div>
              <button onClick={() => setAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@qurmacel.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password Sementara</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Pilih Peran</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[ROLES.KASIR, ROLES.ADMIN, ...(isSuperAdmin ? [ROLES.SUPER_ADMIN] : [])].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChangeForNew(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        newRole === r
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Status Akun Awal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('approved')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      newStatus === 'approved'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    Langsung Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('pending')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      newStatus === 'pending'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock size={14} />
                    Menunggu Persetujuan
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isCreating ? 'Membuat Akun...' : 'Buat Akun Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
