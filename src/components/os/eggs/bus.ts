"use client";

/** Tiny event bus so the Terminal, menu bar etc. can trigger desktop-wide Easter eggs. */
export type EggEvent = "panic" | "confetti" | "devmode";

const handlers = new Map<EggEvent, Set<() => void>>();

export function emit(event: EggEvent) {
  handlers.get(event)?.forEach((fn) => fn());
}

export function on(event: EggEvent, fn: () => void) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(fn);
  return () => {
    handlers.get(event)?.delete(fn);
  };
}

/** Unlocked by clicking the menu-bar logo 7 times. Read by the Terminal's `devmode` command. */
let devMode = false;
export const isDevMode = () => devMode;
export function unlockDevMode() {
  devMode = true;
  emit("devmode");
}
