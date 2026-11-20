"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { experiences, projects } from "@/app/portfolioData";
import { RESUME_TEXT } from "@/app/resumeText";
import { SKILL_GROUPS } from "@/app/skills";
import { EMAIL, LINKS } from "./appMeta";
import { CASES } from "./cases/registry";
import { APPS, COMMANDS } from "./commands";
import { deliver } from "./deliver";
import type { BusEvent } from "./eggs/bus";
import { log } from "./syslog";
import { unlock } from "./achievements";
import { useWM } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

/**
 * Spotlight: one search box over everything on the desktop. Opens from the magnifier in the
 * menu bar, ⌘K / Ctrl+K, or "/" outside text fields. ↑/↓ to move, Enter to open, Esc to close.
 */

type Action =
  | { type: "launch"; kind: AppKind; payload?: AppPayload }
  | { type: "deliver"; kind: AppKind; event: BusEvent; message: string }
  | { type: "href"; href: string };

interface Item {
  id: string;
  group: string;
  title: string;
  sub?: string;
  /** Extra text that should match, but isn't shown. */
  keywords?: string;
  action: Action;
}

const GROUPS = [
  "Top Hit",
  "Applications",
  "Case Files",
  "Projects",
  "Experience",
  "Skills",
  "Résumé",
  "Terminal",
  "Links",
  "ShubhGPT",
];
const LIMIT: Record<string, number> = { Résumé: 3, Terminal: 3 };

/** Terminal commands worth offering here (no arguments, nothing that starts music). */
const SKIP_COMMANDS = ["play", "history", "clear"];

/** Bullet points and other lines of the résumé, each with where it's from. */
function resumeLines(): { text: string; context: string }[] {
  const out: { text: string; context: string }[] = [];
  let section = "";
  let place = "";
  let role = "";
  for (const raw of RESUME_TEXT.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[A-Z][A-Z &]+$/.test(line)) {
      section = line;
      place = role = "";
      continue;
    }
    if (!section || section === "SKILLS") continue;
    if (section === "SUMMARY" || section === "EDUCATION") {
      out.push({ text: line, context: section === "SUMMARY" ? "Summary" : "Education" });
      continue;
    }
    if (line.startsWith("- ")) {
      out.push({ text: line.slice(2), context: [role, place].filter(Boolean).join(", ") });
      continue;
    }
    const company = line.match(/^(.+?) — /);
    if (company) {
      place = company[1];
      role = "";
      continue;
    }
    const roleLine = line.match(/^(.+?), [A-Z][a-z]{2} \d{4} – /);
    if (roleLine) {
      role = roleLine[1];
      continue;
    }
    out.push({ text: line, context: place });
  }
  return out;
}

