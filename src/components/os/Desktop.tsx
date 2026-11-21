"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./os.css";
import { AppBody } from "./apps";
import { careerSteps } from "@/app/portfolioData";
import { AppIcon, MOBILE_QUERY, prefersReducedMotion, useIsMobile } from "./appMeta";
import { Boot, Login, hasBooted, markBooted } from "./BootScreen";
import { LINK_PARAM, fromSlug, toSlug } from "./links";
import { log } from "./syslog";
import { ACHIEVEMENTS, unlock } from "./achievements";
import ContextMenu, { type ContextEntry, type ContextMenuState } from "./ContextMenu";
import Dock from "./Dock";
import FinderSidebar from "./FinderSidebar";
import MenuBar from "./MenuBar";
import { HomeIndicator, HomeScreen } from "./PhoneShell";
import Confetti from "./eggs/Confetti";
import Panic from "./eggs/Panic";
import ScreenSaver from "./eggs/ScreenSaver";
import { on } from "./eggs/bus";
import { useKonami } from "./eggs/useKonami";
import { MusicProvider, useMusic } from "./Music";
import { play } from "./sounds";
import { ToastProvider, useToast } from "./Toast";
import Widgets from "./Widgets";
import { widgetMenu } from "./widgetMenu";
import { getPrefs, setPrefs, useEffectiveTheme, usePrefs } from "./prefs";
import { useSelection } from "./useSelection";
import Window from "./Window";
import { WindowManagerProvider, useWM, useWMState } from "./WindowManager";
import type { AppKind, AppPayload } from "./types";

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
  { key: "shubhgpt", kind: "shubhgpt", label: "ShubhGPT" },
  // Case Files, Photos and Mail live in the dock, Finder and Spotlight, to keep the desktop calm.
];

/** How long the screen-on effect lasts (matches os-wake-* in os.css). */
const WAKE_MS = 650;

/** Matches the title in layout.tsx. */
const DEFAULT_TITLE = "Shubh Vashisht — Software Engineer";

/** The Software Update nudge shows once per browser, this long after the desktop appears. */
const UPDATE_SEEN_KEY = "sv-os-update-seen";
const UPDATE_DELAY_MS = 12_000;

interface AlertState {
  title: string;
  message: string;
  buttons: { label: string; primary?: boolean; run?: () => void }[];
}

