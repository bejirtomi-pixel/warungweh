import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/Toast';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { ALLOWED_UID } from './config/auth';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Barang from './pages/Barang';
import Transaksi from './pages/Transaksi';
import Laporan from './pages/Laporan';
import InformasiBarang from './pages/InformasiBarang';
import Pengaturan from './pages/Pengaturan';
import ProfilToko from './pages/ProfilToko';
import NotFound from './pages/NotFound';

// Gerbang autentikasi berbasis Firebase Auth.
// Hanya pengguna yang login ANDA memiliki UID akun Qurma yang diizinkan masuk.
function RequireAuth({ children }) {
  const [state, setState] = React.useState({
    ready: false,
    allowed: false,
  });

  React.useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    try {
      unsub = onAuthStateChanged(auth, (user) => {
        if (cancelled) return;

        if (!user) {
          setState({
            ready: true,
            allowed: false,
          });
          return;
        }

        // Semua user yang berhasil login melalui Firebase diperbolehkan masuk.
        setState({
          ready: true,
          allowed: true,
        });
      });
    } catch {
      setState({
        ready: true,
        allowed: false,
      });
    }

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Tunggu status autentikasi Firebase selesai.
  if (!state.ready) return null;

  if (!state.allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/barang" element={<Barang />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="/informasi-barang" element={<InformasiBarang />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="/profil-toko" element={<ProfilToko />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </DataProvider>
  );
}