import React, { useMemo, useState } from 'react';
import { Ingredient } from '../types';
import { Truck, Phone, Package, Search, DollarSign, Boxes } from 'lucide-react';

interface SupplierReportProps {
  ingredients: Ingredient[];
}

export const SupplierReport: React.FC<SupplierReportProps> = ({ ingredients }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { groups, stats } = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    let totalValue = 0;
    let totalItems = 0;

    ingredients.forEach(ing => {
      const supplier = ing.supplierName?.trim() || 'Unassigned / Local Market';
      if (!groups[supplier]) {
        groups[supplier] = [];
      }
      groups[supplier].push(ing);
      
      totalValue += (ing.currentStock * ing.unitPrice);
      totalItems++;
    });

    // Sort suppliers alphabetically
    const sortedGroups = Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, Ingredient[]>);

    return { 
      groups: sortedGroups, 
      stats: {
        totalSuppliers: Object.keys(groups).length,
        totalItems,
        totalValue
      }
    };
  }, [ingredients]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const lowerQuery = searchQuery.toLowerCase();
    
    return Object.keys(groups).reduce((acc: Record<string, Ingredient[]>, key) => {
      if (key.toLowerCase().includes(lowerQuery)) {
        acc[key] = groups[key];
      }
      return acc;
    }, {} as Record<string, Ingredient[]>);
  }, [groups, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-white">
            <Truck size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Supplier Overview</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage vendor relationships and inventory distribution</p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
                <Truck size={24} />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Suppliers</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSuppliers}</h3>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Boxes size={24} />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Items</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalItems}</h3>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <DollarSign size={24} />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inventory Value</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">৳{stats.totalValue.toLocaleString()}</h3>
            </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
      </div>

      {/* Masonry-like Grid */}
      <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
        {Object.entries(filteredGroups).map(([supplier, rawItems]) => {
            const items = rawItems as Ingredient[];
            const supplierTotal = items.reduce((sum, i) => sum + (i.currentStock * i.unitPrice), 0);
            
            return (
              <div key={supplier} className="break-inside-avoid bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/80">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-2" title={supplier}>
                        {supplier}
                    </h3>
                    <span className="shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-lg">
                        {items.length} Items
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    {items[0]?.supplierContact ? (
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-100 dark:border-slate-600">
                             <Phone size={12} /> 
                             <span className="font-mono">{items[0].supplierContact}</span>
                        </div>
                    ) : (
                        <span className="text-xs italic opacity-50">No contact info</span>
                    )}
                  </div>
                </div>
                
                {/* Table */}
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-700/20 uppercase sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Item</th>
                                <th className="px-5 py-3 text-right">Stock</th>
                                <th className="px-5 py-3 text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                                        <div className="truncate max-w-[140px]" title={item.name}>{item.name}</div>
                                    </td>
                                    <td className="px-5 py-2.5 text-right text-slate-500 dark:text-slate-400">
                                        {item.currentStock} <span className="text-[10px] uppercase">{item.unit}</span>
                                    </td>
                                    <td className="px-5 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                        ৳{(item.currentStock * item.unitPrice).toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Value</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                        ৳{supplierTotal.toLocaleString()}
                    </span>
                </div>
              </div>
            );
        })}
      </div>

      {Object.keys(filteredGroups).length === 0 && (
        <div className="text-center py-20 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">No suppliers found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};