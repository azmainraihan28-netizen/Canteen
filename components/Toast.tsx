import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { genId } from '../services/id';

type ToastKind = 'success' | 'error' | 'info';

interface BaseToast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}
interface ActionToast extends BaseToast {
  action?: { label: string; onClick: () => void };
  timeout?: number; // ms, 0 = no auto-dismiss
}
interface ConfirmToast {
  id: string;
  kind: 'confirm';
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  resolve: (v: boolean) => void;
}

type AnyToast = ActionToast | ConfirmToast;

interface ToastAPI {
  push: (t: Omit<ActionToast, 'id' | 'kind'> & { kind?: ToastKind }) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string, action?: ActionToast['action']) => string;
  info: (title: string, description?: string) => string;
  confirm: (opts: {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
  dismiss: (id: string) => void;
}

const ToastCtx = createContext<ToastAPI | null>(null);

export const useToast = (): ToastAPI => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

const KIND_META: Record<ToastKind | 'confirm', { icon: any; color: string; ring: string; text: string; bar: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', ring: 'ring-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', bar: 'from-emerald-400 to-teal-400' },
  error:   { icon: AlertTriangle, color: 'text-rose-500',    ring: 'ring-rose-500/20',    text: 'text-rose-700 dark:text-rose-300',       bar: 'from-rose-400 to-red-500' },
  info:    { icon: Info,          color: 'text-indigo-500',  ring: 'ring-indigo-500/20',  text: 'text-indigo-700 dark:text-indigo-300',   bar: 'from-indigo-400 to-violet-500' },
  confirm: { icon: AlertCircle,   color: 'text-amber-500',   ring: 'ring-amber-500/20',   text: 'text-amber-700 dark:text-amber-300',     bar: 'from-amber-400 to-orange-500' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<AnyToast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const scheduleAutoDismiss = useCallback((id: string, ms: number) => {
    const timer = setTimeout(() => dismiss(id), ms);
    timers.current.set(id, timer);
  }, [dismiss]);

  const api = useMemo<ToastAPI>(() => ({
    push: (t) => {
      const id = genId('t_');
      const kind: ToastKind = t.kind ?? 'info';
      const toast: ActionToast = { id, kind, title: t.title, description: t.description, action: t.action, timeout: t.timeout };
      setItems((prev) => [toast, ...prev].slice(0, 6));
      if ((toast.timeout ?? 4000) > 0) scheduleAutoDismiss(id, toast.timeout ?? 4000);
      return id;
    },
    success: (title, description) => {
      const id = genId('t_');
      setItems((prev) => [{ id, kind: 'success', title, description, timeout: 3500 } as ActionToast, ...prev].slice(0, 6));
      scheduleAutoDismiss(id, 3500);
      return id;
    },
    error: (title, description, action) => {
      const id = genId('t_');
      setItems((prev) => [{ id, kind: 'error', title, description, action, timeout: action ? 8000 : 5000 } as ActionToast, ...prev].slice(0, 6));
      scheduleAutoDismiss(id, action ? 8000 : 5000);
      return id;
    },
    info: (title, description) => {
      const id = genId('t_');
      setItems((prev) => [{ id, kind: 'info', title, description, timeout: 3500 } as ActionToast, ...prev].slice(0, 6));
      scheduleAutoDismiss(id, 3500);
      return id;
    },
    confirm: ({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false }) =>
      new Promise<boolean>((resolve) => {
        const id = genId('t_');
        setItems((prev) => [
          { id, kind: 'confirm', title, description, confirmLabel, cancelLabel, destructive, resolve } as ConfirmToast,
          ...prev,
        ]);
      }),
    dismiss,
  }), [dismiss, scheduleAutoDismiss]);

  // Cleanup timers on unmount
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastRegion items={items} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
};

const ToastRegion: React.FC<{ items: AnyToast[]; dismiss: (id: string) => void }> = ({ items, dismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-[calc(100vw-2rem)] w-[380px] pointer-events-none"
    >
      {items.map((t) => (
        <ToastCard key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: AnyToast; dismiss: (id: string) => void }> = ({ toast, dismiss }) => {
  const meta = KIND_META[toast.kind];
  const Icon = meta.icon;
  const isConfirm = toast.kind === 'confirm';

  return (
    <div className="panel !p-0 pointer-events-auto overflow-hidden animate-fade-scale relative">
      <span className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${meta.bar} opacity-90`} />
      <div className="p-3.5 flex items-start gap-3">
        <div className={`w-8 h-8 shrink-0 rounded-lg bg-slate-500/5 ring-1 ${meta.ring} flex items-center justify-center ${meta.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white leading-snug">{toast.title}</p>
          {toast.description && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{toast.description}</p>
          )}
          {isConfirm ? (
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => { (toast as ConfirmToast).resolve(false); dismiss(toast.id); }}
                className="chip !py-1.5 !px-3 !text-[11.5px]"
              >
                {(toast as ConfirmToast).cancelLabel}
              </button>
              <button
                onClick={() => { (toast as ConfirmToast).resolve(true); dismiss(toast.id); }}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold text-white transition ${
                  (toast as ConfirmToast).destructive
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-rose-500/30'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/30'
                }`}
              >
                {(toast as ConfirmToast).confirmLabel}
              </button>
            </div>
          ) : (toast as ActionToast).action ? (
            <button
              onClick={() => { (toast as ActionToast).action!.onClick(); dismiss(toast.id); }}
              className="mt-2 text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
            >
              {(toast as ActionToast).action!.label}
            </button>
          ) : null}
        </div>
        {!isConfirm && (
          <button
            onClick={() => dismiss(toast.id)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-500/10 transition"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
