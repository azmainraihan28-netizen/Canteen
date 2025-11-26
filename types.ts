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
}

export interface ConsumptionItem {
  ingredientId: string;
  quantity: number;
  remarks?: string;
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

export interface DeletionLog {
  id: string;
  originalEntryDate: string;
  deletedAt: string; // ISO timestamp
  menuDescription: string;
  totalCost: number;
  participantCount: number;
  deletedBy: UserRole;
}

export interface DashboardMetrics {
  totalDailyCost: number;
  globalPerHeadCost: number;
  totalParticipants: number;
  topOfficeId: string;
}