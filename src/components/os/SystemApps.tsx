"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { careerSteps, isCurrentRole, roleStart } from "@/app/portfolioData";
import { impact, profile } from "@/app/profile";
import { SKILL_GROUPS, evidenceFor, groupOf } from "@/app/skills";
import { AppIcon, EMAIL, prefersReducedMotion } from "./appMeta";
import { deliver } from "./deliver";
import { on } from "./eggs/bus";
import { useWM } from "./WindowManager";
import { Bug } from "./AchievementsApp";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "4 years, 5 months" since a month. */
function since(start: { y: number; m: number }) {
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - start.y) * 12 + now.getMonth() - start.m);
  const y = Math.floor(months / 12);
  const m = months % 12;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  return [y ? part(y, "year") : "", m ? part(m, "month") : ""].filter(Boolean).join(", ") || "under a month";
}

/** The newest role held now, and the newest one that has ended. */
function currentAndPrevious() {
  const steps = careerSteps();
  const current = [...steps].reverse().find((s) => isCurrentRole(s.role));
  const previous = [...steps].reverse().find((s) => !isCurrentRole(s.role));
  return { steps, current, previous };
}

/* ---------- About This Developer (logo menu) ---------- */

export function SysInfoApp() {
  const wm = useWM();
  const [line, setLine] = useState(0);
  const { steps, current, previous } = currentAndPrevious();
  const first = steps[0] ? roleStart(steps[0].role) : null;
  // Clicking the version line cycles through it, like the real About box.
  const lines = [
    `Version ${steps[steps.length - 1]?.version ?? "1.0"}`,
    `Build: ${profile.education}`,
    first ? `Uptime: ${since(first)} shipping production software` : "Uptime: unknown",
  ];
  return (
    <div className="os-sysinfo">
      <Image
        src="/images/avatar.jpg"
        alt="Portrait of Shubh Vashisht"
        width={96}
        height={96}
        className="os-sysinfo-photo"
      />
      <h1>{profile.name}</h1>
      <p className="os-sysinfo-headline">{profile.headline}</p>
      <button
        type="button"
        className="os-sysinfo-version"
        onClick={() => setLine((l) => (l + 1) % lines.length)}
        title="Click for more"
        aria-live="polite"
      >
        {lines[line]}
      </button>
      <dl className="os-sysinfo-specs">
        {current && (
          <div>
            <dt>Current</dt>
            <dd>
              {current.role.title}, {current.company}
            </dd>
          </div>
        )}
        {previous && (
          <div>
            <dt>Previously</dt>
            <dd>
              {previous.role.title}, {previous.company}
            </dd>
          </div>
        )}
        <div>
          <dt>Location</dt>
          <dd>{profile.location}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{profile.status}</dd>
        </div>
      </dl>
      <div className="os-sysinfo-buttons">
        <button type="button" className="aqua-btn" onClick={() => wm.launch("sysreport")}>
          More Info…
        </button>
        <button type="button" className="aqua-btn" onClick={() => wm.launch("update")}>
          Software Update…
        </button>
      </div>
      <p className="os-sysinfo-legal">
        ™ &amp; © 2000–{new Date().getFullYear()} {profile.name}.
        <br />
        All rights reserved.
      </p>
    </div>
  );
}

/* ---------- System Report (skills with evidence) ---------- */

const OVERVIEW = "Overview";

