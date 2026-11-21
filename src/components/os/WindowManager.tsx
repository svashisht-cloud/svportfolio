"use client";
import { createContext, useContext, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import type { AppKind, AppPayload, Rect, WinState } from "./types";
import {
  DOCK_H,
  HOMEBAR_H,
  MENUBAR_H,
  sidebarWidth,
  STATUSBAR_H,
  defaultSize,
  describe,
  isMobileNow,
  prefersReducedMotion,
} from "./appMeta";
import { play } from "./sounds";
import { log } from "./syslog";
import { unlock } from "./achievements";
import { takeLaunchOrigin } from "./launcher";

interface State {
  wins: WinState[];
  zTop: number;
}

type Action =
  | { type: "open"; win: WinState }
  | { type: "focus"; id: string }
  | { type: "patch"; id: string; patch: Partial<WinState> }
  | { type: "remove"; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "open": {
      // Guards against double-launches (e.g. React strict mode or fast clicks).
      if (state.wins.some((w) => w.id === action.win.id)) {
        return reducer(state, { type: "focus", id: action.win.id });
      }
      const z = state.zTop + 1;
      return { zTop: z, wins: [...state.wins, { ...action.win, z }] };
    }
    case "focus": {
      const target = state.wins.find((w) => w.id === action.id);
      if (!target || target.z === state.zTop) return state;
      const z = state.zTop + 1;
      return { zTop: z, wins: state.wins.map((w) => (w.id === action.id ? { ...w, z } : w)) };
    }
    case "patch":
      if (!state.wins.some((w) => w.id === action.id)) return state;
      return {
        ...state,
        wins: state.wins.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)),
      };
    case "remove":
      return { ...state, wins: state.wins.filter((w) => w.id !== action.id) };
  }
}

export interface WMActions {
  launch(kind: AppKind, payload?: AppPayload): void;
  /** Focus a window, restoring it first if it is minimized. */
  activate(id: string): void;
  focus(id: string): void;
  close(id: string): void;
  minimize(id: string): void;
  restore(id: string): void;
  toggleMaximize(id: string): void;
  move(id: string, x: number, y: number): void;
  resize(id: string, w: number, h: number): void;
  /** Close every window (used by Log Out and Restart). */
  closeAll(): void;
  /**
   * Phones: back to the home screen. Windows are minimized, not closed, so they keep their state.
   * `instant` skips the shrink animation (the swipe gesture has already animated them away).
   */
  home(opts?: { instant?: boolean }): void;
  /** Re-cascade all visible windows into tidy positions (or back to where they fell from). */
  cleanUp(): void;
  /** Easter egg: every visible window falls to the bottom of the screen. */
  drop(): void;
  /** True if a window with this id is open (minimized counts; closing doesn't). Doesn't re-render callers. */
  isOpen(id: string): boolean;
}

const StateCtx = createContext<State>({ wins: [], zTop: 0 });
const ActionsCtx = createContext<WMActions | null>(null);

