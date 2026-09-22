/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PersonalExpense, ExpenseCategory } from '../types';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement,
  LineElement
} from 'chart.js';
import { SIGNATURE_ACCENT_COLOR, hexToRgba } from '../utils/themeColors';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar,
  TrendingDown,
  Activity,
  PieChart,
  Wallet,
  ArrowUpRight,
  Tag, 
  ChevronDown, 
  X, 
  FileSpreadsheet, 
  BarChart3, 
  CreditCard, 
  Layers, 
  Receipt, 
  Filter 
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

interface ExpenseLedgerProps {
  expenses: PersonalExpense[];
  onAddExpense: (amount: number, category: ExpenseCategory, note: string, date: string) => void;
  onDeleteExpense: (id: string) => void;
  isLightMode?: boolean;
  accentColor?: string;
}

interface CurrencyMeta {
  symbol: string;
  label: string;
  rate: number;
  prefix?: string;
  suffix?: string;
}

const CURRENCIES: Record<string, CurrencyMeta> = {
  VND: { symbol: '₫', label: 'VND (Vietnamese Dong)', rate: 1, suffix: '₫' },
  USD: { symbol: '$', label: 'USD (US Dollar)', rate: 25400, prefix: '$' },
  EUR: { symbol: '€', label: 'EUR (Euro)', rate: 27500, prefix: '€' },
  GBP: { symbol: '£', label: 'GBP (British Pound)', rate: 32000, prefix: '£' },
  JPY: { symbol: '¥', label: 'JPY (Japanese Yen)', rate: 165, prefix: '¥' },
  SGD: { symbol: 'S$', label: 'SGD (Singapore Dollar)', rate: 19000, prefix: 'S$' },
  AUD: { symbol: 'A$', label: 'AUD (Australian Dollar)', rate: 16500, prefix: 'A$' },
};

type CurrencyCode = keyof typeof CURRENCIES;

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; border: string; text: string; hex: string }> = {
  Eating: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-300', hex: '#fda4af' },
  Transport: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-300', hex: '#7dd3fc' },
  'Study/Equipment': { bg: 'bg-white/10', border: 'border-white/20', text: 'text-zinc-200', hex: '#e4e4e7' },
  Entertainment: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-200', hex: '#fde68a' },
  Others: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400', hex: '#71717a' }
};

