"use client";
import Image from "next/image";
import type { IconType } from "react-icons";
import {
  FaBriefcase,
  FaEnvelope,
  FaFilePdf,
  FaFolder,
  FaFolderOpen,
  FaGithub,
  FaGraduationCap,
  FaLinkedin,
  FaQuestion,
  FaTrashAlt,
  FaUser,
} from "react-icons/fa";
import type { AppKind, AppPayload } from "./types";

export const MENUBAR_H = 22;
export const SIDEBAR_W = 248;
export const DOCK_H = 84;
export const DOCK_H_MOBILE = 64;
export const MOBILE_QUERY = "(max-width: 767px)";

export const EMAIL = "nucaluregaming@gmail.com";
export const LINKS = {
  github: "https://github.com/shubh-vashisht",
  linkedin: "https://www.linkedin.com/in/shubh-vashisht/",
  youtube: "https://www.youtube.com/@shubhy4628",
};

export function describe(kind: AppKind, payload?: AppPayload): { id: string; title: string } {
  switch (kind) {
    case "project":
      return { id: `project:${payload?.project?.name}`, title: payload?.project?.name ?? "Project" };
    case "demo":
      return { id: `demo:${payload?.project?.name}`, title: payload?.project?.name ?? "Demo" };
    case "work":
      return { id: `work:${payload?.work?.name}`, title: payload?.work?.name ?? "Work" };
    case "about":
      return { id: "about", title: "About Me.txt" };
    case "finder":
      return { id: "finder", title: "Shubh's Mac" };
    case "projects":
      return { id: "projects", title: "Projects" };
    case "experience":
      return { id: "experience", title: "Experience" };
    case "education":
      return { id: "education", title: "Education" };
    case "resume":
      return { id: "resume", title: "Résumé.pdf" };
    case "contact":
      return { id: "contact", title: "New Message" };
    case "trash":
      return { id: "trash", title: "Trash" };
    case "help":
      return { id: "help", title: "Portfolio Help" };
  }
}

const SIZES: Record<AppKind, [number, number]> = {
  about: [540, 600],
  finder: [320, 600],
  projects: [640, 460],
  project: [640, 620],
  work: [600, 560],
  experience: [580, 560],
  education: [440, 420],
  resume: [660, 760],
  contact: [540, 460],
  demo: [560, 680],
  trash: [400, 280],
  help: [480, 440],
};

export function defaultSize(kind: AppKind, payload?: AppPayload): [number, number] {
  // The search visualizer needs more room than the snake board.
  if (kind === "demo" && payload?.project?.name?.toLowerCase().includes("search")) return [620, 760];
  return SIZES[kind];
}

/** Name shown in bold in the menu bar for the focused window. */
export function appName(kind: AppKind | undefined, payload?: AppPayload): string {
  switch (kind) {
    case "about":
      return "TextEdit";
    case "resume":
      return "Preview";
    case "contact":
      return "Mail";
    case "help":
      return "Help Viewer";
    case "demo":
      return payload?.project?.name ?? "Demo";
    case "project":
      return "Projects";
    case "work":
    case "experience":
      return "Experience";
    case "education":
      return "Education";
    default:
      return "Finder";
  }
}

interface IconSpec {
  icon: IconType;
  c1: string;
  c2: string;
}

const ICONS: Record<string, IconSpec> = {
  about: { icon: FaUser, c1: "#9fdcff", c2: "#1f6fd1" },
  finder: { icon: FaFolderOpen, c1: "#b5dcff", c2: "#2a6fd6" },
  projects: { icon: FaFolder, c1: "#a8d4ff", c2: "#2a7de1" },
  experience: { icon: FaBriefcase, c1: "#ffd796", c2: "#c9711f" },
  work: { icon: FaBriefcase, c1: "#ffd796", c2: "#c9711f" },
  education: { icon: FaGraduationCap, c1: "#d2c2ff", c2: "#5f43cf" },
  resume: { icon: FaFilePdf, c1: "#ffab9c", c2: "#c42d24" },
  contact: { icon: FaEnvelope, c1: "#b6ecaf", c2: "#2a9440" },
  trash: { icon: FaTrashAlt, c1: "#eef0f3", c2: "#8b95a3" },
  help: { icon: FaQuestion, c1: "#fff1a6", c2: "#cf9a12" },
  github: { icon: FaGithub, c1: "#8a929e", c2: "#161b22" },
  linkedin: { icon: FaLinkedin, c1: "#7cc0ff", c2: "#0a5cb8" },
};

/** Glossy rounded tile icon. Project-backed windows use the project's screenshot. */
export function AppIcon({
  kind,
  payload,
  name,
}: {
  kind?: AppKind;
  payload?: AppPayload;
  /** Use a named icon from the table (e.g. "github") instead of an app kind. */
  name?: string;
}) {
  const image = payload?.project?.image;
  if (image && (kind === "project" || kind === "demo")) {
    return (
      <span className="os-icon os-icon--img" aria-hidden>
        <Image src={image} alt="" fill sizes="96px" />
      </span>
    );
  }
  const spec = ICONS[name ?? kind ?? "projects"] ?? ICONS.projects;
  const Icon = spec.icon;
  return (
    <span
      className="os-icon"
      aria-hidden
      style={{ "--c1": spec.c1, "--c2": spec.c2 } as React.CSSProperties}
    >
      <Icon />
    </span>
  );
}

export function isMobileNow() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
