import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  signInWithPopup,
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
    case 'auth/operation-not-allowed':
      return 'Metode login Google belum diaktifkan di Firebase Console.';
    case 'auth/popup-blocked':
      return 'Popup login diblokir browser. Izinkan popup lalu coba lagi.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Jendela login Google ditutup.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet. Coba lagi.';
    case 'auth/unauthorized-domain':
      return 'Domain ini belum diizinkan di Firebase Console (Authentication → Authorized domains).';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan metode login lain. Silakan hubungi admin toko.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
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
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  // Jika pengguna yang sah sudah terautentikasi (persistensi Firebase),
  // jangan tampilkan halaman login — langsung ke dashboard.
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
      // abaikan; jika auth tidak tersedia, tetap tampilkan tombol login
    }
    return () => {
      cancelled = true;
      unsub();
    };
  }, [navigate]);

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // Ingat Saya = true → persistensi lokal (bertahan setelah browser ditutup).
      // Ingat Saya = false → persistensi sesi (hilang saat tab/browser ditutup).
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      // Verifikasi identitas dilakukan oleh Google + Firebase Auth.
      // Akun Google baru dibuat otomatis oleh Firebase; akun lama langsung masuk.
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const session = buildSession(user.email || '');
      session.uid = user.uid;
      session.nama = user.displayName || session.nama;

      saveSession(session, remember);
      clearSessionKicked();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(firebaseErrorMessage(err.code || ''));
    } finally {
      setGoogleLoading(false);
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

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-emerald-500"
              />
              Ingat saya
            </label>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Masuk dengan Google...
                </>
              ) : (
                <>
                  <GoogleIcon size={17} />
                  Masuk dengan Google
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
            <ShieldCheck size={13} />
            Login aman menggunakan Firebase Authentication
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Qurmacel POS · Warung Modern
        </p>
      </div>
    </div>
  );
}
