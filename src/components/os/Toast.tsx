"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface Toast {
  id: number;
  text: string;
  icon?: string;
}

const ToastCtx = createContext<((text: string, icon?: string) => void) | null>(null);

/** Small notification bubbles under the menu bar (Easter eggs, hints). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, icon?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, icon }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="os-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="os-toast">
            {t.icon && <span className="os-toast-icon" aria-hidden>{t.icon}</span>}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
