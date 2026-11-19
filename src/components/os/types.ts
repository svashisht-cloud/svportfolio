import type { Project, Role, WorkProject } from "@/app/portfolioData";

export type AppKind =
  | "about"
  | "finder"
  | "projects"
  | "project"
  | "work"
  | "experience"
  | "education"
  | "resume"
  | "contact"
  | "demo"
  | "trash"
  | "help"
  | "photos"
  | "terminal"
  | "prefs"
  | "music"
  | "folder"
  | "info"
  | "shubhgpt";

export interface AppPayload {
  project?: Project;
  work?: WorkProject;
  company?: string;
  role?: Role;
  /** Name of an untitled desktop folder, or the item a Get Info window describes. */
  label?: string;
  /** For Get Info on a desktop icon: the app that icon opens. */
  target?: AppKind;
}

export type WinPhase = "opening" | "open" | "closing" | "minimizing" | "restoring";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WinState extends Rect {
  id: string;
  kind: AppKind;
  title: string;
  payload?: AppPayload;
  z: number;
  minimized: boolean;
  maximized: boolean;
  phase: WinPhase;
  /** Offset from the window's centre to the dock, used by the minimize/restore animation. */
  mx: number;
  my: number;
  /** Geometry to return to when un-maximizing. */
  prev?: Rect;
  /** "Windows fall" Easter egg: where the window was before it fell, and its resting tilt. */
  fallFrom?: Rect;
  tilt?: number;
}
