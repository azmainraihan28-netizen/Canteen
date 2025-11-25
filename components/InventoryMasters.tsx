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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Archive className="text-blue-500" size={20} />
              Ingredients & Stock Master
            </h3>
            <p className="text-sm text-slate-500">Monitor current inventory levels and unit prices.</p>
          </div>
          <button className="text-sm bg-white border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-600 font-medium">
            + Add New Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Min Threshold</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{ing.name}</td>
                  <td className="px-6 py-4 text-slate-500">{ing.unit}</td>
                  <td className="px-6 py-4 text-right">৳{ing.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-right text-slate-700">{ing.currentStock}</td>
                  <td className="px-6 py-4 text-right text-slate-500">{ing.minStockThreshold}</td>
                  <td className="px-6 py-4 text-center">
                    {ing.currentStock <= ing.minStockThreshold ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                        <AlertCircle size={12} className="mr-1" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
