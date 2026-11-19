"use client";
import { useEffect, useRef, useState } from "react";
import { FaMusic } from "react-icons/fa";
import { stickyNote } from "@/app/widgets";
import { SIDEBAR_W } from "./appMeta";
import { skillCounts } from "./commands";
import { useMusic } from "./Music";

type WidgetId = "clock" | "note" | "music" | "stack";
type Positions = Partial<Record<WidgetId, { x: number; y: number }>>;

const KEY = "sv-os-widgets";
const ORDER: WidgetId[] = ["clock", "note", "music", "stack"];

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

/** Default spots: a column to the left of the desktop icons. */
function defaultPosition(id: WidgetId) {
  const i = ORDER.indexOf(id);
  const heights = [0, 172, 330, 420];
  return { x: Math.max(SIDEBAR_W + 40, window.innerWidth - 120 - 210), y: 40 + heights[i] };
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

/** Draggable glass widgets on the desktop (Dashboard-style). Desktop only. */
export default function Widgets() {
  const [pos, setPos] = useState<Positions | null>(null);
  const drag = useRef<{ id: WidgetId; dx: number; dy: number; last?: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setPos(loadPositions()), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!pos) return null;

  const at = (id: WidgetId) => pos[id] ?? defaultPosition(id);

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

  const card = (id: WidgetId, className: string, children: React.ReactNode, label: string) => {
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
      {card("music", "os-widget--music", <NowPlayingWidget />, "Now playing widget")}
      {card("stack", "os-widget--stack", <StackWidget />, "Tech stack widget")}
    </div>
  );
}
