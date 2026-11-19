"use client";
import { useEffect, useRef, useState } from "react";
import { appName, LINKS } from "./appMeta";
import { useWM, useWMState } from "./WindowManager";

type MenuEntry =
  | "sep"
  | { label: string; run?: () => void; disabled?: boolean; checked?: boolean; hint?: string };

interface Menu {
  key: string;
  label: React.ReactNode;
  aria: string;
  items: MenuEntry[];
  /** Hidden on phones to keep the bar short. */
  desktopOnly?: boolean;
}

function useClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    const first = window.setTimeout(() => setNow(fmt()), 0);
    const id = window.setInterval(() => setNow(fmt()), 15_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return now;
}

const openTab = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

export default function MenuBar({ onShutDown }: { onShutDown: () => void }) {
  const wm = useWM();
  const { wins, focused } = useWMState();
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const clock = useClock();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const downloadResume = () => {
    const a = document.createElement("a");
    a.href = "/resume.pdf";
    a.download = "";
    a.click();
  };

  const menus: Menu[] = [
    {
      key: "logo",
      label: <span className="os-logo">SV</span>,
      aria: "System menu",
      items: [
        { label: "About This Developer", run: () => wm.launch("about") },
        "sep",
        { label: "View Résumé", run: () => wm.launch("resume") },
        { label: "Download Résumé", run: downloadResume },
        "sep",
        { label: "Restart…", run: () => window.location.reload() },
        { label: "Shut Down…", run: onShutDown },
      ],
    },
    {
      key: "app",
      label: <strong>{appName(focused?.kind, focused?.payload)}</strong>,
      aria: "Application menu",
      items: [
        { label: "Portfolio Help", run: () => wm.launch("help") },
        "sep",
        {
          label: `Close ${focused?.title ?? "Window"}`,
          disabled: !focused,
          run: () => focused && wm.close(focused.id),
        },
      ],
    },
    {
      key: "file",
      label: "File",
      aria: "File menu",
      desktopOnly: true,
      items: [
        { label: "New Message", run: () => wm.launch("contact") },
        { label: "Open Projects Folder", run: () => wm.launch("projects") },
        "sep",
        {
          label: "Close Window",
          disabled: !focused,
          hint: "esc",
          run: () => focused && wm.close(focused.id),
        },
      ],
    },
    {
      key: "view",
      label: "View",
      aria: "View menu",
      desktopOnly: true,
      items: [
        { label: "About Me", run: () => wm.launch("about") },
        { label: "Projects", run: () => wm.launch("projects") },
        { label: "Experience", run: () => wm.launch("experience") },
        { label: "Education", run: () => wm.launch("education") },
      ],
    },
    {
      key: "go",
      label: "Go",
      aria: "Go menu",
      desktopOnly: true,
      items: [
        { label: "GitHub", run: () => openTab(LINKS.github) },
        { label: "LinkedIn", run: () => openTab(LINKS.linkedin) },
        { label: "YouTube", run: () => openTab(LINKS.youtube) },
      ],
    },
    {
      key: "window",
      label: "Window",
      aria: "Window menu",
      items: [
        {
          label: "Minimize",
          disabled: !focused,
          run: () => focused && wm.minimize(focused.id),
        },
        {
          label: "Zoom",
          disabled: !focused,
          run: () => focused && wm.toggleMaximize(focused.id),
        },
        ...(wins.length ? (["sep"] as MenuEntry[]) : []),
        ...wins.map((w) => ({
          label: w.minimized ? `◆ ${w.title}` : w.title,
          checked: focused?.id === w.id,
          run: () => wm.activate(w.id),
        })),
      ],
    },
    {
      key: "help",
      label: "Help",
      aria: "Help menu",
      desktopOnly: true,
      items: [{ label: "Portfolio Help", run: () => wm.launch("help") }],
    },
  ];

  return (
    <header className="os-menubar" ref={barRef}>
      <nav className="os-menus" aria-label="Menu bar">
        {menus.map((m) => (
          <div key={m.key} className={`os-menu-root${m.desktopOnly ? " os-desktop-only" : ""}`}>
            <button
              type="button"
              className="os-menu-trigger"
              aria-haspopup="menu"
              aria-expanded={open === m.key}
              aria-label={m.aria}
              onClick={() => setOpen((o) => (o === m.key ? null : m.key))}
              onPointerEnter={() => {
                if (open && open !== m.key) setOpen(m.key);
              }}
            >
              {m.label}
            </button>
            {open === m.key && (
              <ul className="os-menu" role="menu">
                {m.items.map((it, i) =>
                  it === "sep" ? (
                    <li key={`sep-${i}`} className="os-menu-sep" role="separator" />
                  ) : (
                    <li key={`${it.label}-${i}`} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="os-menu-item"
                        disabled={it.disabled}
                        onClick={() => {
                          setOpen(null);
                          it.run?.();
                        }}
                      >
                        <span className="os-menu-check" aria-hidden>
                          {it.checked ? "✓" : ""}
                        </span>
                        <span className="os-menu-label">{it.label}</span>
                        {it.hint && <span className="os-menu-hint">{it.hint}</span>}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <div className="os-menubar-right" aria-label="Clock">
        {clock}
      </div>
    </header>
  );
}
