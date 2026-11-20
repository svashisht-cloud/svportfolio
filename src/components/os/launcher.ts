import { projects } from "@/app/portfolioData";
import { LINKS } from "./appMeta";
import type { AppKind, AppPayload } from "./types";

/** One launchable thing: an app (kind) or an outside link (href). Shared by the dock and the phone home screen. */
export interface LaunchItem {
  key: string;
  label: string;
  kind?: AppKind;
  payload?: AppPayload;
  icon?: string;
  href?: string;
}

const demos = projects.filter((p) => p.demoComponent);

export const DEMO_ITEMS: LaunchItem[] = demos.map((p) => ({
  key: `demo:${p.name}`,
  label: p.name,
  kind: "demo" as const,
  payload: { project: p },
}));

export const APPS: LaunchItem[] = [
  { key: "projects", label: "Projects", kind: "projects" },
  { key: "about", label: "About Me", kind: "about" },
  { key: "shubhgpt", label: "ShubhGPT", kind: "shubhgpt" },
  { key: "experience", label: "Experience", kind: "experience" },
  { key: "cases", label: "Case Files", kind: "cases" },
  ...DEMO_ITEMS,
  { key: "resume", label: "Résumé", kind: "resume" },
  { key: "photos", label: "Photos", kind: "photos" },
  { key: "music", label: "Music", kind: "music" },
  { key: "terminal", label: "Terminal", kind: "terminal" },
  { key: "virtualpc", label: "Virtual PC", kind: "virtualpc" },
  { key: "contact", label: "Mail", kind: "contact" },
];

export const LINK_ITEMS: LaunchItem[] = [
  { key: "github", label: "GitHub", icon: "github", href: LINKS.github },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin", href: LINKS.linkedin },
  { key: "youtube", label: "YouTube", icon: "youtube", href: LINKS.youtube },
];

/** Where the next window should zoom out of (phone home screen icon), in viewport pixels. */
let launchOrigin: { x: number; y: number } | null = null;

export function setLaunchOrigin(el: Element | null) {
  const r = el?.getBoundingClientRect();
  launchOrigin = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
}

/** Returns the pending origin once, then forgets it. */
export function takeLaunchOrigin() {
  const o = launchOrigin;
  launchOrigin = null;
  return o ?? undefined;
}
