import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  getUsersRegistry, 
  createUserAccountAsync,
  syncUsersRegistryFromCloud,
  updateUserStatus, 
  deleteUserAccount,
  DEFAULT_ADMIN 
} from '../userRegistry';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  DollarSign, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Trash2, 
  Download, 
  Search, 
  Key,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface AdminDashboardProps {
  onNotice: (title: string, message: string) => void;
}

export default function AdminDashboard({ onNotice }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Account Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newTier, setNewTier] = useState<'Standard' | 'VIP'>('Standard');
  const [newPrice, setNewPrice] = useState<number>(49);
  const [formError, setFormError] = useState('');

  // Load registry & sync with Cloud
  const refreshUsers = async () => {
    setUsers(getUsersRegistry());
    setIsSyncing(true);
    try {
      const synced = await syncUsersRegistryFromCloud();
      setUsers(synced);
    } catch (e) {
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // Stats calculation
  const customerList = users.filter(u => u.role === 'customer');
  const activeCustomers = customerList.filter(u => u.status === 'active');
  const totalRevenue = customerList.reduce((sum, u) => sum + (u.pricePaid || 0), 0);

  // Filtered List
  const filteredCustomers = customerList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate random strong password
  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  // Handle Create Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      setFormError('Please enter Email, Password, and Customer Name!');
      return;
    }

    const res = await createUserAccountAsync(newEmail, newPassword, newName, newTier, newPrice);
    if (!res.success) {
      setFormError(res.message || 'Error creating account!');
      return;
    }

    await refreshUsers();
    setIsAddModalOpen(false);
    onNotice(
      "CUSTOMER ACCOUNT ISSUED",
      `Successfully generated credentials for ${newName} (${newEmail}). Saved to Cloud Firestore globally!`
    );

    // Reset Form
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setNewTier('Standard');
    setNewPrice(49);
  };

  // Copy Delivery Info
  const handleCopyDeliveryInfo = (user: UserAccount) => {
    const deliveryMsg = `[DEEP FOCUS OS ACCESS CREDENTIALS]\n` +
      `Hello ${user.name},\n` +
      `Your commercial license for Deep Focus OS is now active!\n` +
      `- Ingress URL: ${window.location.origin}\n` +
      `- Email: ${user.email}\n` +
      `- Password: ${user.password}\n` +
      `- License Tier: ${user.tier}\n` +
      `Welcome aboard! Elevate your personal growth performance.`;

    navigator.clipboard.writeText(deliveryMsg);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle Account Status
  const handleToggleStatus = (user: UserAccount) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    updateUserStatus(user.id, nextStatus);
    refreshUsers();
  };

  // Delete User
  const handleDeleteUser = (user: UserAccount) => {
    if (window.confirm(`Are you sure you want to revoke and delete customer account ${user.name} (${user.email})?`)) {
      deleteUserAccount(user.id);
      refreshUsers();
    }
  };

  // Export User Registry JSON
  const handleExportRegistry = () => {
    const jsonStr = JSON.stringify(users, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_registry_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner - Glassmorphism */}
      <div className="relative overflow-hidden rounded-none glass-panel p-6 md:p-8 text-zinc-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-mono tracking-widest uppercase font-bold glass-pill text-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              MASTER ADMIN CONTROL PORTAL
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
              License & Customer Management
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl font-sans leading-relaxed">
              Issue new customer credentials, deliver access details, and manage commercial software licenses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                generatePassword();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 border border-white rounded-xl"
            >
              <UserPlus className="w-4 h-4" />
              + ISSUE CUSTOMER ACCOUNT
            </button>
            <button
              onClick={async () => {
                await refreshUsers();
                onNotice("CLOUD REGISTRY SYNCED", `Successfully synchronized ${users.length} accounts with Cloud Firestore.`);
              }}
              disabled={isSyncing}
              className="px-4 py-2.5 glass-button-true text-zinc-200 hover:text-white font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'SYNCING...' : 'SYNC CLOUD'}</span>
            </button>
            <button
              onClick={handleExportRegistry}
              className="px-4 py-2.5 glass-button-true text-zinc-300 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all rounded-xl"
            >
              <Download className="w-4 h-4" />
              EXPORT REGISTRY JSON
            </button>
          </div>
        </div>
      </div>

      {/* Overview Business Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            <span>TOTAL CUSTOMERS</span>
            <Users className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {customerList.length} <span className="text-xs text-zinc-400 font-normal">users</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-300">
            {activeCustomers.length} active customer licenses
          </div>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            <span>TOTAL REVENUE</span>
            <DollarSign className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalRevenue.toLocaleString('en-US')}
          </div>
          <div className="text-[10px] font-mono text-zinc-400">
            Accumulated license sales
          </div>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            <span>DEFAULT ADMIN IDENTITY</span>
            <ShieldCheck className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-xs font-mono font-bold text-zinc-200 truncate">
            {DEFAULT_ADMIN.email}
          </div>
          <div className="text-[10px] font-mono text-zinc-400">
            Master system access rights
          </div>
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-white font-bold">
              Customer Registry ({customerList.length})
            </h2>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Name or Email..."
              className="w-full pl-9 pr-3 py-1.5 glass-input text-xs font-mono rounded-none"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 space-y-2 font-mono text-xs">
            <Users className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>No customer accounts match the search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-widest text-[10px] bg-black/40">
                  <th className="p-3">Customer / Email</th>
                  <th className="p-3">Password</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Price Paid</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Delivery Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{cust.name}</div>
                      <div className="text-[10px] text-zinc-400">{cust.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="glass-pill px-2 py-0.5 text-[11px] text-zinc-200">
                        {cust.password}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold glass-pill text-zinc-300">
                        {cust.tier}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      ${(cust.pricePaid || 0).toLocaleString('en-US')}
                    </td>
                    <td className="p-3 text-zinc-400 text-[10px]">
                      {new Date(cust.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest glass-pill ${
                        cust.status === 'active' ? 'text-emerald-400' : 'text-zinc-500'
                      }`}>
                        {cust.status === 'active' ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Delivery Info */}
                        <button
                          onClick={() => handleCopyDeliveryInfo(cust)}
                          className="px-2 py-1 glass-button text-zinc-200 text-[10px] uppercase tracking-widest flex items-center gap-1 transition-all"
                          title="Copy delivery message to customer"
                        >
                          {copiedId === cust.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                          <span>{copiedId === cust.id ? 'COPIED' : 'COPY INFOS'}</span>
                        </button>

                        {/* Toggle Suspend/Active */}
                        <button
                          onClick={() => handleToggleStatus(cust)}
                          className="p-1.5 glass-button text-zinc-400 hover:text-white transition-all"
                          title={cust.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {cust.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(cust)}
                          className="p-1.5 glass-button text-zinc-500 hover:text-red-400 transition-all"
                          title="Delete Customer Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add New Customer Account (Glass Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md glass-panel p-6 space-y-5 border border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-zinc-300" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-white font-bold">
                  Issue New Customer Account
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                [X]
              </button>
            </div>

            {formError && (
              <div className="p-3 glass-card border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Customer Name:</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Alexander Pierce"
                  className="w-full p-2.5 glass-input rounded-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Login Email:</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="customer@domain.com"
                  className="w-full p-2.5 glass-input rounded-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Generated Password:</label>
                  <button 
                    type="button" 
                    onClick={generatePassword}
                    className="text-[9px] text-zinc-300 hover:text-white hover:underline"
                  >
                    Randomize
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-2.5 glass-input font-mono rounded-none"
                  />
                  <Key className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-widest text-[10px]">License Tier:</label>
                  <select 
                    value={newTier}
                    onChange={e => setNewTier(e.target.value as 'Standard' | 'VIP')}
                    className="w-full p-2.5 glass-input rounded-none"
                  >
                    <option value="Standard" className="bg-black text-white">Standard ($49 Lifetime)</option>
                    <option value="VIP" className="bg-black text-white">VIP ($149 Coaching)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Price Charged ($):</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 glass-input rounded-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 glass-button text-zinc-400 hover:text-white uppercase tracking-widest text-[10px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold uppercase tracking-widest text-[10px]"
                >
                  ISSUE ACCOUNT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
