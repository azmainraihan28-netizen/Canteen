import React from 'react';
import { Office, Ingredient } from '../types';
import { Archive, AlertCircle } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract') => void;
}

export const InventoryMasters: React.FC<InventoryMastersProps> = ({ offices, ingredients, onUpdateStock }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Stock Manager Component */}
      <StockManager ingredients={ingredients} onUpdateStock={onUpdateStock} />

      {/* Ingredients & Stock List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Archive className="text-blue-500" size={20} />
              Ingredients & Stock Master
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Monitor current inventory levels and unit prices.</p>
          </div>
          <button className="text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 font-medium transition-colors">
            + Add New Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-white dark:bg-slate-800 border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Min Threshold</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {ingredients.map((ing) => {
                const isLowStock = ing.currentStock <= ing.minStockThreshold;
                
                return (
                  <tr 
                    key={ing.id} 
                    className={`transition-colors border-b border-slate-50 dark:border-slate-700 ${
                      isLowStock 
                        ? 'bg-red-50/40 hover:bg-red-50/70 dark:bg-red-900/20 dark:hover:bg-red-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        {isLowStock && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
                        {ing.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{ing.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">৳{ing.unitPrice.toFixed(2)}</td>
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