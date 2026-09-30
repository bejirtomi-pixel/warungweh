#!/usr/bin/env node
/*
 * Seeder data Qurmacel POS -> Cloud Firestore (users/{uid}/...).
 *
 * Cara pakai:
 *   1. Jalankan mode cek offline:
 *        node scripts/seed-firestore.mjs --check
 *   2. Jalankan upload ke Firestore:
 *        node scripts/seed-firestore.mjs
 *
 * Keamanan:
 *   - Tidak pernah mencetak password, email, token, atau kredensial ke layar.
 *   - Hanya melakukan upsert dokumen, tidak menghapus dokumen lain.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CHECK_ONLY = process.argv.includes('--check');

const DATA_PATH = resolve(SCRIPT_DIR, '../qurmacel-data.json');
const CONFIG_PATH = resolve(SCRIPT_DIR, '../seed-config.json');

const API_KEY = 'AIzaSyDaXbPvELwyWgULzBVvHIRcOiqajyBqdGI';
const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/warung-qurma/databases/(default)/documents';

const ITEM_COLLECTIONS = [
  ['products', (it) => it && it.id],
  ['productMeta', (it) => it && it.productId],
  ['transactions', (it) => it && it.id],
  ['tables', (it) => it && it.id],
  ['orders', (it) => it && it.id],
  ['customers', (it) => it && it.id],
  ['debts', (it) => it && it.id],
];

function fail(msg) {
  console.error('\nGAGAL:', msg);
  process.exit(1);
}

if (!existsSync(DATA_PATH)) {
  fail(`File qurmacel-data.json tidak ditemukan di: ${DATA_PATH}`);
}

const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

// Validasi struktur data
function validateData() {
  const report = {
    products: { count: 0, valid: true },
    productMeta: { count: 0, valid: true },
    transactions: { count: 0, valid: true },
    tables: { count: 0, valid: true },
    orders: { count: 0, valid: true },
    customers: { count: 0, valid: true },
    debts: { count: 0, valid: true },
    settings: { present: false, obj: null },
    categories: { present: false, arr: [] },
  };

  if (Array.isArray(data.products)) {
    report.products.count = data.products.length;
    report.products.valid = data.products.every((it) => it && it.id);
  }
  if (Array.isArray(data.productMeta)) {
    report.productMeta.count = data.productMeta.length;
    report.productMeta.valid = data.productMeta.every((it) => it && it.productId);
  }
  if (Array.isArray(data.transactions)) {
    report.transactions.count = data.transactions.length;
  }
  if (Array.isArray(data.tables)) {
    report.tables.count = data.tables.length;
  }
  if (Array.isArray(data.orders)) {
    report.orders.count = data.orders.length;
  }
  if (Array.isArray(data.customers)) {
    report.customers.count = data.customers.length;
  }
  if (Array.isArray(data.debts)) {
    report.debts.count = data.debts.length;
  }
  if (data && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    report.settings.present = true;
    report.settings.obj = data.settings;
  }
  if (Array.isArray(data.categories)) {
    report.categories.present = true;
    report.categories.arr = data.categories;
  }

  return report;
}

if (CHECK_ONLY) {
  console.log('MODE CHECK (dry-run): tidak ada data yang ditulis ke Firestore.\n');

  if (!data || Object.keys(data).length === 0) {
    fail('Data qurmacel-data.json kosong atau tidak terbaca.');
  }

  const report = validateData();

  console.log('--- RINCIAN DATA QURMACELEXPORT ---');
  console.log('Products    : ' + report.products.count + ' item');
  console.log('ProductMeta : ' + report.productMeta.count + ' item');
  console.log('Transactions: ' + report.transactions.count + ' item');
  console.log('Tables      : ' + report.tables.count + ' item');
  console.log('Orders      : ' + report.orders.count + ' item');
  console.log('Customers   : ' + report.customers.count + ' item');
  console.log('Debts       : ' + report.debts.count + ' item');

  if (report.settings.present) {
    console.log('Settings    : object present (keys: ' + Object.keys(report.settings.obj).join(', ') + ')');
  } else {
    console.log('Settings    : tidak ada.');
  }
  if (report.categories.present) {
    console.log('Categories  : ' + report.categories.arr.length + ' item');
  } else {
    console.log('Categories  : tidak ada.');
  }

  console.log('\n--- RENCANA KOLEKSI FIRESTORE ---');
  const collections = ['products', 'productMeta', 'transactions', 'tables', 'orders', 'customers', 'debts'];
  for (const col of collections) {
    console.log('  ' + col + ': ' + report[col].count + ' dokumen --> users/{uid}/' + col);
  }
  if (report.settings.present) {
    console.log('  settings: dituju ke users/{uid}/settings/data');
  }
  if (report.categories.present) {
    console.log('  categories: dituju ke users/{uid}/categories/data');
  }

  process.exit(0);
}

// MODE UPLOAD NYATA
if (!existsSync(CONFIG_PATH)) {
  fail(`File seed-config.json tidak ditemukan di: ${CONFIG_PATH}`);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
if (!config.email || !config.password) {
  fail('seed-config.json harus berisi email dan password.');
}

const signIn = async () => {
  console.log('Mencoba masuk ke Firebase Auth...');
  const res = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: config.email, password: config.password, returnSecureToken: true }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.error?.message || res.statusText;
    } catch {}

    if (/INVALID_LOGIN_CREDENTIALS|EMAIL_NOT_FOUND/i.test(detail)) {
      // Coba mendaftarkan akun jika belum ada di Firebase
      console.log('Akun belum terdeteksi login, mencoba mendaftarkan akun baru di Firebase Auth...');
      const signUpRes = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: config.email, password: config.password, returnSecureToken: true }),
      });
      if (signUpRes.ok) {
        console.log('Akun baru berhasil didaftarkan di Firebase Authentication.');
        const signJ = await signUpRes.json();
        return { uid: signJ.localId, idToken: signJ.idToken };
      }
      let signUpDetail = '';
      try {
        const sj = await signUpRes.json();
        signUpDetail = sj.error?.message || signUpRes.statusText;
      } catch {}
      if (/EMAIL_EXISTS/i.test(signUpDetail)) {
        fail('Akun email ini sudah terdaftar di Firebase Console, tetapi password di seed-config.json tidak cocok.');
      }
      if (/WEAK_PASSWORD/i.test(signUpDetail)) {
        fail('Password pada seed-config.json terlalu pendek (minimal 6 karakter).');
      }
      fail(`Gagal login/daftar Firebase (${signUpDetail || detail}).`);
    }

    if (/USER_DISABLED/i.test(detail)) {
      fail('Akun Firebase dinonaktifkan.');
    }
    if (/EMAIL_NOT_ENABLED|OPERATION_NOT_ALLOWED|PASSWORD_LOGIN_DISABLED/i.test(detail)) {
      fail('Login Email/Password belum diaktifkan di Firebase Console.');
    }
    fail(`Login ke Firebase Auth gagal (${detail}).`);
  }
  const j = await res.json();
  return { uid: j.localId, idToken: j.idToken };
};

const toValue = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return { nullValue: null };
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, x] of Object.entries(v)) fields[k] = toValue(x);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
};

const stoneName = (uid, collection, id) =>
  `projects/warung-qurma/databases/(default)/documents/users/${encodeURIComponent(uid)}/${collection}/${encodeURIComponent(String(id))}`;

const commitWrites = async (idToken, writes) => {
  const url = `${FIRESTORE_BASE}:commit?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ writes }),
  });
  if (res.status === 403) {
    fail(
      'Firestore menolak tulis (403 Permission Denied).\n' +
        'Pastikan Rules di Firebase Console sudah diizinkan untuk akun login:\n' +
        '  rules_version = \'2\';\n' +
        '  service cloud.firestore {\n' +
        '    match /databases/{database}/documents {\n' +
        '      match /users/{uid}/{document=**} {\n' +
        '        allow read, write: if request.auth != null && request.auth.uid == uid;\n' +
        '      }\n' +
        '    }\n' +
        '  }'
    );
  }
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.error?.message || res.statusText;
    } catch {}
    fail(`Firestore menolak permintaan (${res.status}): ${detail}`);
  }
};

const run = async () => {
  const { uid, idToken } = await signIn();
  console.log('Login berhasil. Memulai upload data ke Cloud Firestore...');

  let total = 0;

  for (const [collection, keyOf] of ITEM_COLLECTIONS) {
    const items = Array.isArray(data[collection]) ? data[collection] : [];
    if (items.length === 0) continue;

    const writes = [];
    for (const it of items) {
      const k = keyOf(it);
      if (k === undefined || k === null) continue;
      writes.push({
        update: {
          name: stoneName(uid, collection, k),
          fields: toValue(it).mapValue.fields || {},
        },
      });
    }

    for (let i = 0; i < writes.length; i += 400) {
      await commitWrites(idToken, writes.slice(i, i + 400));
    }
    total += writes.length;
    console.log(`  ✓ ${collection}: ${writes.length} dokumen terunggah`);
  }

  if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    await commitWrites(idToken, [
      {
        update: {
          name: stoneName(uid, 'settings', 'data'),
          fields: toValue(data.settings).mapValue.fields || {},
        },
      },
    ]);
    total += 1;
    console.log('  ✓ settings: 1 dokumen terunggah');
  }

  if (Array.isArray(data.categories) && data.categories.length > 0) {
    await commitWrites(idToken, [
      {
        update: {
          name: stoneName(uid, 'categories', 'data'),
          fields: toValue({ list: data.categories }).mapValue.fields || {},
        },
      },
    ]);
    total += 1;
    console.log('  ✓ categories: 1 dokumen terunggah');
  }

  console.log(`\nUpload selesai! Total ${total} dokumen berhasil disimpan ke Cloud Firestore.`);
  console.log('Buka tab Firestore di Firebase Console dan refresh halaman untuk melihat koleksi users.');
};

run().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
