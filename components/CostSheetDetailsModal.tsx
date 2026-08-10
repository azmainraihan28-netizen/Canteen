import React from 'react';
import { X, Calendar, Users, FileText, MapPin, Download, Hash, Info } from 'lucide-react';
import { DailyEntry, Ingredient } from '../types';

interface CostSheetDetailsModalProps {
  entry: DailyEntry;
  ingredients: Ingredient[];
  onClose: () => void;
}

const fmtBDT = (n: number, digits = 2) =>
  `৳${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const CostSheetDetailsModal: React.FC<CostSheetDetailsModalProps> = ({ entry, ingredients, onClose }) => {
  const detailedItems = entry.itemsConsumed.map((item) => {
    const ingredient = ingredients.find((i) => i.id === item.ingredientId);
    const effectiveRate = item.customRate ?? ingredient?.unitPrice ?? 0;
    return {
      ...item,
      name: ingredient ? ingredient.name : 'Unknown Item',
      unit: ingredient ? ingredient.unit : '-',
      rate: effectiveRate,
      amount: item.quantity * effectiveRate,
    };
  });

  const perHead = entry.participantCount > 0 ? entry.totalCost / entry.participantCount : 0;
  const calculatedTotal = detailedItems.reduce((s, i) => s + i.amount, 0);

  const handleExportCSV = () => {
    const rows: any[][] = [];
    rows.push(['Cost Sheet Details']);
    rows.push(['Date', entry.date]);
    rows.push(['Reference ID', entry.id]);
    rows.push(['Office', 'ACI Center Canteen']);
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total Participants', entry.participantCount]);
    rows.push(['Total Cost', entry.totalCost.toFixed(2)]);
    rows.push(['Per Head Cost', perHead.toFixed(2)]);
    rows.push(['Menu', `"${(entry.menuDescription || '').replace(/"/g, '""')}"`]);
    rows.push(['Stock Remarks', `"${(entry.stockRemarks || '').replace(/"/g, '""')}"`]);
    rows.push([]);
    rows.push(['SL', 'Item Name', 'Unit', 'Quantity', 'Rate', 'Amount', 'Remarks']);
    detailedItems.forEach((item, i) => {
      rows.push([i + 1, `"${item.name.replace(/"/g, '""')}"`, item.unit, item.quantity, item.rate.toFixed(2), item.amount.toFixed(2), `"${(item.remarks || '').replace(/"/g, '""')}"`]);
    });
    rows.push([]);
    rows.push(['', '', '', '', 'Calculated Total', calculatedTotal.toFixed(2)]);

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cost_Sheet_${entry.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = [
    { label: 'Date', value: entry.date, icon: Calendar, color: 'from-indigo-500/20 to-violet-500/5', ring: 'ring-indigo-500/20', text: 'text-indigo-500' },
    { label: 'Participants', value: entry.participantCount.toLocaleString(), icon: Users, color: 'from-violet-500/20 to-purple-500/5', ring: 'ring-violet-500/20', text: 'text-violet-500' },
    { label: 'Total cost', value: fmtBDT(entry.totalCost), icon: FileText, color: 'from-emerald-500/20 to-teal-500/5', ring: 'ring-emerald-500/20', text: 'text-emerald-500' },
    { label: 'Per head', value: fmtBDT(perHead), icon: Users, color: 'from-amber-500/20 to-orange-500/5', ring: 'ring-amber-500/20', text: 'text-amber-500' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in print:bg-white print:p-0">
      <div className="panel w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-scale print:max-h-none print:shadow-none print:border-none">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-200/60 dark:border-white/[0.06] flex justify-between items-start gap-4 bg-gradient-to-br from-slate-50/60 via-transparent to-transparent dark:from-white/[0.02]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="chip"><FileText size={11} /> Cost sheet</span>
              <span className="chip !py-[3px]"><Hash size={10} /><span className="num font-mono">{entry.id}</span></span>
            </div>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-gradient-mesh tracking-tight">
              {entry.date} · {entry.participantCount.toLocaleString()} participants
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition print:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summary.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="panel !p-3 !rounded-xl">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} ring-1 ${s.ring} ${s.text} flex items-center justify-center mb-2`}>
                    <Icon size={14} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{s.label}</p>
                  <p className="font-display num text-[16px] font-extrabold text-slate-900 dark:text-white mt-0.5">{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* Menu & office */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="panel !p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText size={11} /> Menu
              </p>
              <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
                {entry.menuDescription || <span className="text-slate-400 italic">No description</span>}
              </p>
            </div>
            <div className="panel !p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2 flex items-center gap-1.5">
                <MapPin size={11} /> Office
              </p>
              <p className="text-[13px] text-slate-700 dark:text-slate-200 font-medium">ACI Center Canteen (Head Office)</p>
            </div>
          </div>

          {/* Items breakdown */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">Consumed items</p>
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] text-left">
                  <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
                    <tr>
                      <th className="px-4 py-2.5 font-bold text-center w-10">#</th>
                      <th className="px-4 py-2.5 font-bold">Item</th>
                      <th className="px-4 py-2.5 font-bold text-center">Unit</th>
                      <th className="px-4 py-2.5 font-bold text-right">Qty</th>
                      <th className="px-4 py-2.5 font-bold text-right">Rate</th>
                      <th className="px-4 py-2.5 font-bold text-right">Amount</th>
                      <th className="px-4 py-2.5 font-bold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {detailedItems.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-center text-slate-400 num">{i + 1}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                        <td className="px-4 py-2.5 text-center text-slate-500 num">{item.unit}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-700 dark:text-slate-200 num">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500 num">{fmtBDT(item.rate)}</td>
                        <td className="px-4 py-2.5 text-right font-display num font-extrabold text-slate-900 dark:text-white">{fmtBDT(item.amount)}</td>
                        <td className="px-4 py-2.5 text-slate-500 italic text-[11.5px]">{item.remarks || '—'}</td>
                      </tr>
                    ))}
                    {detailedItems.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 italic text-[12.5px]">No detailed items recorded.</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5">
                      <td colSpan={5} className="px-4 py-3 text-right text-[10.5px] font-bold uppercase tracking-widest text-slate-500">Calculated total</td>
                      <td className="px-4 py-3 text-right font-display num text-[16px] font-extrabold text-gradient-brand">{fmtBDT(calculatedTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 text-right flex items-center gap-1 justify-end">
              <Info size={10} /> Rates use per-transaction price when set, otherwise master price.
            </p>
          </div>

          {/* Stock remarks */}
          {entry.stockRemarks && (
            <div className="panel !p-4 border-l-4 !border-l-amber-500">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300 mb-1">Stock remarks</p>
              <p className="text-[13px] text-slate-700 dark:text-slate-200">{entry.stockRemarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-200/60 dark:border-white/[0.06] flex justify-end gap-2 print:hidden">
          <button onClick={handleExportCSV} className="chip !py-2.5 !px-4 hover:!text-indigo-600 dark:hover:!text-indigo-300 transition">
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={onClose}
            className="relative px-5 py-2.5 rounded-xl font-semibold text-white text-[13px] overflow-hidden group shadow-lg shadow-indigo-500/30"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
