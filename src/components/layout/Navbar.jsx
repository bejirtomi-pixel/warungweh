import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Shield, UserCheck, RefreshCw, X, AlertCircle, Search, ArrowRight, Package } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function Navbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  const navigate = useNavigate();
  const {
    user,
    role,
    isSuperAdmin,
    isAdmin,
    isKasir,
    cashierOperator,
    currentUserDisplay,
    clearCashierOperator,
  } = useAuth();

  const { products = [], formatRupiah } = useData();

  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Search Modal State untuk Mobile
  const [searchOpen, setSearchOpen] = useState(false); // isMobileSearchOpen toggle
  const [searchQuery, setSearchQuery] = useState('');

  // Peran Badge Config
  const roleBadge = isSuperAdmin
    ? { label: 'SUPER ADMIN', bg: 'bg-purple-100 text-purple-700 border-purple-200' }
    : isAdmin
    ? { label: 'ADMIN', bg: 'bg-blue-100 text-blue-700 border-blue-200' }
    : { label: 'KASIR', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

  const handleConfirmSwitch = async () => {
    setSwitching(true);
    try {
      await clearCashierOperator();
      setConfirmSwitchOpen(false);
    } finally {
      setSwitching(false);
    }
  };

  // Quick Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return products
      .filter((p) => (p.nama || '').toLowerCase().includes(q) || (p.kode || '').toLowerCase().includes(q))
      .slice(0, 5);
  }, [products, searchQuery]);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 sm:px-4 backdrop-blur-md lg:px-6 no-print">
        {/* Left Side: Menu / Sidebar Collapse & Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onOpenMobile}
            className="rounded-xl p-2 text-slate-500 hover:text-slate-800 transition hover:bg-slate-100 lg:hidden cursor-pointer active:scale-95"
            aria-label="Buka menu navigasi"
          >
            <Menu size={20} />
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-xl p-2 text-slate-500 hover:text-slate-800 transition hover:bg-slate-100 lg:inline-flex cursor-pointer"
            aria-label="Persempit sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Logo Wartomson Store pada tampilan mobile/tablet */}
          <div className="flex items-center lg:hidden">
            <Logo size="sm" showText={true} textClassName="font-extrabold text-slate-800 text-sm tracking-tight" />
          </div>

          <div className="hidden md:flex items-center ml-2">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Right Side: Search Icon + User Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Ikon Pencarian Mobile yang Mudah Digunakan */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            aria-label="Cari Produk atau Fitur"
            title="Cari Produk"
          >
            <i className="fa-solid fa-magnifying-glass text-slate-600 text-sm" />
          </button>

          {/* User Card & Petugas Kasir */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1.5 pr-2.5 sm:py-1.5 sm:pl-2 sm:pr-3 bg-white shadow-2xs">
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs font-bold text-white shrink-0 ${
                isSuperAdmin
                  ? 'bg-purple-600'
                  : isAdmin
                  ? 'bg-blue-600'
                  : 'bg-emerald-600'
              }`}
            >
              {currentUserDisplay.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-tight text-slate-800 truncate max-w-[120px]">
                {currentUserDisplay}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
                {isKasir && cashierOperator?.name && (
                  <span className="text-[9.5px] text-slate-400 font-medium">
                    (Shift)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tombol Ganti Petugas untuk Kasir */}
          {isKasir && cashierOperator?.name && (
            <button
              onClick={() => setConfirmSwitchOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-semibold border border-slate-200/80 transition shadow-2xs cursor-pointer"
              title="Selesaikan sesi tugas dan ganti ke petugas kasir berikutnya"
            >
              <RefreshCw size={13} />
              <span>Ganti Petugas</span>
            </button>
          )}
        </div>
      </header>

      {/* MODAL SEARCH POPUP UNTUK SMARTPHONE */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-xs pt-16 sm:pt-20 animate-in fade-in">
          <div
            className="absolute inset-0"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-1 relative">
                <Search size={18} className="text-slate-400 absolute left-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Cari nama produk, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-emerald-500 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Results */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {searchQuery.trim() === '' ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>Ketik kata kunci nama produk untuk mencari cepat.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>Tidak ada produk ditemukan untuk "{searchQuery}".</p>
                </div>
              ) : (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      navigate('/transaksi');
                    }}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{p.nama}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.kategori} • Stok: {p.stok}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-700">{formatRupiah(p.harga)}</p>
                      <span className="text-[9.5px] font-bold text-slate-400">Buka Kasir &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Ganti Petugas Kasir */}
      {confirmSwitchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-4 ring-amber-50/50">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Ganti Petugas Kasir?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sesi tugas atas nama <strong className="text-slate-800">{cashierOperator?.name}</strong> akan ditutup dan dicatat ke Riwayat Aktivitas. Petugas kasir berikutnya akan diminta memasukkan namanya.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSwitchOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={switching}
                onClick={handleConfirmSwitch}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition disabled:opacity-60 cursor-pointer"
              >
                {switching ? 'Menutup Sesi...' : 'Ganti Petugas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
