import { db, ensureFirebaseAuth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'customer';
  tier: 'Standard' | 'VIP';
  status: 'active' | 'suspended' | 'expired';
  createdAt: number;
  pricePaid: number;
  expiresAt?: string; // License Expiry Date (YYYY-MM-DD)
}

const STORAGE_KEY = 'df_user_registry_v1';

// Helper to convert email into safe Firestore document key
export function getEmailDocKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
}

// Default Admin Account
export const DEFAULT_ADMIN: UserAccount = {
  id: 'usr_admin_001',
  email: 'work.xuanphuc@gmail.com',
  password: 'toantin1',
  name: 'Xuan Phuc (Master Admin)',
  role: 'admin',
  tier: 'VIP',
  status: 'active',
  createdAt: Date.now(),
  pricePaid: 0
};

// Initial Seed Users (includes created customers for immediate zero-latency ingress)
export const INITIAL_USERS: UserAccount[] = [
  DEFAULT_ADMIN,
  {
    id: 'usr_cust_101',
    email: 'client.demo@gmail.com',
    password: 'client123',
    name: 'Demo Client User',
    role: 'customer',
    tier: 'Standard',
    status: 'active',
    createdAt: 1724100000000,
    pricePaid: 399000
  },
  {
    id: 'usr_cust_102',
    email: 'daihoang.forwork@gmail.com',
    password: 'hello123',
    name: 'Dai Hoang',
    role: 'customer',
    tier: 'Standard',
    status: 'active',
    createdAt: Date.now(),
    pricePaid: 49
  }
];

// ---------------- LOCAL STORAGE HELPERS ----------------

export function getUsersRegistry(): UserAccount[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    
    // Merge any INITIAL_USERS that might be missing in local storage
    const map = new Map<string, UserAccount>();
    INITIAL_USERS.forEach(u => map.set(u.email.toLowerCase(), u));
    parsed.forEach((u: UserAccount) => {
      if (u && u.email) map.set(u.email.toLowerCase(), u);
    });

    const merged = Array.from(map.values());
    return merged;
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function saveUsersRegistry(users: UserAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ---------------- CLOUD FIRESTORE SYNCHRONIZATION ----------------
// Always uses paths under 'users/{userId}/...' to strictly comply with Firestore security rules

export async function syncUsersRegistryFromCloud(): Promise<UserAccount[]> {
  const localList = getUsersRegistry();
  if (!db) return localList;

  try {
    await ensureFirebaseAuth();

    const userMap = new Map<string, UserAccount>();
    INITIAL_USERS.forEach(u => userMap.set(u.email.toLowerCase(), u));

    // 1. Fetch unified users document at 'users/system_registry/accounts_list/all_users'
    try {
      const configSnap = await getDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'));
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data && Array.isArray(data.users)) {
          data.users.forEach((u: UserAccount) => {
            if (u && u.email) userMap.set(u.email.toLowerCase(), u);
          });
        }
      }
    } catch (e) {
      console.warn("Could not read users document:", e);
    }

    // 2. Fetch all user docs under 'users/admin_registry/user_accounts'
    try {
      const querySnap = await getDocs(collection(db, 'users', 'admin_registry', 'user_accounts'));
      querySnap.forEach((docSnap) => {
        const data = docSnap.data() as UserAccount;
        if (data && data.email && data.password) {
          userMap.set(data.email.toLowerCase(), data);
        }
      });
    } catch (e) {
      console.warn("Could not query user_accounts collection:", e);
    }

    // 3. Merge Local Users
    localList.forEach(u => {
      if (!userMap.has(u.email.toLowerCase())) {
        userMap.set(u.email.toLowerCase(), u);
      }
    });

    const merged = Array.from(userMap.values());
    saveUsersRegistry(merged);

    // 4. Save merged list to Cloud Firestore in background with verified paths
    try {
      setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), { 
        users: merged,
        updatedAt: Date.now() 
      }).catch(() => {});

      merged.forEach(u => {
        const docKey = getEmailDocKey(u.email);
        setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), u).catch(() => {});
        setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), u).catch(() => {});
      });
    } catch (e) {}

    return merged;
  } catch (err) {
    console.warn('Could not sync user registry from Cloud Firestore, using local cache.', err);
    return localList;
  }
}

