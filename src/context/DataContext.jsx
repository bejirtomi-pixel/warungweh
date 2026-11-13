import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logActivity, logAuditTrail } from '../utils/activityLogger';
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
  getTableSessions,
  saveTableSessions,
  getOrders,
  saveOrders,
  getCustomers,
  saveCustomers,
  getDebts,
  saveDebts,
  getCategories,
  saveCategories,
} from '../utils/storage';
import { dummyProducts, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_PAYMENT_METHODS } from '../data/dummyProducts';
import { generateTransactionId } from '../utils/generateTransactionId';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';

const DataContext = createContext(null);

const DEFAULT_PRINTER_SETTINGS = {
  paperSize: '58',
  autoPrint: false,
};

export function isProductAvailableForService(product, serviceType, options = {}) {
  if (!product) return false;
  if (product.status && product.status === 'Nonaktif') return false;

  const services = Array.isArray(product.availableServices) && product.availableServices.length > 0
    ? product.availableServices
    : (product.availableInPickup || product.availableInDineIn || product.availableInDelivery)
      ? [
          ...(product.availableInPickup ? ['pickup'] : []),
          ...(product.availableInDineIn ? ['dinein'] : []),
          ...(product.availableInDelivery ? ['delivery'] : []),
        ]
      : ['pickup'];

  const normType = String(serviceType || '')
    .toLowerCase()
    .replace(/[-_\s]/g, '');

  if (normType === 'pickup') {
    if (!services.includes('pickup')) return false;
    if (product.isDineInOnly && !services.includes('pickup')) return false;
    return true;
  }

  if (normType === 'dinein') {
    if (!services.includes('dinein')) return false;
    const cat = String(product.kategori || '').toLowerCase().trim();
    const isExcluded =
      cat.includes('sembako') ||
      cat.includes('cemilan') ||
      cat.includes('camilan') ||
      cat.includes('snack') ||
      cat.includes('rokok') ||
      cat.includes('sabun') ||
      cat.includes('lainnya');
    if (isExcluded && !product.isDineInOnly) return false;

    const isMakanan = cat.includes('makan') || product.isCooked === true;
    const isMinuman = cat.includes('minum');
    return isMakanan || isMinuman || Boolean(product.isDineInOnly);
  }

  if (normType === 'delivery') {
    if (!services.includes('delivery')) return false;
    if (options.subTab === 'pickup') {
      return services.includes('pickup');
    }
    if (options.subTab === 'dinein') {
      if (!services.includes('dinein')) return false;
      const cat = String(product.kategori || '').toLowerCase().trim();
      const isExcluded =
        cat.includes('sembako') ||
        cat.includes('cemilan') ||
        cat.includes('camilan') ||
        cat.includes('snack') ||
        cat.includes('rokok') ||
        cat.includes('sabun') ||
        cat.includes('lainnya');
      if (isExcluded && !product.isDineInOnly) return false;
      return cat.includes('makan') || cat.includes('minum') || product.isCooked === true || Boolean(product.isDineInOnly);
    }
    return true;
  }

  return true;
}

export function normalizeProduct(p = {}) {
  let availableServices = [];
  if (Array.isArray(p.availableServices) && p.availableServices.length > 0) {
    availableServices = [...new Set(p.availableServices.map((s) => String(s).toLowerCase().trim()))].filter((s) =>
      ['pickup', 'dinein', 'delivery'].includes(s)
    );
  } else if (p.availableInPickup !== undefined || p.availableInDineIn !== undefined || p.availableInDelivery !== undefined) {
    if (p.availableInPickup) availableServices.push('pickup');
    if (p.availableInDineIn) availableServices.push('dinein');
    if (p.availableInDelivery) availableServices.push('delivery');
  } else if (p.isDineInOnly) {
    availableServices = ['dinein'];
  } else if (p.isDineInExcluded) {
    availableServices = ['pickup', 'delivery'];
  } else if (p.isNewProduct) {
    availableServices = ['pickup'];
  } else {
    const cat = String(p.category || p.kategori || '').toLowerCase().trim();
    const isMakanan = cat.includes('makan') || p.isCooked === true;
    const isMinuman = cat.includes('minum');
    if (isMakanan || isMinuman) {
      availableServices = ['pickup', 'dinein', 'delivery'];
    } else {
      availableServices = ['pickup', 'delivery'];
    }
  }

  const isDineInOnly = availableServices.includes('dinein') && !availableServices.includes('pickup') && !availableServices.includes('delivery');

  return {
    id: p.id || `PRD-${Date.now()}`,
    kode: p.barcode || p.kode || p.name || '',
    nama: p.name || p.nama || p.nama_barang || '',
    kategori: p.category || p.kategori || 'Minuman',
    hargaModal: Number(p.purchasePrice ?? p.hargaModal) || 0,
    harga: Number(p.sellingPrice ?? p.harga) || 0,
    stok: Number(p.stock ?? p.stok) || 0,
    minStok: p.minStok !== undefined && p.minStok !== null ? Number(p.minStok) : (p.minStock !== undefined && p.minStock !== null ? Number(p.minStock) : 0),
    satuan: p.unit || p.satuan || 'Pcs',
    status: p.status || 'Aktif',
    foto: p.foto || p.image || '',
    pajakAktif: Boolean(p.pajakAktif),
    pajakJenis: p.pajakJenis || 'PPN',
    pajakPersen: p.pajakPersen !== undefined && p.pajakPersen !== null ? Number(p.pajakPersen) : 10,
    deskripsi: p.deskripsi || '',
    availableServices,
    availableInPickup: availableServices.includes('pickup'),
    availableInDineIn: availableServices.includes('dinein'),
    availableInDelivery: availableServices.includes('delivery'),
    isDineInOnly: Boolean(p.isDineInOnly || isDineInOnly),
    isDineInExcluded: Boolean(p.isDineInExcluded || !availableServices.includes('dinein')),
    dineInCategory: p.dineInCategory || (p.kategori === 'Makanan' ? 'Makanan' : p.kategori === 'Minuman' ? 'Minuman' : ''),
    isCooked: p.isCooked !== undefined ? Boolean(p.isCooked) : undefined,
  };
}

