import { experiences, projects } from "@/app/portfolioData";
import { CASES, caseById } from "./cases/registry";
import type { AppKind, AppPayload } from "./types";

/**
 * Deep links: every window that makes sense on its own gets a URL, `/?w=<slug>`.
 * `project/forte-resume`, `work/event-triggered-lidar-recording`, `case/boot-order`, `demo/snake-game`,
 * or just the app (`resume`, `experience`…). Plain module (no "use client"): page.tsx uses it for
 * link previews on the server.
 */

export const LINK_PARAM = "w";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Apps that open on their own, with the name a shared link shows. */
const APPS: Partial<Record<AppKind, string>> = {
  about: "About Me",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  resume: "Résumé",
  photos: "Photos",
  music: "Music",
  contact: "Mail",
  shubhgpt: "ShubhGPT",
  terminal: "Terminal",
  cases: "Case Files",
  sysinfo: "About This Developer",
  sysreport: "System Report",
  update: "Software Update",
  help: "Portfolio Help",
  virtualpc: "Virtual PC: my Windows XP Clone",
  classic: "Classic: my old portfolio",
  achievements: "Trophies",
  console: "Console",
  activity: "Activity Monitor",
};

export function toSlug(kind: AppKind, payload?: AppPayload): string | null {
  switch (kind) {
    case "project":
      return payload?.project ? `project/${slugify(payload.project.name)}` : null;
    case "demo":
      return payload?.project ? `demo/${slugify(payload.project.name)}` : null;
    case "work":
      return payload?.work ? `work/${slugify(payload.work.name)}` : null;
    case "case":
      return caseById(payload?.caseId) ? `case/${payload!.caseId}` : null;
    default:
      return APPS[kind] ? kind : null;
  }
}

export interface Resolved {
  kind: AppKind;
  payload?: AppPayload;
  /** For link previews. */
  title: string;
  description?: string;
}

export function fromSlug(slug?: string | null): Resolved | null {
  if (!slug) return null;
  const [type, rest] = slug.split("/");
  if (!rest) {
    const title = APPS[type as AppKind];
    return title ? { kind: type as AppKind, title } : null;
  }
  if (type === "project" || type === "demo") {
    const project = projects.find((p) => slugify(p.name) === rest);
    if (!project || (type === "demo" && !project.demoComponent)) return null;
    return {
      kind: type,
      payload: { project },
      title: type === "demo" ? `${project.name}: play it` : project.name,
      description: project.description,
    };
  }
  if (type === "work") {
    for (const exp of experiences) {
      for (const role of exp.roles) {
        const work = role.projects.find((w) => slugify(w.name) === rest);
        if (work) {
          return {
            kind: "work",
            payload: { work, company: exp.company, role },
            title: `${work.name} · ${role.title}, ${exp.company}`,
            description: work.description,
          };
        }
      }
    }
    return null;
  }
  if (type === "case") {
    const c = CASES.find((x) => x.id === rest);
    return c
      ? { kind: "case", payload: { caseId: c.id }, title: `${c.title}: a 60-second case file`, description: c.tagline }
      : null;
  }
  return null;
}

/** Full URL for a window, or null if it has no link. */
export function linkFor(kind: AppKind, payload?: AppPayload): string | null {
  const slug = toSlug(kind, payload);
  if (!slug || typeof window === "undefined") return null;
  // Built by hand so the slash in the slug stays readable (no %2F).
  return `${window.location.origin}${window.location.pathname}?${LINK_PARAM}=${slug}`;
}
