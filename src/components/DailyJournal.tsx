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
import { BookOpen, Calendar, Zap, Sparkles } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface DailyJournalProps {
  journalEntries?: DailyJournal[];
  entries?: DailyJournal[];
  onSaveJournal?: (date: string, energy: number, text: string) => void;
  onSaveEntry?: (entry: DailyJournal) => void;
  isLightMode?: boolean;
}

export default function DailyJournalPanel({ 
  journalEntries, 
  entries, 
  onSaveJournal, 
  onSaveEntry, 
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
  };

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
          label: 'ENERGY LEVEL (1-5)',
          data: sortedEntries.map(e => Number(e.energy) || 1),
          borderColor: '#fde68a',
          backgroundColor: 'rgba(253, 230, 138, 0.15)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: '#fde68a',
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

  return (
    <div id="daily-journal" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
        
        {/* 1. Left Column: Logger Editor */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between">
          <div className="border-b border-white/15 pb-4 mb-6 w-full">
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase font-sans">
              Daily Journal & Energy Flow
            </h2>
            <p className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase font-bold mt-1">
              MENTAL HEALTH & CREATIVE TELEMETRY
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Date Picker Row */}
            <div className="flex items-center gap-4 glass-card-true p-4">
              <Calendar className="w-4 h-4 text-zinc-300" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-300 tracking-wider font-bold">SELECT LOG DATE:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass-input-true px-3 py-1.5 text-xs text-white font-mono text-right font-bold cursor-pointer"
                />
              </div>
            </div>

            {/* Energy Level Selector (1 to 5) */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-zinc-300 tracking-wider uppercase block font-bold">
                DAILY ENERGY LEVEL
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(level => {
                  const isActive = editorEnergy === level;
                  const labelTexts = ['Very Low', 'Low', 'Normal', 'High', 'Peak'];
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setEditorEnergy(level)}
                      className={`py-3 flex flex-col items-center justify-center gap-1.5 glass-button-true transition-all rounded-xl ${
                        isActive ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-lg scale-105 font-bold' : 'text-zinc-300'
                      }`}
                    >
                      <span className="text-lg font-mono font-bold">{level}</span>
                      <span className="text-[8px] font-sans font-bold uppercase tracking-widest">
                        {labelTexts[level - 1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gratitude/Brain Dump Text Area */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-mono text-zinc-300 tracking-wider uppercase block font-bold">
                  GRATITUDE & QUICK BRAIN DUMP
                </label>
                <span className="text-[9px] font-mono text-zinc-400 uppercase">
                  {editorText.length} CHARS
                </span>
              </div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Write down 3 things you are grateful for today, thoughts, or key lessons learned to clear cognitive overhead..."
                className="w-full h-36 glass-input-true p-4 text-xs leading-relaxed text-white placeholder-zinc-500 font-sans resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3.5 glass-button-true text-amber-300 hover:text-white font-mono text-xs tracking-[0.25em] uppercase font-bold transition-all"
            >
              SAVE JOURNAL ENTRY
            </button>
          </form>
        </div>

        {/* 2. Right Column: Chart Wave Trend */}
        <div className="w-full lg:w-1/2 flex flex-col h-full self-stretch border-t lg:border-t-0 lg:border-l border-white/15 pt-10 lg:pt-0 lg:pl-10">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-mono tracking-widest text-zinc-300 uppercase font-bold">
              14-DAY ENERGY TELEMETRY TREND
            </h4>
            <span className="text-[10px] font-mono text-zinc-400">
              {sortedEntries.length} LOGS RECORDED
            </span>
          </div>

          <div className="flex-1 min-h-[260px] relative glass-card-true p-4">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="mt-6 p-4 glass-card-true text-[11px] font-sans text-zinc-300 leading-relaxed space-y-1">
            <span className="font-mono text-amber-300 uppercase tracking-wider block font-bold">
              💡 ENERGY MANAGEMENT NOTE
            </span>
            <p>
              High energy levels (4-5) should be aligned with deep work sessions. Low energy days (1-2) are ideal for recovery, passive reading, or routine admin tasks.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
