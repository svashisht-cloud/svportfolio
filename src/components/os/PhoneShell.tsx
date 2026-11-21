"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { projects } from "@/app/portfolioData";
import { AppIcon, Orb, prefersReducedMotion } from "./appMeta";
import { CASES } from "./cases/registry";
import { deliver } from "./deliver";
import { Highlight, buildIndex, runItem, search } from "./searchIndex";
import { SUGGESTIONS } from "./shubhgpt/ShubhGPT";
import {
  APPS,
  DEMO_ITEMS,
  LINK_ITEMS,
  setLaunchOrigin,
  type LaunchItem,
} from "./launcher";
import { useWM, useWMState, type WMActions } from "./WindowManager";

/** Phones only: the four apps in the frosted tray at the bottom of the home screen. */
const TRAY_KEYS = ["about", "projects", "shubhgpt", "contact"];
const TRAY = TRAY_KEYS.map((k) => APPS.find((a) => a.key === k)!);

/** Every app, in a 4-column grid (the tray's four too). */
const GRID: LaunchItem[] = [
  // Virtual PC (the XP clone) is a whole desktop, and Terminal needs a keyboard: both are left off phones.
  ...APPS.filter((a) => !a.key.startsWith("demo:") && a.key !== "virtualpc" && a.key !== "terminal"),
  { key: "education", label: "Education", kind: "education" },
  ...DEMO_ITEMS,
  { key: "achievements", label: "Trophies", kind: "achievements" },
  { key: "prefs", label: "Settings", kind: "prefs" },
  ...LINK_ITEMS,
];

/** Short labels so names fit under a phone icon. */
const SHORT: Record<string, string> = {
  "Search Algorithm Viz": "Search Viz",
  "Snake Game": "Snake",
  "Résumé.pdf": "Résumé",
};

/** Asks the home screen to show its main page (e.g. after going home from Search). */
const HOME_PAGE_EVENT = "sv-home-page";
const showHomePage = () => window.dispatchEvent(new Event(HOME_PAGE_EVENT));

function HomeIcon({
  item,
  showLabel = true,
}: {
  item: LaunchItem;
  showLabel?: boolean;
}) {
  const wm = useWM();
  const ref = useRef<HTMLButtonElement>(null);
  const label = SHORT[item.label] ?? item.label;
  return (
    <li>
      <button
        ref={ref}
        type="button"
        className="os-home-app"
        aria-label={
          item.href ? `${item.label} (opens in new tab)` : `Open ${item.label}`
        }
        onClick={() => {
          if (item.href) {
            window.open(item.href, "_blank", "noopener,noreferrer");
            return;
          }
          if (!item.kind) return;
          setLaunchOrigin(
            ref.current?.querySelector(".os-icon") ?? ref.current,
          );
          wm.launch(item.kind, item.payload);
        }}
      >
        <span className="os-home-icon">
          <AppIcon kind={item.kind} payload={item.payload} name={item.icon} />
        </span>
        {showLabel && <span className="os-home-label">{label}</span>}
      </button>
    </li>
  );
}

/** Default "Siri Suggestions" when nothing has been opened yet. */
const DEFAULT_SUGGESTED = ["about", "projects", "shubhgpt", "resume"].map((k) =>
  APPS.find((a) => a.key === k)!,
);

