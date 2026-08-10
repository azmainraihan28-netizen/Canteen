import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, AlertTriangle, ArrowRight, Download, Calendar, Trash2, AlertCircle, BarChart3, Eye, Database, ArrowUpRight, Sparkles, ChevronDown, RefreshCw,
} from 'lucide-react';
import { DailyEntry, Office, Ingredient, UserRole } from '../types';
import { CostSheetDetailsModal } from './CostSheetDetailsModal';

interface DashboardProps {
  title?: string;
  entries: DailyEntry[];
  offices: Office[];
  ingredients: Ingredient[];
  isDarkMode?: boolean;
  userRole: UserRole;
  onDeleteEntry: (id: string) => void;
  onViewMasterStock?: () => void;
  targetPerHead?: number;
}

// ── helpers ──────────────────────────────────────────────────────────────
const fmtBDT = (n: number, digits = 0) =>
  `৳${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const pctDelta = (curr: number, prev: number): number | null => {
  if (!isFinite(curr) || !isFinite(prev)) return null;
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
};

// A compact sparkline shown inside KPI cards
const Sparkline: React.FC<{
  data: number[];
  color: string;
  id: string;
}> = ({ data, color, id }) => {
  const series = data.length > 0 ? data.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }, { i: 1, v: 0 }];
  return (
    <div className="h-10 w-full -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#spark-${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// KPI card — Linear/Vercel-inspired: big number, sparkline, delta chip
const KpiCard: React.FC<{
  label: string;
  value: string;
  spark: number[];
  color: string;
  id: string;
  delta?: number | null;
  deltaGood?: 'up' | 'down';
  meta?: React.ReactNode;
  emphasis?: boolean;
  danger?: boolean;
}> = ({ label, value, spark, color, id, delta, deltaGood = 'up', meta, emphasis, danger }) => {
  const showDelta = typeof delta === 'number' && isFinite(delta);
  const isPositiveDir = showDelta && delta! > 0;
  const isGood = showDelta && ((deltaGood === 'up' && isPositiveDir) || (deltaGood === 'down' && !isPositiveDir));

  return (
    <div className={`panel relative overflow-hidden p-5 group transition-transform hover:-translate-y-0.5 ${danger ? 'ring-1 ring-rose-500/30' : ''}`}>
      {/* top gradient hairline */}
      <span
        className="absolute inset-x-0 top-0 h-[2px] opacity-90"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      {/* corner glow */}
      <span
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: color }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {showDelta && (
          <span
            className={`chip !py-[3px] !text-[10px] ${
              isGood
                ? '!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/20'
                : '!bg-rose-500/10 !text-rose-700 dark:!text-rose-300 !border-rose-500/20'
            }`}
          >
            {isPositiveDir ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span className="num">{Math.abs(delta!).toFixed(1)}%</span>
          </span>
        )}
      </div>

      <h3 className={`font-display num tracking-tight leading-none ${emphasis ? 'text-4xl md:text-5xl' : 'text-3xl md:text-[34px]'} ${danger ? 'text-rose-600 dark:text-rose-400' : 'text-gradient-mesh'}`}>
        {value}
      </h3>

      {meta && <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{meta}</div>}

      <div className="mt-3">
        <Sparkline data={spark} color={color} id={id} />
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  title = 'Executive Dashboard',
  entries,
  offices,
  ingredients,
  isDarkMode,
  userRole,
  onDeleteEntry,
  onViewMasterStock,
  targetPerHead = 72.72,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('last30');

  const availableFinancialYears = useMemo(() => {
    const finYears = new Set<number>();
    entries.forEach((e) => {
      const date = new Date(e.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      if (month < 6) finYears.add(year - 1);
      else finYears.add(year);
    });
    return Array.from(finYears).sort((a, b) => b - a);
  }, [entries]);

  const [selectedFinYear, setSelectedFinYear] = useState<number>(() => {
    const now = new Date();
    return now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
  });

  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  const availableMonths = useMemo(() => {
    const months = new Set(entries.map((e) => e.date.substring(0, 7)));
    return Array.from(months).sort().reverse();
  }, [entries]);

  // Chronological within selected period
  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (selectedMonth === 'last30') return sorted.slice(-30);
    return sorted.filter((e) => e.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  // Previous-period window for delta comparisons
  const previousEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (selectedMonth === 'last30') return sorted.slice(-60, -30);
    // previous month of the same year
    const [yStr, mStr] = selectedMonth.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    const prev = new Date(y, m - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    return sorted.filter((e) => e.date.startsWith(prevKey));
  }, [entries, selectedMonth]);

  const stats = useMemo(() => {
    const sum = (arr: DailyEntry[]) => arr.reduce((s, e) => s + e.totalCost, 0);
    const sumParts = (arr: DailyEntry[]) => arr.reduce((s, e) => s + e.participantCount, 0);

    const total = sum(filteredEntries);
    const totalParts = sumParts(filteredEntries);
    const n = filteredEntries.length || 1;

    const prevTotal = sum(previousEntries);
    const prevParts = sumParts(previousEntries);
    const prevN = previousEntries.length || 1;

    return {
      totalCost: total,
      avgDailyCost: total / n,
      avgPerHead: totalParts > 0 ? total / totalParts : 0,
      avgParticipants: Math.round(totalParts / n),
      totalParticipants: totalParts,
      // Deltas
      deltaTotalCost: pctDelta(total, prevTotal),
      deltaPerHead: pctDelta(totalParts > 0 ? total / totalParts : 0, prevParts > 0 ? prevTotal / prevParts : 0),
      deltaAvgDaily: pctDelta(total / n, prevTotal / prevN),
      deltaParticipants: pctDelta(totalParts / n, prevParts / prevN),
    };
  }, [filteredEntries, previousEntries]);

  const isAvgPerHeadHigh = stats.avgPerHead > targetPerHead;

  // Sparkline series (Per Head)
  const perHeadSeries = useMemo(
    () => filteredEntries.map((e) => (e.participantCount > 0 ? e.totalCost / e.participantCount : 0)),
    [filteredEntries]
  );
  const totalCostSeries = useMemo(() => filteredEntries.map((e) => e.totalCost), [filteredEntries]);
  const participantsSeries = useMemo(() => filteredEntries.map((e) => e.participantCount), [filteredEntries]);

  const trendData = useMemo(
    () =>
      filteredEntries.map((e) => ({
        date: e.date.substring(5),
        CostPerHead: Number((e.participantCount > 0 ? e.totalCost / e.participantCount : 0).toFixed(2)),
        TotalCost: e.totalCost,
      })),
    [filteredEntries]
  );

  const monthlyCostData = useMemo(() => {
    const monthlyTotals: Record<number, number> = {};
    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const belongsToFinYear = (month >= 6 && year === selectedFinYear) || (month < 6 && year === selectedFinYear + 1);
      if (belongsToFinYear) monthlyTotals[month] = (monthlyTotals[month] || 0) + entry.totalCost;
    });
    const monthNames = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthIndices = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
    return monthNames.map((name, i) => ({ name, total: monthlyTotals[monthIndices[i]] || 0 }));
  }, [entries, selectedFinYear]);

  const lowStockItems = ingredients.filter((i) => i.currentStock <= i.minStockThreshold);
  const stockHealth = useMemo(() => {
    const total = ingredients.length || 1;
    const healthy = total - lowStockItems.length;
    return Math.round((healthy / total) * 100);
  }, [ingredients, lowStockItems]);

  const displayedEntries = useMemo(
    () => [...filteredEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredEntries]
  );

  const handleExportCSV = () => {
    if (displayedEntries.length === 0) {
      alert('No data available to export.');
      return;
    }
    const headers = ['Date', 'Participants', 'Total Cost', 'Per Head Cost', 'Menu Description'];
    const rows = displayedEntries.map((entry) => {
      const perHead = entry.participantCount > 0 ? (entry.totalCost / entry.participantCount).toFixed(2) : '0.00';
      const menu = entry.menuDescription ? `"${entry.menuDescription.replace(/"/g, '""')}"` : '""';
      return [entry.date, entry.participantCount, entry.totalCost.toFixed(2), perHead, menu].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${selectedMonth === 'last30' ? 'last30days' : selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDeleteClick = (id: string, date: string) => {
    if (window.confirm(`Are you sure you want to delete the entry for ${date}? This action cannot be undone.`)) {
      onDeleteEntry(id);
    }
  };

  const periodLabel = selectedMonth === 'last30' ? 'Last 30 days' : formatMonth(selectedMonth);
  const isEventReport = title === 'Events Cost Report';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  // Chart tooltip style
  const tooltipStyle = {
    backgroundColor: isDarkMode ? 'rgba(10,15,32,0.95)' : 'rgba(255,255,255,0.98)',
    borderRadius: '12px',
    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)'}`,
    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)',
    padding: '10px 12px',
    fontSize: '12px',
  } as const;

  return (
    <div className="space-y-6 md:space-y-7 animate-fade-in pb-10">
      {selectedEntry && (
        <CostSheetDetailsModal
          entry={selectedEntry}
          ingredients={ingredients}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* ── TOP TOOLBAR ───────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="chip">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-blink" />
              Live · Supabase
            </span>
            <span className="chip">
              <Calendar size={11} />
              {today}
            </span>
            {isEventReport && (
              <span className="chip !bg-fuchsia-500/10 !text-fuchsia-700 dark:!text-fuchsia-300 !border-fuchsia-500/20">
                <Sparkles size={11} /> Events
              </span>
            )}
          </div>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Cost, consumption, and stock at a glance ·{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{periodLabel}</span>
          </p>
        </div>

        {/* Period switcher */}
        <div className="flex items-center gap-2">
          <div className="panel !rounded-xl !p-1 flex items-center gap-0.5">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-transparent text-[13px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="last30">Last 30 days</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="panel !rounded-xl px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition flex items-center gap-2"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── KPI ROW ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          id="cost"
          label={isEventReport ? 'Total spend' : 'Avg daily cost'}
          value={fmtBDT(isEventReport ? stats.totalCost : stats.avgDailyCost)}
          spark={totalCostSeries}
          color="#10b981"
          delta={isEventReport ? stats.deltaTotalCost : stats.deltaAvgDaily}
          deltaGood="down"
          meta={<span>vs previous period</span>}
        />
        <KpiCard
          id="perhead"
          label="Avg per head"
          value={fmtBDT(stats.avgPerHead, 2)}
          spark={perHeadSeries}
          color={isAvgPerHeadHigh ? '#f43f5e' : '#6366f1'}
          delta={stats.deltaPerHead}
          deltaGood="down"
          danger={isAvgPerHeadHigh}
          emphasis
          meta={
            <div className="flex items-center gap-2">
              <span className="chip !py-[2px] !text-[10px]">
                Target <span className="num ml-1">{fmtBDT(targetPerHead, 0)}</span>
              </span>
              {isAvgPerHeadHigh && (
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle size={11} /> +{fmtBDT(stats.avgPerHead - targetPerHead, 2)}
                </span>
              )}
            </div>
          }
        />
        <KpiCard
          id="parts"
          label={isEventReport ? 'Total participants' : 'Avg participants'}
          value={(isEventReport ? stats.totalParticipants : stats.avgParticipants).toLocaleString()}
          spark={participantsSeries}
          color="#a855f7"
          delta={stats.deltaParticipants}
          deltaGood="up"
          meta={<span>across {filteredEntries.length} entries</span>}
        />
        <KpiCard
          id="stock"
          label="Stock health"
          value={`${stockHealth}%`}
          spark={[stockHealth * 0.8, stockHealth * 0.9, stockHealth, stockHealth * 0.95, stockHealth]}
          color={lowStockItems.length > 0 ? '#f43f5e' : '#22c55e'}
          danger={lowStockItems.length > 3}
          meta={
            <span className={`font-semibold ${lowStockItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {lowStockItems.length > 0 ? `${lowStockItems.length} items below threshold` : 'All items healthy'}
            </span>
          }
        />
      </div>

      {/* ── BENTO CHARTS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-4">
        {/* Cost per head — big */}
        <div className="panel xl:col-span-4 p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Cost per head
                <span className="chip !py-[2px] !text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Daily
                </span>
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                {selectedMonth === 'last30' ? '30-day performance trend' : `Analysis for ${formatMonth(selectedMonth)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Period avg</p>
              <p className="font-display num text-2xl font-extrabold text-slate-900 dark:text-white">
                {fmtBDT(stats.avgPerHead, 2)}
              </p>
            </div>
          </div>

          <div className="h-[260px] md:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="bar-perhead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `৳${val}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)' }}
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}
                />
                <Bar dataKey="CostPerHead" fill="url(#bar-perhead)" radius={[6, 6, 0, 0]} name="Per head" maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low stock — tall */}
        <div className="panel xl:col-span-2 p-5 md:p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Stock alerts</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                Items at or below minimum threshold
              </p>
            </div>
            <span className={`chip ${lowStockItems.length > 0 ? '!bg-rose-500/10 !text-rose-700 dark:!text-rose-300 !border-rose-500/20' : '!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/20'}`}>
              <span className="num">{lowStockItems.length}</span>
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center mb-3">
                  <Sparkles size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All good</p>
                <p className="text-xs text-slate-500 mt-1">Every ingredient is above its threshold.</p>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((item) => {
                const pct = Math.min((item.currentStock / (item.minStockThreshold || 1)) * 100, 100);
                return (
                  <div key={item.id} className="group rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] hover:bg-rose-500/[0.04] dark:hover:bg-rose-500/[0.06] p-3 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                        <p className="text-[10.5px] text-slate-500 num mt-0.5">
                          Min <span className="font-semibold">{item.minStockThreshold} {item.unit}</span>
                        </p>
                      </div>
                      <span className="chip !bg-rose-500/10 !text-rose-700 dark:!text-rose-300 !border-rose-500/20 !text-[10.5px] num shrink-0">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-500 to-orange-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {lowStockItems.length > 0 && (
            <button
              onClick={onViewMasterStock}
              className="mt-3 w-full py-2 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-white/[0.08] rounded-xl hover:bg-white/70 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-1.5"
            >
              Manage inventory <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Monthly expenditure — full width */}
        <div className="panel xl:col-span-6 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-300">
                <BarChart3 size={17} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Monthly expenditure</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Aggregated operational cost by month</p>
              </div>
            </div>
            <div className="panel !rounded-xl !p-1">
              <div className="relative">
                <select
                  value={selectedFinYear}
                  onChange={(e) => setSelectedFinYear(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {availableFinancialYears.map((year) => (
                    <option key={year} value={year}>
                      FY {year}–{year + 1}
                    </option>
                  ))}
                  {availableFinancialYears.length === 0 && (
                    <option value={new Date().getFullYear()}>
                      FY {new Date().getFullYear()}–{new Date().getFullYear() + 1}
                    </option>
                  )}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="h-[240px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCostData} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="bar-monthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} dy={8} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.06)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Total']}
                  itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}
                />
                <Bar dataKey="total" fill="url(#bar-monthly)" radius={[6, 6, 0, 0]} name="Total" maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── DAILY COST TABLE ─────────────────────────────────────────── */}
      <div className="panel overflow-hidden">
        <div className="p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 dark:border-white/[0.06]">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Daily cost sheets</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedMonth === 'last30' ? 'Most recent 30 days' : `Entries for ${formatMonth(selectedMonth)}`} · {displayedEntries.length} records
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 bg-white/60 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download size={13} /> CSV
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[860px]">
            <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
              <tr>
                <th className="px-6 py-3 font-bold">Date</th>
                <th className="px-6 py-3 font-bold text-center">Participants</th>
                <th className="px-6 py-3 font-bold text-right">Total</th>
                <th className="px-6 py-3 font-bold text-right">Per head</th>
                <th className="px-6 py-3 font-bold">Menu</th>
                <th className="px-6 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    No data available for this period.
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const perHead = entry.participantCount > 0 ? entry.totalCost / entry.participantCount : 0;
                  const isHighCost = perHead > targetPerHead;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-3.5 num text-slate-700 dark:text-slate-200 whitespace-nowrap font-medium">
                        {entry.date}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="chip !text-[11px] num">{entry.participantCount}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right num text-slate-700 dark:text-slate-200">
                        {fmtBDT(entry.totalCost, 2)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div
                          className={`inline-flex items-center justify-end gap-1.5 num font-semibold ${
                            isHighCost
                              ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md'
                              : 'text-slate-900 dark:text-white'
                          }`}
                          title={isHighCost ? `Exceeds ৳${targetPerHead} target` : ''}
                        >
                          {isHighCost && <AlertCircle size={12} className="shrink-0" />}
                          {fmtBDT(perHead, 2)}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className="text-slate-600 dark:text-slate-300 text-[12px] font-medium bg-slate-100/70 dark:bg-white/[0.04] px-2.5 py-1 rounded-md inline-block max-w-xs truncate"
                          title={entry.menuDescription}
                        >
                          {entry.menuDescription || 'Standard menu'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedEntry(entry)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 transition"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          {userRole === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteClick(entry.id, entry.date)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3 p-4">
          {displayedEntries.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No data available for this period.</div>
          ) : (
            displayedEntries.map((entry, idx) => {
              const perHead = entry.participantCount > 0 ? entry.totalCost / entry.participantCount : 0;
              const isHighCost = perHead > targetPerHead;
              return (
                <div key={idx} className="rounded-xl p-4 border border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.02]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-display text-lg font-extrabold text-slate-900 dark:text-white num">{entry.date}</p>
                      <span className="chip !text-[10px] mt-1 num">{entry.participantCount} participants</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-lg"
                      >
                        <Eye size={16} />
                      </button>
                      {userRole === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteClick(entry.id, entry.date)}
                          className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-300 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-lg bg-slate-100/70 dark:bg-white/[0.04] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                      <p className="font-display num text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">
                        {fmtBDT(entry.totalCost)}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 ${isHighCost ? 'bg-rose-500/10' : 'bg-slate-100/70 dark:bg-white/[0.04]'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isHighCost ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                        Per head {isHighCost && <AlertCircle size={10} />}
                      </p>
                      <p className={`font-display num text-lg font-extrabold mt-0.5 ${isHighCost ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white'}`}>
                        {fmtBDT(perHead, 2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Menu</p>
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-2">
                    {entry.menuDescription || 'Standard menu'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
