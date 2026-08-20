import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Mail, Key, User, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { 
  authenticateUserAsync, 
  createUserAccountAsync, 
  syncUsersRegistryFromCloud,
  UserAccount 
} from '../userRegistry';

interface AuthGateProps {
  onAuthenticated: (user: UserAccount) => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up inputs
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerTier, setRegisterTier] = useState<'Standard' | 'VIP'>('Standard');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // 1. If user just clicked "Logout", do not auto-login
    const justLoggedOut = sessionStorage.getItem('df_just_logged_out');
    if (justLoggedOut === 'true') {
      sessionStorage.removeItem('df_just_logged_out');
      // Also pre-fetch latest users in background
      syncUsersRegistryFromCloud().catch(() => {});
      return;
    }

    // 2. Check if active user session is saved
    const savedUser = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as UserAccount;
        if (user && user.email) {
          onAuthenticated(user);
          return;
        }
      } catch (e) {
        localStorage.removeItem('df_os_active_user');
        sessionStorage.removeItem('df_os_active_user');
      }
    }

    // 3. Pre-fetch cloud users in the background
    syncUsersRegistryFromCloud().catch(() => {});
  }, [onAuthenticated]);

  // Handle Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both Login Email and Access Password!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateUserAsync(email, password);
      if (res.success && res.user) {
        setIsUnlocked(true);
        localStorage.setItem('df_os_active_user', JSON.stringify(res.user));
        sessionStorage.setItem('df_os_active_user', JSON.stringify(res.user));
        setTimeout(() => {
          onAuthenticated(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage('Server error during sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setErrorMessage('Please fill in your Full Name, Email, and Password!');
      return;
    }

    if (registerPassword.trim().length < 4) {
      setErrorMessage('Password must be at least 4 characters long!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createUserAccountAsync(
        registerEmail,
        registerPassword,
        registerName,
        registerTier
      );

      if (res.success && res.user) {
        setSuccessMessage('Account registered successfully! Ingressing system...');
        setIsUnlocked(true);
        localStorage.setItem('df_os_active_user', JSON.stringify(res.user));
        sessionStorage.setItem('df_os_active_user', JSON.stringify(res.user));
        setTimeout(() => {
          onAuthenticated(res.user!);
        }, 800);
      } else {
        setErrorMessage(res.message || 'Could not create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Registration failed. Please check internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {!isUnlocked && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-zinc-100 p-4 md:p-8"
        >
          {/* Ambient subtle background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-[#09090b]/95 backdrop-blur-2xl p-6 md:p-8 relative z-10 shadow-2xl space-y-6 border border-white/10 rounded-2xl"
          >
            {/* Top Brand Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-[9px] font-mono tracking-widest text-zinc-300 uppercase font-bold">
                  DEEP FOCUS OS • v5.0
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight text-white uppercase">
                Deep Focus OS
              </h1>
              <p className="text-xs font-sans text-zinc-400">
                Executive Personal Productivity & Mindset Architecture
              </p>
            </div>

            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In (Đăng Nhập)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign Up (Đăng Ký)
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2 rounded-xl animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 rounded-xl animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
                    LOGIN EMAIL:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500/80 py-3 pl-9 pr-3 rounded-xl font-sans text-white focus:outline-none transition-colors"
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
                      ACCESS KEY PASSWORD:
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500/80 py-3 pl-9 pr-3 rounded-xl font-mono text-white focus:outline-none transition-colors"
                    />
                    <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AUTHENTICATING CLOUD...</span>
                    </>
                  ) : (
                    <>
                      <span>CONFIRM SYSTEM INGRESS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
                    FULL NAME:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500/80 py-3 pl-9 pr-3 rounded-xl font-sans text-white focus:outline-none transition-colors"
                      autoFocus
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
                    EMAIL ADDRESS:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500/80 py-3 pl-9 pr-3 rounded-xl font-sans text-white focus:outline-none transition-colors"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
                    CREATE ACCESS PASSWORD:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500/80 py-3 pl-9 pr-3 rounded-xl font-mono text-white focus:outline-none transition-colors"
                    />
                    <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 uppercase tracking-widest text-[10px] font-bold">
                    ACCOUNT TIER:
                  </label>
                  <select
                    value={registerTier}
                    onChange={(e) => setRegisterTier(e.target.value as 'Standard' | 'VIP')}
                    className="w-full bg-zinc-900 border border-white/10 text-xs font-mono text-white p-3 rounded-xl focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Standard">Standard Tier (Default Plan)</option>
                    <option value="VIP">VIP Tier (Executive Full Suite)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>CREATING CLOUD ACCOUNT...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>CREATE ACCOUNT & INGRESS</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer Copyright */}
            <div className="text-center text-[10px] font-mono text-zinc-500 tracking-widest uppercase pt-2">
              Xuan Phuc © 2026 • Executive Product OS
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
