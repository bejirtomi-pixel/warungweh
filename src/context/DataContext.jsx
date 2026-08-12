import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const DataContext = createContext(null);

const STORAGE_KEY = 'qurmacel-pos-data';

const initialProducts = [];

const initialTransactions = [];

const initialStoreProfile = {
  nama: 'Qurmacel Store',
  pemilik: 'Qurmacel',
  alamat: 'Jl. Raya Utama No. 1, Kota Qurmacel',
  telepon: '0812-3456-7890',
  email: 'admin@qurmacel.store',
  footerStruk: 'Terima kasih telah berbelanja di Qurmacel POS!',
  npwp: '-',
};

const initialPrinterSettings = {
  paperSize: '58', // '58' mm thermal | '80' mm thermal
  autoPrint: false,
};

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : initialProducts,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : initialTransactions,
      storeProfile: parsed.storeProfile || initialStoreProfile,
      printerSettings: parsed.printerSettings || initialPrinterSettings,
    };
  } catch (error) {
    console.error('Gagal memuat data tersimpan:', error);
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Gagal menyimpan data:', error);
  }
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export function DataProvider({ children }) {
  const saved = useMemo(() => loadSavedState(), []);
  const [products, setProducts] = useState(saved?.products ?? initialProducts);
  const [transactions, setTransactions] = useState(saved?.transactions ?? initialTransactions);
  const [storeProfile, setStoreProfile] = useState(saved?.storeProfile ?? initialStoreProfile);
  const [printerSettings, setPrinterSettings] = useState(saved?.printerSettings ?? initialPrinterSettings);

  useEffect(() => {
    saveState({ products, transactions, storeProfile, printerSettings });
  }, [products, transactions, storeProfile, printerSettings]);

  const addProduct = useCallback((product) => {
    setProducts((prev) => [{ ...product, id: Date.now() }, ...prev]);
  }, []);

  const updateProduct = useCallback((updated) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addTransaction = useCallback((trx) => {
    setTransactions((prev) => [trx, ...prev]);
  }, []);

  const updateStoreProfile = useCallback((profile) => {
    setStoreProfile((prev) => ({ ...prev, ...profile }));
  }, []);

  const updatePrinterSettings = useCallback((settings) => {
    setPrinterSettings((prev) => ({ ...prev, ...settings }));
  }, []);

  const value = useMemo(
    () => ({
      products,
      transactions,
      storeProfile,
      printerSettings,
      formatRupiah,
      addProduct,
      updateProduct,
      deleteProduct,
      addTransaction,
      updateStoreProfile,
      updatePrinterSettings,
    }),
    [products, transactions, storeProfile, printerSettings, addProduct, updateProduct, deleteProduct, addTransaction, updateStoreProfile, updatePrinterSettings]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
