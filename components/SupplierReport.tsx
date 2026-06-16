import React, { useMemo, useState } from 'react';
import { Ingredient, ActivityLog } from '../types';
import { Truck, Phone, Search, DollarSign, Calendar, ShoppingCart, Clock, Download } from 'lucide-react';

interface SupplierReportProps {
  ingredients: Ingredient[];
  logs: ActivityLog[];
}

interface PurchaseTransaction {
    id: string;
    date: string;
    supplier: string;
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    estimatedUnitCost: number;
    estimatedTotalCost: number;
}

export const SupplierReport: React.FC<SupplierReportProps> = ({ ingredients, logs }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Process Logs into Purchase Transactions
  const { transactions, groups, stats } = useMemo(() => {
    // Sort logs chronologically (oldest to newest) to apply subtractions correctly
    const stockLogs = [...logs]
        .filter(l => l.action === 'UPDATE_STOCK' && l.metadata?.quantity > 0)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const activeTxList: PurchaseTransaction[] = [];

    stockLogs.forEach(log => {
        const ing = ingredients.find(i => i.id === log.metadata.ingredientId);
        // If ingredient doesn't exist anymore (deleted from master stock), we also remove it from the ledger
        if (!ing) return;

        const supplierName = log.metadata.supplier || ing.supplierName || 'Unassigned / Local Market';
        const qty = Number(log.metadata.quantity || 0);

        if (log.metadata.type === 'add') {
            activeTxList.push({
                id: log.id,
                date: log.timestamp,
                supplier: supplierName,
                ingredientId: log.metadata.ingredientId,
                ingredientName: ing.name,
                quantity: qty,
                unit: ing.unit || 'units',
                estimatedUnitCost: ing.unitPrice || 0,
                estimatedTotalCost: qty * (ing.unitPrice || 0)
            });
        } else if (log.metadata.type === 'subtract') {
            let remainingToSubtract = qty;
            // Subtract from the latest additions (LIFO / correction approach)
            for (let i = activeTxList.length - 1; i >= 0; i--) {
                const tx = activeTxList[i];
                if (tx.ingredientId === log.metadata.ingredientId) {
                    if (log.metadata.supplier && tx.supplier !== log.metadata.supplier) {
                        continue;
                    }
                    if (tx.quantity >= remainingToSubtract) {
                        tx.quantity -= remainingToSubtract;
                        tx.estimatedTotalCost = tx.quantity * tx.estimatedUnitCost;
                        remainingToSubtract = 0;
                        break;
                    } else {
                        remainingToSubtract -= tx.quantity;
                        tx.quantity = 0;
                        tx.estimatedTotalCost = 0;
                    }
                }
            }
        }
    });

    const finalTransactions = activeTxList.filter(tx => tx.quantity > 0);

    // Group by Supplier
    const grouped: Record<string, PurchaseTransaction[]> = {};
    let totalSpend = 0;
    let totalTxCount = 0;

    finalTransactions.forEach(tx => {
        if (!grouped[tx.supplier]) {
            grouped[tx.supplier] = [];
        }
        grouped[tx.supplier].push(tx);
        totalSpend += tx.estimatedTotalCost;
        totalTxCount++;
    });

    // Sort transactions within each group by date desc
    Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // Sort suppliers alphabetically
    const sortedGroups = Object.keys(grouped).sort().reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
    }, {} as Record<string, PurchaseTransaction[]>);

    return {
        transactions: finalTransactions,
        groups: sortedGroups,
        stats: {
            totalSuppliers: Object.keys(grouped).length,
            totalTransactions: totalTxCount,
            totalSpend
        }
    };
  }, [logs, ingredients]);

  // 2. Search Filter
  const filteredGroups = useMemo<Record<string, PurchaseTransaction[]>>(() => {
    if (!searchQuery) return groups;
    const lowerQuery = searchQuery.toLowerCase();
    
    return Object.keys(groups).reduce((acc: Record<string, PurchaseTransaction[]>, key) => {
      // Filter by supplier name OR by transaction items
      const supplierMatch = key.toLowerCase().includes(lowerQuery);
      const matchingTransactions = groups[key].filter(t => t.ingredientName.toLowerCase().includes(lowerQuery));

      if (supplierMatch) {
        // If supplier matches, show all their history
        acc[key] = groups[key];
      } else if (matchingTransactions.length > 0) {
        // If items match, show only those transactions
        acc[key] = matchingTransactions;
      }
      return acc;
    }, {} as Record<string, PurchaseTransaction[]>);
  }, [groups, searchQuery]);

  // Helper for relative time
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleExportSupplierCSV = (supplierName: string, transactions: PurchaseTransaction[]) => {
    if (transactions.length === 0) return;

    const headers = ["Date", "Time", "Item Name", "Quantity", "Unit", "Unit Price (Est)", "Total Cost (Est)"];
    
    const csvRows = transactions.map(tx => {
      const dateObj = new Date(tx.date);
      const date = dateObj.toLocaleDateString();
      const time = dateObj.toLocaleTimeString();
      return [
        date,
        time,
        `"${tx.ingredientName.replace(/"/g, '""')}"`,
        tx.quantity.toFixed(2),
        tx.unit,
        tx.estimatedUnitCost.toFixed(2),
        tx.estimatedTotalCost.toFixed(2)
      ].join(",");
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Supplier_Ledger_${supplierName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Truck className="text-blue-600 dark:text-blue-400" size={32} />
             Purchase Ledger
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
             Historical log of all ingredients purchased, grouped by supplier.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search supplier or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Suppliers</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalSuppliers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalTransactions}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Purchases Est.</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">৳{stats.totalSpend.toLocaleString()}</p>
        </div>
      </div>

      {/* Ledger Grid */}
      <div className="columns-1 lg:columns-2 gap-6 space-y-6">
        {Object.entries(filteredGroups).map(([supplier, txs]: [string, PurchaseTransaction[]]) => {
            const supplierTotal = txs.reduce((sum, t) => sum + t.estimatedTotalCost, 0);
            
            // Find contact info from the master list for this supplier (best effort)
            const masterInfo = ingredients.find(i => i.supplierName === supplier);
            const contactInfo = masterInfo?.supplierContact;
            
            return (
              <div key={supplier} className="break-inside-avoid bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                
                {/* Supplier Card Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        {supplier}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                        {contactInfo ? (
                             <span className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                <Phone size={10} /> {contactInfo}
                             </span>
                        ) : (
                             <span className="text-xs text-slate-400 italic">No contact info</span>
                        )}
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {txs.length} Entries
                        </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <button
                        onClick={() => handleExportSupplierCSV(supplier, txs)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-lg transition-colors shadow-sm"
                        title="Download CSV Ledger"
                     >
                        <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
                     </button>
                     <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Purchase Total</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">৳{supplierTotal.toLocaleString()}</p>
                     </div>
                  </div>
                </div>
                
                {/* Transaction Table */}
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 bg-white dark:bg-slate-800 uppercase border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-5 py-3 font-semibold pl-6">Date</th>
                                <th className="px-5 py-3 font-semibold">Item Purchased</th>
                                <th className="px-5 py-3 text-right">Qty</th>
                                <th className="px-5 py-3 text-right pr-6">Cost (Est.)</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                             {txs.map(tx => {
                                 const isSubtract = tx.quantity < 0;
                                 return (
                                     <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                         <td className="px-5 py-3 pl-6 whitespace-nowrap">
                                             <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                                                 <Calendar size={12} className="text-slate-400" />
                                                 {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                             </div>
                                             <div className="text-[10px] text-slate-400 mt-0.5 ml-4">
                                                 {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </div>
                                         </td>
                                         
                                         <td className="px-5 py-3">
                                             <span className="font-semibold text-slate-700 dark:text-slate-200 block">{tx.ingredientName}</span>
                                             <span className="text-[10px] text-slate-400">{getRelativeTime(tx.date)}</span>
                                         </td>
                                         
                                         <td className="px-5 py-3 text-right">
                                             {isSubtract ? (
                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs font-bold" title="Stock Removals (Deducted)">
                                                     {tx.quantity.toFixed(2)} {tx.unit}
                                                 </span>
                                             ) : (
                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold" title="Stock Additions">
                                                     +{tx.quantity.toFixed(2)} {tx.unit}
                                                 </span>
                                             )}
                                         </td>

                                         <td className="px-5 py-3 text-right pr-6 font-mono text-slate-600 dark:text-slate-400">
                                             {isSubtract ? '-' : ''}৳{Math.abs(tx.estimatedTotalCost).toLocaleString(undefined, {maximumFractionDigits: 0})}
                                         </td>
                                     </tr>
                                 );
                             })}
                         </tbody>
                    </table>
                </div>
              </div>
            );
        })}
      </div>

      {Object.keys(filteredGroups).length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
            <ShoppingCart size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-white">No purchase records found</h3>
            <p className="text-slate-400 dark:text-slate-500">
                {searchQuery ? `No matches for "${searchQuery}"` : "Add stock via 'Masters & Stock' to see entries here."}
            </p>
        </div>
      )}
    </div>
  );
};