/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [accessKey, setAccessKey] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Check if previously unlocked in this session
    const unlocked = sessionStorage.getItem('df_os_unlocked') === 'true';
    if (unlocked) {
      onAuthenticated();
    }
  }, [onAuthenticated]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessKey === 'phuc2026') {
      setIsUnlocked(true);
      sessionStorage.setItem('df_os_unlocked', 'true');
      setTimeout(() => {
        onAuthenticated();
      }, 800); // Wait for fade out animation
    } else {
      setIsError(true);
      setAccessKey('');
      setTimeout(() => setIsError(false), 800); // Reset shake
    }
  };

  return (
    <AnimatePresence>
      {!isUnlocked && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-zinc-100 p-8"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {/* Subtle elegant ambient background mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(24,24,27,0.4)_0%,rgba(0,0,0,1)_100%)] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md text-center flex flex-col items-center relative z-10"
          >
            {/* Top Minimal Brand Code */}
            <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-600 uppercase mb-8">
              DEEP FOCUS SYSTEM INGRESS
            </span>

            {/* Premium Serif Header */}
            <h1 className="text-4xl md:text-5xl font-light tracking-wide text-zinc-100 mb-2">
              Deep Focus OS
            </h1>
            <p className="text-sm font-light text-zinc-500 italic font-serif tracking-wide mb-12">
              v5.0 Integrated Workspace
            </p>

            {/* Input Form */}
            <form onSubmit={handleUnlock} className="w-full max-w-xs flex flex-col items-center gap-6">
              <div className="w-full relative">
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="ENTER INGRESS KEY"
                  className={`w-full bg-transparent text-center font-mono text-sm tracking-[0.3em] py-3 border-b border-zinc-800 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-400 transition-all uppercase rounded-none ${
                    isError ? 'border-red-500 text-red-400 animate-shake' : ''
                  }`}
                  autoFocus
                />
                
                {/* Submit Indicator */}
                <button
                  type="submit"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-zinc-200 transition-colors"
                  aria-label="Unlock"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Status Notice */}
              <div className="h-6">
                <AnimatePresence mode="wait">
                  {isError ? (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-[10px] font-mono text-red-500/80 tracking-widest uppercase"
                    >
                      ACCESS DENIED • RETRY
                    </motion.p>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase hover:opacity-100 cursor-help transition-all flex items-center gap-1.5 justify-center"
                      title="Key is: phuc2026"
                    >
                      <HelpCircle className="w-3 h-3" /> KEY REQUIRED
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Bottom Credit */}
            <div className="absolute bottom-[-150px] text-[10px] font-mono tracking-widest text-zinc-700 uppercase">
              Xuan Phuc © 2026 • ALL RIGHTS RESERVED
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
