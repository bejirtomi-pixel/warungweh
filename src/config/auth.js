import { GoogleAuthProvider } from 'firebase/auth';

// UID akun Qurma yang berhak login (dibaca dari variabel lingkungan build,
// bukan di-hardcode di source code). Nilai diisi di file .env (git-ignored).
export const ALLOWED_UID = import.meta.env.VITE_ALLOWED_UID || '';

// Provider Google untuk "Masuk dengan Google". Cara pakai:
//   signInWithPopup(auth, googleProvider)
export const googleProvider = new GoogleAuthProvider();