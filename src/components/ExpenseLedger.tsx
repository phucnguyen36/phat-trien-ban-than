/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PersonalExpense, ExpenseCategory } from '../types';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement 
} from 'chart.js';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ExpenseLedgerProps {
  expenses: PersonalExpense[];
  onAddExpense: (amount: number, category: ExpenseCategory, note: string, date: string) => void;
  onDeleteExpense: (id: string) => void;
  isLightMode?: boolean;
}

export default function ExpenseLedger({ expenses, onAddExpense, onDeleteExpense, isLightMode }: ExpenseLedgerProps) {
  // Local Form state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<ExpenseCategory>('Eating');
  const [noteInput, setNoteInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(todayStr);

  // Currency selection: 'VND' or 'USD'
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
  const USD_EXCHANGE_RATE = 25400; // 1 USD = 25,400 VND

  // Filter Mode State: 'all' vs 'monthly'
  const [filterMode, setFilterMode] = useState<'all' | 'monthly'>('monthly');

  // Month selector YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
  const [filterMonthYear, setFilterMonthYear] = useState<string>(currentMonthStr);

  // Filtered expense list
  const filteredExpenses = useMemo(() => {
    if (filterMode === 'all') {
      return [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    }
    return expenses
      .filter(item => item.date.startsWith(filterMonthYear))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterMode, filterMonthYear]);

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) return;

    let finalVndAmount = num;
    if (currency === 'USD') {
      finalVndAmount = Math.round(num * USD_EXCHANGE_RATE);
    }

    const finalAmount = -Math.abs(finalVndAmount);
    onAddExpense(finalAmount, categoryInput, noteInput.trim(), dateInput || todayStr);

    setAmountInput('');
    setNoteInput('');
  };

  // Category Total Summaries (in VND)
  const categorySummary = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      Eating: 0,
      Transport: 0,
      'Study/Equipment': 0,
      Entertainment: 0,
      Others: 0
    };

    filteredExpenses.forEach(item => {
      const cat = item.category || 'Others';
      const absAmount = Math.abs(Number(item.amount) || 0);
      if (totals[cat] !== undefined) {
        totals[cat] += absAmount;
      } else {
        totals.Others += absAmount;
      }
    });

    return totals;
  }, [filteredExpenses]);

  // Total Burn Amount (in VND)
  const totalBurnVnd = useMemo(() => {
    return Object.values(categorySummary).reduce((a: number, b: number) => a + b, 0);
  }, [categorySummary]);

  // Monthly Daily Burn Summary
  const monthlyDailyBurnSummary = useMemo(() => {
    if (filterMode === 'monthly' && filterMonthYear) {
      const parts = filterMonthYear.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const totalDaysInMonth = new Date(year, month, 0).getDate();

        const dailyTotals: Record<string, number> = {};
        for (let d = 1; d <= totalDaysInMonth; d++) {
          const dayStr = String(d).padStart(2, '0');
          dailyTotals[`${filterMonthYear}-${dayStr}`] = 0;
        }

        filteredExpenses.forEach(item => {
          if (dailyTotals[item.date] !== undefined) {
            dailyTotals[item.date] += Math.abs(Number(item.amount) || 0);
          }
        });

        const sortedKeys = Object.keys(dailyTotals).sort();
        return {
          labels: sortedKeys.map(k => {
            const parts = k.split('-');
            return parts[2];
          }),
          values: sortedKeys.map(k => {
            const vnd = dailyTotals[k];
            return currency === 'USD' ? +(vnd / USD_EXCHANGE_RATE).toFixed(2) : vnd;
          })
        };
      }
    }

    const summary: Record<string, number> = {};
    filteredExpenses.forEach(item => {
      summary[item.date] = (summary[item.date] || 0) + Math.abs(Number(item.amount) || 0);
    });
    const sortedKeys = Object.keys(summary).sort();
    return {
      labels: sortedKeys.map(k => {
        const parts = k.split('-');
        return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : k;
      }),
      values: sortedKeys.map(k => {
        const vnd = summary[k];
        return currency === 'USD' ? +(vnd / USD_EXCHANGE_RATE).toFixed(2) : vnd;
      })
    };
  }, [filteredExpenses, filterMode, filterMonthYear, currency, USD_EXCHANGE_RATE]);

  // Pie Chart Config
  const pieChartData = useMemo(() => {
    const rawData = [
      categorySummary.Eating,
      categorySummary.Transport,
      categorySummary['Study/Equipment'],
      categorySummary.Entertainment,
      categorySummary.Others
    ];

    const displayData = currency === 'USD' 
      ? rawData.map(v => +(v / USD_EXCHANGE_RATE).toFixed(2))
      : rawData;

    return {
      labels: ['EATING', 'TRANSPORT', 'STUDY/GEAR', 'ENTERTAINMENT', 'OTHERS'],
      datasets: [
        {
          data: displayData,
          backgroundColor: [
            'rgba(253, 164, 175, 0.75)',
            'rgba(147, 197, 253, 0.75)',
            'rgba(216, 180, 254, 0.75)',
            'rgba(254, 240, 138, 0.75)',
            'rgba(203, 213, 225, 0.75)'
          ],
          borderColor: ['rgba(255,255,255,0.2)'],
          borderWidth: 1,
        }
      ]
    };
  }, [categorySummary, currency, USD_EXCHANGE_RATE]);

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#f4f4f5',
          font: { family: 'Inter', size: 9 },
          boxWidth: 10,
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: '#18181b',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            return currency === 'USD' ? ` $${val}` : ` ${val.toLocaleString()} ₫`;
          }
        }
      }
    }
  };

  const barChartData = useMemo(() => {
    return {
      labels: monthlyDailyBurnSummary.labels,
      datasets: [
        {
          label: 'DAILY BURN',
          data: monthlyDailyBurnSummary.values,
          backgroundColor: 'rgba(253, 164, 175, 0.75)',
          borderColor: '#fda4af',
          borderWidth: 1,
        }
      ]
    };
  }, [monthlyDailyBurnSummary]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: '#18181b',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            return currency === 'USD' ? ` Spend: $${val}` : ` Spend: ${val.toLocaleString()} ₫`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 8 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#a1a1aa', font: { family: 'Inter', size: 8 } }
      }
    }
  };

  return (
    <div id="expense-ledger" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl">
      
      {/* Module Title & Currency Switcher Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-white/15 pb-6">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase font-sans">
            Financial Burn & Expense Ledger
          </h2>
          <p className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase mt-1 font-bold">
            DISCIPLINED CAPITAL MANAGEMENT • REAL-TIME CASH BURN TRACKER
          </p>
        </div>

        {/* Currency Switcher & Month Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 glass-pill-true p-2 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* VND / USD Currency Switcher Toggle */}
          <div className="flex items-center gap-2 glass-card-true p-1">
            <span className="text-[9px] font-mono text-zinc-300 uppercase px-1 font-bold">CURRENCY:</span>
            <button
              onClick={() => setCurrency('VND')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-full ${
                currency === 'VND' ? 'bg-white/30 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ₫ VND
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-full ${
                currency === 'USD' ? 'bg-emerald-500/30 text-emerald-300 shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Filter Mode Switcher */}
          <div className="flex items-center gap-2 glass-card-true p-1">
            <button
              onClick={() => setFilterMode('monthly')}
              className={`px-3 py-1 text-[10px] font-mono uppercase font-bold transition-all rounded-full ${
                filterMode === 'monthly' ? 'bg-white/20 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-[10px] font-mono uppercase font-bold transition-all rounded-full ${
                filterMode === 'all' ? 'bg-white/20 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Month Picker */}
          {filterMode === 'monthly' && (
            <div className="flex items-center gap-1.5 glass-card-true px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-300" />
              <input
                type="month"
                value={filterMonthYear}
                onChange={(e) => setFilterMonthYear(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none font-mono cursor-pointer font-bold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Form Logger + Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        {/* Left 4 Columns: Expense Add Form */}
        <div className="lg:col-span-4 glass-card-true p-6 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm uppercase tracking-wider text-white font-extrabold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-300" />
              <span>Log New Expense</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold">Amount Spent:</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={currency === 'USD' ? '50.00' : '200000'}
                  className="w-full glass-input-true py-2.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 font-bold"
                />
                <span className="text-xs font-mono text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold">
                  {currency === 'USD' ? '$' : '₫'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold">Category:</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as ExpenseCategory)}
                className="w-full glass-input-true p-2.5 text-xs text-white font-semibold cursor-pointer"
              >
                <option value="Eating" className="bg-black text-white">🍔 Eating & Food</option>
                <option value="Transport" className="bg-black text-white">🚗 Transport & Fuel</option>
                <option value="Study/Equipment" className="bg-black text-white">📚 Study & Gear</option>
                <option value="Entertainment" className="bg-black text-white">🎬 Entertainment & Leisure</option>
                <option value="Others" className="bg-black text-white">📦 Others & Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold">Log Date:</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full glass-input-true p-2.5 text-xs text-white font-mono cursor-pointer font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-bold">Note / Description:</label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Lunch with team, Books..."
                className="w-full glass-input-true p-2.5 text-xs text-white placeholder-zinc-500 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 glass-button-true text-emerald-300 hover:text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>RECORD TRANSACTION</span>
            </button>
          </form>
        </div>

        {/* Right 8 Columns: Charts & Analytics Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card-true p-5 space-y-1">
              <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold">
                TOTAL BURN ({filterMode === 'monthly' ? filterMonthYear : 'ALL TIME'})
              </span>
              <div className="text-2xl font-extrabold font-mono text-rose-300">
                {currency === 'USD'
                  ? `$${(totalBurnVnd / USD_EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : `${totalBurnVnd.toLocaleString('vi-VN')} ₫`}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block">
                {filteredExpenses.length} transactions logged
              </span>
            </div>

            <div className="glass-card-true p-5 space-y-1">
              <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold">
                AVERAGE DAILY BURN
              </span>
              <div className="text-2xl font-extrabold font-mono text-white">
                {currency === 'USD'
                  ? `$${((totalBurnVnd / (monthlyDailyBurnSummary.labels.length || 1)) / USD_EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : `${Math.round(totalBurnVnd / (monthlyDailyBurnSummary.labels.length || 1)).toLocaleString('vi-VN')} ₫`}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block">
                Based on active period telemetry
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card-true p-4 h-64 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold block">
                CATEGORY DISTRIBUTION
              </span>
              <div className="flex-1 relative min-h-[160px]">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>

            <div className="glass-card-true p-4 h-64 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold block">
                DAILY BURN TREND
              </span>
              <div className="flex-1 relative min-h-[160px]">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="glass-card-true p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Transaction History ({filteredExpenses.length})
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">Sorted by Date</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 font-mono text-xs uppercase tracking-widest">
            No expenses logged for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-widest text-[10px] bg-white/[0.04]">
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description / Note</th>
                  <th className="p-3">Amount Spent</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                {filteredExpenses.map(item => {
                  const absVnd = Math.abs(Number(item.amount) || 0);
                  const displayAmount = currency === 'USD'
                    ? `$${(absVnd / USD_EXCHANGE_RATE).toFixed(2)}`
                    : `${absVnd.toLocaleString('vi-VN')} ₫`;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.06] transition-colors">
                      <td className="p-3 text-zinc-300 font-bold">{item.date}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold glass-pill-true text-zinc-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300 font-sans">{item.note || '—'}</td>
                      <td className="p-3 font-bold text-rose-300">-{displayAmount}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onDeleteExpense(item.id)}
                          className="p-1 glass-button-true text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
