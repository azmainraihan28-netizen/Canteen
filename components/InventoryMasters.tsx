import React from 'react';
import { Office, Ingredient } from '../types';
import { Archive, MapPin, AlertCircle } from 'lucide-react';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
}

export const InventoryMasters: React.FC<InventoryMastersProps> = ({ offices, ingredients }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Ingredients & Stock Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Archive className="text-blue-500" size={20} />
              Ingredients & Stock Master
            </h3>
            <p className="text-sm text-slate-500">Manage unit prices and monitor current inventory levels.</p>
          </div>
          <button className="text-sm bg-white border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-600">
            + Add New Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-white border-b">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3">Unit Price</th>
                <th className="px-6 py-3">Current Stock</th>
                <th className="px-6 py-3">Min Threshold</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{ing.name}</td>
                  <td className="px-6 py-4 text-slate-500">{ing.unit}</td>
                  <td className="px-6 py-4">${ing.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 font-semibold">{ing.currentStock}</td>
                  <td className="px-6 py-4 text-slate-500">{ing.minStockThreshold}</td>
                  <td className="px-6 py-4 text-center">
                    {ing.currentStock <= ing.minStockThreshold ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle size={12} className="mr-1" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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

      {/* Offices Master Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-indigo-500" size={20} />
              Office Locations Master
            </h3>
            <p className="text-sm text-slate-500">List of all active canteen locations.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {offices.map(office => (
            <div key={office.id} className="flex items-center p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-4">
                {office.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{office.name}</h4>
                <p className="text-xs text-slate-500">{office.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
