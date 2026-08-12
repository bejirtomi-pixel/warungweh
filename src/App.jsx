import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Barang from './pages/Barang';
import Transaksi from './pages/Transaksi';
import Laporan from './pages/Laporan';
import Pengaturan from './pages/Pengaturan';
import ProfilToko from './pages/ProfilToko';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/barang" element={<Barang />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/laporan" element={<Laporan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
          <Route path="/profil-toko" element={<ProfilToko />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </DataProvider>
  );
}
