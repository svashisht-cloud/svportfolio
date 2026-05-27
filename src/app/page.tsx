"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import LandingSection from "../components/LandingSection";
import { FaHome, FaGithub, FaPlay, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { HiMenuAlt3, HiX, HiExternalLink, HiChevronDown } from "react-icons/hi";
import { projects, experiences } from "./portfolioData";
import type { Project } from "./portfolioData";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";
const BTN_PRIMARY = `bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] hover:opacity-90 text-[#161616] font-semibold px-4 py-2 rounded-lg transition motion-reduce:transition-none ${FOCUS}`;
const BTN_SECONDARY = `bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--foreground)] px-4 py-2 rounded-lg transition motion-reduce:transition-none ${FOCUS}`;

const MetaRow = ({ project }: { project: Project }) => {
  const items = [project.role].filter(Boolean) as string[];
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {items.map((item, i) => (
        <React.Fragment key={item}>
          <span className="text-xs text-[var(--muted)]">{item}</span>
          {i < items.length - 1 && <span className="text-[var(--text-dim)] text-xs select-none">·</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

const WorkDetailPanel = ({ project, mobile }: { project: Project; mobile?: boolean }) => {
  const px = mobile ? "px-4" : "px-10";
  return (
    <>
      {/* Title + tech tags */}
      <div className={`${px} pt-10 pb-5 shrink-0 border-b border-[var(--border)]`}>
        <h1 className={`${mobile ? "text-xl" : "text-3xl"} font-bold bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--foreground)] bg-clip-text text-transparent`}>
          {project.name}
        </h1>
        {project.techStack && (
          <div className="flex flex-wrap gap-2 mt-3">
            {project.techStack.map(tag => (
              <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className={`flex-1 overflow-y-auto ${px} ${mobile ? "py-6 space-y-6" : "py-8 space-y-8"}`}>
        {/* About */}
        <div>
          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">About</h2>
          <div className="h-px bg-[var(--border)] mb-5" />
          <p className="text-[var(--foreground)] text-base leading-relaxed">{project.description}</p>
        </div>

        {/* Key Highlights */}
        {project.highlights && project.highlights.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">Key Highlights</h2>
            <div className="h-px bg-[var(--border)] mb-5" />
            <ul className="space-y-3">
              {project.highlights.map(h => (
                <li key={h} className="flex items-start gap-3">
                  <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0 select-none">✦</span>
                  <span className="text-sm text-[var(--muted)] leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const [displayedProject, setDisplayedProject] = useState<Project | null>(null);
  const [contentVisible, setContentVisible] = useState(true);
  const isFirstMount = useRef(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [experienceOpen, setExperienceOpen] = useState(true);
  const [openRoles, setOpenRoles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    experiences.forEach(exp => exp.roles.forEach(r => { init[r.title] = false; }));
    return init;
  });

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setContentVisible(false);
    const t = setTimeout(() => {
      setDisplayedProject(selectedProject);
      setContentVisible(true);
    }, 200);
    return () => clearTimeout(t);
  }, [selectedProject]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowDemo(false);
    setIsMenuOpen(false);
    for (const exp of experiences) {
      for (const role of exp.roles) {
        if (role.projects.some(wp => wp.name === project.name)) {
          setExperienceOpen(true);
          setOpenRoles(prev => ({ ...prev, [role.title]: true }));
          return;
        }
      }
    }
  };

  const handleGoToCode = () => {
    if (displayedProject) window.open(displayedProject.codeUrl, "_blank");
  };

  const handleGoToProject = () => {
    if (displayedProject?.projectUrl) window.open(displayedProject.projectUrl, "_blank");
  };

  const currentIndex = projects.findIndex(p => p.name === displayedProject?.name);
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const nextProject = currentIndex !== -1 && currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  return (
    // Dot grid + accent bloom background for tech vibe
    <div
      className="h-screen flex flex-col relative"
      style={{
        backgroundColor: "var(--background)",
        backgroundImage:
          "radial-gradient(circle, rgba(154,168,255,0.07) 1px, transparent 1px), " +
          "radial-gradient(ellipse at 20% 10%, rgba(154,168,255,0.06) 0%, transparent 55%)",
        backgroundSize: "28px 28px, 100% 100%",
      }}
    >
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[var(--surface)] border-b border-[var(--border)] h-16 p-4 flex items-center justify-between lg:hidden z-50">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/25 to-transparent" />
        <div className="flex items-center space-x-2">
          <button
            aria-label="Go to home"
            onClick={() => { setSelectedProject(null); setShowDemo(false); }}
            className={`text-2xl font-bold text-[var(--accent)] rounded ${FOCUS}`}
          >
            SV
          </button>
          <button
            onClick={() => { setSelectedProject(null); setShowDemo(false); }}
            aria-label="Go to home"
            className={`px-2 py-1 text-[var(--accent)] rounded flex items-center ${FOCUS}`}
          >
            <FaHome className="w-5 h-5" />
          </button>
        </div>
        <button
          className={`text-[var(--foreground)] p-2 -mr-2 rounded ${FOCUS}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenuAlt3 className="w-6 h-6" />}
        </button>
      </div>

      {/* Spacer for fixed mobile top bar */}
      <div className="h-16 lg:hidden shrink-0" />

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed left-0 right-0 top-16 bottom-0 bg-[var(--background)] z-40 transition-transform duration-300 transform motion-reduce:transition-none lg:hidden flex flex-col ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          {/* Projects section header */}
          <button
            onClick={() => setProjectsOpen(o => !o)}
            className={`w-full flex items-center justify-between py-3 border-b border-[var(--border)] rounded ${FOCUS}`}
          >
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Projects</span>
            <HiChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${projectsOpen ? "rotate-0" : "-rotate-90"}`} />
          </button>

          {/* Personal project list */}
          {projectsOpen && projects.map((project) => {
            const isActive = selectedProject?.name === project.name;
            return (
              <button
                key={project.name}
                onClick={() => handleProjectClick(project)}
                className={`w-full flex items-center py-4 px-4 transition-colors motion-reduce:transition-none border-b border-[var(--border)] last:border-0 text-[var(--foreground)] ${FOCUS}
                  ${isActive ? "bg-[var(--surface-raised)]" : "hover:bg-[var(--surface-raised)]"}
                `}
              >
                {project.image && (
                  <Image
                    src={project.image}
                    alt={project.name}
                    width={50}
                    height={50}
                    className="mr-4"
                    style={{ width: 50, height: "auto" }}
                  />
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm block">{project.name}</span>
                    {project.featured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                        Featured
                      </span>
                    )}
                  </div>
                  {project.techStack && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.techStack.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Experience section header */}
          <button
            onClick={() => setExperienceOpen(o => !o)}
            className={`w-full flex items-center justify-between py-3 border-b border-[var(--border)] mt-4 rounded ${FOCUS}`}
          >
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Experience</span>
            <HiChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${experienceOpen ? "rotate-0" : "-rotate-90"}`} />
          </button>

          {/* Experience tree */}
          {experienceOpen && experiences.map((exp) => (
            <div key={exp.company} className="mt-2">
              <div className="flex items-center gap-2.5 py-2 px-4 border-b border-[var(--border)]">
                <Image src={exp.logo} alt={exp.company} width={24} height={24}
                  className="rounded object-contain" style={{ height: "auto" }} />
                <span className="text-sm font-bold text-[var(--foreground)]">{exp.company}</span>
              </div>

              {/* Role cards */}
              <div className="px-2 py-2 space-y-2">
                {exp.roles.map((role) => (
                  <div key={role.title} className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <button
                      onClick={() => setOpenRoles(prev => ({ ...prev, [role.title]: !prev[role.title] }))}
                      className={`w-full flex items-center justify-between p-3 bg-[var(--surface-raised)] hover:bg-[var(--border)] transition-colors motion-reduce:transition-none ${FOCUS}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-0.5 h-8 rounded-full shrink-0 transition-colors ${openRoles[role.title] ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
                        <div className="text-left min-w-0">
                          <span className="text-sm font-semibold text-[var(--foreground)] block truncate">{role.title}</span>
                          <span className="text-[11px] text-[var(--muted)]/70">{role.dateRange}</span>
                        </div>
                      </div>
                      <HiChevronDown className={`w-4 h-4 text-[var(--muted)]/60 transition-transform duration-200 shrink-0 ml-2 ${openRoles[role.title] ? "rotate-0" : "-rotate-90"}`} />
                    </button>

                    {openRoles[role.title] && (
                      <div className="border-t border-[var(--border)] py-1.5">
                        {role.projects.map((wp) => {
                          const isActive = selectedProject?.name === wp.name;
                          return (
                            <button
                              key={wp.name}
                              onClick={() => handleProjectClick(wp as Project)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs
                                transition-colors motion-reduce:transition-none
                                ${isActive
                                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                                } ${FOCUS}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"}`} />
                              <span className="truncate">{wp.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Social links — pinned to bottom */}
        <div className="shrink-0 px-4 py-4 border-t border-[var(--border)] flex items-center justify-center gap-6">
          <a href="https://github.com/shubh-vashisht" target="_blank" rel="noopener noreferrer"
             aria-label="GitHub"
             className={`text-[var(--muted)] hover:text-[var(--foreground)] transition-colors motion-reduce:transition-none rounded ${FOCUS}`}>
            <FaGithub className="w-5 h-5" />
          </a>
          <a href="https://www.linkedin.com/in/shubh-vashisht/" target="_blank" rel="noopener noreferrer"
             aria-label="LinkedIn"
             className={`text-[var(--muted)] hover:text-[var(--foreground)] transition-colors motion-reduce:transition-none rounded ${FOCUS}`}>
            <FaLinkedin className="w-5 h-5" />
          </a>
          <a href="mailto:nucaluregaming@gmail.com"
             aria-label="Email"
             className={`text-[var(--muted)] hover:text-[var(--foreground)] transition-colors motion-reduce:transition-none rounded ${FOCUS}`}>
            <FaEnvelope className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        {/* Sidebar */}
        <div
          className="border-r border-[var(--border)] w-1/4 p-6 flex flex-col overflow-y-auto"
          style={{ background: "linear-gradient(to bottom, #1E1E1E 0%, #1A1A1A 100%)" }}
        >
          <button
            aria-label="Go to home"
            onClick={() => { setSelectedProject(null); setShowDemo(false); }}
            className={`text-left text-3xl font-bold mb-2 text-[var(--accent)] rounded ${FOCUS}`}
          >
            Shubh Vashisht
          </button>

          {/* Projects section */}
          <div className="mt-4">
            <button
              onClick={() => setProjectsOpen(o => !o)}
              className={`w-full flex items-center justify-between mb-3 rounded ${FOCUS}`}
            >
              <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Projects</h3>
              <HiChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${projectsOpen ? "rotate-0" : "-rotate-90"}`} />
            </button>
            {projectsOpen && (
              <div className="space-y-2">
                {projects.map((project) => {
                  const isActive = selectedProject?.name === project.name;
                  return (
                    <button
                      key={project.name}
                      onClick={() => handleProjectClick(project)}
                      className={`w-full flex flex-col items-center justify-center h-40 py-4 font-semibold transition-all motion-reduce:transition-none rounded-lg overflow-hidden border
                        hover:-translate-y-0.5 active:translate-y-0
                        ${isActive
                          ? "border-[var(--accent)] ring-1 ring-[var(--accent)] text-[var(--foreground)] shadow-[0_0_14px_rgba(154,168,255,0.25)]"
                          : "border-[var(--border)] hover:border-[var(--accent)] text-[var(--foreground)]/75 hover:text-[var(--foreground)]"
                        }
                        ${FOCUS}
                      `}
                      style={{
                        background: isActive
                          ? "linear-gradient(180deg, rgba(154,168,255,0.08) 0%, var(--surface-raised) 100%)"
                          : "linear-gradient(180deg, rgba(154,168,255,0.03) 0%, var(--surface-raised) 100%)",
                      }}
                    >
                      {project.image && (
                        <Image
                          src={project.image}
                          alt={project.name}
                          width={100}
                          height={60}
                          className="max-w-full object-contain max-h-[56px]"
                          style={{ height: "auto" }}
                        />
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-sm">{project.name}</span>
                        {project.featured && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                            Featured
                          </span>
                        )}
                      </div>
                      {project.techStack && (
                        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                          {project.techStack.slice(0, 2).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Experience section */}
          <div className="mt-6">
            <button
              onClick={() => setExperienceOpen(o => !o)}
              className={`w-full flex items-center justify-between mb-3 rounded ${FOCUS}`}
            >
              <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Experience</h3>
              <HiChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${experienceOpen ? "rotate-0" : "-rotate-90"}`} />
            </button>

            {experienceOpen && experiences.map((exp) => (
              <div key={exp.company} className="mb-4">
                {/* Company header */}
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <Image src={exp.logo} alt={exp.company} width={24} height={24}
                    className="rounded object-contain" style={{ height: "auto" }} />
                  <span className="text-sm font-bold text-[var(--foreground)]">{exp.company}</span>
                </div>

                {/* Role cards */}
                {exp.roles.map((role) => (
                  <div key={role.title} className="mb-2 rounded-lg border border-[var(--border)] overflow-hidden">
                    <button
                      onClick={() => setOpenRoles(prev => ({ ...prev, [role.title]: !prev[role.title] }))}
                      className={`w-full flex items-center justify-between p-3 bg-[var(--surface-raised)] hover:bg-[var(--border)] transition-colors motion-reduce:transition-none ${FOCUS}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-0.5 h-8 rounded-full shrink-0 transition-colors ${openRoles[role.title] ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
                        <div className="text-left min-w-0">
                          <span className="text-sm font-semibold text-[var(--foreground)] block truncate">{role.title}</span>
                          <span className="text-[11px] text-[var(--muted)]/70">{role.dateRange}</span>
                        </div>
                      </div>
                      <HiChevronDown className={`w-4 h-4 text-[var(--muted)]/60 transition-transform duration-200 shrink-0 ml-2 ${openRoles[role.title] ? "rotate-0" : "-rotate-90"}`} />
                    </button>

                    {openRoles[role.title] && (
                      <div className="border-t border-[var(--border)] py-1.5">
                        {role.projects.map((wp) => {
                          const isActive = selectedProject?.name === wp.name;
                          return (
                            <button
                              key={wp.name}
                              onClick={() => handleProjectClick(wp as Project)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs
                                transition-colors motion-reduce:transition-none
                                ${isActive
                                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
                                } ${FOCUS}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-[var(--accent)]" : "bg-[var(--muted)]/30"}`} />
                              <span className="truncate">{wp.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pinned social links */}
          <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-center gap-5">
            <a href="https://github.com/shubh-vashisht" target="_blank" rel="noopener noreferrer"
               aria-label="GitHub"
               className={`text-[var(--muted)] hover:text-[var(--foreground)] transition-colors motion-reduce:transition-none rounded ${FOCUS}`}>
              <FaGithub className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/shubh-vashisht/" target="_blank" rel="noopener noreferrer"
               aria-label="LinkedIn"
               className={`text-[var(--muted)] hover:text-[var(--foreground)] transition-colors motion-reduce:transition-none rounded ${FOCUS}`}>
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a href="mailto:nucaluregaming@gmail.com"
               aria-label="Email"
               className={`text-[var(--muted)] hover:text-[var(--foreground)] transition-colors motion-reduce:transition-none rounded ${FOCUS}`}>
              <FaEnvelope className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-transparent">
          {displayedProject ? (
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              {!showDemo ? (
                <>
                  {displayedProject.image ? (
                    <>
                      {/* Hero strip — accent-tinted radial glow */}
                      <div
                        className="w-full border-b border-[var(--border)] flex items-center justify-center shrink-0"
                        style={{
                          minHeight: "200px",
                          maxHeight: "260px",
                          background: "radial-gradient(ellipse at 50% 40%, rgba(154,168,255,0.07) 0%, var(--surface-raised) 30%, var(--surface) 70%)",
                        }}
                      >
                        <Image
                          src={displayedProject.image}
                          alt={displayedProject.name}
                          width={480}
                          height={240}
                          className="max-w-full object-contain p-8"
                          style={{ height: "auto", maxHeight: "260px", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.55))" }}
                        />
                      </div>
                      {/* Title + tags */}
                      <div className="px-10 pt-8 pb-3 shrink-0">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--foreground)] bg-clip-text text-transparent">
                          {displayedProject.name}
                        </h1>
                        {displayedProject.techStack && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {displayedProject.techStack.map(tag => (
                              <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Metadata row */}
                      <div className="px-10 pb-3 shrink-0">
                        <MetaRow project={displayedProject} />
                      </div>
                      {/* Subtle divider */}
                      <div className="border-t border-[var(--border)]/40 mx-10 shrink-0" />
                      {/* Scrollable body */}
                      <div className="flex-1 overflow-y-auto min-h-0 px-10 py-8 space-y-8">
                        <div>
                          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">About</h2>
                          <div className="h-px bg-[var(--border)] mb-5" />
                          <p className="text-[var(--foreground)] text-base leading-relaxed max-w-2xl">{displayedProject.description}</p>
                        </div>
                        {displayedProject.highlights && displayedProject.highlights.length > 0 && (
                          <div>
                            <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">Key Highlights</h2>
                            <div className="h-px bg-[var(--border)] mb-5" />
                            <ul className="space-y-3">
                              {displayedProject.highlights.map(h => (
                                <li key={h} className="flex items-start gap-3">
                                  <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0 select-none">✦</span>
                                  <span className="text-sm text-[var(--muted)] leading-relaxed">{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <WorkDetailPanel project={displayedProject} />
                  )}
                  {/* Action buttons */}
                  <div className="px-10 py-4 flex gap-3 shrink-0 border-t border-[var(--border)]">
                    {displayedProject.projectUrl && (
                      <button onClick={handleGoToProject} className={`flex items-center gap-2 ${BTN_PRIMARY}`}>
                        <HiExternalLink className="w-4 h-4" />
                        View Live
                      </button>
                    )}
                    {displayedProject.codeUrl && (
                      <button onClick={handleGoToCode} className={`flex items-center gap-2 ${BTN_SECONDARY}`}>
                        <FaGithub className="w-4 h-4" />
                        Source
                      </button>
                    )}
                    {displayedProject.demoComponent && (
                      <button onClick={() => setShowDemo(true)} className={`flex items-center gap-2 ${BTN_SECONDARY}`}>
                        <FaPlay className="w-3 h-3" />
                        Working Demo
                      </button>
                    )}
                  </div>
                  {/* Nav footer — personal projects only */}
                  {currentIndex !== -1 && (
                    <div className="px-10 py-5 border-t border-[var(--border)] flex justify-between items-center shrink-0">
                      <button
                        onClick={() => prevProject && handleProjectClick(prevProject)}
                        disabled={!prevProject}
                        className={`flex flex-col items-start gap-0.5 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-25 disabled:cursor-not-allowed transition motion-reduce:transition-none ${FOCUS}`}
                      >
                        <span className="text-xs">← Previous</span>
                        {prevProject && <span className="text-xs text-[var(--text-dim)] max-w-[140px] truncate">{prevProject.name}</span>}
                      </button>
                      <button
                        onClick={() => nextProject && handleProjectClick(nextProject)}
                        disabled={!nextProject}
                        className={`flex flex-col items-end gap-0.5 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-25 disabled:cursor-not-allowed transition motion-reduce:transition-none ${FOCUS}`}
                      >
                        <span className="text-xs">Next →</span>
                        {nextProject && <span className="text-xs text-[var(--text-dim)] max-w-[140px] truncate">{nextProject.name}</span>}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-4 flex justify-between items-center">
                    <h1 className="text-[var(--foreground)] text-2xl font-bold">
                      {displayedProject.name} Demo
                    </h1>
                    <button onClick={() => setShowDemo(false)} className={BTN_SECONDARY}>
                      Back
                    </button>
                  </div>
                  {displayedProject.demoComponent}
                </div>
              )}
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center p-6 transition-all duration-200 ease-out motion-reduce:transition-none ${contentVisible ? "opacity-100" : "opacity-0"}`}>
              <LandingSection setIsMenuOpen={setIsMenuOpen} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Main Content */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden bg-transparent">
        {displayedProject ? (
          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none ${contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            {!showDemo ? (
              <>
                {displayedProject.image ? (
                  <>
                    {/* Hero strip */}
                    <div
                      className="w-full border-b border-[var(--border)] flex items-center justify-center shrink-0"
                      style={{
                        minHeight: "140px",
                        maxHeight: "180px",
                        background: "radial-gradient(ellipse at 50% 40%, rgba(154,168,255,0.07) 0%, var(--surface-raised) 30%, var(--surface) 70%)",
                      }}
                    >
                      <Image
                        src={displayedProject.image}
                        alt={displayedProject.name}
                        width={320}
                        height={160}
                        className="max-w-full object-contain p-6"
                        style={{ height: "auto", maxHeight: "180px", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.55))" }}
                      />
                    </div>
                    {/* Title + tags */}
                    <div className="px-4 pt-4 pb-2 shrink-0">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--foreground)] bg-clip-text text-transparent">
                        {displayedProject.name}
                      </h1>
                      {displayedProject.techStack && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {displayedProject.techStack.map(tag => (
                            <span key={tag} className="px-2.5 py-1 text-xs rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Metadata row */}
                    <div className="px-4 pb-2 shrink-0">
                      <MetaRow project={displayedProject} />
                    </div>
                    {/* Subtle divider */}
                    <div className="border-t border-[var(--border)]/40 mx-4 shrink-0" />
                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6 space-y-6">
                      <div>
                        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">About</h2>
                        <div className="h-px bg-[var(--border)] mb-5" />
                        <p className="text-[var(--foreground)] text-base leading-relaxed">{displayedProject.description}</p>
                      </div>
                      {displayedProject.highlights && displayedProject.highlights.length > 0 && (
                        <div>
                          <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">Key Highlights</h2>
                          <div className="h-px bg-[var(--border)] mb-5" />
                          <ul className="space-y-3">
                            {displayedProject.highlights.map(h => (
                              <li key={h} className="flex items-start gap-3">
                                <span className="text-[var(--accent)] text-sm mt-0.5 shrink-0 select-none">✦</span>
                                <span className="text-sm text-[var(--muted)] leading-relaxed">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <WorkDetailPanel project={displayedProject} mobile />
                )}
                {/* Mobile action buttons */}
                <div className="px-4 py-4 flex flex-col gap-2 shrink-0 border-t border-[var(--border)]">
                  {displayedProject.projectUrl && (
                    <button
                      onClick={handleGoToProject}
                      className={`w-full flex items-center justify-center gap-2 ${BTN_PRIMARY}`}
                    >
                      <HiExternalLink className="w-4 h-4" />
                      View Live
                    </button>
                  )}
                  {(displayedProject.codeUrl || displayedProject.demoComponent) && (
                    <div className="flex gap-2">
                      {displayedProject.codeUrl && (
                        <button
                          onClick={handleGoToCode}
                          className={`flex-1 flex items-center justify-center gap-2 ${displayedProject.projectUrl ? BTN_SECONDARY : BTN_PRIMARY}`}
                        >
                          <FaGithub className="w-4 h-4" />
                          Source
                        </button>
                      )}
                      {displayedProject.demoComponent && (
                        <button
                          onClick={() => setShowDemo(true)}
                          className={`flex-1 flex items-center justify-center gap-2 ${(displayedProject.projectUrl || displayedProject.codeUrl) ? BTN_SECONDARY : BTN_PRIMARY}`}
                        >
                          <FaPlay className="w-3 h-3" />
                          Demo
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Nav footer — personal projects only */}
                {currentIndex !== -1 && (
                  <div className="bg-[var(--surface)] border-t border-[var(--border)] px-6 py-4 flex justify-between items-center shrink-0">
                    <button
                      onClick={() => prevProject && handleProjectClick(prevProject)}
                      disabled={!prevProject}
                      className={`flex flex-col items-start gap-0.5 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-25 disabled:cursor-not-allowed transition motion-reduce:transition-none ${FOCUS}`}
                    >
                      <span className="text-xs">← Previous</span>
                      {prevProject && <span className="text-xs text-[var(--text-dim)] max-w-[110px] truncate">{prevProject.name}</span>}
                    </button>
                    <button
                      onClick={() => nextProject && handleProjectClick(nextProject)}
                      disabled={!nextProject}
                      className={`flex flex-col items-end gap-0.5 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-25 disabled:cursor-not-allowed transition motion-reduce:transition-none ${FOCUS}`}
                    >
                      <span className="text-xs">Next →</span>
                      {nextProject && <span className="text-xs text-[var(--text-dim)] max-w-[110px] truncate">{nextProject.name}</span>}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 p-4 flex flex-col">
                <div className="mb-4 flex justify-between items-center">
                  <h1 className="text-[var(--foreground)] text-xl font-bold">
                    {displayedProject.name} Demo
                  </h1>
                  <button onClick={() => setShowDemo(false)} className={BTN_SECONDARY}>
                    Back
                  </button>
                </div>
                {displayedProject.demoComponent}
              </div>
            )}
          </div>
        ) : (
          <div className={`flex-1 flex items-center justify-center p-4 transition-all duration-200 ease-out motion-reduce:transition-none ${contentVisible ? "opacity-100" : "opacity-0"}`}>
            <LandingSection setIsMenuOpen={setIsMenuOpen} />
          </div>
        )}
      </div>
    </div>
  );
}
