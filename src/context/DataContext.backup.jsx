import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  getProducts,
  hasProducts,
  saveProducts,
  getTransactions,
  saveTransactions,
  getSettings,
  hasSettings,
  saveSettings,
} from '../utils/storage';
import { dummyProducts, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/dummyProducts';
import { generateTransactionId } from '../utils/generateTransactionId';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';

const DataContext = createContext(null);

function normalizeProduct(p) {
  return {
    id: p.id,
    kode: p.barcode || p.kode || p.name || '',
    nama: p.name || p.nama || p.nama_barang || '',
    kategori: p.category || p.kategori || 'Minuman',
    hargaModal: Number(p.purchasePrice) || Number(p.hargaModal) || 0,
    harga: Number(p.sellingPrice) || Number(p.harga) || 0,
    stok: Number(p.stock) || 0,
    satuan: p.unit || p.satuan || 'Pcs',
    status: p.status || 'Aktif',
    foto: p.foto || p.image || '',
  };
}

function normalizeSettings(s) {
  return {
    storeName: s.storeName || s.nama || 'WarungKu',
    address: s.address || s.alamat || 'Jl. Raya Utama No. 1',
    phone: s.phone || s.telepon || '0812-3456-7890',
    footer: s.footerStruk || s.footer || 'Terima kasih telah berbelanja.',
    pemilik: s.pemilik || '',
    email: s.email || '',
  };
}

function getInitialProducts() {
  if (!hasProducts()) {
    saveProducts(dummyProducts.map(normalizeProduct));
    return dummyProducts.map(normalizeProduct);
  }
  const stored = getProducts();
  const arr = Array.isArray(stored) ? stored : [];
  return arr.map(normalizeProduct);
}

function getInitialSettings() {
  if (!hasSettings()) {
    const defaultSettings = {
      storeName: 'WarungKu',
      address: 'Jl. Raya Warung No. 1',
      phone: '0812-3456-7890',
      footer: 'Terima kasih telah berbelanja.',
      pemilik: '',
      email: '',
    };
    saveSettings(defaultSettings);
    return defaultSettings;
  }
  const stored = getSettings();
  return { ...DEFAULT_SETTINGS, ...normalizeSettings(stored) };
}

export function DataProvider({ children }) {
  const [products, setProducts] = useState(getInitialProducts);
  const [transactions, setTransactions] = useState(() => {
    const stored = getTransactions();
    return Array.isArray(stored) ? stored : [];
  });
  const [settings, setSettings] = useState(getInitialSettings);

  const persistProducts = (next) => {
    setProducts(next);
    saveProducts(next);
  };

  const persistTransactions = (next) => {
    setTransactions(next);
    saveTransactions(next);
  };

  const addProduct = useCallback(
    (product) => {
      persistProducts([product, ...products]);
    },
    [products]
  );

  const updateProduct = useCallback(
    (updated) => {
      persistProducts(products.map((p) => (p.id === updated.id ? updated : p)));
    },
    [products]
  );

  const deleteProduct = useCallback(
    (id) => {
      persistProducts(products.filter((p) => p.id !== id));
    },
    [products]
  );

  const completeTransaction = useCallback(
    (data) => {
      const transaction = {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        ...data,
      };
      persistTransactions([transaction, ...transactions]);
      const nextProducts = products.map((p) => {
        const item = data.items.find((i) => i.id === p.id);
        if (!item) return p;
        return { ...p, stock: Math.max(0, (Number(p.stock) || 0) - item.qty) };
      });
      persistProducts(nextProducts);
      return transaction;
    },
    [products, transactions]
  );

  const updateSettings = useCallback(
    (partial) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      saveSettings(next);
    },
    [settings]
  );

  const resetData = useCallback(() => {
    persistProducts(dummyProducts);
    persistTransactions([]);
    const defaults = DEFAULT_SETTINGS;
    setSettings(defaults);
    saveSettings(defaults);
  }, [persistProducts, persistTransactions]);

  const categories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromProducts]));
  }, [products]);

  const normalizeStoreProfile = (s) => ({
    nama: s.storeName || s.nama || 'WarungKu',
    alamat: s.address || s.alamat || 'Jl. Raya Utama No. 1',
    telepon: s.phone || s.telepon || '0812-3456-7890',
    footerStruk: s.footerStruk || s.footer || 'Terima kasih telah berbelanja.',
});

const value = useMemo(
    () => ({
      products,
      transactions,
      settings,
      categories,
      storeProfile: normalizeStoreProfile(settings),
      addProduct,
      updateProduct,
      deleteProduct,
      completeTransaction,
      updateSettings,
      resetData,
      formatRupiah: formatCurrency,
      formatAngka: formatNumber,
    }),
    [
      products,
      transactions,
      settings,
      categories,
      addProduct,
      updateProduct,
      deleteProduct,
      completeTransaction,
      updateSettings,
      resetData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData harus dipakai di dalam DataProvider');
  }
  return context;
}