export function SysReportApp({ focus }: { focus?: string }) {
  const wm = useWM();
  const [section, setSection] = useState(() => groupOf(focus)?.label ?? OVERVIEW);
  const [flash, setFlash] = useState(focus);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const mainRef = useRef<HTMLElement>(null);

  // A skill sent while the window is open (from Spotlight).
  useEffect(
    () =>
      on("sysreport", (skill) => {
        const group = groupOf(skill);
        if (!group) return;
        setSection(group.label);
        setFlash(skill);
      }),
    [],
  );

  // Scroll the highlighted skill into view (inside this pane only), then let the highlight fade.
  useEffect(() => {
    const main = mainRef.current;
    if (!flash || !main) return;
    const row = [...main.querySelectorAll<HTMLElement>("[data-skill]")].find(
      (r) => r.dataset.skill?.toLowerCase() === flash.toLowerCase(),
    );
    if (row) {
      const top = main.scrollTop + row.getBoundingClientRect().top - main.getBoundingClientRect().top - 40;
      main.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    const t = window.setTimeout(() => setFlash(undefined), 1800);
    return () => window.clearTimeout(t);
  }, [flash, section]);

  const { current } = currentAndPrevious();
  const group = SKILL_GROUPS.find((g) => g.label === section);

  return (
    <div className="os-sysreport">
      <div className="os-sysreport-body">
        <nav className="os-sysreport-side" aria-label="Report sections">
          <h3>Developer</h3>
          <button
            type="button"
            className={`os-sysreport-item${section === OVERVIEW ? " is-active" : ""}`}
            aria-current={section === OVERVIEW ? "true" : undefined}
            onClick={() => setSection(OVERVIEW)}
          >
            {OVERVIEW}
          </button>
          <h3>Skills</h3>
          {SKILL_GROUPS.map((g) => (
            <button
              key={g.label}
              type="button"
              className={`os-sysreport-item${section === g.label ? " is-active" : ""}`}
              aria-current={section === g.label ? "true" : undefined}
              onClick={() => setSection(g.label)}
            >
              {g.label}
            </button>
          ))}
        </nav>
        <section className="os-sysreport-main" ref={mainRef} aria-live="polite">
          {!group ? (
            <>
              <h2>Developer Overview</h2>
              <dl className="os-sysreport-kv">
                <div>
                  <dt>Name:</dt>
                  <dd>{profile.name}</dd>
                </div>
                <div>
                  <dt>Title:</dt>
                  <dd>{profile.headline}</dd>
                </div>
                {current && (
                  <div>
                    <dt>Current:</dt>
                    <dd>
                      {current.role.title}, {current.company} ({current.role.dateRange})
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Previously:</dt>
                  <dd>{profile.previously}</dd>
                </div>
                <div>
                  <dt>Education:</dt>
                  <dd>{profile.education}</dd>
                </div>
                <div>
                  <dt>Location:</dt>
                  <dd>{profile.location}</dd>
                </div>
                <div>
                  <dt>Status:</dt>
                  <dd>{profile.status}</dd>
                </div>
                <div>
                  <dt>Résumé:</dt>
                  <dd>
                    <button type="button" className="os-linkish" onClick={() => wm.launch("resume")}>
                      Résumé.pdf
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Email:</dt>
                  <dd>
                    <a className="os-linkish" href={`mailto:${EMAIL}`}>
                      {EMAIL}
                    </a>
                  </dd>
                </div>
              </dl>
              <h2>Impact</h2>
              <table className="os-playlist os-sysreport-table">
                <thead>
                  <tr>
                    <th>Before</th>
                    <th>After</th>
                    <th>What</th>
                    <th>Where</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.map((i) => (
                    <tr key={i.label}>
                      <td>{i.from}</td>
                      <td>
                        <strong>{i.to}</strong>
                      </td>
                      <td>{i.label}</td>
                      <td>{i.where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <h2>{group.label}</h2>
              <p className="os-meta">From the skills on my résumé. Click a place to open it.</p>
              <table className="os-playlist os-sysreport-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Where I used it</th>
                  </tr>
                </thead>
                <tbody>
                  {group.skills.map((skill) => {
                    const evidence = evidenceFor(skill);
                    const open = expanded[skill];
                    const shown = open ? evidence : evidence.slice(0, 3);
                    return (
                      <tr
                        key={skill}
                        data-skill={skill}
                        className={flash?.toLowerCase() === skill.toLowerCase() ? "is-flash" : undefined}
                      >
                        <td className="os-sysreport-skill">{skill}</td>
                        <td>
                          <ul className="os-evidence">
                            {evidence.length === 0 && (
                              <li>
                                <button type="button" onClick={() => wm.launch("resume")} title="Open my résumé">
                                  Listed on my résumé
                                </button>
                              </li>
                            )}
                            {shown.map((ev) => (
                              <li key={`${ev.kind}:${ev.label}`}>
                                <button
                                  type="button"
                                  title={ev.detail}
                                  onClick={() =>
                                    ev.kind === "work"
                                      ? wm.launch("work", ev.payload)
                                      : wm.launch("project", ev.payload)
                                  }
                                >
                                  {ev.label}
                                </button>
                              </li>
                            ))}
                            {evidence.length > 3 && (
                              <li>
                                <button
                                  type="button"
                                  className="os-evidence-more"
                                  onClick={() => setExpanded((x) => ({ ...x, [skill]: !open }))}
                                  aria-expanded={open}
                                >
                                  {open ? "Show fewer" : `+${evidence.length - 3} more`}
                                </button>
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </section>
      </div>
      <footer className="os-sysreport-path">
        Shubh&apos;s Mac ▸ {group ? `Skills ▸ ${group.label}` : "Developer ▸ Overview"} <Bug id="sysreport" />
      </footer>
    </div>
  );
}

/* ---------- Software Update (career as release notes) ---------- */

export function UpdateApp() {
  const wm = useWM();
  const steps = careerSteps();
  const newest = steps[steps.length - 1];
  const [selected, setSelected] = useState(newest?.version);
  const sel = steps.find((s) => s.version === selected) ?? newest;
  if (!newest || !sel) return <div className="os-doc os-center">Shubh is up to date.</div>;

  const released = (s: (typeof steps)[number]) => {
    const start = roleStart(s.role);
    return start ? `${MONTHS[start.m]} ${start.y}` : s.role.dateRange;
  };

  return (
    <div className="os-update">
      <header className="os-update-head">
        <span className="os-update-icon">
          <AppIcon kind="update" />
        </span>
        <div>
          <h1>Software Update</h1>
          <p>
            Shubh {newest.version} is available. Earlier versions are installed; select one to read its
            notes.
          </p>
        </div>
      </header>
      <div className="os-update-list">
        <table className="os-playlist os-update-table">
          <thead>
            <tr>
              <th aria-label="Status" />
              <th>Name</th>
              <th>Version</th>
              <th>Released</th>
            </tr>
          </thead>
          <tbody>
            {[...steps].reverse().map((s) => (
              <tr key={s.version} className={s.version === sel.version ? "is-current" : undefined}>
                <td>{s === newest ? <span className="os-update-new">New</span> : "✓"}</td>
                <td>
                  <button
                    type="button"
                    className="os-playlist-song"
                    onClick={() => setSelected(s.version)}
                    aria-pressed={s.version === sel.version}
                  >
                    Shubh {s.version}: {s.role.title}, {s.company}
                  </button>
                </td>
                <td>{s.version}</td>
                <td>{released(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="os-update-notes" aria-live="polite">
        <h2>
          Shubh {sel.version}: {sel.role.title}, {sel.company}
        </h2>
        <p className="os-meta">
          {sel.role.dateRange} · {sel === newest ? "New" : "Installed"}
        </p>
        <p>This version adds:</p>
        <ul>
          {sel.role.projects.map((w) => (
            <li key={w.name}>
              <strong>{w.name}</strong>
              {w.highlights?.[0] ? `: ${w.highlights[0]}` : ""}
            </li>
          ))}
        </ul>
      </section>
      <footer className="os-update-foot">
        <span className="os-meta">Installing opens Mail.</span>
        <div className="os-update-buttons">
          <button type="button" className="aqua-btn" onClick={() => wm.close("update")}>
            Not Now
          </button>
          <button
            type="button"
            className="aqua-btn aqua-btn--primary"
            onClick={() =>
              deliver(
                wm,
                "contact",
                "compose",
                `Hi Shubh,\n\nI'd like to install Shubh ${newest.version} on my team.\n\n`,
              )
            }
          >
            Install
          </button>
        </div>
      </footer>
    </div>
  );
}
