"use client";
import { useSyncExternalStore } from "react";
import { log } from "../syslog";
import { unlock } from "../achievements";
import { CASES } from "./registry";

/** Which case files this visitor has solved, kept in this browser (localStorage). */
const KEY = "sv-os-cases";
const NONE: string[] = [];

let solved: string[] | null = null;
const listeners = new Set<() => void>();

function load(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Solved case ids. Also readable outside React (the Terminal's `cases`). */
export function getSolvedCases(): string[] {
  if (typeof window === "undefined") return NONE;
  if (!solved) solved = load();
  return solved;
}

export function markSolved(id: string) {
  const current = getSolvedCases();
  if (current.includes(id)) return;
  solved = [...current, id];
  log("CaseFiles", `solved ${id}`);
  unlock("case");
  if (CASES.every((c) => solved!.includes(c.id))) unlock("all-cases");
  try {
    window.localStorage.setItem(KEY, JSON.stringify(solved));
  } catch {
    // Storage unavailable (private mode etc.): the ✓ lasts for this page only.
  }
  listeners.forEach((l) => l());
}

export function useSolvedCases(): string[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSolvedCases,
    () => NONE,
  );
}
