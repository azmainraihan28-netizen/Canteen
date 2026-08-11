import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Save, Calendar, MapPin, Download, X, ClipboardList, Utensils, Users, Package, ChevronDown } from 'lucide-react';
import { Office, Ingredient, DailyEntry, ConsumptionItem } from '../types';
import { genId } from '../services/id';

interface DailyEntryFormProps {
  offices: Office[];
  ingredients: Ingredient[];
  onAddEntry: (entry: DailyEntry) => void;
}

interface ConsumptionItemInput {
  ingredientId: string;
  quantity: string;
  remarks: string;
  customRate: string;
}

const inputBase =
  'w-full bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] rounded-lg text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500/40 focus:bg-white dark:focus:bg-white/[0.06] transition placeholder:text-slate-400';

const fmtBDT = (n: number, digits = 2) =>
  `৳${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ offices, ingredients, onAddEntry }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(offices[0]?.id || '');
  const [menuDescription, setMenuDescription] = useState('');
  const [participants, setParticipants] = useState<number | ''>('');
  const [stockRemarks, setStockRemarks] = useState('');
  const [consumedItems, setConsumedItems] = useState<ConsumptionItemInput[]>([
    { ingredientId: '', quantity: '', remarks: '', customRate: '' },
  ]);

  const handleAddItemRow = () => setConsumedItems([...consumedItems, { ingredientId: '', quantity: '', remarks: '', customRate: '' }]);
  const handleRemoveItemRow = (index: number) => {
    const next = [...consumedItems];
    next.splice(index, 1);
    setConsumedItems(next);
  };

  const handleItemChange = (index: number, field: keyof ConsumptionItemInput, value: string) => {
    const next = [...consumedItems];
    next[index] = { ...next[index], [field]: value };
    if (field === 'ingredientId') {
      const ing = ingredients.find((i) => i.id === value);
      if (ing) next[index].customRate = ing.unitPrice.toString();
    }
    setConsumedItems(next);
  };

  const totalCost = useMemo(
    () =>
      consumedItems.reduce((total, item) => {
        const masterPrice = ingredients.find((i) => i.id === item.ingredientId)?.unitPrice ?? 0;
        const rate = item.customRate !== '' ? parseFloat(item.customRate) : masterPrice;
        const qty = parseFloat(item.quantity) || 0;
        return total + rate * qty;
      }, 0),
    [consumedItems, ingredients]
  );

  const perPersonCost = participants ? totalCost / Number(participants) : 0;
  const selectedOfficeName = offices.find((o) => o.id === selectedOfficeId)?.name || 'Unknown';
  const validItemsCount = consumedItems.filter((i) => i.ingredientId && parseFloat(i.quantity) > 0).length;

  const handleExportCSV = () => {
    const rows: any[][] = [];
    rows.push(['Cost Sheet Details']);
    rows.push(['Date', date]);
    rows.push(['Office', selectedOfficeName]);
    rows.push(['Menu', `"${menuDescription.replace(/"/g, '""')}"`]);
    rows.push(['Stock Remarks', `"${stockRemarks.replace(/"/g, '""')}"`]);
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total Cost', totalCost.toFixed(2)]);
    rows.push(['Total Participants', participants]);
    rows.push(['Per Person Cost', perPersonCost.toFixed(2)]);
    rows.push([]);
    rows.push(['SL', 'Item Name', 'Unit', 'Quantity', 'Rate', 'Amount', 'Remarks']);
    consumedItems.forEach((item, i) => {
      const ing = ingredients.find((x) => x.id === item.ingredientId);
      const name = ing?.name || '';
      const unit = ing?.unit || '';
      const rate = item.customRate !== '' ? parseFloat(item.customRate) : ing?.unitPrice ?? 0;
      const qty = parseFloat(item.quantity) || 0;
      const amount = rate * qty;
      rows.push([i + 1, `"${name.replace(/"/g, '""')}"`, unit, qty, rate.toFixed(2), amount.toFixed(2), `"${(item.remarks || '').replace(/"/g, '""')}"`]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ACI_Cost_Sheet_${selectedOfficeName.replace(/\s+/g, '_')}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participants) return alert('Enter participant count.');
    const valid: ConsumptionItem[] = consumedItems
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: parseFloat(i.quantity) || 0,
        remarks: i.remarks,
        customRate: i.customRate !== '' ? parseFloat(i.customRate) : undefined,
      }))
      .filter((i) => i.ingredientId && i.quantity > 0);
    if (valid.length === 0) return alert('Add at least one item with quantity.');
    onAddEntry({
      id: genId(),
      date, officeId: selectedOfficeId,
      participantCount: Number(participants),
      itemsConsumed: valid,
      totalCost: Number(totalCost.toFixed(2)),
      menuDescription, stockRemarks,
    });
    setMenuDescription(''); setParticipants(''); setStockRemarks('');
    setConsumedItems([{ ingredientId: '', quantity: '', remarks: '', customRate: '' }]);
    alert('Cost sheet saved.');
  };

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <span className="chip mb-2"><ClipboardList size={11} /> New entry</span>
        <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">Daily cost sheet</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Log ingredients consumed and total participants for the day</p>
      </div>

      {/* Meta panel */}
      <div className="panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Calendar size={11} /> Date
          </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputBase} px-3 py-2.5 num font-semibold cursor-pointer`} />
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5 flex items-center gap-1.5">
            <MapPin size={11} /> Office
          </label>
          <div className="relative">
            <select value={selectedOfficeId} onChange={(e) => setSelectedOfficeId(e.target.value)} className={`${inputBase} px-3 py-2.5 pr-9 appearance-none font-medium cursor-pointer`}>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Users size={11} /> Participants
          </label>
          <input type="number" min="1" value={participants} onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className={`${inputBase} px-3 py-2.5 num font-bold text-lg`} />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Utensils size={11} /> Menu description
          </label>
          <textarea
            value={menuDescription}
            onChange={(e) => setMenuDescription(e.target.value)}
            placeholder="e.g. Miniket Rice · Rui Fish · Mix Vegetable · Salad"
            rows={2}
            className={`${inputBase} px-3 py-2.5 resize-y min-h-[42px]`}
          />
        </div>
      </div>

      {/* Items panel */}
      <div className="panel overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/5 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Package size={16} />
            </div>
            <div>
              <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white">Consumed items</h3>
              <p className="text-[11.5px] text-slate-500">
                <span className="num">{validItemsCount}</span> of <span className="num">{consumedItems.length}</span> rows valid
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItemRow}
            className="chip !py-2 !px-3 hover:!text-indigo-600 dark:hover:!text-indigo-300 !bg-indigo-500/10 !text-indigo-700 dark:!text-indigo-300 !border-indigo-500/20 transition"
          >
            <Plus size={13} /> Add row
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[900px]">
            <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 font-bold w-10 text-center">#</th>
                <th className="px-4 py-3 font-bold">Item</th>
                <th className="px-4 py-3 font-bold text-center w-20">Unit</th>
                <th className="px-4 py-3 font-bold text-center w-28">Qty</th>
                <th className="px-4 py-3 font-bold text-right w-28">Rate</th>
                <th className="px-4 py-3 font-bold text-right w-32">Amount</th>
                <th className="px-4 py-3 font-bold w-48">Remarks</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {consumedItems.map((item, index) => {
                const ing = ingredients.find((i) => i.id === item.ingredientId);
                const rate = item.customRate !== '' ? parseFloat(item.customRate) : ing?.unitPrice ?? 0;
                const qty = parseFloat(item.quantity) || 0;
                const amount = rate * qty;
                const isVegMixed = ing?.name === 'Vegetable (Mixed)';
                return (
                  <tr key={index} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-2.5 text-center num text-slate-400">{index + 1}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={item.ingredientId}
                        onChange={(e) => handleItemChange(index, 'ingredientId', e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-0 focus:border-indigo-500 text-slate-800 dark:text-slate-200 p-0 font-medium text-[13px] outline-none [&>option]:bg-white dark:[&>option]:bg-slate-900"
                      >
                        <option value="" disabled>Select item…</option>
                        {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-500 num text-[12px]">{ing?.unit || '—'}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number" min="0" step="0.001" placeholder="0.000"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className={`${inputBase} px-2 py-1.5 num text-center`}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isVegMixed ? (
                        <input
                          type="number" min="0" step="0.01"
                          value={item.customRate}
                          onChange={(e) => handleItemChange(index, 'customRate', e.target.value)}
                          className={`${inputBase} px-2 py-1.5 num text-right font-semibold`}
                        />
                      ) : (
                        <span className="text-slate-500 num text-[12.5px]">{ing ? fmtBDT(rate) : '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-display num font-extrabold text-slate-900 dark:text-white">
                      {amount > 0 ? fmtBDT(amount) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text" value={item.remarks}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-0 text-slate-600 dark:text-slate-300 p-0 text-[12px] outline-none placeholder:text-slate-400"
                        placeholder="Optional…"
                      />
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        tabIndex={-1}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {consumedItems.map((item, index) => {
            const ing = ingredients.find((i) => i.id === item.ingredientId);
            const rate = item.customRate !== '' ? parseFloat(item.customRate) : ing?.unitPrice ?? 0;
            const qty = parseFloat(item.quantity) || 0;
            const amount = rate * qty;
            const isVegMixed = ing?.name === 'Vegetable (Mixed)';
            return (
              <div key={index} className="panel !p-4 !rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="chip !text-[10.5px] num">#{index + 1}</span>
                  <button type="button" onClick={() => handleRemoveItemRow(index)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md">
                    <X size={14} />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ingredient</label>
                  <select value={item.ingredientId} onChange={(e) => handleItemChange(index, 'ingredientId', e.target.value)} className={`${inputBase} px-2.5 py-2 font-medium`}>
                    <option value="" disabled>Select…</option>
                    {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Qty ({ing?.unit || '—'})</label>
                    <input type="number" min="0" step="0.001" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className={`${inputBase} px-2.5 py-2 num text-center font-bold`} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Rate</label>
                    {isVegMixed ? (
                      <input type="number" min="0" step="0.01" value={item.customRate} onChange={(e) => handleItemChange(index, 'customRate', e.target.value)} className={`${inputBase} px-2.5 py-2 num text-right font-bold`} />
                    ) : (
                      <div className={`${inputBase} px-2.5 py-2 num text-right text-slate-500`}>{ing ? fmtBDT(rate) : '—'}</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Amount</span>
                  <span className="font-display num text-lg font-extrabold text-gradient-brand">{amount > 0 ? fmtBDT(amount) : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add row button footer */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/[0.06] flex justify-center">
          <button
            type="button" onClick={handleAddItemRow}
            className="text-[12.5px] font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Add new item row
          </button>
        </div>
      </div>

      {/* Stock remarks */}
      <div className="panel !p-4 border-l-4 !border-l-amber-500">
        <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300 mb-1.5">Stock remarks</label>
        <input
          type="text" value={stockRemarks}
          onChange={(e) => setStockRemarks(e.target.value)}
          placeholder="e.g. Egg 45 pcs, Oil 2L remaining"
          className="w-full bg-transparent border-0 border-b border-amber-500/30 focus:border-amber-500 focus:ring-0 text-slate-800 dark:text-slate-200 text-[14px] placeholder:text-slate-400 font-medium outline-none px-0 py-1.5"
        />
      </div>

      {/* Sticky bottom summary bar */}
      <div className="fixed bottom-0 left-0 md:left-[248px] right-0 z-40 px-4 md:px-8 py-4 glass border-t border-slate-200/60 dark:border-white/[0.06] shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.15)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Total cost</p>
              <p className="font-display num text-xl md:text-2xl font-extrabold text-gradient-brand">{fmtBDT(totalCost)}</p>
            </div>
            <span className="w-px h-8 bg-slate-200 dark:bg-white/[0.08] hidden sm:block" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Per person</p>
              <p className="font-display num text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">{fmtBDT(perPersonCost)}</p>
            </div>
            <span className="w-px h-8 bg-slate-200 dark:bg-white/[0.08] hidden md:block" />
            <div className="hidden md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Items</p>
              <p className="font-display num text-xl font-extrabold text-slate-900 dark:text-white">{validItemsCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={handleExportCSV} className="chip !py-2.5 !px-3 hover:!text-indigo-600 dark:hover:!text-indigo-300 transition">
              <Download size={13} /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setConsumedItems([{ ingredientId: '', quantity: '', remarks: '', customRate: '' }]);
                setMenuDescription(''); setStockRemarks(''); setParticipants('');
              }}
              className="chip !py-2.5 !px-3"
            >
              Clear
            </button>
            <button
              type="button" onClick={handleSubmit}
              className="relative px-5 py-2.5 rounded-xl font-semibold text-white text-[13px] overflow-hidden group shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
              <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2"><Save size={14} /> Save cost sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
