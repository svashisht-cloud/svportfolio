import { experiences, projects } from "@/app/portfolioData";
import { EMAIL, LINKS } from "./appMeta";
import { emit, isDevMode } from "./eggs/bus";
import type { AppKind, AppPayload } from "./types";

export type Tone = "ok" | "err" | "dim" | "accent" | "title";

export interface TermLine {
  text: string;
  tone?: Tone;
  /** Render as a link (opens in a new tab). */
  href?: string;
}

export interface CommandContext {
  launch(kind: AppKind, payload?: AppPayload): void;
  history: string[];
  startedAt: number;
}

export interface CommandResult {
  lines: TermLine[];
  clear?: boolean;
  /** Ask for a masked "password" next; the follow-up input goes to this handler. */
  password?: (input: string) => CommandResult;
  /** Play the falling-characters animation in the Terminal. */
  matrix?: boolean;
}

interface Target {
  name: string;
  kind: AppKind;
  payload?: AppPayload;
  /** Extra words that should match, e.g. "mail" for Contact. */
  aliases?: string[];
}

const APPS: Target[] = [
  { name: "About", kind: "about", aliases: ["about me", "me"] },
  { name: "Projects", kind: "projects", aliases: ["finder"] },
  { name: "Experience", kind: "experience", aliases: ["work", "career"] },
  { name: "Education", kind: "education", aliases: ["umass", "school"] },
  { name: "Resume", kind: "resume", aliases: ["résumé", "cv"] },
  { name: "Photos", kind: "photos" },
  { name: "Music", kind: "music", aliases: ["songs"] },
  { name: "Mail", kind: "contact", aliases: ["contact", "email"] },
  { name: "System Preferences", kind: "prefs", aliases: ["prefs", "settings", "wallpaper"] },
  { name: "ShubhGPT", kind: "shubhgpt", aliases: ["gpt", "chat", "ask", "ai"] },
  { name: "Help", kind: "help" },
  { name: "Trash", kind: "trash" },
];

