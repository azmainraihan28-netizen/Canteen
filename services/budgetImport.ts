import { BudgetItem, BudgetPlan, BudgetSection } from '../types';
import { newItem, newPlan, round2 } from './budget';
import { genId } from './id';

// Reads a budget sheet (.xlsx or .csv) laid out like the ACI budget approval
// sheet — title rows, a header row (SL / Items / Unit / Quantity / Rate /
// Total / Remarks), section heading rows, item rows, sub-total and total rows —
// and turns it into a BudgetPlan. Only the header row is required; everything
// else is picked up when present.

type Cell = string | number | boolean | Date | null | undefined;

export interface BudgetImportResult {
  plan: BudgetPlan;
  itemCount: number;
  sectionCount: number;
  sheetName?: string;
  /** Rows whose total in the sheet didn't equal Qty × Rate (the planner recalculates them). */
  mismatches: string[];
}

const banglaDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));

const text = (c: Cell): string => {
  if (c === null || c === undefined) return '';
  if (c instanceof Date) return isNaN(c.getTime()) ? '' : toIsoDate(c);
  return String(c).replace(/\s+/g, ' ').trim();
};

/** Numeric value of a cell: 1,750.00 / ৳ 50 / "১২" → number; "-", "" or text → null. */
const num = (c: Cell): number | null => {
  if (typeof c === 'number') return Number.isFinite(c) ? c : null;
  const s = banglaDigits(text(c)).replace(/,/g, '').replace(/৳|tk\.?|bdt/gi, '').trim();
  if (!/^\d*\.?\d+$/.test(s)) return null;
  return Number(s);
};

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "03rd October, 2026", "3 Oct 2026", "03/10/2026" (day first), "2026-10-03" → "2026-10-03". */
const parseDate = (raw: string): string | null => {
  const s = banglaDigits(raw).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const cleaned = s.replace(/(\d+)(st|nd|rd|th)\b/gi, '$1').replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim();
  const month = (w: string) => MONTHS.findIndex((mn) => w.toLowerCase().startsWith(mn)) + 1;
  m = cleaned.match(/^(\d{1,2}) ([a-z]+) (\d{4})$/i); // 03 October 2026
  if (m && month(m[2])) return `${m[3]}-${String(month(m[2])).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = cleaned.match(/^([a-z]+) (\d{1,2}) (\d{4})$/i); // October 3 2026
  if (m && month(m[1])) return `${m[3]}-${String(month(m[1])).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return null;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// ---------- Header detection ----------

type ColKey = 'sl' | 'name' | 'unit' | 'qty' | 'rate' | 'total' | 'remarks';

const HEADER_PATTERNS: [ColKey, RegExp][] = [
  ['sl', /^(s\.?\s*[il]\.?(\s*no\.?)?$|serial|sr\.?\s*no\.?|#|no\.?$|ক্রম)/i],
  ['qty', /(qty|quantity|পরিমাণ)/i],
  ['rate', /(rate|unit\s*price|price|দর|মূল্য)/i],
  ['total', /(total|amount|মোট)/i],
  ['unit', /^(unit|uom|একক)/i],
  ['remarks', /(remark|note|vendor|supplier|comment|মন্তব্য)/i],
  ['name', /(item|particular|description|name|পণ্য|বিবরণ)/i],
];

const detectHeader = (rows: Cell[][]): { index: number; cols: Partial<Record<ColKey, number>> } | null => {
  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const cols: Partial<Record<ColKey, number>> = {};
    rows[r].forEach((cell, c) => {
      const t = text(cell);
      if (!t || t.length > 40) return;
      for (const [key, re] of HEADER_PATTERNS) {
        if (cols[key] === undefined && re.test(t)) {
          cols[key] = c;
          break;
        }
      }
    });
    if (cols.name !== undefined && (cols.qty !== undefined || cols.rate !== undefined)) return { index: r, cols };
  }
  return null;
};

// ---------- Section headings ----------

/** "Lunch (Time: 1:00) Polao, Egg Khurma…" → title "Lunch", time "1:00", menu "Polao, Egg Khurma…". */
const parseSectionHeading = (raw: string): Pick<BudgetSection, 'title' | 'time' | 'menu'> => {
  const m = raw.match(/^(.*?)\s*\(\s*time\s*[:\-]?\s*([^)]+)\)\s*[—–-]?\s*(.*)$/i);
  if (m) return { title: m[1].trim() || raw, time: m[2].trim(), menu: m[3].trim() };
  const dash = raw.split(/\s+[—–]\s+/);
  if (dash.length > 1) return { title: dash[0].trim(), time: '', menu: dash.slice(1).join(' — ').trim() };
  return { title: raw, time: '', menu: '' };
};

// ---------- Main ----------

export const parseBudgetRows = (rows: Cell[][], fallbackTitle = ''): Omit<BudgetImportResult, 'sheetName'> => {
  const header = detectHeader(rows);
  if (!header) {
    throw new Error('Could not find the header row. The sheet needs columns named like "Items" and "Quantity" (or "Rate").');
  }
  const { index: h, cols } = header;
  const plan = newPlan();
  plan.sections = [];
  plan.programTitle = '';

  // Title block above the header.
  const above = rows.slice(0, h).map((r) => r.map(text).filter(Boolean)).filter((r) => r.length);
  const plain: string[] = [];
  above.forEach((cells) => {
    const line = cells.join(' ').trim();
    const approval = line.match(/budget\s+approval\s+for\s*:?\s*(.*)$/i);
    if (approval) {
      let title = approval[1].trim();
      const dm = title.match(/\(([^()]*\d{4}[^()]*)\)\s*$/);
      if (dm && parseDate(dm[1])) {
        plan.programDate = parseDate(dm[1])!;
        title = title.slice(0, dm.index).trim();
      }
      plan.programTitle = title;
      return;
    }
    const dateOnly = parseDate(line.replace(/^date\s*:?\s*/i, ''));
    if (dateOnly && /^date|^\d/i.test(line)) {
      plan.programDate = dateOnly;
      return;
    }
    plain.push(line);
  });
  if (plain[0]) plan.organization = plain[0];
  if (plain[1]) plan.office = plain[1].replace(/^\(\s*|\s*\)$/g, '');
  if (!plan.programTitle) plan.programTitle = plain[2] || fallbackTitle;

  let section: BudgetSection | null = null;
  let itemCount = 0;
  const mismatches: string[] = [];
  const ensureSection = () => {
    if (!section) {
      section = { id: genId('bs_'), title: 'Items', time: '', menu: '', items: [] };
      plan.sections.push(section);
    }
    return section;
  };

  for (let r = h + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const cells = row.map(text);
    const filled = cells.filter(Boolean);
    if (!filled.length) continue;
    const line = filled.join(' ');
    const lower = line.toLowerCase();

    if (/sub\s*-?\s*total/.test(lower)) continue;
    if (/total\s+participant|no\.?\s+of\s+participant|participants?\s*:/.test(lower)) {
      const n = row.map(num).find((v) => v !== null) ?? num(line.match(/(\d[\d,]*)/)?.[1] ?? null);
      if (n) plan.participants = Math.round(n);
      continue;
    }
    if (/cost\s+per\s+head|per\s+head\s+cost/.test(lower)) {
      const label = cells.filter((t) => t && !/cost\s+per\s+head|per\s+head\s+cost/i.test(t) && num(t) === null).pop();
      if (label) plan.perHeadLabel = label;
      continue;
    }
    if (/^(grand\s+)?total(\s+amount)?\b/.test(lower) || /\btotal amount\b/.test(lower)) continue;
    if (/^in\s*words?\s*:/.test(lower) || /^generated\s*:/.test(lower)) continue;
    if (/^notes?\s*:/.test(lower)) {
      plan.notes = line.replace(/^notes?\s*:\s*/i, '');
      continue;
    }
    if (/^prepared\s+by\s*:/.test(lower)) {
      plan.preparedBy = line.replace(/^prepared\s+by\s*:\s*/i, '');
      continue;
    }

    const at = (k: ColKey) => (cols[k] !== undefined ? row[cols[k]!] : null);
    const name = text(at('name'));
    const qty = num(at('qty'));
    const rate = num(at('rate'));
    const total = num(at('total'));

    // A single text cell with no numbers is a section heading ("Morning Breakfast (Time: 10:00)").
    const numericCells = row.filter((c) => num(c) !== null).length;
    if (filled.length === 1 && numericCells === 0 && qty === null && rate === null) {
      section = { id: genId('bs_'), ...parseSectionHeading(filled[0]), items: [] };
      plan.sections.push(section);
      continue;
    }

    if (!name || num(name) !== null) continue;

    const q = qty ?? 0;
    if (rate && q && total !== null && Math.abs(q * rate - total) > 1) {
      mismatches.push(`${name}: ${q} × ${rate} = ${round2(q * rate)} (sheet says ${total})`);
    }
    const unitRate = rate ?? (total && q ? round2(total / q) : 0);
    const item: BudgetItem = newItem({
      name,
      unit: text(at('unit')),
      quantity: q,
      rate: round2(unitRate),
      remarks: text(at('remarks')),
      rateSource: 'manual',
    });
    ensureSection().items.push(item);
    itemCount += 1;
  }

  plan.sections = plan.sections.filter((s) => s.items.length > 0);
  if (!itemCount) throw new Error('Found the header row, but no item rows under it.');
  return { plan, itemCount, sectionCount: plan.sections.length, mismatches };
};

// ---------- CSV ----------

const parseCsv = (src: string): string[][] => {
  const s = src.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
};

// ---------- File entry point ----------

export const importBudgetFile = async (file: File): Promise<BudgetImportResult> => {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    return parseBudgetRows(parseCsv(await file.text()), base);
  }
  if (ext === 'xls') {
    throw new Error('Old .xls files are not supported. In Excel choose File → Save As → "Excel Workbook (.xlsx)" and upload that.');
  }
  if (ext !== 'xlsx') {
    throw new Error('Please upload an Excel (.xlsx) or CSV file.');
  }

  // Loaded on demand so the Excel reader isn't in the main bundle.
  const { default: readXlsxFile } = await import('read-excel-file/universal');
  let sheets: { sheet: string; data: Cell[][] }[];
  try {
    sheets = (await readXlsxFile(file)) as any;
  } catch {
    throw new Error('Could not read this Excel file. Make sure it is a valid .xlsx file.');
  }

  // Use the first sheet that looks like a budget.
  let lastError: Error | null = null;
  for (const s of sheets) {
    try {
      return { ...parseBudgetRows(s.data, base), sheetName: s.sheet };
    } catch (e: any) {
      lastError = e;
    }
  }
  throw lastError || new Error('The Excel file is empty.');
};
