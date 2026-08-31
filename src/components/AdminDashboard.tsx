import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  getUsersRegistry, 
  createUserAccountAsync,
  syncUsersRegistryFromCloud,
  updateUserStatus, 
  updateUserPassword,
  deleteUserAccount,
  generateAccessLink,
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
  RefreshCw,
  Link as LinkIcon,
  Pencil,
  X
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
      "Customer Account Created",
      `Successfully generated credentials for ${newName} (${newEmail}). You can now copy access link or login details below.`
    );

    // Reset Form
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setNewTier('Standard');
    setNewPrice(49);
  };

  // Copy Delivery Info with 1-Click Access Link
  const handleCopyDeliveryInfo = (user: UserAccount) => {
    const accessLink = generateAccessLink(user);
    const deliveryMsg = `[Deep Focus Access Details]\n` +
      `Hello ${user.name},\n` +
      `Your account for Deep Focus is active!\n\n` +
      `👉 1-Click Instant Access Link:\n` +
      `${accessLink}\n\n` +
      `Or login directly:\n` +
      `- URL: ${window.location.origin}\n` +
      `- Email: ${user.email}\n` +
      `- Password: ${user.password}\n` +
      `- Tier: ${user.tier}\n\n` +
      `Welcome to Deep Focus!`;

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
      {/* Header Banner - Swiss Studio Standard */}
      <div className="kuldeep-card p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
              License & Customer Management
            </h1>
            <p className="text-[#9496a1] text-xs md:text-sm max-w-xl font-normal leading-relaxed">
              Issue new customer credentials, deliver access details, and manage active software licenses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                generatePassword();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 btn-primary-cyan text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Issue customer account</span>
            </button>
            <button
              onClick={async () => {
                await refreshUsers();
                onNotice("Cloud Sync", `Successfully synchronized ${users.length} accounts with Cloud Firestore.`);
              }}
              disabled={isSyncing}
              className="px-3.5 py-2 glass-button-true text-xs text-[#ededf3] hover:text-white flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync cloud'}</span>
            </button>
            <button
              onClick={handleExportRegistry}
              className="px-3.5 py-2 glass-button-true text-xs text-[#ededf3] hover:text-white flex items-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Business Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="kuldeep-card p-5 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-[#9496a1] font-medium">
            <span>Total customers</span>
            <Users className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {customerList.length} <span className="text-xs text-[#9496a1] font-normal">users</span>
          </div>
          <div className="text-xs text-[#9496a1]">
            {activeCustomers.length} active customer licenses
          </div>
        </div>

        <div className="kuldeep-card p-5 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-[#9496a1] font-medium">
            <span>Total revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            ${totalRevenue.toLocaleString('en-US')}
          </div>
          <div className="text-xs text-[#9496a1]">
            Accumulated license sales
          </div>
        </div>

        <div className="kuldeep-card p-5 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-[#9496a1] font-medium">
            <span>Default admin identity</span>
            <ShieldCheck className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="text-xs font-mono font-semibold text-white truncate">
            {DEFAULT_ADMIN.email}
          </div>
          <div className="text-xs text-[#9496a1]">
            Master system access rights
          </div>
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="kuldeep-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1591DC]" />
            <h2 className="text-sm font-semibold text-white">
              Customer Registry ({customerList.length})
            </h2>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-3.5 h-3.5 text-[#9496a1] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-1.5 glass-input-true text-xs rounded-lg placeholder-zinc-500"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-[#9496a1] space-y-2 text-xs">
            <Users className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>No customer accounts match the search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#9496a1] text-xs bg-white/[0.02]">
                  <th className="p-3 font-medium">Customer / Email</th>
                  <th className="p-3 font-medium">Password</th>
                  <th className="p-3 font-medium">Tier</th>
                  <th className="p-3 font-medium">Price paid</th>
                  <th className="p-3 font-medium">Issue date</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Delivery actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[#ededf3]">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{cust.name}</div>
                      <div className="text-xs text-[#9496a1]">{cust.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="glass-pill-true px-2 py-0.5 text-xs font-mono text-[#ededf3]">
                          {cust.password}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newPass = prompt(`Enter new password for ${cust.name} (${cust.email}):`, cust.password);
                            if (newPass && newPass.trim() && newPass.trim() !== cust.password) {
                              updateUserPassword(cust.id, newPass.trim());
                              refreshUsers();
                              onNotice("Password Updated", `Password for ${cust.email} changed to: ${newPass.trim()}`);
                            }
                          }}
                          className="p-1 text-[#9496a1] hover:text-white glass-button-true rounded transition-colors"
                          title="Change password"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.06] text-[#ededf3]">
                        {cust.tier}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">
                      ${(cust.pricePaid || 0).toLocaleString('en-US')}
                    </td>
                    <td className="p-3 text-[#9496a1] text-xs">
                      {new Date(cust.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        cust.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cust.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        {cust.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy 1-Click Link */}
                        <button
                          onClick={() => {
                            const link = generateAccessLink(cust);
                            navigator.clipboard.writeText(link);
                            setCopiedId('link_' + cust.id);
                            setTimeout(() => setCopiedId(null), 2500);
                            onNotice("Link Copied", `Instant access link for ${cust.name} copied to clipboard.`);
                          }}
                          className="px-2.5 py-1 glass-button-true text-[#1591DC] hover:text-white text-xs flex items-center gap-1 transition-all rounded-full"
                          title="Copy 1-Click Instant Login Link"
                        >
                          {copiedId === ('link_' + cust.id) ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <LinkIcon className="w-3 h-3 text-[#1591DC]" />
                          )}
                          <span>{copiedId === ('link_' + cust.id) ? 'Copied' : '1-Click link'}</span>
                        </button>

                        {/* Copy Delivery Info */}
                        <button
                          onClick={() => handleCopyDeliveryInfo(cust)}
                          className="px-2.5 py-1 glass-button-true text-[#ededf3] text-xs flex items-center gap-1 transition-all rounded-full"
                          title="Copy full delivery message to customer"
                        >
                          {copiedId === cust.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#9496a1]" />
                          )}
                          <span>{copiedId === cust.id ? 'Copied' : 'Copy info'}</span>
                        </button>

                        {/* Toggle Suspend/Active */}
                        <button
                          onClick={() => handleToggleStatus(cust)}
                          className="p-1.5 glass-button-true text-[#9496a1] hover:text-white transition-all rounded-full"
                          title={cust.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {cust.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(cust)}
                          className="p-1.5 glass-button-true text-[#9496a1] hover:text-red-400 transition-all rounded-full"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md kuldeep-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1591DC]" />
                <h3 className="text-sm font-semibold text-white">
                  Issue New Customer Account
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9496a1] hover:text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[#9496a1] text-xs font-medium">Customer Name:</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Alexander Pierce"
                  className="w-full p-2.5 glass-input-true rounded-lg"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#9496a1] text-xs font-medium">Customer Email:</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="customer@gmail.com"
                  className="w-full p-2.5 glass-input-true rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[#9496a1] text-xs font-medium">Password:</label>
                  <button 
                    type="button" 
                    onClick={generatePassword}
                    className="text-[10px] text-[#1591DC] hover:underline"
                  >
                    Regenerate
                  </button>
                </div>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2.5 glass-input-true font-mono rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#9496a1] text-xs font-medium">License Tier:</label>
                  <select
                    value={newTier}
                    onChange={e => setNewTier(e.target.value as any)}
                    className="w-full p-2.5 glass-input-true rounded-lg bg-[#0e1015]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#9496a1] text-xs font-medium">Price Paid ($ USD):</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 glass-input-true rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 glass-button-true rounded-full text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 btn-primary-cyan text-xs font-semibold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
