import React, { useState, useMemo } from 'react';
import { Office, Ingredient, UserRole } from '../types';
import { Archive, AlertCircle, Eye, CheckSquare, Square, Layers, X, Download, Edit2, Trash2, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Package, TrendingDown, Sparkles } from 'lucide-react';
import { StockManager } from './StockManager';

interface InventoryMastersProps {
  offices: Office[];
  ingredients: Ingredient[];
  onUpdateStock: (id: string, quantity: number, type: 'add' | 'subtract', supplier?: string, date?: string) => void;
  userRole: UserRole;
  onUpdateIngredient?: (id: string, updates: Partial<Ingredient>) => void;
  onDeleteIngredient?: (id: string) => void;
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

type SortKey = 'name' | 'currentStock' | 'minStockThreshold';

export const InventoryMasters: React.FC<InventoryMastersProps> = ({
  offices,
  ingredients,
  onUpdateStock,
  userRole,
  onUpdateIngredient,
  onDeleteIngredient,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkQuantity, setBulkQuantity] = useState<string>('');
  const [bulkType, setBulkType] = useState<'add' | 'subtract'>('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  const stats = useMemo(() => {
    const lowStock = ingredients.filter((i) => i.currentStock <= i.minStockThreshold).length;
    const totalValue = ingredients.reduce((s, i) => s + i.currentStock * i.unitPrice, 0);
    return {
      total: ingredients.length,
      lowStock,
      healthy: ingredients.length - lowStock,
      totalValue,
    };
  }, [ingredients]);

