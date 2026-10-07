import { supabase } from './supabase';
import { genId } from './id';
import { BudgetPlan, BudgetSection, BudgetItem } from '../types';

// ---------- Math ----------

export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
export const itemTotal = (it: BudgetItem) => round2((Number(it.quantity) || 0) * (Number(it.rate) || 0));
export const sectionTotal = (s: BudgetSection) => round2(s.items.reduce((sum, it) => sum + itemTotal(it), 0));
export const planTotal = (p: BudgetPlan) => round2(p.sections.reduce((sum, s) => sum + sectionTotal(s), 0));
export const perHead = (p: BudgetPlan) => (p.participants > 0 ? round2(planTotal(p) / p.participants) : 0);

export const fmtMoney = (n: number) =>
  (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtQty = (n: number) =>
  (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });

export const fmtDateLong = (iso: string) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${String(day).padStart(2, '0')}${suffix} ${d.toLocaleString('en-US', { month: 'long' })}, ${d.getFullYear()}`;
};

// ---------- Amount in words (Bangladeshi system: Crore / Lakh) ----------

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const below100 = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const below1000 = (n: number) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', r ? below100(r) : ''].filter(Boolean).join(' ');
};

const intToWords = (n: number): string => {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${intToWords(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return parts.join(' ');
};

export const amountInWords = (amount: number) => {
  const total = round2(amount);
  const taka = Math.floor(total);
  const paisa = Math.round((total - taka) * 100);
  return `Taka ${intToWords(taka)}${paisa ? ` and ${intToWords(paisa)} Paisa` : ''} only`;
};

// ---------- Factories ----------

export const newItem = (partial: Partial<BudgetItem> = {}): BudgetItem => ({
  id: genId('bi_'),
  name: '',
  unit: 'KG',
  quantity: 0,
  rate: 0,
  remarks: '',
  rateSource: 'manual',
  ...partial,
});

export const newSection = (title = 'New section', time = ''): BudgetSection => ({
  id: genId('bs_'),
  title,
  time,
  menu: '',
  items: [newItem()],
});

export const newPlan = (): BudgetPlan => {
  const now = new Date().toISOString();
  return {
    id: genId('budget_'),
    organization: 'ACI Limited',
    office: 'Head Office',
    programTitle: '',
    programDate: now.slice(0, 10),
    participants: 0,
    perHeadLabel: 'Full Day Meal',
    preparedBy: '',
    notes: '',
    sections: [
      newSection('Morning Breakfast', '10:00 AM'),
      newSection('Lunch', '1:00 PM'),
      newSection('Afternoon Snacks', '4:00 PM'),
    ],
    createdAt: now,
    updatedAt: now,
  };
};

export const duplicatePlan = (p: BudgetPlan): BudgetPlan => {
  const now = new Date().toISOString();
  return {
    ...p,
    id: genId('budget_'),
    programTitle: p.programTitle ? `${p.programTitle} (copy)` : '',
    sections: p.sections.map((s) => ({ ...s, id: genId('bs_'), items: s.items.map((it) => ({ ...it, id: genId('bi_') })) })),
    createdAt: now,
    updatedAt: now,
  };
};

// ---------- Storage (Supabase, falls back to this browser) ----------

const LOCAL_KEY = 'budget_plans_local';

const readLocal = (): BudgetPlan[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeLocal = (plans: BudgetPlan[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(plans));
  } catch {
    /* storage full or blocked — nothing else we can do */
  }
};

export type BudgetStorageMode = 'cloud' | 'local';

export const budgetStore = {
  mode: 'cloud' as BudgetStorageMode,

  async list(): Promise<BudgetPlan[]> {
    const { data, error } = await supabase
      .from('budget_plans')
      .select('data, updated_at')
      .order('updated_at', { ascending: false });
    if (error) {
      // Table not created yet (or offline) — keep working on this device.
      console.warn('budget_plans unavailable, using local storage:', error.message);
      this.mode = 'local';
      return readLocal().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    this.mode = 'cloud';
    return (data || []).map((r: any) => r.data as BudgetPlan);
  },

  async save(plan: BudgetPlan): Promise<void> {
    const local = readLocal().filter((p) => p.id !== plan.id);
    if (this.mode === 'cloud') {
      const { error } = await supabase.from('budget_plans').upsert({
        id: plan.id,
        program_title: plan.programTitle,
        program_date: plan.programDate,
        total_amount: planTotal(plan),
        data: plan,
        updated_at: plan.updatedAt,
      });
      if (!error) return;
      console.warn('Cloud save failed, saving locally:', error.message);
      this.mode = 'local';
    }
    writeLocal([plan, ...local]);
  },

  async remove(id: string): Promise<void> {
    writeLocal(readLocal().filter((p) => p.id !== id));
    if (this.mode === 'cloud') {
      const { error } = await supabase.from('budget_plans').delete().eq('id', id);
      if (error) throw error;
    }
  },
};

// ---------- AI market price search (Supabase Edge Function) ----------

export interface MarketPrice {
  name: string;
  unit: string;
  price: number | null;
  low: number | null;
  high: number | null;
  source: string;
  sourceUrl: string;
  note: string;
}

const AI_BATCH = 8;

export const searchMarketPrices = async (
  items: { name: string; unit: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<MarketPrice[]> => {
  const out: MarketPrice[] = [];
  for (let i = 0; i < items.length; i += AI_BATCH) {
    const batch = items.slice(i, i + AI_BATCH);
    const { data, error } = await supabase.functions.invoke('price-search', {
      body: { items: batch, location: 'Dhaka, Bangladesh' },
    });
    if (error) {
      let message = error.message;
      try {
        const ctx = (error as any).context;
        if (ctx && typeof ctx.json === 'function') {
          const body = await ctx.json();
          if (body?.error) message = body.error;
        }
      } catch {
        /* keep the generic message */
      }
      if (/Failed to send a request|not found|404/i.test(message)) {
        message = 'AI price search is not set up yet. Deploy the "price-search" Supabase Edge Function and set ANTHROPIC_API_KEY (see README).';
      }
      throw new Error(message);
    }
    out.push(...((data?.prices || []) as MarketPrice[]));
    onProgress?.(Math.min(i + AI_BATCH, items.length), items.length);
  }
  return out;
};

// ---------- Inventory matching ----------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g, ' ').replace(/\s+/g, ' ').trim();

// "Onion (পিয়াজ)", "Onion - পিঁয়াজ", "Jira /Cumin - জিরা" → every name variant on its own,
// with pack sizes like "200 gm" / "500 ml" dropped.
const nameParts = (name: string) =>
  name
    .split(/[()]|\s[-–]\s?|\s?[-–]\s|\/|_/)
    .map((p) => norm(p.replace(/\b\d+(\.\d+)?\s*(gm|g|kg|ml|l|ltr|litre|pcs)\b\+?/gi, ' ')))
    .filter((p) => p.length >= 2);

const editDistance = (a: string, b: string) => {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
};

const partScore = (q: string, c: string) => {
  if (q === c) return 100;
  // Spelling variants: Aromatic/Aerometic, Darucini/Daruchini, বোকারা/বোখরা
  const d = editDistance(q, c);
  if (Math.min(q.length, c.length) >= 4 && d <= Math.max(1, Math.floor(Math.max(q.length, c.length) * 0.25))) return 80 - d * 5;
  // Whole-word containment: "chili powder" ⊂ "red chili powder"; extra words lower the score
  if (q.length >= 3 && c.length >= 3 && (` ${c} `.includes(` ${q} `) || ` ${q} `.includes(` ${c} `))) {
    return 50 - Math.abs(c.split(' ').length - q.split(' ').length) * 15;
  }
  return 0;
};

/** Best-effort match of a free-text item name (English and/or Bangla) to an inventory ingredient. */
export const matchIngredient = <T extends { id: string; name: string }>(name: string, list: T[]): T | undefined => {
  const qParts = nameParts(name);
  if (!qParts.length) return undefined;
  const qFull = norm(name);
  let best: T | undefined;
  let bestScore = 0;
  for (const item of list) {
    if (norm(item.name) === qFull) return item;
    const cParts = nameParts(item.name);
    let score = 0;
    for (const q of qParts) for (const c of cParts) score = Math.max(score, partScore(q, c));
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 40 ? best : undefined;
};

// ---------- Exports ----------

const safeFileName = (p: BudgetPlan) =>
  `Budget_${(p.programTitle || 'Program').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')}_${p.programDate || ''}`;

const csvCell = (v: string | number) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const sectionHeading = (s: BudgetSection) =>
  `${s.title}${s.time ? ` (Time: ${s.time})` : ''}${s.menu ? ` — ${s.menu}` : ''}`;

export const exportBudgetCSV = (p: BudgetPlan) => {
  const rows: (string | number)[][] = [];
  const blank = () => rows.push([]);
  const total = planTotal(p);

  rows.push([p.organization]);
  if (p.office) rows.push([`(${p.office})`]);
  rows.push([`Budget Approval for: ${p.programTitle || 'Untitled program'}${p.programDate ? ` (${fmtDateLong(p.programDate)})` : ''}`]);
  blank();
  rows.push(['SL No.', 'Items', 'Unit', 'Quantity', 'Rate (BDT)', 'Total Amount (BDT)', 'Remarks', 'Rate Source']);

  let sl = 0;
  p.sections.forEach((s) => {
    rows.push([sectionHeading(s)]);
    s.items.forEach((it) => {
      if (!it.name.trim()) return;
      sl += 1;
      rows.push([
        sl,
        it.name,
        it.unit,
        Number(it.quantity) || 0,
        it.rate ? round2(it.rate).toFixed(2) : '-',
        it.rate ? itemTotal(it).toFixed(2) : '-',
        it.remarks || '',
        it.rateSource === 'ai' ? `AI market${it.aiSource ? ` (${it.aiSource})` : ''}` : it.rateSource === 'inventory' ? 'Inventory' : 'Manual',
      ]);
    });
    rows.push(['', '', '', '', 'Sub Total', sectionTotal(s).toFixed(2)]);
    blank();
  });

  rows.push(['', '', '', '', 'Total Amount', total.toFixed(2)]);
  rows.push(['', '', '', '', 'Total Participant', `${p.participants || 0} Person`]);
  rows.push(['', '', '', '', 'Cost Per Head', perHead(p).toFixed(2), p.perHeadLabel || '']);
  blank();
  rows.push([`In Word: ${amountInWords(total)}`]);
  if (p.notes) rows.push([`Notes: ${p.notes}`]);
  if (p.preparedBy) rows.push([`Prepared by: ${p.preparedBy}`]);
  rows.push([`Generated: ${new Date().toLocaleString('en-GB')}`]);

  // BOM so Excel opens Bangla text correctly.
  const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(p)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const esc = (s: string | number | undefined) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const buildBudgetPrintHTML = (p: BudgetPlan) => {
  const total = planTotal(p);
  let sl = 0;
  const body = p.sections
    .map((s) => {
      const items = s.items.filter((it) => it.name.trim());
      const rows = items
        .map((it) => {
          sl += 1;
          return `<tr>
            <td class="c">${sl}</td>
            <td>${esc(it.name)}</td>
            <td class="c">${esc(it.unit)}</td>
            <td class="c num">${fmtQty(it.quantity)}</td>
            <td class="r num">${it.rate ? fmtMoney(it.rate) : '–'}</td>
            <td class="r num">${it.rate ? fmtMoney(itemTotal(it)) : '–'}</td>
            <td class="c rem">${esc(it.remarks)}</td>
          </tr>`;
        })
        .join('');
      return `<tbody class="sec">
        <tr class="sec-head"><td colspan="7">
          <span class="sec-title">${esc(s.title)}</span>${s.time ? `<span class="sec-time">${esc(s.time)}</span>` : ''}
          ${s.menu ? `<div class="sec-menu">${esc(s.menu)}</div>` : ''}
        </td></tr>
        ${rows || '<tr><td colspan="7" class="c muted">No items</td></tr>'}
        <tr class="sub"><td colspan="5" class="r">Sub Total</td><td class="r num">${fmtMoney(sectionTotal(s))}</td><td></td></tr>
      </tbody>`;
    })
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(safeFileName(p))}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 14mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', 'Noto Sans Bengali', system-ui, sans-serif; color: #0f172a; margin: 0; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .num { font-variant-numeric: tabular-nums; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 12px; }
  .org { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .office { font-size: 12px; color: #475569; font-weight: 600; margin-top: 2px; }
  .doc-tag { text-align: right; }
  .doc-tag .t { display: inline-block; background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; }
  .doc-tag .d { color: #64748b; font-size: 10px; margin-top: 6px; }
  .title { margin: 16px 0 4px; font-size: 12px; color: #475569; }
  .title b { display: block; font-size: 17px; color: #0f172a; font-weight: 800; margin-top: 2px; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0 16px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #f8fafc; }
  .card .k { font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: #64748b; font-weight: 700; }
  .card .v { font-size: 16px; font-weight: 800; margin-top: 3px; }
  .card.hl { background: linear-gradient(135deg, #4f46e5, #7c3aed); border-color: transparent; color: #fff; }
  .card.hl .k { color: #e0e7ff; }
  table { width: 100%; border-collapse: collapse; font-size: inherit; }
  thead { display: table-header-group; }
  th { background: #1e1b4b; color: #fff; font-size: 9.5px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; padding: 8px 6px; }
  th:first-child { border-top-left-radius: 6px; } th:last-child { border-top-right-radius: 6px; }
  td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tbody.sec tr:not(.sec-head):not(.sub):nth-child(even) td { background: #fafbff; }
  tr { page-break-inside: avoid; }
  .c { text-align: center; } .r { text-align: right; }
  .rem { font-size: 9.5px; font-weight: 600; font-style: italic; color: #334155; }
  .muted { color: #94a3b8; }
  .sec-head td { background: #eef2ff !important; border-top: 10px solid #fff; border-bottom: 1px solid #c7d2fe; padding: 7px 8px; }
  .sec-title { font-weight: 800; font-size: 11.5px; color: #3730a3; }
  .sec-time { margin-left: 8px; font-size: 9.5px; font-weight: 700; color: #6366f1; background: #fff; border: 1px solid #c7d2fe; border-radius: 999px; padding: 1px 7px; }
  .sec-menu { font-size: 10px; color: #475569; margin-top: 3px; }
  .sub td { background: #f1f5f9 !important; font-weight: 700; font-style: italic; border-bottom: 1px solid #cbd5e1; }
  .totals { margin-top: 14px; margin-left: auto; width: 55%; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; page-break-inside: avoid; }
  .totals div { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
  .totals div:last-child { border-bottom: 0; }
  .totals .grand { background: #1e1b4b; color: #fff; font-size: 13px; font-weight: 800; }
  .totals .ph span:last-child { font-weight: 800; }
  .words { margin-top: 12px; padding: 10px 12px; border-left: 4px solid #4f46e5; background: #f8fafc; font-weight: 700; font-style: italic; page-break-inside: avoid; }
  .notes { margin-top: 10px; font-size: 10.5px; color: #334155; white-space: pre-wrap; }
  .sign { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 56px; page-break-inside: avoid; }
  .sign div { border-top: 1px solid #0f172a; padding-top: 6px; text-align: center; font-size: 10px; font-weight: 700; color: #334155; }
  .sign small { display: block; font-weight: 500; color: #64748b; margin-top: 2px; }
  .foot { margin-top: 22px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
</style></head>
<body>
  <div class="head">
    <div><div class="org">${esc(p.organization)}</div>${p.office ? `<div class="office">${esc(p.office)}</div>` : ''}</div>
    <div class="doc-tag"><span class="t">Budget Approval</span><div class="d">Ref: ${esc(p.id.slice(-8).toUpperCase())}</div></div>
  </div>
  <div class="title">Budget Approval for <b>${esc(p.programTitle || 'Untitled program')}${p.programDate ? ` (${esc(fmtDateLong(p.programDate))})` : ''}</b></div>
  <div class="cards">
    <div class="card"><div class="k">Participants</div><div class="v num">${p.participants || 0} Person</div></div>
    <div class="card"><div class="k">Cost per head${p.perHeadLabel ? ` · ${esc(p.perHeadLabel)}` : ''}</div><div class="v num">৳ ${fmtMoney(perHead(p))}</div></div>
    <div class="card hl"><div class="k">Total budget</div><div class="v num">৳ ${fmtMoney(total)}</div></div>
  </div>
  <table>
    <thead><tr>
      <th style="width:6%">SL</th><th style="text-align:left;width:34%">Items</th><th style="width:8%">Unit</th>
      <th style="width:9%">Qty</th><th style="width:11%;text-align:right">Rate</th><th style="width:14%;text-align:right">Total (৳)</th><th style="width:18%">Remarks</th>
    </tr></thead>
    ${body}
  </table>
  <div class="totals">
    <div class="grand"><span>Total Amount</span><span class="num">৳ ${fmtMoney(total)}</span></div>
    <div><span>Total Participant</span><span class="num">${p.participants || 0} Person</span></div>
    <div class="ph"><span>Cost Per Head${p.perHeadLabel ? ` <i style="color:#64748b;font-weight:500">(${esc(p.perHeadLabel)})</i>` : ''}</span><span class="num">৳ ${fmtMoney(perHead(p))}</span></div>
  </div>
  <div class="words">In Word: ${esc(amountInWords(total))}</div>
  ${p.notes ? `<div class="notes"><b>Notes:</b> ${esc(p.notes)}</div>` : ''}
  <div class="sign">
    <div>Prepared by${p.preparedBy ? `<small>${esc(p.preparedBy)}</small>` : ''}</div>
    <div>Checked by</div>
    <div>Recommended by</div>
    <div>Approved by</div>
  </div>
  <div class="foot"><span>Generated by ACI Canteen Management OS</span><span>${esc(new Date().toLocaleString('en-GB'))}</span></div>
</body></html>`;
};

/** Opens the browser print dialog on a styled A4 document — choose "Save as PDF". */
export const exportBudgetPDF = (p: BudgetPlan) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) return;
  doc.open();
  doc.write(buildBudgetPrintHTML(p));
  doc.close();
  const win = iframe.contentWindow;
  const prevTitle = document.title;
  let printed = false;
  const go = () => {
    if (printed) return;
    printed = true;
    // Chrome suggests the PDF file name from the top document's title.
    document.title = safeFileName(p);
    win.focus();
    win.print();
    document.title = prevTitle;
    setTimeout(() => iframe.remove(), 1000);
  };
  // Give the stylesheet a moment, then wait for web fonts (Bangla glyphs) — capped so a slow CDN never blocks printing.
  setTimeout(() => {
    const fonts = (doc as any).fonts;
    if (fonts?.ready) fonts.ready.then(go);
    setTimeout(go, 2500);
  }, 400);
};
