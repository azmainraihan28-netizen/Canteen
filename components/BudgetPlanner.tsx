import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator, Plus, Trash2, Copy, FileDown, FileSpreadsheet, Sparkles, PackageOpen, Loader2, Save,
  FolderOpen, ChevronDown, ChevronUp, Users, Wallet, ExternalLink, CloudOff, Cloud, X, ArrowUp, ArrowDown,
} from 'lucide-react';
import { BudgetItem, BudgetPlan, BudgetSection, Ingredient, UserRole } from '../types';
import {
  amountInWords, budgetStore, duplicatePlan, exportBudgetCSV, exportBudgetPDF, fmtMoney, itemTotal, matchIngredient,
  newItem, newPlan, newSection, perHead, planTotal, round2, searchMarketPrices, sectionTotal,
} from '../services/budget';

interface BudgetPlannerProps {
  ingredients: Ingredient[];
  userRole: UserRole;
}

type AiApplyMode = 'empty' | 'all' | 'compare';

const UNITS = ['KG', 'Gram', 'Litre', 'ML', 'PCS', 'Dozen', 'Packet', 'Box', 'Bottle', 'Can', 'Bundle', 'Person', 'Plate', 'Set', 'Day', 'Trip', 'Job'];

const inputCls =
  'w-full bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/15 transition disabled:opacity-70';

const labelCls = 'block text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-1';

