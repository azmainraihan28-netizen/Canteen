import React, { useState } from 'react';
import { Office, Ingredient, UserRole } from '../types';
import { Archive, AlertCircle, Eye, CheckSquare, Square, Layers, X, Download } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract') => void;
  userRole: UserRole;
}

export const InventoryMasters: React.FC<InventoryMastersProps> = ({ offices, ingredients, onUpdateStock, userRole }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkQuantity, setBulkQuantity] = useState<string>('');
  const [bulkType, setBulkType] = useState<'add' | 'subtract'>('add');

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === ingredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ingredients.map(i => i.id));
    }
  };

  const handleBulkUpdate = () => {
    const qty = Number(bulkQuantity);
    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const confirmMessage = `Are you sure you want to ${bulkType === 'add' ? 'ADD' : 'REMOVE'} ${qty} ${selectedIds.length === 1 ? 'unit' : 'units'} for ${selectedIds.length} selected items?`;

    if (window.confirm(confirmMessage)) {
      selectedIds.forEach(id => {
        onUpdateStock(id, qty, bulkType);
      });
      setSelectedIds([]);
      setBulkQuantity('');
      alert("Bulk update completed successfully.");
    }
  };

  const handleExportCSV = () => {
    if (ingredients.length === 0) {
      alert("No inventory data to export.");
      return;
    }

    const headers = ["Item Name", "Unit", "Last Updated", "Current Stock", "Min Threshold", "Status"];

    const csvRows = ingredients.map(ing => {
      const lastUpdated = ing.lastUpdated ? new Date(ing.lastUpdated).toLocaleString() : '-';
      const status = ing.currentStock <= ing.minStockThreshold ? 'Low Stock' : 'In Stock';
      return [
        `"${ing.name.replace(/"/g, '""')}"`,
        ing.unit,
        `"${lastUpdated}"`,
        ing.currentStock,
        ing.minStockThreshold,
        status
      ].join(",");
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Stock Manager Component (Only for ADMIN) */}
      {userRole === 'ADMIN' ? (
        <StockManager ingredients={ingredients} onUpdateStock={onUpdateStock} />
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl flex items-center gap-3 text-blue-700 dark:text-blue-300 shadow-md border-slate-200">
           <Eye size={20} />
           <p className="font-medium">You are in Viewer Mode. Stock adjustments are disabled.</p>
        </div>
      )}

      {/* Bulk Action Bar (Contextual) */}
      {selectedIds.length > 0 && userRole === 'ADMIN' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 dark:text-indigo-100">{selectedIds.length} Items Selected</h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-300">Apply uniform update</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-900/50 p-1">
              <button
                onClick={() => setBulkType('add')}
                className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${bulkType === 'add' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                Add
              </button>
              <button
                onClick={() => setBulkType('subtract')}
                className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${bulkType === 'subtract' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'text-slate-500 hover:text-red-600'}`}
              >
                Remove
              </button>
            </div>
            
            <input 
              type="number" 
              min="0.001"
              step="0.001"
              placeholder="Qty"
              value={bulkQuantity}
              onChange={(e) => setBulkQuantity(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            
            <button 
              onClick={handleBulkUpdate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors whitespace-nowrap"
            >
              Apply
            </button>
            
            <button 
              onClick={() => setSelectedIds([])}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear Selection"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Ingredients & Stock List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Archive className="text-blue-500" size={20} />
              Ingredients & Stock Master
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Monitor current inventory levels and unit prices.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-medium transition-colors w-full md:w-auto"
            >
              <Download size={16} />
              Export CSV
            </button>
            {userRole === 'ADMIN' && (
              <button className="text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-medium transition-colors whitespace-nowrap w-full md:w-auto">
                + Add New Item
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-white dark:bg-slate-800 border-b dark:border-slate-700">
              <tr>
                {userRole === 'ADMIN' && (
                  <th className="px-6 py-3 w-10">
                    <button 
                      onClick={handleSelectAll} 
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedIds.length === ingredients.length && ingredients.length > 0 ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3 text-right">Last Updated</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Min Threshold</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {ingredients.map((ing) => {
                const isLowStock = ing.currentStock <= ing.minStockThreshold;
                const lastUpdatedDate = ing.lastUpdated 
                  ? new Date(ing.lastUpdated).toLocaleDateString() + ' ' + new Date(ing.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-';
                const isSelected = selectedIds.includes(ing.id);
                
                return (
                  <tr 
                    key={ing.id} 
                    className={`transition-colors border-b border-slate-50 dark:border-slate-700 ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 
                      isLowStock 
                        ? 'bg-red-50/40 hover:bg-red-50/70 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {userRole === 'ADMIN' && (
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleSelect(ing.id)} 
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-blue-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        {isLowStock && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
                        {ing.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{ing.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {lastUpdatedDate}
                    </td>
                    <td className={`px-6 py-4 font-bold text-right ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {ing.currentStock}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">{ing.minStockThreshold}</td>
                    <td className="px-6 py-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};