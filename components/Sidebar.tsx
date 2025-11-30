
import React from 'react';
import { LayoutDashboard, ClipboardList, PackageOpen, Settings, ChevronLeft, ChevronRight, X, Moon, Sun, LogOut, Shield, Activity, CloudCheck, CloudOff } from 'lucide-react';
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
    { id: 'entry', label: 'Daily Entry', icon: ClipboardList, roles: ['ADMIN'] },
    { id: 'masters', label: 'Masters & Stock', icon: PackageOpen, roles: ['ADMIN', 'VIEWER'] },
    { id: 'history', label: 'Activity Logs', icon: Activity, roles: ['ADMIN'] },
  ];

  // Filter items based on user role
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-50 bg-slate-900 text-white h-screen flex flex-col shadow-xl transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}
    >
      {/* Mobile Close Button */}
      <button 
        onClick={() => setIsMobileOpen?.(false)}
        className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white p-2"
      >
        <X size={24} />
      </button>

      {/* Desktop Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3 top-9 bg-slate-800 text-slate-400 hover:text-white p-1 rounded-full border border-slate-700 shadow-lg cursor-pointer transition-colors z-50"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div className={`p-6 border-b border-slate-800 flex items-center ${isCollapsed ? 'md:justify-center' : 'justify-between'} h-20`}>
        {isCollapsed ? (
          <h1 className="text-xl font-bold text-blue-400 hidden md:block">ACI</h1>
        ) : (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-bold tracking-wider text-blue-400">ACI CANTEEN</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Shield size={10} className={userRole === 'ADMIN' ? 'text-green-400' : 'text-blue-300'} />
              {userRole === 'ADMIN' ? 'Admin Access' : 'Viewer Mode'}
            </p>
          </div>
        )}
        {/* Mobile Header Title if sidebar is open */}
        <div className="md:hidden">
            <h1 className="text-xl font-bold tracking-wider text-blue-400">ACI CANTEEN</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'md:justify-center md:px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              
              <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:hidden' : 'block'}`}>
                {item.label}
              </span>
              
              {/* Tooltip for collapsed mode (Desktop Only) */}
              {isCollapsed && (
                <div className="hidden md:block absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        {/* Connection Status Indicator */}
        <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3 px-4'} py-2 mb-2 w-full`}>
           {isConnected ? (
             <div className="flex items-center gap-2 group relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <span className={`text-xs text-emerald-400 font-medium whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  Cloud Connected
                </span>
                {isCollapsed && (
                <div className="hidden md:block absolute left-14 bg-slate-800 text-emerald-400 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  Cloud Connected
                </div>
              )}
             </div>
           ) : (
             <div className="flex items-center gap-2 group relative">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className={`text-xs text-rose-400 font-medium whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  Offline Mode
                </span>
                 {isCollapsed && (
                <div className="hidden md:block absolute left-14 bg-slate-800 text-rose-400 text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  Offline Mode
                </div>
              )}
             </div>
           )}
        </div>

        {/* Dark Mode Toggle */}
        <button
           onClick={toggleDarkMode}
           className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3 px-4'} py-2 text-slate-400 hover:text-yellow-300 w-full transition-colors group relative`}
           title={isCollapsed ? (isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : ""}
        >
          {isDarkMode ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
           {/* Tooltip */}
           {isCollapsed && (
              <div className="hidden md:block absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </div>
            )}
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3 px-4'} py-2 w-full transition-colors group relative ${
            activeTab === 'settings' 
            ? 'bg-blue-600 text-white rounded-lg' 
            : 'text-slate-400 hover:text-white'
          }`}
          title={isCollapsed ? "System Settings" : ""}
        >
          <Settings size={18} className="shrink-0" />
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>System Settings</span>
          
           {/* Tooltip for collapsed mode */}
           {isCollapsed && (
                <div className="hidden md:block absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  System Settings
                </div>
              )}
        </button>

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3 px-4'} py-2 text-slate-400 hover:text-red-400 w-full transition-colors group relative mt-2 border-t border-slate-800 pt-3`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut size={18} className="shrink-0" />
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>Logout</span>
          
           {/* Tooltip for collapsed mode */}
           {isCollapsed && (
                <div className="hidden md:block absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  Logout
                </div>
              )}
        </button>
      </div>
    </div>
  );
};
