import React, { useMemo, useState } from 'react';
import { Ingredient, ActivityLog } from '../types';
import { Truck, Phone, Search, Calendar, ShoppingCart, Download, Users, DollarSign } from 'lucide-react';

interface SupplierReportProps {
  ingredients: Ingredient[];
  logs: ActivityLog[];
}

interface PurchaseTx {
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

const fmtBDT = (n: number, digits = 0) =>
  `৳${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const relative = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

export const SupplierReport: React.FC<SupplierReportProps> = ({ ingredients, logs }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { transactions, groups, stats } = useMemo(() => {
    const stockLogs = [...logs]
      .filter((l) => l.action === 'UPDATE_STOCK' && l.metadata?.quantity > 0 && l.metadata?.type === 'add')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const list: PurchaseTx[] = [];
    stockLogs.forEach((log) => {
      const ing = ingredients.find((i) => i.id === log.metadata.ingredientId);
      if (!ing) return;
      const supplier = log.metadata.supplier || ing.supplierName || 'Unassigned';
      const qty = Number(log.metadata.quantity || 0);
      const unitPrice = log.metadata.unitPrice !== undefined ? Number(log.metadata.unitPrice) : (ing.unitPrice || 0);
      list.push({
        id: log.id, date: log.timestamp, supplier, ingredientId: log.metadata.ingredientId,
        ingredientName: ing.name, quantity: qty, unit: ing.unit || 'units',
        estimatedUnitCost: unitPrice, estimatedTotalCost: qty * unitPrice,
      });
    });

    const final = list.filter((t) => t.quantity > 0);
    const grouped: Record<string, PurchaseTx[]> = {};
    let totalSpend = 0;
    final.forEach((tx) => {
      (grouped[tx.supplier] ||= []).push(tx);
      totalSpend += tx.estimatedTotalCost;
    });
    Object.keys(grouped).forEach((k) => grouped[k].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const sortedGroups = Object.keys(grouped).sort().reduce((acc, k) => { acc[k] = grouped[k]; return acc; }, {} as Record<string, PurchaseTx[]>);

    return {
      transactions: final,
      groups: sortedGroups,
      stats: { totalSuppliers: Object.keys(grouped).length, totalTransactions: final.length, totalSpend },
    };
  }, [logs, ingredients]);

  const filteredGroups = useMemo<Record<string, PurchaseTx[]>>(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return Object.keys(groups).reduce((acc, k) => {
      const supMatch = k.toLowerCase().includes(q);
      const matching = groups[k].filter((t) => t.ingredientName.toLowerCase().includes(q));
      if (supMatch) acc[k] = groups[k];
      else if (matching.length > 0) acc[k] = matching;
      return acc;
    }, {} as Record<string, PurchaseTx[]>);
  }, [groups, searchQuery]);

  const handleExportCSV = (supplierName: string, txs: PurchaseTx[]) => {
    const headers = ['Date', 'Time', 'Item Name', 'Quantity', 'Unit', 'Unit Price (Est)', 'Total Cost (Est)'];
    const rows = txs.map((tx) => {
      const d = new Date(tx.date);
      return [d.toLocaleDateString(), d.toLocaleTimeString(), `"${tx.ingredientName.replace(/"/g, '""')}"`, tx.quantity.toFixed(2), tx.unit, tx.estimatedUnitCost.toFixed(2), tx.estimatedTotalCost.toFixed(2)].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Supplier_Ledger_${supplierName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="chip"><Truck size={11} /> Purchase ledger</span>
            <span className="chip !bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/20">
              <span className="num">{stats.totalSuppliers}</span> suppliers · <span className="num">{fmtBDT(stats.totalSpend)}</span> total
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">Suppliers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Historical purchase log grouped by vendor</p>
        </div>
        <div className="relative w-full xl:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search supplier or item…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 panel !rounded-xl !p-2.5 !pl-9 text-[13px] outline-none focus:!border-indigo-500/40"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active suppliers', value: stats.totalSuppliers, color: 'from-indigo-500 to-blue-500', icon: Users },
          { label: 'Transactions', value: stats.totalTransactions, color: 'from-violet-500 to-purple-500', icon: ShoppingCart },
          { label: 'Total purchases', value: fmtBDT(stats.totalSpend), color: 'from-emerald-500 to-teal-500', icon: DollarSign },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="panel p-4 relative overflow-hidden">
              <span className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.color} opacity-90`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className="font-display num text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{s.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon size={15} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ledger cards */}
      {Object.keys(filteredGroups).length === 0 ? (
        <div className="panel p-12 text-center">
          <ShoppingCart size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200">No records found</p>
          <p className="text-[12px] text-slate-500 mt-1">
            {searchQuery ? `Nothing matches "${searchQuery}".` : 'Add stock via Inventory to see entries here.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 lg:columns-2 gap-4 space-y-4">
          {Object.entries(filteredGroups).map(([supplier, txs]) => {
            const supplierTotal = txs.reduce((s, t) => s + t.estimatedTotalCost, 0);
            const master = ingredients.find((i) => i.supplierName === supplier);
            const contact = master?.supplierContact;
            return (
              <div key={supplier} className="panel overflow-hidden break-inside-avoid hover:shadow-soft-lg transition-shadow">
                <div className="p-4 border-b border-slate-200/60 dark:border-white/[0.06] bg-gradient-to-br from-slate-50/70 to-transparent dark:from-white/[0.02] dark:to-transparent flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[14px] text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-md text-[11px] font-extrabold">
                        {supplier.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{supplier}</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {contact ? (
                        <span className="chip !py-[3px] !text-[10.5px] num"><Phone size={9} /> {contact}</span>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 italic">No contact</span>
                      )}
                      <span className="chip !py-[3px] !text-[10.5px] num">{txs.length} entries</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExportCSV(supplier, txs)}
                      className="chip !py-1.5 !px-2 hover:!text-indigo-600 dark:hover:!text-indigo-300 transition"
                      title="Download CSV"
                    >
                      <Download size={12} />
                    </button>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                      <p className="font-display num text-[14px] font-extrabold text-slate-900 dark:text-white">{fmtBDT(supplierTotal)}</p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-[12.5px] text-left">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-white/50 dark:bg-white/[0.02] border-b border-slate-200/50 dark:border-white/[0.05] sticky top-0 backdrop-blur">
                      <tr>
                        <th className="px-4 py-2 font-bold">Date</th>
                        <th className="px-4 py-2 font-bold">Item</th>
                        <th className="px-4 py-2 font-bold text-right">Qty</th>
                        <th className="px-4 py-2 font-bold text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                      {txs.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <p className="num font-medium text-slate-700 dark:text-slate-200 text-[12px] flex items-center gap-1"><Calendar size={10} className="text-slate-400" />{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}</p>
                            <p className="text-[9.5px] text-slate-400 num pl-3.5 mt-0.5">{relative(tx.date)}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 text-[12.5px]">{tx.ingredientName}</p>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="chip !py-[2px] !px-1.5 !text-[10.5px] num !bg-indigo-500/10 !text-indigo-700 dark:!text-indigo-300 !border-indigo-500/20">
                              +{tx.quantity.toFixed(2)} {tx.unit}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-display num font-extrabold text-slate-900 dark:text-white">{fmtBDT(tx.estimatedTotalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
