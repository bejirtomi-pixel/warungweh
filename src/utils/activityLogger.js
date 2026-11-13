import { collection, doc, setDoc, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebase.js';

const STORAGE_KEY = 'warungku_activity_logs';
const AUDIT_STORAGE_KEY = 'warungku_audit_trail_logs';

/**
 * Format identitas Pelaku secara jelas dan konsisten:
 * Super Admin: nama pengguna dan label SUPER ADMIN
 * Admin: nama pengguna dan label ADMIN
 * Kasir: nama petugas yang diinput secara mandiri dan label KASIR
 */
export function resolveCurrentActorContext() {
  try {
    const cashierOp = JSON.parse(localStorage.getItem('qurmacel_cashier_operator') || 'null');
    if (cashierOp?.name) {
      return {
        actorUid: cashierOp.uid || 'KASIR',
        actorName: cashierOp.name,
        operatorName: cashierOp.name,
        actorRole: 'KASIR',
        actorEmail: 'kasir@gmail.com',
      };
    }
  } catch {}

  try {
    const activeUser = JSON.parse(localStorage.getItem('qurmacel_active_user') || 'null');
    if (activeUser) {
      return {
        actorUid: activeUser.uid || 'USER',
        actorName: activeUser.displayName || activeUser.username || 'Pengguna',
        actorRole: activeUser.role || 'ADMIN',
        actorEmail: activeUser.email || null,
      };
    }
  } catch {}

  if (typeof window !== 'undefined' && window.__QURMACEL_ACTOR__) {
    return window.__QURMACEL_ACTOR__;
  }

  return null;
}

export function formatActorInfo(log) {
  if (!log) {
    return {
      displayName: 'Tidak Diketahui',
      badgeText: 'UNKNOWN',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      accountEmail: null,
    };
  }

  const role = String(log.actorRole || '').toUpperCase().trim();
  const email = (log.actorEmail || '').toLowerCase().trim();
  const isCustomer = role === 'CUSTOMER' || log.source === 'CUSTOMER_QR';

  let displayName = '';
  let badgeText = '';
  let badgeClass = '';

  if (role === 'SUPER_ADMIN' || email === 'qurmacel@gmail.com') {
    // Super Admin: Qurmacel — SUPER ADMIN
    displayName = 'Qurmacel';
    if (
      log.actorName &&
      log.actorName !== 'Kasir' &&
      !log.actorName.includes('@') &&
      log.actorName.toLowerCase() !== 'qurmacel'
    ) {
      displayName = log.actorName;
    }
    badgeText = 'SUPER ADMIN';
    badgeClass = 'bg-purple-100 text-purple-700 border border-purple-200';
  } else if (role === 'ADMIN' || email === 'admin@gmail.com') {
    // Admin: Admin Toko — ADMIN
    displayName = 'Admin Toko';
    if (
      log.actorName &&
      log.actorName !== 'Kasir' &&
      !log.actorName.includes('@') &&
      log.actorName.toLowerCase() !== 'admin'
    ) {
      displayName = log.actorName;
    }
    badgeText = 'ADMIN';
    badgeClass = 'bg-blue-100 text-blue-700 border border-blue-200';
  } else if (role === 'KASIR' || email === 'kasir@gmail.com' || email === 'kasir@qurmacel.com') {
    // Kasir: Utamakan nama petugas yang diinput secara mandiri saat sesi kasir aktif
    if (log.operatorName && log.operatorName.trim()) {
      displayName = log.operatorName.trim();
    } else if (
      log.actorName &&
      log.actorName.trim() &&
      log.actorName !== 'Kasir' &&
      log.actorName !== 'Sistem' &&
      !log.actorName.includes('@') &&
      log.actorName.toLowerCase() !== 'kasir toko'
    ) {
      displayName = log.actorName.trim();
    } else {
      // Jika terdapat aktivitas Kasir tanpa sesi atau nama petugas, tampilkan identitas sebagai tidak diketahui
      displayName = 'Kasir (Tidak Diketahui)';
    }
    badgeText = 'KASIR';
    badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  } else if (isCustomer) {
    // Pelanggan QR
    displayName = log.actorName || 'Pelanggan Meja';
    badgeText = 'PELANGGAN QR';
    badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
  } else {
    displayName = log.actorName || 'Sistem';
    badgeText = role || 'SISTEM';
    badgeClass = 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  return {
    displayName,
    badgeText,
    badgeClass,
    accountEmail: log.actorEmail || (email || null),
  };
}

/**
 * Baca log aktivitas dari local storage sebagai cache fallback
 */
export function getLocalActivityLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Gagal membaca cache activity logs:', err);
    return [];
  }
}

