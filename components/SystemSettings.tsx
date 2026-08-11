import React, { useState } from 'react';
import { Settings, Database, RefreshCw, AlertTriangle, CheckCircle2, User, Lock, KeyRound, Plus, X, PackagePlus, Search, Check, DollarSign, Cloud, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { UserRole, Ingredient } from '../types';
import { genId } from '../services/id';

interface SystemSettingsProps {
  userRole: UserRole;
  onAddIngredient?: (ingredient: Ingredient) => void;
  ingredients?: Ingredient[];
  onUpdateIngredient?: (id: string, updates: Partial<Ingredient>) => void;
}

const SUPPLIER_OPTIONS = [
  'Local Market', 'ACI Foods Limited (Rice Unit)', 'ACI Foods Ltd.', 'ACI Logistics Ltd.',
  'ACI Edible Oil ltd.', 'ACI Pure Flour ltd.', 'Md. Mostafa', 'Shah Traders',
  'Shahria Sagor Enterprise', 'M/S Hasan Enterprise (Mehedi Hasan)', 'M/S Muktar Enterprise',
  'Mr. Billal', 'ACI E-Bazar( Salesman: Osman)',
];

const inputBase =
  'w-full bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] rounded-lg text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500/40 focus:bg-white dark:focus:bg-white/[0.06] transition placeholder:text-slate-400 px-3 py-2';

export const SystemSettings: React.FC<SystemSettingsProps> = ({ userRole, onAddIngredient, ingredients, onUpdateIngredient }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [priceMessage, setPriceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name: '', unit: '', unitPrice: '', currentStock: '', minStockThreshold: '', supplierName: '', supplierContact: '',
  });

  const handleFullSyncToSupabase = async () => {
    if (!ingredients || ingredients.length === 0) return alert('No active ingredients found to sync.');
    if (!window.confirm(`Push all ${ingredients.length} ingredients (stock, prices, suppliers) to Supabase? Existing records will be overwritten on conflict.`)) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      await api.syncAllIngredientsToSupabase(ingredients);
      setSyncStatus({ type: 'success', text: 'Sync complete — all ingredient data pushed to Supabase.' });
    } catch (e: any) {
      setSyncStatus({ type: 'error', text: `Sync failed: ${e.message || 'Ensure supplier columns exist in Supabase.'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Fix corrupted default ingredients? Your current stock will be preserved.')) return;
    setIsRestoring(true);
    setMessage(null);
    try {
      await api.restoreMasterIngredients();
      setMessage({ type: 'success', text: 'Master ingredients restored — names & prices fixed.' });
    } catch {
      setMessage({ type: 'error', text: 'Restore failed. Check console.' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const storageKey = userRole === 'ADMIN' ? 'admin_password' : 'guest_password';
    const stored = localStorage.getItem(storageKey) || 'aci123';
    if (currentPassword !== stored) return setPasswordMessage({ type: 'error', text: 'Current password is incorrect.' });
    if (newPassword.length < 4) return setPasswordMessage({ type: 'error', text: 'Password must be at least 4 characters.' });
    if (newPassword !== confirmPassword) return setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
    localStorage.setItem(storageKey, newPassword);
    setPasswordMessage({ type: 'success', text: 'Password updated.' });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const handleSavePrice = (id: string, name: string, oldPrice: number) => {
    const val = parseFloat(newPriceValue);
    if (isNaN(val) || val < 0) return alert('Enter a valid price.');
    if (onUpdateIngredient) {
      onUpdateIngredient(id, { unitPrice: val });
      setEditingIngredientId(null);
      setPriceMessage({ type: 'success', text: `${name} updated from ৳${oldPrice.toFixed(2)} → ৳${val.toFixed(2)}` });
      setTimeout(() => setPriceMessage(null), 4000);
    }
  };

  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name || !newItemForm.unit || !newItemForm.unitPrice) return alert('Fill required fields.');
    if (onAddIngredient) {
      onAddIngredient({
        id: genId('ing_'),
        name: newItemForm.name, unit: newItemForm.unit,
        unitPrice: Number(newItemForm.unitPrice),
        currentStock: Number(newItemForm.currentStock) || 0,
        minStockThreshold: Number(newItemForm.minStockThreshold) || 0,
        supplierName: newItemForm.supplierName, supplierContact: newItemForm.supplierContact,
        lastUpdated: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewItemForm({ name: '', unit: '', unitPrice: '', currentStock: '', minStockThreshold: '', supplierName: '', supplierContact: '' });
      alert('Ingredient added.');
    }
  };

  const filteredIngredients = (ingredients || []).filter((ing) => ing.name.toLowerCase().includes(priceSearchQuery.toLowerCase()));

  const Alert: React.FC<{ m: { type: 'success' | 'error'; text: string } | null }> = ({ m }) =>
    m ? (
      <div className={`text-[12.5px] font-semibold flex items-start gap-2 p-2.5 rounded-lg ${
        m.type === 'success' ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'text-rose-700 dark:text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/20'
      }`}>
        {m.type === 'success' ? <CheckCircle2 size={14} className="shrink-0 mt-px" /> : <AlertTriangle size={14} className="shrink-0 mt-px" />}
        <span className="leading-tight">{m.text}</span>
      </div>
    ) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Add item modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="panel w-full max-w-md overflow-hidden animate-fade-scale">
            <div className="p-4 border-b border-slate-200/60 dark:border-white/[0.06] flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-violet-500/5">
              <h3 className="font-bold text-[15px] text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={17} className="text-indigo-500" /> Add ingredient
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitNewItem} className="p-5 space-y-3">
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Item name *</label>
                <input type="text" required value={newItemForm.name} onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })} className={inputBase} placeholder="e.g. Basmati Rice" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Price (৳) *</label>
                  <input type="number" required step="0.01" value={newItemForm.unitPrice} onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: e.target.value })} className={`${inputBase} num`} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Unit *</label>
                  <input type="text" required value={newItemForm.unit} onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })} className={inputBase} placeholder="kg, pcs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Stock</label>
                  <input type="number" step="0.001" value={newItemForm.currentStock} onChange={(e) => setNewItemForm({ ...newItemForm, currentStock: e.target.value })} className={`${inputBase} num`} placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Min alert</label>
                  <input type="number" step="0.01" value={newItemForm.minStockThreshold} onChange={(e) => setNewItemForm({ ...newItemForm, minStockThreshold: e.target.value })} className={`${inputBase} num`} placeholder="0" />
                </div>
              </div>
              <div className="rule my-1" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Supplier</label>
                  <input type="text" value={newItemForm.supplierName} onChange={(e) => setNewItemForm({ ...newItemForm, supplierName: e.target.value })} className={inputBase} placeholder="Name" list="master-supplier-options" />
                  <datalist id="master-supplier-options">
                    {SUPPLIER_OPTIONS.map((o) => <option key={o} value={o} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">Contact</label>
                  <input type="text" value={newItemForm.supplierContact} onChange={(e) => setNewItemForm({ ...newItemForm, supplierContact: e.target.value })} className={inputBase} placeholder="Phone" />
                </div>
              </div>
              <button type="submit" className="relative w-full py-2.5 rounded-xl font-semibold text-white text-[13px] overflow-hidden group shadow-lg shadow-indigo-500/30 mt-2">
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">Add ingredient</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-500/5 ring-1 ring-slate-500/20 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
          <Settings size={19} />
        </div>
        <div>
          <span className="chip mb-2"><ShieldCheck size={11} /> Preferences</span>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">System settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Profile, inventory, and cloud maintenance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Profile */}
          <div className="panel overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/5 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-500">
                <User size={16} />
              </div>
              <div>
                <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white">Profile</h3>
                <p className="text-[11.5px] text-slate-500">Account & security</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="panel !p-3.5 !rounded-xl flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-display font-extrabold shadow-lg shadow-indigo-500/30">
                  {userRole === 'ADMIN' ? 'A' : 'V'}
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500">Logged in as</p>
                  <p className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-tight">{userRole === 'ADMIN' ? 'Administrator' : 'Viewer'}</p>
                  <p className="text-[11px] text-slate-500 num">@{userRole === 'ADMIN' ? 'admin' : 'guest'}</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5 border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                  <KeyRound size={11} /> Change password
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Current password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputBase} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">New</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBase} required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirm</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBase} required />
                  </div>
                </div>
                <Alert m={passwordMessage} />
                <button type="submit" className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-semibold text-[13px] transition hover:opacity-90 flex items-center justify-center gap-2">
                  <Lock size={13} /> Update password
                </button>
              </form>
            </div>
          </div>

          {/* Price management */}
          {userRole === 'ADMIN' && (
            <div className="panel overflow-hidden">
              <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white">Ingredient prices</h3>
                  <p className="text-[11.5px] text-slate-500">Update master unit price</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input type="text" placeholder="Search ingredients…" value={priceSearchQuery} onChange={(e) => setPriceSearchQuery(e.target.value)} className={`${inputBase} pl-9`} />
                </div>
                <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-200/70 dark:border-white/[0.06] divide-y divide-slate-100 dark:divide-white/[0.05] custom-scrollbar">
                  {filteredIngredients.length === 0 ? (
                    <div className="p-6 text-center text-[12px] text-slate-400">No ingredients found</div>
                  ) : (
                    filteredIngredients.map((ing) => {
                      const isEditing = editingIngredientId === ing.id;
                      return (
                        <div key={ing.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{ing.name}</p>
                            <p className="text-[10.5px] text-slate-500 mt-0.5 num">{ing.unit} · <span className="font-semibold">৳{ing.unitPrice.toFixed(2)}</span></p>
                          </div>
                          <div className="shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">৳</span>
                                  <input type="number" step="0.01" value={newPriceValue} onChange={(e) => setNewPriceValue(e.target.value)} className={`${inputBase} w-24 !pl-5 !py-1.5 num font-semibold`} placeholder="0.00" autoFocus />
                                </div>
                                <button onClick={() => handleSavePrice(ing.id, ing.name, ing.unitPrice)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow"><Check size={14} /></button>
                                <button onClick={() => setEditingIngredientId(null)} className="p-1.5 bg-slate-500/10 text-slate-500 rounded-lg hover:bg-slate-500/20 transition"><X size={14} /></button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingIngredientId(ing.id); setNewPriceValue(ing.unitPrice.toString()); }} className="chip !py-1.5 !px-2.5 hover:!bg-indigo-500 hover:!text-white transition">
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <Alert m={priceMessage} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        {userRole === 'ADMIN' ? (
          <div className="space-y-4">
            {/* Add ingredient */}
            <div className="panel overflow-hidden">
              <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/5 ring-1 ring-violet-500/20 flex items-center justify-center text-violet-500">
                  <PackagePlus size={16} />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white">Inventory</h3>
                  <p className="text-[11.5px] text-slate-500">Extend the master list</p>
                </div>
              </div>
              <div className="p-5">
                <button onClick={() => setIsAddModalOpen(true)} className="relative w-full py-3 rounded-xl font-semibold text-white text-[13px] overflow-hidden group shadow-lg shadow-indigo-500/30">
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                  <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2"><Plus size={15} /> Add new ingredient</span>
                </button>
              </div>
            </div>

            {/* Cloud status */}
            <div className="panel overflow-hidden">
              <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/5 ring-1 ring-sky-500/20 flex items-center justify-center text-sky-500">
                  <Cloud size={16} />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white">Cloud connection</h3>
                  <p className="text-[11.5px] text-slate-500">Real-time sync via Supabase</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="panel !p-3 !rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Provider</p>
                    <p className="text-[13px] font-extrabold text-slate-900 dark:text-white mt-1">Supabase</p>
                  </div>
                  <div className="panel !p-3 !rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</p>
                    <p className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                      <span className="relative inline-flex w-1.5 h-1.5">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 animate-ping opacity-70" />
                        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Live
                    </p>
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  All cost sheets, inventory updates, and activity logs sync in real time to Supabase PostgreSQL.
                </p>
              </div>
            </div>

            {/* Data maintenance */}
            <div className="panel overflow-hidden">
              <div className="p-5 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 ring-1 ring-amber-500/20 flex items-center justify-center text-amber-500">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 dark:text-white">Data maintenance</h3>
                  <p className="text-[11.5px] text-slate-500">Repair & sync utilities</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <RefreshCw size={15} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Restore default ingredients</h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">Recover accidentally deleted core items and fix corrupted names/prices. Stock levels preserved.</p>
                    <button onClick={handleRestoreDefaults} disabled={isRestoring} className="chip !py-2 !px-3.5 !text-[12px] hover:!text-indigo-600 dark:hover:!text-indigo-300 transition disabled:opacity-50">
                      {isRestoring ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                      {isRestoring ? 'Restoring…' : 'Restore & fix items'}
                    </button>
                  </div>
                </div>
                <Alert m={message} />
                <div className="rule" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <Cloud size={15} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Push local master → cloud</h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">Sync all ingredient data (stock, prices, suppliers) to Supabase. Great for backfilling missing fields.</p>
                    <button onClick={handleFullSyncToSupabase} disabled={isSyncing} className="relative px-3.5 py-2 rounded-lg text-white text-[12px] font-semibold overflow-hidden group shadow-md shadow-emerald-500/30 disabled:opacity-50">
                      <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <span className="relative flex items-center gap-1.5">
                        {isSyncing ? <RefreshCw className="animate-spin" size={12} /> : <Database size={12} />}
                        {isSyncing ? 'Syncing…' : 'Push to cloud'}
                      </span>
                    </button>
                  </div>
                </div>
                <Alert m={syncStatus} />
              </div>
            </div>
          </div>
        ) : (
          <div className="panel p-8 text-center h-fit">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-sky-500/10 ring-1 ring-sky-500/20 flex items-center justify-center">
              <AlertTriangle size={22} className="text-sky-500" />
            </div>
            <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white mb-1">Restricted</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              System data settings are only available to administrators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