// ---------------- AUTHENTICATION ----------------

export async function authenticateUserAsync(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  // 1. Admin Master Override
  if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase() && cleanPass === DEFAULT_ADMIN.password) {
    return { success: true, user: DEFAULT_ADMIN };
  }

  // 2. Check Initial / Local Cache First
  let users = getUsersRegistry();
  let found = users.find(u => u.email.toLowerCase() === cleanEmail);

  // 3. If not found in local cache, ensure Firebase Auth and fetch from Cloud
  if (!found && db) {
    try {
      await ensureFirebaseAuth();

      const docKey = getEmailDocKey(cleanEmail);

      // Check per-user path: 'users/{docKey}/account_profile/credentials'
      const perUserSnap = await getDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'));
      if (perUserSnap.exists()) {
        found = perUserSnap.data() as UserAccount;
      }

      // Check admin accounts path: 'users/admin_registry/user_accounts/{docKey}'
      if (!found) {
        const adminDocSnap = await getDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey));
        if (adminDocSnap.exists()) {
          found = adminDocSnap.data() as UserAccount;
        }
      }

      // Check unified list path: 'users/system_registry/accounts_list/all_users'
      if (!found) {
        const configSnap = await getDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'));
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data && Array.isArray(data.users)) {
            found = data.users.find((u: UserAccount) => u.email.toLowerCase() === cleanEmail);
          }
        }
      }

      if (found) {
        users = [found, ...users.filter(u => u.email.toLowerCase() !== cleanEmail)];
        saveUsersRegistry(users);
      }
    } catch (e) {
      console.warn('Error querying Firestore for user:', e);
    }
  }

  // 4. If still not found, run full cloud sync
  if (!found && db) {
    try {
      const synced = await syncUsersRegistryFromCloud();
      found = synced.find(u => u.email.toLowerCase() === cleanEmail);
    } catch (e) {}
  }

  if (!found) {
    return { 
      success: false, 
      message: 'Account does not exist! Please check your email or contact Admin.' 
    };
  }

  if (found.password !== cleanPass) {
    return { success: false, message: 'Incorrect password! Please try again.' };
  }

  if (found.status === 'suspended') {
    return { success: false, message: 'Your account is suspended. Please contact Admin!' };
  }

  // License Expiry Check
  if (found.expiresAt) {
    const today = new Date().toISOString().split('T')[0];
    if (found.expiresAt < today) {
      updateUserStatus(found.id, 'expired');
      return { success: false, message: `Your license expired on ${found.expiresAt}. Please renew your plan!` };
    }
  }

  if (found.status === 'expired') {
    return { success: false, message: 'Your subscription package has expired. Please upgrade or renew!' };
  }

  return { success: true, user: found };
}

// Synchronous wrapper fallback
export function authenticateUser(emailInput: string, passwordInput: string): {
  success: boolean;
  user?: UserAccount;
  message?: string;
} {
  const users = getUsersRegistry();
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase() && cleanPass === DEFAULT_ADMIN.password) {
    return { success: true, user: DEFAULT_ADMIN };
  }

  const found = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return { success: false, message: 'Email is not registered in the system!' };
  }

  if (found.password !== cleanPass) {
    return { success: false, message: 'Incorrect password!' };
  }

  if (found.status === 'suspended') {
    return { success: false, message: 'Your account is suspended. Please contact System Administrator!' };
  }

  if (found.expiresAt) {
    const today = new Date().toISOString().split('T')[0];
    if (found.expiresAt < today) {
      updateUserStatus(found.id, 'expired');
      return { success: false, message: `Your license key expired on ${found.expiresAt}. Please renew your subscription!` };
    }
  }

  if (found.status === 'expired') {
    return { success: false, message: 'Your subscription package has expired. Please upgrade or renew!' };
  }

  return { success: true, user: found };
}

