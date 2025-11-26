import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, AlertTriangle, Sparkles, ArrowRight, Download, Filter, Calendar, Trash2 } from 'lucide-react';
import { DailyEntry, Office, Ingredient, UserRole } from '../types';
import { analyzeCanteenData } from '../services/geminiService';

interface DashboardProps {
  entries: DailyEntry[];
  offices: Office[];
  ingredients: Ingredient[];
  isDarkMode?: boolean;
  userRole: UserRole;
  onDeleteEntry: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ entries, offices, ingredients, isDarkMode, userRole, onDeleteEntry }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('last30');

  // 1. Available Months for Filter
  const availableMonths = useMemo(() => {
    const months = new Set(entries.map(e => e.date.substring(0, 7))); // YYYY-MM
    return Array.from(months).sort().reverse();
  }, [entries]);

  // 2. Filter Data based on selection (Shared by Chart, KPI, and Table)
  const filteredEntries = useMemo(() => {
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (selectedMonth === 'last30') {
      // Return last 30 entries
      return sortedEntries.slice(-30);
    }
    // Return entries for the selected month
    return sortedEntries.filter(e => e.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  // 3. Calculate Average Metrics from filtered data
  const { avgDailyCost, avgPerHead, avgParticipants } = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { avgDailyCost: 0, avgPerHead: 0, avgParticipants: 0 };
    }

    const totalCost = filteredEntries.reduce((sum, e) => sum + e.totalCost, 0);
    const totalParts = filteredEntries.reduce((sum, e) => sum + e.participantCount, 0);
    
    return {
      avgDailyCost: totalCost / filteredEntries.length,
      avgPerHead: totalParts > 0 ? totalCost / totalParts : 0, // Weighted Average
      avgParticipants: Math.round(totalParts / filteredEntries.length)
    };
  }, [filteredEntries]);

  // 4. Prepare Chart Data (using filteredEntries)
  const trendData = useMemo(() => {
    return filteredEntries.map((e) => {
      const perHead = e.participantCount > 0 ? e.totalCost / e.participantCount : 0;
      return {
        date: e.date.substring(5), // MM-DD
        CostPerHead: Number(perHead.toFixed(2)),
        TotalCost: e.totalCost
      };
    });
  }, [filteredEntries]);

  // 5. Stock Alerts
  const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStockThreshold);

  // 6. Displayed Entries for Table (Descending Order)
  const displayedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredEntries]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const metricsSummary = `Period: ${selectedMonth}, Avg Daily Cost: ৳${avgDailyCost.toFixed(2)}, Avg Participants: ${avgParticipants}, Avg Per Head: ৳${avgPerHead.toFixed(2)}`;
    const trendJson = JSON.stringify(trendData.slice(-7)); // Last 7 days of the period
    
    const result = await analyzeCanteenData(metricsSummary, trendJson);
    setAiInsight(String(result));
    setLoadingAi(false);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDeleteClick = (id: string, date: string) => {
    if (window.confirm(`Are you sure you want to delete the entry for ${date}? This action cannot be undone.`)) {
      onDeleteEntry(id);
    }
  };

  const periodLabel = selectedMonth === 'last30' ? 'Last 30 Days' : formatMonth(selectedMonth);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Dashboard</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Overview for {periodLabel}
          </p>
        </div>
        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="w-full md:w-auto group relative flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <Sparkles size={18} className="text-indigo-300 dark:text-indigo-100" />
          <span className="font-medium relative z-10">{loadingAi ? 'Generating Insights...' : 'AI Smart Insights'}</span>
        </button>
      </div>

      {/* AI Insight Box */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border border-indigo-100 dark:border-slate-700 p-6 rounded-2xl text-slate-800 dark:text-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 dark:bg-indigo-900 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-400">
            <Sparkles size={20} className="fill-indigo-300 dark:fill-indigo-900" /> 
            AI Strategic Analysis
          </h4>
          <p className="text-sm md:text-md leading-relaxed text-slate-700 dark:text-slate-300 relative z-10">{aiInsight}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
              <span className="font-bold text-xl">৳</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">~ Avg</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Daily Cost</p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">৳{avgDailyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <TrendingUp size={24} />
            </div>
             <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">Target: ৳120</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Per Head Cost</p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">৳{avgPerHead.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
              <Users size={24} />
            </div>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded-md">~ Avg</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Participants</p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">{avgParticipants.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group relative overflow-hidden">
          {lowStockItems.length > 0 && (
             <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 m-4 animate-ping"></div>
          )}
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">
              <AlertTriangle size={24} />
            </div>
             <span className={`text-xs font-semibold px-2 py-1 rounded-md ${lowStockItems.length > 0 ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30' : 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30'}`}>
               {lowStockItems.length > 0 ? 'Action Needed' : 'Healthy'}
             </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Stock Alerts</p>
            <h3 className={`text-2xl md:text-3xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{lowStockItems.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Cost Per Head Analysis</h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {selectedMonth === 'last30' ? '30-day performance trend' : `Analysis for ${formatMonth(selectedMonth)}`}
              </p>
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full md:w-auto pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <option value="last30">Last 30 Days</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>{formatMonth(month)}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
          
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDarkMode ? "#94a3b8" : "#94a3b8"} 
                  tick={{fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke={isDarkMode ? "#94a3b8" : "#94a3b8"} 
                  tick={{fontSize: 12}} 
                  tickFormatter={(val) => `৳${val}`} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
                    borderRadius: '12px', 
                    border: isDarkMode ? '1px solid #334155' : 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: isDarkMode ? '#f8fafc' : '#1e293b', fontWeight: 600 }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="CostPerHead" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                  name="Per Head Cost (৳)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Alert List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Low Stock Warnings
            </span>
            <span className="text-xs font-normal text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-full">{lowStockItems.length} Items</span>
          </h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                   <Sparkles size={20} />
                </div>
                <p className="text-sm">All inventory levels are healthy.</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="group p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-100 dark:hover:border-red-900 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Min: {item.minStockThreshold} {item.unit}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min((item.currentStock / item.minStockThreshold) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {lowStockItems.length > 0 && (
             <button className="mt-6 w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2">
               View Inventory Master <ArrowRight size={14} />
             </button>
          )}
        </div>
      </div>

      {/* Daily Costing Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Daily Costing Report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedMonth === 'last30' ? 'All historical cost sheets (Last 30 Days)' : `Cost sheets for ${formatMonth(selectedMonth)}`}
            </p>
          </div>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded-lg transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-center">Participants</th>
                <th className="px-6 py-4 font-semibold text-right">Total Cost</th>
                <th className="px-6 py-4 font-semibold text-right">Per Head</th>
                <th className="px-6 py-4 font-semibold text-left">Menu</th>
                {userRole === 'ADMIN' && (
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {displayedEntries.length === 0 ? (
                 <tr>
                 <td colSpan={userRole === 'ADMIN' ? 6 : 5} className="px-6 py-12 text-center text-slate-400">
                   No data available for this period.
                 </td>
               </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const perHead = entry.participantCount > 0 ? entry.totalCost / entry.participantCount : 0;
                  
                  return (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {entry.date}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300 font-medium text-xs">
                        {entry.participantCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                      ৳{entry.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-semibold text-slate-900 dark:text-white">
                         ৳{perHead.toFixed(2)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="text-slate-700 dark:text-slate-300 text-xs font-medium bg-blue-50/50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md border border-blue-50 dark:border-blue-900/30 inline-block max-w-xs truncate" title={entry.menuDescription}>
                        {entry.menuDescription || "Standard Menu"}
                      </span>
                    </td>
                    {userRole === 'ADMIN' && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteClick(entry.id, entry.date)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete Entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};