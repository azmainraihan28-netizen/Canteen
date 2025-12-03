
import React, { useState } from 'react';
import { Settings, Database, RefreshCw, AlertTriangle, CheckCircle2, User, Lock, KeyRound, Plus, X, PackagePlus } from 'lucide-react';
import { api } from '../services/api';
import { UserRole, Ingredient } from '../types';

interface SystemSettingsProps {
  userRole: UserRole;
  onAddIngredient?: (ingredient: Ingredient) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ userRole, onAddIngredient }) => {
  // Data Management State
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handleRestoreDefaults = async () => {
    if (!window.confirm("This will fix missing or corrupted default ingredients (names/prices). Your current stock levels will be preserved. Continue?")) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      await api.restoreMasterIngredients();
      setMessage({ type: 'success', text: 'Master ingredients restored successfully! Corrupted names/prices have been fixed.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to restore data. Check console for details.' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    const username = userRole === 'ADMIN' ? 'admin' : 'guest';
    const storageKey = userRole === 'ADMIN' ? 'admin_password' : 'guest_password';
    const storedPwd = localStorage.getItem(storageKey) || 'aci123';

    if (currentPassword !== storedPwd) {
      setPasswordMessage({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 4 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    localStorage.setItem(storageKey, newPassword);
    setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* Simple Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 flex justify-between items-center border-b border-slate-200 dark:border-slate-600">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-blue-600" /> Add New Ingredient
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitNewItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Item Name *</label>
                <input 
                  type="text" 
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({...newItemForm, name: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="e.g. Basmati Rice"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price (৳) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={newItemForm.unitPrice}
                    onChange={e => setNewItemForm({...newItemForm, unitPrice: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unit *</label>
                  <input 
                    type="text" 
                    required
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({...newItemForm, unit: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="kg, pcs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Stock</label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={newItemForm.currentStock}
                    onChange={e => setNewItemForm({...newItemForm, currentStock: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Min Alert</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newItemForm.minStockThreshold}
                    onChange={e => setNewItemForm({...newItemForm, minStockThreshold: e.target.value})}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Supplier</label>
                      <input 
                        type="text" 
                        value={newItemForm.supplierName}
                        onChange={e => setNewItemForm({...newItemForm, supplierName: e.target.value})}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                        placeholder="Name (Opt)"
                      />
                    </div>
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact</label>
                      <input 
                        type="text" 
                        value={newItemForm.supplierContact}
                        onChange={e => setNewItemForm({...newItemForm, supplierContact: e.target.value})}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                        placeholder="Phone (Opt)"
                      />
                    </div>
                  </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg mt-2"
              >
                ADD ITEM
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
          <Settings size={32} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage application configuration and user profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Settings Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <User size={20} className="text-blue-500" />
              Profile Settings
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-xl">
                {userRole === 'ADMIN' ? 'A' : 'V'}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Logged in as</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{userRole === 'ADMIN' ? 'Administrator' : 'Viewer'}</p>
                <p className="text-xs text-slate-500">Username: {userRole === 'ADMIN' ? 'admin' : 'guest'}</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 flex items-center gap-2">
                <KeyRound size={16} /> Change Password
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                }`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {passwordMessage.text}
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={16} /> Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Admin Management Section */}
        {userRole === 'ADMIN' ? (
          <div className="space-y-8">
            {/* Inventory Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <PackagePlus size={20} className="text-blue-500" />
                  Inventory Management
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                   Add new raw materials or ingredients to your master stock list.
                </p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={20} /> Add New Ingredient
                </button>
              </div>
            </div>

            {/* Data Maintenance Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden h-fit">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Database size={20} className="text-blue-500" />
                  Data Maintenance
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Restore Default Ingredients</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Use this if you accidentally deleted a core item (like Miniket Rice) or if item details like Name/Price are corrupted. It re-adds missing items and fixes details from the catalog without changing your current stock levels.
                    </p>
                    <button 
                      onClick={handleRestoreDefaults}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isRestoring ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      {isRestoring ? 'Restoring...' : 'Restore & Fix Items'}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {message.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-center h-fit">
            <AlertTriangle size={48} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Restricted Access</h3>
            <p className="text-blue-700 dark:text-blue-300">
              System data settings are only available to Administrators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
