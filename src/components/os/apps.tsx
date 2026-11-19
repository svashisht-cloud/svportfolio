"use client";
import { memo, useState } from "react";
import Image from "next/image";
import {
  FaCode,
  FaDownload,
  FaExternalLinkAlt,
  FaGithub,
  FaLinkedin,
  FaPaperPlane,
  FaPlay,
  FaYoutube,
} from "react-icons/fa";
import { experiences, projects, type Project } from "@/app/portfolioData";
import { AppIcon, EMAIL, LINKS } from "./appMeta";
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
      <div className="os-actions">
        <button type="button" className="aqua-btn aqua-btn--primary" onClick={() => wm.launch("projects")}>
          Browse Projects
        </button>
        <button type="button" className="aqua-btn" onClick={() => wm.launch("experience")}>
          Experience
        </button>
        <button type="button" className="aqua-btn" onClick={() => wm.launch("education")}>
          Education
        </button>
        <button type="button" className="aqua-btn" onClick={() => wm.launch("resume")}>
          Résumé
        </button>
        <button type="button" className="aqua-btn" onClick={() => wm.launch("contact")}>
          Say hello
        </button>
      </div>

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

function WorkApp({ payload }: { payload: AppPayload }) {
  const work = payload.work;
  if (!work) return null;
  return (
    <article className="os-doc">
      <h1>{work.name}</h1>
      <p className="os-meta">
        {payload.role?.title} · {payload.company} · {payload.role?.dateRange}
      </p>
      <Tags tags={work.techStack} />
      <h3>About</h3>
      <p>{work.description}</p>
      <Highlights items={work.highlights} />
      {(work.projectUrl || work.codeUrl) && (
        <div className="os-actions">
          {work.projectUrl && (
            <ExternalButton href={work.projectUrl} primary>
              <FaExternalLinkAlt aria-hidden /> View live
            </ExternalButton>
          )}
          {work.codeUrl && (
            <ExternalButton href={work.codeUrl}>
              <FaCode aria-hidden /> Source
            </ExternalButton>
          )}
        </div>
      )}
    </article>
  );
}

function ExperienceApp() {
  const wm = useWM();
  return (
    <article className="os-doc">
      {experiences.map((exp) => (
        <section key={exp.company}>
          <h1>{exp.company}</h1>
          <ol className="os-timeline">
            {[...exp.roles].reverse().map((role) => (
              <li key={role.title}>
                <p className="os-timeline-role">
                  <strong>{role.title}</strong>
                  <span>{role.dateRange}</span>
                </p>
                <ul>
                  {role.projects.map((w) => (
                    <li key={w.name}>
                      <button
                        type="button"
                        className="os-link"
                        onClick={() =>
                          wm.launch("work", { work: w, company: exp.company, role })
                        }
                      >
                        {w.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}

function EducationApp() {
  return (
    <article className="os-doc os-center">
      <Image
        src="/images/umass.png"
        alt="UMass Amherst logo"
        width={120}
        height={120}
        style={{ height: "auto" }}
      />
      <h1>University of Massachusetts Amherst</h1>
      <p className="os-meta">Bachelor&apos;s in Computer Science</p>
      <p>
        Where I learned to build things that actually work, preferably on the first try.
      </p>
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
  }
});
