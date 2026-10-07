
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

// --- Budget planner ---

export type BudgetRateSource = 'manual' | 'inventory' | 'ai';

export interface BudgetItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  remarks?: string;
  rateSource: BudgetRateSource;
  ingredientId?: string;
  // Populated by the AI market search (kept even when the rate is from elsewhere, for comparison)
  aiPrice?: number | null;
  aiSource?: string;
  aiSourceUrl?: string;
  aiNote?: string;
  aiLow?: number | null;
  aiHigh?: number | null;
}

export interface BudgetSection {
  id: string;
  title: string;      // e.g. "Morning Breakfast"
  time?: string;      // e.g. "10:00 AM"
  menu?: string;      // e.g. "Polao, Egg Khurma, Mutton Rejala…"
  items: BudgetItem[];
}

export interface BudgetPlan {
  id: string;
  organization: string;
  office: string;
  programTitle: string;
  programDate: string; // YYYY-MM-DD
  participants: number;
  perHeadLabel?: string; // e.g. "Full Day Meal"
  preparedBy?: string;
  notes?: string;
  sections: BudgetSection[];
  createdAt: string;
  updatedAt: string;
}
