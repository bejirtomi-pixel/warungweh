import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400 no-print">
          © {new Date().getFullYear()} WarungKu — Aplikasi Kasir Warung
        </footer>
      </div>
    </div>
  );
}
