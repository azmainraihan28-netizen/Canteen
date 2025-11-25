import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DailyEntryForm } from './components/DailyEntryForm';
import { InventoryMasters } from './components/InventoryMasters';
import { OFFICES, INGREDIENTS, HISTORICAL_DATA } from './constants';
import { DailyEntry, Ingredient } from './types';
import { Menu } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  
  // Simulated Database State
  // Initialize with HISTORICAL_DATA to show all past records on dashboard immediately
  const [entries, setEntries] = useState<DailyEntry[]>(HISTORICAL_DATA);
  const [ingredients, setIngredients] = useState<Ingredient[]>(INGREDIENTS);
  const [offices] = useState(OFFICES);

  // Handle adding a new entry
  const handleAddEntry = (newEntry: DailyEntry) => {
    setEntries(prev => [...prev, newEntry]);
    
    // Update Stock Levels based on consumption
    const updatedIngredients = [...ingredients];
    newEntry.itemsConsumed.forEach(consumed => {
      const index = updatedIngredients.findIndex(i => i.id === consumed.ingredientId);
      if (index !== -1) {
        updatedIngredients[index].currentStock = Math.max(0, updatedIngredients[index].currentStock - consumed.quantity);
      }
    });
    setIngredients(updatedIngredients);
    setActiveTab('dashboard'); // Redirect to dashboard after entry
  };

  // Handle manual stock update
  const handleStockUpdate = (id: string, quantity: number, type: 'add' | 'subtract') => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        let newStock = ing.currentStock;
        if (type === 'add') {
          newStock += quantity;
        } else {
          newStock = Math.max(0, newStock - quantity);
        }
        return { ...ing, currentStock: Number(newStock.toFixed(2)) };
      }
      return ing;
    }));
  };

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative transition-colors duration-200">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40 flex items-center px-4 shadow-md justify-between">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-blue-400">ACI CANTEEN</span>
          <div className="w-8"></div> {/* Spacer for centering if needed */}
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
        
        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 
            ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} 
            ml-0 
            pt-16 md:pt-8 p-4 md:p-8 
            overflow-y-auto h-screen w-full
          `}
        >
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                entries={entries} 
                offices={offices} 
                ingredients={ingredients} 
                isDarkMode={isDarkMode}
              />
            )}
            
            {activeTab === 'entry' && (
              <DailyEntryForm 
                offices={offices} 
                ingredients={ingredients} 
                onAddEntry={handleAddEntry} 
              />
            )}

            {activeTab === 'masters' && (
              <InventoryMasters 
                offices={offices} 
                ingredients={ingredients}
                onUpdateStock={handleStockUpdate}
              />
            )}
          </div>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;