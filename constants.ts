import { Ingredient, Office, DailyEntry } from './types';

export const OFFICES: Office[] = [
  { id: 'off_01', name: 'ACI Centre (HQ)', location: 'Tejgaon' },
  { id: 'off_02', name: 'Factory - Narayanganj', location: 'Narayanganj' },
  { id: 'off_03', name: 'Factory - Gazipur', location: 'Gazipur' },
  { id: 'off_04', name: 'Distribution Center A', location: 'Chittagong' },
  { id: 'off_05', name: 'Sales Office - North', location: 'Uttara' },
  { id: 'off_06', name: 'Sales Office - South', location: 'Dhanmondi' },
  { id: 'off_07', name: 'Research Lab', location: 'Savar' },
  { id: 'off_08', name: 'Logistics Hub', location: 'Comilla' },
  { id: 'off_09', name: 'Regional Office 1', location: 'Sylhet' },
  { id: 'off_10', name: 'Regional Office 2', location: 'Rajshahi' },
  { id: 'off_11', name: 'Regional Office 3', location: 'Khulna' },
  { id: 'off_12', name: 'Regional Office 4', location: 'Barisal' },
  { id: 'off_13', name: 'Packaging Unit', location: 'Tongi' },
  { id: 'off_14', name: 'Agro Division', location: 'Bogura' },
  { id: 'off_15', name: 'Consumer Brands', location: 'Gulshan' },
];

export const INGREDIENTS: Ingredient[] = [
  { id: 'ing_01', name: 'Rice (Miniket)', unit: 'kg', unitPrice: 0.70, currentStock: 500, minStockThreshold: 100 },
  { id: 'ing_02', name: 'Chicken (Broiler)', unit: 'kg', unitPrice: 2.50, currentStock: 120, minStockThreshold: 50 },
  { id: 'ing_03', name: 'Soybean Oil', unit: 'L', unitPrice: 1.80, currentStock: 80, minStockThreshold: 30 },
  { id: 'ing_04', name: 'Lentils (Dal)', unit: 'kg', unitPrice: 1.20, currentStock: 200, minStockThreshold: 40 },
  { id: 'ing_05', name: 'Vegetables (Mixed)', unit: 'kg', unitPrice: 0.40, currentStock: 150, minStockThreshold: 50 },
  { id: 'ing_06', name: 'Spices (Mix)', unit: 'kg', unitPrice: 5.00, currentStock: 20, minStockThreshold: 10 },
  { id: 'ing_07', name: 'Fish (Rui)', unit: 'kg', unitPrice: 3.50, currentStock: 40, minStockThreshold: 20 },
  { id: 'ing_08', name: 'Beef', unit: 'kg', unitPrice: 6.50, currentStock: 30, minStockThreshold: 15 },
  { id: 'ing_09', name: 'Egg', unit: 'pcs', unitPrice: 0.12, currentStock: 1000, minStockThreshold: 200 },
  { id: 'ing_10', name: 'Lemon', unit: 'pcs', unitPrice: 0.05, currentStock: 300, minStockThreshold: 50 },
  { id: 'ing_11', name: 'Onion', unit: 'kg', unitPrice: 0.80, currentStock: 100, minStockThreshold: 30 },
  { id: 'ing_12', name: 'Potato', unit: 'kg', unitPrice: 0.35, currentStock: 250, minStockThreshold: 60 },
];

// Generate last 30 days of mock data
const generateMockEntries = (): DailyEntry[] => {
  const entries: DailyEntry[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Random entries for a few offices per day
    OFFICES.forEach((office, idx) => {
      // Simulate not every office having data every single day or varying numbers
      if (Math.random() > 0.2) { 
        const participants = Math.floor(Math.random() * (200 - 50) + 50);
        
        // Random consumption simulation
        const rice = participants * 0.25; // 250g per person
        const chicken = participants * 0.2; // 200g per person
        const oil = participants * 0.05; // 50ml per person

        const totalCost = (rice * 0.70) + (chicken * 2.50) + (oil * 1.80);

        entries.push({
          id: `${dateStr}-${office.id}`,
          date: dateStr,
          officeId: office.id,
          participantCount: participants,
          itemsConsumed: [
            { ingredientId: 'ing_01', quantity: rice },
            { ingredientId: 'ing_02', quantity: chicken },
            { ingredientId: 'ing_03', quantity: oil },
          ],
          totalCost: Number(totalCost.toFixed(2)),
          menuDescription: "Standard Lunch Menu",
          stockRemarks: ""
        });
      }
    });
  }
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const MOCK_ENTRIES = generateMockEntries();