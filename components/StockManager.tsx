import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Plus, Minus, Save, RefreshCw } from 'lucide-react';

interface StockManagerProps {
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract', supplier?: string) => void;
}

const SUPPLIER_OPTIONS = [
  "Local Market",
  "ACI Foods Limited (Rice Unit)",
  "ACI Foods Ltd.",
  "ACI Logistics Ltd.",
  "ACI Edible Oil ltd.",
  "ACI Pure Flour ltd.",
  "Md. Mostafa",
  "Shah Traders",
  "M/S Hasan Enterprise (Mehedi Hasan)",
  "Mr. Billal",
  "ACI E-Bazar( Salesman: Osman)"
];

export const StockManager: React.FC<StockManagerProps> = ({ ingredients, onUpdateStock }) => {
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'add' | 'subtract'>('add');
  
  // Supplier State
  const [supplierMode, setSupplierMode] = useState<'select' | 'custom'>('select');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [customSupplier, setCustomSupplier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !quantity) {
      alert("Please select an item and enter a quantity.");
      return;
    }
    
    // Parse quantity on submit
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    // Determine final supplier name
    let finalSupplier = '';
    if (supplierMode === 'select') {
        finalSupplier = selectedSupplier;
    } else {
        finalSupplier = customSupplier;
    }

    onUpdateStock(selectedId, qty, type, finalSupplier);
    
    // Reset form
    setQuantity('');
    setSelectedSupplier('');
    setCustomSupplier('');
    setSupplierMode('select');
    
    alert(`Stock ${type === 'add' ? 'added' : 'removed'} successfully.`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mb-8 transition-colors">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <RefreshCw size={20} className="text-blue-600 dark:text-blue-400"/> 
        Quick Stock Adjustment
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Select Ingredient</label>
            <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 font-medium py-2.5 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-200"
            >
                <option value="">-- Choose Item to Update --</option>
                {ingredients.map(i => (
                <option key={i.id} value={i.id}>
                    {i.name} (Current: {i.currentStock} {i.unit})
                </option>
                ))}
            </select>
            </div>
            
            <div className="w-full">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Quantity</label>
            <input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border-slate-600 bg-slate-700 text-white placeholder-slate-400 rounded-lg shadow-sm focus:border-blue-400 focus:ring-blue-400 py-2.5 font-bold"
            />
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Vendor / Supplier</label>
              
              {supplierMode === 'select' ? (
                  <select
                      value={selectedSupplier}
                      onChange={(e) => {
                          if (e.target.value === 'OTHER_CUSTOM') {
                              setSupplierMode('custom');
                              setCustomSupplier('');
                          } else {
                              setSelectedSupplier(e.target.value);
                          }
                      }}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 py-2.5 text-sm font-medium"
                  >
                      <option value="">-- Select Supplier --</option>
                      {SUPPLIER_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="OTHER_CUSTOM" className="font-bold text-blue-600">+ Add Custom...</option>
                  </select>
              ) : (
                  <div className="flex gap-2">
                      <input
                          type="text"
                          placeholder="Enter supplier name"
                          value={customSupplier}
                          onChange={(e) => setCustomSupplier(e.target.value)}
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 py-2.5 text-sm"
                          autoFocus
                      />
                      <button
                          type="button"
                          onClick={() => {
                              setSupplierMode('select');
                              setSelectedSupplier('');
                          }}
                          className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 rounded"
                      >
                          Cancel
                      </button>
                  </div>
              )}
            </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg shrink-0 w-full md:w-auto">
           <button
             type="button"
             onClick={() => setType('add')}
             className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
               type === 'add' 
                 ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm ring-1 ring-black/5' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
             }`}
           >
             <Plus size={16} /> Add
           </button>
           <button
             type="button"
             onClick={() => setType('subtract')}
             className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
               type === 'subtract' 
                 ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-black/5' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
             }`}
           >
             <Minus size={16} /> Remove
           </button>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/50 flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
        >
          <Save size={18} /> Update
        </button>
      </form>
    </div>
  );
};