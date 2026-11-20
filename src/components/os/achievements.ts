"use client";
import { useSyncExternalStore } from "react";
import { experiences } from "@/app/portfolioData";
import { emit } from "./eggs/bus";
import { log } from "./syslog";

/**
 * Achievements (the Trophies window) and the Bug Hunt. Plain functions, so non-React code
 * (Terminal commands, the text adventure) can unlock things too. Kept in this browser.
 */

export interface Achievement {
  id: string;
  title: string;
  hint: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "hello", title: "Hello, World", hint: "Run a command in Terminal.", icon: "⌨️" },
  { id: "spotlight", title: "Seek and Find", hint: "Search with Spotlight (⌘K or /).", icon: "🔍" },
  { id: "shubhgpt", title: "Small Talk", hint: "Ask ShubhGPT a question.", icon: "💬" },
  { id: "read-roles", title: "Due Diligence", hint: "Open a project from every role in Experience.", icon: "📋" },
  { id: "case", title: "Field Engineer", hint: "Solve a case file.", icon: "🗂️" },
  { id: "all-cases", title: "Case Closed", hint: "Solve every case file.", icon: "🕵️" },
  { id: "konami", title: "Cheat Code", hint: "An old console code still works here.", icon: "🎮" },
  { id: "devmode", title: "Developer Mode", hint: "Be persistent with the logo.", icon: "🛠️" },
  { id: "panic", title: "Kernel Panic", hint: "Try something destructive in Terminal.", icon: "💥" },
  { id: "matrix", title: "Red Pill", hint: "Terminal knows one of my favourite movies.", icon: "🟩" },
  { id: "gravity", title: "Gravity", hint: "Shake a window by its title bar.", icon: "🍎" },
  { id: "trash", title: "Persistent Bugs", hint: "Empty the Trash.", icon: "🗑️" },
  { id: "keep-resume", title: "Keeper", hint: "Try to throw my résumé away.", icon: "📄" },
  { id: "sudo", title: "Root Access", hint: "sudo something nice.", icon: "🔐" },
  { id: "adventure", title: "Corner Office", hint: "Finish the text adventure.", icon: "🗺️" },
  { id: "time-travel", title: "Time Traveler", hint: "Flip the calendar back to my first job.", icon: "📅" },
  { id: "tiles", title: "Puzzled", hint: "Solve the sliding-tile widget.", icon: "🧩" },
  { id: "bugs", title: "Exterminator", hint: "Squash all 10 bugs in the Bug Hunt.", icon: "🐞" },
];

/* ---------- tiny persisted stores ---------- */

function persisted<T>(key: string, fallback: T, valid: (v: unknown) => v is T) {
  let value: T | null = null;
  const listeners = new Set<() => void>();
  const get = (): T => {
    if (typeof window === "undefined") return fallback;
    if (value === null) {
      try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
        value = valid(parsed) ? parsed : fallback;
      } catch {
        value = fallback;
      }
    }
    return value;
  };
  const set = (next: T) => {
    value = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // No storage: progress lasts for this page only.
    }
    listeners.forEach((l) => l());
  };
  const use = () =>
    useSyncExternalStore(
      (cb) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      get,
      () => fallback,
    );
  return { get, set, use };
}

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

const NO_IDS: string[] = [];
const unlockedStore = persisted<string[]>("sv-os-achievements", NO_IDS, isStrings);
const rolesSeenStore = persisted<string[]>("sv-os-roles-seen", NO_IDS, isStrings);

export const useUnlocked = unlockedStore.use;
/** Unlocked ids, readable outside React (the Terminal). */
export const getUnlocked = unlockedStore.get;

/** Unlock an achievement (once). The desktop shows a toast for the `achievement` bus event. */
export function unlock(id: string) {
  const current = unlockedStore.get();
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a || current.includes(id)) return;
  unlockedStore.set([...current, id]);
  log("Achievements", `unlocked “${a.title}”`);
  emit("achievement", id);
}

/** "Due Diligence": a work window from every role has been opened. */
export function noteRoleSeen(company: string, role: string) {
  const key = `${company}/${role}`;
  const seen = rolesSeenStore.get();
  if (seen.includes(key)) return;
  const next = [...seen, key];
  rolesSeenStore.set(next);
  const total = experiences.reduce((n, e) => n + e.roles.length, 0);
  if (next.length >= total) unlock("read-roles");
}

/* ---------- Bug Hunt ---------- */

/** Where the 10 bugs hide (each id is used once, by a <Bug id> in that window). */
export const BUG_IDS = [
  "about",
  "projects",
  "project",
  "experience",
  "work",
  "education",
  "photos",
  "music",
  "sysreport",
  "cases",
] as const;
export type BugId = (typeof BUG_IDS)[number];

interface Hunt {
  on: boolean;
  found: string[];
}
const NO_HUNT: Hunt = { on: false, found: [] };
const huntStore = persisted<Hunt>(
  "sv-os-bugs",
  NO_HUNT,
  (v): v is Hunt => !!v && typeof v === "object" && "on" in v && isStrings((v as Hunt).found),
);

export const useBugHunt = huntStore.use;

export function startBugHunt() {
  huntStore.set({ on: true, found: huntStore.get().found });
  log("BugHunt", "started: 10 bugs are hiding in windows");
}

/** Squash a bug; returns how many are found now. */
export function squash(id: BugId): number {
  const hunt = huntStore.get();
  if (hunt.found.includes(id)) return hunt.found.length;
  const found = [...hunt.found, id];
  huntStore.set({ ...hunt, found });
  log("BugHunt", `squashed ${found.length} of ${BUG_IDS.length} (${id})`);
  if (found.length >= BUG_IDS.length) {
    unlock("bugs");
    emit("confetti");
  }
  return found.length;
}
