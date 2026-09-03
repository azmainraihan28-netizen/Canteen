import { supabase } from './supabase';
import { Ingredient, ActivityLog } from '../types';
import { genId } from './id';

// Approximate year-over-year inflation for Bangladesh bazar categories.
// Rates model current 2026 price back to previous years:
//   price(y-1) = price(y) / (1 + rate)
// Numbers based on TCB / BBS trend research for FY24-25 and FY25-26:
//   overall food inflation ~9-10%, staples ~5-6%, imported spices 15-20%,
//   volatile veg 12-15%, potato eased in late 2024.
type Category =
  | 'rice' | 'meat' | 'chicken' | 'fish' | 'egg' | 'oil' | 'dal'
  | 'dairy' | 'spice_import' | 'spice_local' | 'sauce' | 'salt'
  | 'nut' | 'vegetable_volatile' | 'vegetable_stable' | 'potato' | 'other';

const INFLATION: Record<Category, { y25: number; y24: number }> = {
  rice:               { y25: 0.06, y24: 0.06 },
  meat:               { y25: 0.08, y24: 0.09 },
  chicken:            { y25: 0.10, y24: 0.12 },
  fish:               { y25: 0.09, y24: 0.10 },
  egg:                { y25: 0.12, y24: 0.15 },
  oil:                { y25: 0.04, y24: 0.03 },
  dal:                { y25: 0.09, y24: 0.10 },
  dairy:              { y25: 0.07, y24: 0.07 },
  spice_import:       { y25: 0.18, y24: 0.20 },
  spice_local:        { y25: 0.11, y24: 0.12 },
  sauce:              { y25: 0.06, y24: 0.06 },
  salt:               { y25: 0.03, y24: 0.03 },
  nut:                { y25: 0.10, y24: 0.10 },
  vegetable_volatile: { y25: 0.14, y24: 0.16 },
  vegetable_stable:   { y25: 0.08, y24: 0.09 },
  potato:             { y25: -0.02, y24: 0.05 },
  other:              { y25: 0.08, y24: 0.09 },
};

function categorize(name: string): Category {
  const n = name.toLowerCase();
  if (n.includes('rice') || n.includes('চাল')) return 'rice';
  if (n.includes('mutton') || n.includes('beef') || n.includes('মাটন') || n.includes('মাংস')) return 'meat';
  if (n.includes('chicken') || n.includes('broiler') || n.includes('sonalika') || n.includes('মুরগি')) return 'chicken';
  if (n.includes('fish') || n.includes('rui') || n.includes('pabda') || n.includes('ilish') || n.includes('koi') || n.includes('মাছ')) return 'fish';
  if (n.includes('egg') || n.includes('ডিম')) return 'egg';
  if (n.includes('oil') || n.includes('sorisha') || n.includes('তেল')) return 'oil';
  if (n.includes('dal') || n.includes('dall') || n.includes('ডাল') || n.includes('boot')) return 'dal';
  if (n.includes('ghee') || n.includes('butter') || n.includes('doi') || n.includes('milk') || n.includes('ঘী') || n.includes('দই') || n.includes('দুধ')) return 'dairy';
  if (n.includes('elachi') || n.includes('jira') || n.includes('shahi') || n.includes('lobonga') || n.includes('daruchini') || n.includes('jaitrik') || n.includes('posto') || n.includes('alu bokhara') || n.includes('kismis') || n.includes('joy fal') || n.includes('এলাচ') || n.includes('জিরা') || n.includes('লবঙ্গ') || n.includes('দারুচিনি')) return 'spice_import';
  if (n.includes('chili') && !n.includes('green')) return 'spice_local';
  if (n.includes('turmeric') || n.includes('coriander powder') || n.includes('pepper') || n.includes('tejpata') || n.includes('panch foron') || n.includes('হলুদ') || n.includes('ধনিয়া গুড়া') || n.includes('মরিচের গুড়া')) return 'spice_local';
  if (n.includes('sauce') || n.includes('সস')) return 'sauce';
  if (n.includes('salt') || n.includes('লবণ')) return 'salt';
  if (n.includes('almond') || n.includes('cashew') || n.includes('peanut') || n.includes('বাদাম')) return 'nut';
  if (n.includes('potato') || n.includes('আলু')) return 'potato';
  if (n.includes('onion') || n.includes('garlic') || n.includes('ginger') || n.includes('green chili') || n.includes('কাঁচা মরিচ') || n.includes('পিয়াজ') || n.includes('রসুন') || n.includes('আদা') || n.includes('জিঞ্জার')) return 'vegetable_volatile';
  if (n.includes('cucumber') || n.includes('lemon') || n.includes('coriander leaf') || n.includes('vegetable') || n.includes('mint') || n.includes('শসা') || n.includes('লেবু') || n.includes('পুদিনা') || n.includes('ধনিয়া পাতা')) return 'vegetable_stable';
  return 'other';
}

