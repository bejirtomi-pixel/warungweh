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

function normalizeProduct(p = {}) {
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
        targetTable = tables.find((t) => t.id === tableId);
        const existingSession = tableSessions.find(
          (s) => s.tableId === tableId && s.status !== 'closed'
        );

        if (existingSession) {
          targetSessionId = existingSession.id;
        } else {
          // Buat sesi meja baru jika belum ada sesi aktif
          const newSessionId = `SES-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          targetSessionId = newSessionId;
          const newSession = {
            id: newSessionId,
            tableId,
            tableName: targetTable?.name || `Meja ${tableId}`,
            status: 'active',
            startedAt: nowIso,
            closedAt: null,
            orderIds: [generatedOrderId],
            customerName: customerName.trim() || `Tamu ${targetTable?.name || ''}`,
            subtotal: calcSubtotal,
            tax: calcTax,
            discount: calcDiscount,
            total: calcTotal,
            paymentStatus: 'unpaid',
            paymentMethod: null,
            settledBy: null,
            notes: notes || '',
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          persistTables(
            tables.map((t) =>
              t.id === tableId ? { ...t, activeSessionId: newSessionId, updatedAt: nowIso } : t
            )
          );

          persistTableSessions([newSession, ...tableSessions]);
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
        tableId: orderType === 'dine_in' ? tableId : null,
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

      // Jika pesanan tambahan pada sesi yang ada, perbarui daftar order dan hitung tagihan konsolidasi
      if (targetSessionId && tableSessions.some((s) => s.id === targetSessionId)) {
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
                  o.orderStatus !== 'cancelled'
              ),
            ];
            const sSub = allSessionOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
            const sTax = allSessionOrders.reduce((sum, o) => sum + (Number(o.tax) || 0), 0);
            const sDisc = allSessionOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
            const sTot = Math.max(0, sSub - sDisc + sTax);

            return {
              ...s,
              orderIds: updatedOrderIds,
              subtotal: sSub,
              tax: sTax,
              discount: sDisc,
              total: sTot,
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
      return newOrder;
    },
    [orders, tableSessions, tables, products, persistOrders, persistTableSessions, persistTables, persistProducts]
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

      persistOrders(
        orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
      );
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

      // Gabungkan seluruh item pesanan dari sesi ini menjadi satu transaksi final
      const sessionOrders = orders.filter(
        (o) => (session.orderIds || []).includes(o.id) && o.orderStatus !== 'cancelled'
      );
      const consolidatedItems = [];
      sessionOrders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const ex = consolidatedItems.find((ci) => ci.id === it.id);
          if (ex) {
            ex.qty += Number(it.qty) || 0;
          } else {
            consolidatedItems.push({ ...it, qty: Number(it.qty) || 1 });
          }
        });
      });

      const finalTrx = {
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
        subtotal: session.subtotal,
        discount: session.discount,
        tax: session.tax,
        totalPajak: session.tax,
        total: session.total,
        paid: Number(paid) || session.total,
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

        authUidRef.current = uid;

        (async () => {
          try {
            const remote = await fetchUserData(uid);
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