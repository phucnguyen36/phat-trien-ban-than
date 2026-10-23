/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Layers, 
  Type, 
  Maximize2, 
  Palette, 
  Compass, 
  Monitor, 
  Globe, 
  Database, 
  Flame, 
  Check, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface AntiSlopManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'manifesto' | 'checklist' | 'handoff';

const CHECKLIST_ITEMS = [
  { id: 'c1', label: '1. Typography Letter-Spacing Scale', desc: 'No global -0.025em on uppercase. Badges and pills have letter-spacing: 0.04em.' },
  { id: 'c2', label: '2. Tabular Numbers on Windows', desc: 'No raw font-mono pixelated fallbacks (Courier/Consolas). Uses tabular-nums lining-nums.' },
  { id: 'c3', label: '3. Dynamic String Sizing', desc: 'Dynamic text (task names, journal titles) uses flex-1 min-w-0 to prevent awkward truncation.' },
  { id: 'c4', label: '4. Geometric Symmetry', desc: 'Adjacent controls share height (e.g. h-7), consistent border radius, and matching opacities.' },
  { id: 'c5', label: '5. Swiss Monochrome & Dark Canvas', desc: 'Onyx #0b0c10, Graphite #12141a cards, border-white/10. No harsh solid white badges.' },
  { id: 'c6', label: '6. Zero Emoji Slop in Data', desc: '100% SVG line vectors (Lucide React, stroke-width 1.5-2px). No unaligned colored emojis in tables.' },
  { id: 'c7', label: '7. Consistent International English', desc: 'No half-English half-Vietnamese phrasing. Concise action verbs (Start, Pause, Reset, Dismiss).' },
  { id: 'c8', label: '8. Frameless OS & Dark PiP', desc: 'Electron uses frame: false, transparent: true, drag regions. Browser PiP injects dark color-scheme.' },
  { id: 'c9', label: '9. Zero Data Loss Protocol', desc: 'Dual-tier persistence: 0ms synchronous LocalStorage load + Firestore sync without empty array overwrite.' },
  { id: 'c10', label: '10. Audio Autoplay Protection', desc: 'Warm singleton AudioContext unlocked on first user interaction so alarms never fail silently.' }
];

const SEVEN_DAY_PLAN = [
  { day: 'Day 1', title: 'Core UX & Swiss System', status: 'completed', desc: 'Onyx #0b0c10 palette, Plus Jakarta Sans, zero AI slop typography.' },
  { day: 'Day 2', title: 'Dual-Tier Persistence', status: 'completed', desc: 'Instant 0ms LocalStorage + Cloud Firestore realtime dual sync.' },
  { day: 'Day 3', title: 'Pomodoro Station & Chime', status: 'completed', desc: 'Tibetan singing bowl audio, autoplay unlocker, native OS notifications.' },
  { day: 'Day 4', title: 'Whop Monetization & Gates', status: 'completed', desc: 'Updated pricing tiers ($29/mo & $99/6-mo), Freemium ProFeatureLockGate.' },
  { day: 'Day 5', title: 'Desktop Frameless Mini Timer', status: 'completed', desc: 'Electron windowless floating card, drag regions, English PiP layout.' },
  { day: 'Day 6', title: 'Whop Purchase Flow & Redirect', status: 'active', desc: 'Post-purchase license key onboarding, checkout link synchronization.' },
  { day: 'Day 7', title: 'Portable .exe Packaging', status: 'upcoming', desc: 'Windows portable executable release and production distribution.' }
];