/** Everything `open` and Tab completion know about. */
export function targets(): Target[] {
  const list: Target[] = [...APPS];
  for (const p of projects) {
    list.push({ name: p.name, kind: "project", payload: { project: p } });
  }
  for (const exp of experiences) {
    for (const role of exp.roles) {
      for (const w of role.projects) {
        list.push({ name: w.name, kind: "work", payload: { work: w, company: exp.company, role } });
      }
    }
  }
  return list;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Best match: exact name or alias, then prefix, then contains, then all words present. */
export function findTarget(query: string, pool = targets()): Target | undefined {
  const q = norm(query);
  if (!q) return undefined;
  const names = (t: Target) => [t.name, ...(t.aliases ?? [])].map(norm);
  return (
    pool.find((t) => names(t).some((n) => n === q)) ??
    pool.find((t) => names(t).some((n) => n.startsWith(q))) ??
    pool.find((t) => names(t).some((n) => n.includes(q))) ??
    pool.find((t) => q.split(" ").every((word) => names(t).some((n) => n.includes(word))))
  );
}

const COMMANDS: [string, string][] = [
  ["help", "show this list"],
  ["whoami", "who is this guy"],
  ["ls [projects|experience|apps]", "list things"],
  ["open <name>", "open a project, role or app (fuzzy)"],
  ["run <demo>", "launch a playable demo (snake, search)"],
  ["skills", "tech used across projects"],
  ["cat resume", "résumé summary"],
  ["contact / socials", "ways to reach me"],
  ["history", "previous commands"],
  ["date", "what time is it"],
  ["clear", "clear the screen"],
  ["sudo hire-me", "you know you want to"],
];

export const COMMAND_NAMES = [
  "help",
  "whoami",
  "about",
  "ls",
  "open",
  "run",
  "skills",
  "cat",
  "contact",
  "socials",
  "history",
  "date",
  "clear",
  "sudo",
  "echo",
  "pwd",
  "matrix",
];

function uptime(startedAt: number) {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m} min${m === 1 ? "" : "s"}, ${s % 60} secs` : `${s} secs`;
}

export function banner(startedAt: number): TermLine[] {
  const art = [
    "  ____   __     __",
    " / ___|  \\ \\   / /",
    " \\___ \\   \\ \\ / / ",
    "  ___) |   \\ V /  ",
    " |____/     \\_/   ",
  ];
  const roles = experiences.reduce((n, e) => n + e.roles.length, 0);
  const info = [
    "shubh@portfolio",
    "---------------",
    "OS: SV OS X (Aqua-ish)",
    `Uptime: ${uptime(startedAt)}`,
    typeof window !== "undefined"
      ? `Resolution: ${window.innerWidth}x${window.innerHeight}`
      : "Resolution: ?",
    "Shell: zsh (sort of)",
    `Projects: ${projects.length} · Roles: ${roles}`,
  ];
  const lines: TermLine[] = [];
  for (let i = 0; i < Math.max(art.length, info.length); i++) {
    lines.push({
      text: `${(art[i] ?? "").padEnd(22)}${info[i] ?? ""}`,
      tone: i < art.length ? "accent" : undefined,
    });
  }
  lines.push({ text: "" }, { text: "Type 'help' to see what I can do.", tone: "dim" }, { text: "" });
  return lines;
}

/** Tech used across projects and work, most-used first. Shared with the tech-stack widget. */
export function skillCounts(): [string, number][] {
  const counts = new Map<string, number>();
  const add = (tags?: string[]) => tags?.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  projects.forEach((p) => add(p.techStack));
  experiences.forEach((e) => e.roles.forEach((r) => r.projects.forEach((w) => add(w.techStack))));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function skills(): TermLine[] {
  const sorted = skillCounts();
  const max = sorted[0]?.[1] ?? 1;
  return sorted.map(([name, n]) => ({
    text: `${name.padEnd(16)} ${"█".repeat(Math.max(1, Math.round((n / max) * 20)))} ${n}`,
    tone: n === max ? "ok" : undefined,
  }));
}

export function run(input: string, ctx: CommandContext): CommandResult {
  const raw = input.trim();
  if (!raw) return { lines: [] };
  const [cmd, ...rest] = raw.split(/\s+/);
  const arg = rest.join(" ");

  switch (cmd.toLowerCase()) {
    case "help":
      return {
        lines: [
          { text: "Available commands:", tone: "title" },
          ...COMMANDS.map(([c, d]) => ({ text: `  ${c.padEnd(30)} ${d}` })),
        ],
      };
    case "whoami":
    case "about":
      return {
        lines: [
          { text: "Shubh Vashisht: software engineer.", tone: "title" },
          {
            text: "4+ years building production systems across AI, distributed robotics platforms and full-stack web.",
          },
          { text: "Focus: developer tools, language model applications, real-time infrastructure." },
        ],
      };
    case "pwd":
      return { lines: [{ text: "/Users/shubh/portfolio" }] };
    case "echo":
      return { lines: [{ text: arg }] };
    case "date":
      return { lines: [{ text: new Date().toString() }] };
    case "clear":
      return { lines: [], clear: true };
    case "history":
      return {
        lines: ctx.history.map((h, i) => ({ text: `${String(i + 1).padStart(4)}  ${h}` })),
      };
    case "ls": {
      const what = arg.toLowerCase();
      if (!what || what.startsWith("proj")) {
        return {
          lines: projects.map((p) => ({
            text: `${p.featured ? "★" : " "} ${p.name.padEnd(28)} ${(p.techStack ?? []).join(", ")}`,
            tone: p.featured ? "ok" : undefined,
          })),
        };
      }
      if (what.startsWith("exp") || what.startsWith("work")) {
        const lines: TermLine[] = [];
        for (const e of experiences) {
          for (const r of [...e.roles].reverse()) {
            lines.push({ text: `${r.title} @ ${e.company}  (${r.dateRange})`, tone: "title" });
            r.projects.forEach((w) => lines.push({ text: `  └─ ${w.name}` }));
          }
        }
        return { lines };
      }
      if (what.startsWith("app")) {
        return { lines: APPS.map((a) => ({ text: a.name })) };
      }
      return { lines: [{ text: `ls: ${arg}: No such file or directory`, tone: "err" }] };
    }
    case "open": {
      if (!arg) return { lines: [{ text: "usage: open <name>", tone: "err" }] };
      const t = findTarget(arg);
      if (!t) return { lines: [{ text: `open: no match for '${arg}'. Try 'ls'.`, tone: "err" }] };
      ctx.launch(t.kind, t.payload);
      return { lines: [{ text: `Opening ${t.name}…`, tone: "ok" }] };
    }
    case "run": {
      const demos = projects.filter((p) => p.demoComponent);
      const pool = demos.map((p) => ({
        name: p.name,
        kind: "demo" as const,
        payload: { project: p },
      }));
      const t = arg ? findTarget(arg, pool) : undefined;
      if (!t) {
        return {
          lines: [
            { text: "usage: run <demo>", tone: "err" },
            ...demos.map((p) => ({ text: `  ${p.name}`, tone: "dim" as const })),
          ],
        };
      }
      ctx.launch(t.kind, t.payload);
      return { lines: [{ text: `Launching ${t.name}…`, tone: "ok" }] };
    }
    case "skills":
      return { lines: [{ text: "Tech used across projects:", tone: "title" }, ...skills()] };
    case "cat": {
      const what = arg.toLowerCase();
      if (what.startsWith("res") || what.startsWith("cv")) {
        const lines: TermLine[] = [{ text: "SHUBH VASHISHT, Software Engineer", tone: "title" }];
        for (const e of experiences) {
          for (const r of [...e.roles].reverse()) {
            lines.push({ text: `• ${r.title}, ${e.company} (${r.dateRange})` });
          }
        }
        lines.push(
          { text: "• Bachelor's in Computer Science, UMass Amherst (Aug 2019 – Dec 2022)" },
          { text: "Full PDF: /resume.pdf", href: "/resume.pdf" },
        );
        return { lines };
      }
      if (what.startsWith("about")) return run("whoami", ctx);
      return { lines: [{ text: `cat: ${arg || "?"}: No such file or directory`, tone: "err" }] };
    }
    case "contact":
    case "socials":
      return {
        lines: [
          { text: `email     ${EMAIL}`, href: `mailto:${EMAIL}` },
          { text: `github    ${LINKS.github}`, href: LINKS.github },
          { text: `linkedin  ${LINKS.linkedin}`, href: LINKS.linkedin },
          { text: `youtube   ${LINKS.youtube}`, href: LINKS.youtube },
        ],
      };
    case "rm": {
      if (/-\w*r\w*f|-\w*f\w*r/.test(arg) && /(^|\s)\/(\*)?(\s|$)/.test(`${arg} `)) {
        window.setTimeout(() => emit("panic"), 300);
        return { lines: [{ text: "Deleting everything…", tone: "err" }] };
      }
      return { lines: [{ text: "rm: permission denied (this is a portfolio)", tone: "err" }] };
    }
    case "matrix":
      return { lines: [{ text: "Wake up, Neo…", tone: "ok" }], matrix: true };
    case "devmode":
      if (!isDevMode()) return { lines: [{ text: "zsh: command not found: devmode", tone: "err" }] };
      return {
        lines: [
          { text: "Developer mode: ON", tone: "ok" },
          { text: "  build        ✓ 0 errors, 0 warnings (suspiciously clean)" },
          { text: "  coffee       ████████░░ 80%" },
          { text: "  rubber duck  online" },
          { text: "Secret commands: matrix, rm -rf /, sudo hire-me", tone: "dim" },
        ],
      };
    case "sudo": {
      if (/^rm\b/.test(arg)) return run(arg, ctx);
      if (arg.toLowerCase().replace(/\s+/g, "") === "hire-me" || arg.toLowerCase() === "hireme") {
        return {
          lines: [],
          password: () => {
            ctx.launch("contact");
            return {
              lines: [
                { text: "Access granted. Excellent decision.", tone: "ok" },
                { text: "Opening Mail…", tone: "dim" },
              ],
            };
          },
        };
      }
      return {
        lines: [{ text: "shubh is not in the sudoers file. This incident will be reported.", tone: "err" }],
      };
    }
    case "exit":
      return { lines: [{ text: "Nice try. Close the window with the red button.", tone: "dim" }] };
    default:
      return { lines: [{ text: `zsh: command not found: ${cmd}`, tone: "err" }] };
  }
}

/** Tab completion for the current input. Returns the completed input, or the input unchanged. */
export function complete(input: string): string {
  const parts = input.split(" ");
  if (parts.length === 1) {
    const hits = COMMAND_NAMES.filter((c) => c.startsWith(parts[0].toLowerCase()));
    return hits.length === 1 ? `${hits[0]} ` : input;
  }
  const [cmd, ...rest] = parts;
  const partial = rest.join(" ").toLowerCase();
  if (!partial) return input;
  const pool =
    cmd === "run"
      ? projects.filter((p) => p.demoComponent).map((p) => p.name)
      : cmd === "ls"
        ? ["projects", "experience", "apps"]
        : cmd === "cat"
          ? ["resume", "about"]
          : targets().map((t) => t.name);
  const hits = pool.filter((n) => n.toLowerCase().startsWith(partial));
  return hits.length === 1 ? `${cmd} ${hits[0]}` : input;
}
