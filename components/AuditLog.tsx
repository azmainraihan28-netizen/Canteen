import React from 'react';
import { History, Trash2, ArrowLeft } from 'lucide-react';
import { DeletionLog } from '../types';

interface AuditLogProps {
  logs: DeletionLog[];
  onBack?: () => void;
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs, onBack }) => {
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
            <History className="text-orange-500" size={28} />
            Data Deletion Audit Log
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            History of deleted daily entries. These records are permanent for audit purposes.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Deleted At</th>
                <th className="px-6 py-4 font-semibold">Original Entry Date</th>
                <th className="px-6 py-4 font-semibold">Deleted By</th>
                <th className="px-6 py-4 font-semibold">Menu Description</th>
                <th className="px-6 py-4 font-semibold text-right">Total Cost</th>
                <th className="px-6 py-4 font-semibold text-center">Participants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <Trash2 size={20} className="text-slate-300" />
                      </div>
                      <p>No deletion history found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(log.deletedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.originalEntryDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-bold border border-red-200 dark:border-red-900">
                        {log.deletedBy}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {log.menuDescription || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      ৳{log.totalCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                      {log.participantCount}
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