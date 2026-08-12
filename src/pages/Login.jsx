import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '../components/common/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-4 py-10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo - main identity */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <Logo
            size="lg"
            imgClassName="drop-shadow-[0_8px_24px_rgba(16,185,129,0.35)] rounded-2xl"
            className="justify-center"
          />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Qurmacel <span className="text-emerald-400">POS</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Sistem Kasir Modern untuk Warung & UMKM
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Selamat Datang</h2>
            <p className="mt-1 text-sm text-slate-400">
              Masuk untuk mengelola transaksi dan laporan penjualan Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-300">
                Username
              </label>
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-emerald-500"
                />
                Ingat saya
              </label>
              <button type="button" className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300">
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 active:scale-[0.99]"
            >
              <LogIn size={17} />
              Masuk
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
            <ShieldCheck size={13} />
            Data Anda dienkripsi dan aman di Qurmacel POS
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Qurmacel POS · Warung Modern
        </p>
      </div>
    </div>
  );
}