function normalizeSettings(s = {}) {
  return {
    ...DEFAULT_SETTINGS,
    storeName: s.storeName || s.nama || DEFAULT_SETTINGS.storeName,
    address: s.address || s.alamat || DEFAULT_SETTINGS.address,
    phone: s.phone || s.telepon || DEFAULT_SETTINGS.phone,
    footer: s.footerStruk || s.footer || DEFAULT_SETTINGS.footer,
    footerStruk: s.footerStruk || s.footer || DEFAULT_SETTINGS.footer,
    pemilik: s.pemilik || '',
    email: s.email || '',
    npwp: s.npwp || '',
    logo: s.logo || DEFAULT_SETTINGS.logo || '/logo.jpg',
    paymentMethods: {
      ...DEFAULT_PAYMENT_METHODS,
      ...(s.paymentMethods || {}),
    },
    printerSettings: {
      ...DEFAULT_PRINTER_SETTINGS,
      ...(s.printerSettings || {}),
      paperSize: s.printerSettings?.paperSize || '58',
      autoPrint: Boolean(s.printerSettings?.autoPrint),
    },
    pajakTransaksiAktif: Boolean(s.pajakTransaksiAktif),
    pajakTransaksiJenis: s.pajakTransaksiJenis || 'PPN',
    pajakTransaksiPersen: s.pajakTransaksiPersen !== undefined && s.pajakTransaksiPersen !== null ? Number(s.pajakTransaksiPersen) : 10,
    minStockThreshold: Number(s.minStockThreshold) > 0 ? Number(s.minStockThreshold) : 5,
  };
}

