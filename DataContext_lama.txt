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

function getInitialProducts() {
  if (!hasProducts()) {
    saveProducts(dummyProducts);
    return dummyProducts;
  }
  const stored = getProducts();
  return Array.isArray(stored) ? stored : [];
}

function getInitialSettings() {
  if (!hasSettings()) {
    saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...getSettings() };
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
        const item = data.items.find((i) => i.productId === p.id);
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

  const value = useMemo(
    () => ({
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
