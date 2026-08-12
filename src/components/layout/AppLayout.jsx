import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
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

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-400 no-print">
          © {new Date().getFullYear()} Qurmacel POS — Sistem Kasir Warung Modern
        </footer>
      </div>
    </div>
  );
}