/** Aqua-style alert sheet used by Easter eggs. */
function AlertDialog({ alert, onClose }: { alert: AlertState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>(".aqua-btn--primary")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="os-alert-backdrop">
      <div className="os-alert" ref={ref} role="alertdialog" aria-label={alert.title}>
        <div className="os-alert-icon" aria-hidden>
          <span className="os-boot-mark os-boot-mark--alert">SV</span>
        </div>
        <div className="os-alert-body">
          <p className="os-alert-title">{alert.title}</p>
          <p>{alert.message}</p>
          <div className="os-alert-buttons">
            {alert.buttons.map((b) => (
              <button
                key={b.label}
                type="button"
                className={`aqua-btn${b.primary ? " aqua-btn--primary" : ""}`}
                onClick={() => {
                  onClose();
                  b.run?.();
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** True if the point is over the dock's Trash. */
function overTrash(x: number, y: number) {
  const trash = document.querySelector<HTMLElement>("[data-dock-key='trash']");
  const r = trash?.getBoundingClientRect();
  return !!r && x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 12 && y <= r.bottom + 8;
}

function DesktopIcons({
  items,
  wallpaperMenu,
  showMenu,
  onDropOnTrash,
}: {
  items: DeskItem[];
  wallpaperMenu: ContextMenuState["items"];
  showMenu: (m: ContextMenuState) => void;
  onDropOnTrash: (item: DeskItem) => void;
}) {
  const wm = useWM();

  /** Icons can be dragged; they spring back home when let go. */
  const startDrag = (item: DeskItem, e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    const el = e.currentTarget;
    const sx = e.clientX;
    const sy = e.clientY;
    let dragging = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) < 5) return;
      dragging = true;
      el.classList.add("is-dragging");
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      document
        .querySelector("[data-dock-key='trash']")
        ?.classList.toggle("is-target", overTrash(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.querySelector("[data-dock-key='trash']")?.classList.remove("is-target");
      if (!dragging) return;
      el.classList.remove("is-dragging");
      el.classList.add("is-returning");
      el.style.transform = "";
      window.setTimeout(() => el.classList.remove("is-returning"), 450);
      if (overTrash(ev.clientX, ev.clientY)) onDropOnTrash(item);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
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
              onPointerDown={(e) => {
                sel.itemProps(d.key).onPointerDown(e);
                startDrag(d, e);
              }}
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
  const theme = useEffectiveTheme();
  const { wins, focused } = useWMState();
  const [stage, setStage] = useState<Stage>("pending");
  const [shutDown, setShutDown] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [party, setParty] = useState(false);
  const [panic, setPanic] = useState(false);
  const toast = useToast();
  const music = useMusic();

  const celebrate = useCallback(() => {
    if (prefersReducedMotion()) return;
    play("pop");
    setConfetti(true);
    setParty(true);
    window.setTimeout(() => setParty(false), 4000);
  }, []);

  // Easter egg: ↑↑↓↓←→←→BA
  const onKonami = useCallback(() => {
    unlock("konami");
    toast("Cheat code accepted. +30 lives.", "🎮");
    celebrate();
  }, [toast, celebrate]);
  useKonami(onKonami);

  useEffect(() => {
    const offPanic = on("panic", () => {
      setMenu(null);
      setPanic(true);
    });
    const offConfetti = on("confetti", celebrate);
    const offAchievement = on("achievement", (id) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a) return;
      play("pop");
      toast(`Achievement unlocked: ${a.title}`, "🏆", { onClick: () => wm.launch("achievements"), ms: 4500 });
    });
    return () => {
      offPanic();
      offConfetti();
      offAchievement();
    };
  }, [celebrate, toast, wm]);

  // ⌘⌥S / Ctrl+Alt+S collapses or expands the Finder sidebar (desktop only, not while typing).
  useEffect(() => {
    if (mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.altKey || e.code !== "KeyS") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      setPrefs({ sidebar: !getPrefs().sidebar });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobile]);

  // One-time nudge: "Software Update: Shubh 4.0 is available".
  useEffect(() => {
    if (stage !== "desktop") return;
    try {
      if (window.localStorage.getItem(UPDATE_SEEN_KEY) === "1") return;
    } catch {
      return; // Without storage it would nag on every visit, so skip it.
    }
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(UPDATE_SEEN_KEY, "1");
      } catch {
        // Ignore: it just may show again next time.
      }
      const newest = careerSteps().at(-1);
      if (!newest) return;
      play("pop");
      toast(`Software Update: Shubh ${newest.version} is available. Click to see what's new.`, "⬇️", {
        ms: 9000,
        onClick: () => wm.launch("update"),
      });
    }, UPDATE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [stage, toast, wm]);

  const fadeIn = useCallback(() => {
    setStage("waking");
    window.setTimeout(() => setStage("desktop"), prefersReducedMotion() ? 0 : WAKE_MS);
  }, []);

  /** Desktop opens About; phones land on the home screen. */
  const wake = useCallback(
    (openAbout = true) => {
      play("startup");
      setStage("waking");
      if (openAbout) wm.launch("about");
      window.setTimeout(() => setStage("desktop"), prefersReducedMotion() ? 0 : WAKE_MS);
    },
    [wm],
  );
  const wakeHere = useCallback(() => wake(!window.matchMedia(MOBILE_QUERY).matches), [wake]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      // A deep link (?w=…) skips the boot screen and opens its window on top of About.
      const linked = fromSlug(new URLSearchParams(window.location.search).get(LINK_PARAM));
      const phone = window.matchMedia(MOBILE_QUERY).matches;
      if (linked) {
        markBooted();
        wake(!phone);
        wm.launch(linked.kind, linked.payload);
      } else if (hasBooted() || prefersReducedMotion()) wake(!phone);
      else setStage("boot");
    }, 0);
    return () => window.clearTimeout(t);
  }, [wake, wm]);

  // Console: how the page loaded (once).
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      log("Kernel", `page loaded: DOM ready in ${Math.round(nav.domContentLoadedEventEnd)} ms, ${Math.round(nav.transferSize / 1024)} KB HTML`);
    }
    log("Kernel", `screen ${window.innerWidth}×${window.innerHeight}, ${navigator.language}`);
  }, []);

  // Keep the address bar pointing at the focused window, so it can be copied or bookmarked.
  useEffect(() => {
    if (stage !== "desktop") return;
    const slug = focused ? toSlug(focused.kind, focused.payload) : null;
    if (focused && !slug) return; // e.g. Trash: leave the last link alone
    const next = slug ? `${window.location.pathname}?${LINK_PARAM}=${slug}` : window.location.pathname;
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(window.history.state, "", next);
    }
    // The tab title follows too (link previews use the same titles, from links.ts).
    const linked = fromSlug(slug);
    document.title = linked ? `${linked.title} · Shubh Vashisht` : DEFAULT_TITLE;
  }, [stage, focused]);

  const leave = (next: Stage) => {
    setMenu(null);
    wm.closeAll();
    window.setTimeout(() => setStage(next), prefersReducedMotion() ? 0 : 220);
  };

  // Phone Settings' power rows (Restart / Shut Down / Log Out) arrive over the bus.
  const leaveRef = useRef(leave);
  useEffect(() => {
    leaveRef.current = leave;
  });
  useEffect(
    () =>
      on("power", (what) => {
        if (what === "shutdown") setShutDown(true);
        else leaveRef.current(what === "logout" ? "loggedOut" : "boot");
      }),
    [],
  );

  const newFolder = () => {
    setFolders((f) => {
      const used = new Set(f);
      let name = "untitled folder";
      for (let n = 2; used.has(name); n++) name = `untitled folder ${n}`;
      return [...f, name];
    });
  };

  // A function, so the Widgets ▸ check marks update while the menu is open.
  const wallpaperMenu = (): ContextEntry[] => [
    { label: "New Folder", run: newFolder },
    "sep",
    { label: "Change Desktop Background…", run: () => wm.launch("prefs") },
    { label: "Clean Up", run: () => wm.cleanUp() },
    "sep",
    ...widgetMenu(),
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

  // Phones: each open window's "‹ Back" goes to the window stacked under it.
  const backTitles = new Map<string, string>();
  wins
    .filter((w) => !w.minimized && w.phase !== "closing" && w.phase !== "minimizing")
    .sort((a, b) => a.z - b.z)
    .forEach((w, i, stack) => {
      if (i > 0) backTitles.set(w.id, stack[i - 1].title);
    });

  const closeMenu = useCallback(() => setMenu(null), []);
  const closeAlert = useCallback(() => setAlert(null), []);
  const endConfetti = useCallback(() => setConfetti(false), []);

  const onDropOnTrash = (item: DeskItem) => {
    play("alert");
    if (item.kind === "resume") {
      unlock("keep-resume");
      setAlert({
        title: "Are you sure you want to move “Résumé.pdf” to the Trash?",
        message: "This candidate is great. You'll want to keep this one.",
        buttons: [
          { label: "Keep" },
          {
            label: "Hire Shubh",
            primary: true,
            run: () => {
              celebrate();
              wm.launch("contact");
            },
          },
        ],
      });
    } else {
      toast(`“${item.label}” is too important to throw away.`, "🙅");
    }
  };

  return (
    <div
      className={[
        "os-root",
        mobile ? "is-mobile" : "",
        mobile && focused ? "has-app" : "",
        stage === "waking" ? "is-waking" : "",
        party ? "is-party" : "",
        !mobile && !prefs.sidebar ? "is-sidebar-collapsed" : "",
      ].join(" ")}
      data-appearance={prefs.appearance}
      data-theme={theme}
    >
      <div className="os-wallpaper" data-wallpaper={prefs.wallpaper} aria-hidden />
      <MenuBar
        mobile={mobile}
        onShutDown={() => setShutDown(true)}
        onRestart={() => leave("boot")}
        onLogOut={() => leave("loggedOut")}
      />
      {mobile && <HomeScreen />}
      {!mobile && <FinderSidebar />}
      {!mobile && (
        <DesktopIcons
          items={deskItems}
          wallpaperMenu={wallpaperMenu}
          showMenu={setMenu}
          onDropOnTrash={onDropOnTrash}
        />
      )}
      {!mobile && prefs.widgets && (stage === "desktop" || stage === "waking") && <Widgets showMenu={setMenu} />}
      <main className="os-windows" aria-label="Open windows">
        {wins.map((w) => (
          <Window
            key={w.id}
            win={w}
            focused={focused?.id === w.id}
            mobile={mobile}
            backTitle={mobile ? backTitles.get(w.id) : undefined}
          >
            <AppBody kind={w.kind} payload={w.payload} />
          </Window>
        ))}
      </main>
      {mobile ? <HomeIndicator appOpen={!!focused} /> : <Dock />}
      {menu && <ContextMenu menu={menu} onClose={closeMenu} />}
      {alert && <AlertDialog alert={alert} onClose={closeAlert} />}
      {confetti && <Confetti onDone={endConfetti} />}
      {/* No screen saver on phones: they have their own screen timeout. */}
      <ScreenSaver disabled={mobile || stage !== "desktop" || music.playing || panic} />
      {panic && (
        <Panic
          onDismiss={() => {
            setPanic(false);
            fadeIn();
          }}
        />
      )}

      {stage === "pending" && <div className="os-blackout" aria-hidden />}
      {stage === "waking" && <div className="os-wake" aria-hidden />}
      {stage === "boot" && <Boot onDone={wakeHere} />}
      {stage === "loggedOut" && <Login onLogin={wakeHere} onShutDown={() => setShutDown(true)} />}
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
        <ToastProvider>
          <Workspace />
        </ToastProvider>
      </MusicProvider>
    </WindowManagerProvider>
  );
}
