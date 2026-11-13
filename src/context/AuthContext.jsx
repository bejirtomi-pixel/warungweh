import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import {
  ROLES,
  USER_STATUS,
  bootstrapSuperAdmin,
  fetchUserProfile,
  saveUserProfile,
  isAccountApproved,
  isAccountPending,
  isAccountSuspended,
  isAccountRejected,
  isAccountUndetermined,
  normalizeRole,
  isRoleAssigned,
  DEFAULT_PERMISSIONS,
  DEFAULT_SUPER_ADMIN_EMAILS,
  DEFAULT_ADMIN_EMAILS,
  DEFAULT_CASHIER_EMAILS,
} from '../utils/userManagement.js';
import { logActivity } from '../utils/activityLogger.js';
import { clearSession, clearSessionKicked, saveSession } from '../utils/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sesi Petugas Kasir Mandiri
  const [cashierOperator, setCashierOperatorState] = useState(() => {
    try {
      const raw = localStorage.getItem('qurmacel_cashier_operator');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Fungsi reload profile dari Firestore
  const reloadProfile = useCallback(async (uid = null) => {
    const targetUid = uid || firebaseUser?.uid;
    if (!targetUid) return null;

    let profile = null;
    if (firebaseUser) {
      profile = await bootstrapSuperAdmin(firebaseUser);
    }
    if (!profile) {
      profile = await fetchUserProfile(targetUid);
    }

    if (profile) {
      setUserProfile(profile);
      saveSession({
        email: profile.email || '',
        nama: profile.displayName || profile.username || profile.email?.split('@')[0] || 'Pengguna',
        role: profile.role || ROLES.KASIR,
        status: profile.status || USER_STATUS.PENDING,
        loginAt: new Date().toISOString(),
      });
    }
    return profile;
  }, [firebaseUser]);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (!user) {
        setFirebaseUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(user);

      try {
        // 1. Cek bootstrap jika Super Admin / Admin / Kasir utama
        let profile = await bootstrapSuperAdmin(user);

        // 2. Jika bukan akun utama, baca profil dari app_users
        if (!profile) {
          profile = await fetchUserProfile(user.uid);
        }

        // 3. Jika akun Google baru yang belum pernah terdaftar sama sekali, buat entri pending otomatis
        if (!profile) {
          const nowIso = new Date().toISOString();
          const pendingProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Baru',
            photoURL: user.photoURL || '',
            role: ROLES.KASIR,
            status: USER_STATUS.PENDING,
            permissions: [],
            createdAt: nowIso,
            source: 'google_signin_self',
          };

          await setDoc(doc(db, 'app_users', user.uid), pendingProfile);

          await setDoc(doc(db, 'registration_requests', `REQ-${user.uid}`), {
            id: `REQ-${user.uid}`,
            uid: user.uid,
            email: user.email || '',
            displayName: pendingProfile.displayName,
            method: 'Google',
            requestedAt: nowIso,
            status: USER_STATUS.PENDING,
          });

          await logActivity({
            actorUid: user.uid,
            actorEmail: user.email,
            actorName: pendingProfile.displayName,
            operatorName: null,
            actorRole: 'CUSTOMER',
            action: 'USER_SELF_REGISTERED',
            module: 'USER_MANAGEMENT',
            targetId: user.uid,
            details: { method: 'Google', email: user.email },
            status: 'SUCCESS',
          });

          profile = pendingProfile;
        }

        if (!cancelled) {
          setUserProfile(profile);
          saveSession({
            email: profile.email || user.email || '',
            nama: profile.displayName || profile.username || user.displayName || profile.email?.split('@')[0] || 'Pengguna',
            role: profile.role || ROLES.KASIR,
            status: profile.status || USER_STATUS.PENDING,
            loginAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Gagal sinkron profil autentikasi:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Identifikasi identitas akun secara dinamis
  const email = (firebaseUser?.email || userProfile?.email || '').toLowerCase().trim();
  const isRootSuper = email === 'qurmacel@gmail.com';

  const normalizedRole = normalizeRole(userProfile?.role);
  const role = isRootSuper ? ROLES.SUPER_ADMIN : normalizedRole;
  const hasAssignedRole = isRoleAssigned(role);

  const rawStatus = userProfile?.status;
  const isApproved = isRootSuper || isAccountApproved(rawStatus);

  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdmin = role === ROLES.ADMIN;
  const isKasir = role === ROLES.KASIR;

  const isActive = hasAssignedRole && isApproved;
  const isPending = !isActive && (isAccountPending(rawStatus) || !hasAssignedRole || isAccountUndetermined(rawStatus));
  const isSuspended = !isActive && isAccountSuspended(rawStatus);
  const isRejected = !isActive && isAccountRejected(rawStatus);
  const status = isRootSuper ? USER_STATUS.APPROVED : (rawStatus || 'belum_ditentukan');

  // Sesi Kasir Mandiri Handlers
  const isCashierShiftActive = Boolean(isKasir && cashierOperator?.name);

  const setCashierOperator = useCallback(
    async (operatorNameInput) => {
      const cleanName = String(operatorNameInput || '').trim();
      if (!cleanName) return false;
      const opData = {
        name: cleanName,
        startedAt: new Date().toISOString(),
      };
      setCashierOperatorState(opData);
      try {
        localStorage.setItem('qurmacel_cashier_operator', JSON.stringify(opData));
      } catch {}

      // Catat ke audit trail
      await logActivity({
        actorUid: firebaseUser?.uid || 'KASIR',
        actorEmail: firebaseUser?.email || null,
        actorName: cleanName,
        operatorName: cleanName,
        actorRole: ROLES.KASIR,
        action: 'CASHIER_SHIFT_START',
        module: 'TRANSAKSI',
        details: { operator: cleanName, startedAt: opData.startedAt },
        status: 'SUCCESS',
      });
      return true;
    },
    [firebaseUser]
  );

  const clearCashierOperator = useCallback(async () => {
    const currentOp = cashierOperator?.name;
    if (currentOp) {
      try {
        await logActivity({
          actorUid: firebaseUser?.uid || 'KASIR',
          actorEmail: firebaseUser?.email || null,
          actorName: currentOp,
          operatorName: currentOp,
          actorRole: ROLES.KASIR,
          action: 'CASHIER_SHIFT_END',
          module: 'TRANSAKSI',
          details: { operator: currentOp, endedAt: new Date().toISOString() },
          status: 'SUCCESS',
        });
      } catch {}
    }
    setCashierOperatorState(null);
    try {
      localStorage.removeItem('qurmacel_cashier_operator');
    } catch {}
  }, [cashierOperator, firebaseUser]);

  // Display Name Terpadu untuk Pelaku Aktivitas
  const currentUserDisplay = useMemo(() => {
    if (isSuperAdmin) {
      return userProfile?.displayName && userProfile.displayName !== 'Kasir'
        ? userProfile.displayName
        : 'Qurmacel';
    }
    if (isAdmin) {
      return userProfile?.displayName && userProfile.displayName !== 'Kasir'
        ? userProfile.displayName
        : 'Admin Toko';
    }
    if (isKasir) {
      return cashierOperator?.name || 'Kasir (Tidak Diketahui)';
    }
    return userProfile?.displayName || 'Pengguna';
  }, [isSuperAdmin, isAdmin, isKasir, userProfile, cashierOperator]);

  // Granular Permission Verifier
  const hasPermission = useCallback(
    (permKey) => {
      if (!isActive) return false;
      if (isSuperAdmin) return true; // Super Admin selalu memiliki Full System Access
      const userPerms =
        Array.isArray(userProfile?.permissions) && userProfile.permissions.length > 0
          ? userProfile.permissions
          : (DEFAULT_PERMISSIONS[role] || []);
      if (userPerms.includes('*')) return true;
      return userPerms.includes(permKey);
    },
    [isActive, isSuperAdmin, role, userProfile]
  );

  // Sync active user to local storage for background actors & loggers
  useEffect(() => {
    if (userProfile && firebaseUser) {
      try {
        localStorage.setItem(
          'qurmacel_active_user',
          JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: currentUserDisplay || userProfile.displayName || firebaseUser.displayName,
            role,
            status,
          })
        );
      } catch {}
    } else if (!firebaseUser) {
      try {
        localStorage.removeItem('qurmacel_active_user');
      } catch {}
    }
  }, [userProfile, firebaseUser, currentUserDisplay, role, status]);

  // Page Access Verifier
  const hasPageAccess = useCallback(
    (pageName) => {
      if (!isActive) return false;
      if (isSuperAdmin) return true;
      const key = pageName.startsWith('page.') ? pageName : `page.${pageName}`;
      return hasPermission(key);
    },
    [isActive, isSuperAdmin, hasPermission]
  );

  // Helper pencatatan aktivitas terikat user aktif & operator kasir
  const logCurrentAction = useCallback(
    async ({ action, module, targetId = null, sessionId = null, orderId = null, details = null, status = 'SUCCESS' }) => {
      const opName = isKasir ? (cashierOperator?.name || null) : null;
      const actorDisplayName = isKasir
        ? (opName || 'Kasir (Tidak Diketahui)')
        : currentUserDisplay;

      return logActivity({
        actorUid: firebaseUser?.uid || 'ANONYMOUS',
        actorEmail: firebaseUser?.email || null,
        actorName: actorDisplayName,
        operatorName: opName,
        actorRole: role,
        action,
        module,
        targetId,
        sessionId,
        orderId,
        details,
        source: 'pos_internal',
        status,
      });
    },
    [firebaseUser, role, isKasir, cashierOperator, currentUserDisplay]
  );

  // Sign out terpusat
  const logout = useCallback(async () => {
    if (isKasir && cashierOperator?.name) {
      await clearCashierOperator();
    }
    try {
      await firebaseSignOut(auth);
    } catch {}
    clearSession();
    clearSessionKicked();
    setFirebaseUser(null);
    setUserProfile(null);
  }, [isKasir, cashierOperator, clearCashierOperator]);

  const value = useMemo(
    () => ({
      user: firebaseUser,
      userProfile,
      role,
      status,
      loading,
      isSuperAdmin,
      isAdmin,
      isKasir,
      isActive,
      isPending,
      isSuspended,
      isRejected,
      hasPermission,
      hasPageAccess,
      reloadProfile,
      logCurrentAction,
      logout,
      cashierOperator,
      isCashierShiftActive,
      setCashierOperator,
      clearCashierOperator,
      currentUserDisplay,
    }),
    [
      firebaseUser,
      userProfile,
      role,
      status,
      loading,
      isSuperAdmin,
      isAdmin,
      isKasir,
      isActive,
      isPending,
      isSuspended,
      isRejected,
      hasPermission,
      hasPageAccess,
      reloadProfile,
      logCurrentAction,
      logout,
      cashierOperator,
      isCashierShiftActive,
      setCashierOperator,
      clearCashierOperator,
      currentUserDisplay,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
