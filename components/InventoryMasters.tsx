import React, { useState, useMemo } from 'react';
import { Office, Ingredient, UserRole } from '../types';
import { Archive, AlertCircle, Eye, CheckSquare, Square, Layers, X, Download, Edit2, Trash2, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract', supplier?: string, date?: string) => void;
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
        ing.currentStock.toFixed(2),
        ing.minStockThreshold.toFixed(2),
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
             <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-indigo-100 dark:border-indigo-900 shadow-sm w-full md:w-auto">
                <button 
                   onClick={() => setBulkType('add')}
                   className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${bulkType === 'add' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >Add</button>
                <button 
                   onClick={() => setBulkType('subtract')}
                   className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${bulkType === 'subtract' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >Remove</button>
             </div>
             <input 
                type="number"
                placeholder="Qty"
                value={bulkQuantity}
                onChange={e => setBulkQuantity(e.target.value)}
                className="w-20 md:w-24 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
             />
             <button 
                onClick={handleBulkUpdate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-all shrink-0"
             >
                Apply
             </button>
             <button 
                onClick={() => setSelectedIds([])}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Cancel Selection"
             >
                <X size={20} />
             </button>
          </div>
        </div>
      )}

      {/* Main Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
             <Archive className="text-blue-500" size={24} />
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingredient Master List</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
            >
              <Download size={16} /> Export Master
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                   <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-500 transition-colors">
                      {selectedIds.length === sortedIngredients.length && sortedIngredients.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                   </button>
                </th>
                <th onClick={() => handleSort('name')} className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors group">
                   <div className="flex items-center">Item Name <SortIcon columnKey="name" /></div>
                </th>
                <th className="px-6 py-4 font-bold">Unit</th>
                <th className="px-6 py-4 font-bold">Supplier Details</th>
                <th className="px-6 py-4 font-bold text-center">Last Updated</th>
                <th onClick={() => handleSort('currentStock')} className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors group">
                   <div className="flex items-center justify-center">Current Stock <SortIcon columnKey="currentStock" /></div>
                </th>
                <th onClick={() => handleSort('minStockThreshold')} className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors group">
                   <div className="flex items-center justify-center">Min Threshold <SortIcon columnKey="minStockThreshold" /></div>
                </th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedIngredients.length === 0 ? (
                <tr>
                   <td colSpan={9} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                         <Filter size={48} className="opacity-20" />
                         <p className="font-medium">No ingredients found matching your search.</p>
                      </div>
                   </td>
                </tr>
              ) : (
                sortedIngredients.map((ing) => {
                const isEditing = editingId === ing.id;
                const isLowStock = ing.currentStock <= ing.minStockThreshold;
                const isSelected = selectedIds.includes(ing.id);

                return (
                  <tr key={ing.id} className={`${isSelected ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30'} transition-colors group`}>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => handleToggleSelect(ing.id)} className={`${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'} hover:text-blue-500 transition-colors`}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                       </button>
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.name} 
                          onChange={e => handleEditChange('name', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded p-1 text-sm outline-none font-bold"
                        />
                      ) : (
                        <span className="font-bold text-slate-800 dark:text-slate-100">{ing.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.unit} 
                          onChange={e => handleEditChange('unit', e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 border border-blue-500 rounded p-1 text-sm outline-none"
                        />
                      ) : (
                        ing.unit
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                         <div className="space-y-1">
                            <input 
                              type="text" 
                              placeholder="Supplier"
                              value={editForm.supplierName || ''} 
                              onChange={e => handleEditChange('supplierName', e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded p-1 text-xs outline-none"
                            />
                            <input 
                              type="text" 
                              placeholder="Contact"
                              value={editForm.supplierContact || ''} 
                              onChange={e => handleEditChange('supplierContact', e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded p-1 text-xs outline-none"
                            />
                         </div>
                      ) : (
                        <div className="text-xs">
                           <p className="font-semibold text-slate-700 dark:text-slate-300">{ing.supplierName || 'N/A'}</p>
                           {ing.supplierContact && <p className="text-slate-400 mt-0.5">{ing.supplierContact}</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-[10px] md:text-xs text-slate-400 whitespace-nowrap">
                         {ing.lastUpdated ? (
                           <>
                             <p className="font-medium text-slate-500 dark:text-slate-400">{new Date(ing.lastUpdated).toLocaleDateString()}</p>
                             <p>{new Date(ing.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                           </>
                         ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white text-lg">
                      {/* FIX: Formatted to 2 decimal places */}
                      {ing.currentStock.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-500 dark:text-slate-400">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.minStockThreshold} 
                          onChange={e => handleEditChange('minStockThreshold', Number(e.target.value))}
                          className="w-16 bg-white dark:bg-slate-900 border border-blue-500 rounded p-1 text-sm outline-none text-center font-bold"
                        />
                      ) : (
                        ing.minStockThreshold.toFixed(2)
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isLowStock 
                          ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' 
                          : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                      }`}>
                        {isLowStock ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={() => handleSaveEdit(ing.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                              title="Save Changes"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditClick(ing)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 size={18} />
                            </button>
                            {userRole === 'ADMIN' && (
                              <button 
                                onClick={() => handleDeleteClick(ing.id, ing.name)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};