// ---------------- CREATE / UPDATE / DELETE ----------------

export async function createUserAccountAsync(
  email: string,
  password: string,
  name: string,
  tier: 'Standard' | 'VIP' = 'Standard',
  pricePaid: number = 399000,
  expiresAt?: string
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanPass || !cleanName) {
    return { success: false, message: 'Please fill in all required fields!' };
  }

  const users = getUsersRegistry();
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This email is already registered!' };
  }

  const newUser: UserAccount = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    password: cleanPass,
    name: cleanName,
    role: 'customer',
    tier,
    status: 'active',
    createdAt: Date.now(),
    pricePaid,
    ...(expiresAt ? { expiresAt } : {})
  };

  // 1. Save to Local Storage
  const updated = [newUser, ...users];
  saveUsersRegistry(updated);

  // 2. Save to Cloud Firestore using rules-compliant paths
  if (db) {
    try {
      await ensureFirebaseAuth();
      const docKey = getEmailDocKey(cleanEmail);
      await Promise.all([
        setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), newUser),
        setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), newUser),
        setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), {
          users: updated,
          updatedAt: Date.now()
        })
      ]);
    } catch (err) {
      console.warn('Could not save new user to Firestore immediately, saved locally.', err);
    }
  }

  return { success: true, user: newUser };
}

export function createUserAccount(
  email: string,
  password: string,
  name: string,
  tier: 'Standard' | 'VIP',
  pricePaid: number = 399000,
  expiresAt?: string
): { success: boolean; user?: UserAccount; message?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsersRegistry();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This email already exists in the client database!' };
  }

  const newUser: UserAccount = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    password: password.trim(),
    name: name.trim(),
    role: 'customer',
    tier,
    status: 'active',
    createdAt: Date.now(),
    pricePaid,
    ...(expiresAt ? { expiresAt } : {})
  };

  const updated = [newUser, ...users];
  saveUsersRegistry(updated);

  // Background Cloud Sync
  if (db) {
    ensureFirebaseAuth().then(() => {
      const docKey = getEmailDocKey(cleanEmail);
      setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), newUser).catch(() => {});
      setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), newUser).catch(() => {});
      setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), {
        users: updated,
        updatedAt: Date.now()
      }).catch(() => {});
    });
  }

  return { success: true, user: newUser };
}

export function updateUserStatus(userId: string, newStatus: 'active' | 'suspended' | 'expired'): void {
  const users = getUsersRegistry();
  let updatedUser: UserAccount | null = null;

  const updated = users.map(u => {
    if (u.id === userId && u.email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase()) {
      updatedUser = { ...u, status: newStatus };
      return updatedUser;
    }
    return u;
  });
  saveUsersRegistry(updated);

  if (db && updatedUser) {
    ensureFirebaseAuth().then(() => {
      const docKey = getEmailDocKey((updatedUser as UserAccount).email);
      setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), updatedUser).catch(() => {});
      setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), updatedUser).catch(() => {});
      setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), {
        users: updated,
        updatedAt: Date.now()
      }).catch(() => {});
    });
  }
}

export function deleteUserAccount(userId: string): void {
  const users = getUsersRegistry();
  const target = users.find(u => u.id === userId);
  const updated = users.filter(u => u.id !== userId && u.email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase());
  saveUsersRegistry(updated);

  if (db && target && target.email) {
    ensureFirebaseAuth().then(() => {
      const docKey = getEmailDocKey(target.email);
      deleteDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey)).catch(() => {});
      deleteDoc(doc(db, 'users', docKey, 'account_profile', 'credentials')).catch(() => {});
      setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), {
        users: updated,
        updatedAt: Date.now()
      }).catch(() => {});
    });
  }
}

// ---------------- LOGOUT HELPER ----------------

export function logoutUserSession(): void {
  localStorage.removeItem('df_os_active_user');
  sessionStorage.removeItem('df_os_active_user');
  localStorage.removeItem('df_os_unlocked');
  sessionStorage.removeItem('df_os_unlocked');
  sessionStorage.setItem('df_just_logged_out', 'true');
}
