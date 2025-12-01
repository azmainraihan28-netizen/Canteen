
import React from 'react';
import { X, Calendar, Users, DollarSign, FileText, MapPin, Download } from 'lucide-react';
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

  const handleExportCSV = () => {
    const csvRows = [];
    
    // Metadata Section
    csvRows.push(['Cost Sheet Details']);
    csvRows.push(['Date', entry.date]);
    csvRows.push(['Reference ID', entry.id]);
    csvRows.push(['Office', 'ACI Center Canteen (Head Office)']);
    csvRows.push([]);
    
    // Summary Section
    csvRows.push(['Summary']);
    csvRows.push(['Total Participants', entry.participantCount]);
    csvRows.push(['Total Cost', entry.totalCost.toFixed(2)]);
    csvRows.push(['Per Head Cost', perHead.toFixed(2)]);
    csvRows.push(['Menu Description', `"${(entry.menuDescription || '').replace(/"/g, '""')}"`]);
    csvRows.push(['Stock Remarks', `"${(entry.stockRemarks || '').replace(/"/g, '""')}"`]);
    csvRows.push([]);

    // Items Header
    csvRows.push(['SL', 'Item Name', 'Unit', 'Quantity', 'Rate', 'Amount', 'Remarks']);

    // Items Data
    detailedItems.forEach((item, index) => {
      csvRows.push([
        index + 1,
        `"${item.name.replace(/"/g, '""')}"`,
        item.unit,
        item.quantity,
        item.rate.toFixed(2),
        item.amount.toFixed(2),
        `"${(item.remarks || '').replace(/"/g, '""')}"`
      ]);
    });

    // Footer Total
    csvRows.push([]);
    csvRows.push(['', '', '', '', 'Calculated Total', detailedItems.reduce((sum, i) => sum + i.amount, 0).toFixed(2)]);

    // Generate CSV File
    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cost_Sheet_${entry.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800 print:bg-white print:border-b-2 print:border-slate-900">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 print:text-black">
              <FileText className="text-blue-600 dark:text-blue-400 print:text-black" />
              Cost Sheet Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 print:text-slate-600">
              Reference ID: <span className="font-mono">{entry.id}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors print:hidden"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar print:overflow-visible">
          
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1 print:text-slate-700">
                <Calendar size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Date</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">{entry.date}</p>
            </div>
            
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1 print:text-slate-700">
                <Users size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Participants</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">{entry.participantCount}</p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1 print:text-slate-700">
                <DollarSign size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Cost</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">
                ৳{entry.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

             <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1 print:text-slate-700">
                <div className="font-bold text-sm">৳/👤</div>
                <span className="text-xs font-bold uppercase tracking-wider">Per Head</span>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">
                ৳{perHead.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Menu & Office */}
          <div className="flex flex-col md:flex-row gap-6 print:flex-row">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 print:text-slate-600">Menu Description</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium print:bg-white print:border-slate-300 print:text-black">
                {entry.menuDescription || "No menu description provided."}
              </div>
            </div>
             <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 print:text-slate-600">Office Location</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2 print:bg-white print:border-slate-300 print:text-black">
                <MapPin size={18} className="text-slate-400" />
                ACI Center Canteen (Head Office)
              </div>
            </div>
          </div>

          {/* Detailed Items Table */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 print:text-slate-600">Consumed Items Breakdown</h4>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:border-slate-300">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold print:bg-slate-100 print:text-black">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-slate-200">
                  {detailedItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors print:text-black">
                      <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 print:text-black">{item.name}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.unit}</td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium print:text-black">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-500">৳{item.rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200 print:text-black">
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
                <tfoot className="bg-slate-50 dark:bg-slate-700/50 font-bold border-t border-slate-200 dark:border-slate-600 print:bg-slate-50 print:border-slate-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider print:text-slate-700">Total Calculated</td>
                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 print:text-black">
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
             <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-lg print:bg-white print:border-amber-400">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 print:text-amber-700">Stock Remarks</h4>
                <p className="text-slate-700 dark:text-slate-300 print:text-black">{entry.stockRemarks}</p>
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 print:hidden">
          <button 
            onClick={handleExportCSV}
            className="px-6 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
          >
            <Download size={18} />
            Export as CSV
          </button>
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
