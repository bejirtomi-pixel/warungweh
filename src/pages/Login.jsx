import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  LogIn,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import { ALLOWED_UID } from '../config/auth';
import Logo from '../components/common/Logo';
import { saveSession, clearSessionKicked } from '../utils/storage';

function firebaseErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan.';
    case 'auth/wrong-password':
      return 'Kata sandi salah. Coba lagi.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet. Coba lagi.';
    default:
      return 'Gagal masuk. Periksa koneksi internet lalu coba lagi.';
  }
}

function buildSession(emailValue) {
  // Nama penjaga diambil dari bagian sebelum "@" pada email
  const nameFromEmail =
    emailValue.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || emailValue;

  return {
    email: emailValue,
    username: emailValue,
    nama: nameFromEmail,
    role: 'Kasir',
    loginAt: new Date().toISOString(),
  };
}

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  // Jika pengguna yang sah sudah terautentikasi (persistensi Firebase),
  // jangan tampilkan halaman login — langsung ke dashboard.
  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, (user) => {
        if (cancelled) return;
        if (user && ALLOWED_UID && user.uid === ALLOWED_UID) {
          navigate('/dashboard', { replace: true });
        }
      });
    } catch {
      // abaikan; jika auth tidak tersedia, tetap tampilkan form login
    }
    return () => {
      cancelled = true;
      unsub();
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Masukkan alamat email yang valid (contoh: nama@email.com).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Ingat Saya = true → persistensi lokal (bertahan setelah browser ditutup).
      // Ingat Saya = false → persistensi sesi (hilang saat tab/browser ditutup).
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

      // Password diverifikasi oleh Firebase Authentication.
      const cred = await signInWithEmailAndPassword(auth, trimmed, password);

      // Hanya satu akun Qurma yang diizinkan masuk.
      const isAllowed = Boolean(ALLOWED_UID) && cred.user.uid === ALLOWED_UID;

      if (!isAllowed) {
        await signOut(auth).catch(() => {});
        setError('Akun ini tidak diizinkan masuk ke Qurmacel POS.');
        setLoading(false);
        return;
      }

      const session = buildSession(cred.user.email || trimmed);
      session.uid = cred.user.uid;

      saveSession(session, remember);
      clearSessionKicked();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(firebaseErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
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

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
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

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-emerald-500"
                />
                Ingat saya
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Masuk
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
            <ShieldCheck size={13} />
            Hanya akun resmi Qurmacel POS yang dapat masuk
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Qurmacel POS · Warung Modern
        </p>
      </div>
    </div>
  );
}