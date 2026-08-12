import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  BarChart3,
  Settings,
  Store,
  X,
  LogOut,
} from 'lucide-react';
import Logo from '../common/Logo';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/barang', label: 'Barang', icon: Package },
  { to: '/transaksi', label: 'Transaksi', icon: ReceiptText },
  { to: '/laporan', label: 'Laporan', icon: BarChart3 },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

export default function Sidebar({ collapsed, onClose, mobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden no-print"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 no-print',
          collapsed ? 'w-[76px]' : 'w-64',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo section */}
        <div
          className={[
            'flex h-[72px] shrink-0 items-center border-b border-slate-100',
            collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4',
          ].join(' ')}
        >
          {collapsed ? (
            <Logo size="sm" imgClassName="mx-auto" className="justify-center" />
          ) : (
            <Logo size="md" showText textClassName="font-bold text-slate-800 text-lg tracking-tight" />
          )}

          <button
            onClick={onClose}
            className={[
              'rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600',
              collapsed ? 'hidden' : 'lg:hidden',
            ].join(' ')}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                  collapsed ? 'justify-center' : '',
                ].join(' ')
              }
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}

          <NavLink
            to="/profil-toko"
            title="Profil Toko"
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                collapsed ? 'justify-center' : '',
              ].join(' ')
            }
          >
            <Store size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">Profil Toko</span>}
          </NavLink>
        </nav>

        {/* Footer / user */}
        <div
          className={[
            'shrink-0 border-t border-slate-100 p-3',
            collapsed ? 'flex justify-center' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              A
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">Admin</p>
                  <p className="truncate text-xs text-slate-500">Kasir Utama</p>
                </div>
                <button
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Keluar"
                  onClick={() => (window.location.href = '/login')}
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
