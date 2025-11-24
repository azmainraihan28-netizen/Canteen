import React from 'react';
import { LayoutDashboard, ClipboardList, PackageOpen, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'Daily Entry', icon: ClipboardList },
    { id: 'masters', label: 'Masters & Stock', icon: PackageOpen },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">ACI CANTEEN</h1>
        <p className="text-xs text-slate-400 mt-1">Management System</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center space-x-3 px-4 py-2 text-slate-400 hover:text-white w-full transition-colors">
          <Settings size={18} />
          <span className="text-sm">System Settings</span>
        </button>
      </div>
    </div>
  );
};
