import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie 
} from 'recharts';
import { Calendar, Filter, Download, DollarSign, Users, TrendingUp, ShoppingBag, PieChart as PieIcon } from 'lucide-react';
import { DailyEntry, Ingredient, ActivityLog } from '../types';

interface ReportingProps {
  entries: DailyEntry[];
  logs: ActivityLog[];
  ingredients: Ingredient[];
}

type TimeFrame = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export const Reporting: React.FC<ReportingProps> = ({ entries, logs, ingredients }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- 1. Date Filtering Logic ---
  const { startDate, endDate, label } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    let lbl = '';

    if (timeFrame === 'custom') {
      return {
        startDate: customStartDate ? new Date(customStartDate) : new Date(0), // Fallback to epoch if empty
        endDate: customEndDate ? new Date(customEndDate) : new Date(),
        label: `${customStartDate} to ${customEndDate}`
      };
    }

    // Reset hours to start of day for comparison
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    switch (timeFrame) {
      case 'week':
        start.setDate(end.getDate() - 7);
        lbl = 'Last 7 Days';
        break;
      case 'month':
        start.setDate(1); // Start of current month
        lbl = 'This Month';
        break;
      case 'quarter':
        start.setMonth(Math.floor(end.getMonth() / 3) * 3);
        start.setDate(1);
        lbl = 'This Quarter';
        break;
      case 'year':
        start.setMonth(0, 1);
        lbl = 'This Year';
        break;
    }

    return { startDate: start, endDate: end, label: lbl };
  }, [timeFrame, customStartDate, customEndDate]);

  // --- 2. Filter Data ---
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, startDate, endDate]);

  const filteredPurchases = useMemo(() => {
    return logs.filter(l => {
        const d = new Date(l.timestamp);
        // Filter for ADD stock actions only
        return l.action === 'UPDATE_STOCK' && 
               l.metadata?.type === 'add' && 
               l.metadata?.quantity > 0 &&
               d >= startDate && 
               d <= endDate;
    });
  }, [logs, startDate, endDate]);

  // --- 3. Calculate Consumption Metrics ---
  const consumptionStats = useMemo(() => {
    const totalCost = filteredEntries.reduce((sum, e) => sum + e.totalCost, 0);
    const totalParticipants = filteredEntries.reduce((sum, e) => sum + e.participantCount, 0);
    const daysCount = filteredEntries.length || 1;

    return {
        totalCost,
        totalParticipants,
        avgCostPerHead: totalParticipants > 0 ? totalCost / totalParticipants : 0,
        avgDailyCost: totalCost / daysCount,
        avgDailyParticipants: Math.round(totalParticipants / daysCount)
    };
  }, [filteredEntries]);

  // --- 4. Calculate Vendor/Purchase Metrics ---
  const purchaseStats = useMemo(() => {
    let totalPurchaseEst = 0;
    const vendorMap: Record<string, number> = {};

    filteredPurchases.forEach(log => {
        const ing = ingredients.find(i => i.id === log.metadata.ingredientId);
        // Snapshot price estimation (using current master price)
        const cost = (log.metadata.quantity || 0) * (ing?.unitPrice || 0);
        
        // Determine supplier
        const supplier = log.metadata.supplier || ing?.supplierName || 'Unassigned / Local Market';
        
        totalPurchaseEst += cost;
        vendorMap[supplier] = (vendorMap[supplier] || 0) + cost;
    });

    const vendorData = Object.entries(vendorMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort highest spend first

    return {
        totalPurchaseEst,
        vendorData
    };
  }, [filteredPurchases, ingredients]);

  // --- 5. Chart Data Prep ---
  const dailyTrendData = useMemo(() => {
    return filteredEntries.map(e => ({
        date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: e.date,
        Cost: e.totalCost,
        Participants: e.participantCount,
        PerHead: e.participantCount ? Number((e.totalCost / e.participantCount).toFixed(2)) : 0
    }));
  }, [filteredEntries]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

  // --- 6. Export Function ---
  const handleExportReport = () => {
    const csvRows = [];

    // Header / Summary
    csvRows.push(['REPORT SUMMARY']);
    csvRows.push(['Report Type', 'Canteen Analytics (Events Excluded)']);
    csvRows.push(['Period', label]);
    csvRows.push(['Start Date', startDate.toLocaleDateString()]);
    csvRows.push(['End Date', endDate.toLocaleDateString()]);
    csvRows.push([]);
    
    csvRows.push(['KEY METRICS']);
    csvRows.push(['Total Consumption Cost', consumptionStats.totalCost.toFixed(2)]);
    csvRows.push(['Total Participants', consumptionStats.totalParticipants]);
    csvRows.push(['Avg Cost Per Head', consumptionStats.avgCostPerHead.toFixed(2)]);
    csvRows.push(['Avg Daily Cost', consumptionStats.avgDailyCost.toFixed(2)]);
    csvRows.push(['Total Purchase Est.', purchaseStats.totalPurchaseEst.toFixed(2)]);
    csvRows.push([]);

    // Vendor Section
    csvRows.push(['VENDOR / SUPPLIER ANALYSIS']);
    csvRows.push(['Supplier Name', 'Total Purchase Amount (Est.)']);
    purchaseStats.vendorData.forEach(v => {
        csvRows.push([`"${v.name.replace(/"/g, '""')}"`, v.value.toFixed(2)]);
    });
    csvRows.push([]);

    // Daily Breakdown
    csvRows.push(['DAILY CONSUMPTION BREAKDOWN']);
    csvRows.push(['Date', 'Participants', 'Total Cost', 'Cost Per Head', 'Menu']);
    filteredEntries.forEach(e => {
        const ph = e.participantCount ? (e.totalCost / e.participantCount).toFixed(2) : "0.00";
        csvRows.push([
            e.date,
            e.participantCount,
            e.totalCost.toFixed(2),
            ph,
            `"${(e.menuDescription || '').replace(/"/g, '""')}"`
        ]);
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ACI_Canteen_Report_${timeFrame}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <PieIcon className="text-blue-600 dark:text-blue-400" size={32} />
                    Analytics & Reporting
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Generate comprehensive reports on costs, consumption, and supplier performance.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
                {timeFrame === 'custom' && (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-600">
                        <input 
                            type="date" 
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="bg-transparent text-sm p-1 outline-none text-slate-700 dark:text-slate-200"
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                            type="date" 
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="bg-transparent text-sm p-1 outline-none text-slate-700 dark:text-slate-200"
                        />
                    </div>
                )}
                
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setTimeFrame('week')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeFrame === 'week' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Week
                    </button>
                    <button 
                        onClick={() => setTimeFrame('month')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeFrame === 'month' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Month
                    </button>
                    <button 
                        onClick={() => setTimeFrame('quarter')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeFrame === 'quarter' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Quarter
                    </button>
                    <button 
                        onClick={() => setTimeFrame('year')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeFrame === 'year' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Year
                    </button>
                    <button 
                        onClick={() => setTimeFrame('custom')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${timeFrame === 'custom' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Custom
                    </button>
                </div>

                <button 
                    onClick={handleExportReport}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-colors"
                >
                    <Download size={18} /> Export Report
                </button>
            </div>
        </div>

        {/* Date Context Bar */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
            <Calendar size={16} />
            Showing data for: <span className="font-bold">{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Consumption</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            ৳{consumptionStats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                    Operational expense for selected period
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Participants</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {consumptionStats.totalParticipants.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400">
                        <Users size={20} />
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                    Avg. {consumptionStats.avgDailyParticipants} per day
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Cost Per Head</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            ৳{consumptionStats.avgCostPerHead.toFixed(2)}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={20} />
                    </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                    Global average for period
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Purchase Est.</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            ৳{purchaseStats.totalPurchaseEst.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                        <ShoppingBag size={20} />
                    </div>
                </div>
                 <div className="mt-3 text-xs text-slate-400">
                    Stock added value (Vendor purchases)
                </div>
            </div>
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Cost Per Head Line Chart (New) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 xl:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Cost Per Head Trend</h3>
                <div className="h-[300px] w-full">
                    {dailyTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                    tickLine={false} 
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                    tickFormatter={(val) => `৳${val}`} 
                                    tickLine={false} 
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    cursor={{stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{fontSize: '12px', marginTop: '10px'}} />
                                <Line 
                                    type="monotone" 
                                    dataKey="PerHead" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={{r: 4, strokeWidth: 2}}
                                    activeDot={{r: 6}}
                                    name="Cost Per Head" 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data for selected period</div>
                    )}
                </div>
            </div>

            {/* Daily Trend Chart (Bar) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Daily Total Cost</h3>
                <div className="h-[300px] w-full">
                    {dailyTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyTrendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                    tickLine={false} 
                                    axisLine={false}
                                />
                                <YAxis 
                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                    tickFormatter={(val) => `৳${(val/1000).toFixed(0)}k`} 
                                    tickLine={false} 
                                    axisLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9', opacity: 0.5}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{fontSize: '12px', marginTop: '10px'}} />
                                <Bar dataKey="Cost" fill="#3b82f6" name="Total Cost" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data for selected period</div>
                    )}
                </div>
            </div>

            {/* Vendor Breakdown Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Cost by Vendor</h3>
                <p className="text-xs text-slate-500 mb-6">Distribution of procurement costs among top suppliers</p>
                
                <div className="flex-1 min-h-[300px] flex flex-col md:flex-row items-center gap-6">
                     {purchaseStats.vendorData.length > 0 ? (
                        <>
                             <div className="w-full md:w-1/2 h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={purchaseStats.vendorData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {purchaseStats.vendorData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                             </div>
                             
                             {/* Custom Legend/List */}
                             <div className="w-full md:w-1/2 h-[250px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                 {purchaseStats.vendorData.map((v, idx) => (
                                     <div key={v.name} className="flex justify-between items-center text-sm">
                                         <div className="flex items-center gap-2">
                                             <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                             <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={v.name}>{v.name}</span>
                                         </div>
                                         <span className="font-bold text-slate-900 dark:text-white">৳{v.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                     </div>
                                 ))}
                             </div>
                        </>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No purchase data found</div>
                     )}
                </div>
            </div>
        </div>

        {/* --- VENDOR TABLE --- */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Vendor Purchase Summary</h3>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                         <tr>
                             <th className="px-6 py-4">Supplier Name</th>
                             <th className="px-6 py-4 text-right">Total Purchase Amount</th>
                             <th className="px-6 py-4 text-right">% of Total</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {purchaseStats.vendorData.length > 0 ? (
                             purchaseStats.vendorData.map((v, idx) => (
                                 <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                     <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{v.name}</td>
                                     <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">৳{v.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                     <td className="px-6 py-3 text-right text-slate-500">
                                         {((v.value / purchaseStats.totalPurchaseEst) * 100).toFixed(1)}%
                                     </td>
                                 </tr>
                             ))
                         ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">No supplier data for this period.</td>
                            </tr>
                         )}
                     </tbody>
                 </table>
             </div>
        </div>
    </div>
  );
};