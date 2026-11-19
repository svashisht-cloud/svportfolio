"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ContextEntry = "sep" | { label: string; run: () => void; disabled?: boolean };

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextEntry[];
}

/** Right-click menu, styled like the menu bar menus and kept fully on screen. */
export default function ContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState;
  onClose: () => void;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });

  // Flip/clamp so the menu never runs off the edge of the screen.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = menu.x + r.width > window.innerWidth - 4 ? Math.max(4, menu.x - r.width) : menu.x;
    const top = menu.y + r.height > window.innerHeight - 4 ? Math.max(26, menu.y - r.height) : menu.y;
    setPos({ left, top });
    el.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [menu]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return (
    <ul
      ref={ref}
      className="os-menu os-context"
      role="menu"
      style={pos}
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.items.map((it, i) =>
        it === "sep" ? (
          <li key={`sep-${i}`} className="os-menu-sep" role="separator" />
        ) : (
          <li key={it.label} role="none">
            <button
              type="button"
              role="menuitem"
              className="os-menu-item"
              disabled={it.disabled}
              onClick={() => {
                onClose();
                it.run();
              }}
            >
              <span className="os-menu-check" aria-hidden />
              <span className="os-menu-label">{it.label}</span>
            </button>
          </li>
        ),
      )}
    </ul>
  );
}