/**
 * Simpan log aktivitas ke cache local storage (maksimal 200 log terbaru)
 */
function saveLocalActivityLog(entry) {
  try {
    const current = getLocalActivityLogs();
    const updated = [entry, ...current.filter((x) => x.id !== entry.id)].slice(0, 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Gagal menulis cache activity log:', err);
  }
}

/**
 * Mencatat aktivitas ke Firestore activity_logs dan local cache
 */
export async function logActivity({
  actorUid = null,
  actorEmail = null,
  actorName = null,
  operatorName = null,
  actorRole = null,
  action = 'UNKNOWN_ACTION',
  module = 'GENERAL',
  targetId = null,
  sessionId = null,
  orderId = null,
  details = null,
  source = null,
  status = 'SUCCESS',
}) {
  const fallbackActor = resolveCurrentActorContext();
  const resolvedUid = actorUid || fallbackActor?.actorUid || 'SYSTEM';
  const resolvedRole = actorRole || fallbackActor?.actorRole || 'SYSTEM';
  const resolvedName = actorName || fallbackActor?.actorName || (resolvedRole === 'SUPER_ADMIN' ? 'Qurmacel' : resolvedRole === 'ADMIN' ? 'Admin Toko' : 'Sistem');
  const resolvedEmail = actorEmail || fallbackActor?.actorEmail || null;
  const resolvedOperator = operatorName || fallbackActor?.operatorName || (resolvedRole === 'KASIR' && resolvedName && resolvedName !== 'Kasir' ? resolvedName : null);

  const nowIso = new Date().toISOString();
  const activityId = `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const resolvedSource = source || (resolvedRole === 'CUSTOMER' || resolvedUid === 'CUSTOMER_QR' ? 'CUSTOMER_QR' : 'pos_internal');

  const entry = {
    id: activityId,
    activityId,
    timestamp: nowIso,
    actorUid: resolvedUid,
    actorEmail: resolvedEmail,
    actorName: resolvedName,
    operatorName: resolvedOperator,
    actorRole: resolvedRole,
    action,
    module,
    targetId: targetId ? String(targetId) : null,
    sessionId: sessionId ? String(sessionId) : null,
    orderId: orderId ? String(orderId) : null,
    details: details ? (typeof details === 'object' ? details : { note: details }) : {},
    source: resolvedSource,
    status: status || 'SUCCESS',
  };

  // 1. Simpan ke local cache agar langsung instan terlihat di antarmuka
  saveLocalActivityLog(entry);

  // 2. Tulis secara asinkron ke Firestore activity_logs (immutable)
  try {
    const docRef = doc(db, 'activity_logs', activityId);
    await setDoc(docRef, entry);
  } catch (err) {
    // Jangan lempar error agar tidak memblokir alur operasional kasir
    console.warn('Gagal sinkron log aktivitas ke Firestore:', err);
  }

  return entry;
}

/**
 * Mengambil log aktivitas dari Firestore dengan fallback ke cache lokal
 */
export async function fetchActivityLogs(maxItems = 150) {
  try {
    const logsRef = collection(db, 'activity_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), firestoreLimit(maxItems));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const remoteLogs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Update local storage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteLogs.slice(0, 200)));
      return remoteLogs;
    }
  } catch (err) {
    console.warn('Gagal mengambil activity logs dari Firestore, memuat dari local cache:', err);
  }

  return getLocalActivityLogs();
}

/**
 * Baca log audit trail dari local storage sebagai cache fallback
 */
export function getLocalAuditTrailLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Gagal membaca cache audit trail logs:', err);
    return [];
  }
}

/**
 * Simpan log audit trail ke cache local storage (maksimal 200 log terbaru)
 */
function saveLocalAuditTrailLog(entry) {
  try {
    const current = getLocalAuditTrailLogs();
    const updated = [entry, ...current.filter((x) => x.id !== entry.id)].slice(0, 200);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Gagal menulis cache audit trail log:', err);
  }
}

/**
 * Mencatat Audit Trail atas perubahan data penting:
 * - Data sebelum (before) & sesudah (after)
 * - Pelaku & peran
 * - Modul: 'MANAJEMEN_PENGGUNA' | 'KATALOG_STOK' | 'KASIR_POS'
 * - Target ID & Timestamp
 */
export async function logAuditTrail({
  module = 'GENERAL',
  action = 'DATA_UPDATED',
  targetId = null,
  field = null,
  before = null,
  after = null,
  actorUid = null,
  actorEmail = null,
  actorName = null,
  operatorName = null,
  actorRole = null,
  details = null,
  status = 'SUCCESS',
}) {
  const fallbackActor = resolveCurrentActorContext();
  const resolvedUid = actorUid || fallbackActor?.actorUid || 'SYSTEM';
  const resolvedRole = actorRole || fallbackActor?.actorRole || 'ADMIN';
  const resolvedName = actorName || fallbackActor?.actorName || (resolvedRole === 'SUPER_ADMIN' ? 'Qurmacel' : resolvedRole === 'ADMIN' ? 'Admin Toko' : 'Sistem');
  const resolvedEmail = actorEmail || fallbackActor?.actorEmail || null;
  const resolvedOperator = operatorName || fallbackActor?.operatorName || (resolvedRole === 'KASIR' && resolvedName && resolvedName !== 'Kasir' ? resolvedName : null);

  const nowIso = new Date().toISOString();
  const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const entry = {
    id: auditId,
    auditId,
    timestamp: nowIso,
    module,
    action,
    targetId: targetId ? String(targetId) : null,
    field: field || null,
    before: before !== undefined ? before : null,
    after: after !== undefined ? after : null,
    actorUid: resolvedUid,
    actorEmail: resolvedEmail,
    actorName: resolvedName,
    operatorName: resolvedOperator,
    actorRole: resolvedRole,
    details: details ? (typeof details === 'object' ? details : { note: details }) : {},
    status: status || 'SUCCESS',
  };

  // 1. Simpan ke local cache agar langsung instan terlihat
  saveLocalAuditTrailLog(entry);

  // 2. Tulis secara asinkron ke Firestore audit_trail
  try {
    const docRef = doc(db, 'audit_trail', auditId);
    await setDoc(docRef, entry);
  } catch (err) {
    console.warn('Gagal sinkron audit trail ke Firestore:', err);
  }

  return entry;
}

/**
 * Mengambil log audit trail dari Firestore dengan fallback ke cache lokal
 */
export async function fetchAuditTrailLogs(maxItems = 150) {
  try {
    const auditRef = collection(db, 'audit_trail');
    const q = query(auditRef, orderBy('timestamp', 'desc'), firestoreLimit(maxItems));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const remoteLogs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Update local storage cache
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(remoteLogs.slice(0, 200)));
      return remoteLogs;
    }
  } catch (err) {
    console.warn('Gagal mengambil audit trail logs dari Firestore, memuat dari local cache:', err);
  }

  return getLocalAuditTrailLogs();
}
