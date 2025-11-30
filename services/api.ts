
import { supabase } from './supabase';
import { DailyEntry, Ingredient, ActivityLog } from '../types';
import { INGREDIENTS, HISTORICAL_DATA } from '../constants';

export const api = {
  // --- INGREDIENTS ---
  async getIngredients(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');
    
    if (error) {
        console.error("Error fetching ingredients:", error.message);
        throw error;
    }
    
    // Map DB columns to Type (camelCase) with safety checks
    return (data || []).map((item: any) => ({
      id: item.id || '',
      name: item.name || 'Unknown Item',
      unit: item.unit || '',
      unitPrice: Number(item.unit_price || 0),
      currentStock: Number(item.current_stock || 0),
      minStockThreshold: Number(item.min_stock_threshold || 0),
      lastUpdated: item.last_updated,
      supplierName: item.supplier_name || '',
      supplierContact: item.supplier_contact || ''
    }));
  },

  async addIngredient(ingredient: Ingredient) {
    const { error } = await supabase
      .from('ingredients')
      .insert({
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        unit_price: ingredient.unitPrice,
        current_stock: ingredient.currentStock, // Usually 0 for new item
        min_stock_threshold: ingredient.minStockThreshold,
        supplier_name: ingredient.supplierName,
        supplier_contact: ingredient.supplierContact,
        last_updated: new Date().toISOString()
      });

    if (error) throw error;
  },

  async updateStock(id: string, currentStock: number) {
    const { error } = await supabase
      .from('ingredients')
      .update({ 
        current_stock: currentStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateIngredientMaster(id: string, updates: Partial<Ingredient>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
    if (updates.minStockThreshold !== undefined) dbUpdates.min_stock_threshold = updates.minStockThreshold;
    if (updates.supplierName !== undefined) dbUpdates.supplier_name = updates.supplierName;
    if (updates.supplierContact !== undefined) dbUpdates.supplier_contact = updates.supplierContact;

    const { error } = await supabase
      .from('ingredients')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteIngredient(id: string) {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- ENTRIES ---
  async getEntries(): Promise<DailyEntry[]> {
    // Fetch last 365 days by default to keep it performant
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching entries:", error.message);
        throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      date: item.date,
      officeId: item.office_id,
      participantCount: Number(item.participant_count || 0),
      totalCost: Number(item.total_cost || 0),
      menuDescription: item.menu_description || '',
      stockRemarks: item.stock_remarks || '',
      itemsConsumed: Array.isArray(item.items_consumed) ? item.items_consumed : []
    }));
  },

  async addEntry(entry: DailyEntry) {
    const { error } = await supabase
      .from('daily_entries')
      .insert({
        id: entry.id,
        date: entry.date,
        office_id: entry.officeId,
        participant_count: entry.participantCount,
        total_cost: entry.totalCost,
        menu_description: entry.menuDescription,
        stock_remarks: entry.stockRemarks,
        items_consumed: entry.itemsConsumed
      });
    
    if (error) throw error;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('daily_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // --- ACTIVITY LOGS (Formerly Audit Logs) ---
  async getActivityLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100); // Limit to last 100 activities for performance

    if (error) {
      // Gracefully handle if table doesn't exist yet
      console.warn("Could not fetch activity logs (table might be missing)", error.message);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      timestamp: item.timestamp,
      userRole: item.user_role,
      action: item.action,
      details: item.details,
      metadata: item.metadata
    }));
  },

  async logActivity(log: ActivityLog) {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        id: log.id,
        timestamp: log.timestamp,
        user_role: log.userRole,
        action: log.action,
        details: log.details,
        metadata: log.metadata
      });
    
    if (error) console.error("Failed to save activity log:", error);
  },

  // --- SEEDING & RESTORE (One time setup) ---
  async seedDatabase() {
    try {
      // 1. Check if ingredients exist
      const { count } = await supabase
        .from('ingredients')
        .select('*', { count: 'exact', head: true });
      
      if (count === 0) {
        console.log("Seeding Ingredients...");
        const ingredientsPayload = INGREDIENTS.map(i => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          unit_price: i.unitPrice,
          current_stock: i.currentStock,
          min_stock_threshold: i.minStockThreshold,
          last_updated: new Date().toISOString(),
          supplier_name: i.supplierName,
          supplier_contact: i.supplierContact
        }));
        
        const { error: ingError } = await supabase.from('ingredients').insert(ingredientsPayload);
        if (ingError) console.error("Error seeding ingredients:", ingError);
      }

      // 2. Check if entries exist
      const { count: entriesCount } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true });

      if (entriesCount === 0) {
        console.log("Seeding Historical Data...");
        const entriesPayload = HISTORICAL_DATA.map(e => ({
          id: e.id,
          date: e.date,
          office_id: e.officeId,
          participant_count: e.participantCount,
          total_cost: e.totalCost,
          menu_description: e.menuDescription,
          items_consumed: e.itemsConsumed,
          stock_remarks: e.stockRemarks
        }));
        
        const { error: entryError } = await supabase.from('daily_entries').insert(entriesPayload);
        if (entryError) console.error("Error seeding entries:", entryError);
      }
      
      return true;
    } catch (err) {
      console.error("Seeding failed:", err);
      // Return false but don't crash, app can still try to work
      return false;
    }
  },

  async restoreMasterIngredients() {
    console.log("Restoring missing master ingredients...");
    const ingredientsPayload = INGREDIENTS.map(i => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      unit_price: i.unitPrice,
      current_stock: i.currentStock, // Will be ignored if row exists
      min_stock_threshold: i.minStockThreshold,
      last_updated: new Date().toISOString(),
      supplier_name: i.supplierName,
      supplier_contact: i.supplierContact
    }));
    
    const { error } = await supabase
      .from('ingredients')
      .upsert(ingredientsPayload, { onConflict: 'id', ignoreDuplicates: true });

    if (error) throw error;
  }
};
