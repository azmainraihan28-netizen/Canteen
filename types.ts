
export type UserRole = 'ADMIN' | 'VIEWER';

export interface Office {
  id: string;
  name: string;
  location: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string; // e.g., 'kg', 'L', 'pcs'
  unitPrice: number;
  currentStock: number;
  minStockThreshold: number;
  lastUpdated?: string;
  supplierName?: string;
  supplierContact?: string;
}

export interface ConsumptionItem {
  ingredientId: string;
  quantity: number;
  remarks?: string;
  customRate?: number; // Added to allow overriding price per transaction
}

export interface DailyEntry {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  officeId: string;
  participantCount: number;
  itemsConsumed: ConsumptionItem[];
  totalCost: number;
  menuDescription?: string;
  stockRemarks?: string;
}

export type ActionType = 'LOGIN' | 'LOGOUT' | 'CREATE_ENTRY' | 'DELETE_ENTRY' | 'UPDATE_STOCK' | 'UPDATE_MASTER' | 'RESTORE_DATA';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO timestamp
  userRole: string;
  action: ActionType;
  details: string;
  metadata?: any;
}

export interface DashboardMetrics {
  totalDailyCost: number;
  globalPerHeadCost: number;
  totalParticipants: number;
  topOfficeId: string;
}
