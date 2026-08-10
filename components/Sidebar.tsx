import React from 'react';
import { LayoutDashboard, ClipboardList, PackageOpen, Settings, ChevronLeft, ChevronRight, X, Moon, Sun, LogOut, Shield, Activity, CalendarDays, Truck, PieChart, Database, UtensilsCrossed } from 'lucide-react';
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
  isConnected = false
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'VIEWER'] },
    { id: 'events', label: 'Events Report', icon: CalendarDays, roles: ['ADMIN', 'VIEWER'] },
    { id: 'reports', label: 'Analytics & Reporting', icon: PieChart, roles: ['ADMIN', 'VIEWER'] },
    { id: 'entry', label: 'Daily Entry', icon: ClipboardList, roles: ['ADMIN'] },
    { id: 'masters', label: 'Masters & Stock', icon: PackageOpen, roles: ['ADMIN', 'VIEWER'] },
    { id: 'suppliers', label: 'Supplier-Wise Ingredients', icon: Truck, roles: ['ADMIN', 'VIEWER'] },
    { id: 'history', label: 'Activity Logs', icon: Activity, roles: ['ADMIN'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      className={`
        sidebar-bg fixed inset-y-0 left-0 z-50 text-slate-200 h-screen flex flex-col
        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-r border-white/5
        transition-[transform,width] duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}
    >
      {/* Soft top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent" />

      {/* Mobile Close Button */}
      <button
        onClick={() => setIsMobileOpen?.(false)}
        className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition"
      >
        <X size={22} />
      </button>

      {/* Desktop Toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3 top-10 items-center justify-center w-6 h-6 bg-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-full border border-white/10 shadow-lg cursor-pointer transition-colors z-50"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Brand */}
      <div className={`relative px-5 pt-6 pb-5 border-b border-white/5 flex items-center gap-3 ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}>
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl blur-md opacity-60" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <UtensilsCrossed size={20} className="text-white" strokeWidth={2.4} />
          </div>
        </div>
        <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
          <h1 className="font-display text-[17px] font-extrabold tracking-tight text-white leading-none">ACI Canteen</h1>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
            <Shield size={10} className={userRole === 'ADMIN' ? 'text-emerald-400' : 'text-sky-300'} />
            <span className="uppercase tracking-wider font-semibold">
              {userRole === 'ADMIN' ? 'Admin' : 'Viewer'}
            </span>
            <span className="text-slate-600">·</span>
            <span>Manager</span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {!isCollapsed && (
          <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Overview
          </p>
        )}
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full relative flex items-center ${isCollapsed ? 'md:justify-center md:px-2' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all duration-200 group text-sm ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-transparent text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
              )}
              <Icon size={18} className={`shrink-0 transition ${isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`} strokeWidth={2} />
              <span className={`font-medium whitespace-nowrap overflow-hidden transition-all ${isCollapsed ? 'md:hidden' : 'block'}`}>
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="hidden md:block absolute left-14 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/5 ${isCollapsed ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
        {/* Connection Status */}
        <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-2.5 px-3'} py-2 mb-1`}>
          <span className={`relative inline-flex w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}>
            {isConnected && (
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            )}
          </span>
          <span className={`text-[11px] font-semibold whitespace-nowrap ${isConnected ? 'text-emerald-300' : 'text-rose-300'} ${isCollapsed ? 'md:hidden' : ''}`}>
            {isConnected ? 'Cloud connected' : 'Offline mode'}
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors group relative text-sm`}
          title={isCollapsed ? (isDarkMode ? "Light mode" : "Dark mode") : ""}
        >
          {isDarkMode ? <Sun size={17} className="shrink-0 text-amber-300" /> : <Moon size={17} className="shrink-0" />}
          <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
            {isDarkMode ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-colors group text-sm ${
            activeTab === 'settings'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title={isCollapsed ? "System settings" : ""}
        >
          <Settings size={17} className="shrink-0" />
          <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Settings</span>
        </button>

        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors group text-sm`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={17} className="shrink-0" />
          <span className={`font-medium whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>Sign out</span>
        </button>

        {/* Powered by */}
        <div className={`mt-2 pt-3 border-t border-white/5 flex items-center ${isCollapsed ? 'justify-center' : 'px-3'}`}>
          <div className="flex items-center gap-2 opacity-70">
            <Database size={12} className="text-emerald-400" />
            {!isCollapsed && (
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                Supabase · v1.0
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
