import React, { useMemo, useState } from 'react';
import { Activity, ArrowLeft, LogIn, LogOut, FilePlus, Trash2, Package, Database, RotateCcw, Undo2, Search, Filter } from 'lucide-react';
import { ActivityLog, ActionType, DailyEntry } from '../types';

interface AuditLogProps {
  logs: ActivityLog[];
  onBack?: () => void;
  onRestoreEntry?: (entry: DailyEntry) => void;
}

const ACTION_META: Record<ActionType, { icon: any; label: string; color: string; ring: string; text: string; from: string; to: string }> = {
  LOGIN:         { icon: LogIn,     label: 'Sign in',        color: 'text-emerald-500', ring: 'ring-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', from: 'from-emerald-500/20', to: 'to-emerald-500/5' },
  LOGOUT:        { icon: LogOut,    label: 'Sign out',       color: 'text-slate-500',   ring: 'ring-slate-500/20',   text: 'text-slate-700 dark:text-slate-300',     from: 'from-slate-500/20',   to: 'to-slate-500/5' },
  CREATE_ENTRY:  { icon: FilePlus,  label: 'New cost sheet', color: 'text-indigo-500',  ring: 'ring-indigo-500/20',  text: 'text-indigo-700 dark:text-indigo-300',   from: 'from-indigo-500/20',  to: 'to-indigo-500/5' },
  DELETE_ENTRY:  { icon: Trash2,    label: 'Deleted entry',  color: 'text-rose-500',    ring: 'ring-rose-500/20',    text: 'text-rose-700 dark:text-rose-300',       from: 'from-rose-500/20',    to: 'to-rose-500/5' },
  UPDATE_STOCK:  { icon: Package,   label: 'Stock update',   color: 'text-violet-500',  ring: 'ring-violet-500/20',  text: 'text-violet-700 dark:text-violet-300',   from: 'from-violet-500/20',  to: 'to-violet-500/5' },
  UPDATE_MASTER: { icon: Database,  label: 'Master update',  color: 'text-amber-500',   ring: 'ring-amber-500/20',   text: 'text-amber-700 dark:text-amber-300',     from: 'from-amber-500/20',   to: 'to-amber-500/5' },
  RESTORE_DATA:  { icon: RotateCcw, label: 'Restored data',  color: 'text-cyan-500',    ring: 'ring-cyan-500/20',    text: 'text-cyan-700 dark:text-cyan-300',       from: 'from-cyan-500/20',    to: 'to-cyan-500/5' },
};

const getRelative = (ts: string) => {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
};

export const AuditLog: React.FC<AuditLogProps> = ({ logs, onBack, onRestoreEntry }) => {
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | ActionType>('ALL');

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return log.details.toLowerCase().includes(q) || log.userRole.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, query, actionFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    filtered.forEach((l) => {
      const key = new Date(l.timestamp).toDateString();
      (groups[key] ||= []).push(l);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filtered]);

  const actionCounts = useMemo(() => {
    const c: Record<string, number> = {};
    logs.forEach((l) => (c[l.action] = (c[l.action] || 0) + 1));
    return c;
  }, [logs]);

  const formatDayHeader = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        {onBack && (
          <button onClick={onBack} className="chip !py-2 !px-2 mt-1"><ArrowLeft size={14} /></button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="chip"><Activity size={11} /> Audit trail</span>
            <span className="chip !bg-indigo-500/10 !text-indigo-700 dark:!text-indigo-300 !border-indigo-500/20">
              <span className="num">{logs.length}</span> events
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">Activity logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Every login, sheet, and stock change — with restore for deleted entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search details or user…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] rounded-lg text-[13px] outline-none focus:border-indigo-500/40"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActionFilter('ALL')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition ${actionFilter === 'ALL' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'chip !py-1.5'}`}
          >
            All · <span className="num">{logs.length}</span>
          </button>
          {(Object.keys(ACTION_META) as ActionType[]).map((a) => {
            const meta = ACTION_META[a];
            const active = actionFilter === a;
            const count = actionCounts[a] || 0;
            if (count === 0) return null;
            return (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition flex items-center gap-1.5 ${
                  active ? `${meta.text} bg-white dark:bg-slate-800 shadow-md ring-1 ${meta.ring}` : 'chip !py-1.5'
                }`}
              >
                <meta.icon size={11} className={meta.color} />
                {meta.label} · <span className="num">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-500/10 flex items-center justify-center">
            <Filter size={22} className="text-slate-400" />
          </div>
          <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">No matching activity</p>
          <p className="text-[12px] text-slate-500 mt-1">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayLogs]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <span className="chip">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {formatDayHeader(day)}
                </span>
                <span className="flex-1 rule" />
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 num">{dayLogs.length} events</span>
              </div>

              <div className="panel overflow-hidden">
                <ol className="relative">
                  {dayLogs.map((log, idx) => {
                    const meta = ACTION_META[log.action] || ACTION_META.LOGIN;
                    const Icon = meta.icon;
                    const canRestore = log.action === 'DELETE_ENTRY' && log.metadata?.deletedEntry && onRestoreEntry;
                    const isLast = idx === dayLogs.length - 1;

                    return (
                      <li key={log.id} className="relative flex gap-4 px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                        {/* Rail */}
                        {!isLast && <span className="absolute left-[38px] top-12 bottom-0 w-px bg-slate-200 dark:bg-white/[0.06]" />}
                        {/* Icon */}
                        <div className={`relative w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${meta.from} ${meta.to} ring-1 ${meta.ring} flex items-center justify-center ${meta.color}`}>
                          <Icon size={17} />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${meta.text}`}>{meta.label}</span>
                                <span className="chip !py-[2px] !px-2 !text-[10px]">{log.userRole}</span>
                              </div>
                              <p className="text-[13.5px] text-slate-700 dark:text-slate-200 mt-1 leading-snug">{log.details}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10.5px] text-slate-400 num whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{getRelative(log.timestamp)}</p>
                            </div>
                          </div>
                          {canRestore && (
                            <button
                              onClick={() => onRestoreEntry && onRestoreEntry(log.metadata.deletedEntry)}
                              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-md transition"
                            >
                              <Undo2 size={11} /> Restore this entry
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
