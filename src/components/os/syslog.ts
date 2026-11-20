"use client";
import { useSyncExternalStore } from "react";

/**
 * The Console app's log: what happened on this desktop during this visit (windows opening,
 * music, ShubhGPT requests, achievements…). In memory only, never sent anywhere.
 */
export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  id: number;
  /** ms since the epoch */
  at: number;
  subsystem: string;
  message: string;
  level: LogLevel;
}

const MAX = 500;
const NONE: LogEntry[] = [];
let entries: LogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

export function log(subsystem: string, message: string, level: LogLevel = "info") {
  if (typeof window === "undefined") return;
  entries = [...entries.slice(-(MAX - 1)), { id: nextId++, at: Date.now(), subsystem, message, level }];
  listeners.forEach((l) => l());
}

export function clearLog() {
  entries = [];
  listeners.forEach((l) => l());
}

export function useLog(): LogEntry[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => entries,
    () => NONE,
  );
}
