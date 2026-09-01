import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import {
  Calendar, Download, DollarSign, Users, TrendingUp, ShoppingBag, PieChart as PieIcon, ArrowLeft, ChevronRight, FileText, ChevronDown, Sparkles, TrendingDown, LineChart as LineChartIcon, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { DailyEntry, Ingredient, ActivityLog } from '../types';

interface ReportingProps {
  entries: DailyEntry[];
  logs: ActivityLog[];
  ingredients: Ingredient[];
}

type TimeFrame = 'week' | 'month' | 'quarter' | 'last_quarter' | 'fin_year' | 'last_fin_year' | 'calendar_year' | 'custom';

const TIMEFRAMES: { key: TimeFrame; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'last_quarter', label: 'Last Q' },
  { key: 'fin_year', label: 'FY' },
  { key: 'last_fin_year', label: 'Last FY' },
  { key: 'calendar_year', label: 'Cal Year' },
  { key: 'custom', label: 'Custom' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#ec4899', '#06b6d4', '#eab308'];

const fmtBDT = (n: number, digits = 0) =>
  `৳${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const Reporting: React.FC<ReportingProps> = ({ entries, logs, ingredients }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [priceItemSort, setPriceItemSort] = useState<'inflation' | 'name' | 'latest'>('inflation');
  const [priceItemQuery, setPriceItemQuery] = useState('');

  const { startDate, endDate, label } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    let lbl = '';

    if (timeFrame === 'custom') {
      return {
        startDate: customStartDate ? new Date(customStartDate) : new Date(0),
        endDate: customEndDate ? new Date(customEndDate) : new Date(),
        label: `${customStartDate} → ${customEndDate}`,
      };
    }

    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    const curMonth = end.getMonth();

    switch (timeFrame) {
      case 'week':
        start.setDate(end.getDate() - 7);
        lbl = 'Last 7 days';
        break;
      case 'month':
        start.setDate(1);
        lbl = 'This month';
        break;
      case 'quarter':
        if (curMonth >= 6 && curMonth <= 8) { start.setMonth(6, 1); lbl = 'Financial Q1 (Jul–Sep)'; }
        else if (curMonth >= 9 && curMonth <= 11) { start.setMonth(9, 1); lbl = 'Financial Q2 (Oct–Dec)'; }
        else if (curMonth >= 0 && curMonth <= 2) { start.setMonth(0, 1); lbl = 'Financial Q3 (Jan–Mar)'; }
        else { start.setMonth(3, 1); lbl = 'Financial Q4 (Apr–Jun)'; }
        break;
      case 'last_quarter': {
        let lqStartMonth: number, lqStartYear = end.getFullYear();
        if (curMonth >= 6 && curMonth <= 8) lqStartMonth = 3;
        else if (curMonth >= 9 && curMonth <= 11) lqStartMonth = 6;
        else if (curMonth >= 0 && curMonth <= 2) { lqStartMonth = 9; lqStartYear--; }
        else lqStartMonth = 0;
        start.setFullYear(lqStartYear, lqStartMonth, 1);
        const lqEnd = new Date(start); lqEnd.setMonth(start.getMonth() + 3); lqEnd.setDate(0); lqEnd.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: lqEnd, label: 'Last financial quarter' };
      }
      case 'fin_year':
        if (end.getMonth() >= 6) start.setFullYear(end.getFullYear(), 6, 1);
        else start.setFullYear(end.getFullYear() - 1, 6, 1);
        lbl = `FY ${start.getFullYear()}–${start.getFullYear() + 1}`;
        break;
      case 'last_fin_year': {
        if (end.getMonth() >= 6) start.setFullYear(end.getFullYear() - 1, 6, 1);
        else start.setFullYear(end.getFullYear() - 2, 6, 1);
        const lfyEnd = new Date(start); lfyEnd.setFullYear(start.getFullYear() + 1, 5, 30); lfyEnd.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: lfyEnd, label: `Last FY ${start.getFullYear()}–${start.getFullYear() + 1}` };
      }
      case 'calendar_year':
        start.setMonth(0, 1);
        lbl = `Calendar ${end.getFullYear()}`;
        break;
    }

    return { startDate: start, endDate: end, label: lbl };
  }, [timeFrame, customStartDate, customEndDate]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, startDate, endDate]);

  const filteredPurchases = useMemo(() => {
    return logs.filter((l) => {
      const d = new Date(l.timestamp);
      return l.action === 'UPDATE_STOCK' && l.metadata?.type === 'add' && l.metadata?.quantity > 0 && d >= startDate && d <= endDate;
    });
  }, [logs, startDate, endDate]);

  const consumptionStats = useMemo(() => {
    const totalCost = filteredEntries.reduce((s, e) => s + e.totalCost, 0);
    const totalParticipants = filteredEntries.reduce((s, e) => s + e.participantCount, 0);
    const daysCount = filteredEntries.length || 1;
    return {
      totalCost,
      totalParticipants,
      avgCostPerHead: totalParticipants > 0 ? totalCost / totalParticipants : 0,
      avgDailyCost: totalCost / daysCount,
      avgDailyParticipants: Math.round(totalParticipants / daysCount),
    };
  }, [filteredEntries]);

  const purchaseStats = useMemo(() => {
    let totalPurchaseEst = 0;
    const vendorMap: Record<string, number> = {};
    const vendorTxs: Record<string, any[]> = {};

    const stockLogs = [...filteredPurchases].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    stockLogs.forEach((log) => {
      const ing = ingredients.find((i) => i.id === log.metadata.ingredientId);
      if (!ing) return;
      const supplier = log.metadata.supplier || ing.supplierName || 'Unassigned';
      const qty = Number(log.metadata.quantity || 0);
      const unitPrice = log.metadata.unitPrice !== undefined ? Number(log.metadata.unitPrice) : (ing.unitPrice || 0);
      if (qty <= 0) return;
      const total = qty * unitPrice;
      totalPurchaseEst += total;
      vendorMap[supplier] = (vendorMap[supplier] || 0) + total;
      (vendorTxs[supplier] ||= []).push({ id: log.id, date: log.timestamp, itemName: ing.name, unit: ing.unit || 'units', quantity: qty, unitPrice, total });
    });

    const vendorData = Object.entries(vendorMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    Object.keys(vendorTxs).forEach((k) => vendorTxs[k].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    return {
      totalPurchaseEst,
      vendorData,
      topSuppliers: vendorData.slice(0, 5).map((v) => {
        const master = ingredients.find((i) => i.supplierName === v.name);
        return { ...v, contact: master?.supplierContact || 'N/A' };
      }),
      vendorTxs,
    };
  }, [filteredPurchases, ingredients]);

  // Year-over-Year Price Trends — uses ALL purchase logs (not filtered by timeframe)
  const priceTrends = useMemo(() => {
    // Collect all stock-add logs with a valid unit price
    const buckets: Record<string, Record<number, { totalQty: number; totalValue: number; count: number }>> = {};
    const yearSet = new Set<number>();

    logs.forEach((log) => {
      if (log.action !== 'UPDATE_STOCK') return;
      if (log.metadata?.type !== 'add') return;
      const qty = Number(log.metadata?.quantity || 0);
      const unitPrice = log.metadata?.unitPrice !== undefined ? Number(log.metadata.unitPrice) : NaN;
      if (!(qty > 0) || !isFinite(unitPrice) || unitPrice <= 0) return;
      const ing = ingredients.find((i) => i.id === log.metadata.ingredientId);
      if (!ing) return;
      const y = new Date(log.timestamp).getFullYear();
      if (!isFinite(y)) return;
      yearSet.add(y);
      (buckets[ing.id] ||= {});
      (buckets[ing.id][y] ||= { totalQty: 0, totalValue: 0, count: 0 });
      buckets[ing.id][y].totalQty += qty;
      buckets[ing.id][y].totalValue += qty * unitPrice;
      buckets[ing.id][y].count += 1;
    });

    const years = Array.from(yearSet).sort((a, b) => a - b);

    // Per-item year-over-year rows
    type ItemRow = {
      id: string;
      name: string;
      unit: string;
      pricesByYear: Record<number, number | null>;
      firstYear: number | null;
      latestYear: number | null;
      firstPrice: number | null;
      latestPrice: number | null;
      totalInflationPct: number | null; // latest vs first
      latestYoYPct: number | null;      // latest vs previous year with data
      totalSpend: number;
    };

    const rows: ItemRow[] = Object.entries(buckets).map(([id, byYear]) => {
      const ing = ingredients.find((i) => i.id === id);
      const pricesByYear: Record<number, number | null> = {};
      let totalSpend = 0;
      const availableYears: number[] = [];
      years.forEach((y) => {
        const b = byYear[y];
        if (b && b.totalQty > 0) {
          pricesByYear[y] = b.totalValue / b.totalQty;
          totalSpend += b.totalValue;
          availableYears.push(y);
        } else {
          pricesByYear[y] = null;
        }
      });

      const firstYear = availableYears[0] ?? null;
      const latestYear = availableYears[availableYears.length - 1] ?? null;
      const prevYear = availableYears.length >= 2 ? availableYears[availableYears.length - 2] : null;
      const firstPrice = firstYear !== null ? pricesByYear[firstYear]! : null;
      const latestPrice = latestYear !== null ? pricesByYear[latestYear]! : null;
      const prevPrice = prevYear !== null ? pricesByYear[prevYear]! : null;

      const totalInflationPct = firstPrice && latestPrice && firstYear !== latestYear
        ? ((latestPrice - firstPrice) / firstPrice) * 100
        : null;
      const latestYoYPct = prevPrice && latestPrice
        ? ((latestPrice - prevPrice) / prevPrice) * 100
        : null;

      return {
        id,
        name: ing?.name || 'Unknown item',
        unit: ing?.unit || 'unit',
        pricesByYear,
        firstYear,
        latestYear,
        firstPrice,
        latestPrice,
        totalInflationPct,
        latestYoYPct,
        totalSpend,
      };
    });

    // Overall weighted grocery-price index (weight = total spend across all years for that item)
    const indexPoints = years.map((y) => {
      let weightedRatioSum = 0;
      let weightSum = 0;
      rows.forEach((r) => {
        const price = r.pricesByYear[y];
        if (price === null || price === undefined || !r.firstPrice) return;
        const ratio = price / r.firstPrice;
        const weight = r.totalSpend;
        weightedRatioSum += ratio * weight;
        weightSum += weight;
      });
      const indexValue = weightSum > 0 ? (weightedRatioSum / weightSum) * 100 : null;
      return { year: String(y), Index: indexValue !== null ? Number(indexValue.toFixed(2)) : null };
    });

    // Overall YoY inflation between last two years with data
    const yearsWithSpend = years.filter((y) => rows.some((r) => r.pricesByYear[y] !== null));
    const latestY = yearsWithSpend[yearsWithSpend.length - 1];
    const prevY = yearsWithSpend[yearsWithSpend.length - 2];
    let overallYoYPct: number | null = null;
    let overallSinceStartPct: number | null = null;
    if (latestY && prevY) {
      const latestIdx = indexPoints.find((p) => p.year === String(latestY))?.Index;
      const prevIdx = indexPoints.find((p) => p.year === String(prevY))?.Index;
      if (latestIdx && prevIdx) overallYoYPct = ((latestIdx - prevIdx) / prevIdx) * 100;
    }
    if (indexPoints.length >= 2) {
      const first = indexPoints[0].Index;
      const last = indexPoints[indexPoints.length - 1].Index;
      if (first && last) overallSinceStartPct = ((last - first) / first) * 100;
    }

    const topInflators = [...rows]
      .filter((r) => r.totalInflationPct !== null && r.totalSpend > 0)
      .sort((a, b) => (b.totalInflationPct! - a.totalInflationPct!))
      .slice(0, 5);

    const topDeflators = [...rows]
      .filter((r) => r.totalInflationPct !== null && r.totalSpend > 0)
      .sort((a, b) => (a.totalInflationPct! - b.totalInflationPct!))
      .slice(0, 5);

    return {
      years,
      rows,
      indexPoints,
      overallYoYPct,
      overallSinceStartPct,
      topInflators,
      topDeflators,
      latestYear: latestY ?? null,
      prevYear: prevY ?? null,
    };
  }, [logs, ingredients]);

  const priceItemRows = useMemo(() => {
    const q = priceItemQuery.trim().toLowerCase();
    let list = priceTrends.rows.filter((r) => r.totalSpend > 0);
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    if (priceItemSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (priceItemSort === 'latest') list.sort((a, b) => (b.latestPrice || 0) - (a.latestPrice || 0));
    else list.sort((a, b) => (b.totalInflationPct ?? -Infinity) - (a.totalInflationPct ?? -Infinity));
    return list;
  }, [priceTrends.rows, priceItemQuery, priceItemSort]);

  const dailyTrendData = useMemo(() => {
    return filteredEntries.map((e) => ({
      date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Cost: e.totalCost,
      Participants: e.participantCount,
      PerHead: e.participantCount ? Number((e.totalCost / e.participantCount).toFixed(2)) : 0,
    }));
  }, [filteredEntries]);

  const handleExportReport = () => {
    const rows: any[][] = [];
    rows.push(['REPORT SUMMARY']);
    rows.push(['Report Type', 'Canteen Analytics (Events Excluded)']);
    rows.push(['Period', label]);
    rows.push(['Start Date', startDate.toLocaleDateString()]);
    rows.push(['End Date', endDate.toLocaleDateString()]);
    rows.push([]);
    rows.push(['KEY METRICS']);
    rows.push(['Total Consumption Cost', consumptionStats.totalCost.toFixed(2)]);
    rows.push(['Total Participants', consumptionStats.totalParticipants]);
    rows.push(['Avg Cost Per Head', consumptionStats.avgCostPerHead.toFixed(2)]);
    rows.push(['Avg Daily Cost', consumptionStats.avgDailyCost.toFixed(2)]);
    rows.push(['Total Purchase', purchaseStats.totalPurchaseEst.toFixed(2)]);
    rows.push([]);
    rows.push(['VENDOR / SUPPLIER ANALYSIS']);
    rows.push(['Supplier Name', 'Total Purchase Amount']);
    purchaseStats.vendorData.forEach((v) => rows.push([`"${v.name.replace(/"/g, '""')}"`, v.value.toFixed(2)]));
    rows.push([]);
    rows.push(['DAILY CONSUMPTION BREAKDOWN']);
    rows.push(['Date', 'Participants', 'Total Cost', 'Cost Per Head', 'Menu']);
    filteredEntries.forEach((e) => {
      const ph = e.participantCount ? (e.totalCost / e.participantCount).toFixed(2) : '0.00';
      rows.push([e.date, e.participantCount, e.totalCost.toFixed(2), ph, `"${(e.menuDescription || '').replace(/"/g, '""')}"`]);
    });
    if (priceTrends.years.length > 0) {
      rows.push([]);
      rows.push(['YEAR-OVER-YEAR PRICE TRENDS (ALL-TIME)']);
      if (priceTrends.overallYoYPct !== null) {
        rows.push(['Overall YoY inflation', `${priceTrends.overallYoYPct.toFixed(2)}%`, `${priceTrends.prevYear} → ${priceTrends.latestYear}`]);
      }
      if (priceTrends.overallSinceStartPct !== null) {
        rows.push(['Overall inflation since start', `${priceTrends.overallSinceStartPct.toFixed(2)}%`, `since ${priceTrends.years[0]}`]);
      }
      rows.push([]);
      const header = ['Item', 'Unit', ...priceTrends.years.map(String), 'Latest YoY %', `Total change since ${priceTrends.years[0]} %`];
      rows.push(header);
      priceItemRows.forEach((r) => {
        const yearCols = priceTrends.years.map((y) => {
          const p = r.pricesByYear[y];
          return p !== null && p !== undefined ? p.toFixed(2) : '';
        });
        rows.push([
          `"${r.name.replace(/"/g, '""')}"`,
          r.unit,
          ...yearCols,
          r.latestYoYPct !== null ? r.latestYoYPct.toFixed(2) : '',
          r.totalInflationPct !== null ? r.totalInflationPct.toFixed(2) : '',
        ]);
      });
    }
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ACI_Canteen_Report_${timeFrame}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tooltipStyle = {
    backgroundColor: 'rgba(10,15,32,0.95)',
    borderRadius: '12px',
    border: '1px solid rgba(148,163,184,0.15)',
    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#f8fafc',
  } as const;

  const kpiPanels = [
    { label: 'Total consumption', value: fmtBDT(consumptionStats.totalCost), sub: 'Operational expense', color: 'from-emerald-500 to-teal-500', icon: DollarSign },
    { label: 'Total participants', value: consumptionStats.totalParticipants.toLocaleString(), sub: `Avg ${consumptionStats.avgDailyParticipants}/day`, color: 'from-violet-500 to-purple-500', icon: Users },
    { label: 'Avg cost per head', value: fmtBDT(consumptionStats.avgCostPerHead, 2), sub: 'Global average', color: 'from-indigo-500 to-blue-500', icon: TrendingUp },
    { label: 'Purchases', value: fmtBDT(purchaseStats.totalPurchaseEst), sub: 'Vendor spend', color: 'from-amber-500 to-orange-500', icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header + controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="chip"><PieIcon size={11} /> Analytics</span>
            <span className="chip"><Calendar size={11} /> {label}</span>
          </div>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">Analytics & reporting</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Cost trends, participant volume, and vendor performance</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          {timeFrame === 'custom' && (
            <div className="panel !rounded-xl !p-1 flex items-center gap-1 num text-[12px]">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-transparent p-1.5 outline-none text-slate-700 dark:text-slate-200" />
              <span className="text-slate-400">→</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-transparent p-1.5 outline-none text-slate-700 dark:text-slate-200" />
            </div>
          )}
          <div className="panel !rounded-xl !p-1 flex items-center gap-0.5 overflow-x-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.key}
                onClick={() => { setTimeFrame(tf.key); setExpandedVendor(null); }}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                  timeFrame === tf.key ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button onClick={handleExportReport} className="relative px-4 py-2 rounded-xl font-semibold text-white text-[12.5px] overflow-hidden shadow-lg shadow-indigo-500/30 group">
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2"><Download size={14} /> Export</span>
          </button>
        </div>
      </div>

      {/* Date context strip */}
      <div className="panel px-4 py-2.5 flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-300">
        <Sparkles size={13} className="text-indigo-500" />
        Showing data from
        <span className="num font-semibold text-slate-900 dark:text-white">{startDate.toLocaleDateString()}</span>
        →
        <span className="num font-semibold text-slate-900 dark:text-white">{endDate.toLocaleDateString()}</span>
        <span className="rule flex-1 mx-2" />
        <span className="chip !py-[3px] !text-[10px]">
          <span className="num">{filteredEntries.length}</span> entries
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiPanels.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="panel relative overflow-hidden p-5">
              <span className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${k.color} opacity-90`} />
              <span className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${k.color}`} />
              <div className="relative flex items-start justify-between mb-3">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{k.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon size={15} />
                </div>
              </div>
              <h3 className="font-display num text-2xl md:text-[28px] font-extrabold text-gradient-mesh tracking-tight">{k.value}</h3>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts bento */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Per head trend — full width */}
        <div className="panel xl:col-span-2 p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Cost per head — trend</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Daily performance across the period</p>
            </div>
            <span className="chip !py-[3px] !text-[10px] num">avg {fmtBDT(consumptionStats.avgCostPerHead, 2)}</span>
          </div>
          <div className="h-[280px]">
            {dailyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ph-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `৳${v}`} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="PerHead" stroke="url(#ph-line)" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} name="Per head" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-[13px]">No data for selected period</div>
            )}
          </div>
        </div>

        {/* Daily cost bar */}
        <div className="panel p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Daily total cost</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Absolute daily spend</p>
            </div>
            <span className="chip !py-[3px] !text-[10px] num">total {fmtBDT(consumptionStats.totalCost)}</span>
          </div>
          <div className="h-[260px]">
            {dailyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rep-cost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Cost" fill="url(#rep-cost)" radius={[6, 6, 0, 0]} maxBarSize={36} name="Cost" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-[13px]">No data</div>
            )}
          </div>
        </div>

        {/* Vendor donut */}
        <div className="panel p-5 md:p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Spend by vendor</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Distribution across suppliers</p>
            </div>
          </div>
          {purchaseStats.vendorData.length > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row items-center gap-4 min-h-[260px]">
              <div className="w-full md:w-1/2 h-[220px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={purchaseStats.vendorData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={2} dataKey="value">
                      {purchaseStats.vendorData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `৳${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                  <p className="font-display num text-[15px] font-extrabold text-slate-900 dark:text-white">
                    {fmtBDT(purchaseStats.totalPurchaseEst)}
                  </p>
                </div>
              </div>
              <div className="w-full md:w-1/2 max-h-[220px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {purchaseStats.vendorData.map((v, i) => (
                  <button
                    key={v.name}
                    onClick={() => setExpandedVendor(v.name)}
                    className="w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] text-[12.5px] group transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{v.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white num shrink-0">{fmtBDT(v.value)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">No purchase data</div>
          )}
        </div>
      </div>

      {/* Year-over-Year Price Trends — uses full history, independent of timeframe */}
      <div className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-start gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 ring-1 ring-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
            <LineChartIcon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Year-over-year price trends
              <span className="chip !py-[2px] !text-[10px]">All-time</span>
            </h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
              How grocery &amp; bazar prices have changed each year — weighted by purchase spend
            </p>
          </div>
          {priceTrends.years.length >= 2 && (
            <div className="flex flex-wrap items-center gap-2">
              {priceTrends.overallYoYPct !== null && (
                <span className={`chip !py-[3px] !text-[10.5px] num ${priceTrends.overallYoYPct >= 0 ? '!text-rose-600 dark:!text-rose-300' : '!text-emerald-600 dark:!text-emerald-300'}`}>
                  {priceTrends.overallYoYPct >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {priceTrends.overallYoYPct >= 0 ? '+' : ''}{priceTrends.overallYoYPct.toFixed(1)}% YoY ({priceTrends.prevYear} → {priceTrends.latestYear})
                </span>
              )}
              {priceTrends.overallSinceStartPct !== null && priceTrends.years.length > 1 && (
                <span className={`chip !py-[3px] !text-[10.5px] num ${priceTrends.overallSinceStartPct >= 0 ? '!text-rose-600 dark:!text-rose-300' : '!text-emerald-600 dark:!text-emerald-300'}`}>
                  {priceTrends.overallSinceStartPct >= 0 ? '+' : ''}{priceTrends.overallSinceStartPct.toFixed(1)}% since {priceTrends.years[0]}
                </span>
              )}
            </div>
          )}
        </div>

        {priceTrends.years.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-[13px]">
            No purchase price history available yet. Add stock with unit prices to see year-over-year trends.
          </div>
        ) : priceTrends.years.length === 1 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-[13px]">
            Only <span className="num font-semibold">{priceTrends.years[0]}</span> data is available. Year-over-year comparison will appear once purchases span two or more years.
          </div>
        ) : (
          <>
            {/* Grocery price index chart */}
            <div className="p-5 md:p-6 border-b border-slate-200/60 dark:border-white/[0.06]">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Grocery price index</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Base {priceTrends.years[0]} = 100 · higher means costlier bazar overall
                  </p>
                </div>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceTrends.indexPoints} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="price-idx-line" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={6} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v?.toFixed?.(1) ?? v}`, 'Index']}
                    />
                    <Line
                      type="monotone"
                      dataKey="Index"
                      stroke="url(#price-idx-line)"
                      strokeWidth={2.5}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      name="Price index"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top inflators / deflators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-slate-200/60 dark:border-white/[0.06]">
              <div className="p-5 md:p-6 md:border-r border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                    <TrendingUp size={14} />
                  </span>
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Biggest price jumps</h4>
                </div>
                {priceTrends.topInflators.length > 0 ? (
                  <ul className="space-y-2">
                    {priceTrends.topInflators.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                          <p className="text-[10.5px] text-slate-500 num">
                            {fmtBDT(r.firstPrice || 0, 2)} → {fmtBDT(r.latestPrice || 0, 2)} / {r.unit}
                            <span className="text-slate-400"> · {r.firstYear} → {r.latestYear}</span>
                          </p>
                        </div>
                        <span className="chip !py-[3px] !text-[11px] num !text-rose-600 dark:!text-rose-300 shrink-0">
                          <ArrowUpRight size={11} />+{r.totalInflationPct!.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-slate-400">No items with a full-year price jump yet.</p>
                )}
              </div>
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                    <TrendingDown size={14} />
                  </span>
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Prices that dropped</h4>
                </div>
                {priceTrends.topDeflators.filter((r) => (r.totalInflationPct ?? 0) < 0).length > 0 ? (
                  <ul className="space-y-2">
                    {priceTrends.topDeflators.filter((r) => (r.totalInflationPct ?? 0) < 0).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                          <p className="text-[10.5px] text-slate-500 num">
                            {fmtBDT(r.firstPrice || 0, 2)} → {fmtBDT(r.latestPrice || 0, 2)} / {r.unit}
                            <span className="text-slate-400"> · {r.firstYear} → {r.latestYear}</span>
                          </p>
                        </div>
                        <span className="chip !py-[3px] !text-[11px] num !text-emerald-600 dark:!text-emerald-300 shrink-0">
                          <ArrowDownRight size={11} />{r.totalInflationPct!.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-slate-400">Every tracked item costs more today than when it was first bought.</p>
                )}
              </div>
            </div>

            {/* Detailed per-item table */}
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Per-item avg price by year</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Weighted average unit price · <span className="num">{priceItemRows.length}</span> items tracked
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search item…"
                    value={priceItemQuery}
                    onChange={(e) => setPriceItemQuery(e.target.value)}
                    className="panel !rounded-xl !p-2 text-[12px] bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 min-w-[140px]"
                  />
                  <div className="panel !rounded-xl !p-1 flex items-center gap-0.5">
                    {([
                      { k: 'inflation', label: 'Inflation' },
                      { k: 'latest', label: 'Latest ৳' },
                      { k: 'name', label: 'A–Z' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.k}
                        onClick={() => setPriceItemSort(opt.k)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                          priceItemSort === opt.k
                            ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto -mx-5 md:-mx-6 px-5 md:px-6">
                <table className="w-full text-[12.5px] text-left border-separate border-spacing-0">
                  <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em]">
                    <tr>
                      <th className="px-3 py-2 font-bold sticky left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur">Item</th>
                      {priceTrends.years.map((y) => (
                        <th key={y} className="px-3 py-2 font-bold text-right num">{y}</th>
                      ))}
                      <th className="px-3 py-2 font-bold text-right">YoY</th>
                      <th className="px-3 py-2 font-bold text-right">Since {priceTrends.years[0]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceItemRows.length > 0 ? (
                      priceItemRows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 py-2 sticky left-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">{r.name}</p>
                            <p className="text-[10px] text-slate-400">per {r.unit}</p>
                          </td>
                          {priceTrends.years.map((y) => {
                            const price = r.pricesByYear[y];
                            return (
                              <td key={y} className="px-3 py-2 text-right num">
                                {price !== null && price !== undefined ? (
                                  <span className="text-slate-700 dark:text-slate-200">{fmtBDT(price, 2)}</span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right num">
                            {r.latestYoYPct !== null ? (
                              <span className={`inline-flex items-center gap-0.5 font-semibold ${r.latestYoYPct >= 0 ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                                {r.latestYoYPct >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                {r.latestYoYPct >= 0 ? '+' : ''}{r.latestYoYPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right num">
                            {r.totalInflationPct !== null ? (
                              <span className={`inline-flex items-center gap-0.5 font-extrabold ${r.totalInflationPct >= 0 ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                                {r.totalInflationPct >= 0 ? '+' : ''}{r.totalInflationPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={priceTrends.years.length + 3} className="px-3 py-8 text-center text-slate-400 text-[12.5px]">
                          No items match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top suppliers */}
      <div className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 ring-1 ring-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-300">
            <ShoppingBag size={16} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Top 5 suppliers</h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Ranked by purchase amount</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3 font-bold w-16">Rank</th>
                <th className="px-5 py-3 font-bold">Supplier</th>
                <th className="px-5 py-3 font-bold">Contact</th>
                <th className="px-5 py-3 font-bold text-right">Purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {purchaseStats.topSuppliers.length > 0 ? (
                purchaseStats.topSuppliers.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold num ${
                        i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/30' :
                        i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white' :
                        i === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
                        'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">{v.name}</td>
                    <td className="px-5 py-3 text-slate-500 num">{v.contact}</td>
                    <td className="px-5 py-3 text-right font-display num font-extrabold text-slate-900 dark:text-white">{fmtBDT(v.value, 2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-[13px]">No supplier data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor drilldown */}
      <div className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
          {expandedVendor ? (
            <>
              <button onClick={() => setExpandedVendor(null)} className="chip !py-2 !px-2"><ArrowLeft size={13} /></button>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={15} className="text-indigo-500" /> {expandedVendor}
                </h3>
                <p className="text-[11.5px] text-slate-500 num">
                  Period spend: <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtBDT(purchaseStats.vendorData.find((v) => v.name === expandedVendor)?.value || 0)}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                <ShoppingBag size={16} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Vendor summary</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Click a vendor to drill into transactions</p>
              </div>
            </>
          )}
        </div>
        <div className="overflow-x-auto">
          {expandedVendor ? (
            <table className="w-full text-[13px] text-left">
              <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 font-bold">Item</th>
                  <th className="px-5 py-3 font-bold text-center">Qty</th>
                  <th className="px-5 py-3 font-bold text-right">Unit</th>
                  <th className="px-5 py-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {purchaseStats.vendorTxs[expandedVendor]?.map((tx, i) => (
                  <tr key={tx.id || i} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="num font-medium text-slate-700 dark:text-slate-200">{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 num">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">{tx.itemName}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="chip !text-[10.5px] num">{tx.quantity} {tx.unit}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 num">{fmtBDT(tx.unitPrice, 2)}</td>
                    <td className="px-5 py-3 text-right font-display num font-extrabold text-slate-900 dark:text-white">{fmtBDT(tx.total, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[13px] text-left">
              <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3 font-bold">Supplier</th>
                  <th className="px-5 py-3 font-bold text-right">Total</th>
                  <th className="px-5 py-3 font-bold text-right">Share</th>
                  <th className="px-5 py-3 font-bold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {purchaseStats.vendorData.length > 0 ? (
                  purchaseStats.vendorData.map((v, i) => {
                    const share = (v.value / (purchaseStats.totalPurchaseEst || 1)) * 100;
                    return (
                      <tr key={i} className="group hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <button onClick={() => setExpandedVendor(v.name)} className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1 transition">
                            {v.name} <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        </td>
                        <td className="px-5 py-3 text-right font-display num font-extrabold text-slate-900 dark:text-white">{fmtBDT(v.value, 2)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-500 num min-w-[36px] text-right">{share.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => setExpandedVendor(v.name)} className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:underline">View</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ShoppingBag size={32} className="opacity-30" />
                      <span className="text-[13px]">No supplier data for this period.</span>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
