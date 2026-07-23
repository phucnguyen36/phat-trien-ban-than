/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScratchpadNote } from '../types';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Activity, Database, Check, Save, Trash2, FileText, ArrowUpRight, FolderOpen, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

interface ScratchpadProps {
  initialText: string;
  isCloudConnected: boolean;
  onSaveText: (text: string) => void;
}

export default function Scratchpad({ initialText, isCloudConnected, onSaveText }: ScratchpadProps) {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Session start');
  
  // Note Title for archiving
  const [noteTitle, setNoteTitle] = useState('');

  // Local storage based notes archive
  const [savedNotes, setSavedNotes] = useState<ScratchpadNote[]>(() => {
    const saved = localStorage.getItem('df_scratchpad_archive');
    return saved ? JSON.parse(saved) : [];
  });

  // Track document size history for our luxury Chart.js visual
  const [sizeHistory, setSizeHistory] = useState<number[]>([initialText.length]);
  const [historyLabels, setHistoryLabels] = useState<string[]>(['Init']);

  // Sync state if initialText changes from parent (e.g., initial load or database sync)
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      setText(initialText);
      isFirstLoad.current = false;
      
      // Seed initial history
      const len = initialText.length;
      setSizeHistory([
        Math.max(0, len - 120),
        Math.max(0, len - 80),
        Math.max(0, len - 40),
        len
      ]);
      setHistoryLabels(['T-3', 'T-2', 'T-1', 'Now']);
    }
  }, [initialText]);

  // Debounce writing text to the database
  useEffect(() => {
    if (isFirstLoad.current) return; // Ignore first mount

    setIsSaving(true);
    const delayDebounce = setTimeout(() => {
      onSaveText(text);
      setIsSaving(false);
      
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('en-US'));
      
      // Update our character trend history chart
      setSizeHistory(prev => {
        const next = [...prev, text.length];
        if (next.length > 10) next.shift(); // Keep last 10 entries
        return next;
      });
      setHistoryLabels(prev => {
        const next = [...prev, now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })];
        if (next.length > 10) next.shift();
        return next;
      });
    }, 1200); // 1.2s debounce delay to avoid overloading database

    return () => clearTimeout(delayDebounce);
  }, [text, onSaveText]);

  // Persist notes archive
  useEffect(() => {
    localStorage.setItem('df_scratchpad_archive', JSON.stringify(savedNotes));
  }, [savedNotes]);

  // Save/Archive current notepad text
  const handleArchiveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const title = noteTitle.trim() || `Idea at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('en-US')}`;
    
    const newNote: ScratchpadNote = {
      id: 'sn_' + Math.random().toString(36).substring(2, 9),
      title,
      content: text,
      createdAt: Date.now()
    };

    setSavedNotes(prev => [newNote, ...prev]);
    setNoteTitle('');

    // Elegant toast
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed bottom-6 right-6 z-50 bg-[#020202] border border-[#10b981]/40 text-zinc-100 px-6 py-4 rounded-none font-sans text-xs shadow-2xl tracking-wider uppercase animate-fade-in flex items-center gap-3';
    alertDiv.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> IDEA SAVED TO ARCHIVE`;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      alertDiv.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => alertDiv.remove(), 500);
    }, 2500);
  };

  // Load a saved note into the notepad
  const handleLoadNote = (note: ScratchpadNote) => {
    setText(note.content);
    // Notify
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed bottom-6 right-6 z-50 bg-[#020202] border border-blue-500/40 text-zinc-100 px-6 py-4 rounded-none font-sans text-xs shadow-2xl tracking-wider uppercase animate-fade-in flex items-center gap-3';
    alertDiv.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span> IDEA LOADED TO PAD`;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      alertDiv.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => alertDiv.remove(), 500);
    }, 2000);
  };

  // Delete a saved note from archive
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedNotes(prev => prev.filter(n => n.id !== id));
  };

  // Clear notepad text to start a new blank pad
  const handleClearPad = () => {
    setText('');
  };

  // ChartJS setup for Character Growth with Inter Typography
  const chartData = useMemo(() => {
    return {
      labels: historyLabels,
      datasets: [
        {
          label: 'CHARACTER COUNT (CHARS)',
          data: sizeHistory,
          borderColor: '#10b981', // Emerald Green matching heartbeat
          backgroundColor: 'rgba(16, 185, 129, 0.03)',
          fill: true,
          tension: 0.3,
          borderWidth: 1.5,
          pointBackgroundColor: '#000000',
          pointBorderColor: '#10b981',
          pointBorderWidth: 1.5,
          pointRadius: 2.5,
        }
      ]
    };
  }, [sizeHistory, historyLabels]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { family: 'Inter', size: 9 },
        bodyFont: { family: 'Inter', size: 9 },
        borderColor: '#18181b',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 8 } }
      },
      y: {
        grid: { color: '#09090b' },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 8 } }
      }
    }
  };

  return (
    <div className="p-8 md:p-12 bg-black border border-zinc-900/40 mb-12 rounded-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Notepad Textarea & Archiver Form (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Indicators */}
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-900/40 pb-4 gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-medium tracking-tight text-white">
                Quick Scratchpad & Brain Dump
              </h2>
              <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase mt-1">
                HIGH-INTENSITY FOCUS NOTES • UNFORMATTED • AUTOMATIC SYNC
              </p>
            </div>

            {/* Sync Heartbeat Indicator */}
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-wider bg-[#020202] border border-zinc-900 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block ${
                  isCloudConnected 
                    ? 'bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]' 
                    : 'bg-zinc-700'
                }`}></span>
                <span className={isCloudConnected ? 'text-[#10b981]' : 'text-zinc-600'}>
                  {isCloudConnected ? 'HEARTBEAT CLOUD OK' : 'LOCAL SAVING'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 border-l border-zinc-900 pl-4 text-zinc-500">
                <span className="font-semibold text-zinc-400">{text.length}</span>
                <span>CHARS</span>
              </div>

              <div className="flex items-center gap-2 border-l border-zinc-900 pl-4 text-zinc-600">
                {isSaving ? (
                  <span className="text-amber-500 animate-pulse">SAVING...</span>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#10b981]" /> SYNCED ({lastSavedTime})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completely Borderless Input Canvas */}
          <div className="w-full bg-[#020202] border border-zinc-900 p-6 min-h-[300px] flex flex-col justify-start">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type any thought or breakthrough idea here... The system will auto-save and sync once you pause..."
              className="w-full flex-1 bg-transparent text-zinc-300 font-sans text-sm leading-relaxed focus:outline-none resize-none placeholder-zinc-800 min-h-[260px]"
              spellCheck={false}
            />
            
            {/* Toolbar row with Clear & Archive action */}
            <div className="mt-4 pt-4 border-t border-zinc-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleClearPad}
                disabled={!text}
                className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-950 hover:border-zinc-800 bg-transparent disabled:opacity-30 disabled:pointer-events-none transition-all uppercase"
              >
                CLEAR PAD (NEW)
              </button>

              <form onSubmit={handleArchiveNote} className="flex gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Set note title to archive (or leave empty)..."
                  className="bg-[#050506] border border-zinc-900 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 rounded-none flex-1 font-sans"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="px-4 py-1.5 border border-zinc-900 hover:border-emerald-500/50 bg-zinc-950 text-zinc-400 hover:text-emerald-400 transition-all font-mono text-xs uppercase flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Save className="w-3.5 h-3.5" />
                  ARCHIVE
                </button>
              </form>
            </div>
          </div>
          
          {/* Notes Archive Grid/Strip */}
          <div className="border-t border-zinc-950 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
                BRAIN DUMP ARCHIVE GALLERY
              </h3>
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-900 px-2 py-0.5 uppercase">
                {savedNotes.length} SAVED IDEAS
              </span>
            </div>

            {savedNotes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-950 text-zinc-600 font-mono text-xs uppercase tracking-widest">
                Idea archive empty. Type text and click Archive to save mental breakthroughs.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                {savedNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => handleLoadNote(note)}
                    className="p-4 bg-[#020202] border border-zinc-900 hover:border-zinc-700 hover:bg-[#050506]/40 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-sm font-medium text-zinc-200 line-clamp-1 group-hover:text-zinc-100 transition-colors">
                          {note.title}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all p-1"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 font-sans line-clamp-3 leading-relaxed italic mb-4">
                        {note.content}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-t border-zinc-950/80 pt-2">
                      <span>{new Date(note.createdAt).toLocaleString('en-US')}</span>
                      <span className="text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider">
                        LOAD TO PAD <ArrowUpRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Historical Character Chart (4 columns) */}
        <div className="lg:col-span-4 flex flex-col h-full self-stretch border-t lg:border-t-0 lg:border-l border-zinc-900 pt-10 lg:pt-0 lg:pl-10">
          <div className="mb-6">
            <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#10b981]" />
              <span>CHARACTER GROWTH GRAPH</span>
            </h4>
          </div>
          
          <div className="flex-1 min-h-[180px] relative">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Editorial instructions for Brain Dump */}
          <div className="mt-8 p-4 bg-[#050506] border border-zinc-950">
            <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block mb-1">
              CREATIVE DISCIPLINE GUIDE
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Avoid overthinking. When a new idea emerges, type it immediately into Scratchpad to clear working memory (RAM), freeing 100% resources for execution.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
