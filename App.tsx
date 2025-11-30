import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DailyEntryForm } from './components/DailyEntryForm';
import { InventoryMasters } from './components/InventoryMasters';
import { AuditLog } from './components/AuditLog';
import { Login } from './components/Login';
import { OFFICES } from './constants';
import { DailyEntry, Ingredient, UserRole, DeletionLog } from './types';
import { Menu, Loader2, Database } from 'lucide-react';
import { api } from './services/api';

function App() {
  // Authentication State
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return sessionStorage.getItem('userRole') as UserRole | null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

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
  
  // App Data State
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [deletionHistory, setDeletionHistory] = useState<DeletionLog[]>([]);
  const [offices] = useState(OFFICES);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Try to seed first (only runs if empty)
        await api.seedDatabase();

        const [fetchedIngredients, fetchedEntries, fetchedLogs] = await Promise.all([
          api.getIngredients(),
          api.getEntries(),
          api.getAuditLogs()
        ]);

        setIngredients(fetchedIngredients);
        setEntries(fetchedEntries);
        setDeletionHistory(fetchedLogs);
        setDataError(null);
        setIsConnected(true);
      } catch (err: any) {
        console.error("Failed to load data from Supabase", err);
        // Fallback or error message
        setDataError("Could not connect to database. Please check your internet connection.");
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (userRole) {
      loadData();
    }
  }, [userRole]);

  // Handle Login
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    sessionStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setUserRole(null);
    sessionStorage.removeItem('userRole');
    setActiveTab('dashboard');
    setIsConnected(false);
  };

  // Add Entry
  const handleAddEntry = async (newEntry: DailyEntry) => {
    // Optimistic Update
    setEntries(prev => [newEntry, ...prev]); // Add to top

    // Update Ingredients State locally
    const updatedIngredients = ingredients.map(ing => {
      const consumed = newEntry.itemsConsumed.find(c => c.ingredientId === ing.id);
      if (consumed) {
        return {
          ...ing,
          currentStock: Math.max(0, ing.currentStock - consumed.quantity),
          lastUpdated: new Date().toISOString()
        };
      }
      return ing;
    });
    setIngredients(updatedIngredients);
    setActiveTab('dashboard');

    // Background Sync
    try {
      await api.addEntry(newEntry);
      // Update stock in DB for each consumed item
      for (const item of newEntry.itemsConsumed) {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        if (ing) {
           const newStock = Math.max(0, ing.currentStock - item.quantity);
           await api.updateStock(ing.id, newStock);
        }
      }
    } catch (error) {
      console.error("Failed to sync new entry:", error);
      alert("Error saving to cloud. Data saved locally only.");
      setIsConnected(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) return;

    // Optimistic Update
    const log: DeletionLog = {
      id: `del_${Date.now()}`,
      originalEntryDate: entryToDelete.date,
      deletedAt: new Date().toISOString(),
      menuDescription: entryToDelete.menuDescription || 'N/A',
      totalCost: entryToDelete.totalCost,
      participantCount: entryToDelete.participantCount,
      deletedBy: userRole || 'ADMIN'
    };
    
    setDeletionHistory(prev => [log, ...prev]);
    setEntries(prev => prev.filter(e => e.id !== id));

    // Background Sync
    try {
      await api.deleteEntry(id);
      await api.addAuditLog(log);
    } catch (error) {
      console.error("Failed to delete entry:", error);
      setIsConnected(false);
    }
  };

  // Stock Update
  const handleStockUpdate = async (id: string, quantity: number, type: 'add' | 'subtract') => {
    // Optimistic Update
    let newStockValue = 0;
    const updatedIngredients = ingredients.map(ing => {
      if (ing.id === id) {
        let newStock = ing.currentStock;
        if (type === 'add') {
          newStock += quantity;
        } else {
          newStock = Math.max(0, newStock - quantity);
        }
        newStockValue = Number(newStock.toFixed(3));
        return { 
          ...ing, 
          currentStock: newStockValue,
          lastUpdated: new Date().toISOString()
        };
      }
      return ing;
    });
    setIngredients(updatedIngredients);

    // Background Sync
    try {
      await api.updateStock(id, newStockValue);
    } catch (error) {
      console.error("Failed to update stock:", error);
      setIsConnected(false);
    }
  };

  // Ingredient Master Update (Edit Details)
  const handleUpdateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    // Optimistic Update
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

    try {
      await api.updateIngredientMaster(id, updates);
    } catch (error) {
      console.error("Failed to update ingredient:", error);
      setIsConnected(false);
      // Revert optimization on error would ideally go here by fetching
    }
  };

  // Add New Ingredient
  const handleAddIngredient = async (newIngredient: Ingredient) => {
    setIngredients(prev => [...prev, newIngredient]);

    try {
      await api.addIngredient(newIngredient);
    } catch (error) {
      console.error("Failed to add ingredient:", error);
      setIsConnected(false);
    }
  };

  // Ingredient Delete
  const handleDeleteIngredient = async (id: string) => {
    // Optimistic Update
    setIngredients(prev => prev.filter(i => i.id !== id));

    try {
      await api.deleteIngredient(id);
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  return (
    <HashRouter>
      {!userRole ? (
        <Login onLogin={handleLogin} />
      ) : (
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
            <div className="w-8"></div>
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
            onLogout={handleLogout}
            userRole={userRole}
            isConnected={isConnected}
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
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                  <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                  <p className="text-lg font-medium">Connecting to Database...</p>
                  <p className="text-sm">Fetching stock and history</p>
                </div>
              ) : dataError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-xl text-center">
                  <Database size={48} className="mx-auto text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Connection Error</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">{dataError}</p>
                  <p className="text-sm text-slate-500">Make sure you have run the SQL script in Supabase Dashboard.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      entries={entries} 
                      offices={offices} 
                      ingredients={ingredients} 
                      isDarkMode={isDarkMode}
                      userRole={userRole}
                      onDeleteEntry={handleDeleteEntry}
                      onViewMasterStock={() => setActiveTab('masters')}
                    />
                  )}
                  
                  {activeTab === 'entry' && userRole === 'ADMIN' && (
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
                      userRole={userRole}
                      onUpdateIngredient={handleUpdateIngredient}
                      onAddIngredient={handleAddIngredient}
                      onDeleteIngredient={handleDeleteIngredient}
                    />
                  )}

                  {activeTab === 'history' && userRole === 'ADMIN' && (
                    <AuditLog 
                      logs={deletionHistory} 
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      )}
    </HashRouter>
  );
}

export default App;