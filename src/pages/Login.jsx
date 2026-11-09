import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import { googleProvider } from '../config/auth';
import Logo from '../components/common/Logo';
import GoogleIcon from '../components/common/GoogleIcon';
import { saveSession, clearSessionKicked } from '../utils/storage';

function firebaseErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid. Periksa penulisan email Anda.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini belum terdaftar di sistem.';
    case 'auth/wrong-password':
      return 'Password salah. Periksa kembali password Anda.';
    case 'auth/invalid-credential':
      return 'Email atau password yang Anda masukkan salah.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    case 'auth/operation-not-allowed':
      return 'Metode login Email/Password belum diaktifkan di Firebase Console.';
    case 'auth/popup-blocked':
      return 'Popup login diblokir browser. Izinkan popup lalu coba lagi.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Jendela login Google ditutup sebelum selesai.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet. Periksa jaringan Anda lalu coba lagi.';
    case 'auth/unauthorized-domain':
      return 'Domain ini belum diizinkan di Firebase Console (Authentication → Authorized domains).';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan metode Google. Silakan klik tombol "Masuk dengan Google".';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan login gagal. Mohon tunggu beberapa saat lalu coba lagi.';
    default:
      return 'Gagal masuk. Periksa kembali data login dan koneksi internet Anda.';
  }
}

function buildSession(emailValue) {
  // Nama kasir/penjaga diambil dari bagian sebelum "@" pada email
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

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Status & Feedback
  const [error, setError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-redirect jika pengguna sudah terautentikasi (sesi Firebase aktif)
  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, (user) => {
        if (cancelled) return;
        if (user) {
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

  // Handler: Login dengan Email dan Password
  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Format email tidak valid (contoh: nama@domain.com).');
      return;
    }

    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setEmailLoading(true);

    try {
      // Terapkan persistensi sesi sesuai pilihan "Ingat saya"
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      const user = userCredential.user;

      const session = buildSession(user.email || trimmedEmail);
      session.uid = user.uid;
      session.nama = user.displayName || session.nama;

      saveSession(session, remember);
      clearSessionKicked();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.warn('Login email failed:', err.code, err.message);
      setError(firebaseErrorMessage(err.code || ''));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler: Login dengan Google (mempertahankan alur yang sudah berjalan)
  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const session = buildSession(user.email || '');
      session.uid = user.uid;
      session.nama = user.displayName || session.nama;

      saveSession(session, remember);
      clearSessionKicked();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.warn('Login Google failed:', err.code, err.message);
      setError(firebaseErrorMessage(err.code || ''));
    } finally {
      setGoogleLoading(false);
    }
  };

  const isBusy = emailLoading || googleLoading;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-4 py-10">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Nama Aplikasi */}
        <div className="mb-6 flex flex-col items-center justify-center gap-3">
          <Logo
            size="lg"
            imgClassName="drop-shadow-[0_8px_24px_rgba(16,185,129,0.35)] rounded-2xl"
            className="justify-center"
          />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Qurmacel <span className="text-emerald-400">POS</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-400">
              Sistem Kasir Modern untuk Warung &amp; UMKM
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">Selamat Datang</h2>
            <p className="mt-1 text-xs text-slate-400">
              Masuk untuk mengelola transaksi dan laporan penjualan toko Anda.
            </p>
          </div>

          {/* Alert / Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-500/15 p-3 text-xs font-medium text-rose-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-300" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form Login: Email dan Password */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            {/* Input Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Pengguna
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isBusy}
                  placeholder="cth: nama@email.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:bg-white/10 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Input Password dengan Toggle Tampilkan/Sembunyikan */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isBusy}
                  placeholder="Masukkan password Anda..."
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-10 pr-11 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:bg-white/10 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isBusy}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white transition focus:outline-none"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox Ingat Saya */}
            <div className="pt-0.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isBusy}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-emerald-500"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            {/* Tombol Login Email */}
            <button
              type="submit"
              disabled={isBusy}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/35 transition hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {emailLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memverifikasi akun...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Masuk dengan Email</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Separator / Pemisah ATAU */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-white/15" />
            <span className="absolute bg-slate-800/90 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ATAU
            </span>
          </div>

          {/* Tombol Login dengan Google */}
          <div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isBusy}
              className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/10 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-white/20 hover:border-white/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-emerald-400" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon size={17} />
                  <span>Masuk dengan Google</span>
                  <ArrowRight
                    size={16}
                    className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-white"
                  />
                </>
              )}
            </button>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Login aman menggunakan Firebase Authentication</span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Qurmacel POS · Warung Modern
        </p>
      </div>
    </div>
  );
}