/** Area windows may occupy: right of the sidebar, between the menu bar and the dock. */
export function workArea(): Rect {
  const mobile = isMobileNow();
  const left = mobile ? 0 : sidebarWidth() + 24;
  const top = mobile ? STATUSBAR_H : MENUBAR_H;
  const w = window.innerWidth - left;
  const h = window.innerHeight - top - (mobile ? HOMEBAR_H : DOCK_H);
  return { x: left, y: top, w, h };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { wins: [], zTop: 0 });
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const actions = useMemo<WMActions>(() => {
    const find = (id: string) => stateRef.current.wins.find((w) => w.id === id);
    const later = (ms: number, fn: () => void) =>
      window.setTimeout(fn, prefersReducedMotion() ? 0 : ms);

    const focus = (id: string) => dispatch({ type: "focus", id });

    const restore = (id: string) => {
      const origin = takeLaunchOrigin();
      dispatch({
        type: "patch",
        id,
        patch: { minimized: false, phase: "restoring", ...(origin ? { origin } : {}) },
      });
      focus(id);
      later(360, () => dispatch({ type: "patch", id, patch: { phase: "open" } }));
    };

    const activate = (id: string) => {
      const w = find(id);
      if (!w) return;
      if (w.minimized) restore(id);
      else focus(id);
    };

    return {
      focus,
      restore,
      activate,
      isOpen(id) {
        const w = find(id);
        return !!w && w.phase !== "closing";
      },
      launch(kind, payload) {
        const { id, title } = describe(kind, payload);
        if (find(id)) {
          activate(id);
          takeLaunchOrigin(); // an already-visible window doesn't zoom
          return;
        }
        const origin = takeLaunchOrigin();
        log("WindowServer", `open “${title}”`);
        const area = workArea();
        const mobile = isMobileNow();
        const [dw, dh] = defaultSize(kind, payload);
        const w = Math.min(dw, area.w - 24);
        const h = Math.min(dh, area.h - 16);
        const visible = stateRef.current.wins.filter((x) => !x.minimized).length;
        const offset = (visible % 6) * 26;
        // Leave room for the desktop icon column on the right.
        const baseX = area.x + Math.max(12, (area.w - 110 - w) / 2);
        const x = mobile ? 0 : clamp(baseX + offset, area.x, area.x + area.w - w);
        const y = mobile ? area.y : clamp(area.y + 16 + offset, area.y, area.y + area.h - h);
        dispatch({
          type: "open",
          win: {
            id,
            kind,
            title,
            payload,
            x,
            y,
            w,
            h,
            z: 0,
            minimized: false,
            maximized: false,
            phase: "opening",
            mx: 0,
            my: 0,
            openedAt: Date.now(),
            origin,
          },
        });
        later(420, () => dispatch({ type: "patch", id, patch: { phase: "open" } }));
        play("open");
        // Brief spinning-wheel cursor while the window "loads".
        const root = document.documentElement;
        root.classList.add("os-busy");
        later(300, () => root.classList.remove("os-busy"));
      },
      close(id) {
        play("close");
        log("WindowServer", `close “${find(id)?.title ?? id}”`);
        dispatch({ type: "patch", id, patch: { phase: "closing" } });
        later(180, () => dispatch({ type: "remove", id }));
      },
      minimize(id) {
        const w = find(id);
        if (!w || w.minimized) return;
        // Aim the animation at the minimized-windows slot in the dock.
        const target = document.querySelector<HTMLElement>("[data-dock-target='minimized']");
        const t = target?.getBoundingClientRect();
        const tx = t ? t.left + t.width / 2 : window.innerWidth / 2;
        const ty = t ? t.top + t.height / 2 : window.innerHeight;
        const mx = tx - (w.x + w.w / 2);
        const my = ty - (w.y + w.h / 2);
        play("minimize");
        log("WindowServer", `minimize “${w.title}”`);
        dispatch({ type: "patch", id, patch: { phase: "minimizing", mx, my } });
        later(420, () =>
          dispatch({ type: "patch", id, patch: { minimized: true, phase: "open" } }),
        );
      },
      toggleMaximize(id) {
        const w = find(id);
        if (!w || isMobileNow()) return;
        if (w.maximized && w.prev) {
          dispatch({ type: "patch", id, patch: { ...w.prev, maximized: false } });
        } else {
          const a = workArea();
          dispatch({
            type: "patch",
            id,
            patch: {
              prev: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: a.x,
              y: a.y + 4,
              w: a.w - 8,
              h: a.h - 8,
              maximized: true,
            },
          });
        }
        focus(id);
      },
      move(id, x, y) {
        dispatch({ type: "patch", id, patch: { x, y, maximized: false, tilt: undefined } });
      },
      drop() {
        if (isMobileNow()) return;
        unlock("gravity");
        const floor = window.innerHeight - DOCK_H - 34;
        for (const w of stateRef.current.wins) {
          if (w.minimized) continue;
          dispatch({
            type: "patch",
            id: w.id,
            patch: {
              fallFrom: w.fallFrom ?? { x: w.x, y: w.y, w: w.w, h: w.h },
              y: floor - Math.random() * 60,
              tilt: (Math.random() - 0.5) * 10,
              maximized: false,
            },
          });
        }
      },
      resize(id, w, h) {
        dispatch({ type: "patch", id, patch: { w, h, maximized: false } });
      },
      closeAll() {
        for (const w of stateRef.current.wins) {
          dispatch({ type: "patch", id: w.id, patch: { phase: "closing" } });
          later(180, () => dispatch({ type: "remove", id: w.id }));
        }
      },
      home(opts) {
        const open = stateRef.current.wins.filter(
          (w) => !w.minimized && w.phase !== "closing" && w.phase !== "minimizing",
        );
        if (!open.length) return;
        play("minimize");
        log("WindowServer", "home");
        if (opts?.instant) {
          for (const w of open) {
            dispatch({ type: "patch", id: w.id, patch: { minimized: true, phase: "open" } });
          }
          return;
        }
        for (const w of open) {
          dispatch({ type: "patch", id: w.id, patch: { phase: "minimizing" } });
          later(320, () =>
            dispatch({ type: "patch", id: w.id, patch: { minimized: true, phase: "open" } }),
          );
        }
      },
      cleanUp() {
        if (isMobileNow()) return;
        const area = workArea();
        const visible = stateRef.current.wins
          .filter((w) => !w.minimized)
          .sort((a, b) => a.z - b.z);
        visible.forEach((w, i) => {
          if (w.fallFrom) {
            dispatch({
              type: "patch",
              id: w.id,
              patch: { ...w.fallFrom, fallFrom: undefined, tilt: undefined },
            });
            return;
          }
          const offset = (i % 8) * 28;
          dispatch({
            type: "patch",
            id: w.id,
            patch: {
              x: clamp(area.x + 24 + offset, area.x, area.x + area.w - w.w),
              y: clamp(area.y + 16 + offset, area.y, area.y + area.h - w.h),
              maximized: false,
            },
          });
        });
      },
    };
  }, []);

  return (
    <ActionsCtx.Provider value={actions}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useWM(): WMActions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error("useWM must be used inside WindowManagerProvider");
  return ctx;
}

export function useWMState() {
  const state = useContext(StateCtx);
  const visible = state.wins.filter((w) => !w.minimized && w.phase !== "closing");
  const focused = visible.reduce<WinState | undefined>(
    (top, w) => (!top || w.z > top.z ? w : top),
    undefined,
  );
  return { wins: state.wins, focused };
}
