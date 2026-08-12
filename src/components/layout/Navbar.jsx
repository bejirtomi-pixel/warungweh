import React from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import Logo from '../common/Logo';

export default function Navbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6 no-print">
      {/* Mobile menu button */}
      <button
        onClick={onOpenMobile}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={onToggleCollapse}
        className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:inline-flex"
        aria-label="Persempit sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Small logo on mobile/tablet (desktop shows logo via sidebar) */}
      <div className="flex items-center lg:hidden">
        <Logo size="sm" />
      </div>

      <div className="hidden md:flex flex-1 items-center">
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Cari di sini..."
          className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 lg:w-64"
        />
      </div>

      {/* Notifications */}
      <button className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
        <Bell size={20} />
        <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500" />
      </button>

      {/* User */}
      <button className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-2.5 transition hover:bg-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
          A
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-slate-800">Admin</p>
          <p className="text-xs leading-tight text-slate-500">Kasir Utama</p>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
    </header>
  );
}
