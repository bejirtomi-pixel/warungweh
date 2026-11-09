import { GoogleAuthProvider } from 'firebase/auth';

// Provider Google untuk "Masuk dengan Google" (Google-only).
// Cara pakai: signInWithPopup(auth, googleProvider)
export const googleProvider = new GoogleAuthProvider();