function normalizeProductMeta(m = {}) {
  return {
    productId: m.productId || '',
    bestSeller: Boolean(m.bestSeller),
    bestSellerNote: m.bestSellerNote || '',
    promoActive: Boolean(m.promoActive),
    promoTitle: m.promoTitle || '',
    promoType: m.promoType || 'persen',
    promoValue: Number(m.promoValue) || 0,
    promoNote: m.promoNote || '',
    promoStartDate: m.promoStartDate || '',
    promoEndDate: m.promoEndDate || '',
    b1g1: Boolean(m.b1g1 || m.promoType === 'b1g1'),
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

  const [tableSessions, setTableSessions] = useState(() => {
    const stored = getTableSessions();
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

  const persistTableSessions = useCallback((next) => {
    setTableSessions(next);
    saveTableSessions(next);
    const uid = authUidRef.current;
    if (uid) {
      pushItems(uid, 'tableSessions', next, tableSessions).catch((e) =>
        console.warn('Sync table sessions ke Firebase gagal:', e)
      );
    }
  }, [tableSessions]);

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
      logActivity({
        action: 'PRODUCT_CREATED',
        module: 'KATALOG_STOK',
        targetId: normalized.id,
        details: { nama: normalized.nama, harga: normalized.harga, stok: normalized.stok, kategori: normalized.kategori },
        status: 'SUCCESS',
      });
      logAuditTrail({
        module: 'KATALOG_STOK',
        action: 'PRODUCT_CREATED',
        targetId: normalized.id,
        field: 'all',
        before: null,
        after: {
          nama: normalized.nama,
          harga: normalized.harga,
          hargaModal: normalized.hargaModal,
          stok: normalized.stok,
          kategori: normalized.kategori,
          satuan: normalized.satuan,
        },
        details: { note: `Produk "${normalized.nama}" berhasil ditambahkan` },
        status: 'SUCCESS',
      });
    },
    [products, persistProducts]
  );

  const updateProduct = useCallback(
    (updated) => {
      const normalized = normalizeProduct(updated);
      const oldProduct = products.find((p) => p.id === normalized.id);
      persistProducts(
        products.map((p) => (p.id === normalized.id ? normalized : p))
      );
      logActivity({
        action: 'PRODUCT_UPDATED',
        module: 'KATALOG_STOK',
        targetId: normalized.id,
        details: { nama: normalized.nama, harga: normalized.harga, stok: normalized.stok },
        status: 'SUCCESS',
      });
      logAuditTrail({
        module: 'KATALOG_STOK',
        action: 'PRODUCT_UPDATED',
        targetId: normalized.id,
        field: 'product_data',
        before: oldProduct
          ? {
              nama: oldProduct.nama,
              harga: oldProduct.harga,
              hargaModal: oldProduct.hargaModal,
              stok: oldProduct.stok,
              kategori: oldProduct.kategori,
              status: oldProduct.status,
            }
          : null,
        after: {
          nama: normalized.nama,
          harga: normalized.harga,
          hargaModal: normalized.hargaModal,
          stok: normalized.stok,
          kategori: normalized.kategori,
          status: normalized.status,
        },
        details: { note: `Produk "${normalized.nama}" berhasil diperbarui` },
        status: 'SUCCESS',
      });
    },
    [products, persistProducts]
  );

  const deleteProduct = useCallback(
    (id) => {
      const oldProduct = products.find((p) => p.id === id);
      persistProducts(products.filter((p) => p.id !== id));
      persistProductMeta(
        productMeta.filter((m) => m.productId !== id)
      );
      logActivity({
        action: 'PRODUCT_DELETED',
        module: 'KATALOG_STOK',
        targetId: id,
        details: { nama: oldProduct?.nama || id },
        status: 'SUCCESS',
      });
      logAuditTrail({
        module: 'KATALOG_STOK',
        action: 'PRODUCT_DELETED',
        targetId: id,
        field: 'all',
        before: oldProduct || { id },
        after: null,
        details: { note: `Produk "${oldProduct?.nama || id}" dihapus` },
        status: 'SUCCESS',
      });
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
      const generatedToken = `TBL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newTable = {
        id: table.id || `TBL-${Date.now()}`,
        name: (table.name || `Meja ${tables.length + 1}`).trim(),
        capacity: Number(table.capacity) > 0 ? Number(table.capacity) : 4,
        active: table.active !== undefined ? table.active : true,
        qrToken: table.qrToken || generatedToken,
        activeSessionId: null,
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
          t.id === updated.id
            ? {
                ...t,
                ...updated,
                capacity: updated.capacity !== undefined ? Number(updated.capacity) || 4 : t.capacity || 4,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
    },
    [tables, persistTables]
  );

  const regenerateTableQr = useCallback(
    (id) => {
      const nextToken = `TBL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      persistTables(
        tables.map((t) =>
          t.id === id ? { ...t, qrToken: nextToken, updatedAt: new Date().toISOString() } : t
        )
      );
      return nextToken;
    },
    [tables, persistTables]
  );

  const deleteTable = useCallback(
    (id) => {
      persistTables(tables.filter((t) => t.id !== id));
    },
    [tables, persistTables]
  );

  // Buka Sesi Meja Baru secara eksplisit oleh Kasir
  const openTableSession = useCallback(
    (tableId, sessionParams = {}) => {
      const {
        customerName = '',
        kasirUid = 'KASIR',
        kasirName = 'Kasir',
      } = sessionParams;

      const targetTable = tables.find((t) => t.id === tableId);
      if (!targetTable) return null;

      // Cek apakah sudah ada sesi aktif untuk meja ini
      const existingSession = tableSessions.find(
        (s) => s.tableId === tableId && s.status !== 'closed'
      );
      if (existingSession) {
        return existingSession;
      }

      const nowIso = new Date().toISOString();
      const generatedSessionId = `SES-${Date.now().toString().slice(-6)}`;
      const finalCustomerName = customerName.trim() || `Tamu ${targetTable.name}`;

      const newSession = {
        id: generatedSessionId,
        tableId,
        tableName: targetTable.name,
        status: 'active',
        startedAt: nowIso,
        closedAt: null,
        orderIds: [],
        customerName: finalCustomerName,
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        paymentStatus: 'unpaid',
        paymentMethod: null,
        openedByUid: kasirUid,
        openedByName: kasirName,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      persistTables(
        tables.map((t) =>
          t.id === tableId
            ? { ...t, activeSessionId: generatedSessionId, updatedAt: nowIso }
            : t
        )
      );

      persistTableSessions([newSession, ...tableSessions]);

      logActivity({
        actorUid: kasirUid,
        actorName: kasirName,
        actorRole: 'KASIR',
        action: 'SESSION_OPEN',
        module: 'MEJA',
        targetId: tableId,
        sessionId: generatedSessionId,
        details: { tableName: targetTable.name, customerName: finalCustomerName },
        status: 'SUCCESS',
      });

      return newSession;
    },
    [tables, tableSessions, persistTables, persistTableSessions]
  );

  // Unified Order Management: Create Order (Dine In, Delivery, Pickup)
  const createUnifiedOrder = useCallback(
    (orderInput) => {
      const {
        orderType = 'dine_in', // 'dine_in' | 'delivery' | 'pickup'
        source = 'pos_cashier', // 'pos_cashier' | 'qr_menu'
        tableId = null,
        customerName = '',
        customerPhone = '',
        deliveryAddress = '',
        deliveryAddressNote = '',
        deliveryCourier = 'Kurir Toko',
        deliveryCourierPhone = '',
        shippingCost = 0,
        pickupCode = null,
        pickupTime = null,
        items = [],
        discount = 0,
        tax = 0,
        notes = '',
        paymentMethod = null,
        paymentStatus = null,
        initialOrderStatus = null,
      } = orderInput;

      const calcSubtotal = items.reduce(
        (sum, it) => sum + (Number(it.harga) || 0) * (Number(it.qty) || 0),
        0
      );
      const calcTax = Number(tax) || 0;
      const calcDiscount = Number(discount) || 0;
      const calcShipping = Number(shippingCost) || 0;
      const calcTotal = Math.max(0, calcSubtotal - calcDiscount + calcTax + calcShipping);

      const nowIso = new Date().toISOString();
      const generatedOrderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const generatedOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const generatedPickupCode =
        pickupCode ||
        (orderType === 'pickup'
          ? `PU-${Math.floor(1000 + Math.random() * 9000)}`
          : null);

      let targetSessionId = null;
      let targetTable = null;

      if (orderType === 'dine_in' && tableId) {
        targetTable = tables.find((t) => t.id === tableId || t.qrToken === tableId);
        const existingSession = tableSessions.find(
          (s) => s.tableId === targetTable?.id && s.status !== 'closed'
        );

        if (existingSession) {
          targetSessionId = existingSession.id;
        } else {
          // Meja belum ada sesi aktif (baik dipindai via QR Menu atau Kasir): otomatis buat sesi meja aktif baru
          const newSessionId = `SES-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          targetSessionId = newSessionId;
          const isDirectPaid = paymentStatus === 'paid';
          const newSession = {
            id: newSessionId,
            tableId: targetTable?.id || tableId,
            tableName: targetTable?.name || `Meja ${tableId}`,
            status: 'active',
            startedAt: nowIso,
            closedAt: null,
            orderIds: [generatedOrderId],
            customerName: customerName.trim() || `Tamu ${targetTable?.name || ''}`,
            subtotal: source === 'qr_menu' ? 0 : calcSubtotal,
            tax: source === 'qr_menu' ? 0 : calcTax,
            discount: source === 'qr_menu' ? 0 : calcDiscount,
            total: source === 'qr_menu' ? 0 : calcTotal,
            paymentStatus: isDirectPaid ? 'paid' : 'unpaid',
            paymentMethod: isDirectPaid ? paymentMethod || 'Tunai' : null,
            settledBy: isDirectPaid ? 'Kasir' : null,
            notes: notes || '',
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          persistTables(
            tables.map((t) =>
              t.id === targetTable?.id ? { ...t, activeSessionId: newSessionId, updatedAt: nowIso } : t
            )
          );

          persistTableSessions([newSession, ...tableSessions]);

          logAuditTrail({
            module: 'KASIR_POS',
            action: 'TABLE_SESSION_OPENED',
            targetId: newSessionId,
            field: 'status',
            before: null,
            after: { status: 'active', tableId: targetTable?.id || tableId, tableName: targetTable?.name },
            actorName: source === 'qr_menu' ? newSession.customerName : 'Kasir',
            actorRole: source === 'qr_menu' ? 'CUSTOMER' : 'KASIR',
            details: { note: `Sesi meja dibuka via ${source}` },
            status: 'SUCCESS',
          });
        }
      }

      const defaultOrderStatus =
        initialOrderStatus || (source === 'qr_menu' ? 'pending' : 'confirmed');
      const defaultFulfillment =
        source === 'qr_menu'
          ? 'pending'
          : orderType === 'delivery'
          ? 'preparing'
          : 'preparing';
      const defaultPayment =
        paymentStatus || (orderType === 'dine_in' ? 'unpaid' : 'unpaid');

      const newOrder = {
        id: generatedOrderId,
        orderNumber: generatedOrderNumber,
        orderType, // 'dine_in' | 'delivery' | 'pickup'
        source, // 'qr_menu' | 'pos_cashier'
        tableId: orderType === 'dine_in' ? targetTable?.id || tableId : null,
        tableName: orderType === 'dine_in' ? targetTable?.name || null : null,
        sessionId: targetSessionId,
        customerName: customerName.trim() || (orderType === 'dine_in' ? `Tamu ${targetTable?.name || ''}` : 'Umum'),
        customerPhone: customerPhone.trim(),
        deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : null,
        deliveryAddressNote: orderType === 'delivery' ? deliveryAddressNote?.trim() || null : null,
        courier: orderType === 'delivery' ? deliveryCourier : null,
        deliveryCourier: orderType === 'delivery' ? deliveryCourier : null,
        courierPhone: orderType === 'delivery' ? deliveryCourierPhone : null,
        shippingCost: calcShipping,
        pickupCode: generatedPickupCode,
        pickupTime: orderType === 'pickup' ? pickupTime : null,
        items: items.map((it) => ({
          id: it.id,
          nama: it.nama,
          harga: Number(it.harga) || 0,
          qty: Number(it.qty) || 1,
          notes: it.notes || '',
          pajakAktif: Boolean(it.pajakAktif),
          pajakJenis: it.pajakJenis || 'PPN',
          pajakPersen: Number(it.pajakPersen) || 0,
        })),
        subtotal: calcSubtotal,
        discount: calcDiscount,
        tax: calcTax,
        total: calcTotal,
        orderStatus: defaultOrderStatus,
        fulfillmentStatus: defaultFulfillment,
        paymentStatus: defaultPayment,
        paymentMethod: paymentMethod || null,
        cancellationReason: '',
        notes: notes || '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Jika pesanan langsung kasir (confirmed), perbarui tagihan sesi
      if (defaultOrderStatus !== 'pending' && targetSessionId && tableSessions.some((s) => s.id === targetSessionId)) {
        persistTableSessions(
          tableSessions.map((s) => {
            if (s.id !== targetSessionId) return s;
            const updatedOrderIds = [...new Set([...(s.orderIds || []), generatedOrderId])];
            const allSessionOrders = [
              newOrder,
              ...orders.filter(
                (o) =>
                  updatedOrderIds.includes(o.id) &&
                  o.id !== generatedOrderId &&
                  o.orderStatus !== 'cancelled' &&
                  o.orderStatus !== 'rejected' &&
                  o.orderStatus !== 'pending'
              ),
            ];
            const sSub = allSessionOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
            const sTax = allSessionOrders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
            const sDisc = allSessionOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
            const sTot = Math.max(0, sSub - sDisc + sTax);

            const allPaid = allSessionOrders.every((o) => o.paymentStatus === 'paid');

            return {
              ...s,
              orderIds: updatedOrderIds,
              subtotal: sSub,
              tax: sTax,
              discount: sDisc,
              total: sTot,
              paymentStatus: allPaid ? 'paid' : s.paymentStatus === 'paid' ? 'unpaid' : s.paymentStatus,
              updatedAt: nowIso,
            };
          })
        );
      } else if (targetSessionId && tableSessions.some((s) => s.id === targetSessionId)) {
        // Jika order pending dari QR Menu, kaitkan orderId ke sesi tanpa menambah total tagihan
        persistTableSessions(
          tableSessions.map((s) => {
            if (s.id !== targetSessionId) return s;
            return {
              ...s,
              orderIds: [...new Set([...(s.orderIds || []), generatedOrderId])],
              updatedAt: nowIso,
            };
          })
        );
      }

      // Pengurangan stok atomik
      const nextProducts = products.map((p) => {
        const item = items.find((i) => i.id === p.id);
        if (!item) return p;
        return {
          ...p,
          stok: Math.max(0, (Number(p.stok) || 0) - (Number(item.qty) || 0)),
        };
      });
      persistProducts(nextProducts);

      persistOrders([newOrder, ...orders]);

      // Catat ke log
      logActivity({
        actorUid: source === 'qr_menu' ? 'CUSTOMER_QR' : 'KASIR',
        actorName: source === 'qr_menu' ? newOrder.customerName : 'Kasir',
        actorRole: source === 'qr_menu' ? 'CUSTOMER' : 'KASIR',
        action: 'ORDER_SUBMITTED',
        module: 'DINE_IN',
        targetId: newOrder.tableId,
        sessionId: targetSessionId,
        orderId: generatedOrderId,
        details: { total: calcTotal, itemCount: items.length, source },
        status: 'SUCCESS',
      });

      return newOrder;
    },
    [orders, tableSessions, tables, products, persistOrders, persistTableSessions, persistTables, persistProducts]
  );

  // Kasir Menerima Pesanan Dine In (Status Pending -> Confirmed & Gabung Tagihan Sesi)
  const acceptDineInOrder = useCallback(
    (orderId, { kasirUid = 'KASIR', kasirName = 'Kasir' } = {}) => {
      const existing = orders.find((o) => o.id === orderId);
      if (!existing) return false;

      const nowIso = new Date().toISOString();

      const updatedOrders = orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'confirmed',
              fulfillmentStatus: 'preparing',
              confirmedBy: kasirUid,
              confirmedByName: kasirName,
              confirmedAt: nowIso,
              updatedAt: nowIso,
            }
          : o
      );
      persistOrders(updatedOrders);

      // Hitung ulang tagihan sesi dengan order yang sudah diterima ini
      if (existing.sessionId) {
        persistTableSessions(
          tableSessions.map((s) => {
            if (s.id !== existing.sessionId) return s;
            const updatedOrderIds = [...new Set([...(s.orderIds || []), orderId])];
            const allAcceptedOrders = updatedOrders.filter(
              (o) =>
                updatedOrderIds.includes(o.id) &&
                o.orderStatus !== 'cancelled' &&
                o.orderStatus !== 'rejected' &&
                o.orderStatus !== 'pending'
            );

            const sSub = allAcceptedOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
            const sTax = allAcceptedOrders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
            const sDisc = allAcceptedOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
            const sTot = Math.max(0, sSub - sDisc + sTax);

            const allPaid = allAcceptedOrders.length > 0 && allAcceptedOrders.every((o) => o.paymentStatus === 'paid');

            return {
              ...s,
              orderIds: updatedOrderIds,
              subtotal: sSub,
              tax: sTax,
              discount: sDisc,
              total: sTot,
              paymentStatus: allPaid ? 'paid' : s.paymentStatus === 'paid' ? 'unpaid' : s.paymentStatus,
              updatedAt: nowIso,
            };
          })
        );
      }

      logActivity({
        actorUid: kasirUid,
        actorName: kasirName,
        actorRole: 'KASIR',
        action: 'ORDER_ACCEPTED',
        module: 'DINE_IN',
        targetId: existing.tableId,
        sessionId: existing.sessionId,
        orderId,
        details: { orderNumber: existing.orderNumber, total: existing.total },
        status: 'SUCCESS',
      });

      logAuditTrail({
        module: 'KASIR_POS',
        action: 'ORDER_ACCEPTED',
        targetId: orderId,
        field: 'orderStatus & fulfillmentStatus',
        before: { orderStatus: existing.orderStatus, fulfillmentStatus: existing.fulfillmentStatus },
        after: { orderStatus: 'confirmed', fulfillmentStatus: 'preparing' },
        actorUid: kasirUid,
        actorName: kasirName,
        actorRole: 'KASIR',
        details: { note: `Pesanan ${existing.orderNumber || orderId} dikonfirmasi oleh ${kasirName}` },
        status: 'SUCCESS',
      });

      return true;
    },
    [orders, tableSessions, persistOrders, persistTableSessions]
  );

  // Kasir Menolak Pesanan Dine In (Stok Dikembalikan & Tidak Masuk Tagihan)
  const rejectDineInOrder = useCallback(
    (orderId, { reason = 'Ditolak kasir', kasirUid = 'KASIR', kasirName = 'Kasir' } = {}) => {
      const existing = orders.find((o) => o.id === orderId);
      if (!existing) return false;

      const nowIso = new Date().toISOString();

      // Kembalikan stok
      const nextProducts = products.map((p) => {
        const item = (existing.items || []).find((i) => i.id === p.id);
        if (!item) return p;
        return {
          ...p,
          stok: (Number(p.stok) || 0) + (Number(item.qty) || 0),
        };
      });
      persistProducts(nextProducts);

      // Batalkan order
      persistOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                orderStatus: 'cancelled',
                cancellationReason: reason,
                rejectedBy: kasirUid,
                rejectedByName: kasirName,
                rejectedAt: nowIso,
                updatedAt: nowIso,
              }
            : o
        )
      );

      // Pastikan sesi tidak menghitung pesanan yang ditolak
      if (existing.sessionId) {
        persistTableSessions(
          tableSessions.map((s) => {
            if (s.id !== existing.sessionId) return s;
            const remainingOrders = orders.filter(
              (o) =>
                (s.orderIds || []).includes(o.id) &&
                o.id !== orderId &&
                o.orderStatus !== 'cancelled' &&
                o.orderStatus !== 'rejected' &&
                o.orderStatus !== 'pending'
            );
            const sSub = remainingOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
            const sTax = remainingOrders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
            const sDisc = remainingOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
            const sTot = Math.max(0, sSub - sDisc + sTax);

            return {
              ...s,
              subtotal: sSub,
              tax: sTax,
              discount: sDisc,
              total: sTot,
              updatedAt: nowIso,
            };
          })
        );
      }

      logActivity({
        actorUid: kasirUid,
        actorName: kasirName,
        actorRole: 'KASIR',
        action: 'ORDER_REJECTED',
        module: 'DINE_IN',
        targetId: existing.tableId,
        sessionId: existing.sessionId,
        orderId,
        details: { reason, orderNumber: existing.orderNumber },
        status: 'SUCCESS',
      });

      logAuditTrail({
        module: 'KASIR_POS',
        action: 'ORDER_REJECTED',
        targetId: orderId,
        field: 'orderStatus',
        before: { orderStatus: existing.orderStatus },
        after: { orderStatus: 'cancelled', rejectionReason: reason },
        actorUid: kasirUid,
        actorName: kasirName,
        actorRole: 'KASIR',
        details: { reason },
        status: 'SUCCESS',
      });

      return true;
    },
    [orders, products, tableSessions, persistProducts, persistOrders, persistTableSessions]
  );

  // Update status pemrosesan & penolakan pesanan
  const updateOrderProcessingStatus = useCallback(
    (orderId, { orderStatus, fulfillmentStatus, paymentStatus, cancellationReason }) => {
      const existing = orders.find((o) => o.id === orderId);
      if (!existing) return;

      const nowIso = new Date().toISOString();
      const patch = { updatedAt: nowIso };

      if (orderStatus !== undefined) patch.orderStatus = orderStatus;
      if (fulfillmentStatus !== undefined) patch.fulfillmentStatus = fulfillmentStatus;
      if (paymentStatus !== undefined) patch.paymentStatus = paymentStatus;
      if (cancellationReason !== undefined) patch.cancellationReason = cancellationReason;

      // Validasi pembatalan oleh pelanggan:
      // Pelanggan HANYA boleh membatalkan pesanan sebelum dikonfirmasi kasir (orderStatus === 'pending')
      const isCustomerCancellation =
        cancellationReason &&
        (String(cancellationReason).toLowerCase().includes('pelanggan') ||
          String(cancellationReason).toLowerCase().includes('dibatalkan pelanggan'));

      if (isCustomerCancellation && orderStatus === 'cancelled') {
        const isNotPending =
          existing.orderStatus !== 'pending' ||
          (existing.fulfillmentStatus && existing.fulfillmentStatus !== 'pending');

        if (isNotPending) {
          throw new Error('Pesanan telah dikonfirmasi oleh kasir dan tidak dapat dibatalkan.');
        }

        const cleanReason = String(cancellationReason).replace(/^Dibatalkan Pelanggan:\s*/i, '').trim();
        if (!cleanReason) {
          throw new Error('Alasan pembatalan wajib disertakan.');
        }
      }

      // Pengembalian stok otomatis jika pesanan dibatalkan / ditolak kasir
      if (orderStatus === 'cancelled' && existing.orderStatus !== 'cancelled') {
        const nextProducts = products.map((p) => {
          const item = (existing.items || []).find((i) => i.id === p.id);
          if (!item) return p;
          return {
            ...p,
            stok: (Number(p.stok) || 0) + (Number(item.qty) || 0),
          };
        });
        persistProducts(nextProducts);

        if (existing.sessionId) {
          persistTableSessions(
            tableSessions.map((s) => {
              if (s.id !== existing.sessionId) return s;
              const remainingOrders = orders.filter(
                (o) =>
                  (s.orderIds || []).includes(o.id) &&
                  o.id !== orderId &&
                  o.orderStatus !== 'cancelled'
              );
              const sSub = remainingOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
              const sTax = remainingOrders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
              const sDisc = remainingOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
              const sTot = Math.max(0, sSub - sDisc + sTax);
              return {
                ...s,
                subtotal: sSub,
                tax: sTax,
                discount: sDisc,
                total: sTot,
                updatedAt: nowIso,
              };
            })
          );
        }
      }

      // Sinkronkan status pembayaran ke sesi meja jika order bagian dari sesi
      if (paymentStatus === 'paid' && existing.sessionId) {
        persistTableSessions(
          tableSessions.map((s) => {
            if (s.id !== existing.sessionId) return s;
            const sessionOrders = orders
              .map((o) => (o.id === orderId ? { ...o, ...patch } : o))
              .filter(
                (o) => (s.orderIds || []).includes(o.id) && o.orderStatus !== 'cancelled'
              );
            const allPaid =
              sessionOrders.length > 0 &&
              sessionOrders.every((o) => o.paymentStatus === 'paid');
            return {
              ...s,
              paymentStatus: allPaid ? 'paid' : s.paymentStatus,
              updatedAt: nowIso,
            };
          })
        );
      }

      persistOrders(
        orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
      );

      logAuditTrail({
        module: 'KASIR_POS',
        action: 'ORDER_STATUS_CHANGED',
        targetId: orderId,
        field: 'orderStatus & fulfillmentStatus',
        before: {
          orderStatus: existing.orderStatus,
          fulfillmentStatus: existing.fulfillmentStatus,
          paymentStatus: existing.paymentStatus,
        },
        after: {
          orderStatus: patch.orderStatus || existing.orderStatus,
          fulfillmentStatus: patch.fulfillmentStatus || existing.fulfillmentStatus,
          paymentStatus: patch.paymentStatus || existing.paymentStatus,
          cancellationReason: patch.cancellationReason || existing.cancellationReason || null,
        },
        actorName: isCustomerCancellation ? existing.customerName || 'Pelanggan' : 'Kasir',
        actorRole: isCustomerCancellation ? 'CUSTOMER' : 'KASIR',
        details: { note: patch.cancellationReason || `Status diubah ke ${patch.orderStatus || patch.fulfillmentStatus}` },
        status: 'SUCCESS',
      });
    },
    [orders, products, tableSessions, persistOrders, persistProducts, persistTableSessions]
  );

  // Tutup Sesi Meja & Catat Transaksi Final Terkonsolidasi
  const closeTableSession = useCallback(
    (sessionId, settlementData = {}) => {
      const session = tableSessions.find((s) => s.id === sessionId);
      if (!session) return null;

      const nowIso = new Date().toISOString();
      const {
        paymentMethod = 'Tunai',
        paymentCategory = 'Tunai',
        paid = session.total,
        change = 0,
        kasir = 'Admin',
      } = settlementData;

      // Tutup sesi
      persistTableSessions(
        tableSessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: 'closed',
                closedAt: nowIso,
                paymentStatus: 'paid',
                paymentMethod,
                settledBy: kasir,
                updatedAt: nowIso,
              }
            : s
        )
      );

      // Kembalikan meja menjadi tersedia (kosongkan activeSessionId)
      persistTables(
        tables.map((t) =>
          t.id === session.tableId ? { ...t, activeSessionId: null, updatedAt: nowIso } : t
        )
      );

      // Perbarui status pesanan pada sesi ini
      persistOrders(
        orders.map((o) =>
          (session.orderIds || []).includes(o.id)
            ? {
                ...o,
                paymentStatus: 'paid',
                paymentMethod,
                fulfillmentStatus:
                  o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'preparing'
                    ? 'served'
                    : o.fulfillmentStatus,
                updatedAt: nowIso,
              }
            : o
        )
      );

      // Periksa pesanan aktif dalam sesi ini dan pisahkan yang belum dibayar
      const sessionOrders = orders.filter(
        (o) => (session.orderIds || []).includes(o.id) && o.orderStatus !== 'cancelled' && o.orderStatus !== 'rejected'
      );
      const unpaidOrders = sessionOrders.filter((o) => o.paymentStatus !== 'paid');

      let finalTrx = null;

      // HANYA buat transaksi baru jika ada pesanan yang belum dibayar sebelumnya (Cegah pembayaran ganda & duplikasi pendapatan)
      if (unpaidOrders.length > 0) {
        const consolidatedItems = [];
        unpaidOrders.forEach((o) => {
          (o.items || []).forEach((it) => {
            const ex = consolidatedItems.find((ci) => ci.id === it.id);
            if (ex) {
              ex.qty += Number(it.qty) || 0;
            } else {
              consolidatedItems.push({ ...it, qty: Number(it.qty) || 1 });
            }
          });
        });

        const unpaidSubtotal = unpaidOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
        const unpaidDiscount = unpaidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
        const unpaidTax = unpaidOrders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
        const unpaidTotal = Math.max(0, unpaidSubtotal - unpaidDiscount + unpaidTax);

        finalTrx = {
          id: generateTransactionId(),
          tanggal: new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          kasir,
          customer: session.customerName || `Tamu ${session.tableName}`,
          items: consolidatedItems,
          subtotal: unpaidSubtotal,
          discount: unpaidDiscount,
          tax: unpaidTax,
          totalPajak: unpaidTax,
          total: unpaidTotal,
          paid: Number(paid) || unpaidTotal,
          change: Number(change) || 0,
          paymentCategory,
          paymentMethod,
          metode: paymentMethod,
          paymentStatus: 'Lunas',
          status: 'Selesai',
          orderType: 'dine_in',
          tableId: session.tableId,
          tableName: session.tableName,
          sessionId: session.id,
          createdAt: nowIso,
        };

        persistTransactions([finalTrx, ...transactions]);
      }

      logActivity({
        actorUid: settlementData.kasirUid || 'KASIR',
        actorName: kasir,
        actorRole: 'KASIR',
        action: 'SESSION_CLOSED',
        module: 'MEJA',
        sessionId: session.id,
        targetId: session.tableId,
        details: {
          tableName: session.tableName,
          total: session.total,
          unpaidSettled: unpaidOrders.length,
          paymentMethod,
          transactionId: finalTrx?.id || null,
        },
        status: 'SUCCESS',
      });

      logAuditTrail({
        module: 'KASIR_POS',
        action: 'TABLE_SESSION_CLOSED',
        targetId: session.id,
        field: 'status & paymentStatus',
        before: {
          status: session.status,
          paymentStatus: session.paymentStatus,
          total: session.total,
          tableId: session.tableId,
        },
        after: {
          status: 'closed',
          paymentStatus: 'paid',
          paymentMethod,
          total: session.total,
          settledBy: kasir,
          finalTransactionId: finalTrx.id,
        },
        actorName: kasir,
        operatorName: kasir,
        actorRole: 'KASIR',
        details: { note: `Sesi meja ${session.tableName || session.id} ditutup dan dibayar lunas (${paymentMethod})` },
        status: 'SUCCESS',
      });

      return finalTrx;
    },
    [tableSessions, tables, orders, transactions, persistTableSessions, persistTables, persistOrders, persistTransactions]
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
        pajakBarang: Number(data.pajakBarang) || 0,
        pajakTransaksi: Number(data.pajakTransaksi) || 0,
        totalPajak: Number(data.totalPajak ?? data.tax) || 0,
        tax: Number(data.totalPajak ?? data.tax) || 0,
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

      logActivity({
        actorName: transaction.kasir || 'Kasir',
        operatorName: transaction.kasir || null,
        actorRole: 'KASIR',
        action: 'TRANSACTION_COMPLETED',
        module: 'TRANSAKSI',
        targetId: transaction.id,
        details: {
          nomor: transaction.nomor || transaction.id,
          total: transaction.total,
          paymentMethod: transaction.metodePembayaran,
        },
        status: 'SUCCESS',
      });

      logAuditTrail({
        module: 'KASIR_POS',
        action: 'TRANSACTION_CREATED',
        targetId: transaction.id,
        field: 'transaction',
        before: null,
        after: {
          nomor: transaction.nomor || transaction.id,
          total: transaction.total,
          bayar: transaction.bayar,
          kembali: transaction.kembali,
          metodePembayaran: transaction.metodePembayaran,
          kasir: transaction.kasir || 'Kasir',
          itemCount: items.length,
        },
        actorName: transaction.kasir || 'Kasir',
        operatorName: transaction.kasir || null,
        actorRole: 'KASIR',
        details: { note: `Transaksi kasir ${transaction.nomor || transaction.id} berhasil disimpan` },
        status: 'SUCCESS',
      });

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
        storeName: profile.nama !== undefined ? profile.nama : (settings.storeName || ''),
        address: profile.alamat !== undefined ? profile.alamat : (settings.address || ''),
        phone: profile.telepon !== undefined ? profile.telepon : (settings.phone || ''),
        email: profile.email !== undefined ? profile.email : (settings.email || ''),
        pemilik: profile.pemilik !== undefined ? profile.pemilik : (settings.pemilik || ''),
        npwp: profile.npwp !== undefined ? profile.npwp : (settings.npwp || ''),
        logo: profile.logo !== undefined ? profile.logo : (settings.logo || '/logo.jpg'),
        footerStruk: profile.footerStruk !== undefined ? profile.footerStruk : (settings.footerStruk || settings.footer || ''),
        footer: profile.footerStruk !== undefined ? profile.footerStruk : (settings.footer || ''),
      });
    },
    [updateSettings, settings]
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

  const paymentMethods = settings.paymentMethods || DEFAULT_PAYMENT_METHODS;

  const updatePaymentSettings = useCallback(
    (partial = {}) => {
      updateSettings({
        paymentMethods: {
          ...paymentMethods,
          ...partial,
        },
      });
    },
    [paymentMethods, updateSettings]
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

    const normSessions = Array.isArray(remote.tableSessions) ? remote.tableSessions : [];
    setTableSessions(normSessions);
    saveTableSessions(normSessions);

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
      // Seed awal untuk akun baru: tulis katalog & pengaturan default (tetap,
      // bukan data lokal pengguna lain) ke Firestore milik uid ini.
      const seedDataAwal = async (uid, produkAwal, setelanAwal) => {
        await Promise.all([
          pushItems(uid, 'products', produkAwal, []),
          pushItems(uid, 'productMeta', [], []),
          pushItems(uid, 'transactions', [], []),
          pushItems(uid, 'tables', [], []),
          pushItems(uid, 'tableSessions', [], []),
          pushItems(uid, 'orders', [], []),
          pushItems(uid, 'customers', [], []),
          pushItems(uid, 'debts', [], []),
          pushCategories(uid, []),
          pushSettings(uid, setelanAwal),
        ]);
      };

      unsub = onAuthStateChanged(auth, (user) => {

        if (!user) {
          authUidRef.current = null;
          return;
        }

        // Google-only: semua akun yang berhasil diautentikasi Firebase boleh
        // membaca & menulis datanya sendiri di Firestore (per-uid, tanpa
        // pembatas ALLOWED_UID).
        const uid = user.uid;

        (async () => {
          try {
            let targetStoreUid = uid;
            try {
              const uSnap = await getDoc(doc(db, 'app_users', uid));
              if (uSnap.exists()) {
                const uData = uSnap.data();
                if (uData.storeId) {
                  targetStoreUid = uData.storeId;
                }
              }
            } catch {}

            authUidRef.current = targetStoreUid;

            const remote = await fetchUserData(targetStoreUid);
            if (cancelled) return;

            const remoteKosong =
              (!remote.products || remote.products.length === 0) &&
              (!remote.transactions || remote.transactions.length === 0) &&
              !remote.settings;

            if (remoteKosong) {
              // Akun Google baru pertama kali masuk → isi Firestore dengan
              // katalog default, lalu tampilkan katalog itu (jangan biarkan
              // cache lokal pengguna sebelumnya ikut terbaca).
              const produkAwal = dummyProducts.map(normalizeProduct);
              const setelanAwal = normalizeSettings(DEFAULT_SETTINGS);

              await seedDataAwal(uid, produkAwal, setelanAwal);
              if (cancelled) return;

              applyRemote({
                products: produkAwal,
                productMeta: [],
                transactions: [],
                tables: [],
                orders: [],
                customers: [],
                debts: [],
                settings: setelanAwal,
                categories: [],
              });
              return;
            }

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
      nama: settings.storeName || 'Qurmacel Store',
      pemilik: settings.pemilik || '',
      npwp: settings.npwp || '',
      alamat: settings.address || '',
      telepon: settings.phone || '',
      email: settings.email || '',
      logo: settings.logo || '/logo.jpg',
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
      minStockThreshold: settings.minStockThreshold || 5,
      tables,
      tableSessions,
      orders,
      customers,
      debts,
      categories,

      storeProfile,
      printerSettings,
      paymentMethods,
      updatePaymentSettings,

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
      regenerateTableQr,

      createOrder,
      updateOrderStatus,
      deleteOrder,

      createUnifiedOrder,
      updateOrderProcessingStatus,
      openTableSession,
      acceptDineInOrder,
      rejectDineInOrder,
      closeTableSession,

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

      isProductAvailableForService,

      formatRupiah: formatCurrency,
      formatAngka: formatNumber,
    }),
    [
      products,
      productMeta,
      transactions,
      settings,
      tables,
      tableSessions,
      orders,
      customers,
      debts,
      categories,
      storeProfile,
      printerSettings,
      paymentMethods,
      updatePaymentSettings,
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
      regenerateTableQr,
      createOrder,
      updateOrderStatus,
      deleteOrder,
      createUnifiedOrder,
      updateOrderProcessingStatus,
      openTableSession,
      acceptDineInOrder,
      rejectDineInOrder,
      closeTableSession,
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