function buildIndex(): Item[] {
  const items: Item[] = [];
  for (const app of APPS) {
    items.push({
      id: `app:${app.name}`,
      group: "Applications",
      title: app.name,
      keywords: (app.aliases ?? []).join(" "),
      action: { type: "launch", kind: app.kind },
    });
  }
  for (const c of CASES) {
    items.push({
      id: `case:${c.id}`,
      group: "Case Files",
      title: c.title,
      sub: c.tagline,
      keywords: `${c.work} ${c.company} puzzle game case file`,
      action: { type: "launch", kind: "case", payload: { caseId: c.id } },
    });
  }
  for (const p of projects) {
    items.push({
      id: `project:${p.name}`,
      group: "Projects",
      title: p.name,
      sub: (p.techStack ?? []).join(", "),
      keywords: [p.description, ...(p.highlights ?? [])].join(" "),
      action: { type: "launch", kind: "project", payload: { project: p } },
    });
  }
  for (const exp of experiences) {
    for (const role of [...exp.roles].reverse()) {
      for (const w of role.projects) {
        items.push({
          id: `work:${w.name}`,
          group: "Experience",
          title: w.name,
          sub: `${role.title} · ${exp.company}`,
          keywords: [...(w.techStack ?? []), w.description, ...(w.highlights ?? [])].join(" "),
          action: { type: "launch", kind: "work", payload: { work: w, company: exp.company, role } },
        });
      }
    }
  }
  for (const g of SKILL_GROUPS) {
    for (const s of g.skills) {
      items.push({
        id: `skill:${s}`,
        group: "Skills",
        title: s,
        sub: `${g.label} · see where I used it`,
        action: { type: "deliver", kind: "sysreport", event: "sysreport", message: s },
      });
    }
  }
  resumeLines().forEach((line, i) => {
    items.push({
      id: `resume:${i}`,
      group: "Résumé",
      title: line.text,
      sub: line.context,
      action: { type: "launch", kind: "resume" },
    });
  });
  for (const [usage, about] of COMMANDS) {
    if (usage.includes("<")) continue;
    const cmd = usage.includes("[") ? usage.split(/[\s[]/)[0] : usage.split(" / ")[0];
    if (SKIP_COMMANDS.includes(cmd)) continue;
    items.push({
      id: `cmd:${cmd}`,
      group: "Terminal",
      title: cmd,
      sub: about,
      action: { type: "deliver", kind: "terminal", event: "terminal", message: cmd },
    });
  }
  const links: [string, string][] = [
    ["GitHub", LINKS.github],
    ["LinkedIn", LINKS.linkedin],
    ["YouTube", LINKS.youtube],
    [`Email ${EMAIL}`, `mailto:${EMAIL}`],
  ];
  for (const [title, href] of links) {
    items.push({
      id: `link:${title}`,
      group: "Links",
      title,
      sub: href.replace(/^mailto:|^https?:\/\/(www\.)?/, ""),
      keywords: "contact social profile",
      action: { type: "href", href },
    });
  }
  return items;
}

const simple = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const words = (s: string) => s.split(/[\s/·,:;()–—-]+/).filter(Boolean);

/** Title matches beat matches in the subtitle or hidden keywords. */
function score(item: Item, q: string): number {
  const title = simple(item.title);
  if (title === q) return 100;
  if (title.startsWith(q)) return 85;
  if (words(title).some((w) => w.startsWith(q))) return 70;
  if (title.includes(q)) return 55;
  const rest = simple(`${item.sub ?? ""} ${item.keywords ?? ""}`);
  if (words(rest).some((w) => w.startsWith(q))) return 35;
  if (rest.includes(q)) return 25;
  const parts = q.split(" ");
  if (parts.length > 1 && parts.every((p) => title.includes(p) || rest.includes(p))) return 20;
  return 0;
}

interface Group {
  name: string;
  items: Item[];
}

function search(index: Item[], query: string): Group[] {
  const q = simple(query);
  if (!q) return [];
  const scored = index
    .map((item, order) => ({ item, order, s: score(item, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.order - b.order);
  const top = scored[0] && scored[0].s >= 55 ? scored[0].item : undefined;
  const groups: Group[] = [];
  if (top) groups.push({ name: "Top Hit", items: [top] });
  for (const name of GROUPS.slice(1, -1)) {
    const items = scored
      .filter((x) => x.item.group === name && x.item !== top)
      .slice(0, LIMIT[name] ?? 4)
      .map((x) => x.item);
    if (items.length) groups.push({ name, items });
  }
  groups.push({
    name: "ShubhGPT",
    items: [
      {
        id: "ask",
        group: "ShubhGPT",
        title: `Ask ShubhGPT “${query.trim()}”`,
        sub: "Answers as me, from my résumé",
        action: { type: "deliver", kind: "shubhgpt", event: "ask", message: query.trim() },
      },
    ],
  });
  return groups;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

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
    log("Spotlight", `“${query.trim()}” → ${item.group}: ${item.title}`);
    unlock("spotlight");
    const a = item.action;
    if (a.type === "launch") wm.launch(a.kind, a.payload);
    else if (a.type === "deliver") deliver(wm, a.kind, a.event, a.message);
    else if (a.href.startsWith("mailto:")) window.location.assign(a.href);
    else window.open(a.href, "_blank", "noopener,noreferrer");
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
