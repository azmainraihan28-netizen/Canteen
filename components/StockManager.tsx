import React, { useState } from 'react';
import { Ingredient } from '../types';
import { Plus, Minus, Save, RefreshCw, Calendar, ChevronDown, Package, Truck } from 'lucide-react';

interface StockManagerProps {
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract', supplier?: string, date?: string) => void;
}

const SUPPLIER_OPTIONS = [
  'Local Market',
  'ACI Foods Limited (Rice Unit)',
  'ACI Foods Ltd.',
  'ACI Logistics Ltd.',
  'ACI Edible Oil ltd.',
  'ACI Pure Flour ltd.',
  'Md. Mostafa',
  'Shah Traders',
  'Shahria Sagor Enterprise',
  'M/S Hasan Enterprise (Mehedi Hasan)',
  'M/S Muktar Enterprise',
  'Mr. Billal',
  'ACI E-Bazar( Salesman: Osman)',
];

export const StockManager: React.FC<StockManagerProps> = ({ ingredients, onUpdateStock }) => {
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierMode, setSupplierMode] = useState<'select' | 'custom'>('select');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [customSupplier, setCustomSupplier] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !quantity) {
      alert('Please select an item and enter a quantity.');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    const finalSupplier = supplierMode === 'select' ? selectedSupplier : customSupplier;
    onUpdateStock(selectedId, qty, type, finalSupplier, adjustmentDate);
    setQuantity('');
    setSelectedSupplier('');
    setCustomSupplier('');
    setSupplierMode('select');
    alert(`Stock ${type === 'add' ? 'added' : 'removed'} successfully.`);
  };

  const inputBase =
    'w-full bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] rounded-lg text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500/40 focus:bg-white dark:focus:bg-white/[0.06] transition placeholder:text-slate-400';

  return (
    <div className="panel p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
            <RefreshCw size={16} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Quick stock adjustment</h3>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Log purchases or subtract consumption in one shot</p>
          </div>
        </div>
        <span className="chip hidden md:inline-flex">
          <Package size={11} /> <span className="num">{ingredients.length}</span> items
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        {/* Date */}
        <div className="lg:col-span-2">
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Date</label>
          <div className="relative">
            <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={adjustmentDate}
              onChange={(e) => setAdjustmentDate(e.target.value)}
              className={`${inputBase} pl-8 pr-2 py-2.5 num`}
            />
          </div>
        </div>

        {/* Ingredient */}
        <div className="lg:col-span-4">
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Ingredient</label>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`${inputBase} appearance-none pl-3 pr-8 py-2.5 font-medium cursor-pointer`}
            >
              <option value="">— Choose ingredient —</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.currentStock.toFixed(2)} {i.unit}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Quantity */}
        <div className="lg:col-span-2">
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Quantity</label>
          <input
            type="number"
            min="0"
            step="0.001"
            placeholder="0.000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={`${inputBase} px-3 py-2.5 num font-semibold text-center`}
          />
        </div>

        {/* Supplier */}
        <div className="lg:col-span-4">
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Truck size={11} /> Supplier
          </label>
          {supplierMode === 'select' ? (
            <div className="relative">
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
                className={`${inputBase} appearance-none pl-3 pr-8 py-2.5 cursor-pointer`}
              >
                <option value="">— Select supplier —</option>
                {SUPPLIER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="OTHER_CUSTOM">+ Custom name…</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Custom supplier name"
                value={customSupplier}
                onChange={(e) => setCustomSupplier(e.target.value)}
                className={`${inputBase} px-3 py-2.5 flex-1`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setSupplierMode('select');
                  setSelectedSupplier('');
                }}
                className="chip !py-2 !px-3"
              >
                Back
              </button>
            </div>
          )}
        </div>

        {/* Add/Subtract toggle + submit */}
        <div className="lg:col-span-8 flex items-center gap-2">
          <div className="panel !rounded-xl !p-1 flex items-center">
            <button
              type="button"
              onClick={() => setType('add')}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-all flex items-center gap-1.5 ${
                type === 'add'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Plus size={14} /> Add stock
            </button>
            <button
              type="button"
              onClick={() => setType('subtract')}
              className={`px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-all flex items-center gap-1.5 ${
                type === 'subtract'
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Minus size={14} /> Remove
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex justify-end">
          <button
            type="submit"
            className="relative w-full lg:w-auto px-6 py-2.5 rounded-xl font-semibold text-white text-[13px] overflow-hidden group transition active:scale-[0.98] shadow-lg shadow-indigo-500/30"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center justify-center gap-2">
              <Save size={14} /> Save update
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
