import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, AlertTriangle, Sparkles, ArrowRight, Download } from 'lucide-react';
import { DailyEntry, Office, Ingredient } from '../types';
import { analyzeCanteenData } from '../services/geminiService';

interface DashboardProps {
  entries: DailyEntry[];
  offices: Office[];
  ingredients: Ingredient[];
}

export const Dashboard: React.FC<DashboardProps> = ({ entries, offices, ingredients }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // 1. Calculate Today's Metrics (Assuming 'Today' is the last date in mock data for demo)
  const sortedDates: string[] = Array.from<string>(new Set(entries.map(e => e.date))).sort();
  const latestDate: string = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : new Date().toISOString().split('T')[0];
  
  const todaysEntries = entries.filter(e => e.date === latestDate);
  const totalDailyCost = todaysEntries.reduce((sum, e) => sum + e.totalCost, 0);
  const totalParticipants = todaysEntries.reduce((sum, e) => sum + e.participantCount, 0);
  const globalPerHead = totalParticipants > 0 ? totalDailyCost / totalParticipants : 0;

  // 2. Prepare Chart Data (Last 30 Days Trend)
  const trendData = sortedDates.slice(-30).map((date: string) => {
    const dayEntries = entries.filter(e => e.date === date);
    const cost = dayEntries.reduce((sum, e) => sum + e.totalCost, 0);
    const parts = dayEntries.reduce((sum, e) => sum + e.participantCount, 0);
    return {
      date: date.substring(5), // MM-DD
      CostPerHead: parts > 0 ? Number((cost / parts).toFixed(2)) : 0,
      TotalCost: cost
    };
  });

  // 3. Stock Alerts
  const lowStockItems = ingredients.filter(i => i.currentStock <= i.minStockThreshold);

  // 4. Recent Entries (For Daily Costing Report Table)
  const recentEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const metricsSummary = `Date: ${latestDate}, Total Cost: ৳${totalDailyCost}, Total Participants: ${totalParticipants}, Global Per Head: ৳${globalPerHead.toFixed(2)}`;
    const trendJson = JSON.stringify(trendData.slice(-7)); // Last 7 days for brevity
    
    const result = await analyzeCanteenData(metricsSummary, trendJson);
    setAiInsight(String(result));
    setLoadingAi(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Overview for {formatDate(String(latestDate))}
          </p>
        </div>
        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="group relative flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <Sparkles size={18} className="text-indigo-300" />
          <span className="font-medium relative z-10">{loadingAi ? 'Generating Insights...' : 'AI Smart Insights'}</span>
        </button>
      </div>

      {/* AI Insight Box */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl text-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <h4 className="font-bold flex items-center gap-2 mb-3 text-indigo-700">
            <Sparkles size={20} className="fill-indigo-300" /> 
            AI Strategic Analysis
          </h4>
          <p className="text-md leading-relaxed text-slate-700 relative z-10">{aiInsight}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <span className="font-bold text-xl">৳</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+2.4%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Daily Cost</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">৳{totalDailyCost.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
              <TrendingUp size={24} />
            </div>
             <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Target: ৳120</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Global Per Head</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">৳{globalPerHead.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
           <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-violet-50 rounded-xl text-violet-600 group-hover:bg-violet-100 transition-colors">
              <Users size={24} />
            </div>
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded-md">~ Avg</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Participants</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{totalParticipants.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
          {lowStockItems.length > 0 && (
             <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 m-4 animate-ping"></div>
          )}
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-100 transition-colors">
              <AlertTriangle size={24} />
            </div>
             <span className={`text-xs font-semibold px-2 py-1 rounded-md ${lowStockItems.length > 0 ? 'text-rose-600 bg-rose-50' : 'text-green-600 bg-green-50'}`}>
               {lowStockItems.length > 0 ? 'Action Needed' : 'Healthy'}
             </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Stock Alerts</p>
            <h3 className={`text-3xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockItems.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="xl:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Cost Per Head Analysis</h3>
              <p className="text-sm text-slate-500">30-day performance trend for ACI Canteen</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tick={{fontSize: 12}} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fontSize: 12}} 
                  tickFormatter={(val) => `৳${val}`} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Low Stock Warnings
            </span>
            <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{lowStockItems.length} Items</span>
          </h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                   <Sparkles size={20} />
                </div>
                <p className="text-sm">All inventory levels are healthy.</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="group p-4 rounded-xl border border-slate-100 bg-white hover:border-red-100 hover:bg-red-50/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-500">Min: {item.minStockThreshold} {item.unit}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
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
             <button className="mt-6 w-full py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
               View Inventory Master <ArrowRight size={14} />
             </button>
          )}
        </div>
      </div>

      {/* Daily Costing Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Daily Costing Report</h3>
            <p className="text-sm text-slate-500">Historical daily cost sheets</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-center">Participants</th>
                <th className="px-6 py-4 font-semibold text-right">Total Cost</th>
                <th className="px-6 py-4 font-semibold text-right">Per Head</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEntries.length === 0 ? (
                 <tr>
                 <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                   No data available.
                 </td>
               </tr>
              ) : (
                recentEntries.map((entry, idx) => {
                  const perHead = entry.participantCount > 0 ? entry.totalCost / entry.participantCount : 0;
                  
                  return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-600">
                        {entry.date}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium text-xs">
                        {entry.participantCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      ৳{entry.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-semibold text-slate-900">
                         ৳{perHead.toFixed(2)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        perHead > 150 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {perHead > 150 ? 'Review' : 'Optimal'}
                      </span>
                    </td>
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