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
  | "photos";

export interface AppPayload {
  project?: Project;
  work?: WorkProject;
  company?: string;
  role?: Role;
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
}
