import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDaXbPvELwyWgULzBVvHIRcOiqajyBqdGI',
  authDomain: 'warung-qurma.firebaseapp.com',
  projectId: 'warung-qurma',
  storageBucket: 'warung-qurma.firebasestorage.app',
  messagingSenderId: '512400134942',
  appId: '1:512400134942:web:1ac6ea07a013e2bcf26f0f',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;