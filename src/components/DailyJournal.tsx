/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DailyJournal } from '../types';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { BookOpen, Calendar, Zap, Sparkles, History, ChevronDown, ChevronUp, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DailyJournalProps {
  journalEntries?: DailyJournal[];
  entries?: DailyJournal[];
  onSaveJournal?: (date: string, energy: number, text: string) => void;
  onSaveEntry?: (entry: DailyJournal) => void;
  onDeleteJournal?: (id: string) => void;
  isLightMode?: boolean;
}

export default function DailyJournalPanel({ 
  journalEntries, 
  entries, 
  onSaveJournal, 
  onSaveEntry, 
  onDeleteJournal,
  isLightMode 
}: DailyJournalProps) {
  const activeEntries = useMemo(() => {
    return journalEntries || entries || [];
  }, [journalEntries, entries]);

  // Local state for editor date
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [editorEnergy, setEditorEnergy] = useState<number>(3);
  const [editorText, setEditorText] = useState<string>('');
  
  // UI states for Collapsible Archive & Save Toast
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(true);
  const [showSaveNotice, setShowSaveNotice] = useState<boolean>(false);

  // Load existing entry when date changes
  useEffect(() => {
    const existing = activeEntries.find(e => e.id === selectedDate);
    if (existing) {
      setEditorEnergy(existing.energy);
      setEditorText(existing.text);
    } else {
      setEditorEnergy(3);
      setEditorText('');
    }
  }, [selectedDate, activeEntries]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveJournal) {
      onSaveJournal(selectedDate, editorEnergy, editorText);
    } else if (onSaveEntry) {
      onSaveEntry({
        id: selectedDate,
        energy: editorEnergy,
        text: editorText,
        updatedAt: Date.now()
      });
    }

    setShowSaveNotice(true);
    setTimeout(() => setShowSaveNotice(false), 3000);
  };

  // Sort entries by date descending for history list
  const historyEntries = useMemo(() => {
    return [...activeEntries].sort((a, b) => b.id.localeCompare(a.id));
  }, [activeEntries]);

  // Sort entries by date ascending for chart
  const sortedEntries = useMemo(() => {
    return [...activeEntries].sort((a, b) => a.id.localeCompare(b.id)).slice(-14);
  }, [activeEntries]);

  // Chart Data
  const chartData = useMemo(() => {
    return {
      labels: sortedEntries.map(e => e.id.slice(5)), // MM-DD
      datasets: [
        {
          label: 'Energy Level (1-5)',
          data: sortedEntries.map(e => Number(e.energy) || 1),
          borderColor: '#ffffff',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        }
      ]
    };
  }, [sortedEntries]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: '#18181b',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 9 } }
      },
      y: {
        min: 1,
        max: 5,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { 
          color: '#a1a1aa', 
          font: { family: 'Inter', size: 9 }, 
          stepSize: 1,
          callback: (val: any) => `⚡ ${val}`
        }
      }
    }
  };

  const energyLabels = ['Very Low', 'Low', 'Normal', 'High', 'Peak'];

  return (
    <div id="daily-journal" className="kuldeep-card p-6 md:p-8 mb-12 space-y-8">
      
      {/* 1. Header & Description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-zinc-300" />
            <span>Daily Journal</span>
          </h2>
          <p className="text-xs text-[#9496a1] mt-1">
            Energy levels, reflections, and daily notes
          </p>
        </div>

        <button
          onClick={() => setIsArchiveOpen(prev => !prev)}
          className="px-3.5 py-1.5 glass-button-true text-xs font-medium text-[#ededf3] hover:text-white flex items-center gap-2 rounded-full cursor-pointer"
        >
          <History className="w-4 h-4 text-zinc-300" />
          <span>Journal history ({activeEntries.length})</span>
          {isArchiveOpen ? <ChevronUp className="w-4 h-4 text-[#9496a1]" /> : <ChevronDown className="w-4 h-4 text-[#9496a1]" />}
        </button>
      </div>

      {/* Save Success Toast */}
      {showSaveNotice && (
        <div className="p-3 rounded-xl bg-white/[0.06] border border-white/15 text-zinc-200 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>Journal entry for <strong>{selectedDate}</strong> successfully saved.</span>
        </div>
      )}

      {/* 2. Logger Editor & Chart Wave Trend */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        
        {/* Left Column: Logger Editor */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Date Picker Row */}
            <div className="flex items-center gap-4 glass-card-true p-4 rounded-xl">
              <Calendar className="w-4 h-4 text-zinc-300" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-xs text-[#9496a1] font-medium">Log date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass-input-true px-3 py-1.5 text-xs text-white font-mono text-right font-medium cursor-pointer rounded-lg"
                />
              </div>
            </div>

            {/* Energy Level Selector (1 to 5) */}
            <div className="space-y-3">
              <label className="text-xs text-[#9496a1] block font-medium">
                Daily energy level (1 - 5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(level => {
                  const isActive = editorEnergy === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setEditorEnergy(level)}
                      className={`py-3 flex flex-col items-center justify-center gap-1.5 glass-button-true transition-all rounded-xl cursor-pointer ${
                        isActive 
                          ? 'bg-white text-black font-semibold border-white shadow-sm' 
                          : 'text-[#9496a1]'
                      }`}
                    >
                      <span className="text-base font-mono font-bold">{level}</span>
                      <span className={`text-[10px] ${isActive ? 'text-zinc-700' : 'text-[#9496a1]'}`}>
                        {energyLabels[level - 1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gratitude/Brain Dump Text Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-[#9496a1] block font-medium">
                  Gratitude & reflections
                </label>
                <span className="text-[10px] text-[#9496a1]">
                  {editorText.length} chars
                </span>
              </div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Write down reflections, lessons learned, or key insights today..."
                className="w-full h-36 glass-input-true p-4 text-xs leading-relaxed text-white placeholder-zinc-500 font-sans resize-none rounded-xl"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3 btn-primary-cyan text-xs font-semibold transition-all rounded-full flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save journal entry</span>
            </button>
          </form>
        </div>

        {/* Right Column: Chart Wave Trend */}
        <div className="w-full lg:w-1/2 flex flex-col h-full self-stretch border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-8 lg:pt-0 lg:pl-8 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold text-white">
              14-Day Energy Trend
            </h4>
            <span className="text-[10px] text-[#9496a1]">
              {sortedEntries.length} logs recorded
            </span>
          </div>

          <div className="flex-1 min-h-[220px] relative glass-card-true p-4 rounded-xl">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="p-4 glass-card-true text-xs text-[#9496a1] leading-relaxed space-y-1 rounded-xl">
            <span className="text-white font-medium block">
              Energy management tip
            </span>
            <p>
              High energy levels (4-5) should be aligned with deep work sessions. Low energy days (1-2) are ideal for recovery and passive reading.
            </p>
          </div>
        </div>

      </div>

      {/* 3. Collapsible Journal History Archive Drawer */}
      {isArchiveOpen && (
        <div className="pt-6 border-t border-white/15 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-300" />
              <span>Past Journal Entries History</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              Showing {historyEntries.length} entries
            </span>
          </div>

          {historyEntries.length === 0 ? (
            <div className="text-center py-8 glass-card-true text-xs font-sans text-zinc-400 rounded-xl">
              No past journal entries found. Type your first entry above and click "Save Journal Entry"!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1 no-scrollbar">
              {historyEntries.map((entry) => {
                const isSelected = entry.id === selectedDate;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 glass-card-true transition-all rounded-xl flex flex-col justify-between space-y-3 border ${
                      isSelected ? 'border-white/30 bg-white/[0.06]' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-mono font-bold text-white">{entry.id}</span>
                      </div>
                      <span className="px-2.5 py-0.5 glass-pill-true text-[10px] font-mono font-bold text-zinc-200">
                        ⚡ {entry.energy}/5 ({energyLabels[(entry.energy || 3) - 1]})
                      </span>
                    </div>

                    <p className="text-xs font-sans text-zinc-300 line-clamp-3 leading-relaxed italic bg-black/20 p-2.5 rounded-lg">
                      "{entry.text || 'No text written for this date.'}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-sans">
                      <span className="text-zinc-500 font-mono">
                        {entry.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString() : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(entry.id);
                            setEditorEnergy(entry.energy);
                            setEditorText(entry.text);
                          }}
                          className="px-2.5 py-1 glass-button-true text-zinc-200 hover:text-white flex items-center gap-1 rounded-lg text-[10px] cursor-pointer"
                          title="Load and edit this entry"
                        >
                          <Edit3 className="w-3 h-3 text-zinc-300" />
                          <span>Load / Edit</span>
                        </button>
                        {onDeleteJournal && (
                          <button
                            type="button"
                            onClick={() => onDeleteJournal(entry.id)}
                            className="p-1 glass-button-true text-zinc-500 hover:text-rose-400 rounded-lg cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
