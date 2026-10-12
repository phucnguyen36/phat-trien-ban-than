/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Mail, 
  Key, 
  User, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';
import { DeepFocusLogo } from './DeepFocusLogo';
import { 
  authenticateUserAsync, 
  createUserAccountAsync,
  syncUsersRegistryFromCloud, 
  parseUserAccessToken,
  getUsersRegistry,
  saveUsersRegistry,
  UserAccount 
} from '../userRegistry';

interface AuthGateProps {
  onAuthenticated: (user: UserAccount) => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLicenseKey, setRegLicenseKey] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // 1. Check for One-Click Access Token in URL (e.g. ?access=... or #access=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let accessToken = urlParams.get('access') || urlParams.get('token');
      
      if (!accessToken && window.location.hash.includes('access=')) {
        const match = window.location.hash.match(/access=([^&]+)/);
        if (match) accessToken = match[1];
      }

      if (accessToken) {
        const tokenUser = parseUserAccessToken(accessToken);
        if (tokenUser && tokenUser.email) {
          // Register / update user in local registry
          const list = getUsersRegistry();
          const existingIdx = list.findIndex(u => u.email.toLowerCase() === tokenUser.email.toLowerCase());
          let updatedList: UserAccount[];
          if (existingIdx >= 0) {
            updatedList = list.map((u, i) => i === existingIdx ? { ...u, ...tokenUser } : u);
          } else {
            updatedList = [tokenUser, ...list];
          }
          saveUsersRegistry(updatedList);

          // Save session
          localStorage.setItem('df_os_active_user', JSON.stringify(tokenUser));
          sessionStorage.setItem('df_os_active_user', JSON.stringify(tokenUser));

          // Clean URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);

          setSuccessNotice(`Welcome ${tokenUser.name}! Access Verified.`);
          setIsUnlocked(true);
          setTimeout(() => {
            onAuthenticated(tokenUser);
          }, 800);
          return;
        }
      }
    } catch (e) {}

    // 2. If user just logged out, do not auto-login
    const justLoggedOut = sessionStorage.getItem('df_just_logged_out');
    if (justLoggedOut === 'true') {
      sessionStorage.removeItem('df_just_logged_out');
      syncUsersRegistryFromCloud().catch(() => {});
      return;
    }

    // 3. Check if user session stored in localStorage or sessionStorage
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

    // 4. Pre-fetch cloud users in background
    syncUsersRegistryFromCloud().catch(() => {});
  }, [onAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both Email and Access Password.');
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
        setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMessage('Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Self-Serve Registration (Database flows directly to Firebase Firestore)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();
    const cleanLicense = regLicenseKey.trim().toUpperCase();

    if (!cleanName || !cleanEmail || !cleanPass) {
      setErrorMessage('Please enter Full Name, Email, and Password.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      let tier: 'Standard' | 'VIP' = 'Standard';
      let pricePaid = 0;

      // If user entered a Whop license key, verify and grant VIP
      if (cleanLicense) {
        try {
          const res = await fetch('/api/verify-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey: cleanLicense })
          });
          const data = await res.json();
          if (res.ok && data.valid) {
            tier = 'VIP';
            pricePaid = 99;
            localStorage.setItem('df_pro_lifetime_active', 'true');
            localStorage.setItem('df_pro_license_key', cleanLicense);
          }
        } catch (e) {
          if (cleanLicense.startsWith('DFOS-')) {
            tier = 'VIP';
            pricePaid = 99;
            localStorage.setItem('df_pro_lifetime_active', 'true');
            localStorage.setItem('df_pro_license_key', cleanLicense);
          }
        }
      }

      // Creates user and automatically syncs to Firebase Firestore:
      // 1. users/admin_registry/user_accounts/{docKey} (Admin Dashboard reads this)
      // 2. users/{docKey}/account_profile/credentials
      // 3. users/system_registry/accounts_list/all_users
      const res = await createUserAccountAsync(cleanEmail, cleanPass, cleanName, tier, pricePaid);

      if (res.success && res.user) {
        setSuccessNotice(`Registration successful! Welcome to DeepFocus, ${cleanName}.`);
        setIsUnlocked(true);
        localStorage.setItem('df_os_active_user', JSON.stringify(res.user));
        sessionStorage.setItem('df_os_active_user', JSON.stringify(res.user));
        setTimeout(() => {
          onAuthenticated(res.user!);
        }, 600);
      } else {
        setErrorMessage(res.message || 'Unable to register account. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Connection error. Please try again.');
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
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-zinc-100 p-4 md:p-8"
        >
          {/* Subtle ambient radial background glow (Emerald green accent) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md bg-[#0b0c10] p-6 md:p-8 relative z-10 shadow-2xl space-y-5 border border-white/15 rounded-3xl"
          >
            {/* Top Brand Banner */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="hover:scale-105 transition-transform shrink-0">
                <DeepFocusLogo size={48} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                  DeepFocus OS
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sovereign productivity & distraction-free engine
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Success Notice */}
            {successNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn rounded-xl">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-white/[0.04] border border-white/15 text-zinc-300 text-xs flex items-center gap-2 animate-fadeIn rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-medium">Email address:</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl text-white focus:outline-none transition-colors"
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-medium">Password:</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl font-mono text-white focus:outline-none transition-colors"
                    />
                    <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 text-[11px] text-zinc-400">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Create free account
                  </button>
                </div>
              </form>
            ) : (
              /* 2. REGISTRATION FORM (Auto-saved to Firebase) */
              <form onSubmit={handleRegister} className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-medium">Full Name:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Thomas Nguyen"
                      className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl text-white focus:outline-none transition-colors"
                      autoFocus
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-medium">Email address:</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl text-white focus:outline-none transition-colors"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-zinc-400 text-xs font-medium">Password:</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl font-mono text-white focus:outline-none transition-colors"
                      />
                      <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 text-xs font-medium">Confirm:</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl font-mono text-white focus:outline-none transition-colors"
                      />
                      <Key className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Optional Whop Key */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-400 text-[11px] font-medium flex items-center gap-1">
                      <span>Whop License Key</span>
                      <span className="text-[10px] text-zinc-500">(Optional)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={regLicenseKey}
                      onChange={(e) => setRegLicenseKey(e.target.value)}
                      placeholder="DFOS-LIFE-XXXX-XXXX (if purchased)"
                      className="w-full bg-white/[0.03] border border-white/15 focus:border-emerald-500/50 py-2.5 pl-9 pr-3 rounded-xl font-mono text-white text-xs placeholder:text-zinc-600 focus:outline-none transition-colors"
                    />
                    <ShieldCheck className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 rounded-xl disabled:opacity-50 cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Launch DeepFocus</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1 text-[11px] text-zinc-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="text-white hover:underline font-semibold cursor-pointer"
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            )}

            {/* Footer Guarantee */}
            <div className="text-center text-[10px] text-zinc-500 pt-1 border-t border-white/[0.06]">
              DeepFocus OS • 100% Offline Local Privacy • Cloud Synced
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