export default function ExpenseLedger({ 
  expenses, 
  onAddExpense, 
  onDeleteExpense, 
  isLightMode,
  accentColor = SIGNATURE_ACCENT_COLOR 
}: ExpenseLedgerProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<ExpenseCategory>('Eating');
  const [noteInput, setNoteInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(todayStr);

  // Persistent currency state: default to VND and remember user preference across reloads
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('df_expense_currency') as CurrencyCode;
      if (saved && CURRENCIES[saved]) return saved;
    } catch (e) {}
    return 'VND';
  });

  const handleCurrencyChange = (newCode: CurrencyCode) => {
    setCurrency(newCode);
    try {
      localStorage.setItem('df_expense_currency', newCode);
      window.dispatchEvent(new Event('df_currency_change'));
    } catch (e) {}
  };

  const [filterMode, setFilterMode] = useState<'all' | 'monthly'>('monthly');

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);
  const [filterMonthYear, setFilterMonthYear] = useState<string>(currentMonthStr);

  const formatMoney = (vndAmount: number, code: CurrencyCode = currency) => {
    const meta = CURRENCIES[code] || CURRENCIES.VND;
    const converted = Math.abs(vndAmount) / meta.rate;
    const isZeroDecimal = code === 'VND' || code === 'JPY';
    const formattedNum = isZeroDecimal 
      ? Math.round(converted).toLocaleString('en-US') 
      : converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (meta.prefix) return `${meta.prefix}${formattedNum}`;
    return `${formattedNum} ${meta.suffix || meta.symbol}`;
  };

  const filteredExpenses = useMemo(() => {
    if (filterMode === 'all') {
      return [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    }
    return expenses
      .filter(item => item.date.startsWith(filterMonthYear))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterMode, filterMonthYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) return;

    let finalVndAmount = num;
    const meta = CURRENCIES[currency] || CURRENCIES.VND;
    if (currency !== 'VND') {
      finalVndAmount = Math.round(num * meta.rate);
    }

    const finalAmount = -Math.abs(finalVndAmount);
    onAddExpense(finalAmount, categoryInput, noteInput.trim(), dateInput || todayStr);

    setAmountInput('');
    setNoteInput('');
  };

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

  const totalBurnVnd = useMemo(() => {
    return Object.values(categorySummary).reduce((a: number, b: number) => a + b, 0);
  }, [categorySummary]);

  // Largest transaction
  const highestTransaction = useMemo(() => {
    if (filteredExpenses.length === 0) return null;
    return filteredExpenses.reduce((max, curr) => 
      Math.abs(curr.amount) > Math.abs(max.amount) ? curr : max
    , filteredExpenses[0]);
  }, [filteredExpenses]);

  // Top category
  const topCategoryInfo = useMemo(() => {
    let topCat: ExpenseCategory = 'Others';
    let topAmt = 0;
    Object.entries(categorySummary).forEach(([c, amt]) => {
      const numAmt = Number(amt) || 0;
      if (numAmt > topAmt) {
        topAmt = numAmt;
        topCat = c as ExpenseCategory;
      }
    });
    const percentage = totalBurnVnd > 0 ? Math.round((topAmt / totalBurnVnd) * 100) : 0;
    return { category: topCat, amount: topAmt, percentage };
  }, [categorySummary, totalBurnVnd]);

  // Timeline Trend Data (Daily progression across the month)
  const timelineData = useMemo(() => {
    if (filterMode === 'monthly' && filterMonthYear) {
      const parts = filterMonthYear.split('-');
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
      const meta = CURRENCIES[currency] || CURRENCIES.VND;

      return {
        labels: sortedKeys.map(k => `Day ${parseInt(k.split('-')[2], 10)}`),
        values: sortedKeys.map(k => +(dailyTotals[k] / meta.rate).toFixed(2)),
        rawVnd: sortedKeys.map(k => dailyTotals[k])
      };
    }

    // All time mode: group by date
    const summary: Record<string, number> = {};
    filteredExpenses.forEach(item => {
      summary[item.date] = (summary[item.date] || 0) + Math.abs(Number(item.amount) || 0);
    });
    const sortedKeys = Object.keys(summary).sort();
    const meta = CURRENCIES[currency] || CURRENCIES.VND;

    return {
      labels: sortedKeys.map(k => {
        const parts = k.split('-');
        return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : k;
      }),
      values: sortedKeys.map(k => +(summary[k] / meta.rate).toFixed(2)),
      rawVnd: sortedKeys.map(k => summary[k])
    };
  }, [filteredExpenses, filterMode, filterMonthYear, currency]);

  // Large Timeline Bar Chart Config
  const timelineChartData = useMemo(() => {
    return {
      labels: timelineData.labels,
      datasets: [
        {
          label: 'Outflow',
          data: timelineData.values,
          backgroundColor: hexToRgba(accentColor, 0.75),
          hoverBackgroundColor: accentColor,
          borderColor: accentColor,
          borderWidth: 1,
          borderRadius: 6,
        }
      ]
    };
  }, [timelineData, accentColor]);

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c0d12',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            const meta = CURRENCIES[currency] || CURRENCIES.VND;
            return ` Outflow: ${meta.prefix || ''}${val.toLocaleString()} ${meta.suffix || meta.symbol}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          color: '#9496a1', 
          font: { family: 'Plus Jakarta Sans', size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 16
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { 
          color: '#9496a1', 
          font: { family: 'Plus Jakarta Sans', size: 10 },
          callback: (value: any) => {
            const meta = CURRENCIES[currency] || CURRENCIES.VND;
            return `${meta.prefix || ''}${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`;
          }
        }
      }
    }
  };

  // Doughnut Chart Data for Categories
  const categoryChartData = useMemo(() => {
    const rawData = [
      categorySummary.Eating,
      categorySummary.Transport,
      categorySummary['Study/Equipment'],
      categorySummary.Entertainment,
      categorySummary.Others
    ];

    const meta = CURRENCIES[currency] || CURRENCIES.VND;
    const displayData = rawData.map(v => +(v / meta.rate).toFixed(2));

    return {
      labels: ['Eating & Food', 'Transport & Travel', 'Study & Equipment', 'Entertainment', 'Others'],
      datasets: [
        {
          data: displayData,
          backgroundColor: [
            CATEGORY_COLORS.Eating.hex,
            CATEGORY_COLORS.Transport.hex,
            CATEGORY_COLORS['Study/Equipment'].hex,
            CATEGORY_COLORS.Entertainment.hex,
            CATEGORY_COLORS.Others.hex
          ],
          borderColor: '#0b0c10',
          borderWidth: 2,
        }
      ]
    };
  }, [categorySummary, currency]);

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c0d12',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            const meta = CURRENCIES[currency] || CURRENCIES.VND;
            return ` ${context.label}: ${meta.prefix || ''}${val.toLocaleString()} ${meta.suffix || meta.symbol}`;
          }
        }
      }
    },
    cutout: '72%'
  };

  return (
    <div id="expense-ledger" className="kuldeep-card p-6 md:p-8 mb-12 space-y-8 font-sans animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-zinc-300" />
            <span>Cash Flow & Financial Ledger</span>
          </h2>
          <p className="text-xs text-[#9496a1] mt-1">
            Track outflow velocity, monitor burn rate, and observe category allocations over time
          </p>
        </div>

        {/* Currency Switcher & Month Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 glass-pill-true p-1.5 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Multi-Currency Dropdown */}
          <div className="flex items-center gap-1.5 glass-card-true px-3 py-1 rounded-full text-xs">
            <DollarSign className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-xs text-[#9496a1]">Currency:</span>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {Object.entries(CURRENCIES).map(([code, meta]) => (
                <option key={code} value={code} className="bg-[#12141a] text-white text-xs">
                  {meta.symbol} {code}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Mode */}
          <div className="flex items-center gap-1 glass-card-true p-0.5 rounded-full text-xs">
            <button
              onClick={() => setFilterMode('monthly')}
              className={`px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
                filterMode === 'monthly' ? 'bg-white text-black font-semibold shadow-sm' : 'text-[#9496a1] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-medium transition-all rounded-full cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-black font-semibold shadow-sm' : 'text-[#9496a1] hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Month Picker */}
          {filterMode === 'monthly' && (
            <div className="flex items-center gap-1.5 glass-card-true px-2.5 py-1 rounded-full text-xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-300" />
              <input
                type="month"
                value={filterMonthYear}
                onChange={(e) => setFilterMonthYear(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Outflow */}
        <div className="glass-card-true p-5 rounded-2xl space-y-1.5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9496a1] font-medium">Total Outflow</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-white">
            {formatMoney(totalBurnVnd)}
          </div>
          <div className="text-[11px] text-[#9496a1]">
            {filteredExpenses.length} transactions logged
          </div>
        </div>

        {/* Daily Burn Rate */}
        <div className="glass-card-true p-5 rounded-2xl space-y-1.5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9496a1] font-medium">Daily Burn Rate</span>
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-white">
            {formatMoney(totalBurnVnd / (timelineData.labels.length || 1))}
          </div>
          <div className="text-[11px] text-[#9496a1]">
            Across {timelineData.labels.length} tracked days
          </div>
        </div>

        {/* Highest Single Expense */}
        <div className="glass-card-true p-5 rounded-2xl space-y-1.5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9496a1] font-medium">Largest Expense</span>
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tabular-nums text-white truncate">
            {highestTransaction ? formatMoney(Math.abs(highestTransaction.amount)) : '—'}
          </div>
          <div className="text-[11px] text-[#9496a1] truncate">
            {highestTransaction?.note || highestTransaction?.category || 'No data recorded'}
          </div>
        </div>

        {/* Top Category */}
        <div className="glass-card-true p-5 rounded-2xl space-y-1.5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9496a1] font-medium">Top Category</span>
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white truncate">
            {topCategoryInfo.category}
          </div>
          <div className="text-[11px] text-[#9496a1]">
            {topCategoryInfo.percentage}% of total budget ({formatMoney(topCategoryInfo.amount)})
          </div>
        </div>

      </div>

      {/* Hero Big Timeline Chart Section */}
      <div className="glass-card-true p-6 md:p-8 rounded-2xl space-y-4 border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-300" />
              <span>Cash Flow & Outflow Timeline Progress</span>
            </h3>
            <p className="text-xs text-[#9496a1] mt-0.5">
              Daily burn velocity progression over the {filterMode === 'monthly' ? `month (${filterMonthYear})` : 'recorded period'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#9496a1]">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span>Daily Outflow ({currency})</span>
          </div>
        </div>

        {/* Big Chart Container (Height: 300px) */}
        <div className="h-72 md:h-80 w-full relative pt-2">
          {timelineData.labels.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#9496a1]">
              No transactions logged for this timeframe.
            </div>
          ) : (
            <Bar data={timelineChartData} options={timelineChartOptions} />
          )}
        </div>
      </div>

      {/* Split Section: Form Logger & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (5 cols): Add Expense Form */}
        <div className="lg:col-span-5 glass-card-true p-6 space-y-4 rounded-2xl border border-white/[0.08]">
          <div className="border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-300" />
              <span>Log New Transaction</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="text-[#9496a1] text-xs font-medium">Amount ({currency}):</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={currency === 'VND' ? '250000' : '50.00'}
                  className="w-full glass-input-true py-2.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 font-semibold rounded-xl focus:outline-none"
                  required
                />
                <span className="text-xs text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2 font-bold">
                  {CURRENCIES[currency]?.symbol || '$'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[#9496a1] text-xs font-medium">Category:</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value as ExpenseCategory)}
                className="w-full glass-input-true p-2.5 text-xs text-white font-medium cursor-pointer rounded-xl bg-[#0e1015] focus:outline-none"
              >
                <option value="Eating" className="bg-[#12141a] text-white">Eating & Food</option>
                <option value="Transport" className="bg-[#12141a] text-white">Transport & Fuel</option>
                <option value="Study/Equipment" className="bg-[#12141a] text-white">Study & Equipment</option>
                <option value="Entertainment" className="bg-[#12141a] text-white">Entertainment & Leisure</option>
                <option value="Others" className="bg-[#12141a] text-white">Others & Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[#9496a1] text-xs font-medium">Date:</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full glass-input-true p-2.5 text-xs text-white tabular-nums cursor-pointer font-medium rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#9496a1] text-xs font-medium">Description:</label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Domain renewal, Client dinner, Gym..."
                className="w-full glass-input-true p-2.5 text-xs text-white placeholder-zinc-500 rounded-xl focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 btn-primary-cyan text-xs font-semibold transition-all flex items-center justify-center gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </form>
        </div>

        {/* Right (7 cols): Category Allocation & Doughnut Chart */}
        <div className="lg:col-span-7 glass-card-true p-6 space-y-4 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
          <div className="border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-zinc-300" />
              <span>Category Allocation Breakdown</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center flex-1">
            {/* Doughnut Chart */}
            <div className="sm:col-span-5 h-44 relative flex items-center justify-center">
              <Doughnut data={categoryChartData} options={categoryChartOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#9496a1]">Total</span>
                <span className="text-xs tabular-nums font-bold text-white">
                  {formatMoney(totalBurnVnd)}
                </span>
              </div>
            </div>

            {/* Category Percentages List */}
            <div className="sm:col-span-7 space-y-2.5">
              {(['Eating', 'Transport', 'Study/Equipment', 'Entertainment', 'Others'] as ExpenseCategory[]).map(cat => {
                const amt = categorySummary[cat] || 0;
                const pct = totalBurnVnd > 0 ? Math.round((amt / totalBurnVnd) * 100) : 0;
                const colors = CATEGORY_COLORS[cat];

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.hex }} />
                        <span className="text-white font-medium">{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#9496a1] tabular-nums text-[11px]">{formatMoney(amt)}</span>
                        <span className="text-zinc-400 tabular-nums text-[10px] w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${pct}%`, backgroundColor: colors.hex }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Expense History Table */}
      <div className="glass-card-true p-6 space-y-4 rounded-2xl border border-white/[0.08]">
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-white">
              Transaction History ({filteredExpenses.length})
            </h3>
          </div>
          <span className="text-xs text-[#9496a1]">
            Showing records for {filterMode === 'monthly' ? filterMonthYear : 'All Time'}
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9496a1]">
            No expense transactions logged for this timeframe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#9496a1]">
                  <th className="py-2.5 px-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">Category</th>
                  <th className="py-2.5 px-3 font-medium">Description</th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                  <th className="py-2.5 px-3 font-medium text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                {filteredExpenses.map((item) => {
                  const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Others;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 px-3 tabular-nums text-zinc-400 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${colors.bg} ${colors.border} ${colors.text}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white truncate max-w-xs">
                        {item.note || '—'}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-bold text-rose-300 text-right whitespace-nowrap">
                        -{formatMoney(Math.abs(item.amount))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(item.id)}
                          className="text-[#9496a1] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          title="Delete transaction"
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
