"use client";
import { useState } from "react";
import { FaSearch, FaStar } from "react-icons/fa";
import { experiences, projects } from "@/app/portfolioData";
import { AppIcon, describe, useIsMobile } from "./appMeta";
import { setPrefs, usePrefs } from "./prefs";
import { useWM, useWMState } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

const FAVORITES: { kind: AppKind; label: string }[] = [
  { kind: "about", label: "About Me" },
  { kind: "shubhgpt", label: "Ask ShubhGPT" },
  { kind: "projects", label: "Projects" },
  { kind: "cases", label: "Case Files" },
  { kind: "experience", label: "Experience" },
  { kind: "education", label: "Education" },
  { kind: "resume", label: "Résumé" },
  { kind: "photos", label: "Photos" },
  { kind: "music", label: "Music" },
  { kind: "terminal", label: "Terminal" },
  { kind: "contact", label: "Contact" },
];

function matches(q: string, ...fields: (string | string[] | undefined)[]) {
  if (!q) return true;
  const hay = fields.flat().filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q);
}

/** The Projects / Experience source list. Pinned on desktop, its own window on mobile. */
export function FinderList() {
  const wm = useWM();
  // Terminal needs a keyboard, so phones don't list it.
  const mobile = useIsMobile();
  const { focused } = useWMState();
  const [query, setQuery] = useState("");
  // Newest role (last in the data) starts expanded.
  const [openRoles, setOpenRoles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const exp of experiences) {
      const last = exp.roles[exp.roles.length - 1];
      if (last) init[`${exp.company}/${last.title}`] = true;
    }
    return init;
  });
  const q = query.trim().toLowerCase();

  const item = ({
    kind,
    payload,
    label,
    extra,
    indent = 0,
  }: {
    key: string;
    kind: AppKind;
    payload?: AppPayload;
    label: string;
    extra?: React.ReactNode;
    indent?: number;
  }) => {
    const active = focused?.id === describe(kind, payload).id;
    return (
      <li key={describe(kind, payload).id}>
        <button
          type="button"
          className={`os-source-item${active ? " is-active" : ""}`}
          style={{ paddingLeft: 12 + indent * 14 }}
          aria-current={active ? "true" : undefined}
          onClick={() => wm.launch(kind, payload)}
        >
          <span className="os-source-icon">
            <AppIcon kind={kind} payload={payload} />
          </span>
          <span className="os-source-label">{label}</span>
          {extra}
        </button>
      </li>
    );
  };

  const shownProjects = projects.filter((p) => matches(q, p.name, p.techStack, p.description));

  return (
    <div className="os-finder">
      <label className="os-search">
        <FaSearch aria-hidden />
        <input
          type="search"
          placeholder="Search projects & skills"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search projects and experience"
        />
      </label>
      <nav className="os-source" aria-label="Portfolio">
        {!q && (
          <>
            <h3>Favorites</h3>
            <ul>
              {FAVORITES.filter((f) => !(mobile && f.kind === "terminal")).map((f) => (
                item({ key: f.kind, kind: f.kind, label: f.label })
              ))}
            </ul>
          </>
        )}

        <h3>Projects</h3>
        <ul>
          {shownProjects.map((p) => (
            item({
              key: p.name,
              kind: "project",
              payload: { project: p },
              label: p.name,
              extra: p.featured ? (
                <FaStar className="os-source-star" aria-label="Featured" />
              ) : undefined,
            })
          ))}
          {shownProjects.length === 0 && <li className="os-source-empty">No matching projects</li>}
        </ul>

        <h3>Experience</h3>
        <ul>
          {experiences.map((exp) =>
            [...exp.roles].reverse().map((role) => {
              const key = `${exp.company}/${role.title}`;
              const works = role.projects.filter((w) =>
                matches(q, w.name, w.techStack, w.description, role.title),
              );
              if (q && works.length === 0) return null;
              const open = q ? true : !!openRoles[key];
              return (
                <li key={key}>
                  <button
                    type="button"
                    className="os-source-item os-source-group"
                    aria-expanded={open}
                    onClick={() => setOpenRoles((s) => ({ ...s, [key]: !s[key] }))}
                  >
                    <span className={`os-disclosure${open ? " is-open" : ""}`} aria-hidden>
                      ▶
                    </span>
                    <span className="os-source-label">
                      {role.title}
                      <small>
                        {exp.company} · {role.dateRange}
                      </small>
                    </span>
                  </button>
                  {open && (
                    <ul>
                      {works.map((w) => (
                        item({
                          key: w.name,
                          kind: "work",
                          payload: { work: w, company: exp.company, role },
                          label: w.name,
                          indent: 1,
                        })
                      ))}
                    </ul>
                  )}
                </li>
              );
            }),
          )}
        </ul>
      </nav>
    </div>
  );
}

/** Sidebar-shaped glyph for the collapse/expand button. */
function SidebarGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 5.5h1.5M3 7.5h1.5M3 9.5h1.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** The collapsed sidebar: Favorites as an icon-only rail. */
function FinderRail() {
  const wm = useWM();
  const { focused } = useWMState();
  return (
    <nav className="os-rail" aria-label="Favorites">
      <ul>
        {FAVORITES.map((f) => (
          <li key={f.kind}>
            <button
              type="button"
              className={`os-rail-item${focused?.kind === f.kind ? " is-active" : ""}`}
              title={f.label}
              aria-label={f.label}
              onClick={() => wm.launch(f.kind)}
            >
              <AppIcon kind={f.kind} />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Pinned brushed-metal Finder window on the left edge (desktop only). Collapses to a rail (prefs.sidebar). */
export default function FinderSidebar() {
  const { sidebar } = usePrefs();
  return (
    <aside className={`os-sidebar${sidebar ? "" : " is-collapsed"}`} aria-label="Finder">
      <div className="os-titlebar os-titlebar--metal">
        {sidebar && (
          <>
            <div className="os-lights" aria-hidden>
              <span className="os-light os-light--close is-disabled" />
              <span className="os-light os-light--min is-disabled" />
              <span className="os-light os-light--max is-disabled" />
            </div>
            <h2 className="os-title">Shubh&apos;s Mac</h2>
          </>
        )}
        <button
          type="button"
          className="os-sidebar-toggle"
          onClick={() => setPrefs({ sidebar: !sidebar })}
          aria-expanded={sidebar}
          aria-label={sidebar ? "Hide sidebar" : "Show sidebar"}
          title={sidebar ? "Hide Sidebar (⌘⌥S)" : "Show Sidebar (⌘⌥S)"}
        >
          <SidebarGlyph />
        </button>
      </div>
      {sidebar ? <FinderList /> : <FinderRail />}
    </aside>
  );
}
