"use client";
import { memo, useEffect, useState } from "react";
import Image from "next/image";
import {
  FaCode,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaGithub,
  FaLinkedin,
  FaPaperPlane,
  FaPlay,
  FaYoutube,
} from "react-icons/fa";
import { experiences, projects, type Project } from "@/app/portfolioData";
import { photos } from "@/app/photos";
import { AppIcon, EMAIL, LINKS, prefersReducedMotion } from "./appMeta";
import { FinderList } from "./FinderSidebar";
import { useWM } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

function Tags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <ul className="os-tags" aria-label="Tech stack">
      {tags.map((t) => (
        <li key={t} className="os-tag">
          {t}
        </li>
      ))}
    </ul>
  );
}

function Highlights({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <>
      <h3>Key highlights</h3>
      <ul className="os-highlights">
        {items.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </>
  );
}

function ExternalButton({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`aqua-btn${primary ? " aqua-btn--primary" : ""}`}
    >
      {children}
    </a>
  );
}

const SHORTCUTS: { kind: AppKind; label: string }[] = [
  { kind: "projects", label: "Projects" },
  { kind: "experience", label: "Experience" },
  { kind: "education", label: "Education" },
  { kind: "resume", label: "Résumé" },
  { kind: "photos", label: "Photos" },
  { kind: "contact", label: "Mail" },
];

