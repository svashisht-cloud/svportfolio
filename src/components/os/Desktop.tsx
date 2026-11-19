"use client";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import "./os.css";
import { AppBody } from "./apps";
import { AppIcon, MOBILE_QUERY, isMobileNow, prefersReducedMotion } from "./appMeta";
import { Boot, Login, hasBooted } from "./BootScreen";
import ContextMenu, { type ContextEntry, type ContextMenuState } from "./ContextMenu";
import Dock from "./Dock";
import FinderSidebar from "./FinderSidebar";
import MenuBar from "./MenuBar";
import { MusicProvider } from "./Music";
import { usePrefs } from "./prefs";
import { useSelection } from "./useSelection";
import Window from "./Window";
import { WindowManagerProvider, useWM, useWMState } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

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

interface DeskItem {
  key: string;
  kind: AppKind;
  label: string;
  payload?: AppPayload;
}

const DESKTOP_ICONS: DeskItem[] = [
  { key: "about", kind: "about", label: "About Me.txt" },
  { key: "projects", kind: "projects", label: "Projects" },
  { key: "resume", kind: "resume", label: "Résumé.pdf" },
  { key: "photos", kind: "photos", label: "Photos" },
  { key: "contact", kind: "contact", label: "Mail Me" },
];

/** How long the screen-on effect lasts (matches os-wake-* in os.css). */
const WAKE_MS = 650;

function DesktopIcons({
  items,
  wallpaperMenu,
  showMenu,
}: {
  items: DeskItem[];
  wallpaperMenu: ContextEntry[];
  showMenu: (m: ContextMenuState) => void;
}) {
  const wm = useWM();
  const open = (keys: string[]) =>
    keys.forEach((k) => {
      const it = items.find((i) => i.key === k);
      if (it) wm.launch(it.kind, it.payload);
    });
  const sel = useSelection(
    items.map((i) => i.key),
    open,
  );

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const key = (e.target as HTMLElement).closest<HTMLElement>("[data-sel-key]")?.dataset.selKey;
    const item = items.find((i) => i.key === key);
    if (!item) {
      showMenu({ x: e.clientX, y: e.clientY, items: wallpaperMenu });
      return;
    }
    // Right-clicking an unselected icon selects just that icon, as in Finder.
    const selection = sel.selected.includes(item.key) ? sel.selected : [item.key];
    sel.setSelected(selection);
    showMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: selection.length > 1 ? `Open ${selection.length} Items` : "Open",
          run: () => open(selection),
        },
        "sep",
        {
          label: "Get Info",
          run: () => wm.launch("info", { label: item.label, target: item.kind }),
        },
      ],
    });
  };

  return (
    <div className="os-desktop-layer" {...sel.containerProps} onContextMenu={onContextMenu}>
      <ul className="os-desktop-icons" aria-label="Desktop">
        {items.map((d) => (
          <li key={d.key}>
            <button
              type="button"
              className="os-desk-icon"
              aria-label={`${d.label} (double-click to open)`}
              {...sel.itemProps(d.key)}
            >
              <span className="os-desk-icon-box">
                <AppIcon kind={d.kind} payload={d.payload} />
              </span>
              <span className="os-desk-icon-label">{d.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {sel.band && <div className="os-band" style={sel.band} aria-hidden />}
    </div>
  );
}

/**
 * pending → (boot) → waking → desktop ⇄ loggedOut.
 * "pending" is a black first frame while we check whether this tab has booted before.
 */
type Stage = "pending" | "boot" | "waking" | "desktop" | "loggedOut";

function Workspace() {
  const wm = useWM();
  const mobile = useIsMobile();
  const prefs = usePrefs();
  const { wins, focused } = useWMState();
  const [stage, setStage] = useState<Stage>("pending");
  const [shutDown, setShutDown] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const wake = useCallback(() => {
    setStage("waking");
    // On phones, the Finder list sits under About.
    if (isMobileNow()) wm.launch("finder");
    wm.launch("about");
    window.setTimeout(() => setStage("desktop"), prefersReducedMotion() ? 0 : WAKE_MS);
  }, [wm]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (hasBooted() || prefersReducedMotion()) wake();
      else setStage("boot");
    }, 0);
    return () => window.clearTimeout(t);
  }, [wake]);

  const leave = (next: Stage) => {
    setMenu(null);
    wm.closeAll();
    window.setTimeout(() => setStage(next), prefersReducedMotion() ? 0 : 220);
  };

  const newFolder = () => {
    setFolders((f) => {
      const used = new Set(f);
      let name = "untitled folder";
      for (let n = 2; used.has(name); n++) name = `untitled folder ${n}`;
      return [...f, name];
    });
  };

  const wallpaperMenu: ContextEntry[] = [
    { label: "New Folder", run: newFolder },
    "sep",
    { label: "Change Desktop Background…", run: () => wm.launch("prefs") },
    { label: "Clean Up", run: () => wm.cleanUp() },
    "sep",
    { label: "Open Terminal", run: () => wm.launch("terminal") },
    { label: "Get Info", run: () => wm.launch("info") },
  ];

  const deskItems: DeskItem[] = [
    ...DESKTOP_ICONS,
    ...folders.map((name) => ({
      key: `folder:${name}`,
      kind: "folder" as const,
      label: name,
      payload: { label: name },
    })),
  ];

  const closeMenu = useCallback(() => setMenu(null), []);

  return (
    <div
      className={[
        "os-root",
        mobile ? "is-mobile" : "",
        stage === "waking" ? "is-waking" : "",
      ].join(" ")}
      data-appearance={prefs.appearance}
    >
      <div className="os-wallpaper" data-wallpaper={prefs.wallpaper} aria-hidden />
      <MenuBar
        onShutDown={() => setShutDown(true)}
        onRestart={() => leave("boot")}
        onLogOut={() => leave("loggedOut")}
      />
      {!mobile && <FinderSidebar />}
      {!mobile && (
        <DesktopIcons items={deskItems} wallpaperMenu={wallpaperMenu} showMenu={setMenu} />
      )}
      <main className="os-windows" aria-label="Open windows">
        {wins.map((w) => (
          <Window key={w.id} win={w} focused={focused?.id === w.id} mobile={mobile}>
            <AppBody kind={w.kind} payload={w.payload} />
          </Window>
        ))}
      </main>
      <Dock mobile={mobile} />
      {menu && <ContextMenu menu={menu} onClose={closeMenu} />}

      {stage === "pending" && <div className="os-blackout" aria-hidden />}
      {stage === "waking" && <div className="os-wake" aria-hidden />}
      {stage === "boot" && <Boot onDone={wake} />}
      {stage === "loggedOut" && <Login onLogin={wake} onShutDown={() => setShutDown(true)} />}
      {shutDown && (
        <div className="os-shutdown" role="dialog" aria-label="Shut down">
          <p>Thanks for stopping by.</p>
          <button
            type="button"
            className="aqua-btn aqua-btn--primary"
            onClick={() => setShutDown(false)}
          >
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
      <MusicProvider>
        <Workspace />
      </MusicProvider>
    </WindowManagerProvider>
  );
}
