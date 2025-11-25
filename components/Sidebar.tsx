import React from 'react';
import { LayoutDashboard, ClipboardList, PackageOpen, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, toggleSidebar }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'Daily Entry', icon: ClipboardList },
    { id: 'masters', label: 'Masters & Stock', icon: PackageOpen },
  ];

  return (
    <div 
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50 transition-all duration-300`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-9 bg-slate-800 text-slate-400 hover:text-white p-1 rounded-full border border-slate-700 shadow-lg cursor-pointer transition-colors z-50"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div className={`p-6 border-b border-slate-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-20`}>
        {isCollapsed ? (
          <h1 className="text-xl font-bold text-blue-400">ACI</h1>
        ) : (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-bold tracking-wider text-blue-400">ACI CANTEEN</h1>
            <p className="text-xs text-slate-400 mt-1">Management System</p>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">
                  {item.label}
                </span>
              )}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button 
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-2 text-slate-400 hover:text-white w-full transition-colors group relative`}
          title={isCollapsed ? "System Settings" : ""}
        >
          <Settings size={18} className="shrink-0" />
          {!isCollapsed && <span className="text-sm whitespace-nowrap overflow-hidden">System Settings</span>}
          
           {/* Tooltip for collapsed mode */}
           {isCollapsed && (
                <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  System Settings
                </div>
              )}
        </button>
      </div>
    </div>
  );
};