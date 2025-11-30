import React from 'react';
import { X, Calendar, Users, DollarSign, FileText, MapPin } from 'lucide-react';
import { DailyEntry, Ingredient } from '../types';

interface CostSheetDetailsModalProps {
  entry: DailyEntry;
  ingredients: Ingredient[];
  onClose: () => void;
}

export const CostSheetDetailsModal: React.FC<CostSheetDetailsModalProps> = ({ entry, ingredients, onClose }) => {
  // Reconstruct the detailed list by matching ingredient IDs
  const detailedItems = entry.itemsConsumed.map((item) => {
    const ingredient = ingredients.find((i) => i.id === item.ingredientId);
    return {
      ...item,
      name: ingredient ? ingredient.name : 'Unknown Item',
      unit: ingredient ? ingredient.unit : '-',
      // Use the calculated rate if available (implied), otherwise use current master price (approximate if historical prices aren't versioned)
      // Ideally, historical entries should store the snapshot price, but for now we look up master or calculate from total if logic allowed.
      // Since current data model doesn't store snapshot price in itemsConsumed, we use current master price as reference
      rate: ingredient ? ingredient.unitPrice : 0,
      amount: ingredient ? item.quantity * ingredient.unitPrice : 0
    };
  });

  const perHead = entry.participantCount > 0 ? entry.totalCost / entry.participantCount : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-blue-600 dark:text-blue-400" />
              Cost Sheet Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Reference ID: <span className="font-mono">{entry.id}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Date</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{entry.date}</p>
            </div>
            
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
                <Users size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Participants</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{entry.participantCount}</p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <DollarSign size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Cost</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                ৳{entry.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

             <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <div className="font-bold text-sm">৳/👤</div>
                <span className="text-xs font-bold uppercase tracking-wider">Per Head</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                ৳{perHead.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Menu & Office */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Menu Description</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium">
                {entry.menuDescription || "No menu description provided."}
              </div>
            </div>
             <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Office Location</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2">
                <MapPin size={18} className="text-slate-400" />
                ACI Center Canteen (Head Office)
              </div>
            </div>
          </div>

          {/* Detailed Items Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Consumed Items Breakdown</h4>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3 text-center">Unit</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Rate (Current)</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 w-1/4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {detailedItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.unit}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-500">৳{item.rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        ৳{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-slate-500 italic text-xs">{item.remarks || '-'}</td>
                    </tr>
                  ))}
                  {detailedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">No detailed items recorded.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700/50 font-bold border-t border-slate-200 dark:border-slate-600">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">Total Calculated</td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                      ৳{detailedItems.reduce((sum, i) => sum + i.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400 text-right">* Rates displayed are current master rates. Historical totals are preserved in summary.</p>
          </div>

          {/* Stock Remarks */}
          {entry.stockRemarks && (
             <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Stock Remarks</h4>
                <p className="text-slate-700 dark:text-slate-300">{entry.stockRemarks}</p>
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};