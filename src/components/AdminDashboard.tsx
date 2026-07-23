import React, { useState, useEffect } from 'react';
import { 
  UserAccount, 
  getUsersRegistry, 
  createUserAccount, 
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
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNotice: (title: string, message: string) => void;
}

export default function AdminDashboard({ onNotice }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Account Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newTier, setNewTier] = useState<'Standard' | 'VIP'>('Standard');
  const [newPrice, setNewPrice] = useState<number>(399000);
  const [formError, setFormError] = useState('');

  // Load registry
  const refreshUsers = () => {
    const list = getUsersRegistry();
    setUsers(list);
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
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      setFormError('Vui lòng điền đầy đủ Email, Mật khẩu và Tên khách hàng!');
      return;
    }

    const res = createUserAccount(newEmail, newPassword, newName, newTier, newPrice);
    if (!res.success) {
      setFormError(res.message || 'Lỗi tạo tài khoản!');
      return;
    }

    refreshUsers();
    setIsAddModalOpen(false);
    onNotice(
      "ĐÃ TẠO TÀI KHOẢN KHÁCH HÀNG",
      `Đã cấp thành công tài khoản cho ${newName} (${newEmail}). Bạn có thể copy thông tin bàn giao ngay bên dưới!`
    );

    // Reset Form
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setNewTier('Standard');
    setNewPrice(399000);
  };

  // Copy Delivery Info
  const handleCopyDeliveryInfo = (user: UserAccount) => {
    const deliveryMsg = `[THÔNG TIN BÀN GIAO DEEP FOCUS OS]\n` +
      `Xin chào ${user.name},\n` +
      `Tài khoản bản quyền của bạn đã được kích hoạt thành công!\n` +
      `- Link Đăng Nhập: ${window.location.origin}\n` +
      `- Email: ${user.email}\n` +
      `- Mật khẩu: ${user.password}\n` +
      `- Gói bản quyền: ${user.tier}\n` +
      `Chúc bạn có trải nghiệm phát triển bản thân tuyệt vời!`;

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
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản khách hàng ${user.name} (${user.email})?`)) {
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
      {/* Header Banner - Strict Monochrome */}
      <div className="relative overflow-hidden rounded-none bg-[#050506] border border-zinc-800 p-6 md:p-8 text-zinc-100 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase font-bold bg-zinc-900 text-zinc-200 border border-zinc-800">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              MASTER ADMIN CONTROL PORTAL
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-zinc-100 font-mono uppercase">
              Quản Lý Bản Quyền & Khách Hàng
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl font-sans leading-relaxed">
              Cấp tài khoản mới, bàn giao thông tin đăng nhập và quản lý danh sách bản quyền kinh doanh sản phẩm.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                generatePassword();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-white text-black font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-none active:scale-95 border border-zinc-200"
            >
              <UserPlus className="w-4 h-4" />
              + CẤP TÀI KHOẢN KHÁCH MỚI
            </button>
            <button
              onClick={handleExportRegistry}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              XUẤT REGISTRY JSON
            </button>
          </div>
        </div>
      </div>

      {/* Overview Business Metrics Cards - Monochrome */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#020202] border border-zinc-900 p-5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <span>TỔNG KHÁCH HÀNG</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {customerList.length} <span className="text-xs text-zinc-500 font-normal">người dùng</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400">
            {activeCustomers.length} tài khoản đang hoạt động
          </div>
        </div>

        <div className="bg-[#020202] border border-zinc-900 p-5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <span>TỔNG DOANH THU KINH DOANH</span>
            <DollarSign className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {totalRevenue.toLocaleString('vi-VN')} ₫
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Doanh thu tích lũy từ bán bản quyền
          </div>
        </div>

        <div className="bg-[#020202] border border-zinc-900 p-5 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <span>ADMIN TÀI KHOẢN MẶC ĐỊNH</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-xs font-mono font-bold text-zinc-200 truncate">
            {DEFAULT_ADMIN.email}
          </div>
          <div className="text-[10px] font-mono text-zinc-500">
            Quyền quản trị cao nhất hệ thống
          </div>
        </div>
      </div>

      {/* Customer Registry Table - Strict Monochrome */}
      <div className="bg-[#020202] border border-zinc-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-100 font-bold">
              Danh Sách Tài Khoản Khách Hàng ({customerList.length})
            </h2>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Tên hoặc Email..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#050506] border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 rounded-none"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 space-y-2 font-mono text-xs">
            <Users className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>Chưa có tài khoản khách hàng nào khớp với tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[10px] bg-[#050506]">
                  <th className="p-3">Khách Hàng / Email</th>
                  <th className="p-3">Mật Khẩu Cấp</th>
                  <th className="p-3">Gói Bản Quyền</th>
                  <th className="p-3">Giá Bán</th>
                  <th className="p-3">Ngày Cấp</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác Bàn Giao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-zinc-100">{cust.name}</div>
                      <div className="text-[10px] text-zinc-500">{cust.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-zinc-900 text-zinc-200 px-2 py-0.5 border border-zinc-800 text-[11px]">
                        {cust.password}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold border bg-zinc-900 text-zinc-300 border-zinc-800">
                        {cust.tier}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-zinc-200">
                      {(cust.pricePaid || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-3 text-zinc-500 text-[10px]">
                      {new Date(cust.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest border ${
                        cust.status === 'active'
                          ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                      }`}>
                        {cust.status === 'active' ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Delivery Info */}
                        <button
                          onClick={() => handleCopyDeliveryInfo(cust)}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-[10px] uppercase tracking-widest flex items-center gap-1 transition-all"
                          title="Copy tin nhắn bàn giao thông tin cho khách"
                        >
                          {copiedId === cust.id ? (
                            <Check className="w-3 h-3 text-zinc-200" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                          <span>{copiedId === cust.id ? 'ĐÃ COPY' : 'COPY INFOS'}</span>
                        </button>

                        {/* Toggle Suspend/Active */}
                        <button
                          onClick={() => handleToggleStatus(cust)}
                          className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"
                          title={cust.status === 'active' ? 'Tạm khóa tài khoản' : 'Mở lại tài khoản'}
                        >
                          {cust.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(cust)}
                          className="p-1.5 border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 transition-all"
                          title="Xóa tài khoản khách hàng"
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

      {/* Modal Add New Customer Account - Monochrome */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#020202] border border-zinc-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-zinc-300" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-100 font-bold">
                  Cấp Tài Khoản Khách Hàng Mới
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 text-xs font-mono"
              >
                [X]
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Tên Khách Hàng:</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full p-2.5 bg-[#050506] border border-zinc-800 text-zinc-100 focus:border-zinc-500 focus:outline-none rounded-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Email Đăng Nhập:</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="khachhang@gmail.com"
                  className="w-full p-2.5 bg-[#050506] border border-zinc-800 text-zinc-100 focus:border-zinc-500 focus:outline-none rounded-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Mật Khẩu Đăng Nhập:</label>
                  <button 
                    type="button" 
                    onClick={generatePassword}
                    className="text-[9px] text-zinc-400 hover:text-zinc-200 hover:underline"
                  >
                    Tự tạo ngẫu nhiên
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full p-2.5 bg-[#050506] border border-zinc-800 text-zinc-100 font-mono focus:border-zinc-500 focus:outline-none rounded-none"
                  />
                  <Key className="w-4 h-4 text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Gói Bản Quyền:</label>
                  <select 
                    value={newTier}
                    onChange={e => setNewTier(e.target.value as 'Standard' | 'VIP')}
                    className="w-full p-2.5 bg-[#050506] border border-zinc-800 text-zinc-100 focus:border-zinc-500 focus:outline-none rounded-none"
                  >
                    <option value="Standard">Gói Standard (LMS)</option>
                    <option value="VIP">Gói VIP (Coaching)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase tracking-widest text-[10px]">Giá Thu Khách (VNĐ):</label>
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#050506] border border-zinc-800 text-zinc-100 focus:border-zinc-500 focus:outline-none rounded-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 uppercase tracking-widest text-[10px]"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-white text-black font-bold uppercase tracking-widest text-[10px]"
                >
                  XÁC NHẬN CẤP TÀI KHOẢN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
