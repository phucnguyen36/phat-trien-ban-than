import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, ShieldCheck, HelpCircle, Mail, Key, UserCheck, AlertCircle } from 'lucide-react';
import { authenticateUser, DEFAULT_ADMIN, UserAccount } from '../userRegistry';

interface AuthGateProps {
  onAuthenticated: (user: UserAccount) => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Check if user session stored in sessionStorage
    const savedUser = sessionStorage.getItem('df_os_active_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as UserAccount;
        if (user && user.email) {
          onAuthenticated(user);
        }
      } catch (e) {
        sessionStorage.removeItem('df_os_active_user');
      }
    }
  }, [onAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both Email and Access Password!');
      return;
    }

    const res = authenticateUser(email, password);
    if (res.success && res.user) {
      setIsUnlocked(true);
      sessionStorage.setItem('df_os_active_user', JSON.stringify(res.user));
      setTimeout(() => {
        onAuthenticated(res.user!);
      }, 600);
    } else {
      setErrorMessage(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  // Quick Preset Handlers for fast testing
  const handleFillAdmin = () => {
    setEmail(DEFAULT_ADMIN.email);
    setPassword(DEFAULT_ADMIN.password);
    setErrorMessage('');
  };

  const handleFillDemoClient = () => {
    setEmail('client.demo@gmail.com');
    setPassword('client123');
    setErrorMessage('');
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
          {/* Subtle ambient radial background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md glass-panel p-6 md:p-8 relative z-10 shadow-2xl space-y-6 border border-white/15"
          >
            {/* Top Brand Banner */}
            <div className="text-center space-y-2">
              <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase block">
                DEEP FOCUS SYSTEM INGRESS • v5.0
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold font-mono uppercase tracking-tight text-white">
                Deep Focus OS
              </h1>
              <p className="text-xs font-sans text-zinc-300">
                Executive Personal Growth & Performance System
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 glass-card border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase tracking-widest text-[10px]">LOGIN EMAIL:</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full glass-input py-3 pl-9 pr-3 rounded-none"
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase tracking-widest text-[10px]">ACCESS KEY PASSWORD:</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input py-3 pl-9 pr-3 rounded-none"
                  />
                  <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98"
              >
                <span>CONFIRM SYSTEM INGRESS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Demo Presets Bar for Easy Testing */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block text-center">
                DEMO PRESETS & QUICK INGRESS
              </span>
              <div className="flex gap-2 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={handleFillAdmin}
                  className="flex-1 py-2 glass-button text-zinc-200 hover:text-white transition-colors text-center font-semibold"
                >
                  👑 ADMIN PORTAL
                </button>
                <button
                  type="button"
                  onClick={handleFillDemoClient}
                  className="flex-1 py-2 glass-button text-zinc-300 hover:text-white transition-colors text-center font-semibold"
                >
                  👤 DEMO CLIENT
                </button>
              </div>
            </div>

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
