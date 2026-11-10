import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Table2,
  BarChart3,
  Settings,
  Store,
  BadgeInfo,
  Users,
  History,
  X,
  LogOut,
  Shield,
} from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { to: '/barang', label: 'Barang', icon: Package, page: 'barang' },
  { to: '/transaksi', label: 'Transaksi', icon: ReceiptText, page: 'transaksi' },
  { to: '/meja', label: 'Meja', icon: Table2, page: 'meja' },
  { to: '/laporan', label: 'Laporan', icon: BarChart3, page: 'laporan' },
  { to: '/informasi-barang', label: 'Informasi Barang', icon: BadgeInfo, page: 'informasi_barang' },
  { to: '/profil-toko', label: 'Profil Toko', icon: Store, page: 'profil_toko' },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings, page: 'pengaturan' },
  { to: '/pengguna', label: 'Pengguna & Izin', icon: Users, page: 'manajemen_pengguna' },
  { to: '/riwayat-aktivitas', label: 'Riwayat Aktivitas', icon: History, page: 'riwayat_aktivitas' },
];

export default function Sidebar({ collapsed, onClose, mobileOpen }) {
  const navigate = useNavigate();
  const { user, userProfile, role, isSuperAdmin, isAdmin, currentUserDisplay, hasPageAccess, logout } = useAuth();

  const nama = currentUserDisplay;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Filter menu berdasarkan hak akses akun aktif
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    return hasPageAccess(item.page);
  });

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
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
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
        </nav>

        {/* Footer / User Profile & Role */}
        <div
          className={[
            'shrink-0 border-t border-slate-100 p-3',
            collapsed ? 'flex justify-center' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100/80">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                isSuperAdmin
                  ? 'bg-purple-600'
                  : role === 'ADMIN'
                  ? 'bg-blue-600'
                  : 'bg-emerald-600'
              }`}
            >
              {nama.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{nama}</p>
                  <p className="truncate text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Shield size={10} className="text-emerald-600" />
                    {isSuperAdmin ? 'SUPER ADMIN' : isAdmin ? 'ADMIN' : 'KASIR'}
                  </p>
                </div>
                <button
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Keluar"
                  onClick={handleLogout}
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
