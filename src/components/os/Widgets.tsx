"use client";
import { useEffect, useRef, useState } from "react";
import { FaMusic } from "react-icons/fa";
import {
  WiCloudy,
  WiDayCloudy,
  WiDaySunny,
  WiFog,
  WiNightAltCloudy,
  WiNightClear,
  WiRain,
  WiSnow,
  WiThunderstorm,
} from "react-icons/wi";
import { stickyNote } from "@/app/widgets";
import { sidebarWidth } from "./appMeta";
import type { ContextMenuState } from "./ContextMenu";
import { skillCounts } from "./commands";
import { useMusic } from "./Music";
import { log } from "./syslog";
import TileGame from "./TileGame";
import { usePrefs } from "./prefs";
import { widgetMenu, setWidgetShown } from "./widgetMenu";
import { WIDGETS, type WidgetId } from "./widgetList";
import { useWM } from "./WindowManager";

type Positions = Partial<Record<WidgetId, { x: number; y: number }>>;

const KEY = "sv-os-widgets";
const ORDER: WidgetId[] = WIDGETS.map((w) => w.id);
/** Room each widget takes in the default column (its height plus a gap). */
const SLOT_H: Partial<Record<WidgetId, number>> = { clock: 172, weather: 125, note: 130, music: 84, stack: 206 };

function loadPositions(): Positions {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Positions;
  } catch {
    return {};
  }
}

function savePositions(p: Positions) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Without storage, widgets go back to their default spots on reload.
  }
}

/** Default spots: the shown widgets stacked (no gaps) in a column to the left of the desktop icons. */
function defaultPosition(id: WidgetId, shown: WidgetId[]) {
  const minX = sidebarWidth() + 40;
  // The tile puzzle starts in a second column, left of the others.
  if (id === "tile") return { x: Math.max(minX, window.innerWidth - 120 - 210 - 222), y: 270 };
  let y = 40;
  for (const w of ORDER) {
    if (w === id) break;
    if (w !== "tile" && shown.includes(w)) y += SLOT_H[w] ?? 120;
  }
  return { x: Math.max(minX, window.innerWidth - 120 - 210), y };
}

function AnalogClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  const h = now ? (now.getHours() % 12) + now.getMinutes() / 60 : 0;
  const m = now ? now.getMinutes() + now.getSeconds() / 60 : 0;
  const s = now ? now.getSeconds() : 0;
  return (
    <svg viewBox="0 0 100 100" className="os-w-clock" role="img" aria-label={now ? now.toLocaleTimeString() : "Clock"}>
      <defs>
        <radialGradient id="clockFace" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dfe3ea" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#clockFace)" stroke="#9aa3b0" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50"
          y1="8"
          x2="50"
          y2={i % 3 === 0 ? 16 : 13}
          stroke="#3b4250"
          strokeWidth={i % 3 === 0 ? 2.5 : 1.2}
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <line x1="50" y1="50" x2="50" y2="27" stroke="#1d2129" strokeWidth="4" strokeLinecap="round" transform={`rotate(${h * 30} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="17" stroke="#1d2129" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${m * 6} 50 50)`} />
      <line x1="50" y1="56" x2="50" y2="14" stroke="#e0433a" strokeWidth="1.2" transform={`rotate(${s * 6} 50 50)`} />
      <circle cx="50" cy="50" r="3" fill="#e0433a" />
      <ellipse cx="50" cy="28" rx="34" ry="16" fill="white" opacity="0.35" />
    </svg>
  );
}

function NowPlayingWidget() {
  const m = useMusic();
  const song = m.songs[m.index];
  const active = song && (m.playing || m.time > 0);
  return (
    <div className="os-w-music">
      <span className={`os-w-music-art${m.playing ? " is-playing" : ""}`} aria-hidden>
        <FaMusic />
      </span>
      <div>
        <p className="os-w-label">Now Playing</p>
        <p className="os-w-music-title">{active ? song.title : "Nothing playing"}</p>
        {active && <p className="os-w-dim">{song.artist}</p>}
      </div>
    </div>
  );
}

/* ---------- Weather (Dallas, via Open-Meteo: free, no key) ---------- */

interface Wx {
  temp: number;
  code: number;
  day: boolean;
  hi: number;
  lo: number;
  /** When it was fetched (ms). */
  at: number;
}

const WX_KEY = "sv-os-weather";
const WX_TTL = 30 * 60 * 1000;
const WX_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=32.78&longitude=-96.80" +
  "&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min" +
  "&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=1";

type WxKind = "sun" | "cloud" | "fog" | "rain" | "snow" | "storm";

