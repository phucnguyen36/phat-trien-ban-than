import { db } from './firebase';
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
const FIRESTORE_COLLECTION = 'system_app_users';

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
const INITIAL_USERS: UserAccount[] = [
  DEFAULT_ADMIN,
  {
    id: 'usr_cust_101',
    email: 'client.demo@gmail.com',
    password: 'client123',
    name: 'Demo Client User',
    role: 'customer',
    tier: 'Standard',
    status: 'active',
    createdAt: Date.now() - 86400000 * 3,
    pricePaid: 399000
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
    const querySnap = await getDocs(collection(db, FIRESTORE_COLLECTION));
    const cloudUsers: UserAccount[] = [];
    
    querySnap.forEach((docSnap) => {
      const data = docSnap.data() as UserAccount;
      if (data && data.email && data.password) {
        cloudUsers.push(data);
      }
    });

    // Ensure Admin is always included
    const userMap = new Map<string, UserAccount>();
    userMap.set(DEFAULT_ADMIN.email.toLowerCase(), DEFAULT_ADMIN);

    // Merge Cloud Users
    cloudUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));

    // Merge Local Users
    localList.forEach(u => {
      if (!userMap.has(u.email.toLowerCase())) {
        userMap.set(u.email.toLowerCase(), u);
        // Upload local user to cloud
        const docKey = getEmailDocKey(u.email);
        setDoc(doc(db, FIRESTORE_COLLECTION, docKey), u).catch(() => {});
      }
    });

    const merged = Array.from(userMap.values());
    saveUsersRegistry(merged);
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

  // 2. Check Local Cache First
  let users = getUsersRegistry();
  let found = users.find(u => u.email.toLowerCase() === cleanEmail);

  // 3. If not found locally, query Cloud Firestore directly
  if (!found && db) {
    try {
      const docKey = getEmailDocKey(cleanEmail);
      const docSnap = await getDoc(doc(db, FIRESTORE_COLLECTION, docKey));
      if (docSnap.exists()) {
        found = docSnap.data() as UserAccount;
        if (found) {
          // Save to local cache
          users = [found, ...users.filter(u => u.email.toLowerCase() !== cleanEmail)];
          saveUsersRegistry(users);
        }
      }
    } catch (e) {
      console.warn('Error fetching user from Firestore:', e);
    }
  }

  // 4. Also try full cloud sync if still not found
  if (!found && db) {
    try {
      const synced = await syncUsersRegistryFromCloud();
      found = synced.find(u => u.email.toLowerCase() === cleanEmail);
    } catch (e) {}
  }

  if (!found) {
    return { 
      success: false, 
      message: 'Account does not exist! Please check your email or create a new account.' 
    };
  }

  if (found.password !== cleanPass) {
    return { success: false, message: 'Incorrect password! Please try again.' };
  }

  if (found.status === 'suspended') {
    return { success: false, message: 'Your account is suspended. Please contact the administrator!' };
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

  // Check in local cache
  const users = getUsersRegistry();
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This email is already registered! Please log in.' };
  }

  // Check in Firestore
  if (db) {
    try {
      const docKey = getEmailDocKey(cleanEmail);
      const docSnap = await getDoc(doc(db, FIRESTORE_COLLECTION, docKey));
      if (docSnap.exists()) {
        return { success: false, message: 'This email already exists in Cloud database! Please log in.' };
      }
    } catch (e) {}
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

  // 2. Save to Cloud Firestore
  if (db) {
    try {
      const docKey = getEmailDocKey(cleanEmail);
      await setDoc(doc(db, FIRESTORE_COLLECTION, docKey), newUser);
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
    const docKey = getEmailDocKey(cleanEmail);
    setDoc(doc(db, FIRESTORE_COLLECTION, docKey), newUser).catch(() => {});
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
    const docKey = getEmailDocKey((updatedUser as UserAccount).email);
    setDoc(doc(db, FIRESTORE_COLLECTION, docKey), updatedUser).catch(() => {});
  }
}

export function deleteUserAccount(userId: string): void {
  const users = getUsersRegistry();
  const target = users.find(u => u.id === userId);
  const updated = users.filter(u => u.id !== userId && u.email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase());
  saveUsersRegistry(updated);

  if (db && target && target.email) {
    const docKey = getEmailDocKey(target.email);
    deleteDoc(doc(db, FIRESTORE_COLLECTION, docKey)).catch(() => {});
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
