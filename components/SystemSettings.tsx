
import React, { useState } from 'react';
import { Settings, Database, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { UserRole } from '../types';

interface SystemSettingsProps {
  userRole: UserRole;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ userRole }) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRestoreDefaults = async () => {
    if (!window.confirm("This will restore any missing default ingredients from the system catalog. Existing items and their stock levels will NOT be changed. Continue?")) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      await api.restoreMasterIngredients();
      setMessage({ type: 'success', text: 'Master ingredients restored successfully! Miniket Rice and other defaults are back.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to restore data. Check console for details.' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
          <Settings size={32} />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage application configuration and data maintenance</p>
        </div>
      </div>

      {userRole === 'ADMIN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Maintenance Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <Database size={20} className="text-blue-500" />
                Data Management
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
                    Use this if you accidentally deleted a core item (like Miniket Rice). It re-adds missing items from the catalog without overwriting your current stock or prices for existing items.
                  </p>
                  <button 
                    onClick={handleRestoreDefaults}
                    disabled={isRestoring}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isRestoring ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    {isRestoring ? 'Restoring...' : 'Restore Missing Items'}
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
        <div className="p-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-center">
          <AlertTriangle size={48} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Restricted Access</h3>
          <p className="text-blue-700 dark:text-blue-300">
            System settings are only available to Administrators. Please log in with an admin account to manage data.
          </p>
        </div>
      )}
    </div>
  );
};
