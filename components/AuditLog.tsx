
import React from 'react';
import { Activity, ArrowLeft, LogIn, LogOut, FilePlus, Trash2, Package, Database, RotateCcw } from 'lucide-react';
import { ActivityLog, ActionType } from '../types';

interface AuditLogProps {
  logs: ActivityLog[];
  onBack?: () => void;
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs, onBack }) => {
  
  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case 'LOGIN': return <LogIn size={16} />;
      case 'LOGOUT': return <LogOut size={16} />;
      case 'CREATE_ENTRY': return <FilePlus size={16} />;
      case 'DELETE_ENTRY': return <Trash2 size={16} />;
      case 'UPDATE_STOCK': return <Package size={16} />;
      case 'UPDATE_MASTER': return <Database size={16} />;
      case 'RESTORE_DATA': return <RotateCcw size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getActionColor = (action: ActionType) => {
    switch (action) {
      case 'LOGIN': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'LOGOUT': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'CREATE_ENTRY': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DELETE_ENTRY': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'UPDATE_STOCK': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'UPDATE_MASTER': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'RESTORE_DATA': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300"/>
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="text-blue-500" size={28} />
            System Activity Logs
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive audit trail of all system activities, updates, and user actions.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold w-48">Timestamp</th>
                <th className="px-6 py-4 font-semibold w-32">User</th>
                <th className="px-6 py-4 font-semibold w-40">Action</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <Activity size={20} className="text-slate-300" />
                      </div>
                      <p>No activity logs found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-transparent ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
