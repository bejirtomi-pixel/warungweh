const KEYS = {
  products: 'warungku_products',
  productMeta: 'warungku_product_meta',
  transactions: 'warungku_transactions',
  settings: 'warungku_settings',
  tables: 'warungku_tables',
  orders: 'warungku_orders',
  customers: 'warungku_customers',
  debts: 'warungku_debts',
  categories: 'warungku_categories',
  session: 'warungku_session',
  kicked: 'warungku_session_kicked',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch (error) {
    console.warn(`Gagal membaca ${key} dari localStorage:`, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan ${key} ke localStorage:`, error);
    return false;
  }
}

export function hasProducts() {
  try {
    return localStorage.getItem(KEYS.products) !== null;
  } catch {
    return false;
  }
}

export function hasSettings() {
  try {
    return localStorage.getItem(KEYS.settings) !== null;
  } catch {
    return false;
  }
}

export function getProducts() {
  return readJSON(KEYS.products, []);
}

export function saveProducts(products) {
  return writeJSON(KEYS.products, products);
}

// Informasi Barang: atribut tambahan berbasis productId (best seller, promo, B1G1, deskripsi).
// Bukan duplikat data produk — nama/harga/kategori/stok tetap bersumber dari tabel Barang.
export function getProductMeta() {
  return readJSON(KEYS.productMeta, []);
}

export function saveProductMeta(meta) {
  return writeJSON(KEYS.productMeta, meta);
}

export function getTransactions() {
  return readJSON(KEYS.transactions, []);
}

export function saveTransactions(transactions) {
  return writeJSON(KEYS.transactions, transactions);
}

export function getSettings() {
  return readJSON(KEYS.settings, null);
}

export function saveSettings(settings) {
  return writeJSON(KEYS.settings, settings);
}

export function getTables() {
  return readJSON(KEYS.tables, []);
}

export function saveTables(tables) {
  return writeJSON(KEYS.tables, tables);
}

// Orders (Pengiriman)
export function getOrders() {
  return readJSON(KEYS.orders, []);
}

export function saveOrders(orders) {
  return writeJSON(KEYS.orders, orders);
}

export function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  return saveOrders(orders);
}

export function updateOrder(orderId, updates) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;
  orders[idx] = { ...orders[idx], ...updates, updatedAt: new Date().toISOString() };
  return saveOrders(orders);
}

export function deleteOrder(orderId) {
  const orders = getOrders();
  const filtered = orders.filter((o) => o.id !== orderId);
  return saveOrders(filtered);
}

// Customers (Pelanggan)
export function getCustomers() {
  return readJSON(KEYS.customers, []);
}

export function saveCustomers(customers) {
  return writeJSON(KEYS.customers, customers);
}

export function addCustomer(customer) {
  const customers = getCustomers();
  customers.unshift(customer);
  return saveCustomers(customers);
}

export function updateCustomer(customerId, updates) {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx === -1) return false;
  customers[idx] = { ...customers[idx], ...updates, updatedAt: new Date().toISOString() };
  return saveCustomers(customers);
}

export function deleteCustomer(customerId) {
  const customers = getCustomers();
  const filtered = customers.filter((c) => c.id !== customerId);
  return saveCustomers(filtered);
}

// Debts (Hutang)
export function getDebts() {
  return readJSON(KEYS.debts, []);
}

export function saveDebts(debts) {
  return writeJSON(KEYS.debts, debts);
}

export function addDebt(debt) {
  const debts = getDebts();
  debts.unshift(debt);
  return saveDebts(debts);
}

export function updateDebt(debtId, updates) {
  const debts = getDebts();
  const idx = debts.findIndex((d) => d.id === debtId);
  if (idx === -1) return false;
  debts[idx] = { ...debts[idx], ...updates, updatedAt: new Date().toISOString() };
  return saveDebts(debts);
}

export function deleteDebt(debtId) {
  const debts = getDebts();
  const filtered = debts.filter((d) => d.id !== debtId);
  return saveDebts(filtered);
}

// Categories (Kategori tambahan dari menu Barang)
export function getCategories() {
  return readJSON(KEYS.categories, []);
}

export function saveCategories(categories) {
  return writeJSON(KEYS.categories, categories);
}

// Notifications
export function getNotifPrefs() {
  return readJSON('warungku_notif_prefs', {
    notifTransaksi: true,
    notifStok: true,
    notifPromo: false,
  });
}

export function saveNotifPrefs(prefs) {
  return writeJSON('warungku_notif_prefs', prefs);
}

function readJSONFrom(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch (error) {
    console.warn(`Gagal membaca ${key} dari penyimpanan:`, error);
    return fallback;
  }
}

// Session (Sesi Kasir/Penjaga)
// Ingat Saya = true → disimpan di localStorage (bertahan setelah browser ditutup).
// Ingat Saya = false → sessionStorage (hilang saat tab/browser ditutup).
export function getSession() {
  const remembered = readJSONFrom(localStorage, KEYS.session, null);
  if (remembered) return remembered;
  return readJSONFrom(sessionStorage, KEYS.session, null);
}

export function saveSession(session, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  try {
    const raw = JSON.stringify(session);
    localStorage.removeItem(KEYS.session);
    sessionStorage.removeItem(KEYS.session);
    store.setItem(KEYS.session, raw);
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan ${KEYS.session}:`, error);
    return false;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEYS.session);
    sessionStorage.removeItem(KEYS.session);
    return true;
  } catch {
    return false;
  }
}

// Sesi harian: sesi hanya berlaku pada hari yang sama saat login.
// Jika disimpan kemarin (atau lebih lama), dianggap kedaluwarsa.
export function isSessionValidToday(session) {
  if (!session) return false;
  const loginAt = new Date(session.loginAt);
  if (Number.isNaN(loginAt.getTime())) return false;

  const now = new Date();
  return (
    loginAt.getFullYear() === now.getFullYear() &&
    loginAt.getMonth() === now.getMonth() &&
    loginAt.getDate() === now.getDate()
  );
}

// Flag "dilempar keluar" per tab — dipakai saat penjaga lain login dari tab lain
// sehingga tab lama harus login ulang. Disimpan di sessionStorage khusus tab.
export function isSessionKicked() {
  try {
    return sessionStorage.getItem(KEYS.kicked) === '1';
  } catch {
    return false;
  }
}

export function setSessionKicked() {
  try {
    sessionStorage.setItem(KEYS.kicked, '1');
    return true;
  } catch {
    return false;
  }
}

export function clearSessionKicked() {
  try {
    sessionStorage.removeItem(KEYS.kicked);
    return true;
  } catch {
    return false;
  }
}
