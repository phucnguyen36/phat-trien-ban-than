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

// Initial Seed Users
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
  }
];

// ---------------- TOKEN & ACCESS LINK ENCODER / DECODER ----------------

export function generateUserAccessToken(user: UserAccount): string {
  try {
    const payload = {
      id: user.id,
      email: user.email.toLowerCase(),
      password: user.password,
      name: user.name,
      tier: user.tier,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      pricePaid: user.pricePaid,
      expiresAt: user.expiresAt
    };
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch (e) {
    return '';
  }
}

export function parseUserAccessToken(token: string): UserAccount | null {
  try {
    const jsonStr = decodeURIComponent(atob(token));
    const obj = JSON.parse(jsonStr);
    if (obj && obj.email && obj.password) {
      return {
        id: obj.id || ('usr_' + Math.random().toString(36).substring(2, 9)),
        email: String(obj.email).trim().toLowerCase(),
        password: String(obj.password),
        name: obj.name || 'Deep Focus User',
        role: obj.role || 'customer',
        tier: obj.tier || 'Standard',
        status: obj.status || 'active',
        createdAt: obj.createdAt || Date.now(),
        pricePaid: obj.pricePaid || 0,
        expiresAt: obj.expiresAt
      };
    }
  } catch (e) {}
  return null;
}

export function generateAccessLink(user: UserAccount, baseUrl?: string): string {
  const token = generateUserAccessToken(user);
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://phat-trien-ban-than.vercel.app');
  return `${origin}/?access=${token}`;
}

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
    
    // Ensure admin exists
    const hasAdmin = parsed.some((u: UserAccount) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
    if (!hasAdmin) {
      parsed.unshift(DEFAULT_ADMIN);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return INITIAL_USERS;
  }
}

export function saveUsersRegistry(users: UserAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ---------------- CLOUD FIRESTORE SYNCHRONIZATION ----------------

export async function syncUsersRegistryFromCloud(): Promise<UserAccount[]> {
  const localList = getUsersRegistry();
  if (!db) return localList;

  try {
    ensureFirebaseAuth().catch(() => {});

    const userMap = new Map<string, UserAccount>();
    INITIAL_USERS.forEach(u => userMap.set(u.email.toLowerCase(), u));

    // Fetch unified users list and individual collections in parallel
    const [configRes, queryRes] = await Promise.allSettled([
      getDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users')),
      getDocs(collection(db, 'users', 'admin_registry', 'user_accounts'))
    ]);

    if (configRes.status === 'fulfilled' && configRes.value.exists()) {
      const data = configRes.value.data();
      if (data && Array.isArray(data.users)) {
        data.users.forEach((u: UserAccount) => {
          if (u && u.email) userMap.set(u.email.toLowerCase(), u);
        });
      }
    }

    if (queryRes.status === 'fulfilled') {
      queryRes.value.forEach((docSnap) => {
        const data = docSnap.data() as UserAccount;
        if (data && data.email && data.password) {
          userMap.set(data.email.toLowerCase(), data);
        }
      });
    }

    // Merge Local Users
    localList.forEach(u => {
      if (!userMap.has(u.email.toLowerCase())) {
        userMap.set(u.email.toLowerCase(), u);
      }
    });

    const merged = Array.from(userMap.values());
    saveUsersRegistry(merged);

    // Save back to Cloud Firestore
    setTimeout(async () => {
      try {
        await Promise.all([
          setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), { 
            users: merged,
            updatedAt: Date.now() 
          }),
          ...merged.map(u => {
            const docKey = getEmailDocKey(u.email);
            return Promise.all([
              setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), u),
              setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), u)
            ]);
          })
        ]);
      } catch (e) {}
    }, 100);

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

  // 2. Check Initial & Local Cache First
  let users = getUsersRegistry();
  let found = users.find(u => u.email.toLowerCase() === cleanEmail);

  // 3. If not found or if local password doesn't match, query Cloud Firestore
  if ((!found || found.password !== cleanPass) && db) {
    try {
      ensureFirebaseAuth().catch(() => {});
      const docKey = getEmailDocKey(cleanEmail);

      const [perUserSnap, adminDocSnap, configSnap] = await Promise.allSettled([
        getDoc(doc(db, 'users', docKey, 'account_profile', 'credentials')),
        getDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey)),
        getDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'))
      ]);

      if (perUserSnap.status === 'fulfilled' && perUserSnap.value.exists()) {
        found = perUserSnap.value.data() as UserAccount;
      } else if (adminDocSnap.status === 'fulfilled' && adminDocSnap.value.exists()) {
        found = adminDocSnap.value.data() as UserAccount;
      } else if (configSnap.status === 'fulfilled' && configSnap.value.exists()) {
        const data = configSnap.value.data();
        if (data && Array.isArray(data.users)) {
          found = data.users.find((u: UserAccount) => u.email.toLowerCase() === cleanEmail);
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
    return { success: false, message: 'Incorrect password! Please check credentials or use direct Access Link.' };
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
  const existingIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

  let targetUser: UserAccount;
  let updated: UserAccount[];

  if (existingIndex >= 0) {
    // Update existing user credentials & status
    targetUser = {
      ...users[existingIndex],
      password: cleanPass,
      name: cleanName,
      tier,
      pricePaid,
      status: 'active',
      ...(expiresAt ? { expiresAt } : {})
    };
    updated = users.map((u, idx) => idx === existingIndex ? targetUser : u);
  } else {
    // Create new user
    targetUser = {
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
    updated = [targetUser, ...users];
  }

  // 1. Save to Local Storage
  saveUsersRegistry(updated);

  // 2. Save to Cloud Firestore
  if (db) {
    try {
      ensureFirebaseAuth().catch(() => {});
      const docKey = getEmailDocKey(cleanEmail);
      await Promise.all([
        setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), targetUser),
        setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), targetUser),
        setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), {
          users: updated,
          updatedAt: Date.now()
        })
      ]);
    } catch (err) {
      console.warn('Could not save user to Firestore immediately, saved locally.', err);
    }
  }

  return { success: true, user: targetUser };
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
  const cleanPass = password.trim();
  const cleanName = name.trim();
  const users = getUsersRegistry();

  const existingIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
  let targetUser: UserAccount;
  let updated: UserAccount[];

  if (existingIndex >= 0) {
    targetUser = {
      ...users[existingIndex],
      password: cleanPass,
      name: cleanName,
      tier,
      pricePaid,
      status: 'active',
      ...(expiresAt ? { expiresAt } : {})
    };
    updated = users.map((u, idx) => idx === existingIndex ? targetUser : u);
  } else {
    targetUser = {
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
    updated = [targetUser, ...users];
  }

  saveUsersRegistry(updated);

  // Background Cloud Sync
  if (db) {
    ensureFirebaseAuth().then(() => {
      const docKey = getEmailDocKey(cleanEmail);
      setDoc(doc(db, 'users', 'admin_registry', 'user_accounts', docKey), targetUser).catch(() => {});
      setDoc(doc(db, 'users', docKey, 'account_profile', 'credentials'), targetUser).catch(() => {});
      setDoc(doc(db, 'users', 'system_registry', 'accounts_list', 'all_users'), {
        users: updated,
        updatedAt: Date.now()
      }).catch(() => {});
    });
  }

  return { success: true, user: targetUser };
}

export function updateUserPassword(userId: string, newPass: string): void {
  const users = getUsersRegistry();
  let updatedUser: UserAccount | null = null;

  const updated = users.map(u => {
    if (u.id === userId) {
      updatedUser = { ...u, password: newPass.trim() };
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
