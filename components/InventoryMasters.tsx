import React, { useState } from 'react';
import { Office, Ingredient, UserRole } from '../types';
import { Archive, AlertCircle, Eye, CheckSquare, Square, Layers, X, Download, Edit2, Trash2, Save } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract') => void;
  userRole: UserRole;
  onUpdateIngredient?: (id: string, updates: Partial<Ingredient>) => void;
  onDeleteIngredient?: (id: string) => void;
}

export const InventoryMasters: React.FC<InventoryMastersProps> = ({ 
  offices, 
  ingredients, 
  onUpdateStock, 
  userRole,
  onUpdateIngredient,
  onDeleteIngredient
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkQuantity, setBulkQuantity] = useState<string>('');
  const [bulkType, setBulkType] = useState<'add' | 'subtract'>('add');

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

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

    const headers = ["Item Name", "Unit", "Unit Price", "Supplier", "Contact", "Last Updated", "Current Stock", "Min Threshold", "Status"];

    const csvRows = ingredients.map(ing => {
      const lastUpdated = ing.lastUpdated ? new Date(ing.lastUpdated).toLocaleString() : '-';
      const status = ing.currentStock <= ing.minStockThreshold ? 'Low Stock' : 'In Stock';
      return [
        `"${ing.name.replace(/"/g, '""')}"`,
        ing.unit,
        ing.unitPrice.toFixed(2),
        `"${(ing.supplierName || '').replace(/"/g, '""')}"`,
        `"${(ing.supplierContact || '').replace(/"/g, '""')}"`,
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

  // Editing Logic
  const handleEditClick = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditForm({
      name: ing.name,
      unit: ing.unit,
      unitPrice: ing.unitPrice,
      minStockThreshold: ing.minStockThreshold,
      supplierName: ing.supplierName,
      supplierContact: ing.supplierContact
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = (id: string) => {
    if (onUpdateIngredient) {
      onUpdateIngredient(id, editForm);
    }
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone.`)) {
      if (onDeleteIngredient) {
        onDeleteIngredient(id);
      }
    }
  };

  const handleEditChange = (field: keyof Ingredient, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
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
                <th className="px-6 py-3">Item Name / Price</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3">Supplier Details</th>
                <th className="px-6 py-3 text-right">Last Updated</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Min Threshold</th>
                <th className="px-6 py-3 text-center">Status</th>
                {userRole === 'ADMIN' && <th className="px-6 py-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {ingredients.map((ing) => {
                const isLowStock = ing.currentStock <= ing.minStockThreshold;
                const lastUpdatedDate = ing.lastUpdated 
                  ? new Date(ing.lastUpdated).toLocaleDateString() + ' ' + new Date(ing.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-';
                const isSelected = selectedIds.includes(ing.id);
                const isEditing = editingId === ing.id;
                
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
                    
                    {/* ITEM NAME & PRICE */}
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {isEditing ? (
                        <div className="space-y-2">
                           <input 
                            type="text" 
                            value={editForm.name || ''} 
                            onChange={e => handleEditChange('name', e.target.value)}
                            className="w-full text-sm border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600"
                            placeholder="Item Name"
                          />
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-slate-500">Price: ৳</span>
                             <input 
                              type="number" 
                              value={editForm.unitPrice || ''} 
                              onChange={e => handleEditChange('unitPrice', parseFloat(e.target.value))}
                              className="w-20 text-xs border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600"
                              placeholder="Price"
                            />
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {isLowStock && <AlertCircle size={16} className="text-rose-500 shrink-0" />}
                            {ing.name}
                          </div>
                          <span className="text-xs text-slate-500">Price: ৳{ing.unitPrice.toFixed(2)}</span>
                        </div>
                      )}
                    </td>

                    {/* UNIT */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {isEditing ? (
                         <input 
                            type="text" 
                            value={editForm.unit || ''} 
                            onChange={e => handleEditChange('unit', e.target.value)}
                            className="w-16 text-sm border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600"
                            placeholder="Unit"
                          />
                      ) : (
                        ing.unit
                      )}
                    </td>

                    {/* SUPPLIER */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="space-y-1">
                           <input 
                            type="text" 
                            value={editForm.supplierName || ''} 
                            onChange={e => handleEditChange('supplierName', e.target.value)}
                            className="w-full text-xs border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600"
                            placeholder="Supplier Name"
                          />
                          <input 
                            type="text" 
                            value={editForm.supplierContact || ''} 
                            onChange={e => handleEditChange('supplierContact', e.target.value)}
                            className="w-full text-xs border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600"
                            placeholder="Contact Info"
                          />
                        </div>
                      ) : (
                        ing.supplierName ? (
                          <div>
                            <div className="font-medium text-slate-700 dark:text-slate-300">{ing.supplierName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">{ing.supplierContact}</div>
                          </div>
                        ) : (
                           <span className="text-slate-400 text-xs italic">N/A</span>
                        )
                      )}
                    </td>

                    {/* LAST UPDATED */}
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {lastUpdatedDate}
                    </td>

                    {/* CURRENT STOCK */}
                    <td className={`px-6 py-4 font-bold text-right ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {ing.currentStock}
                    </td>

                    {/* THRESHOLD */}
                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.minStockThreshold || ''} 
                          onChange={e => handleEditChange('minStockThreshold', parseFloat(e.target.value))}
                          className="w-16 text-sm border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600 text-right"
                        />
                      ) : (
                        ing.minStockThreshold
                      )}
                    </td>

                    {/* STATUS */}
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

                    {/* ACTIONS */}
                    {userRole === 'ADMIN' && (
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleSaveEdit(ing.id)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                              title="Save Changes"
                            >
                              <Save size={16} />
                            </button>
                             <button 
                              onClick={handleCancelEdit}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                             <button 
                              onClick={() => handleEditClick(ing)}
                              className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(ing.id, ing.name)}
                              className="p-1.5 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
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