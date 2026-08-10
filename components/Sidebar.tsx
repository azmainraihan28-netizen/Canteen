import React, { useMemo, useState } from 'react';
import { LayoutDashboard, ClipboardList, PackageOpen, Settings, ChevronLeft, ChevronRight, X, Moon, Sun, LogOut, Shield, Activity, CalendarDays, Truck, PieChart, Database, UtensilsCrossed, Search, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
  userRole: UserRole;
  isConnected?: boolean;
}

type NavItem = {
  id: string;
  label: string;
  icon: any;
  roles: string[];
  group: 'overview' | 'operations' | 'system';
  shortcut?: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, roles: ['ADMIN', 'VIEWER'], group: 'overview',   shortcut: 'D' },
  { id: 'events',    label: 'Events',          icon: CalendarDays,    roles: ['ADMIN', 'VIEWER'], group: 'overview',   shortcut: 'E' },
  { id: 'reports',   label: 'Analytics',       icon: PieChart,        roles: ['ADMIN', 'VIEWER'], group: 'overview',   shortcut: 'A' },
  { id: 'entry',     label: 'Daily entry',     icon: ClipboardList,   roles: ['ADMIN'],           group: 'operations', shortcut: 'N' },
  { id: 'masters',   label: 'Inventory',       icon: PackageOpen,     roles: ['ADMIN', 'VIEWER'], group: 'operations', shortcut: 'I' },
  { id: 'suppliers', label: 'Suppliers',       icon: Truck,           roles: ['ADMIN', 'VIEWER'], group: 'operations', shortcut: 'S' },
  { id: 'history',   label: 'Activity logs',   icon: Activity,        roles: ['ADMIN'],           group: 'system',     shortcut: 'L' },
];

const GROUP_LABELS: Record<NavItem['group'], string> = {
  overview: 'Overview',
  operations: 'Operations',
  system: 'System',
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  toggleSidebar,
  isMobileOpen = false,
  setIsMobileOpen,
  isDarkMode,
  toggleDarkMode,
  onLogout,
  userRole,
  isConnected = false,
}) => {
  const [query, setQuery] = useState('');

  const visible = NAV_ITEMS.filter((i) => i.roles.includes(userRole));
  const filtered = useMemo(() => {
    if (!query.trim()) return visible;
    const q = query.toLowerCase();
    return visible.filter((i) => i.label.toLowerCase().includes(q));
  }, [visible, query]);

  const grouped = useMemo(() => {
    const g: Record<string, NavItem[]> = { overview: [], operations: [], system: [] };
    filtered.forEach((i) => g[i.group].push(i));
    return g;
  }, [filtered]);

  return (
    <aside
      className={`
        sidebar-bg fixed inset-y-0 left-0 z-50 text-slate-200 h-screen flex flex-col
        shadow-[0_10px_60px_-10px_rgba(0,0,0,0.55)] border-r border-white/[0.06]
        transition-[transform,width] duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-[76px]' : 'md:w-[248px]'}
      `}
    >
      {/* Mobile close */}
      <button
        onClick={() => setIsMobileOpen?.(false)}
        className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition z-10"
      >
        <X size={22} />
      </button>

      {/* Desktop toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3 top-9 items-center justify-center w-6 h-6 bg-slate-900 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-full border border-white/10 shadow-lg cursor-pointer transition-colors z-50"
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Brand */}
      <div className={`relative pt-5 pb-4 border-b border-white/[0.06] flex items-center ${isCollapsed ? 'md:justify-center px-0' : 'px-4 gap-2.5'}`}>
        <div className="relative shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl blur-md opacity-60" />
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg ring-1 ring-white/20">
            <UtensilsCrossed size={17} className="text-white" strokeWidth={2.4} />
          </div>
        </div>
        <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
          <h1 className="font-display text-[15px] font-extrabold tracking-tight text-white leading-tight">ACI Canteen</h1>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-[0.14em] font-semibold">Management OS</p>
        </div>
      </div>

      {/* Command / search */}
      {!isCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative group">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to…"
              className="w-full pl-8 pr-11 py-2 bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] focus:border-indigo-500/40 focus:bg-white/[0.06] rounded-lg text-[12.5px] text-slate-200 placeholder:text-slate-500 outline-none transition"
            />
            <span className="kbd absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">/</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 py-3 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {(['overview', 'operations', 'system'] as const).map((groupKey) => {
          const items = grouped[groupKey];
          if (items.length === 0) return null;
          return (
            <div key={groupKey}>
              {!isCollapsed && (
                <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {GROUP_LABELS[groupKey]}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={isCollapsed ? item.label : ''}
                      className={`w-full relative flex items-center ${isCollapsed ? 'md:justify-center md:px-2' : 'gap-2.5 px-2.5'} py-2 rounded-lg transition-all duration-150 group text-[13px] ${
                        isActive
                          ? 'bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-400 via-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(139,92,246,0.7)]" />
                      )}
                      <Icon size={16} className={`shrink-0 transition ${isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={2} />
                      <span className={`font-medium whitespace-nowrap overflow-hidden flex-1 text-left ${isCollapsed ? 'md:hidden' : 'block'}`}>
                        {item.label}
                      </span>
                      {!isCollapsed && item.shortcut && (
                        <span className={`kbd ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>{item.shortcut}</span>
                      )}
                      {isCollapsed && (
                        <div className="hidden md:flex absolute left-14 items-center gap-2 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                          {item.label}
                          {item.shortcut && <span className="kbd">{item.shortcut}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!isCollapsed && filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[11px] text-slate-500">No matches for “{query}”</p>
        )}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/[0.06] ${isCollapsed ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
        {/* Status */}
        <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-2 px-2.5'} py-1.5`}>
          <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}>
            {isConnected && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
          </span>
          <span className={`text-[10.5px] font-semibold whitespace-nowrap tracking-wide uppercase ${isConnected ? 'text-emerald-300/80' : 'text-rose-300/80'} ${isCollapsed ? 'md:hidden' : ''}`}>
            {isConnected ? 'Live · synced' : 'Offline'}
          </span>
        </div>

        {/* Theme */}
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-2.5 px-2.5'} py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-[13px]`}
          title={isCollapsed ? (isDarkMode ? 'Light mode' : 'Dark mode') : ''}
        >
          {isDarkMode ? <Sun size={15} className="shrink-0 text-amber-300" /> : <Moon size={15} className="shrink-0" />}
          <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
            {isDarkMode ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-2.5 px-2.5'} py-2 rounded-lg transition-colors group text-[13px] ${
            activeTab === 'settings' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title={isCollapsed ? 'Settings' : ''}
        >
          <Settings size={15} className="shrink-0" />
          <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Settings</span>
        </button>

        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-2.5 px-2.5'} py-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-[13px]`}
          title={isCollapsed ? 'Sign out' : ''}
        >
          <LogOut size={15} className="shrink-0" />
          <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Sign out</span>
        </button>

        {/* User pill */}
        {!isCollapsed && (
          <div className="mt-2 pt-3 border-t border-white/[0.06] flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-white/10 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {userRole === 'ADMIN' ? 'AD' : 'VW'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate leading-tight">
                {userRole === 'ADMIN' ? 'Administrator' : 'Viewer'}
              </p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Shield size={9} className={userRole === 'ADMIN' ? 'text-emerald-400' : 'text-sky-400'} />
                <span className="uppercase tracking-wider font-semibold">
                  {userRole === 'ADMIN' ? 'Full access' : 'Read only'}
                </span>
              </p>
            </div>
            <Sparkles size={12} className="text-indigo-400/60 shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
};
