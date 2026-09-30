import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import {
  fetchUserData,
  pushItems,
  pushSettings,
  pushCategories,
} from '../utils/firestore';
import {
  getProducts,
  hasProducts,
  saveProducts,
  getProductMeta,
  saveProductMeta,
  getTransactions,
  saveTransactions,
  getSettings,
  hasSettings,
  saveSettings,
  getTables,
  saveTables,
  getOrders,
  saveOrders,
  addOrder,
  updateOrder,
  deleteOrder,
  getCustomers,
  saveCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getDebts,
  saveDebts,
  addDebt,
  updateDebt,
  deleteDebt,
  getCategories,
  saveCategories,
} from '../utils/storage';
import { dummyProducts, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../data/dummyProducts';
import { ALLOWED_UID } from '../config/auth';
import { generateTransactionId } from '../utils/generateTransactionId';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';

const DataContext = createContext(null);

const DEFAULT_PRINTER_SETTINGS = {
  paperSize: '58',
  autoPrint: false,
};

function normalizeProduct(p = {}) {
  return {
    id: p.id || `PRD-${Date.now()}`,
    kode: p.barcode || p.kode || p.name || '',
    nama: p.name || p.nama || p.nama_barang || '',
    kategori: p.category || p.kategori || 'Minuman',
    hargaModal: Number(p.purchasePrice ?? p.hargaModal) || 0,
    harga: Number(p.sellingPrice ?? p.harga) || 0,
    stok: Number(p.stock ?? p.stok) || 0,
    satuan: p.unit || p.satuan || 'Pcs',
    status: p.status || 'Aktif',
    foto: p.foto || p.image || '',
  };
}

function normalizeSettings(s = {}) {
  return {
    ...DEFAULT_SETTINGS,
    storeName: s.storeName || s.nama || DEFAULT_SETTINGS.storeName,
    address: s.address || s.alamat || DEFAULT_SETTINGS.address,
    phone: s.phone || s.telepon || DEFAULT_SETTINGS.phone,
    footer: s.footerStruk || s.footer || DEFAULT_SETTINGS.footer,
    pemilik: s.pemilik || '',
    email: s.email || '',
    printerSettings: {
      ...DEFAULT_PRINTER_SETTINGS,
      ...(s.printerSettings || {}),
      paperSize: s.printerSettings?.paperSize || '58',
      autoPrint: Boolean(s.printerSettings?.autoPrint),
    },
  };
}

function normalizeProductMeta(m = {}) {
  return {
    productId: m.productId || '',
    bestSeller: Boolean(m.bestSeller),
    bestSellerNote: m.bestSellerNote || '',
    promoActive: Boolean(m.promoActive),
    promoTitle: m.promoTitle || '',
    promoType: m.promoType === 'persen' ? 'persen' : 'nominal',
    promoValue: Number(m.promoValue) || 0,
    promoNote: m.promoNote || '',
    b1g1: Boolean(m.b1g1),
    b1g1Note: m.b1g1Note || '',
    deskripsi: m.deskripsi || '',
    updatedAt: m.updatedAt || null,
  };
}

function getInitialProducts() {
  if (!hasProducts()) {
    const defaults = dummyProducts.map(normalizeProduct);
    saveProducts(defaults);
    return defaults;
  }

  const stored = getProducts();
  const arr = Array.isArray(stored) ? stored : [];
  return arr.map(normalizeProduct);
}

function getInitialSettings() {
  if (!hasSettings()) {
    const defaults = normalizeSettings(DEFAULT_SETTINGS);
    saveSettings(defaults);
    return defaults;
  }

  const stored = getSettings();
  return normalizeSettings(stored);
}

export function DataProvider({ children }) {
  const [products, setProducts] = useState(getInitialProducts);

  const [productMeta, setProductMeta] = useState(() => {
    const stored = getProductMeta();
    return Array.isArray(stored) ? stored.map(normalizeProductMeta) : [];
  });

  const [transactions, setTransactions] = useState(() => {
    const stored = getTransactions();
    return Array.isArray(stored) ? stored : [];
  });

  const [settings, setSettings] = useState(getInitialSettings);

  const [tables, setTables] = useState(() => {
    const stored = getTables();
    return Array.isArray(stored) ? stored : [];
  });

  const [orders, setOrders] = useState(() => {
    const stored = getOrders();
    return Array.isArray(stored) ? stored : [];
  });

  const [customers, setCustomers] = useState(() => {
    const stored = getCustomers();
    return Array.isArray(stored) ? stored : [];
  });

  const [debts, setDebts] = useState(() => {
    const stored = getDebts();
    return Array.isArray(stored) ? stored : [];
  });

  const [extraCategories, setExtraCategories] = useState(() => {
    const stored = getCategories();
    return Array.isArray(stored) ? stored : [];
  });

  const authUidRef = useRef(null);

  const persistProducts = useCallback((next) => {
    setProducts(next);
    saveProducts(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'products', next, products).catch((e) =>
        console.warn('Sync produk ke Firebase gagal:', e)
      );
    }
  }, [products]);

  const persistProductMeta = useCallback((next) => {
    setProductMeta(next);
    saveProductMeta(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'productMeta', next, productMeta, (m) => m && m.productId).catch((e) =>
        console.warn('Sync informasi barang ke Firebase gagal:', e)
      );
    }
  }, [productMeta]);

  const persistTransactions = useCallback((next) => {
    setTransactions(next);
    saveTransactions(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'transactions', next, transactions).catch((e) =>
        console.warn('Sync transaksi ke Firebase gagal:', e)
      );
    }
  }, [transactions]);

  const persistTables = useCallback((next) => {
    setTables(next);
    saveTables(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'tables', next, tables).catch((e) =>
        console.warn('Sync meja ke Firebase gagal:', e)
      );
    }
  }, [tables]);

  const persistOrders = useCallback((next) => {
    setOrders(next);
    saveOrders(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'orders', next, orders).catch((e) =>
        console.warn('Sync pesanan ke Firebase gagal:', e)
      );
    }
  }, [orders]);

  const persistCustomers = useCallback((next) => {
    setCustomers(next);
    saveCustomers(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'customers', next, customers).catch((e) =>
        console.warn('Sync pelanggan ke Firebase gagal:', e)
      );
    }
  }, [customers]);

  const persistDebts = useCallback((next) => {
    setDebts(next);
    saveDebts(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'debts', next, debts).catch((e) =>
        console.warn('Sync hutang ke Firebase gagal:', e)
      );
    }
  }, [debts]);

  const persistCategories = useCallback((next) => {
    setExtraCategories(next);
    saveCategories(next);
    const uid = authUidRef.current;
    if (uid) {
      pushCategories(uid, next).catch((e) =>
        console.warn('Sync kategori ke Firebase gagal:', e)
      );
    }
  }, []);

  const addProduct = useCallback(
    (product) => {
      const normalized = normalizeProduct(product);
      persistProducts([normalized, ...products]);
    },
    [products, persistProducts]
  );

  const updateProduct = useCallback(
    (updated) => {
      const normalized = normalizeProduct(updated);
      persistProducts(
        products.map((p) => (p.id === normalized.id ? normalized : p))
      );
    },
    [products, persistProducts]
  );

  const deleteProduct = useCallback(
    (id) => {
      persistProducts(products.filter((p) => p.id !== id));
      persistProductMeta(
        productMeta.filter((m) => m.productId !== id)
      );
    },
    [products, productMeta, persistProducts, persistProductMeta]
  );

  const updateProductMeta = useCallback(
    (productId, patch = {}) => {
      const existing = productMeta.find((m) => m.productId === productId);
      const next = existing
        ? productMeta.map((m) =>
            m.productId === productId
              ? normalizeProductMeta({
                  ...m,
                  ...patch,
                  updatedAt: new Date().toISOString(),
                })
              : m
          )
        : [
            ...productMeta,
            normalizeProductMeta({
              productId,
              ...patch,
              updatedAt: new Date().toISOString(),
            }),
          ];
      persistProductMeta(next);
    },
    [productMeta, persistProductMeta]
  );

  const addTable = useCallback(
    (table) => {
      const newTable = {
        id: `TBL-${Date.now()}`,
        name: table.name || `Meja ${tables.length + 1}`,
        active: true,
        qrisImage: table.qrisImage || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistTables([newTable, ...tables]);
      return newTable;
    },
    [tables, persistTables]
  );

  const updateTable = useCallback(
    (updated) => {
      persistTables(
        tables.map((t) =>
          t.id === updated.id ? { ...t, ...updated, updatedAt: new Date().toISOString() } : t
        )
      );
    },
    [tables, persistTables]
  );

  const deleteTable = useCallback(
    (id) => {
      persistTables(tables.filter((t) => t.id !== id));
    },
    [tables, persistTables]
  );

  // Orders (Pengiriman)
  const createOrder = useCallback(
    (orderData) => {
      const order = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString(),
        type: orderData.type || 'Ambil Sendiri',
        customerId: orderData.customerId || null,
        customerName: orderData.customerName || '',
        customerPhone: orderData.customerPhone || '',
        customerAddress: orderData.customerAddress || '',
        courier: orderData.courier || '',
        shippingCost: Number(orderData.shippingCost) || 0,
        courierNote: orderData.courierNote || '',
        items: orderData.items || [],
        total: Number(orderData.total) || 0,
        paymentMethod: orderData.paymentMethod || 'Cash',
        paymentStatus: orderData.paymentMethod === 'Cash' ? 'Lunas' : orderData.paymentMethod === 'Hutang' ? 'Belum Lunas' : 'Pending',
        deliveryStatus: orderData.type === 'Dikirim' ? 'Menunggu' : null,
        notes: orderData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistOrders([order, ...orders]);
      return order;
    },
    [orders, persistOrders]
  );

  const updateOrderStatus = useCallback(
    (orderId, updates) => {
      persistOrders(
        orders.map((o) =>
          o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
        )
      );
    },
    [orders, persistOrders]
  );

  const deleteOrder = useCallback(
    (id) => {
      persistOrders(orders.filter((o) => o.id !== id));
    },
    [orders, persistOrders]
  );

  // Customers (Pelanggan)
  const createCustomer = useCallback(
    (customerData) => {
      const customer = {
        id: `CUST-${Date.now()}`,
        name: customerData.name || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        totalDebt: 0,
        orderCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistCustomers([customer, ...customers]);
      return customer;
    },
    [customers, persistCustomers]
  );

  const updateCustomer = useCallback(
    (customerId, updates) => {
      persistCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      );
    },
    [customers, persistCustomers]
  );

  const deleteCustomer = useCallback(
    (id) => {
      persistCustomers(customers.filter((c) => c.id !== id));
    },
    [customers, persistCustomers]
  );

  // Debts (Hutang)
  const createDebt = useCallback(
    (debtData) => {
      const debt = {
        id: `DEBT-${Date.now()}`,
        customerId: debtData.customerId,
        customerName: debtData.customerName,
        orderId: debtData.orderId,
        orderNumber: debtData.orderNumber,
        amount: Number(debtData.amount) || 0,
        status: 'Belum Lunas',
        paidAmount: 0,
        paymentHistory: [],
        dueDate: debtData.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistDebts([debt, ...debts]);
      return debt;
    },
    [debts, persistDebts]
  );

  const updateDebt = useCallback(
    (debtId, updates) => {
      persistDebts(
        debts.map((d) =>
          d.id === debtId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
        )
      );
    },
    [debts, persistDebts]
  );

  const addDebtPayment = useCallback(
    (debtId, payment) => {
      persistDebts(
        debts.map((d) => {
          if (d.id !== debtId) return d;
          const newPaid = (d.paidAmount || 0) + Number(payment.amount);
          const newStatus = newPaid >= d.amount ? 'Lunas' : 'Belum Lunas';
          return {
            ...d,
            paidAmount: newPaid,
            status: newStatus,
            paymentHistory: [...(d.paymentHistory || []), { ...payment, date: new Date().toISOString() }],
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [debts, persistDebts]
  );

  const deleteDebt = useCallback(
    (id) => {
      persistDebts(debts.filter((d) => d.id !== id));
    },
    [debts, persistDebts]
  );

  // Categories (Kategori tambahan dari menu Barang)
  const addCategory = useCallback(
    (name) => {
      const trimmed = String(name || '').trim();
      if (!trimmed) return;
      if (extraCategories.includes(trimmed) || DEFAULT_CATEGORIES.includes(trimmed)) {
        return trimmed;
      }
      persistCategories([...extraCategories, trimmed]);
      return trimmed;
    },
    [extraCategories, persistCategories]
  );

  const deleteCategory = useCallback(
    (name) => {
      persistCategories(extraCategories.filter((c) => c !== name));
    },
    [extraCategories, persistCategories]
  );

  const completeTransaction = useCallback(
    (data) => {
      const transaction = {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        ...data,
      };

      persistTransactions([transaction, ...transactions]);

      const items = Array.isArray(data.items) ? data.items : [];

      const nextProducts = products.map((p) => {
        const item = items.find((i) => i.id === p.id);

        if (!item) return p;

        return {
          ...p,
          stok: Math.max(
            0,
            (Number(p.stok) || 0) - (Number(item.qty) || 0)
          ),
        };
      });

      persistProducts(nextProducts);

      return transaction;
    },
    [products, transactions, persistProducts, persistTransactions]
  );

  const updateTransaction = useCallback(
    (id, updates) => {
      persistTransactions(
        transactions.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
    },
    [transactions, persistTransactions]
  );

  const updateSettings = useCallback(
    (partial = {}) => {
      const next = normalizeSettings({
        ...settings,
        ...partial,
        printerSettings: {
          ...settings.printerSettings,
          ...(partial.printerSettings || {}),
        },
      });

      setSettings(next);
      saveSettings(next);
      const uid = authUidRef.current;
      if (uid) {
        pushSettings(uid, next).catch((e) =>
          console.warn('Sync pengaturan ke Firebase gagal:', e)
        );
      }
    },
    [settings]
  );

  const updateStoreProfile = useCallback(
    (profile = {}) => {
      updateSettings({
        storeName: profile.nama || '',
        address: profile.alamat || '',
        phone: profile.telepon || '',
        email: profile.email || '',
        pemilik: profile.pemilik || '',
        footerStruk: profile.footerStruk || '',
      });
    },
    [updateSettings]
  );

  const printerSettings = settings.printerSettings || DEFAULT_PRINTER_SETTINGS;

  const updatePrinterSettings = useCallback(
    (partial = {}) => {
      updateSettings({
        printerSettings: {
          ...printerSettings,
          ...partial,
        },
      });
    },
    [printerSettings, updateSettings]
  );

  const resetData = useCallback(() => {
    const defaultProducts = dummyProducts.map(normalizeProduct);
    const defaults = normalizeSettings(DEFAULT_SETTINGS);

    persistProducts(defaultProducts);
    persistTransactions([]);

    setSettings(defaults);
    saveSettings(defaults);
  }, [persistProducts, persistTransactions]);

  // Terapkan data remote (Firestore) ke state + cache lokal tanpa push balik.
  const applyRemote = useCallback((remote) => {
    if (!remote) return;

    const normProducts = Array.isArray(remote.products)
      ? remote.products.map(normalizeProduct)
      : [];
    setProducts(normProducts);
    saveProducts(normProducts);

    const normMeta = Array.isArray(remote.productMeta)
      ? remote.productMeta.map(normalizeProductMeta)
      : [];
    setProductMeta(normMeta);
    saveProductMeta(normMeta);

    const normTransactions = Array.isArray(remote.transactions)
      ? remote.transactions
      : [];
    setTransactions(normTransactions);
    saveTransactions(normTransactions);

    const normTables = Array.isArray(remote.tables) ? remote.tables : [];
    setTables(normTables);
    saveTables(normTables);

    const normOrders = Array.isArray(remote.orders) ? remote.orders : [];
    setOrders(normOrders);
    saveOrders(normOrders);

    const normCustomers = Array.isArray(remote.customers)
      ? remote.customers
      : [];
    setCustomers(normCustomers);
    saveCustomers(normCustomers);

    const normDebts = Array.isArray(remote.debts) ? remote.debts : [];
    setDebts(normDebts);
    saveDebts(normDebts);

    if (remote.settings) {
      const normSettings = normalizeSettings(remote.settings);
      setSettings(normSettings);
      saveSettings(normSettings);
    }

    const normCategories = Array.isArray(remote.categories)
      ? remote.categories
      : [];
    setExtraCategories(normCategories);
    saveCategories(normCategories);
  }, []);

  // Firebase Auth + sinkronisasi Firestore (sumber utama) dengan migrasi data lokal.
  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    try {
      unsub = onAuthStateChanged(auth, (user) => {

        if (!user) {
          authUidRef.current = null;
          return;
        }

        const uid = user.uid;

        // Hanya akun Qurma yang berhak membaca datanya dari Firestore.
        if (!ALLOWED_UID || uid !== ALLOWED_UID) {
          authUidRef.current = null;
          return;
        }

        authUidRef.current = uid;

        (async () => {
          try {
            const remote = await fetchUserData(uid);
            if (cancelled) return;
            applyRemote(remote);
          } catch (err) {
            console.warn(
              'Qurmacel POS: gagal sinkron dengan Firebase — memakai data lokal.',
              err
            );
          }
        })();
      });
    } catch (err) {
      console.warn('Qurmacel POS: Firebase Auth tidak tersedia — mode lokal.', err);
    }

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const fromProducts = products
      .map((p) => p.kategori)
      .filter(Boolean);

    return Array.from(
      new Set([...DEFAULT_CATEGORIES, ...extraCategories, ...fromProducts])
    );
  }, [products, extraCategories]);

  const storeProfile = useMemo(
    () => ({
      nama: settings.storeName || 'WarungKu',
      pemilik: settings.pemilik || '',
      alamat: settings.address || '',
      telepon: settings.phone || '',
      email: settings.email || '',
      footerStruk:
        settings.footerStruk ||
        settings.footer ||
        'Terima kasih telah berbelanja.',
    }),
    [settings]
  );

  const value = useMemo(
    () => ({
      products,
      productMeta,
      transactions,
      settings,
      tables,
      orders,
      customers,
      debts,
      categories,

      storeProfile,
      printerSettings,

      addCategory,
      deleteCategory,

      addProduct,
      updateProduct,
      deleteProduct,
      updateProductMeta,
      completeTransaction,
      updateTransaction,

      addTable,
      updateTable,
      deleteTable,

      createOrder,
      updateOrderStatus,
      deleteOrder,

      createCustomer,
      updateCustomer,
      deleteCustomer,

      createDebt,
      updateDebt,
      addDebtPayment,
      deleteDebt,

      updateSettings,
      updateStoreProfile,
      updatePrinterSettings,

      resetData,

      formatRupiah: formatCurrency,
      formatAngka: formatNumber,
    }),
    [
      products,
      productMeta,
      transactions,
      settings,
      tables,
      orders,
      customers,
      debts,
      categories,
      storeProfile,
      printerSettings,
      addCategory,
      deleteCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProductMeta,
      completeTransaction,
      updateTransaction,
      addTable,
      updateTable,
      deleteTable,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      createDebt,
      updateDebt,
      addDebtPayment,
      deleteDebt,
      updateSettings,
      updateStoreProfile,
      updatePrinterSettings,
      resetData,
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useData harus dipakai di dalam DataProvider');
  }

  return context;
}