export const AntiSlopManifestoModal: React.FC<AntiSlopManifestoModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('manifesto');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('df_anti_slop_checklist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default all checked since v5.0.0 meets all standards
    const defaults: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(item => { defaults[item.id] = true; });
    return defaults;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('df_anti_slop_checklist', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  if (!isOpen) return null;

  const completedChecklistCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-[#090a0f] border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] font-sans"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  DeepFocus Engineering & Anti-AI-Slop Manifesto
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold bg-white/10 text-zinc-300 border border-white/15">
                  v5.0.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Battle-tested design standards, quality gates, and live 7-day progress
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/[0.08] bg-white/[0.02] gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('manifesto')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manifesto'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>7 Core Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'checklist'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>10-Point Quality Gate</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/10 text-zinc-300">
              {completedChecklistCount}/{CHECKLIST_ITEMS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('handoff')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'handoff'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>7-Day Roadmap</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6 scrollbar-thin">
          {/* TAB 1: 7 CORE RULES */}
          {activeTab === 'manifesto' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-white">What is UI AI Slop?</span> In software design, AI slop is visual laziness: mockups that look shiny in screenshots but fall apart in real usage with cramped text, pixelated Windows fonts, unaligned emojis, and fragile happy-path engineering. DeepFocus OS enforces 7 immutable design laws:
              </div>

              {/* Rule 1 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">1. Typography Scale & Tabular Sans</h4>
                    <span className="text-[10px] font-mono text-zinc-400">Anti-Crushed Uppercase & Windows Pixel Fallback</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  Headings use <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">-0.02em</code>, body text uses <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">-0.01em</code>, and uppercase badges use <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">+0.04em</code>. All countdowns and metrics use <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">tabular-nums lining-nums</code> on Plus Jakarta Sans so digits align perfectly without falling back to Windows Courier/Consolas.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">2. Dynamic Layout & Minimal Action Footprint</h4>
                    <span className="text-[10px] font-mono text-zinc-400">Anti-Cramped Panel Overflow</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  No crowding 3-4 tiny buttons in a 260px bar. Dynamic text fields apply <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">flex-1 min-w-0</code> so task titles never get chopped into unreadable stubs. Adjacent buttons share matching heights (e.g. <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">h-7</code>) and concentric pill radiuses.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">3. Swiss Dark Canvas & Tactile Grain</h4>
                    <span className="text-[10px] font-mono text-zinc-400">No Rainbow Gradients & Blinding White Badges</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  Onyx <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">#0b0c10</code> canvas, Graphite <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">#12141a</code> surfaces, and subtle <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">white/10</code> borders. Solid white rectangles are replaced by refined 10% translucent pills with pulsing status dots and film grain <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">.noise-overlay</code>.
                </p>
              </div>

              {/* Rule 4 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">4. 100% Monochrome Vector SVGs</h4>
                    <span className="text-[10px] font-mono text-zinc-400">Zero Unaligned Emojis in Data Tables</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  All icons are Lucide React SVG line vectors with consistent stroke widths (1.5 - 2px). Raw colored OS emojis are banned from data grids, tables, and section headers to maintain an executive software standard across Windows, Mac, and Linux.
                </p>
              </div>

              {/* Rule 5 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">5. Deep OS Integration & Frameless Reality</h4>
                    <span className="text-[10px] font-mono text-zinc-400">Zero Windows Titlebar & Border Clutter</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  In Electron, floating widgets use <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">frame: false, transparent: true, alwaysOnTop: true</code> with CSS draggable regions. In browser PiP, dark color-scheme and theme-color meta tags are injected to force Windows title bars pitch black.
                </p>
              </div>

              {/* Rule 6 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">6. 100% International Standard English</h4>
                    <span className="text-[10px] font-mono text-zinc-400">No Half-English Half-Vietnamese Hybrid Slop</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  No hybrid phrasing like &ldquo;Bắt đầu Focus (25 phút)&rdquo; or &ldquo;Ghim PiP&rdquo;. Tooltips, badges, buttons, and notifications use crisp, concise English verbs: <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">Start</code>, <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">Pause</code>, <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">Add 5m</code>, <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">Dismiss</code>.
                </p>
              </div>

              {/* Rule 7 */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 text-white">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">7. Defensive Engineering (Zero Data Loss)</h4>
                    <span className="text-[10px] font-mono text-zinc-400">No Happy-Path Coding Flaws</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-9">
                  Instant 0ms synchronous LocalStorage initialization on load. Firestore realtime listeners never wipe local state on empty arrays. AudioContext is pre-warmed on the first pointer down so timers never finish silently in background tabs.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 10-POINT QUALITY GATE CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Quality Gate: <strong>{completedChecklistCount} of {CHECKLIST_ITEMS.length}</strong> standards verified.</span>
                </div>
                {completedChecklistCount === CHECKLIST_ITEMS.length && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                    Production Ready
                  </span>
                )}
              </div>

              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <div 
                    key={item.id}
                    onClick={() => toggleCheckItem(item.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked 
                        ? 'bg-white/[0.04] border-white/20' 
                        : 'bg-white/[0.01] border-white/[0.06] hover:border-white/15'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors border ${
                      isChecked 
                        ? 'bg-white text-black border-white' 
                        : 'border-white/20 hover:border-white/40'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-semibold block leading-tight ${isChecked ? 'text-white' : 'text-zinc-300'}`}>
                        {item.label}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: 7-DAY ROADMAP & HANDOFF */}
          {activeTab === 'handoff' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-mono">Current Launch Cycle</span>
                  <span className="text-white font-bold text-sm">7-Day Commercial Execution Plan</span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <span className="text-emerald-400">Day 5 Completed</span>
                  <span className="text-zinc-400 block text-[10px]">Day 6 in progress</span>
                </div>
              </div>

              <div className="space-y-2">
                {SEVEN_DAY_PLAN.map((step, idx) => {
                  const isDone = step.status === 'completed';
                  const isActive = step.status === 'active';
                  return (
                    <div 
                      key={step.day}
                      className={`p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                        isActive 
                          ? 'bg-purple-500/[0.08] border-purple-500/40 shadow-sm' 
                          : isDone 
                          ? 'bg-white/[0.03] border-white/10' 
                          : 'bg-white/[0.01] border-white/[0.04] opacity-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                        isDone 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : isActive 
                          ? 'bg-purple-500 text-white font-bold animate-pulse' 
                          : 'bg-white/5 text-zinc-500 border border-white/10'
                      }`}>
                        {isDone ? <Check className="w-4 h-4" /> : `${idx + 1}`}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                            {step.day}
                          </span>
                          <span className={`text-xs font-semibold ${isActive ? 'text-white' : isDone ? 'text-zinc-200' : 'text-zinc-400'}`}>
                            {step.title}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Active Focus
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 space-y-2">
                <span className="font-semibold text-zinc-200 block text-xs">Live System Architecture Status:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-zinc-500 block">Whop Monthly:</span>
                    <span className="text-white font-semibold">$29 / month</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-zinc-500 block">Whop 6 Months:</span>
                    <span className="text-white font-semibold">$99 pass</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-zinc-500 block">Electron Mini Timer:</span>
                    <span className="text-emerald-400 font-semibold">Frameless 100%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-zinc-500 block">Dual Persistence:</span>
                    <span className="text-emerald-400 font-semibold">Local 0ms + Firestore</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-400">
            Document: <code className="text-zinc-300">ANTI_AI_SLOP_GUIDE.md</code> & <code className="text-zinc-300">HANDOFF.md</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

export default AntiSlopManifestoModal;
