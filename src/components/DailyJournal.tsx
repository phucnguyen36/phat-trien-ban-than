/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { DailyJournal as DailyJournalType } from '../types';
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
import { Sparkles, Calendar, BookOpen, Clock } from 'lucide-react';

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

interface DailyJournalProps {
  journalEntries: DailyJournalType[];
  onSaveJournal: (date: string, energy: number, text: string) => void;
}

export default function DailyJournal({ journalEntries, onSaveJournal }: DailyJournalProps) {
  // Use today's date formatted as YYYY-MM-DD in local timezone
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  
  // Find entry for selected date, or fallback to empty state
  const activeEntry = useMemo(() => {
    return journalEntries.find(j => j.id === selectedDate) || {
      id: selectedDate,
      energy: 3,
      text: ''
    };
  }, [journalEntries, selectedDate]);

  const [editorEnergy, setEditorEnergy] = useState<number>(activeEntry.energy);
  const [editorText, setEditorText] = useState<string>(activeEntry.text);

  // Sync editor with active entry when date changes
  useEffect(() => {
    setEditorEnergy(activeEntry.energy);
    setEditorText(activeEntry.text);
  }, [activeEntry]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveJournal(selectedDate, editorEnergy, editorText);
    
    // Custom premium notification
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed bottom-6 right-6 z-50 bg-[#050506] border border-amber-500/30 text-zinc-100 px-6 py-4 rounded-none font-mono text-xs shadow-2xl tracking-widest uppercase animate-fade-in flex items-center gap-3';
    alertDiv.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span> JOURNAL ENTRY SYNCHRONIZED`;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      alertDiv.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => alertDiv.remove(), 500);
    }, 2500);
  };

  // Sort and filter entries chronologically for line chart
  const sortedEntriesForChart = useMemo(() => {
    return [...journalEntries].sort((a, b) => a.id.localeCompare(b.id));
  }, [journalEntries]);

  // Sort entries for gallery descending (latest first)
  const galleryEntries = useMemo(() => {
    return [...journalEntries].sort((a, b) => b.id.localeCompare(a.id));
  }, [journalEntries]);

  // ChartJS Data setup for Pastel Amber Energy waves
  const lineChartData = useMemo(() => {
    return {
      labels: sortedEntriesForChart.map(entry => {
        const parts = entry.id.split('-');
        return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : entry.id;
      }),
      datasets: [
        {
          label: 'ENERGY LEVEL',
          data: sortedEntriesForChart.map(entry => entry.energy),
          borderColor: '#fde68a', // Pastel Amber
          backgroundColor: 'rgba(253, 230, 138, 0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#000000',
          pointBorderColor: '#fde68a',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [sortedEntriesForChart]);

  const lineChartOptions = {
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
        grid: { display: false },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 9 } }
      },
      y: {
        min: 1,
        max: 5,
        grid: { color: '#09090b' },
        ticks: { 
          color: '#71717a', 
          font: { family: 'Inter', size: 9 }, 
          stepSize: 1,
          callback: (val: any) => `⚡ ${val}`
        }
      }
    }
  };

  return (
    <div className="p-8 md:p-12 bg-black border border-zinc-900/40 mb-12 rounded-none">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
        
        {/* 1. Left Column: Logger Editor */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between">
          <div className="border-b border-zinc-900/40 pb-6 mb-6 w-full">
            <h2 className="text-lg md:text-xl font-medium tracking-tight text-white mb-1">
              Daily Journal & Energy Flow
            </h2>
            <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">
              MENTAL HEALTH & CREATIVE TELEMETRY
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Date Picker Row */}
            <div className="flex items-center gap-4 bg-[#050506]/60 border border-zinc-900/40 p-4">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400 tracking-wider">SELECT LOG DATE:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-black border border-zinc-900/40 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800 font-mono text-right rounded-none"
                />
              </div>
            </div>

            {/* Energy Level Selector (1 to 5) */}
            <div className="space-y-3">
              <label className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase block">
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
                      className={`py-3 flex flex-col items-center justify-center gap-1.5 border transition-all duration-300 rounded-none focus:outline-none ${
                        isActive
                          ? 'bg-amber-950/20 border-[#fde68a] text-pastel-amber glow-amber scale-105'
                          : 'border-zinc-900 hover:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <span className="text-lg font-mono font-medium">{level}</span>
                      <span className="text-[8px] font-sans font-bold uppercase tracking-widest scale-90">
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
                <label className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase block">
                  GRATITUDE & QUICK BRAIN DUMP
                </label>
                <span className="text-[9px] font-mono text-zinc-600 uppercase">
                  {editorText.length} CHARS
                </span>
              </div>
              <textarea
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Write down 3 things you are grateful for today, thoughts, or key lessons learned to clear cognitive overhead..."
                className="w-full h-36 bg-[#050506] border border-zinc-900 p-4 text-xs leading-relaxed text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 rounded-none font-sans resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3 bg-transparent border border-amber-900/40 hover:border-[#fde68a] text-pastel-amber hover:text-amber-200 font-mono text-xs tracking-[0.25em] uppercase rounded-none transition-all duration-300"
            >
              SAVE JOURNAL ENTRY
            </button>
          </form>
        </div>

        {/* 2. Right Column: Chart Wave Trend */}
        <div className="w-full lg:w-1/2 flex flex-col h-full self-stretch border-t lg:border-t-0 lg:border-l border-zinc-900 pt-10 lg:pt-0 lg:pl-10">
          <div className="mb-6">
            <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
              MENTAL ENERGY WAVE TREND
            </h4>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            {sortedEntriesForChart.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                No energy wave telemetry recorded
              </div>
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
          <p className="text-[10px] font-sans text-zinc-500 mt-6 leading-relaxed italic text-center">
            "Sustained mental stamina at level 4-5 is essential for optimal flow states."
          </p>
        </div>

      </div>

      {/* 3. New Journal Gallery Strip (Gallery Section) */}
      <div className="mt-12 border-t border-zinc-950 pt-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            JOURNAL ARCHIVE GALLERY
          </h3>
          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-900 px-2 py-0.5 uppercase tracking-wider">
            {galleryEntries.length} SAVED ENTRIES
          </span>
        </div>

        {galleryEntries.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-900 text-zinc-600 font-mono text-xs uppercase tracking-widest">
            Archive empty. Save today's journal entry to create a timeline mark.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {galleryEntries.map(entry => {
              const parts = entry.id.split('-');
              const formattedDate = parts.length >= 3 
                ? `${parts[2]}/${parts[1]}/${parts[0]}` 
                : entry.id;
              
              // Custom pastel colors mapping based on Energy level
              const energyLabels = ['Very Low', 'Low', 'Normal', 'High', 'Peak'];
              const energyBadgeColors = [
                'text-pastel-red bg-pastel-red-dim border-pastel-red',      // 1: Rose
                'text-pastel-purple bg-pastel-purple-dim border-pastel-purple', // 2: Lavender
                'text-zinc-300 bg-zinc-900 border-zinc-800',                // 3: Zinc
                'text-pastel-blue bg-pastel-blue-dim border-pastel-blue',    // 4: Sky Blue
                'text-pastel-green bg-pastel-green-dim border-pastel-green'   // 5: Mint Green
              ];
              const isCurrentActive = selectedDate === entry.id;

              return (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.id)}
                  className={`flex-none w-64 text-left p-4 border transition-all duration-300 hover:-translate-y-0.5 focus:outline-none rounded-none cursor-pointer ${
                    isCurrentActive 
                      ? 'bg-zinc-950 border-pastel-blue shadow-[0_0_15px_rgba(125,211,252,0.15)]' 
                      : 'bg-[#020202] border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {formattedDate}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 border font-mono font-bold uppercase tracking-wider ${energyBadgeColors[entry.energy - 1]}`}>
                      ⚡ Lvl {entry.energy}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans line-clamp-3 leading-relaxed italic pr-1">
                    {entry.text || 'No detailed notes recorded...'}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
