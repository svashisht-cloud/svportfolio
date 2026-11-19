"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import "./os.css";
import { AppBody } from "./apps";
import { AppIcon, MOBILE_QUERY, isMobileNow } from "./appMeta";
import Dock from "./Dock";
import FinderSidebar from "./FinderSidebar";
import MenuBar from "./MenuBar";
import Window from "./Window";
import { WindowManagerProvider, useWM, useWMState } from "./WindowManager";
import type { AppKind } from "./types";

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

const DESKTOP_ICONS: { kind: AppKind; label: string }[] = [
  { kind: "about", label: "About Me.txt" },
  { kind: "projects", label: "Projects" },
  { kind: "resume", label: "Résumé.pdf" },
  { kind: "contact", label: "Mail Me" },
];

function DesktopIcons() {
  const wm = useWM();
  const [selected, setSelected] = useState<AppKind | null>(null);
  return (
    <ul className="os-desktop-icons" aria-label="Desktop">
      {DESKTOP_ICONS.map((d) => (
        <li key={d.kind}>
          <button
            type="button"
            className="os-desk-icon"
            aria-pressed={selected === d.kind}
            aria-label={`${d.label} (double-click to open)`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelected(d.kind);
            }}
            onBlur={() => setSelected(null)}
            onDoubleClick={() => wm.launch(d.kind)}
            onKeyDown={(e) => {
              if (e.key === "Enter") wm.launch(d.kind);
            }}
          >
            <span className="os-desk-icon-box">
              <AppIcon kind={d.kind} />
            </span>
            <span className="os-desk-icon-label">{d.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Workspace() {
  const wm = useWM();
  const mobile = useIsMobile();
  const { wins, focused } = useWMState();
  const [shutDown, setShutDown] = useState(false);

  // Open the starting windows once. On phones, the Finder list sits under About.
  useEffect(() => {
    if (isMobileNow()) wm.launch("finder");
    wm.launch("about");
  }, [wm]);

  return (
    <div className={`os-root${mobile ? " is-mobile" : ""}`}>
      <div className="os-wallpaper" aria-hidden />
      <MenuBar onShutDown={() => setShutDown(true)} />
      {!mobile && <FinderSidebar />}
      {!mobile && <DesktopIcons />}
      <main className="os-windows" aria-label="Open windows">
        {wins.map((w) => (
          <Window key={w.id} win={w} focused={focused?.id === w.id} mobile={mobile}>
            <AppBody kind={w.kind} payload={w.payload} />
          </Window>
        ))}
      </main>
      <Dock mobile={mobile} />
      {shutDown && (
        <div className="os-shutdown" role="dialog" aria-label="Shut down">
          <p>Thanks for stopping by.</p>
          <button type="button" className="aqua-btn aqua-btn--primary" onClick={() => setShutDown(false)}>
            Turn it back on
          </button>
        </div>
      )}
    </div>
  );
}

export default function Desktop() {
  return (
    <WindowManagerProvider>
      <Workspace />
    </WindowManagerProvider>
  );
}
