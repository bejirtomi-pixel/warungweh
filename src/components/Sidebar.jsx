import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  BarChart3,
  Settings,
  Store,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Barang', icon: Package, end: false },
  { to: '/transaction', label: 'Transaksi', icon: ShoppingCart, end: false },
  { to: '/history', label: 'Riwayat', icon: History, end: false },
  { to: '/reports', label: 'Laporan', icon: BarChart3, end: false },
  { to: '/settings', label: 'Pengaturan', icon: Settings, end: false },
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden no-print"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white lg:translate-x-0 no-print"
        aria-hidden={!mobileOpen}
      >
        {/* Logo */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Store size={20} className="text-ink" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight tracking-tight text-ink">WarungKu</p>
              <p className="text-[11px] font-medium text-slate-400">Kasir Warung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-darker shadow-sm'
                    : 'text-slate-500 hover:bg-primary-light hover:text-primary-darker',
                ].join(' ')
              }
            >
              <Icon size={20} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-ink">
              W
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">WarungKu</p>
              <p className="truncate text-xs text-slate-400">Kasir Warung</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
