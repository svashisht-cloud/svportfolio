"use client";
import { useSyncExternalStore } from "react";

/** The joke files in the Trash. Emptying it removes them for a few seconds. */
export const TRASH_FILES = [
  { name: "bugs.txt", kind: "Plain text", size: "4 KB" },
  { name: "final_FINAL_v3.psd", kind: "Photoshop file", size: "86 MB" },
  { name: "node_modules", kind: "Folder", size: "2.1 GB" },
  { name: "todo_later.md", kind: "Markdown", size: "1 KB" },
];

let full = true;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function setTrashFull(value: boolean) {
  full = value;
  notify();
}

export function useTrashFull() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => full,
    () => true,
  );
}
