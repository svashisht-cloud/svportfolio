"use client";
import { useState } from "react";
import { projects } from "@/app/portfolioData";
import { AppIcon, LINKS, describe } from "./appMeta";
import { useTrashFull } from "./eggs/trash";
import { useWM, useWMState } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

interface DockItem {
  key: string;
  label: string;
  kind?: AppKind;
  payload?: AppPayload;
  icon?: string;
  href?: string;
}

const demos = projects.filter((p) => p.demoComponent);

const APPS: DockItem[] = [
  { key: "projects", label: "Projects", kind: "projects" },
  { key: "about", label: "About Me", kind: "about" },
  { key: "shubhgpt", label: "ShubhGPT", kind: "shubhgpt" },
  { key: "experience", label: "Experience", kind: "experience" },
  { key: "cases", label: "Case Files", kind: "cases" },
  ...demos.map((p) => ({
    key: `demo:${p.name}`,
    label: p.name,
    kind: "demo" as const,
    payload: { project: p },
  })),
  { key: "resume", label: "Résumé", kind: "resume" },
  { key: "photos", label: "Photos", kind: "photos" },
  { key: "music", label: "Music", kind: "music" },
  { key: "terminal", label: "Terminal", kind: "terminal" },
  { key: "virtualpc", label: "Virtual PC", kind: "virtualpc" },
  { key: "contact", label: "Mail", kind: "contact" },
];

const LINK_ITEMS: DockItem[] = [
  { key: "github", label: "GitHub", icon: "github", href: LINKS.github },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin", href: LINKS.linkedin },
  { key: "youtube", label: "YouTube", icon: "youtube", href: LINKS.youtube },
];

const BASE = 48;
const MAX_GROW = 0.75;
const REACH = 120;

export default function Dock({ mobile }: { mobile: boolean }) {
  const wm = useWM();
  const { wins } = useWMState();
  const [pointerX, setPointerX] = useState<number | null>(null);
  // Item centres measured when the pointer enters, so magnification doesn't feed back on itself.
  const [centres, setCentres] = useState<Record<string, number>>({});
  const [bouncing, setBouncing] = useState<Record<string, boolean>>({});
  const trashFull = useTrashFull();

  const size = (key: string) => {
    const base = mobile ? 40 : BASE;
    if (mobile || pointerX === null || centres[key] === undefined) return base;
    const d = Math.abs(pointerX - centres[key]);
    return base * (1 + MAX_GROW * Math.max(0, 1 - d / REACH));
  };

  const measure = (e: React.PointerEvent<HTMLElement>) => {
    const next: Record<string, number> = {};
    e.currentTarget.querySelectorAll<HTMLElement>("[data-dock-key]").forEach((el) => {
      const r = el.getBoundingClientRect();
      next[el.dataset.dockKey!] = r.left + r.width / 2;
    });
    setCentres(next);
  };

  const activate = (item: DockItem) => {
    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    if (!item.kind) return;
    const id = describe(item.kind, item.payload).id;
    if (!wins.some((w) => w.id === id)) {
      setBouncing((b) => ({ ...b, [item.key]: true }));
      window.setTimeout(() => setBouncing((b) => ({ ...b, [item.key]: false })), 900);
    }
    wm.launch(item.kind, item.payload);
  };

  const renderItem = (item: DockItem) => {
    const running =
      !!item.kind && wins.some((w) => w.id === describe(item.kind!, item.payload).id);
    const s = size(item.key);
    return (
      <li key={item.key} data-dock-key={item.key} style={{ width: s, height: s }}>
        <button
          type="button"
          className={`os-dock-item${bouncing[item.key] ? " is-bouncing" : ""}${
            item.key === "trash" && trashFull ? " is-full" : ""
          }`}
          aria-label={item.href ? `${item.label} (opens in new tab)` : `Open ${item.label}`}
          onClick={() => activate(item)}
        >
          <AppIcon kind={item.kind} payload={item.payload} name={item.icon} />
          <span className="os-dock-label">{item.label}</span>
        </button>
        {running && <span className="os-dock-dot" aria-hidden />}
      </li>
    );
  };

  const minimized = wins.filter((w) => w.minimized);
  const trash: DockItem = { key: "trash", label: "Trash", kind: "trash" };

  return (
    <div className="os-dock-wrap">
      <ul
        className="os-dock"
        aria-label="Dock"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") measure(e);
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") setPointerX(e.clientX);
        }}
        onPointerLeave={() => setPointerX(null)}
      >
        {APPS.map(renderItem)}
        <li className="os-dock-sep" aria-hidden />
        {LINK_ITEMS.map(renderItem)}
        <li className="os-dock-sep" aria-hidden data-dock-target="minimized" />
        {minimized.map((w) => {
          const s = size(`min:${w.id}`);
          return (
            <li key={w.id} data-dock-key={`min:${w.id}`} style={{ width: s, height: s }}>
              <button
                type="button"
                className="os-dock-item os-dock-min"
                aria-label={`Restore ${w.title}`}
                onClick={() => wm.restore(w.id)}
              >
                <AppIcon kind={w.kind} payload={w.payload} />
                <span className="os-dock-label">{w.title}</span>
              </button>
            </li>
          );
        })}
        {renderItem(trash)}
      </ul>
    </div>
  );
}