/** The page left of home: search everything, with suggestions while the field is empty. */
function PhoneSearch({ active }: { active: boolean }) {
  const wm = useWM();
  const { wins } = useWMState();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(), []);
  const groups = useMemo(() => search(index, query), [index, query]);

  // Focus the field once the page has slid in; clear it when leaving.
  useEffect(() => {
    if (!active) {
      const t = window.setTimeout(() => setQuery(""), 0);
      input.current?.blur();
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(
      () => input.current?.focus({ preventScroll: true }),
      360,
    );
    return () => window.clearTimeout(t);
  }, [active]);

  // Recently opened apps first, then the defaults.
  const recent: LaunchItem[] = [...wins]
    .sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0))
    .filter((w) => w.kind !== "virtualpc")
    .map((w) => ({
      key: w.id,
      label: w.title,
      kind: w.kind,
      payload: w.payload,
    }));
  const suggested = [...recent, ...DEFAULT_SUGGESTED]
    .filter((it, i, all) => all.findIndex((x) => x.key === it.key) === i)
    .slice(0, 4);

  return (
    <div className="os-psearch">
      <label className="os-psearch-field">
        <FaSearch aria-hidden />
        <input
          ref={input}
          type="search"
          value={query}
          placeholder="Search projects, skills, résumé…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            const first = groups[0]?.items[0];
            if (e.key === "Enter" && first) runItem(wm, first, query);
          }}
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            className="os-psearch-clear"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            ×
          </button>
        )}
      </label>

      {!query.trim() ? (
        <div className="os-psearch-body">
          <section className="os-psearch-card">
            <h3>Suggestions</h3>
            <ul className="os-home-grid os-psearch-apps">
              {suggested.map((item) => (
                <HomeIcon key={item.key} item={item} />
              ))}
            </ul>
          </section>
          <section className="os-psearch-card">
            <h3>
              <Orb className="os-psearch-orb" /> Ask ShubhGPT
            </h3>
            <div className="os-psearch-chips">
              {SUGGESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => deliver(wm, "shubhgpt", "ask", q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
          <section className="os-psearch-card">
            <h3>Featured projects</h3>
            <ul className="os-psearch-rows">
              {projects
                .filter((p) => p.featured)
                .map((p) => (
                  <li key={p.name}>
                    <button
                      type="button"
                      onClick={() => wm.launch("project", { project: p })}
                    >
                      <span className="os-psearch-thumb">
                        <AppIcon kind="project" payload={{ project: p }} />
                      </span>
                      <span className="os-psearch-text">
                        {p.name}
                        <small>
                          {(p.techStack ?? []).slice(0, 4).join(" · ")}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
          <section className="os-psearch-card">
            <h3>Case files</h3>
            <ul className="os-psearch-rows">
              {CASES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => wm.launch("case", { caseId: c.id })}
                  >
                    <span className="os-psearch-thumb">
                      <AppIcon kind="case" payload={{ caseId: c.id }} />
                    </span>
                    <span className="os-psearch-text">
                      {c.title}
                      <small>{c.tagline}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="os-psearch-body">
          {groups.map((g) => (
            <section key={g.name} className="os-psearch-card">
              <h3>{g.name}</h3>
              <ul className="os-psearch-rows">
                {g.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => runItem(wm, item, query)}
                    >
                      <span className="os-psearch-text">
                        <Highlight text={item.title} query={query} />
                        {item.sub && <small>{item.sub}</small>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

interface PageDrag {
  x: number;
  y: number;
  t: number;
  axis: "x" | "y" | null;
  /** Offset shown on screen (rubber-banded at the ends). */
  dx: number;
  /** How far the finger actually moved; decides whether the swipe counts. */
  raw: number;
}

/** One grid cell (icon + label) and the gap between rows, in px; matches .os-home-grid. */
const CELL_H = 88;
const ROW_GAP = 18;
const COLS = 4;

/** How many whole rows of icons fit in a page this tall. */
const rowsFor = (h: number, cell = CELL_H) =>
  Math.max(2, Math.floor((h + ROW_GAP) / (cell + ROW_GAP)));

/** First guess before the page is measured: screen minus bars, pill + dots, tray and padding. */
const guessRows = () => rowsFor(window.innerHeight - 36 - 22 - 70 - 104 - 26);

/**
 * Pages side by side: Search first, then as many app pages as the screen needs (whole rows only,
 * so icons are never cut off). Home starts on the first app page. Swipe left/right to move
 * between pages; from Search, a swipe either way comes back home. The Search pill opens Search.
 */
export function HomeScreen() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(guessRows);
  const track = useRef<HTMLDivElement>(null);
  const firstPage = useRef<HTMLElement>(null);
  const drag = useRef<PageDrag | null>(null);

  const perPage = rows * COLS;
  const appPages: LaunchItem[][] = [];
  for (let i = 0; i < GRID.length; i += perPage)
    appPages.push(GRID.slice(i, i + perPage));
  const count = appPages.length + 1; // + Search
  const current = Math.min(page, count - 1);

  useEffect(() => {
    const back = () => setPage(1);
    window.addEventListener(HOME_PAGE_EVENT, back);
    return () => window.removeEventListener(HOME_PAGE_EVENT, back);
  }, []);

  // Fit whole rows to the real page height (and again on rotate / resize).
  useEffect(() => {
    const el = firstPage.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const h =
        el.clientHeight -
        parseFloat(cs.paddingTop) -
        parseFloat(cs.paddingBottom);
      const cell =
        el.querySelector("li")?.getBoundingClientRect().height || CELL_H;
      if (h > 0) setRows(rowsFor(h, cell));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = () =>
    track.current?.parentElement?.clientWidth ?? window.innerWidth;
  const place = (offset: number) => {
    if (!track.current) return;
    track.current.style.transition = "none";
    track.current.style.transform = `translateX(${-current * width() + offset}px)`;
  };
  /** Back to where React put it (the transform is React's; a page change then animates on). */
  const release = () => {
    if (!track.current) return;
    track.current.style.transition = "";
    track.current.style.transform = `translateX(${(-current * 100) / count}%)`;
  };

  /** End of a drag: change page if the swipe was far or fast enough, else spring back. */
  const settle = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis !== "x") return;
    const v = d.raw / Math.max(1, performance.now() - d.t);
    const far = Math.abs(d.raw) > width() * 0.25 || Math.abs(v) > 0.5;
    release();
    if (!far) return;
    if (current === 0) setPage(1);
    else if (d.raw > 0) setPage(current - 1);
    else if (current < count - 1) setPage(current + 1);
  };

  return (
    <div className={`os-home${current === 0 ? " is-search" : ""}`}>
      <div
        ref={track}
        className="os-home-track"
        style={
          {
            width: `${count * 100}%`,
            transform: `translateX(${(-current * 100) / count}%)`,
          } as React.CSSProperties
        }
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            t: performance.now(),
            axis: null,
            dx: 0,
            raw: 0,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (!d.axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            if (d.axis === "x") {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore: the drag still ends on pointerup.
              }
            }
          }
          if (d.axis !== "x") return;
          d.raw = dx;
          const w = width();
          // Rubber band past the last page; from Search either direction is allowed (both go home).
          const min = current === count - 1 ? -24 : -w;
          const max = current === 0 ? 24 : w;
          d.dx = Math.max(min, Math.min(max, dx));
          if (!prefersReducedMotion()) place(d.dx);
        }}
        onPointerUp={settle}
        // If the browser cancels a sideways drag (it took over the gesture), still honour it.
        onPointerCancel={settle}
      >
        <section
          className="os-home-page"
          aria-label="Search"
          aria-hidden={current !== 0}
          inert={current !== 0}
        >
          <PhoneSearch active={current === 0} />
        </section>
        {appPages.map((items, i) => (
          <section
            key={i}
            ref={i === 0 ? firstPage : undefined}
            className="os-home-page"
            aria-label={`Apps, page ${i + 1} of ${appPages.length}`}
            aria-hidden={current !== i + 1}
            inert={current !== i + 1}
          >
            <ul className="os-home-grid">
              {items.map((item) => (
                <HomeIcon key={item.key} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {/* Floats over the bottom of the pages: app pages leave room for it, Search runs under it. */}
      <div className="os-home-bottom">
        <div className="os-home-footer">
          <button
            type="button"
            className="os-home-search-pill"
            onClick={() => setPage(0)}
          >
            <FaSearch aria-hidden /> Search
          </button>
          <div className="os-home-dots" aria-hidden>
            {Array.from({ length: count }, (_, i) =>
              i === 0 ? (
                <FaSearch
                  key={i}
                  className={`os-home-dot-search${current === 0 ? " is-on" : ""}`}
                />
              ) : (
                <span key={i} className={current === i ? "is-on" : ""} />
              ),
            )}
          </div>
        </div>
        <ul className="os-home-tray" aria-label="Favourites">
          {TRAY.map((item) => (
            <HomeIcon key={item.key} item={item} showLabel={false} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Size of a home-screen icon; the app shrinks into this. */
const ICON = 60;

const root = () => document.querySelector<HTMLElement>(".os-root");

/** Home with the default shrink, plus the home screen easing in behind it (`.is-homing`). */
export function goHome(wm: WMActions) {
  showHomePage();
  const r = root();
  r?.classList.add("is-homing");
  window.setTimeout(() => r?.classList.remove("is-homing"), 450);
  wm.home();
}

/** Visible app windows, front-most first. */
function openWindows() {
  return [...document.querySelectorAll<HTMLElement>(".os-window")]
    .filter(
      (el) =>
        el.style.display !== "none" &&
        !el.classList.contains("phase-closing") &&
        !el.classList.contains("phase-minimizing"),
    )
    .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
}

interface Swipe {
  y: number;
  lastY: number;
  lastT: number;
  /** Upward speed in px/ms, smoothed. */
  v: number;
  top: HTMLElement | null;
  others: HTMLElement[];
  /** React's own transform-origin (the icon a window zooms from), put back afterwards. */
  saved: Map<HTMLElement, string>;
  dragging: boolean;
}

/**
 * The bar at the bottom of the screen. Dragging it up pulls the front app with your finger
 * (it shrinks and rounds off, the home screen fades in behind). Let go far or fast enough and
 * the app flies back into its icon; otherwise it springs back. A tap also goes home.
 */
export function HomeIndicator({ appOpen }: { appOpen: boolean }) {
  const wm = useWM();
  const swipe = useRef<Swipe | null>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const swiped = useRef(false);

  const restore = (s: Swipe) => {
    // Only undo what the gesture touched: React may have hidden the windows meanwhile.
    for (const [el, origin] of s.saved) {
      el.style.transformOrigin = origin;
      el.style.transform = "";
      el.style.borderRadius = "";
      el.style.overflow = "";
      el.style.visibility = "";
    }
    const r = root();
    r?.classList.remove("is-swiping-home");
    r?.style.removeProperty("--home-p");
    if (pill.current) pill.current.style.transform = "";
  };

  const follow = (s: Swipe, clientY: number) => {
    const dy = Math.max(0, s.y - clientY);
    const p = Math.min(1, dy / (window.innerHeight * 0.45));
    if (s.top) {
      s.top.style.transformOrigin = "50% 100%";
      s.top.style.transform = `translateY(${-dy * 0.55}px) scale(${1 - 0.45 * p})`;
      s.top.style.borderRadius = `${10 + 30 * p}px`;
      s.top.style.overflow = "hidden";
    }
    root()?.style.setProperty("--home-p", p.toFixed(3));
    if (pill.current)
      pill.current.style.transform = `translateY(${-Math.min(dy, 24) * 0.5}px)`;
  };

  /** Fly the dragged app into its home-screen icon, then mark everything minimized. */
  const finishHome = (s: Swipe) => {
    const el = s.top;
    if (!el) return;
    root()?.style.setProperty("--home-p", "1");
    const r = el.getBoundingClientRect();
    const L = el.offsetLeft;
    const T = el.offsetTop;
    const W = el.offsetWidth;
    const H = el.offsetHeight;
    const [ox, oy] = (el.dataset.origin ?? "").split(",").map(Number);
    const tx = Number.isFinite(ox) ? ox : window.innerWidth / 2;
    const ty = Number.isFinite(oy) ? oy : window.innerHeight * 0.55;
    const from = `translate(${r.left - L}px, ${r.top - T}px) scale(${r.width / W})`;
    const sx = ICON / W;
    const sy = ICON / H;
    const to = `translate(${tx - ICON / 2 - L}px, ${ty - ICON / 2 - T}px) scale(${sx}, ${sy})`;
    el.style.transformOrigin = "0 0";
    el.style.transform = from;
    const anim = el.animate(
      [
        { transform: from, opacity: 1, borderRadius: el.style.borderRadius },
        { transform: to, opacity: 0, borderRadius: `${ICON * 3}px` },
      ],
      {
        duration: 380,
        easing: "cubic-bezier(0.25, 0.9, 0.3, 1)",
        fill: "forwards",
      },
    );
    anim.onfinish = () => {
      wm.home({ instant: true });
      showHomePage();
      // Wait for React to hide the windows before putting their styles back.
      window.setTimeout(() => {
        anim.cancel();
        restore(s);
      }, 50);
    };
  };

  /** Not far enough: spring the app back to full screen. */
  const cancel = (s: Swipe) => {
    const el = s.top;
    if (!el) return restore(s);
    const anim = el.animate(
      [
        { transform: el.style.transform, borderRadius: el.style.borderRadius },
        { transform: "none", borderRadius: "0px" },
      ],
      { duration: 280, easing: "cubic-bezier(0.3, 1.4, 0.5, 1)" },
    );
    el.style.transform = "none";
    root()?.style.setProperty("--home-p", "0");
    anim.onfinish = () => restore(s);
  };

  return (
    <button
      type="button"
      className={`os-homebar${appOpen ? " has-app" : ""}`}
      aria-label="Go to home screen"
      onPointerDown={(e) => {
        swiped.current = false;
        const [top, ...others] = openWindows();
        const s: Swipe = {
          y: e.clientY,
          lastY: e.clientY,
          lastT: performance.now(),
          v: 0,
          top: top ?? null,
          others,
          saved: new Map(),
          dragging: false,
        };
        for (const el of [top, ...others])
          if (el) s.saved.set(el, el.style.transformOrigin);
        swipe.current = s;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore: the swipe still ends on pointerup.
        }
      }}
      onPointerMove={(e) => {
        const s = swipe.current;
        if (!s || !s.top) return;
        const now = performance.now();
        const dt = Math.max(1, now - s.lastT);
        s.v = 0.7 * ((s.lastY - e.clientY) / dt) + 0.3 * s.v;
        s.lastY = e.clientY;
        s.lastT = now;
        if (!s.dragging) {
          if (s.y - e.clientY < 6 || prefersReducedMotion()) return;
          s.dragging = true;
          // Only the front app moves; the ones under it step aside so home shows through.
          for (const el of s.others) el.style.visibility = "hidden";
          root()?.classList.add("is-swiping-home");
        }
        follow(s, e.clientY);
      }}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s) return;
        const dy = s.y - e.clientY;
        const go = dy > 110 || (s.v > 0.45 && dy > 24);
        swiped.current = s.dragging || go;
        if (!s.dragging) {
          if (go) goHome(wm);
          return;
        }
        if (go) finishHome(s);
        else cancel(s);
      }}
      onPointerCancel={() => {
        const s = swipe.current;
        swipe.current = null;
        if (s?.dragging) cancel(s);
      }}
      // A tap (or keyboard press) also goes home.
      onClick={() => {
        if (swiped.current) swiped.current = false;
        else goHome(wm);
      }}
    >
      <span className="os-homebar-pill" ref={pill} aria-hidden />
    </button>
  );
}
