"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrefs } from "./prefs";

export type ContextEntry =
  | "sep"
  | {
      label: string;
      run?: () => void;
      disabled?: boolean;
      /** Draws a ✓ and makes the item a checkbox; checkbox items leave the menu open when clicked. */
      checked?: boolean;
      /** Opens to the side on hover, focus or →. */
      submenu?: ContextEntry[];
    };

export interface ContextMenuState {
  x: number;
  y: number;
  /** A function is re-run on every render, so check marks follow the prefs while the menu stays open. */
  items: ContextEntry[] | (() => ContextEntry[]);
}

/** One level of the menu. Submenus are nested lists positioned beside their item. */
function MenuList({
  items,
  onClose,
  sub = false,
  onBack,
}: {
  items: ContextEntry[];
  onClose: () => void;
  sub?: boolean;
  onBack?: () => void;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [openSub, setOpenSub] = useState<number | null>(null);
  const [flip, setFlip] = useState({ left: false, up: 0 });

  // A submenu opens to the left (and shifts up) when it would leave the screen.
  useLayoutEffect(() => {
    if (!sub || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setFlip({
      left: r.right > window.innerWidth - 4,
      up: Math.max(0, r.bottom - (window.innerHeight - 4)),
    });
    ref.current.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [sub]);

  return (
    <ul
      ref={ref}
      className={`os-menu os-context${sub ? " os-context-sub" : ""}${flip.left ? " is-left" : ""}`}
      role="menu"
      style={sub && flip.up ? { marginTop: -flip.up } : undefined}
      onKeyDown={(e) => {
        if (sub && e.key === "ArrowLeft") {
          e.stopPropagation();
          onBack?.();
        }
      }}
    >
      {items.map((it, i) => {
        if (it === "sep") return <li key={`sep-${i}`} className="os-menu-sep" role="separator" />;
        const checkable = it.checked !== undefined;
        const hasSub = !!it.submenu;
        return (
          <li
            key={it.label}
            role="none"
            className={hasSub ? "os-context-parent" : undefined}
            onPointerEnter={() => setOpenSub(hasSub ? i : null)}
          >
            <button
              type="button"
              role={checkable ? "menuitemcheckbox" : "menuitem"}
              aria-checked={checkable ? it.checked : undefined}
              aria-haspopup={hasSub ? "menu" : undefined}
              aria-expanded={hasSub ? openSub === i : undefined}
              className="os-menu-item"
              disabled={it.disabled}
              onClick={() => {
                if (hasSub) {
                  setOpenSub(i);
                  return;
                }
                if (!checkable) onClose();
                it.run?.();
              }}
              onKeyDown={(e) => {
                if (hasSub && e.key === "ArrowRight") {
                  e.preventDefault();
                  setOpenSub(i);
                }
              }}
            >
              <span className="os-menu-check" aria-hidden>
                {it.checked ? "✓" : ""}
              </span>
              <span className="os-menu-label">{it.label}</span>
              {hasSub && (
                <span className="os-menu-arrow" aria-hidden>
                  ▸
                </span>
              )}
            </button>
            {hasSub && openSub === i && (
              <MenuList
                items={it.submenu!}
                onClose={onClose}
                sub
                onBack={() => {
                  setOpenSub(null);
                  ref.current?.querySelectorAll<HTMLButtonElement>(":scope > li > button")[i]?.focus();
                }}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Right-click menu, styled like the menu bar menus and kept fully on screen. */
export default function ContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState;
  onClose: () => void;
}) {
  // Re-render on prefs changes so checkbox items (e.g. widgets) show their new state.
  usePrefs();
  const items = typeof menu.items === "function" ? menu.items() : menu.items;
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: menu.x, top: menu.y });

  // Flip/clamp so the menu never runs off the edge of the screen.
  useLayoutEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
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
    <div
      ref={ref}
      className="os-context-wrap"
      style={pos}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuList items={items} onClose={onClose} />
    </div>
  );
}