const SOURCE_BADGE: Record<BudgetItem['rateSource'], { label: string; cls: string }> = {
  manual: { label: 'Manual', cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20' },
  inventory: { label: 'Inventory', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
  ai: { label: 'AI market', cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20' },
};

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ ingredients, userRole }) => {
  const readOnly = userRole !== 'ADMIN';

  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [plan, setPlan] = useState<BudgetPlan>(() => newPlan());
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [storageMode, setStorageMode] = useState(budgetStore.mode);
  const [showList, setShowList] = useState(false);

  const [aiMode, setAiMode] = useState<AiApplyMode>('empty');
  const [aiBusy, setAiBusy] = useState<{ done: number; total: number } | null>(null);
  const [aiRowBusy, setAiRowBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const isNew = !plans.some((p) => p.id === plan.id);

  // ---------- Load ----------
  useEffect(() => {
    let alive = true;
    budgetStore.list().then((list) => {
      if (!alive) return;
      setPlans(list);
      setStorageMode(budgetStore.mode);
      if (list.length) setPlan(list[0]);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  // ---------- Autosave (debounced) ----------
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (readOnly || saveState !== 'dirty') return;
    // Don't litter storage with untouched blank plans.
    if (isNew && !plan.programTitle.trim()) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => persist(plan), 1200);
    return () => window.clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, saveState]);

  // Bumped on every edit so a save that finishes after newer edits doesn't mark them as saved.
  const editVersion = useRef(0);

  const persist = async (p: BudgetPlan) => {
    const version = editVersion.current;
    setSaveState('saving');
    const stamped = { ...p, updatedAt: new Date().toISOString() };
    await budgetStore.save(stamped);
    setStorageMode(budgetStore.mode);
    setPlans((prev) => [stamped, ...prev.filter((x) => x.id !== stamped.id)]);
    setPlan((cur) => (cur.id === stamped.id ? { ...cur, updatedAt: stamped.updatedAt } : cur));
    setSaveState(editVersion.current === version ? 'saved' : 'dirty');
  };

  const flash = (tone: 'ok' | 'err', text: string) => {
    setNotice({ tone, text });
    if (tone === 'ok') window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 4000);
  };

  // ---------- Mutators ----------
  const update = (fn: (p: BudgetPlan) => BudgetPlan) => {
    if (readOnly) return;
    editVersion.current += 1;
    setPlan((p) => fn(p));
    setSaveState('dirty');
  };
  const setField = <K extends keyof BudgetPlan>(k: K, v: BudgetPlan[K]) => update((p) => ({ ...p, [k]: v }));
  const updateSection = (sid: string, patch: Partial<BudgetSection>) =>
    update((p) => ({ ...p, sections: p.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));
  const updateItem = (sid: string, iid: string, patch: Partial<BudgetItem>) =>
    update((p) => ({
      ...p,
      sections: p.sections.map((s) =>
        s.id === sid ? { ...s, items: s.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : s,
      ),
    }));
  const addItem = (sid: string) =>
    update((p) => ({ ...p, sections: p.sections.map((s) => (s.id === sid ? { ...s, items: [...s.items, newItem()] } : s)) }));
  const removeItem = (sid: string, iid: string) =>
    update((p) => ({ ...p, sections: p.sections.map((s) => (s.id === sid ? { ...s, items: s.items.filter((it) => it.id !== iid) } : s)) }));
  const moveSection = (sid: string, dir: -1 | 1) =>
    update((p) => {
      const i = p.sections.findIndex((s) => s.id === sid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.sections.length) return p;
      const next = [...p.sections];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...p, sections: next };
    });
  const removeSection = (sid: string) => {
    const s = plan.sections.find((x) => x.id === sid);
    if (s && s.items.some((it) => it.name.trim()) && !window.confirm(`Remove section "${s.title}" and its items?`)) return;
    update((p) => ({ ...p, sections: p.sections.filter((x) => x.id !== sid) }));
  };

  // Inventory lookup per item (explicit link first, then name match).
  const invFor = (it: BudgetItem) =>
    (it.ingredientId && ingredients.find((i) => i.id === it.ingredientId)) || matchIngredient(it.name, ingredients);

  const onItemName = (sid: string, it: BudgetItem, name: string) => {
    const exact = ingredients.find((i) => i.name.toLowerCase() === name.trim().toLowerCase());
    if (exact) {
      updateItem(sid, it.id, {
        name,
        ingredientId: exact.id,
        unit: exact.unit || it.unit,
        ...(it.rate ? {} : { rate: round2(exact.unitPrice), rateSource: 'inventory' as const }),
      });
    } else {
      updateItem(sid, it.id, { name, ingredientId: it.ingredientId && invFor({ ...it, name })?.id === it.ingredientId ? it.ingredientId : undefined });
    }
  };

  // ---------- Rate helpers ----------
  const fillFromInventory = () => {
    const n = plan.sections.reduce((c, s) => c + s.items.filter((it) => it.name.trim() && invFor(it)?.unitPrice).length, 0);
    if (!n) {
      flash('err', 'No items matched your inventory.');
      return;
    }
    update((p) => ({
      ...p,
      sections: p.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          const inv = it.name.trim() ? invFor(it) : undefined;
          if (!inv || !inv.unitPrice) return it;
          return { ...it, ingredientId: inv.id, rate: round2(inv.unitPrice), rateSource: 'inventory' as const };
        }),
      })),
    }));
    flash('ok', `Filled ${n} rate${n > 1 ? 's' : ''} from inventory.`);
  };

  const applyAiResults = (targets: { sid: string; iid: string }[], results: Awaited<ReturnType<typeof searchMarketPrices>>, mode: AiApplyMode) => {
    update((p) => ({
      ...p,
      sections: p.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          const idx = targets.findIndex((t) => t.sid === s.id && t.iid === it.id);
          if (idx < 0) return it;
          const r = results[idx];
          if (!r) return it;
          const next: BudgetItem = {
            ...it,
            aiPrice: r.price,
            aiLow: r.low,
            aiHigh: r.high,
            aiSource: r.source,
            aiSourceUrl: r.sourceUrl,
            aiNote: r.note,
          };
          if (r.price && (mode === 'all' || (mode === 'empty' && !it.rate))) {
            next.rate = round2(r.price!);
            next.rateSource = 'ai';
          }
          return next;
        }),
      })),
    }));
  };

  const runAiSearch = async () => {
    const targets: { sid: string; iid: string; name: string; unit: string }[] = [];
    plan.sections.forEach((s) =>
      s.items.forEach((it) => {
        if (!it.name.trim()) return;
        if (aiMode === 'empty' && it.rate) return;
        targets.push({ sid: s.id, iid: it.id, name: it.name.trim(), unit: it.unit || 'unit' });
      }),
    );
    if (!targets.length) {
      flash('err', aiMode === 'empty' ? 'Every item already has a rate. Switch to "All items" or "Compare only".' : 'Add some items first.');
      return;
    }
    setNotice(null);
    setAiBusy({ done: 0, total: targets.length });
    try {
      const results = await searchMarketPrices(
        targets.map((t) => ({ name: t.name, unit: t.unit })),
        (done, total) => setAiBusy({ done, total }),
      );
      applyAiResults(targets, results, aiMode);
      const found = results.filter((r) => r?.price).length;
      flash('ok', `AI found market prices for ${found} of ${targets.length} item${targets.length > 1 ? 's' : ''}${aiMode === 'compare' ? ' — shown under each rate for comparison.' : ' and filled them in.'}`);
    } catch (e: any) {
      flash('err', e?.message || 'AI price search failed.');
    } finally {
      setAiBusy(null);
    }
  };

  const runAiForRow = async (sid: string, it: BudgetItem) => {
    if (!it.name.trim()) return;
    setAiRowBusy(it.id);
    try {
      const results = await searchMarketPrices([{ name: it.name.trim(), unit: it.unit || 'unit' }]);
      applyAiResults([{ sid, iid: it.id }], results, 'all');
      if (!results[0]?.price) flash('err', `AI couldn't find a market price for "${it.name}".`);
    } catch (e: any) {
      flash('err', e?.message || 'AI price search failed.');
    } finally {
      setAiRowBusy(null);
    }
  };

  // ---------- Plan management ----------
  const startNew = () => {
    setPlan(newPlan());
    setSaveState('saved');
    setShowList(false);
  };
  const openPlan = (p: BudgetPlan) => {
    setPlan(p);
    setSaveState('saved');
    setShowList(false);
  };
  const duplicate = () => {
    const copy = duplicatePlan(plan);
    setPlan(copy);
    setSaveState('dirty');
    flash('ok', 'Duplicated — edit and it saves automatically.');
  };
  const removePlan = async () => {
    if (!window.confirm(`Delete budget "${plan.programTitle || 'Untitled'}"? This cannot be undone.`)) return;
    try {
      await budgetStore.remove(plan.id);
      const rest = plans.filter((p) => p.id !== plan.id);
      setPlans(rest);
      setPlan(rest[0] || newPlan());
      setSaveState('saved');
    } catch (e: any) {
      flash('err', `Delete failed: ${e?.message || e}`);
    }
  };
  const saveNow = () => {
    if (!plan.programTitle.trim()) {
      flash('err', 'Give the program a title before saving.');
      return;
    }
    window.clearTimeout(saveTimer.current);
    persist(plan).then(() => flash('ok', 'Budget saved.'));
  };

  // ---------- Derived ----------
  const total = planTotal(plan);
  const head = perHead(plan);
  const itemCount = plan.sections.reduce((n, s) => n + s.items.filter((it) => it.name.trim()).length, 0);
  const missingRates = plan.sections.reduce((n, s) => n + s.items.filter((it) => it.name.trim() && !it.rate).length, 0);
  const sourceMix = useMemo(() => {
    const m = { manual: 0, inventory: 0, ai: 0 };
    plan.sections.forEach((s) => s.items.forEach((it) => { if (it.name.trim() && it.rate) m[it.rateSource] += itemTotal(it); }));
    return m;
  }, [plan]);

  let serial = 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-slate-500">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading budgets…
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <datalist id="budget-ingredients">
        {ingredients.map((i) => <option key={i.id} value={i.name} />)}
      </datalist>
      <datalist id="budget-units">
        {UNITS.map((u) => <option key={u} value={u} />)}
      </datalist>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="chip"><Calculator size={11} /> Program budgets</span>
            <span className={`chip ${storageMode === 'cloud' ? '!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500/20' : '!bg-amber-500/10 !text-amber-700 dark:!text-amber-300 !border-amber-500/20'}`}
              title={storageMode === 'cloud' ? 'Budgets are stored in the database' : 'The budget_plans table is missing — budgets are saved in this browser only. Run supabase_schema.sql to sync.'}>
              {storageMode === 'cloud' ? <Cloud size={11} /> : <CloudOff size={11} />}
              {storageMode === 'cloud' ? 'Synced' : 'This device only'}
            </span>
            {!readOnly && (
              <span className="chip">
                {saveState === 'saving' ? <><Loader2 size={11} className="animate-spin" /> Saving…</> :
                  saveState === 'dirty' ? (isNew && !plan.programTitle.trim() ? 'Add a title to save' : 'Unsaved changes') : 'All changes saved'}
              </span>
            )}
          </div>
          <h2 className="font-display text-3xl md:text-[38px] font-extrabold text-gradient-mesh tracking-tight leading-[1.05]">Budget planner</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Plan any program’s budget with inventory or live AI market prices, then export PDF / CSV</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowList((v) => !v)} className="panel !rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-2 hover:!border-indigo-500/40">
              <FolderOpen size={15} /> Saved <span className="num text-slate-400">({plans.length})</span>
              {showList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showList && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto panel !rounded-xl p-1.5 z-30 shadow-soft-lg">
                {plans.length === 0 && <p className="text-[12px] text-slate-500 p-3 text-center">No saved budgets yet.</p>}
                {plans.map((p) => (
                  <button key={p.id} onClick={() => openPlan(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-500/10 transition ${p.id === plan.id ? 'bg-indigo-500/10' : ''}`}>
                    <div className="text-[13px] font-semibold truncate">{p.programTitle || 'Untitled program'}</div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>{p.programDate}</span><span className="num">৳{fmtMoney(planTotal(p))}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!readOnly && (
            <>
              <button onClick={startNew} className="panel !rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5 hover:!border-indigo-500/40"><Plus size={15} /> New</button>
              <button onClick={duplicate} className="panel !rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5 hover:!border-indigo-500/40" title="Duplicate this budget"><Copy size={14} /></button>
              {!isNew && <button onClick={removePlan} className="panel !rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5 text-rose-600 hover:!border-rose-500/40" title="Delete this budget"><Trash2 size={14} /></button>}
              <button onClick={saveNow} className="panel !rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5 hover:!border-indigo-500/40"><Save size={14} /> Save</button>
            </>
          )}
          <button onClick={() => exportBudgetCSV(plan)} className="panel !rounded-xl px-3 py-2 text-[13px] font-semibold flex items-center gap-1.5 hover:!border-emerald-500/40">
            <FileSpreadsheet size={15} className="text-emerald-600" /> CSV
          </button>
          <button onClick={() => exportBudgetPDF(plan)}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold flex items-center gap-1.5 text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-glow-violet hover:brightness-110 transition">
            <FileDown size={15} /> Export PDF
          </button>
        </div>
      </div>

      {notice && (
        <div className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-[13px] ${notice.tone === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200' : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-200'}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      <fieldset disabled={readOnly} className="space-y-6 min-w-0">
        {/* Program details */}
        <div className="panel p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className={labelCls}>Program title</label>
              <input className={`${inputCls} !text-[15px] font-semibold`} placeholder="e.g. Sales Program of ACI Salt"
                value={plan.programTitle} onChange={(e) => setField('programTitle', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Program date</label>
              <input type="date" className={inputCls} value={plan.programDate} onChange={(e) => setField('programDate', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Participants</label>
              <input type="number" min={0} className={`${inputCls} num`} value={plan.participants || ''}
                placeholder="0" onChange={(e) => setField('participants', Math.max(0, Number(e.target.value) || 0))} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Organization</label>
              <input className={inputCls} value={plan.organization} onChange={(e) => setField('organization', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Office / division</label>
              <input className={inputCls} value={plan.office} onChange={(e) => setField('office', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Per-head label</label>
              <input className={inputCls} placeholder="Full Day Meal" value={plan.perHeadLabel || ''} onChange={(e) => setField('perHeadLabel', e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Prepared by</label>
              <input className={inputCls} placeholder="Name, designation" value={plan.preparedBy || ''} onChange={(e) => setField('preparedBy', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Pricing tools */}
        <div className="panel p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Fill rates automatically</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">Use the price in your inventory, or let AI search today’s Dhaka market prices online. You can still edit any rate by hand.</p>
          </div>
          <button type="button" onClick={fillFromInventory}
            className="shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/15 transition">
            <PackageOpen size={15} /> Use inventory prices
          </button>
          <div className="shrink-0 flex items-stretch rounded-xl overflow-hidden border border-violet-500/30">
            <select value={aiMode} onChange={(e) => setAiMode(e.target.value as AiApplyMode)}
              className="bg-violet-500/5 text-[12px] font-semibold text-violet-800 dark:text-violet-200 px-2 outline-none border-r border-violet-500/30 dark:bg-slate-900">
              <option value="empty">Empty rates only</option>
              <option value="all">All items</option>
              <option value="compare">Compare only</option>
            </select>
            <button type="button" onClick={runAiSearch} disabled={!!aiBusy}
              className="px-3.5 py-2 text-[13px] font-semibold flex items-center gap-1.5 text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 transition disabled:opacity-80">
              {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {aiBusy ? `Searching ${aiBusy.done}/${aiBusy.total}…` : 'AI market prices'}
            </button>
          </div>
        </div>

        {/* Sections */}
        {plan.sections.map((s, si) => (
          <div key={s.id} className="panel overflow-hidden">
            <div className="p-4 border-b border-slate-200/70 dark:border-white/[0.06] bg-gradient-to-r from-indigo-500/[0.06] via-violet-500/[0.04] to-transparent">
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <input className={`${inputCls} md:max-w-xs !text-[14px] font-bold`} value={s.title} placeholder="Section (e.g. Lunch)"
                  onChange={(e) => updateSection(s.id, { title: e.target.value })} />
                <input className={`${inputCls} md:max-w-[130px]`} value={s.time || ''} placeholder="Time"
                  onChange={(e) => updateSection(s.id, { time: e.target.value })} />
                <input className={`${inputCls} flex-1`} value={s.menu || ''} placeholder="Menu / description (optional)"
                  onChange={(e) => updateSection(s.id, { menu: e.target.value })} />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="num text-[13px] font-bold text-indigo-700 dark:text-indigo-300 mr-2">৳{fmtMoney(sectionTotal(s))}</span>
                  <button type="button" onClick={() => moveSection(s.id, -1)} disabled={si === 0} className="p-1.5 rounded-lg hover:bg-slate-500/10 disabled:opacity-30" title="Move up"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveSection(s.id, 1)} disabled={si === plan.sections.length - 1} className="p-1.5 rounded-lg hover:bg-slate-500/10 disabled:opacity-30" title="Move down"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => removeSection(s.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10" title="Remove section"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-[13px]">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 border-b border-slate-200/70 dark:border-white/[0.06]">
                    <th className="py-2 pl-4 pr-2 text-left w-10">SL</th>
                    <th className="py-2 px-2 text-left">Item</th>
                    <th className="py-2 px-2 text-left w-24">Unit</th>
                    <th className="py-2 px-2 text-right w-24">Qty</th>
                    <th className="py-2 px-2 text-right w-56">Rate (৳)</th>
                    <th className="py-2 px-2 text-right w-32">Total (৳)</th>
                    <th className="py-2 px-2 text-left w-40">Remarks</th>
                    <th className="py-2 pr-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {s.items.map((it) => {
                    if (it.name.trim()) serial += 1;
                    const inv = it.name.trim() ? invFor(it) : undefined;
                    const badge = SOURCE_BADGE[it.rateSource];
                    return (
                      <tr key={it.id} className="border-b border-slate-200/50 dark:border-white/[0.04] align-top hover:bg-indigo-500/[0.03]">
                        <td className="py-2 pl-4 pr-2 text-slate-400 num pt-3.5">{it.name.trim() ? serial : ''}</td>
                        <td className="py-2 px-2">
                          <input list="budget-ingredients" className={inputCls} value={it.name} placeholder="Item name (type or pick from inventory)"
                            onChange={(e) => onItemName(s.id, it, e.target.value)} />
                        </td>
                        <td className="py-2 px-2">
                          <input list="budget-units" className={inputCls} value={it.unit}
                            onChange={(e) => updateItem(s.id, it.id, { unit: e.target.value })} />
                        </td>
                        <td className="py-2 px-2">
                          <input type="number" min={0} step="any" className={`${inputCls} text-right num`} value={it.quantity || ''} placeholder="0"
                            onChange={(e) => updateItem(s.id, it.id, { quantity: Math.max(0, Number(e.target.value) || 0) })} />
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} step="any" className={`${inputCls} text-right num`} value={it.rate || ''} placeholder="–"
                              onChange={(e) => updateItem(s.id, it.id, { rate: Math.max(0, Number(e.target.value) || 0), rateSource: 'manual' })} />
                            <button type="button" title="AI market price for this item" onClick={() => runAiForRow(s.id, it)} disabled={!it.name.trim() || aiRowBusy === it.id}
                              className="p-1.5 rounded-lg text-violet-600 dark:text-violet-300 hover:bg-violet-500/10 disabled:opacity-40 shrink-0">
                              {aiRowBusy === it.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            </button>
                          </div>
                          {it.name.trim() && (
                            <div className="flex flex-wrap gap-1 mt-1 justify-end">
                              {!!it.rate && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${badge.cls}`}>{badge.label}</span>}
                              {inv && !!inv.unitPrice && !(it.rateSource === 'inventory' && it.rate === round2(inv.unitPrice)) && (
                                <button type="button" onClick={() => updateItem(s.id, it.id, { rate: round2(inv.unitPrice), rateSource: 'inventory', ingredientId: inv.id })}
                                  title={`Use inventory price for ${inv.name}`}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 num">
                                  Inv ৳{fmtMoney(inv.unitPrice)}/{inv.unit}
                                </button>
                              )}
                              {!!it.aiPrice && !(it.rateSource === 'ai' && it.rate === round2(it.aiPrice)) && (
                                <button type="button" onClick={() => updateItem(s.id, it.id, { rate: round2(it.aiPrice!), rateSource: 'ai' })}
                                  title={`Use AI market price${it.aiSource ? ` (${it.aiSource})` : ''}`}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-violet-500/25 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 num">
                                  Mkt ৳{fmtMoney(it.aiPrice)}
                                </button>
                              )}
                            </div>
                          )}
                          {it.rateSource === 'ai' && (it.aiSource || it.aiLow || it.aiNote) && (
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 text-right leading-snug" title={it.aiNote}>
                              {it.aiLow && it.aiHigh ? <span className="num">৳{fmtMoney(it.aiLow)}–{fmtMoney(it.aiHigh)} · </span> : null}
                              {it.aiSourceUrl ? (
                                <a href={it.aiSourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-violet-600 inline-flex items-center gap-0.5">
                                  {it.aiSource || 'source'} <ExternalLink size={9} />
                                </a>
                              ) : it.aiSource}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right num font-semibold pt-3.5">{it.rate ? fmtMoney(itemTotal(it)) : '–'}</td>
                        <td className="py-2 px-2">
                          <input className={inputCls} value={it.remarks || ''} placeholder="Vendor / note"
                            onChange={(e) => updateItem(s.id, it.id, { remarks: e.target.value })} />
                        </td>
                        <td className="py-2 pr-4 pt-2.5">
                          <button type="button" onClick={() => removeItem(s.id, it.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10" title="Remove item">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="py-2.5 pl-4">
                      <button type="button" onClick={() => addItem(s.id)} className="text-[12.5px] font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-1 hover:underline">
                        <Plus size={14} /> Add item
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="text-[10.5px] uppercase tracking-wider text-slate-500 mr-2 whitespace-nowrap">Sub total</span>
                      <span className="num font-bold">{fmtMoney(sectionTotal(s))}</span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        <button type="button" onClick={() => update((p) => ({ ...p, sections: [...p.sections, newSection()] }))}
          className="w-full panel !border-dashed py-3 text-[13px] font-semibold text-indigo-600 dark:text-indigo-300 flex items-center justify-center gap-1.5 hover:!border-indigo-500/40">
          <Plus size={15} /> Add section (e.g. Dinner, Decoration, Transport)
        </button>

        <div className="panel p-5">
          <label className={labelCls}>Notes (printed on the PDF)</label>
          <textarea rows={2} className={inputCls} placeholder="e.g. Coffee machine will be available. Prices are approximate."
            value={plan.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
        </div>
      </fieldset>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="panel p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600" />
          <div className="relative text-white">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-indigo-100 flex items-center gap-1.5"><Wallet size={12} /> Total budget</p>
            <p className="font-display text-3xl font-extrabold num mt-1">৳{fmtMoney(total)}</p>
            <p className="text-[11.5px] text-indigo-100 mt-1">{itemCount} items · {plan.sections.length} sections{missingRates ? ` · ${missingRates} without rate` : ''}</p>
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5"><Users size={12} /> Cost per head</p>
          <p className="font-display text-3xl font-extrabold num mt-1 text-slate-900 dark:text-white">৳{fmtMoney(head)}</p>
          <p className="text-[11.5px] text-slate-500 mt-1">{plan.participants || 0} participants{plan.perHeadLabel ? ` · ${plan.perHeadLabel}` : ''}</p>
        </div>
        <div className="panel p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">Rate sources</p>
          {total > 0 ? (
            <>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-500/10">
                <div className="bg-emerald-500" style={{ width: `${(sourceMix.inventory / total) * 100}%` }} />
                <div className="bg-violet-500" style={{ width: `${(sourceMix.ai / total) * 100}%` }} />
                <div className="bg-slate-400" style={{ width: `${(sourceMix.manual / total) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-[11px]">
                <span className="text-emerald-700 dark:text-emerald-300">Inventory<br /><b className="num">৳{fmtMoney(sourceMix.inventory)}</b></span>
                <span className="text-violet-700 dark:text-violet-300">AI market<br /><b className="num">৳{fmtMoney(sourceMix.ai)}</b></span>
                <span className="text-slate-600 dark:text-slate-300">Manual<br /><b className="num">৳{fmtMoney(sourceMix.manual)}</b></span>
              </div>
            </>
          ) : <p className="text-[12px] text-slate-500">Add rates to see the breakdown.</p>}
        </div>
        <div className="md:col-span-3 panel px-5 py-3 text-[13px] italic font-semibold text-slate-700 dark:text-slate-200">
          In Word: {amountInWords(total)}
        </div>
      </div>
    </div>
  );
};