/** WMO weather codes → label, icon and animation kind. */
function describeWx(code: number, day: boolean): { label: string; Icon: typeof WiDaySunny; kind: WxKind } {
  if (code === 0) return { label: "Clear", Icon: day ? WiDaySunny : WiNightClear, kind: "sun" };
  if (code <= 2) return { label: "Partly cloudy", Icon: day ? WiDayCloudy : WiNightAltCloudy, kind: "cloud" };
  if (code === 3) return { label: "Overcast", Icon: WiCloudy, kind: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", Icon: WiFog, kind: "fog" };
  if (code >= 95) return { label: "Thunderstorms", Icon: WiThunderstorm, kind: "storm" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Snow", Icon: WiSnow, kind: "snow" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: WiRain, kind: "rain" };
  return { label: "Rain", Icon: WiRain, kind: "rain" };
}

function readWxCache(): Wx | null {
  try {
    const wx = JSON.parse(window.sessionStorage.getItem(WX_KEY) ?? "null") as Wx | null;
    return wx && Date.now() - wx.at < WX_TTL ? wx : null;
  } catch {
    return null;
  }
}

function WeatherWidget() {
  const [wx, setWx] = useState<Wx | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const cached = readWxCache();
      if (cached) {
        if (alive) setWx(cached);
        return;
      }
      try {
        const res = await fetch(WX_URL);
        if (!res.ok) throw new Error(String(res.status));
        const d = await res.json();
        const next: Wx = {
          temp: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
          day: d.current.is_day === 1,
          hi: Math.round(d.daily.temperature_2m_max[0]),
          lo: Math.round(d.daily.temperature_2m_min[0]),
          at: Date.now(),
        };
        try {
          window.sessionStorage.setItem(WX_KEY, JSON.stringify(next));
        } catch {
          // No storage: it just refetches next time.
        }
        log("Weather", `Dallas ${next.temp}°F, ${describeWx(next.code, next.day).label.toLowerCase()} (Open-Meteo)`);
        if (alive) {
          setWx(next);
          setFailed(false);
        }
      } catch {
        log("Weather", "Open-Meteo request failed", "warn");
        if (alive) setFailed(true);
      }
    };
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(load, WX_TTL);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const info = wx ? describeWx(wx.code, wx.day) : null;
  return (
    <div className="os-w-weather">
      <div>
        <p className="os-w-label">Dallas, TX</p>
        {wx && info ? (
          <>
            <p className="os-w-temp">{wx.temp}°</p>
            <p className="os-w-dim">
              {info.label} · H {wx.hi}° L {wx.lo}°
            </p>
          </>
        ) : (
          <p className="os-w-dim">{failed ? "Weather unavailable" : "Loading…"}</p>
        )}
      </div>
      {info && (
        <span className={`os-w-wx-icon is-${info.kind}`} aria-hidden>
          <info.Icon />
        </span>
      )}
    </div>
  );
}

function StackWidget() {
  const top = skillCounts().slice(0, 6);
  const max = top[0]?.[1] ?? 1;
  return (
    <div>
      <p className="os-w-label">Most-used tech</p>
      <ul className="os-w-stack">
        {top.map(([name, n]) => (
          <li key={name}>
            <span>{name}</span>
            <span className="os-w-bar" style={{ width: `${(n / max) * 100}%` }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const NAME = Object.fromEntries(WIDGETS.map((w) => [w.id, w.name])) as Record<WidgetId, string>;

/** Draggable glass widgets on the desktop (Dashboard-style). Desktop only; which ones show is `prefs.shownWidgets`. */
export default function Widgets({ showMenu }: { showMenu: (m: ContextMenuState) => void }) {
  const wm = useWM();
  const { shownWidgets } = usePrefs();
  const [pos, setPos] = useState<Positions | null>(null);
  const drag = useRef<{ id: WidgetId; dx: number; dy: number; last?: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setPos(loadPositions()), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!pos) return null;

  const at = (id: WidgetId) => pos[id] ?? defaultPosition(id, shownWidgets);

  const begin = (id: WidgetId) => (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("a, button")) return;
    const p = at(id);
    drag.current = { id, dx: e.clientX - p.x, dy: e.clientY - p.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragging = "true";
  };
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - d.dx));
    const y = Math.max(24, Math.min(window.innerHeight - 120, e.clientY - d.dy));
    d.last = { x, y };
    setPos((p) => ({ ...p, [d.id]: { x, y } }));
  };
  const end = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (d.last) savePositions({ ...pos, [d.id]: d.last });
  };

  const shown = (id: WidgetId) => shownWidgets.includes(id);

  const card = (
    id: WidgetId,
    className: string,
    children: React.ReactNode,
    label: string,
    onDoubleClick?: () => void,
  ) => {
    if (!shown(id)) return null;
    const p = at(id);
    return (
      <section
        key={id}
        className={`os-widget ${className}`}
        style={{ left: p.x, top: p.y }}
        aria-label={label}
        onPointerDown={begin(id)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showMenu({
            x: e.clientX,
            y: e.clientY,
            items: () => [{ label: `Remove “${NAME[id]}” Widget`, run: () => setWidgetShown(id, false) }, "sep", ...widgetMenu()],
          });
        }}
        title={onDoubleClick ? "Double-click to open" : undefined}
      >
        {children}
      </section>
    );
  };

  return (
    <div className="os-widgets">
      {card("clock", "os-widget--clock", <AnalogClock />, "Clock widget")}
      {card(
        "note",
        "os-widget--note",
        <>
          <p className="os-w-note-title">{stickyNote.title}</p>
          <p>{stickyNote.body}</p>
          {stickyNote.link && (
            <a href={stickyNote.link} target="_blank" rel="noopener noreferrer">
              Take a look →
            </a>
          )}
        </>,
        "Sticky note",
      )}
      {card("music", "os-widget--music", <NowPlayingWidget />, "Now playing widget (double-click to open Music)", () =>
        wm.launch("music"),
      )}
      {card("weather", "os-widget--weather", <WeatherWidget />, "Dallas weather widget")}
      {card("stack", "os-widget--stack", <StackWidget />, "Tech stack widget")}
      {card("tile", "os-widget--tile", <TileGame />, "Sliding tile puzzle widget")}
    </div>
  );
}
