import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

/**
 * MobileBottomNav - Bottom Navigation Bar Modern Khusus Smartphone
 * Disesuaikan secara otomatis berdasarkan Role pengguna:
 * - Admin (Super Admin / Admin)
 * - Karyawan (Kasir)
 * Menggunakan ikon Font Awesome dan efek highlight aktif yang halus.
 */
export default function MobileBottomNav({ onOpenCart }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isKasir, cashierOperator, currentUserDisplay } = useAuth();
  const { orders = [] } = useData();

  const currentPath = location.pathname;

  // Hitung antrean pesanan aktif untuk badge Pesanan
  const pendingOrdersCount = orders.filter(
    (o) => o.orderStatus === 'pending' || o.fulfillmentStatus === 'preparing'
  ).length;

  // Konfigurasi Menu Bottom Nav Berdasarkan Role
  let navItems = [];

  if (isSuperAdmin || isAdmin) {
    // 1. Role ADMIN
    navItems = [
      {
        to: '/dashboard',
        label: 'Home',
        icon: 'fa-solid fa-house',
        match: currentPath === '/dashboard' || currentPath === '/',
      },
      {
        to: '/barang',
        label: 'Kategori',
        icon: 'fa-solid fa-shapes',
        match: currentPath === '/barang' || currentPath === '/informasi-barang',
      },
      {
        to: '/transaksi',
        label: 'Keranjang',
        icon: 'fa-solid fa-cart-shopping',
        match: currentPath === '/transaksi',
      },
      {
        to: '/riwayat-aktivitas',
        label: 'Pesanan',
        icon: 'fa-solid fa-receipt',
        badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
        match: currentPath === '/riwayat-aktivitas' || currentPath === '/laporan',
      },
      {
        to: '/pengguna',
        label: 'Profil',
        icon: 'fa-solid fa-user',
        match: currentPath === '/pengguna' || currentPath === '/profil-toko' || currentPath === '/pengaturan',
      },
    ];
  } else {
    // 2. Role KARYAWAN (KASIR)
    navItems = [
      {
        to: '/transaksi',
        label: 'Home',
        icon: 'fa-solid fa-house',
        match: currentPath === '/transaksi' || currentPath === '/',
      },
      {
        to: '/meja',
        label: 'Kategori',
        icon: 'fa-solid fa-shapes',
        match: currentPath === '/meja',
      },
      {
        to: '/transaksi',
        label: 'Keranjang',
        icon: 'fa-solid fa-cart-shopping',
        action: () => {
          if (location.pathname !== '/transaksi') {
            navigate('/transaksi');
          }
          setTimeout(() => {
            const cartEl = document.getElementById('pos-cart-container');
            if (cartEl) cartEl.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          if (onOpenCart) onOpenCart();
        },
        match: currentPath === '/transaksi',
      },
      {
        to: '/riwayat-aktivitas',
        label: 'Pesanan',
        icon: 'fa-solid fa-receipt',
        badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
        match: currentPath === '/riwayat-aktivitas',
      },
      {
        to: '/profil-toko',
        label: 'Profil',
        icon: 'fa-solid fa-user',
        match: currentPath === '/profil-toko',
      },
    ];
  }

  return (
    <nav
      aria-label="Navigasi Mobile Bawah"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden no-print transition-all duration-300"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1">
        {navItems.map((item, idx) => {
          const isActive = item.match;

          if (item.action) {
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 active:scale-90 group relative cursor-pointer"
              >
                <div
                  className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                >
                  <i className={`${item.icon} text-base transition-transform group-active:scale-110`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold mt-0.5 tracking-tight transition-colors ${
                    isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={idx}
              to={item.to}
              className="flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 active:scale-90 group relative"
            >
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 font-bold shadow-2xs'
                    : 'text-slate-500 group-hover:text-slate-800'
                }`}
              >
                <i className={`${item.icon} text-base transition-transform group-active:scale-110`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-bold mt-0.5 tracking-tight transition-colors ${
                  isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-emerald-600" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
