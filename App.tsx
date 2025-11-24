import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DailyEntryForm } from './components/DailyEntryForm';
import { InventoryMasters } from './components/InventoryMasters';
import { MOCK_ENTRIES, OFFICES, INGREDIENTS } from './constants';
import { DailyEntry, Ingredient } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Simulated Database State
  const [entries, setEntries] = useState<DailyEntry[]>(MOCK_ENTRIES);
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

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                entries={entries} 
                offices={offices} 
                ingredients={ingredients} 
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
              />
            )}
          </div>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
