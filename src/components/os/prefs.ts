"use client";
import { useSyncExternalStore } from "react";
import { log } from "./syslog";
import { DEFAULT_WIDGETS, isWidgetId, type WidgetId } from "./widgetList";

export const WALLPAPERS = [
  { id: "aqua", name: "Aqua Blue" },
  { id: "graphite", name: "Graphite" },
  { id: "sunset", name: "Sunset" },
  { id: "aurora", name: "Aurora" },
  { id: "teal", name: "Classic Teal" },
  { id: "pinstripe", name: "Pinstripe" },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]["id"];
export type Appearance = "blue" | "graphite";
export type ThemeMode = "system" | "light" | "dark";

export interface Prefs {
  wallpaper: WallpaperId;
  appearance: Appearance;
  theme: ThemeMode;
  /** Sound effects. Off by default. */
  sound: boolean;
  /** Dashboard widgets on the desktop (master switch). */
  widgets: boolean;
  /** Which widgets are on the desktop, chosen from the right-click menu. */
  shownWidgets: WidgetId[];
  /** Finder sidebar expanded (true) or collapsed to a rail. Desktop only. */
  sidebar: boolean;
}

const KEY = "sv-os-prefs";
const DEFAULTS: Prefs = {
  wallpaper: "aqua",
  appearance: "blue",
  theme: "system",
  sound: false,
  widgets: true,
  shownWidgets: DEFAULT_WIDGETS,
  sidebar: true,
};

let current: Prefs | null = null;
const listeners = new Set<() => void>();

function load(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      wallpaper: WALLPAPERS.some((w) => w.id === parsed.wallpaper)
        ? (parsed.wallpaper as WallpaperId)
        : DEFAULTS.wallpaper,
      appearance: parsed.appearance === "graphite" ? "graphite" : "blue",
      theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : "system",
      sound: parsed.sound === true,
      widgets: parsed.widgets !== false,
      shownWidgets: Array.isArray(parsed.shownWidgets)
        ? [...new Set(parsed.shownWidgets.filter(isWidgetId))]
        : DEFAULT_WIDGETS,
      sidebar: parsed.sidebar !== false,
    };
  } catch {
    return DEFAULTS;
  }
}

function snapshot(): Prefs {
  if (!current) current = load();
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  current = { ...snapshot(), ...patch };
  log("Preferences", Object.entries(patch).map(([k, v]) => `${k} = ${v}`).join(", "));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage unavailable (private mode etc.): the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
}

/** Per-visitor wallpaper and appearance, saved in localStorage when available. */
export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => DEFAULTS,
  );
}

/** Read prefs outside React (e.g. sounds.ts). */
export function getPrefs(): Prefs {
  return typeof window === "undefined" ? DEFAULTS : snapshot();
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme actually in use: the visitor's choice, or their system setting. */
export function useEffectiveTheme(): "light" | "dark" {
  const { theme } = usePrefs();
  const systemDark = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DARK_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
  if (theme === "system") return systemDark ? "dark" : "light";
  return theme;
}
