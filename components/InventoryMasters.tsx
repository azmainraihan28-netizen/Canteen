import React, { useState, useMemo } from 'react';
import { Office, Ingredient, UserRole } from '../types';
import { Archive, AlertCircle, Eye, CheckSquare, Square, Layers, X, Download, Edit2, Trash2, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract', supplier?: string) => void;
  userRole: UserRole;
  onUpdateIngredient?: (id: string, updates: Partial<Ingredient>) => void;
  onDeleteIngredient?: (id: string) => void;
}

type SortKey = 'name' | 'currentStock' | 'minStockThreshold';

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

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  // Filtering & Sorting Logic
  const sortedIngredients = useMemo(() => {
    // 1. Filter
    const filtered = ingredients.filter(ing => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      return (
        ing.name.toLowerCase().includes(lowerQuery) ||
        (ing.supplierName && ing.supplierName.toLowerCase().includes(lowerQuery))
      );
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle string comparison for names (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numeric comparison
      if (sortConfig.direction === 'asc') {
        return (aValue as number) - (bValue as number);
      } else {
        return (bValue as number) - (aValue as number);
      }
    });
    return filtered;
  }, [ingredients, sortConfig, searchQuery]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 text-slate-400 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-blue-500" />
      : <ArrowDown size={14} className="ml-1 text-blue-500" />;
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === sortedIngredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedIngredients.map(i => i.id));
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
    setDeleteConfirmation({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirmation && onDeleteIngredient) {
      onDeleteIngredient(deleteConfirmation.id);
    }
    setDeleteConfirmation(null);
  };

  const handleEditChange = (field: keyof Ingredient, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Ingredient?</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{deleteConfirmation.name}"</span>?
                <br />
                <span className="text-sm text-red-500 mt-2 block font-medium">This action cannot be undone.</span>
              </p>
              
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} /> Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Manager Component (Only for ADMIN) */}
      {userRole === 'ADMIN' ? (
        <StockManager ingredients={sortedIngredients} onUpdateStock={onUpdateStock} />
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
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="text-blue-500" size={24} />
                Ingredients & Stock Master
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Monitor current inventory levels, unit prices, and supplier details.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items or suppliers..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {userRole === 'ADMIN' && (
                  <th className="px-6 py-4 w-10 text-center">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-500">
                      {selectedIds.length === sortedIngredients.length && sortedIngredients.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                )}
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Item Name <SortIcon columnKey="name" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">Unit</th>
                <th className="px-6 py-4 font-semibold">Supplier Details</th>
                <th className="px-6 py-4 font-semibold text-right">Last Updated</th>
                <th 
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort('currentStock')}
                >
                  <div className="flex items-center justify-end">
                    Current Stock <SortIcon columnKey="currentStock" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort('minStockThreshold')}
                >
                  <div className="flex items-center justify-end">
                    Min Threshold <SortIcon columnKey="minStockThreshold" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                {userRole === 'ADMIN' && <th className="px-6 py-4 font-semibold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedIngredients.length === 0 ? (
                 <tr>
                   <td colSpan={userRole === 'ADMIN' ? 9 : 8} className="px-6 py-12 text-center text-slate-400">
                     <p className="text-lg font-medium">No ingredients found.</p>
                     {searchQuery && <p className="text-sm">Try adjusting your search terms.</p>}
                   </td>
                 </tr>
              ) : (
                sortedIngredients.map((ing) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card List View */}
        <div className="md:hidden space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50">
           {sortedIngredients.length === 0 ? (
             <div className="text-center py-10 text-slate-400">
               <p className="font-medium">No ingredients found.</p>
             </div>
           ) : (
             sortedIngredients.map(ing => {
               const isLowStock = ing.currentStock <= ing.minStockThreshold;
               const isSelected = selectedIds.includes(ing.id);
               const isEditing = editingId === ing.id;

               return (
                 <div key={ing.id} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 transition-all relative ${
                    isLowStock ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'
                 }`}>
                    {/* Header: Name + Badge */}
                    <div className="flex justify-between items-start mb-3 pr-8">
                       <div>
                         {isEditing ? (
                           <div className="space-y-2 mb-2">
                              <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={(e) => handleEditChange('name', e.target.value)}
                                className="w-full text-base font-bold border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                           </div>
                         ) : (
                           <h4 className="font-bold text-lg text-slate-900 dark:text-white">{ing.name}</h4>
                         )}
                         <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            {isEditing ? (
                               <input 
                                type="text" 
                                value={editForm.unit} 
                                onChange={(e) => handleEditChange('unit', e.target.value)}
                                className="w-16 text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-900"
                              />
                            ) : (
                               <span>Unit: {ing.unit}</span>
                            )}
                            <span>•</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <span>৳</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={editForm.unitPrice} 
                                    onChange={(e) => handleEditChange('unitPrice', Number(e.target.value))}
                                    className="w-20 text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-900"
                                  />
                              </div>
                            ) : (
                               <span>৳{ing.unitPrice.toFixed(2)}</span>
                            )}
                         </div>
                       </div>
                    </div>
                    
                    {/* Status Badge Absolute */}
                    <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isLowStock 
                            ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' 
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                        }`}>
                           {isLowStock ? 'Low Stock' : 'OK'}
                        </span>
                    </div>

                    {/* Checkbox for Bulk (Admin Only) */}
                    {userRole === 'ADMIN' && (
                       <button 
                         onClick={() => handleToggleSelect(ing.id)} 
                         className="absolute bottom-4 right-4 text-slate-400 p-2"
                       >
                         {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                       </button>
                    )}

                    {/* Stock Grid */}
                    <div className="grid grid-cols-2 gap-4 my-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                       <div>
                          <span className="text-xs font-bold text-slate-400 uppercase">Current</span>
                          <p className="text-xl font-bold text-slate-800 dark:text-white">{ing.currentStock}</p>
                       </div>
                       <div>
                          <span className="text-xs font-bold text-slate-400 uppercase">Min Limit</span>
                          {isEditing ? (
                             <input 
                                type="number" 
                                value={editForm.minStockThreshold} 
                                onChange={(e) => handleEditChange('minStockThreshold', Number(e.target.value))}
                                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded px-2 py-1 mt-1 bg-white dark:bg-slate-900"
                              />
                          ) : (
                             <p className="text-xl font-medium text-slate-600 dark:text-slate-300">{ing.minStockThreshold}</p>
                          )}
                       </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                       {isEditing ? (
                          <div className="space-y-2">
                             <input 
                                type="text" 
                                placeholder="Supplier Name"
                                value={editForm.supplierName || ''} 
                                onChange={(e) => handleEditChange('supplierName', e.target.value)}
                                className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-900"
                             />
                             <input 
                                type="text" 
                                placeholder="Contact Info"
                                value={editForm.supplierContact || ''} 
                                onChange={(e) => handleEditChange('supplierContact', e.target.value)}
                                className="w-full text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-slate-50 dark:bg-slate-900"
                             />
                          </div>
                       ) : (
                          ing.supplierName ? (
                             <div className="flex flex-col">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{ing.supplierName}</span>
                                <span className="text-xs">{ing.supplierContact}</span>
                             </div>
                          ) : <span className="italic text-xs">No supplier info</span>
                       )}
                    </div>
                    
                    {/* Actions */}
                    {userRole === 'ADMIN' && (
                       <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                          {isEditing ? (
                            <>
                               <button 
                                  onClick={() => handleSaveEdit(ing.id)}
                                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm"
                               >
                                 Save
                               </button>
                               <button 
                                  onClick={handleCancelEdit}
                                  className="flex-1 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold"
                               >
                                 Cancel
                               </button>
                            </>
                          ) : (
                            <>
                               <button 
                                 onClick={() => handleEditClick(ing)}
                                 className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                               >
                                 Edit
                               </button>
                               <button 
                                 onClick={() => handleDeleteClick(ing.id, ing.name)}
                                 className="flex-1 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                               >
                                 Delete
                               </button>
                            </>
                          )}
                       </div>
                    )}
                 </div>
               );
             })
           )}
        </div>
      </div>
    </div>
  );
};