/** Icon row in About Me.txt. Each icon opens its own window. */
function Shortcuts() {
  const wm = useWM();
  const [pressed, setPressed] = useState<AppKind | null>(null);
  const open = (kind: AppKind) => {
    setPressed(kind);
    window.setTimeout(
      () => {
        setPressed(null);
        wm.launch(kind);
      },
      prefersReducedMotion() ? 0 : 160,
    );
  };
  return (
    <ul className="os-shortcuts" aria-label="Open a window">
      {SHORTCUTS.map((sc) => (
        <li key={sc.kind}>
          <button
            type="button"
            className={`os-shortcut${pressed === sc.kind ? " is-pressed" : ""}`}
            onClick={() => open(sc.kind)}
          >
            <span className="os-shortcut-icon">
              <AppIcon kind={sc.kind} />
            </span>
            <span>{sc.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function AboutApp() {
  const wm = useWM();
  return (
    <article className="os-doc os-about">
      <header className="os-about-head">
        <Image
          src="/images/personal.png"
          alt="Portrait of Shubh Vashisht"
          width={104}
          height={104}
          className="os-about-photo"
        />
        <div>
          <h1>Hey, I&apos;m Shubh.</h1>
          <p className="os-lede">
            Software engineer building AI products, distributed systems, and robotics platforms.
          </p>
        </div>
      </header>
      <p>
        Software engineer with 4+ years building production systems across AI, distributed
        robotics platforms, and full-stack web. I focus on developer tools, language model
        applications, and real-time infrastructure.
      </p>
      <Shortcuts />

      <h3>Quick facts</h3>
      <dl className="os-facts">
        {[
          ["Born", "2000"],
          ["Eyes", "Brown"],
          ["Bench", "135 lbs"],
          ["Movies", "The Matrix, Rush Hour"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <h3>Elsewhere</h3>
      <div className="os-actions">
        <ExternalButton href={LINKS.github}>
          <FaGithub aria-hidden /> GitHub
        </ExternalButton>
        <ExternalButton href={LINKS.linkedin}>
          <FaLinkedin aria-hidden /> LinkedIn
        </ExternalButton>
        <ExternalButton href={LINKS.youtube}>
          <FaYoutube aria-hidden /> YouTube
        </ExternalButton>
      </div>

      <p className="os-tip">
        Tip: drag windows by their title bar, use the coloured buttons to close, minimize or zoom,
        and pick anything from the sidebar or the dock.
      </p>
    </article>
  );
}

function ProjectsFolderApp() {
  const wm = useWM();
  return (
    <div className="os-folder">
      <ul className="os-folder-grid">
        {projects.map((p) => (
          <li key={p.name}>
            <button
              type="button"
              className="os-folder-item"
              onClick={() => wm.launch("project", { project: p })}
            >
              <span className="os-folder-icon">
                <AppIcon kind="project" payload={{ project: p }} />
                {p.featured && <span className="os-badge">★</span>}
              </span>
              <span className="os-folder-label">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <footer className="os-statusbar">{projects.length} items</footer>
    </div>
  );
}

function ProjectApp({ project }: { project: Project }) {
  const wm = useWM();
  const index = projects.findIndex((p) => p.name === project.name);
  const next = projects[(index + 1) % projects.length];
  return (
    <article className="os-project">
      {project.image && (
        <div className="os-project-hero">
          <Image src={project.image} alt={`${project.name} screenshot`} fill sizes="640px" />
        </div>
      )}
      <div className="os-doc">
        <h1>{project.name}</h1>
        {project.role && <p className="os-meta">{project.role}</p>}
        <Tags tags={project.techStack} />
        <h3>About</h3>
        <p>{project.description}</p>
        <Highlights items={project.highlights} />
        <div className="os-actions">
          {project.demoComponent && (
            <button
              type="button"
              className="aqua-btn aqua-btn--primary"
              onClick={() => wm.launch("demo", { project })}
            >
              <FaPlay aria-hidden /> Launch demo
            </button>
          )}
          {project.projectUrl && (
            <ExternalButton href={project.projectUrl} primary={!project.demoComponent}>
              <FaExternalLinkAlt aria-hidden /> View live
            </ExternalButton>
          )}
          {project.codeUrl && (
            <ExternalButton href={project.codeUrl}>
              <FaCode aria-hidden /> Source
            </ExternalButton>
          )}
        </div>
        {next && next.name !== project.name && (
          <button
            type="button"
            className="os-next"
            onClick={() => wm.launch("project", { project: next })}
          >
            Next project: {next.name} →
          </button>
        )}
      </div>
    </article>
  );
}

/** Short fake commit hash derived from a string, for the git-log look. */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Lines fade in one after another, like output being printed. */
function Line({
  i,
  className,
  as: Tag = "div",
  children,
}: {
  i: number;
  className?: string;
  as?: "div" | "li";
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={`os-term-line${className ? ` ${className}` : ""}`}
      style={{ animationDelay: `${i * 40}ms` }}
    >
      {children}
    </Tag>
  );
}

function WorkApp({ payload }: { payload: AppPayload }) {
  const work = payload.work;
  if (!work) return null;
  let n = 0;
  return (
    <article className="os-term">
      <Line i={n++} className="os-term-prompt">
        <span className="os-term-user">shubh@{slug(payload.company ?? "work")}</span>{" "}
        <span className="os-term-path">~</span> % cat ./{slug(work.name)}/README.md
      </Line>
      <Line i={n++}>
        <h1 className="os-term-title"># {work.name}</h1>
      </Line>
      <dl className="os-term-kv">
        <Line i={n++}>
          <dt>ROLE</dt>
          <dd>{payload.role?.title}</dd>
        </Line>
        <Line i={n++}>
          <dt>COMPANY</dt>
          <dd>{payload.company}</dd>
        </Line>
        <Line i={n++}>
          <dt>PERIOD</dt>
          <dd>{payload.role?.dateRange}</dd>
        </Line>
        {work.techStack?.length ? (
          <Line i={n++}>
            <dt>STACK</dt>
            <dd className="os-term-chips">
              {work.techStack.map((t) => (
                <span key={t}>[{t}]</span>
              ))}
            </dd>
          </Line>
        ) : null}
      </dl>
      <Line i={n++} className="os-term-comment">
        ## About
      </Line>
      <Line i={n++}>
        <p className="os-term-text">{work.description}</p>
      </Line>
      {work.highlights?.length ? (
        <>
          <Line i={n++} className="os-term-comment">
            ## Highlights
          </Line>
          {work.highlights.map((h) => (
            <Line key={h} i={n++}>
              <span className="os-term-ok">[ OK ]</span> {h}
            </Line>
          ))}
        </>
      ) : null}
      {(work.projectUrl || work.codeUrl) && (
        <Line i={n++}>
          <div className="os-actions">
            {work.projectUrl && (
              <ExternalButton href={work.projectUrl}>
                <FaExternalLinkAlt aria-hidden /> View live
              </ExternalButton>
            )}
            {work.codeUrl && (
              <ExternalButton href={work.codeUrl}>
                <FaCode aria-hidden /> Source
              </ExternalButton>
            )}
          </div>
        </Line>
      )}
      <Line i={n++} className="os-term-prompt">
        <span className="os-term-user">shubh@{slug(payload.company ?? "work")}</span>{" "}
        <span className="os-term-path">~</span> % <span className="os-term-caret" aria-hidden />
      </Line>
    </article>
  );
}

function ExperienceApp() {
  const wm = useWM();
  let n = 0;
  return (
    <article className="os-term">
      {experiences.map((exp) => {
        const roles = [...exp.roles].reverse();
        return (
          <section key={exp.company}>
            <Line i={n++} className="os-term-prompt">
              <span className="os-term-user">shubh@{slug(exp.company)}</span>{" "}
              <span className="os-term-path">~/career</span> % git log --graph --roles
            </Line>
            <ol className="os-git">
              {roles.map((role, r) => (
                <li key={role.title}>
                  <Line i={n++}>
                    <span className="os-git-graph">*</span>{" "}
                    <span className="os-git-hash">commit {hash(role.title)}</span>
                    {r === 0 && <span className="os-git-ref"> (HEAD -&gt; main)</span>}
                  </Line>
                  <Line i={n++}>
                    <span className="os-git-graph">|</span> Date: {role.dateRange}
                  </Line>
                  <Line i={n++}>
                    <span className="os-git-graph">|</span>{" "}
                    <strong className="os-git-msg">{role.title}</strong>
                    <span className="os-term-dim"> @ {exp.company}</span>
                  </Line>
                  <ul>
                    {role.projects.map((w) => (
                      <Line key={w.name} i={n++} as="li">
                        <span className="os-git-graph">|</span>{" "}
                        <span className="os-term-dim">+</span>{" "}
                        <button
                          type="button"
                          className="os-term-link"
                          onClick={() =>
                            wm.launch("work", { work: w, company: exp.company, role })
                          }
                        >
                          {w.name}
                        </button>
                      </Line>
                    ))}
                  </ul>
                  {r < roles.length - 1 && (
                    <Line i={n++}>
                      <span className="os-git-graph">|</span>
                    </Line>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
      <Line i={n++} className="os-term-prompt">
        <span className="os-term-path">~/career</span> % <span className="os-term-caret" aria-hidden />
      </Line>
    </article>
  );
}

function EducationApp() {
  return (
    <article className="os-edu">
      <div className="os-edu-photo">
        <Image
          src="/images/umass-grad.jpg"
          alt="Shubh in a graduation cap and gown, with the Manhattan skyline behind"
          fill
          sizes="(max-width: 767px) 100vw, 260px"
        />
      </div>
      <div className="os-doc os-edu-info">
        <Image
          src="/images/umass.png"
          alt="UMass Amherst logo"
          width={84}
          height={84}
          style={{ height: "auto" }}
        />
        <h1>University of Massachusetts Amherst</h1>
        <p className="os-meta">Bachelor&apos;s in Computer Science</p>
        <p className="os-edu-dates">Aug 2019 – Dec 2022</p>
        <p>Where I learned to build things that actually work, preferably on the first try.</p>
        <p className="os-meta">Finished a month ahead of schedule.</p>
      </div>
    </article>
  );
}

function ResumeApp() {
  return (
    <div className="os-preview">
      <div className="os-toolbar">
        <a href="/resume.pdf" download className="aqua-btn aqua-btn--primary">
          <FaDownload aria-hidden /> Download
        </a>
        <ExternalButton href="/resume.pdf">
          <FaExternalLinkAlt aria-hidden /> Open in new tab
        </ExternalButton>
      </div>
      <iframe src="/resume.pdf" title="Résumé" className="os-preview-frame" />
    </div>
  );
}

function ContactApp() {
  const [subject, setSubject] = useState("Hello from your portfolio");
  const [body, setBody] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const url = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };
  return (
    <form className="os-mail" onSubmit={send}>
      <div className="os-toolbar">
        <button type="submit" className="aqua-btn aqua-btn--primary">
          <FaPaperPlane aria-hidden /> Send
        </button>
        <span className="os-toolbar-note">Opens in your email app</span>
      </div>
      <div className="os-mail-field">
        <span>To:</span>
        <span className="os-token">Shubh Vashisht</span>
      </div>
      <label className="os-mail-field">
        <span>Subject:</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <textarea
        className="os-mail-body"
        aria-label="Message"
        placeholder="Write your message…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </form>
  );
}

function DemoApp({ project }: { project: Project }) {
  return <div className="os-demo">{project.demoComponent}</div>;
}

function PhotosApp() {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const go = (d: number) => setIndex((i) => (i + d + count) % count);
  const photo = photos[index];

  useEffect(() => {
    if (count < 2) return;
    // Arrow keys only while the Photos window has focus (Snake also listens to arrows).
    const onKey = (e: KeyboardEvent) => {
      const win = document.activeElement?.closest("[data-win-id='photos']");
      if (!win) return;
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (!photo) return <div className="os-doc os-center">No photos yet.</div>;
  return (
    <div className="os-photos">
      <figure className="os-photo-stage">
        <div className="os-photo-frame">
          <Image key={photo.src} src={photo.src} alt={photo.alt} fill sizes="760px" />
        </div>
        {photo.caption && <figcaption>{photo.caption}</figcaption>}
      </figure>
      <div className="os-photo-bar">
        <button
          type="button"
          className="aqua-btn"
          aria-label="Previous photo"
          disabled={count < 2}
          onClick={() => go(-1)}
        >
          <FaChevronLeft aria-hidden />
        </button>
        <ul className="os-photo-strip" aria-label="Photos">
          {photos.map((p, i) => (
            <li key={p.src}>
              <button
                type="button"
                className={`os-photo-thumb${i === index ? " is-current" : ""}`}
                aria-label={p.caption ?? p.alt}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
              >
                <Image src={p.src} alt="" fill sizes="64px" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="aqua-btn"
          aria-label="Next photo"
          disabled={count < 2}
          onClick={() => go(1)}
        >
          <FaChevronRight aria-hidden />
        </button>
        <span className="os-photo-count">
          {index + 1} of {count}
        </span>
      </div>
    </div>
  );
}

function TrashApp() {
  return (
    <div className="os-doc os-center">
      <AppIcon kind="trash" />
      <p>The Trash is empty.</p>
      <p className="os-meta">Unlike my commit history.</p>
    </div>
  );
}

function HelpApp() {
  return (
    <article className="os-doc">
      <h1>Using this portfolio</h1>
      <ul className="os-highlights">
        <li>The sidebar on the left lists every project and role. Click one to open it.</li>
        <li>Drag a window by its title bar. Drag the bottom-right corner to resize it.</li>
        <li>Red closes, yellow minimizes to the dock, green zooms to fill the screen.</li>
        <li>Double-click a title bar to minimize. Double-click desktop icons to open them.</li>
        <li>In Photos, use the left and right arrow keys to flip through pictures.</li>
        <li>Snake and the Search Visualizer run right here: open them from the dock.</li>
        <li>Press Escape on a focused window to close it.</li>
      </ul>
    </article>
  );
}

/** Window contents. Memoized so dragging a window doesn't re-render its app. */
export const AppBody = memo(function AppBody({
  kind,
  payload,
}: {
  kind: AppKind;
  payload?: AppPayload;
}) {
  switch (kind) {
    case "about":
      return <AboutApp />;
    case "finder":
      return <FinderList />;
    case "projects":
      return <ProjectsFolderApp />;
    case "project":
      return payload?.project ? <ProjectApp project={payload.project} /> : null;
    case "demo":
      return payload?.project ? <DemoApp project={payload.project} /> : null;
    case "work":
      return payload ? <WorkApp payload={payload} /> : null;
    case "experience":
      return <ExperienceApp />;
    case "education":
      return <EducationApp />;
    case "resume":
      return <ResumeApp />;
    case "contact":
      return <ContactApp />;
    case "trash":
      return <TrashApp />;
    case "help":
      return <HelpApp />;
    case "photos":
      return <PhotosApp />;
  }
});
