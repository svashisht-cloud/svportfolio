"use client";
import { useEffect, useRef, useState } from "react";
import type { WinState } from "./types";
import { useWM } from "./WindowManager";
import { MENUBAR_H } from "./appMeta";

const MIN_W = 300;
const MIN_H = 200;

type Gesture =
  | { mode: "move"; offX: number; offY: number }
  | { mode: "resize"; startX: number; startY: number; startW: number; startH: number };

export default function Window({
  win,
  focused,
  mobile,
  children,
}: {
  win: WinState;
  focused: boolean;
  mobile: boolean;
  children: React.ReactNode;
}) {
  const wm = useWM();
  const ref = useRef<HTMLElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [moving, setMoving] = useState(false);

  // Move keyboard focus into a newly opened window.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const begin = (e: React.PointerEvent, g: Gesture) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = g;
    setMoving(true);
    // Iframes (the résumé) would otherwise swallow pointer events mid-drag.
    document.documentElement.classList.add("os-dragging");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (g.mode === "move") {
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

  const style = {
    left: win.x,
    top: win.y,
    width: win.w,
    height: win.h,
    zIndex: 10 + win.z,
    display: win.minimized ? "none" : undefined,
    "--mx": `${win.mx}px`,
    "--my": `${win.my}px`,
  } as React.CSSProperties;

  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={win.title}
      tabIndex={-1}
      data-win-id={win.id}
      className={[
        "os-window",
        `phase-${win.phase}`,
        focused ? "is-focused" : "is-inactive",
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
          {!mobile && (
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
          )}
        </div>
        <h2 className="os-title">{win.title}</h2>
      </header>
      <div className="os-window-body">{children}</div>
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