  const sortedIngredients = useMemo(() => {
    let filtered = ingredients.filter((ing) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!ing.name.toLowerCase().includes(q) && !(ing.supplierName || '').toLowerCase().includes(q)) return false;
      }
      if (statusFilter === 'low' && ing.currentStock > ing.minStockThreshold) return false;
      if (statusFilter === 'healthy' && ing.currentStock <= ing.minStockThreshold) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortConfig.direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
    return filtered;
  }, [ingredients, sortConfig, searchQuery, statusFilter]);

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={11} className="ml-1 text-slate-400 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={11} className="ml-1 text-indigo-500" /> : <ArrowDown size={11} className="ml-1 text-indigo-500" />;
  };

  const handleToggleSelect = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  const handleSelectAll = () => setSelectedIds(selectedIds.length === sortedIngredients.length ? [] : sortedIngredients.map((i) => i.id));

  const handleBulkUpdate = () => {
    const qty = Number(bulkQuantity);
    if (!qty || qty <= 0) return alert('Please enter a valid quantity.');
    if (!window.confirm(`${bulkType === 'add' ? 'Add' : 'Remove'} ${qty} units to ${selectedIds.length} items?`)) return;
    selectedIds.forEach((id) => onUpdateStock(id, qty, bulkType));
    setSelectedIds([]);
    setBulkQuantity('');
    alert('Bulk update completed.');
  };

  const handleExportCSV = () => {
    if (ingredients.length === 0) return alert('No inventory data to export.');
    const headers = ['Item Name', 'Unit', 'Unit Price', 'Supplier', 'Contact', 'Last Updated', 'Current Stock', 'Min Threshold', 'Status'];
    const rows = ingredients.map((ing) => {
      const lu = ing.lastUpdated ? new Date(ing.lastUpdated).toLocaleString() : '-';
      const status = ing.currentStock <= ing.minStockThreshold ? 'Low Stock' : 'In Stock';
      return [`"${ing.name.replace(/"/g, '""')}"`, ing.unit, ing.unitPrice.toFixed(2), `"${(ing.supplierName || '').replace(/"/g, '""')}"`, `"${(ing.supplierContact || '').replace(/"/g, '""')}"`, `"${lu}"`, ing.currentStock.toFixed(2), ing.minStockThreshold.toFixed(2), status].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditForm({ name: ing.name, unit: ing.unit, unitPrice: ing.unitPrice, minStockThreshold: ing.minStockThreshold, supplierName: ing.supplierName, supplierContact: ing.supplierContact });
  };
  const handleCancelEdit = () => { setEditingId(null); setEditForm({}); };
  const handleSaveEdit = (id: string) => { if (onUpdateIngredient) onUpdateIngredient(id, editForm); setEditingId(null); setEditForm({}); };
  const handleDeleteClick = (id: string, name: string) => setDeleteConfirmation({ id, name });
  const confirmDelete = () => { if (deleteConfirmation && onDeleteIngredient) onDeleteIngredient(deleteConfirmation.id); setDeleteConfirmation(null); };
  const handleEditChange = (field: keyof Ingredient, value: string | number) => setEditForm((prev) => ({ ...prev, [field]: value }));

  const editInput = 'w-full bg-white dark:bg-slate-900 border border-indigo-500/60 rounded-md px-2 py-1 text-[12px] outline-none';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Delete confirmation */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="panel w-full max-w-md p-7 text-center animate-fade-scale">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/20 flex items-center justify-center">
              <AlertCircle size={26} className="text-rose-500" />
            </div>
            <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white mb-2">Delete ingredient?</h3>
            <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-1">
              You're about to delete <span className="font-bold text-slate-900 dark:text-white">"{deleteConfirmation.name}"</span>.
            </p>
            <p className="text-[12px] text-rose-500 font-semibold mb-5">This action cannot be undone.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setDeleteConfirmation(null)} className="px-5 py-2.5 rounded-xl chip !py-2.5 !px-5">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold shadow-lg shadow-rose-500/30 flex items-center gap-2">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="chip"><Package size={11} /> Inventory</span>
            <span className="chip !bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/20">
              <span className="num">{stats.total}</span> items · <span className="num">৳{stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">Masters & stock</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Manage raw materials, thresholds, suppliers, and daily stock movement</p>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total items', value: stats.total, color: 'from-indigo-500 to-violet-500', icon: Package },
          { label: 'Healthy stock', value: stats.healthy, color: 'from-emerald-500 to-teal-500', icon: CheckCircle2 },
          { label: 'Low stock alerts', value: stats.lowStock, color: 'from-rose-500 to-orange-500', icon: TrendingDown, danger: stats.lowStock > 0 },
          { label: 'Inventory value', value: `৳${(stats.totalValue / 1000).toFixed(1)}k`, color: 'from-amber-500 to-yellow-500', icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="panel p-4 relative overflow-hidden">
              <span className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.color} opacity-90`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className={`font-display num text-2xl font-extrabold mt-1 ${(s as any).danger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{s.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} bg-opacity-10 opacity-80 flex items-center justify-center text-white shadow-md`}>
                  <Icon size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock manager */}
      {userRole === 'ADMIN' ? (
        <StockManager ingredients={sortedIngredients} onUpdateStock={onUpdateStock} />
      ) : (
        <div className="panel p-4 flex items-center gap-3 text-[13px]">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-300">
            <Eye size={16} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Viewer mode</p>
            <p className="text-slate-500 dark:text-slate-400 text-[12px]">Stock adjustments are disabled for your role.</p>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.length > 0 && userRole === 'ADMIN' && (
        <div className="panel p-4 flex flex-col md:flex-row items-center justify-between gap-3 animate-fade-in ring-1 ring-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              <Layers size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-[13.5px]">Bulk actions</p>
              <p className="text-[11.5px] text-slate-500"><span className="num font-semibold text-indigo-600 dark:text-indigo-300">{selectedIds.length}</span> items selected</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="panel !rounded-xl !p-1 flex">
              <button onClick={() => setBulkType('add')} className={`flex-1 md:flex-none px-3 py-1.5 text-[11.5px] font-semibold rounded-lg transition-all ${bulkType === 'add' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500'}`}>Add</button>
              <button onClick={() => setBulkType('subtract')} className={`flex-1 md:flex-none px-3 py-1.5 text-[11.5px] font-semibold rounded-lg transition-all ${bulkType === 'subtract' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500'}`}>Remove</button>
            </div>
            <input type="number" placeholder="Qty" value={bulkQuantity} onChange={(e) => setBulkQuantity(e.target.value)} className="w-20 md:w-24 px-3 py-2 text-[13px] bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] rounded-lg outline-none focus:border-indigo-500/40 num font-semibold" />
            <button onClick={handleBulkUpdate} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[12.5px] font-semibold shadow-md shadow-indigo-500/30 shrink-0">Apply</button>
            <button onClick={() => setSelectedIds([])} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Clear"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="panel overflow-hidden">
        <div className="p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
              <Archive size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Ingredient master list</h3>
              <p className="text-[11.5px] text-slate-500">
                <span className="num">{sortedIngredients.length}</span> of <span className="num">{ingredients.length}</span> shown
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {/* Status filter tabs */}
            <div className="panel !rounded-xl !p-1 flex">
              {(['all', 'healthy', 'low'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setStatusFilter(k)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition ${
                    statusFilter === k
                      ? k === 'low'
                        ? 'bg-rose-500 text-white shadow-md'
                        : k === 'healthy'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search items or suppliers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] rounded-lg text-[12.5px] outline-none focus:border-indigo-500/40"
              />
            </div>

            <button onClick={handleExportCSV} className="chip !py-2 !px-3 hover:!text-indigo-600 dark:hover:!text-indigo-300 transition">
              <Download size={12} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[1000px]">
            <thead className="text-[10.5px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em] bg-slate-50/60 dark:bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3 w-10">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-indigo-500 transition-colors">
                    {selectedIds.length === sortedIngredients.length && sortedIngredients.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th onClick={() => handleSort('name')} className="px-5 py-3 font-bold cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition">
                  <div className="flex items-center">Item <SortIcon columnKey="name" /></div>
                </th>
                <th className="px-5 py-3 font-bold">Unit</th>
                <th className="px-5 py-3 font-bold">Supplier</th>
                <th className="px-5 py-3 font-bold text-center">Updated</th>
                <th onClick={() => handleSort('currentStock')} className="px-5 py-3 font-bold text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition">
                  <div className="flex items-center justify-end">Stock <SortIcon columnKey="currentStock" /></div>
                </th>
                <th onClick={() => handleSort('minStockThreshold')} className="px-5 py-3 font-bold text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition">
                  <div className="flex items-center justify-end">Min <SortIcon columnKey="minStockThreshold" /></div>
                </th>
                <th className="px-5 py-3 font-bold text-center">Status</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {sortedIngredients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Filter size={40} className="opacity-30" />
                      <p className="text-[13px] font-medium">No ingredients match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedIngredients.map((ing) => {
                  const isEditing = editingId === ing.id;
                  const isLowStock = ing.currentStock <= ing.minStockThreshold;
                  const isSelected = selectedIds.includes(ing.id);
                  const pct = ing.minStockThreshold > 0 ? Math.min((ing.currentStock / ing.minStockThreshold) * 100, 200) : 100;

                  return (
                    <tr key={ing.id} className={`group transition-colors ${isSelected ? 'bg-indigo-500/[0.05]' : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.02]'}`}>
                      <td className="px-5 py-3">
                        <button onClick={() => handleToggleSelect(ing.id)} className={`${isSelected ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'} hover:text-indigo-500 transition-colors`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input type="text" value={editForm.name} onChange={(e) => handleEditChange('name', e.target.value)} className={editInput} />
                        ) : (
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{ing.name}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 num">
                        {isEditing ? <input type="text" value={editForm.unit} onChange={(e) => handleEditChange('unit', e.target.value)} className={`${editInput} w-14`} /> : ing.unit}
                      </td>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input type="text" placeholder="Supplier" list="edit-supplier-options" value={editForm.supplierName || ''} onChange={(e) => handleEditChange('supplierName', e.target.value)} className={editInput} />
                            <input type="text" placeholder="Contact" value={editForm.supplierContact || ''} onChange={(e) => handleEditChange('supplierContact', e.target.value)} className={editInput} />
                            <datalist id="edit-supplier-options">
                              {SUPPLIER_OPTIONS.map((opt) => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>
                        ) : (
                          <div className="text-[12px]">
                            <p className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={ing.supplierName}>{ing.supplierName || <span className="text-slate-400">N/A</span>}</p>
                            {ing.supplierContact && <p className="text-slate-400 mt-0.5 num">{ing.supplierContact}</p>}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center text-[11px] text-slate-500 whitespace-nowrap num">
                        {ing.lastUpdated ? (
                          <>
                            <p className="font-medium">{new Date(ing.lastUpdated).toLocaleDateString()}</p>
                            <p className="text-slate-400">{new Date(ing.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-block min-w-[80px]">
                          <p className={`font-display num text-[15px] font-extrabold ${isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                            {ing.currentStock.toFixed(2)}
                          </p>
                          <div className="h-1 mt-1 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isLowStock ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 num">
                        {isEditing ? <input type="number" value={editForm.minStockThreshold} onChange={(e) => handleEditChange('minStockThreshold', Number(e.target.value))} className={`${editInput} w-16 text-right`} /> : ing.minStockThreshold.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`chip !text-[10px] ${isLowStock ? '!bg-rose-500/10 !text-rose-700 dark:!text-rose-300 !border-rose-500/20' : '!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/20'}`}>
                          {isLowStock ? <><AlertCircle size={10} /> Low</> : <><CheckCircle2 size={10} /> Healthy</>}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(ing.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-md" title="Save"><CheckCircle2 size={15} /></button>
                              <button onClick={handleCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded-md" title="Cancel"><X size={15} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEditClick(ing)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md" title="Edit"><Edit2 size={14} /></button>
                              {userRole === 'ADMIN' && (
                                <button onClick={() => handleDeleteClick(ing.id, ing.name)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md" title="Delete"><Trash2 size={14} /></button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
