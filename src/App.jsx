import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/Toast';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Barang from './pages/Barang';
import Transaksi from './pages/Transaksi';
import Meja from './pages/Meja';
import Laporan from './pages/Laporan';
import InformasiBarang from './pages/InformasiBarang';
import Pengaturan from './pages/Pengaturan';
import ProfilToko from './pages/ProfilToko';
import ManajemenPengguna from './pages/ManajemenPengguna';
import RiwayatAktivitas from './pages/RiwayatAktivitas';
import QrMenu from './pages/QrMenu';
import NotFound from './pages/NotFound';
import { ShieldAlert } from 'lucide-react';

/**
 * Pelindung Rute Operasional Internal:
 * 1. Memeriksa user login di Firebase Auth
 * 2. Memeriksa status persetujuan (jika pending/suspended -> alihkan ke /pending-approval)
 */
function RequireAuth({ children }) {
  const { user, loading, isActive } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Memverifikasi Hak Akses Sistem...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isActive) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}

/**
 * Pelindung Granular Permission per Halaman
 */
function RequirePage({ page, children }) {
  const { hasPageAccess, isSuperAdmin } = useAuth();

  if (isSuperAdmin || hasPageAccess(page)) {
    return children;
  }

  return (
    <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
      <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <ShieldAlert size={36} />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Akses Halaman Dibatasi</h2>
      <p className="text-xs sm:text-sm text-slate-500">
        Peran Anda saat ini tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi Super Admin untuk memperbarui hak akses Anda.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
      >
        Kembali ke Halaman Sebelumnya
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <Routes>
            {/* Rute Publik (Tanpa Login) */}
            <Route path="/login" element={<Login />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            
            {/* QR Menu Pelanggan (Mendukung token stabil dan ID meja) */}
            <Route path="/menu" element={<QrMenu />} />
            <Route path="/menu/:qrToken" element={<QrMenu />} />
            <Route path="/order/:qrToken" element={<QrMenu />} />

            {/* Rute Internal (Wajib Login & Disetujui Super Admin) */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<RequirePage page="dashboard"><Dashboard /></RequirePage>} />
              <Route path="/barang" element={<RequirePage page="barang"><Barang /></RequirePage>} />
              <Route path="/transaksi" element={<RequirePage page="transaksi"><Transaksi /></RequirePage>} />
              <Route path="/meja" element={<RequirePage page="meja"><Meja /></RequirePage>} />
              <Route path="/laporan" element={<RequirePage page="laporan"><Laporan /></RequirePage>} />
              <Route path="/informasi-barang" element={<RequirePage page="informasi_barang"><InformasiBarang /></RequirePage>} />
              <Route path="/pengaturan" element={<RequirePage page="pengaturan"><Pengaturan /></RequirePage>} />
              <Route path="/profil-toko" element={<RequirePage page="profil_toko"><ProfilToko /></RequirePage>} />
              <Route path="/pengguna" element={<RequirePage page="manajemen_pengguna"><ManajemenPengguna /></RequirePage>} />
              <Route path="/riwayat-aktivitas" element={<RequirePage page="riwayat_aktivitas"><RiwayatAktivitas /></RequirePage>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}
