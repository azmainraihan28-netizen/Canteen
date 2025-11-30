import React, { useState } from 'react';
import { Office, Ingredient, UserRole } from '../types';
import { Archive, AlertCircle, Eye, CheckSquare, Square, Layers, X, Download, Edit2, Trash2, Save, Plus } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract') => void;
  userRole: UserRole;
  onUpdateIngredient?: (id: string, updates: Partial<Ingredient>) => void;
  onAddIngredient?: (ingredient: Ingredient) => void;
  onDeleteIngredient?: (id: string) => void;
}

export const InventoryMasters: React.FC<InventoryMastersProps> = ({ 
  offices, 
  ingredients, 
  onUpdateStock, 
  userRole,
  onUpdateIngredient,
  onAddIngredient,
  onDeleteIngredient
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkQuantity, setBulkQuantity] = useState<string>('');
  const [bulkType, setBulkType] = useState<'add' | 'subtract'>('add');

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  // Add Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    unit: '',
    unitPrice: '',
    currentStock: '',
    minStockThreshold: '',
    supplierName: '',
    supplierContact: ''
  });

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

  // Add Item Logic
  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name || !newItemForm.unit || !newItemForm.unitPrice) {
      alert("Please fill in required fields (Name, Unit, Price)");
      return;
    }

    if (onAddIngredient) {
      const newIngredient: Ingredient = {
        id: `ing_${Date.now()}`,
        name: newItemForm.name,
        unit: newItemForm.unit,
        unitPrice: Number(newItemForm.unitPrice),
        currentStock: Number(newItemForm.currentStock) || 0,
        minStockThreshold: Number(newItemForm.minStockThreshold) || 0,
        supplierName: newItemForm.supplierName,
        supplierContact: newItemForm.supplierContact,
        lastUpdated: new Date().toISOString()
      };
      onAddIngredient(newIngredient);
      setIsAddModalOpen(false);
      setNewItemForm({ name: '', unit: '', unitPrice: '', currentStock: '', minStockThreshold: '', supplierName: '', supplierContact: '' });
      alert("New item added successfully!");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600 dark:text-blue-400" /> Add New Ingredient
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitNewItem} className="p-6 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">Item Name *</label>
                <input 
                  type="text" 
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({...newItemForm, name: e.target.value})}
                  className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                  placeholder="e.g. Basmati Rice"
                />
              </div>

              {/* Price and Unit Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">Unit Price (৳) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    value={newItemForm.unitPrice}
                    onChange={e => setNewItemForm({...newItemForm, unitPrice: e.target.value})}
                    className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">Unit *</label>
                  <input 
                    type="text" 
                    required
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({...newItemForm, unit: e.target.value})}
                    className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="e.g. kg, pcs"
                  />
                </div>
              </div>

              {/* Current Stock and Threshold Row */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">Current Stock</label>
                  <input 
                    type="number" 
                    step="0.001"
                    min="0"
                    value={newItemForm.currentStock}
                    onChange={e => setNewItemForm({...newItemForm, currentStock: e.target.value})}
                    className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Initial Qty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">Min Threshold</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={newItemForm.minStockThreshold}
                    onChange={e => setNewItemForm({...newItemForm, minStockThreshold: e.target.value})}
                    className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="Alert limit"
                  />
                </div>
              </div>
              
              {/* Optional Supplier Fields */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 opacity-80 hover:opacity-100 transition-opacity">
                  <p className="text-xs font-semibold text-slate-400 mb-2 uppercase">Supplier Details (Optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="text" 
                        value={newItemForm.supplierName}
                        onChange={e => setNewItemForm({...newItemForm, supplierName: e.target.value})}
                        className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Supplier Name"
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        value={newItemForm.supplierContact}
                        onChange={e => setNewItemForm({...newItemForm, supplierContact: e.target.value})}
                        className="w-full border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Supplier Contact"
                      />
                    </div>
                  </div>
              </div>

              {/* Big ADD Button */}
              <div className="pt-4 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg uppercase tracking-wider rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus size={24} strokeWidth={3} />
                  ADD
                </button>
                 <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <h4 className="font-bold text-indigo-700 dark:text-indigo-300">Bulk Actions</h4>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">{selectedIds.length} items selected</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="flex rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-700">
                <button
                  onClick={() => setBulkType('add')}
                  className={`px-3 py-2 text-sm font-bold ${bulkType === 'add' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                >
                  Add
                </button>
                <button
                  onClick={() => setBulkType('subtract')}
                  className={`px-3 py-2 text-sm font-bold ${bulkType === 'subtract' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                >
                  Remove
                </button>
             </div>
             
             <input
              type="number"
              placeholder="Qty"
              value={bulkQuantity}
              onChange={(e) => setBulkQuantity(e.target.value)}
              className="w-20 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
             />
             
             <button
              onClick={handleBulkUpdate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
             >
               Apply
             </button>
             
             <button 
              onClick={() => setSelectedIds([])}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Clear Selection"
             >
               <X size={18} />
             </button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="text-blue-500" size={24} />
                Ingredients & Stock Master
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Monitor current inventory levels, unit prices, and supplier details.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download size={16} /> Export CSV
              </button>
              
              {userRole === 'ADMIN' && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-colors"
                >
                  <Plus size={16} /> Add New Item
                </button>
              )}
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {userRole === 'ADMIN' && (
                  <th className="px-6 py-4 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-500">
                      {selectedIds.length === ingredients.length && ingredients.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                )}
                <th className="px-6 py-4 font-semibold">Item Name</th>
                <th className="px-6 py-4 font-semibold">Unit</th>
                <th className="px-6 py-4 font-semibold">Supplier Details</th>
                <th className="px-6 py-4 font-semibold text-right">Last Updated</th>
                <th className="px-6 py-4 font-semibold text-right">Current Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Min Threshold</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                {userRole === 'ADMIN' && <th className="px-6 py-4 font-semibold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {ingredients.map((ing) => {
                const isLowStock = ing.currentStock <= ing.minStockThreshold;
                const isSelected = selectedIds.includes(ing.id);
                const isEditing = editingId === ing.id;

                return (
                  <tr 
                    key={ing.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${isLowStock ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                  >
                    {userRole === 'ADMIN' && (
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleSelect(ing.id)} className={`${isSelected ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                    )}
                    
                    <td className="px-6 py-4">
                      {isEditing ? (
                         <div className="space-y-2">
                            <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={(e) => handleEditChange('name', e.target.value)}
                              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Price: ৳</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={editForm.unitPrice} 
                                  onChange={(e) => handleEditChange('unitPrice', Number(e.target.value))}
                                  className="w-24 text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                                />
                             </div>
                         </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{ing.name}</p>
                          {/* Unit Price Hidden from view as requested, but available in edit mode */}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.unit} 
                          onChange={(e) => handleEditChange('unit', e.target.value)}
                          className="w-16 text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                        />
                      ) : (
                        ing.unit
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs">
                       {isEditing ? (
                         <div className="space-y-1">
                           <input 
                              type="text" 
                              placeholder="Name"
                              value={editForm.supplierName || ''} 
                              onChange={(e) => handleEditChange('supplierName', e.target.value)}
                              className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                           />
                           <input 
                              type="text" 
                              placeholder="Contact"
                              value={editForm.supplierContact || ''} 
                              onChange={(e) => handleEditChange('supplierContact', e.target.value)}
                              className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                           />
                         </div>
                       ) : (
                          ing.supplierName ? (
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{ing.supplierName}</p>
                              <p className="text-slate-400">{ing.supplierContact}</p>
                            </div>
                          ) : <span className="text-slate-400 italic">N/A</span>
                       )}
                    </td>

                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {ing.lastUpdated ? new Date(ing.lastUpdated).toLocaleDateString() : '-'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                             {ing.lastUpdated ? new Date(ing.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </span>
                       </div>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white text-lg">
                      {ing.currentStock}
                    </td>

                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                       {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.minStockThreshold} 
                          onChange={(e) => handleEditChange('minStockThreshold', Number(e.target.value))}
                          className="w-20 text-right text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-900"
                        />
                      ) : (
                        ing.minStockThreshold
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        isLowStock 
                          ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' 
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {isLowStock ? (
                          <>
                            <AlertCircle size={12} className="mr-1" />
                            Low Stock
                          </>
                        ) : (
                          <>In Stock</>
                        )}
                      </span>
                    </td>

                    {userRole === 'ADMIN' && (
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                             <button 
                                onClick={() => handleSaveEdit(ing.id)}
                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                title="Save"
                             >
                               <CheckSquare size={16} />
                             </button>
                             <button 
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                                title="Cancel"
                             >
                               <X size={16} />
                             </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleEditClick(ing)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(ing.id, ing.name)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
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
          {ingredients.length === 0 && (
             <div className="p-12 text-center text-slate-500 dark:text-slate-400">
               <Archive size={48} className="mx-auto mb-4 opacity-20" />
               <p className="text-lg font-medium">No ingredients found in master list.</p>
               <p className="text-sm">Add items or restore defaults from Settings.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};