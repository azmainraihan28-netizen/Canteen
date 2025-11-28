import { supabase } from './supabase';
import { DailyEntry, Ingredient, DeletionLog, ConsumptionItem } from '../types';
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
    
    // Map DB columns to Type (camelCase)
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      unitPrice: Number(item.unit_price),
      currentStock: Number(item.current_stock),
      minStockThreshold: Number(item.min_stock_threshold),
      lastUpdated: item.last_updated
    }));
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

  // --- ENTRIES ---
  async getEntries(): Promise<DailyEntry[]> {
    // Fetch last 365 days by default to keep it performant, or all if needed
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching entries:", error.message);
        throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      date: item.date,
      officeId: item.office_id,
      participantCount: item.participant_count,
      totalCost: Number(item.total_cost),
      menuDescription: item.menu_description,
      stockRemarks: item.stock_remarks,
      itemsConsumed: item.items_consumed || []
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

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<DeletionLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      originalEntryDate: item.original_entry_date,
      deletedAt: item.deleted_at,
      menuDescription: item.menu_description,
      totalCost: Number(item.total_cost),
      participantCount: item.participant_count,
      deletedBy: item.deleted_by as any
    }));
  },

  async addAuditLog(log: DeletionLog) {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        id: log.id,
        original_entry_date: log.originalEntryDate,
        deleted_at: log.deletedAt,
        menu_description: log.menuDescription,
        total_cost: log.totalCost,
        participant_count: log.participantCount,
        deleted_by: log.deletedBy
      });
    
    if (error) throw error;
  },

  // --- SEEDING (One time setup) ---
  async seedDatabase() {
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
        last_updated: new Date().toISOString()
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
  }
};