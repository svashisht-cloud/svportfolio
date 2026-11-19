"use client";
import { useSyncExternalStore } from "react";

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

export interface Prefs {
  wallpaper: WallpaperId;
  appearance: Appearance;
}

const KEY = "sv-os-prefs";
const DEFAULTS: Prefs = { wallpaper: "aqua", appearance: "blue" };

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
