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
  UserPlus,
  User,
  CheckCircle2,
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { googleProvider } from '../config/auth';
import Logo from '../components/common/Logo';
import GoogleIcon from '../components/common/GoogleIcon';
import { saveSession, clearSessionKicked } from '../utils/storage';
import {
  ROLES,
  USER_STATUS,
  fetchUserProfile,
  bootstrapSuperAdmin,
  isAccountApproved,
} from '../utils/userManagement.js';
import { logActivity } from '../utils/activityLogger.js';

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
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    case 'auth/operation-not-allowed':
      return 'Metode autentikasi belum diaktifkan di Firebase Console.';
    case 'auth/popup-blocked':
      return 'Popup login diblokir browser. Izinkan popup lalu coba lagi.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Jendela login Google ditutup sebelum selesai.';
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet. Periksa jaringan Anda lalu coba lagi.';
    case 'auth/unauthorized-domain':
      return 'Domain ini belum diizinkan di Firebase Console (Authentication → Authorized domains).';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan login gagal. Mohon tunggu beberapa saat lalu coba lagi.';
    default:
      return 'Gagal memproses autentikasi. Periksa data Anda lalu coba lagi.';
  }
}

export default function Login() {
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-redirect jika pengguna sudah login
  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;
        if (user) {
          const email = (user.email || '').toLowerCase().trim();
          const isPrimary = email === 'qurmacel@gmail.com' || email === 'admin@gmail.com';
          const profile = (await bootstrapSuperAdmin(user)) || (await fetchUserProfile(user.uid));

          if (isPrimary || isAccountApproved(profile?.status)) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/pending-approval', { replace: true });
          }
        }
      });
    } catch {}
    return () => {
      cancelled = true;
      unsub();
    };
  }, [navigate]);

  // Handler: Login dengan Email dan Password
  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email wajib diisi.');
      return;
    }

    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setEmailLoading(true);

    try {
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
      const userEmail = (user.email || trimmedEmail).toLowerCase().trim();
      const isPrimary = userEmail === 'qurmacel@gmail.com' || userEmail === 'admin@gmail.com';

      const profile = (await bootstrapSuperAdmin(user)) || (await fetchUserProfile(user.uid));

      if (isPrimary || isAccountApproved(profile?.status)) {
        navigate('/dashboard', { replace: true });
        return;
      }

      navigate('/pending-approval', { replace: true });
    } catch (err) {
      setError(firebaseErrorMessage(err.code || ''));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler: Pendaftaran Mandiri (Email & Password)
  const handleEmailRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!trimmedEmail) {
      setError('Email wajib diisi.');
      return;
    }

    // Lindungi akun resmi utama dari registrasi publik
    const lowerEmail = trimmedEmail.toLowerCase();
    if (lowerEmail === 'qurmacel@gmail.com' || lowerEmail === 'admin@gmail.com') {
      setError('Email ini adalah akun resmi sistem yang dilindungi. Silakan login langsung menggunakan tab Masuk.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setEmailLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;
      const nowIso = new Date().toISOString();

      // Buat dokumen pengguna berstatus PENDING di app_users
      const pendingProfile = {
        uid: user.uid,
        email: trimmedEmail,
        displayName: trimmedName,
        photoURL: '',
        role: ROLES.KASIR,
        status: USER_STATUS.PENDING,
        permissions: [],
        createdAt: nowIso,
        source: 'email_self_registration',
      };
      await setDoc(doc(db, 'app_users', user.uid), pendingProfile);

      // Simpan permohonan ke registration_requests untuk Super Admin
      await setDoc(doc(db, 'registration_requests', `REQ-${user.uid}`), {
        id: `REQ-${user.uid}`,
        uid: user.uid,
        email: trimmedEmail,
        displayName: trimmedName,
        method: 'Email & Password',
        requestedAt: nowIso,
        status: USER_STATUS.PENDING,
      });

      // Catat ke audit log
      await logActivity({
        actorUid: user.uid,
        actorName: trimmedName,
        actorRole: 'CUSTOMER',
        action: 'USER_SELF_REGISTERED',
        module: 'USER_MANAGEMENT',
        targetId: user.uid,
        details: { method: 'email', email: trimmedEmail },
        status: 'SUCCESS',
      });

      setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke halaman menunggu persetujuan...');
      setTimeout(() => {
        navigate('/pending-approval', { replace: true });
      }, 1000);
    } catch (err) {
      setError(firebaseErrorMessage(err.code || ''));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler: Login / Daftar dengan Google
  const handleGoogle = async () => {
    setError('');
    setSuccessMsg('');
    setGoogleLoading(true);

    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const isPrimary = userEmail === 'qurmacel@gmail.com' || userEmail === 'admin@gmail.com';

      const profile = (await bootstrapSuperAdmin(user)) || (await fetchUserProfile(user.uid));

      if (isPrimary || isAccountApproved(profile?.status)) {
        navigate('/dashboard', { replace: true });
        return;
      }

      navigate('/pending-approval', { replace: true });
    } catch (err) {
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
              Sistem Kasir Modern &amp; Manajemen Meja Dine In
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 space-y-5">
          {/* Tabs: Masuk vs Daftar Mandiri */}
          <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                authMode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Daftar Mandiri
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              {authMode === 'login' ? 'Masuk ke QurmacelPOS' : 'Pengajuan Akun Karyawan Baru'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {authMode === 'login'
                ? 'Gunakan akun terdaftar Anda untuk mengelola kasir.'
                : 'Pendaftaran mandiri akan diverifikasi oleh Super Admin sebelum diaktifkan.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-3 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM: LOGIN */}
          {authMode === 'login' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@toko.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password Anda"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-emerald-500"
                  />
                  <span>Ingat saya</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/40 hover:bg-emerald-500 transition disabled:opacity-60"
              >
                {emailLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                <span>{emailLoading ? 'Memeriksa Kredensial...' : 'Masuk Sekarang'}</span>
              </button>
            </form>
          ) : (
            /* FORM: REGISTER MANDIRI */
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap Karyawan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ulangi Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/40 hover:bg-emerald-500 transition disabled:opacity-60"
              >
                {emailLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                <span>{emailLoading ? 'Mendaftarkan Akun...' : 'Daftar & Ajukan Akses'}</span>
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-slate-900/80 px-3 text-[11px] font-semibold uppercase text-slate-400">
              atau
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-xs sm:text-sm hover:bg-white/15 transition disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            <span>{authMode === 'login' ? 'Masuk dengan Akun Google' : 'Daftar dengan Akun Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
