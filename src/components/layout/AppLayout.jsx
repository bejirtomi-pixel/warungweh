import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import CashierShiftModal from '../common/CashierShiftModal';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col">
      {/* Modal Input Petugas Kasir Mandiri jika Kasir belum memasukkan nama */}
      <CashierShiftModal />

      {/* Sidebar Desktop (Tetap berada di kiri layar pada desktop, hidden di mobile) */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className={[
          'flex min-h-screen flex-col transition-all duration-300',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64',
        ].join(' ')}
      >
        <Navbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* Content area: diberi padding bawah pb-20 pada mobile agar tidak tertutup bottom nav */}
        <main className="flex-1 pb-20 lg:pb-6">
          <Outlet />
        </main>

        <footer className="hidden lg:block border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400 no-print">
          © {new Date().getFullYear()} Wartomson Store — Sistem Manajemen &amp; Kasir Warung Modern
        </footer>

        {/* Bottom Navigation Bar Khusus Mobile Smartphone (HP) */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
