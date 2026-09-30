import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// Koleksi item (satu dokumen per id) di bawah users/{uid}/<koleksi>/<id>
const ITEM_COLLECTIONS = [
  'products',
  'productMeta',
  'transactions',
  'tables',
  'orders',
  'customers',
  'debts',
];

function userCol(uid, name) {
  return collection(db, 'users', uid, name);
}

function userDoc(uid, name, id) {
  return doc(db, 'users', uid, name, String(id));
}

function singleUserDoc(uid, name) {
  return doc(db, 'users', uid, name, 'data');
}

/**
 * Ambil seluruh data milik akun (Firestore sebagai sumber utama).
 * Mengembalikan bentuk yang sama dengan state di DataContext.
 */
export async function fetchUserData(uid) {
  const out = {
    products: [],
    productMeta: [],
    transactions: [],
    tables: [],
    orders: [],
    customers: [],
    debts: [],
    settings: null,
    categories: [],
  };

  await Promise.all(
    ITEM_COLLECTIONS.map(async (name) => {
      const snap = await getDocs(userCol(uid, name));
      out[name] = snap.docs.map((d) => d.data());
    })
  );

  const s = await getDoc(singleUserDoc(uid, 'settings'));
  out.settings = s.exists() ? s.data() : null;

  const c = await getDoc(singleUserDoc(uid, 'categories'));
  out.categories = c.exists() ? (Array.isArray(c.data().list) ? c.data().list : []) : [];

  return out;
}

/**
 * Tulis (upsert) seluruh item satu koleksi ke Firestore, dan hapus dokumen
 * yang tidak ada lagi di daftar baru (dibandingkan dengan prevItems).
 */
export async function pushItems(uid, name, items, prevItems = [], keyOf = (it) => it && it.id) {
  if (!uid || !ITEM_COLLECTIONS.includes(name)) return;

  const batch = writeBatch(db);
  const nextIds = new Set((items || []).map(keyOf).filter(Boolean));

  (items || []).forEach((it) => {
    const k = keyOf(it);
    if (!k) return;
    batch.set(userDoc(uid, name, k), it);
  });

  (prevItems || []).forEach((it) => {
    const k = keyOf(it);
    if (k && !nextIds.has(k)) batch.delete(userDoc(uid, name, k));
  });

  await batch.commit();
}

export async function pushSettings(uid, settings) {
  if (!uid) return;
  await setDoc(singleUserDoc(uid, 'settings'), settings);
}

export async function pushCategories(uid, list) {
  if (!uid) return;
  await setDoc(singleUserDoc(uid, 'categories'), { list: list || [] });
}