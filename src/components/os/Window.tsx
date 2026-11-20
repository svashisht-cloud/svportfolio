"use client";
import { useEffect, useRef, useState } from "react";
import type { WinState } from "./types";
import { useWM } from "./WindowManager";
import { goHome } from "./PhoneShell";
import { MENUBAR_H, accentFor } from "./appMeta";
import { useShake } from "./eggs/useShake";
import { play } from "./sounds";
import { useToast } from "./Toast";

const MIN_W = 300;
const MIN_H = 200;

type Gesture =
  | { mode: "move"; offX: number; offY: number }
  | { mode: "resize"; startX: number; startY: number; startW: number; startH: number };

export default function Window({
  win,
  focused,
  mobile,
  backTitle,
  children,
}: {
  win: WinState;
  focused: boolean;
  mobile: boolean;
  /** Phones: title of the window underneath, shown as "‹ Back". None means the home screen. */
  backTitle?: string;
  children: React.ReactNode;
}) {
  const wm = useWM();
  const ref = useRef<HTMLElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [moving, setMoving] = useState(false);
  const toast = useToast();
  const shake = useShake(() => {
    play("pop");
    wm.drop();
    toast("Whoa, steady! Right-click the desktop and choose Clean Up to tidy.", "🫨");
  });

  // Move keyboard focus into a newly opened window: its marked input if it has one
  // (e.g. the Terminal prompt), otherwise the window itself.
  // Also when an existing window is brought to the front from elsewhere (dock, menu, sidebar).
  // Phones focus only the window: focusing an input would pop the keyboard up unasked, and
  // Safari restores that focus (and can zoom in) when you come back from another tab.
  useEffect(() => {
    const el = ref.current;
    if (!focused || !el || el.contains(document.activeElement)) return;
    const target = (!mobile && el.querySelector<HTMLElement>("[data-autofocus]")) || el;
    target.focus({ preventScroll: true });
  }, [focused, mobile]);

  const begin = (e: React.PointerEvent, g: Gesture) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for synthetic or already-released pointers; dragging still works.
    }
    gesture.current = g;
    setMoving(true);
    // Iframes (the résumé) would otherwise swallow pointer events mid-drag.
    document.documentElement.classList.add("os-dragging");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (g.mode === "move") {
      shake.track(e.clientX);
      const x = Math.max(-win.w + 80, Math.min(window.innerWidth - 80, e.clientX - g.offX));
      const y = Math.max(MENUBAR_H, Math.min(window.innerHeight - 40, e.clientY - g.offY));
      wm.move(win.id, x, y);
    } else {
      const w = Math.max(MIN_W, g.startW + e.clientX - g.startX);
      const h = Math.max(MIN_H, g.startH + e.clientY - g.startY);
      wm.resize(win.id, w, h);
    }
  };

  const end = () => {
    gesture.current = null;
    setMoving(false);
    document.documentElement.classList.remove("os-dragging");
  };

  const onTitleDown = (e: React.PointerEvent) => {
    if (mobile || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    shake.reset(e.clientX);
    begin(e, { mode: "move", offX: e.clientX - win.x, offY: e.clientY - win.y });
  };

  const onResizeDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    begin(e, {
      mode: "resize",
      startX: e.clientX,
      startY: e.clientY,
      startW: win.w,
      startH: win.h,
    });
  };

  /** Phones: back closes this window, or goes home if it's the only one open. */
  const back = () => (backTitle ? wm.close(win.id) : goHome(wm));

  // Phones: swipe right from the left edge to go back.
  const edge = useRef<{ x: number; y: number } | null>(null);
  const onEdgeDown = (e: React.PointerEvent) => {
    edge.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore: the swipe still ends on pointerup.
    }
  };
  const onEdgeUp = (e: React.PointerEvent) => {
    const s = edge.current;
    edge.current = null;
    if (s && e.clientX - s.x > 70 && Math.abs(e.clientY - s.y) < 80) back();
  };

  const accent =
    win.kind === "project" || win.kind === "demo" ? accentFor(win.payload) : undefined;

  const style = {
    left: win.x,
    top: win.y,
    width: win.w,
    height: win.h,
    zIndex: 10 + win.z,
    display: win.minimized ? "none" : undefined,
    "--mx": `${win.mx}px`,
    "--my": `${win.my}px`,
    ...(mobile && win.origin
      ? { transformOrigin: `${win.origin.x}px calc(${win.origin.y}px - var(--statusbar-h))` }
      : {}),
    ...(win.tilt !== undefined ? { "--tilt": `${win.tilt}deg` } : {}),
    ...(accent ? { "--accent": accent } : {}),
  } as React.CSSProperties;

  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={win.title}
      tabIndex={-1}
      data-win-id={win.id}
      data-origin={mobile && win.origin ? `${win.origin.x},${win.origin.y}` : undefined}
      className={[
        "os-window",
        `phase-${win.phase}`,
        focused ? "is-focused" : "is-inactive",
        win.kind === "experience" || win.kind === "work" || win.kind === "terminal" || win.kind === "case"
          ? "os-window--dark"
          : "",
        win.kind === "music" || win.kind === "shubhgpt" ? "os-window--metal" : "",
        accent ? "os-window--accent" : "",
        mobile && win.origin ? "has-origin" : "",
        win.tilt !== undefined ? "is-fallen" : "",
        moving ? "is-moving" : "",
      ].join(" ")}
      style={style}
      onPointerDownCapture={() => {
        if (!focused) wm.focus(win.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && e.target === e.currentTarget) wm.close(win.id);
      }}
    >
      {mobile ? (
        <header className="os-titlebar os-navbar">
          <button
            type="button"
            className="os-nav-back"
            aria-label={backTitle ? `Back to ${backTitle}` : "Home"}
            onClick={back}
          >
            <span aria-hidden>‹</span>
            <span className="os-nav-back-label">{backTitle ?? "Home"}</span>
          </button>
          <h2 className="os-title">{win.kind === "prefs" ? "Settings" : win.title}</h2>
        </header>
      ) : (
        <header
          className="os-titlebar"
          onPointerDown={onTitleDown}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
          onDoubleClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) wm.minimize(win.id);
          }}
        >
          <div className="os-lights">
            <button
              type="button"
              className="os-light os-light--close"
              aria-label={`Close ${win.title}`}
              onClick={() => wm.close(win.id)}
            >
              <svg viewBox="0 0 10 10" aria-hidden>
                <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
              </svg>
            </button>
            <button
              type="button"
              className="os-light os-light--min"
              aria-label={`Minimize ${win.title}`}
              onClick={() => wm.minimize(win.id)}
            >
              <svg viewBox="0 0 10 10" aria-hidden>
                <path d="M2 5h6" />
              </svg>
            </button>
            <button
              type="button"
              className="os-light os-light--max"
              aria-label={`${win.maximized ? "Restore" : "Zoom"} ${win.title}`}
              onClick={() => wm.toggleMaximize(win.id)}
            >
              <svg viewBox="0 0 10 10" aria-hidden>
                <path d="M5 2v6M2 5h6" />
              </svg>
            </button>
          </div>
          <h2 className="os-title">{win.title}</h2>
        </header>
      )}
      <div className="os-window-body">{children}</div>
      {mobile && (
        <div
          className="os-edge-swipe"
          aria-hidden
          onPointerDown={onEdgeDown}
          onPointerUp={onEdgeUp}
          onPointerCancel={() => (edge.current = null)}
        />
      )}
      {!mobile && (
        <div
          className="os-resize"
          aria-hidden
          onPointerDown={onResizeDown}
          onPointerMove={onPointerMove}
          onPointerUp={end}
          onPointerCancel={end}
        />
      )}
    </section>
  );
}
