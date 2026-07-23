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
}

const STORAGE_KEY = 'df_user_registry_v1';

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
    name: 'Khách Hàng Dùng Thử',
    role: 'customer',
    tier: 'Standard',
    status: 'active',
    createdAt: Date.now() - 86400000 * 3,
    pricePaid: 399000
  }
];

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

export function authenticateUser(emailInput: string, passwordInput: string): {
  success: boolean;
  user?: UserAccount;
  message?: string;
} {
  const users = getUsersRegistry();
  const cleanEmail = emailInput.trim().toLowerCase();

  // Special check for Admin override
  if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase() && passwordInput === DEFAULT_ADMIN.password) {
    return { success: true, user: DEFAULT_ADMIN };
  }

  const found = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return { success: false, message: 'Email chưa được đăng ký trong hệ thống!' };
  }

  if (found.password !== passwordInput) {
    return { success: false, message: 'Mật khẩu không chính xác!' };
  }

  if (found.status === 'suspended') {
    return { success: false, message: 'Tài khoản của bạn tạm thời bị tạm khóa. Vui lòng liên hệ Admin!' };
  }

  if (found.status === 'expired') {
    return { success: false, message: 'Gói bản quyền của bạn đã hết hạn. Vui lòng nâng cấp gói mới!' };
  }

  return { success: true, user: found };
}

export function createUserAccount(
  email: string,
  password: string,
  name: string,
  tier: 'Standard' | 'VIP',
  pricePaid: number = 399000
): { success: boolean; user?: UserAccount; message?: string } {
  const users = getUsersRegistry();
  const cleanEmail = email.trim().toLowerCase();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'Email này đã tồn tại trong danh sách khách hàng!' };
  }

  const newUser: UserAccount = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    password,
    name,
    role: 'customer',
    tier,
    status: 'active',
    createdAt: Date.now(),
    pricePaid
  };

  const updated = [newUser, ...users];
  saveUsersRegistry(updated);
  return { success: true, user: newUser };
}

export function updateUserStatus(userId: string, newStatus: 'active' | 'suspended' | 'expired'): void {
  const users = getUsersRegistry();
  const updated = users.map(u => {
    if (u.id === userId && u.email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase()) {
      return { ...u, status: newStatus };
    }
    return u;
  });
  saveUsersRegistry(updated);
}

export function deleteUserAccount(userId: string): void {
  const users = getUsersRegistry();
  const updated = users.filter(u => u.id !== userId && u.email.toLowerCase() !== DEFAULT_ADMIN.email.toLowerCase());
  saveUsersRegistry(updated);
}
