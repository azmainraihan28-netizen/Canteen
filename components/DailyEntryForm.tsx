import React, { useState } from 'react';
import { Plus, Trash2, Save, Calendar, MapPin, Download } from 'lucide-react';
import { Office, Ingredient, DailyEntry, ConsumptionItem } from '../types';

interface DailyEntryFormProps {
  offices: Office[];
  ingredients: Ingredient[];
  onAddEntry: (entry: DailyEntry) => void;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ offices, ingredients, onAddEntry }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [menuDescription, setMenuDescription] = useState('');
  const [participants, setParticipants] = useState<number | ''>('');
  const [stockRemarks, setStockRemarks] = useState('');
  
  // Local state for the items being added
  const [consumedItems, setConsumedItems] = useState<ConsumptionItem[]>([
    { ingredientId: '', quantity: 0, remarks: '' }
  ]);

  const handleAddItemRow = () => {
    setConsumedItems([...consumedItems, { ingredientId: '', quantity: 0, remarks: '' }]);
  };

  const handleRemoveItemRow = (index: number) => {
    const newItems = [...consumedItems];
    newItems.splice(index, 1);
    setConsumedItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof ConsumptionItem, value: string | number) => {
    const newItems = [...consumedItems];
    // @ts-ignore
    newItems[index][field] = value;
    setConsumedItems(newItems);
  };

  const calculateTotalCost = () => {
    return consumedItems.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return total + (ing ? ing.unitPrice * Number(item.quantity) : 0);
    }, 0);
  };

  const totalCost = calculateTotalCost();
  const perPersonCost = participants ? totalCost / Number(participants) : 0;

  const handleExportCSV = () => {
    const csvRows = [];
    
    // Metadata
    csvRows.push(['Cost Sheet Details']);
    csvRows.push(['Date', date]);
    csvRows.push(['Office', 'ACI Center Canteen (Head Office)']);
    csvRows.push(['Menu', `"${menuDescription.replace(/"/g, '""')}"`]);
    csvRows.push(['Stock Remarks', `"${stockRemarks.replace(/"/g, '""')}"`]);
    csvRows.push([]);

    // Summary
    csvRows.push(['Summary']);
    csvRows.push(['Total Cost', totalCost.toFixed(2)]);
    csvRows.push(['Total Participants', participants]);
    csvRows.push(['Per Person Cost', perPersonCost.toFixed(2)]);
    csvRows.push([]);

    // Items Header
    csvRows.push(['SL', 'Item Name', 'Unit', 'Quantity', 'Rate', 'Amount', 'Remarks']);

    // Items Data
    consumedItems.forEach((item, index) => {
      const selectedIng = ingredients.find(i => i.id === item.ingredientId);
      const itemName = selectedIng ? selectedIng.name : '';
      const unit = selectedIng ? selectedIng.unit : '';
      const rate = selectedIng ? selectedIng.unitPrice.toFixed(2) : '0.00';
      const amount = selectedIng ? (selectedIng.unitPrice * item.quantity).toFixed(2) : '0.00';
      const remarks = item.remarks || '';

      csvRows.push([
        index + 1,
        `"${itemName.replace(/"/g, '""')}"`,
        unit,
        item.quantity || 0,
        rate,
        amount,
        `"${remarks.replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ACI_Canteen_Cost_Sheet_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participants) {
      alert("Please enter participant count.");
      return;
    }

    // Filter out empty rows
    const validItems = consumedItems.filter(item => item.ingredientId && item.quantity > 0);
    
    if (validItems.length === 0) {
      alert("Please add at least one item with quantity.");
      return;
    }

    const newEntry: DailyEntry = {
      id: `${Date.now()}`,
      date,
      officeId: offices[0].id, // Default to the single canteen
      participantCount: Number(participants),
      itemsConsumed: validItems,
      totalCost: Number(totalCost.toFixed(2)),
      menuDescription,
      stockRemarks
    };
    onAddEntry(newEntry);
    
    // Reset form
    setMenuDescription('');
    setParticipants('');
    setStockRemarks('');
    setConsumedItems([{ ingredientId: '', quantity: 0, remarks: '' }]);
    alert("Cost Sheet Saved Successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-10">
      <div className="bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden print:shadow-none print:border-none transition-colors">
        
        {/* Header Section */}
        <div className="border-b border-slate-300 dark:border-slate-600">
          <div className="py-4 text-center border-b border-slate-200 dark:border-slate-600">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wide">Cost Sheet</h1>
          </div>
          
          {/* Menu Bar (Light Blue) */}
          <div className="bg-cyan-50 dark:bg-cyan-900/30 px-4 md:px-8 py-3 border-b border-slate-200 dark:border-slate-600 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 transition-colors">
            <label htmlFor="menuInput" className="font-bold text-slate-700 dark:text-slate-300 underline shrink-0 cursor-pointer">Menu:</label>
            <input 
              id="menuInput"
              type="text" 
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              placeholder="e.g., 1. Miniket Rice 2. Rui Fish 3. Mix Vegetable..."
              className="w-full bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 font-medium shadow-sm transition-all"
            />
          </div>

          <div className="py-3 text-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
            <h2 className="text-sm md:text-lg font-bold text-slate-800 dark:text-slate-200">ACI Center Staff Canteen 2025</h2>
          </div>

          {/* Date & Location Row */}
          <div className="flex flex-col md:flex-row border-b border-slate-200 dark:border-slate-600 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-600">
            <div className="flex-1 p-4 flex items-center gap-3">
              <Calendar className="text-slate-500 dark:text-slate-400" size={18} />
              <label className="font-bold text-slate-700 dark:text-slate-300 w-16">Date:</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker?.();
                  } catch (error) {
                    // Fallback or ignore if not supported
                  }
                }}
                className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              />
            </div>
            <div className="flex-1 p-4 flex items-center gap-3">
              <MapPin className="text-slate-500 dark:text-slate-400" size={18} />
              <label className="font-bold text-slate-700 dark:text-slate-300 w-16">Office:</label>
              <div className="flex-1 text-slate-900 dark:text-white font-medium p-2 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-sm md:text-base">
                ACI Center Canteen (Head Office)
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase bg-slate-200 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 w-12 text-center border-r border-slate-300 dark:border-slate-600">SL</th>
                  <th className="px-4 py-3 border-r border-slate-300 dark:border-slate-600">Items</th>
                  <th className="px-4 py-3 w-24 text-center border-r border-slate-300 dark:border-slate-600">Unit</th>
                  <th className="px-4 py-3 w-32 text-center border-r border-slate-300 dark:border-slate-600">Quantity</th>
                  <th className="px-4 py-3 w-32 text-right border-r border-slate-300 dark:border-slate-600">Rate (৳)</th>
                  <th className="px-4 py-3 w-32 text-right border-r border-slate-300 dark:border-slate-600">Amount (৳)</th>
                  <th className="px-4 py-3 w-48 border-r border-slate-300 dark:border-slate-600">Remarks</th>
                  <th className="px-2 py-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {consumedItems.map((item, index) => {
                  const selectedIng = ingredients.find(i => i.id === item.ingredientId);
                  const amount = selectedIng ? (selectedIng.unitPrice * item.quantity) : 0;

                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-2 text-center border-r border-slate-200 dark:border-slate-600 font-medium text-slate-500 dark:text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-600">
                        <select 
                          value={item.ingredientId}
                          onChange={e => handleItemChange(index, 'ingredientId', e.target.value)}
                          className="w-full border-0 bg-transparent focus:ring-0 text-slate-800 dark:text-slate-200 p-0 font-medium cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-slate-200"
                        >
                          <option value="" disabled>Select Item...</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center border-r border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                        {selectedIng?.unit || '-'}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-600">
                        <input 
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder="0.000"
                          value={item.quantity || ''}
                          onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center border border-slate-200 dark:border-slate-600 rounded px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                        {selectedIng ? `৳${selectedIng.unitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-right border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-200">
                        {amount > 0 ? `৳${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-600">
                         <textarea 
                          value={item.remarks || ''}
                          onChange={e => handleItemChange(index, 'remarks', e.target.value)}
                          className="w-full border-0 bg-transparent focus:ring-0 text-slate-600 dark:text-slate-300 p-0 text-sm resize-y min-h-[30px]"
                          placeholder="..."
                          rows={1}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItemRow(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          tabIndex={-1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-t border-b border-slate-200 dark:border-slate-600 flex justify-center">
            <button 
              type="button" 
              onClick={handleAddItemRow}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded transition-colors"
            >
              <Plus size={18} /> Add New Item Row
            </button>
          </div>

          {/* Footer Summary Section */}
          <div className="bg-white dark:bg-slate-800 transition-colors">
            <div className="flex flex-col items-end">
              {/* Total Costing */}
              <div className="w-full md:w-1/3 flex flex-row border-b border-slate-200 dark:border-slate-600">
                <div className="flex-1 py-3 px-4 md:px-6 text-right font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border-l border-slate-200 dark:border-slate-600 text-sm md:text-base">
                  Total Costing
                </div>
                <div className="flex-1 py-3 px-4 md:px-6 text-right font-bold text-slate-900 dark:text-white text-sm md:text-base">
                  ৳{totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>

              {/* Total Participant */}
              <div className="w-full md:w-1/3 flex flex-row border-b border-slate-200 dark:border-slate-600">
                <div className="flex-1 py-3 px-4 md:px-6 text-right font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border-l border-slate-200 dark:border-slate-600 text-sm md:text-base">
                  Total Participant
                </div>
                <div className="flex-1 py-2 px-4 md:px-6 text-right">
                  <input 
                    type="number"
                    min="1"
                    value={participants}
                    onChange={e => setParticipants(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full md:w-24 bg-white dark:bg-slate-900 text-right font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Per Person Costing */}
              <div className="w-full md:w-1/3 flex flex-row border-b border-slate-200 dark:border-slate-600">
                <div className="flex-1 py-3 px-4 md:px-6 text-right font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border-l border-slate-200 dark:border-slate-600 text-sm md:text-base">
                  Per Person Costing
                </div>
                <div className="flex-1 py-3 px-4 md:px-6 text-right font-bold text-blue-700 dark:text-blue-400 text-base md:text-lg">
                  ৳{perPersonCost.toFixed(2)}
                </div>
              </div>
            </div>
            
            {/* Stock / Bottom Note (Cyan Background) */}
            <div className="bg-cyan-50 dark:bg-cyan-900/30 border-t border-slate-200 dark:border-slate-600 p-4 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 transition-colors">
              <span className="font-bold text-lg md:text-xl text-slate-800 dark:text-slate-200 shrink-0">Stock:</span>
              <input 
                type="text" 
                value={stockRemarks}
                onChange={e => setStockRemarks(e.target.value)}
                placeholder="e.g. Egg 45 Pcs, Oil 2 Liters..."
                className="w-full bg-transparent border-b border-slate-400 dark:border-slate-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-0 text-slate-800 dark:text-slate-200 text-base md:text-lg placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800 flex flex-col md:flex-row justify-end gap-4 border-t border-slate-200 dark:border-slate-600 rounded-b-lg">
            <button 
              type="button"
              onClick={handleExportCSV}
              className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export to CSV
            </button>
             <button 
              type="button"
              className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 transition-colors"
              onClick={() => {
                setConsumedItems([{ ingredientId: '', quantity: 0, remarks: '' }]);
                setMenuDescription('');
                setStockRemarks('');
                setParticipants('');
              }}
            >
              Clear Form
            </button>
            <button 
              type="submit"
              className="w-full md:w-auto px-8 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Save size={20} />
              Save Cost Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};