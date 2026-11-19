"use client";
import { useRef, useState } from "react";

export interface Band {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Options {
  /** Arrow keys move the selection through a grid (folder view). */
  arrows?: boolean;
}

/**
 * Mac Finder–style selection for a set of icons.
 * - click selects; Cmd/Ctrl+click toggles; Shift+click selects a range
 * - drag on empty space draws a selection rectangle; click on empty space clears
 * - double-click, Enter or Cmd/Ctrl+O opens every selected item; Cmd/Ctrl+A selects all
 * - on touch screens a tap opens the item immediately
 */
export function useSelection(keys: string[], onOpen: (keys: string[]) => void, opts: Options = {}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [band, setBand] = useState<Band | null>(null);
  const anchor = useRef<string | null>(null);
  const pointerType = useRef<string>("mouse");
  const drag = useRef<{ x: number; y: number; base: string[] } | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const narrowTimer = useRef<number | undefined>(undefined);

  const isSelected = (key: string) => selected.includes(key);

  const openSelection = (key?: string) => {
    const list = key && !selected.includes(key) ? [key] : selected;
    if (list.length) onOpen(keys.filter((k) => list.includes(k)));
  };

  const selectRange = (from: string, to: string) => {
    const a = keys.indexOf(from);
    const b = keys.indexOf(to);
    if (a < 0 || b < 0) return [to];
    return keys.slice(Math.min(a, b), Math.max(a, b) + 1);
  };

  const itemProps = (key: string) => ({
    "data-sel-key": key,
    "aria-pressed": isSelected(key),
    onPointerDown: (e: React.PointerEvent) => {
      pointerType.current = e.pointerType;
      e.stopPropagation();
      if (e.pointerType === "touch" || e.button !== 0) return;
      if (e.shiftKey && anchor.current) {
        setSelected(selectRange(anchor.current, key));
      } else if (e.metaKey || e.ctrlKey) {
        setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
        anchor.current = key;
      } else {
        // Keep a multi-selection intact when pressing one of its items (so double-click opens all).
        if (!selected.includes(key)) setSelected([key]);
        anchor.current = key;
      }
    },
    onClick: (e: React.MouseEvent) => {
      if (pointerType.current === "touch") {
        e.preventDefault();
        onOpen([key]);
        return;
      }
      // A plain click on an item of a multi-selection narrows it to that item, but only
      // once it's clear this isn't the first half of a double-click (which opens them all).
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.detail === 1 && selected.length > 1) {
        window.clearTimeout(narrowTimer.current);
        narrowTimer.current = window.setTimeout(() => setSelected([key]), 450);
      }
    },
    onDoubleClick: () => {
      window.clearTimeout(narrowTimer.current);
      openSelection(key);
    },
  });

  const hits = (b: Band) => {
    const root = containerRef.current;
    if (!root) return [];
    const out: string[] = [];
    root.querySelectorAll<HTMLElement>("[data-sel-key]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (
        r.right > b.left &&
        r.left < b.left + b.width &&
        r.bottom > b.top &&
        r.top < b.top + b.height
      ) {
        out.push(el.dataset.selKey!);
      }
    });
    return out;
  };

  const containerProps = {
    ref: (el: HTMLElement | null) => {
      containerRef.current = el;
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      pointerType.current = e.pointerType;
      if (e.pointerType === "touch" || e.button !== 0) return;
      const additive = e.metaKey || e.ctrlKey || e.shiftKey;
      if (!additive) setSelected([]);
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, base: additive ? selected : [] };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const b = {
        left: Math.min(d.x, e.clientX),
        top: Math.min(d.y, e.clientY),
        width: Math.abs(e.clientX - d.x),
        height: Math.abs(e.clientY - d.y),
      };
      if (b.width < 3 && b.height < 3) return;
      setBand(b);
      setSelected([...new Set([...d.base, ...hits(b)])]);
    },
    onPointerUp: () => {
      drag.current = null;
      setBand(null);
    },
    onPointerCancel: () => {
      drag.current = null;
      setBand(null);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Enter" || (mod && e.key.toLowerCase() === "o")) {
        if (!selected.length) return;
        e.preventDefault();
        openSelection();
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected(keys);
      } else if (e.key === "Escape") {
        setSelected([]);
      } else if (opts.arrows && e.key.startsWith("Arrow") && keys.length) {
        e.preventDefault();
        const current = anchor.current ? keys.indexOf(anchor.current) : -1;
        const cols = columns(containerRef.current);
        const step =
          e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" ? -cols : cols;
        const next = current < 0 ? 0 : Math.max(0, Math.min(keys.length - 1, current + step));
        const key = keys[next];
        anchor.current = key;
        setSelected(e.shiftKey ? [...new Set([...selected, key])] : [key]);
        containerRef.current
          ?.querySelector<HTMLElement>(`[data-sel-key="${CSS.escape(key)}"]`)
          ?.focus();
      }
    },
  };

  return { selected, setSelected, band, itemProps, containerProps, openSelection };
}

/** Number of items in the first row of a wrapping grid. */
function columns(root: HTMLElement | null) {
  const items = root ? Array.from(root.querySelectorAll<HTMLElement>("[data-sel-key]")) : [];
  if (!items.length) return 1;
  const top = items[0].offsetTop;
  return Math.max(1, items.filter((el) => el.offsetTop === top).length);
}
