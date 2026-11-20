"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Highlight, buildIndex, runItem, search, type Item } from "./searchIndex";
import { useWM } from "./WindowManager";

/**
 * Spotlight: one search box over everything on the desktop. Opens from the magnifier in the
 * menu bar, ⌘K / Ctrl+K, or "/" outside text fields. ↑/↓ to move, Enter to open, Esc to close.
 */

export default function Spotlight() {
  const wm = useWM();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Where focus was before Spotlight opened, to give it back on Esc. */
  const returnFocus = useRef<HTMLElement | null>(null);

  const index = useMemo(() => buildIndex(), []);
  const groups = useMemo(() => search(index, query), [index, query]);
  const flat = groups.flatMap((g) => g.items);
  const current = flat[Math.min(active, flat.length - 1)];

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    setQuery("");
    setActive(0);
    if (restoreFocus) returnFocus.current?.focus?.();
  };

  // ⌘K / Ctrl+K toggles; "/" opens when you're not typing somewhere else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && k === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActive(0);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.("input, textarea, select") || t?.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the field on open; close on a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    if (prev instanceof HTMLElement && !wrapRef.current?.contains(prev)) returnFocus.current = prev;
    inputRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setActive(0);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the selected row in view while moving with the keyboard.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>("[aria-selected='true']");
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 4;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 4;
    }
  }, [active, query]);

  const run = (item: Item) => {
    close(false);
    runItem(wm, item, query);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      if (!flat.length) return;
      const i = Math.min(active, flat.length - 1);
      setActive(e.key === "ArrowDown" ? Math.min(flat.length - 1, i + 1) : Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (current) run(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    }
  };

  const optionId = (item: Item) => `os-spot-${item.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const hasMatches = groups.some((g) => g.name !== "ShubhGPT");

  return (
    <div className="os-spot-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`os-menubar-icon os-spot-btn${open ? " is-open" : ""}`}
        aria-label="Spotlight search (⌘K)"
        title="Spotlight (⌘K or /)"
        aria-expanded={open}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        <FaSearch aria-hidden />
      </button>
      {open && (
        <div className="os-spotlight" role="dialog" aria-label="Spotlight">
          <div className="os-spot-field">
            <FaSearch aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Spotlight"
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="os-spot-list"
              aria-activedescendant={current ? optionId(current) : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {!query.trim() ? (
            <p className="os-spot-hint">
              Search projects, skills, my résumé and more. Try “kubernetes”, “lidar” or “snake”.
            </p>
          ) : (
            <>
              {!hasMatches && <p className="os-spot-hint">No matches on the desktop.</p>}
              <div className="os-spot-list" id="os-spot-list" role="listbox" aria-label="Results" ref={listRef}>
                {groups.map((g) => (
                  <div key={g.name} className="os-spot-group" role="group" aria-label={g.name}>
                    <div className="os-spot-cat" aria-hidden>
                      {g.name}
                    </div>
                    <div className="os-spot-items">
                      {g.items.map((item) => {
                        const selected = item === current;
                        return (
                          <div
                            key={item.id}
                            id={optionId(item)}
                            role="option"
                            aria-selected={selected}
                            className="os-spot-item"
                            onMouseMove={() => {
                              const i = flat.indexOf(item);
                              if (i !== active) setActive(i);
                            }}
                            onClick={() => run(item)}
                          >
                            <span className="os-spot-title">
                              <Highlight text={item.title} query={query} />
                            </span>
                            {item.sub && <span className="os-spot-sub">{item.sub}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
