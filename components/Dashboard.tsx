import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, AlertTriangle, Sparkles } from 'lucide-react';
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
  const sortedDates = [...new Set(entries.map(e => e.date))].sort();
  const latestDate = sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0];
  
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

  // 4. Office Wise Breakdown (For Table)
  const officeBreakdown = todaysEntries.map(e => {
    const office = offices.find(o => o.id === e.officeId);
    return {
      officeName: office?.name || 'Unknown',
      participants: e.participantCount,
      cost: e.totalCost,
      perHead: e.participantCount > 0 ? e.totalCost / e.participantCount : 0
    };
  });

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const metricsSummary = `Date: ${latestDate}, Total Cost: $${totalDailyCost}, Total Participants: ${totalParticipants}, Global Per Head: $${globalPerHead.toFixed(2)}`;
    const trendJson = JSON.stringify(trendData.slice(-7)); // Last 7 days for brevity
    
    const result = await analyzeCanteenData(metricsSummary, trendJson);
    setAiInsight(result);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-slate-500">Overview for {latestDate}</p>
        </div>
        <button 
          onClick={handleAiAnalysis}
          disabled={loadingAi}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Sparkles size={18} />
          {loadingAi ? 'Analyzing...' : 'AI Smart Insights'}
        </button>
      </div>

      {/* AI Insight Box */}
      {aiInsight && (
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 shadow-sm">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-indigo-600" /> 
            AI Analysis
          </h4>
          <p className="text-sm leading-relaxed">{aiInsight}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Daily Cost</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">${totalDailyCost.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-lg text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Global Per Head</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">${globalPerHead.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-1">Target: $2.50</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Participants</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalParticipants.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Stock Alerts</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2">{lowStockItems.length}</h3>
              <p className="text-xs text-red-400 mt-1">Items below threshold</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg text-red-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Cost Per Head Trends (30 Days)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="CostPerHead" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Per Head Cost ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Alert List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            Low Stock Warnings
          </h3>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {lowStockItems.length === 0 ? (
              <p className="text-slate-500 italic text-sm">All stocks levels are healthy.</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-1.5 mt-2">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(item.currentStock / item.minStockThreshold) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Min Threshold: {item.minStockThreshold} {item.unit}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Office Wise Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Office Wise Report ({latestDate})</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Download CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Office Name</th>
                <th className="px-6 py-3 font-medium text-center">Participants</th>
                <th className="px-6 py-3 font-medium text-right">Total Cost</th>
                <th className="px-6 py-3 font-medium text-right">Per Head Cost</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {officeBreakdown.length === 0 ? (
                 <tr>
                 <td colSpan={5} className="px-6 py-4 text-center text-slate-500">No entries for today.</td>
               </tr>
              ) : (
                officeBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{row.officeName}</td>
                    <td className="px-6 py-4 text-center">{row.participants}</td>
                    <td className="px-6 py-4 text-right">${row.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">${row.perHead.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.perHead > 3.0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {row.perHead > 3.0 ? 'High' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};