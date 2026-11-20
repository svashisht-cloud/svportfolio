"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ToastOptions {
  /** Makes the toast a button; clicking it runs this and dismisses the toast. */
  onClick?: () => void;
  /** How long it stays up (ms). */
  ms?: number;
}

interface Toast extends ToastOptions {
  id: number;
  text: string;
  icon?: string;
}

type ShowToast = (text: string, icon?: string, options?: ToastOptions) => void;

const ToastCtx = createContext<ShowToast | null>(null);

/** Small notification bubbles under the menu bar (Easter eggs, hints, Software Update). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback<ShowToast>(
    (text, icon, options) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, text, icon, ...options }]);
      window.setTimeout(() => dismiss(id), options?.ms ?? 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="os-toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const body = (
            <>
              {t.icon && <span className="os-toast-icon" aria-hidden>{t.icon}</span>}
              <span>{t.text}</span>
            </>
          );
          return t.onClick ? (
            <button
              key={t.id}
              type="button"
              className="os-toast is-action"
              onClick={() => {
                dismiss(t.id);
                t.onClick?.();
              }}
            >
              {body}
            </button>
          ) : (
            <div key={t.id} className="os-toast">
              {body}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
