"use client";

/**
 * Tiny event bus so the Terminal, menu bar, Spotlight etc. can reach other parts of the desktop.
 * Easter eggs: panic, confetti, devmode. Messages for an open window (see deliver.ts):
 * ask (ShubhGPT question), terminal (command to run), sysreport (skill to show), compose (Mail body).
 * achievement (id just unlocked; the desktop shows a toast).
 */
export type BusEvent =
  | "panic"
  | "confetti"
  | "devmode"
  | "ask"
  | "terminal"
  | "sysreport"
  | "compose"
  | "achievement";

type Handler = (detail?: string) => void;

const handlers = new Map<BusEvent, Set<Handler>>();

export function emit(event: BusEvent, detail?: string) {
  handlers.get(event)?.forEach((fn) => fn(detail));
}

export function on(event: BusEvent, fn: Handler) {
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
