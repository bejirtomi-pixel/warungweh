import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Store } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Header({ onOpenMobile }) {
  const { products } = useData();
  const lowStockCount = products.filter((p) => Number(p.stock) <= 10).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6 no-print">
      <button
        onClick={onOpenMobile}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Store size={16} className="text-ink" />
        </div>
        <span className="text-sm font-extrabold text-ink">WarungKu</span>
      </div>

      <div className="hidden flex-1 md:block">
        <p className="text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex-1 md:hidden" />

      <Link
        to="/products"
        title="Notifikasi stok menipis"
        className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
      >
        <Bell size={20} />
        {lowStockCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {lowStockCount}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-extrabold text-ink">
          W
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-bold leading-tight text-ink">WarungKu</p>
          <p className="text-xs leading-tight text-slate-400">Kasir Warung</p>
        </div>
      </div>
    </header>
  );
}
