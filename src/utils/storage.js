const KEYS = {
  products: 'warungku_products',
  transactions: 'warungku_transactions',
  settings: 'warungku_settings',
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
