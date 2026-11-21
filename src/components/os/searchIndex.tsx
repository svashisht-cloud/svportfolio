"use client";
import { experiences, projects } from "@/app/portfolioData";
import { RESUME_TEXT } from "@/app/resumeText";
import { SKILL_GROUPS } from "@/app/skills";
import { EMAIL, LINKS, isMobileNow } from "./appMeta";
import { CASES } from "./cases/registry";
import { APPS, COMMANDS } from "./commands";
import { deliver } from "./deliver";
import type { BusEvent } from "./eggs/bus";
import { log } from "./syslog";
import { unlock } from "./achievements";
import type { WMActions } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

/**
 * The search behind Spotlight (desktop) and the phone Search page: one index over apps, case
 * files, projects, experience, skills, résumé lines, Terminal commands and links.
 */

export type Action =
  | { type: "launch"; kind: AppKind; payload?: AppPayload }
  | { type: "deliver"; kind: AppKind; event: BusEvent; message: string }
  | { type: "href"; href: string };

export interface Item {
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

export function buildIndex(): Item[] {
  const items: Item[] = [];
  const mobile = isMobileNow();
  for (const app of APPS) {
    // The XP clone (Virtual PC) needs a desktop-sized screen, and Terminal needs a keyboard.
    if ((app.kind === "virtualpc" || app.kind === "terminal") && mobile) continue;
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
  // Terminal commands open the Terminal, which phones don't get.
  for (const [usage, about] of mobile ? [] : COMMANDS) {
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

export interface Group {
  name: string;
  items: Item[];
}

export function search(index: Item[], query: string): Group[] {
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

export function Highlight({ text, query }: { text: string; query: string }) {
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

/** Run a result: open its window, hand a message to one, or follow a link. */
export function runItem(wm: WMActions, item: Item, query: string) {
  log("Spotlight", `“${query.trim()}” → ${item.group}: ${item.title}`);
  unlock("spotlight");
  const a = item.action;
  if (a.type === "launch") wm.launch(a.kind, a.payload);
  else if (a.type === "deliver") deliver(wm, a.kind, a.event, a.message);
  else if (a.href.startsWith("mailto:")) window.location.assign(a.href);
  else window.open(a.href, "_blank", "noopener,noreferrer");
}
