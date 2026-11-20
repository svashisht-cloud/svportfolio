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
  | "shubhgpt"
  | "cases"
  | "case"
  | "sysinfo"
  | "sysreport"
  | "update"
  | "virtualpc"
  | "classic"
  | "achievements"
  | "console"
  | "activity";

export interface AppPayload {
  project?: Project;
  work?: WorkProject;
  company?: string;
  role?: Role;
  /**
   * Name of an untitled desktop folder, or the item a Get Info window describes. For windows
   * opened through deliver(): Mail's body, ShubhGPT's question, the Terminal's command, the
   * skill System Report shows.
   */
  label?: string;
  /** For Get Info on a desktop icon: the app that icon opens. */
  target?: AppKind;
  /** Which case file a `case` window plays (see cases/registry.ts). */
  caseId?: string;
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
  /** When it was opened (ms since the epoch), for Activity Monitor. */
  openedAt?: number;
}
