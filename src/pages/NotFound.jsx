import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Logo from '../components/common/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-4 text-center">
      <Logo size="md" imgClassName="rounded-xl" className="justify-center" />
      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
        <Compass size={30} />
      </div>
      <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-white">404</h1>
      <p className="mt-2 text-sm font-medium text-slate-400">
        Halaman yang Anda cari tidak ditemukan.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
      >
        <ArrowLeft size={16} />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
