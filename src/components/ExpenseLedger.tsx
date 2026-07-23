/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PersonalExpense, ExpenseCategory } from '../types';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Plus, Trash2, CreditCard, DollarSign, ArrowLeftRight, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface ExpenseLedgerProps {
  expenses: PersonalExpense[];
  onAddExpense: (amount: number, category: ExpenseCategory, note: string, date: string) => void;
  onDeleteExpense: (id: string) => void;
  isLightMode?: boolean;
}

export default function ExpenseLedger({ expenses, onAddExpense, onDeleteExpense, isLightMode }: ExpenseLedgerProps) {
  // Currency state: 'VND' or 'USD'
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
  const USD_EXCHANGE_RATE = 25400; // 1 USD = 25,400 VND

  // Setup inputs state
  const [inputAmount, setInputAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Eating');
  const [note, setNote] = useState('');
  
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getTodayDateString());

  // Filter modes: 'month' (default to current month-year) or 'all'
  const [filterMode, setFilterMode] = useState<'all' | 'month'>('month');
  const [filterMonthYear, setFilterMonthYear] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputAmount);
    if (isNaN(val) || val <= 0) return;

    // Convert input value to VND for standard internal storage
    const amountInVND = currency === 'USD' ? val * USD_EXCHANGE_RATE : val;

    onAddExpense(amountInVND, category, note.trim() || 'General Expense', date);
    setInputAmount('');
    setNote('');
  };

  // Convert amount based on active currency
  const formatCurrency = (amountInVND: number) => {
    if (currency === 'USD') {
      const usdVal = amountInVND / USD_EXCHANGE_RATE;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(usdVal);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amountInVND) + ' ₫';
  };

  // Filter expenses based on active selection
  const filteredExpenses = useMemo(() => {
    if (filterMode === 'all') return expenses;
    return expenses.filter(item => item.date.startsWith(filterMonthYear));
  }, [expenses, filterMode, filterMonthYear]);

  // Sort filtered expenses chronological (latest first) for listing
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredExpenses]);

  // Total cash burned based on filtered expenses
  const totalBurn = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  // Category summary for Pie Chart
  const categorySummary = useMemo(() => {
    const summary = {
      Eating: 0,
      Transport: 0,
      'Study/Equipment': 0,
      Entertainment: 0,
      Others: 0
    };
    filteredExpenses.forEach(item => {
      if (item.category in summary) {
        summary[item.category] += item.amount;
      } else {
        summary['Others'] += item.amount;
      }
    });
    return summary;
  }, [filteredExpenses]);

  // Full Monthly Daily Burn Rate (Bar Chart Data for all days of the month)
  const monthlyDailyBurnSummary = useMemo(() => {
    if (filterMode === 'month') {
      const [yearStr, monthStr] = filterMonthYear.split('-');
      const y = parseInt(yearStr);
      const m = parseInt(monthStr);
      if (!isNaN(y) && !isNaN(m)) {
        const totalDays = new Date(y, m, 0).getDate();
        const dailyTotals: Record<string, number> = {};

        // Initialize every day of month to 0
        for (let d = 1; d <= totalDays; d++) {
          const dayKey = `${filterMonthYear}-${String(d).padStart(2, '0')}`;
          dailyTotals[dayKey] = 0;
        }

        // Sum expenses
        filteredExpenses.forEach(item => {
          if (item.date in dailyTotals) {
            dailyTotals[item.date] += item.amount;
          }
        });

        const sortedKeys = Object.keys(dailyTotals).sort();
        return {
          labels: sortedKeys.map(k => {
            const parts = k.split('-');
            return parts[2]; // Day number (e.g., '01', '02', ..., '31')
          }),
          values: sortedKeys.map(k => {
            const vnd = dailyTotals[k];
            return currency === 'USD' ? +(vnd / USD_EXCHANGE_RATE).toFixed(2) : vnd;
          })
        };
      }
    }

    // Fallback for 'all' mode: group by existing dates
    const summary: Record<string, number> = {};
    filteredExpenses.forEach(item => {
      summary[item.date] = (summary[item.date] || 0) + item.amount;
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
      labels: ['DINING', 'TRANSPORT', 'STUDY / EQUIPMENT', 'ENTERTAINMENT', 'OTHERS'],
      datasets: [
        {
          data: displayData,
          backgroundColor: [
            'rgba(125, 211, 252, 0.6)',  // Pastel Blue
            'rgba(216, 180, 254, 0.6)',  // Pastel Purple
            'rgba(110, 231, 183, 0.6)',  // Pastel Emerald
            'rgba(254, 205, 211, 0.6)',  // Pastel Rose
            'rgba(253, 230, 138, 0.6)'   // Pastel Amber
          ],
          borderColor: isLightMode 
            ? ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'] 
            : ['#000000', '#000000', '#000000', '#000000', '#000000'],
          borderWidth: 2
        }
      ]
    };
  }, [categorySummary, isLightMode, currency, USD_EXCHANGE_RATE]);

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: isLightMode ? '#334155' : '#a1a1aa',
          font: { family: 'Inter', size: 8 }
        }
      },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: isLightMode ? '#cbd5e1' : '#18181b',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            return currency === 'USD'
              ? ` ${context.label}: $${val.toLocaleString()}`
              : ` ${context.label}: ${val.toLocaleString()} ₫`;
          }
        }
      }
    }
  };

  // Monthly Daily Burn Rate Bar Chart Data
  const barChartData = useMemo(() => {
    return {
      labels: monthlyDailyBurnSummary.labels,
      datasets: [
        {
          label: `DAILY EXPENSE (${currency})`,
          data: monthlyDailyBurnSummary.values,
          backgroundColor: 'rgba(254, 205, 211, 0.55)', // Pastel rose
          borderColor: '#fecdd3',
          borderWidth: 1,
        }
      ]
    };
  }, [monthlyDailyBurnSummary, currency]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLightMode ? '#ffffff' : '#09090b',
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
        borderColor: isLightMode ? '#cbd5e1' : '#18181b',
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
        ticks: { color: isLightMode ? '#475569' : '#71717a', font: { family: 'Inter', size: 8 } }
      },
      y: {
        grid: { color: isLightMode ? '#e2e8f0' : '#09090b' },
        ticks: { color: isLightMode ? '#475569' : '#71717a', font: { family: 'Inter', size: 8 } }
      }
    }
  };

  return (
    <div className="p-8 md:p-12 bg-black border border-zinc-900/40 mb-12 rounded-none">
      
      {/* Module Title & Currency Switcher Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-zinc-900/40 pb-6">
        <div>
          <h2 className="text-lg md:text-xl font-medium tracking-tight text-white flex items-center gap-2">
            <span>Financial Burn & Expense Ledger</span>
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase mt-1">
            DISCIPLINED CAPITAL MANAGEMENT • REAL-TIME CASH BURN TRACKER
          </p>
        </div>

        {/* Currency Switcher & Month Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-4 bg-zinc-950/60 p-3 border border-zinc-900 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* VND / USD Currency Switcher Toggle */}
          <div className="flex items-center gap-2 bg-black border border-zinc-900 p-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase px-1">CURRENCY:</span>
            <button
              onClick={() => setCurrency('VND')}
              className={`px-2.5 py-1 text-xs font-mono transition-all ${
                currency === 'VND'
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🇻🇳 VND (₫)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 text-xs font-mono transition-all ${
                currency === 'USD'
                  ? 'bg-sky-950 border border-sky-500/40 text-sky-300 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🇺🇸 USD ($)
            </button>
          </div>

          {/* Month / All Period Filter */}
          <div className="flex items-center gap-2 bg-black border border-zinc-900 px-3 py-1.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">PERIOD:</span>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'month')}
              className="bg-transparent text-xs font-mono text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="month" className="bg-black text-zinc-300">Selected Month</option>
              <option value="all" className="bg-black text-zinc-300">All Time</option>
            </select>

            {filterMode === 'month' && (
              <input
                type="month"
                value={filterMonthYear}
                onChange={(e) => setFilterMonthYear(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 px-2 py-0.5 focus:outline-none cursor-pointer"
              />
            )}
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Entry Form & Transaction History List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Quick Expense Entry Card */}
          <div className="bg-[#050506] border border-zinc-900 p-6">
            <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase mb-4 flex items-center justify-between">
              <span>RECORD NEW EXPENSE</span>
              <span className="text-[10px] text-zinc-600">INPUT IN {currency}</span>
            </h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Amount Input */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                    AMOUNT ({currency === 'USD' ? '$ USD' : '₫ VND'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={currency === 'USD' ? '0.01' : '1000'}
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      placeholder={currency === 'USD' ? 'e.g. 12.50' : 'e.g. 150000'}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                  >
                    <option value="Eating" className="bg-black text-zinc-200">Dining / Eating</option>
                    <option value="Transport" className="bg-black text-zinc-200">Transport / Fuel</option>
                    <option value="Study/Equipment" className="bg-black text-zinc-200">Study / Equipment</option>
                    <option value="Entertainment" className="bg-black text-zinc-200">Entertainment</option>
                    <option value="Others" className="bg-black text-zinc-200">Others / Misc</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Note */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                    NOTE / PURPOSE
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Lunch at cafe, Server subscription..."
                    className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">
                    DATE
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>RECORD CAPITAL EXPENDITURE</span>
              </button>
            </form>
          </div>

          {/* Transaction Ledger Table List */}
          <div className="bg-[#050506] border border-zinc-900 p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                  TRANSACTION HISTORY ({sortedExpenses.length})
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">
                  TOTAL: <strong className="text-rose-400">{formatCurrency(totalBurn)}</strong>
                </span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {sortedExpenses.length === 0 ? (
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest py-10 text-center border border-dashed border-zinc-900">
                    No expenses recorded in this period
                  </div>
                ) : (
                  sortedExpenses.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 bg-black border border-zinc-900/60 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-zinc-600" />
                        <div>
                          <div className="text-xs font-medium text-zinc-200">
                            {item.note}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span className="text-sky-400/80 uppercase">{item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-rose-400">
                          -{formatCurrency(item.amount)}
                        </span>
                        <button
                          onClick={() => onDeleteExpense(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-colors p-1"
                          title="Delete expense entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Analytics & Charts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Total Burn Rate Metric Header Box */}
          <div className="bg-black border border-zinc-900 p-6">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 flex justify-between items-center">
              <span>TOTAL CAPITAL EXPENDITURE</span>
              <span className="text-[9px] text-zinc-600 font-mono">RATE: 1 USD = 25,400 VND</span>
            </div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-rose-400 tracking-tight">
              {formatCurrency(totalBurn)}
            </div>
            <p className="text-[10px] font-mono text-zinc-600 mt-2">
              Calculated across {filteredExpenses.length} transactions for active filter period.
            </p>
          </div>

          {/* Monthly Daily Burn Rate Bar Chart */}
          <div className="bg-[#050506] border border-zinc-900 p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-mono tracking-widest text-zinc-400 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                <span>DAILY EXPENSE BAR CHART ({currency})</span>
              </h4>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">DAY 01 - 31</span>
            </div>

            <div className="h-[180px] w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="bg-[#050506] border border-zinc-900 p-6">
            <h4 className="text-xs font-mono tracking-widest text-zinc-400 uppercase mb-4">
              CATEGORY ALLOCATION BREAKDOWN
            </h4>

            <div className="h-[200px] w-full">
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