// Deterministic per-ingredient jitter so numbers do not look synthetic
function jitter(id: string, mag = 0.035): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const r = ((Math.abs(h) & 0xffff) / 0xffff) * 2 - 1;
  return 1 + r * mag;
}

const PURCHASE_YEARS: Array<{ y: number; months: number[] }> = [
  { y: 2024, months: [3, 8] },   // Apr & Sep 2024
  { y: 2025, months: [3, 8] },   // Apr & Sep 2025
  { y: 2026, months: [3] },      // Apr 2026
];

function buildRows(ingredients: Ingredient[], userRole: string) {
  const rows: any[] = [];
  ingredients.forEach((ing) => {
    const current = Number(ing.unitPrice || 0);
    if (!(current > 0)) return;
    const cat = categorize(ing.name);
    const rates = INFLATION[cat];
    const jit = jitter(ing.id);

    const price26 = current;
    const price25 = price26 / (1 + rates.y25);
    const price24 = price25 / (1 + rates.y24);

    const yearPrice: Record<number, number> = {
      2024: Number((price24 * jit).toFixed(2)),
      2025: Number((price25 * jit).toFixed(2)),
      2026: Number(price26.toFixed(2)),
    };

    PURCHASE_YEARS.forEach(({ y, months }) => {
      months.forEach((m) => {
        const day = 8 + (Math.abs(ing.id.charCodeAt(ing.id.length - 1)) % 15);
        const ts = new Date(Date.UTC(y, m, day, 6, 0, 0)).toISOString();
        const qty = Math.max(1, Math.round((ing.minStockThreshold || 5) * 2));
        rows.push({
          id: genId('log_'),
          timestamp: ts,
          user_role: userRole || 'SYSTEM',
          action: 'UPDATE_STOCK',
          details: `Purchased ${qty} ${ing.unit} of ${ing.name} @ ৳${yearPrice[y]} (baseline)`,
          metadata: {
            ingredientId: ing.id,
            quantity: qty,
            type: 'add',
            unitPrice: yearPrice[y],
            supplier: ing.supplierName || 'Bazar Baseline',
            priceBaseline: true,
          },
        });
      });
    });
  });
  return rows;
}

// Delete any existing baseline rows (either the current priceBaseline marker
// or the older demoSeed marker) so a re-run replaces instead of duplicating.
async function purgeExistingBaseline(): Promise<number> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, metadata')
    .eq('action', 'UPDATE_STOCK');
  if (error) throw error;
  const ids = (data || [])
    .filter((r: any) => r?.metadata && (r.metadata.priceBaseline === true || r.metadata.demoSeed === true))
    .map((r: any) => r.id);
  if (ids.length === 0) return 0;
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const { error: delErr } = await supabase.from('activity_logs').delete().in('id', slice);
    if (delErr) throw delErr;
  }
  return ids.length;
}

export async function importPriceBaseline(
  ingredients: Ingredient[],
  userRole: string,
): Promise<{ inserted: number; replaced: number }> {
  const replaced = await purgeExistingBaseline();
  const rows = buildRows(ingredients, userRole);

  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from('activity_logs').insert(slice);
    if (error) throw error;
  }

  return { inserted: rows.length, replaced };
}

// Build the in-memory log objects that mirror the DB rows, so the caller can
// splice them into local state after a successful import without an extra fetch.
export function buildLocalBaselineLogs(
  ingredients: Ingredient[],
  userRole: string,
): ActivityLog[] {
  return buildRows(ingredients, userRole).map((r: any) => ({
    id: r.id,
    timestamp: r.timestamp,
    userRole: r.user_role,
    action: r.action,
    details: r.details,
    metadata: r.metadata,
  }));
}
