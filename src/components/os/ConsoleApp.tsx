"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { clearLog, useLog } from "./syslog";

const time = (ms: number) => {
  const d = new Date(ms);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

/** Console: a live log of this visit (windows, music, ShubhGPT, achievements…). */
export default function ConsoleApp() {
  const entries = useLog();
  const [only, setOnly] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  /** Follow new lines only while already scrolled to the bottom. */
  const stick = useRef(true);

  const subsystems = useMemo(() => [...new Set(entries.map((e) => e.subsystem))].sort(), [entries]);
  const q = query.trim().toLowerCase();
  const shown = entries.filter(
    (e) => (!only || e.subsystem === only) && (!q || `${e.subsystem} ${e.message}`.toLowerCase().includes(q)),
  );

  useEffect(() => {
    const list = listRef.current;
    if (list && stick.current) list.scrollTop = list.scrollHeight;
  }, [shown.length]);

  return (
    <div className="os-console">
      <div className="os-toolbar os-console-bar">
        <div className="os-console-chips" role="radiogroup" aria-label="Show messages from">
          {[null, ...subsystems].map((s) => (
            <button
              key={s ?? "all"}
              type="button"
              role="radio"
              aria-checked={only === s}
              className={`os-console-chip${only === s ? " is-on" : ""}`}
              onClick={() => setOnly(s)}
            >
              {s ?? "All"}
            </button>
          ))}
        </div>
        <label className="os-search os-console-search">
          <FaSearch aria-hidden />
          <input
            type="search"
            placeholder="Filter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter messages"
          />
        </label>
        <button type="button" className="aqua-btn" onClick={clearLog}>
          Clear
        </button>
      </div>
      <div
        className="os-console-list"
        ref={listRef}
        role="log"
        aria-label="Messages"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {shown.length === 0 ? (
          <p className="os-console-empty">
            {entries.length ? "No messages match." : "Nothing logged yet. Open a window, play a song or ask ShubhGPT something."}
          </p>
        ) : (
          shown.map((e) => (
            <div key={e.id} className={`os-console-row is-${e.level}`}>
              <span className="os-console-time">{time(e.at)}</span>
              <span className="os-console-sub">{e.subsystem}</span>
              <span className="os-console-msg">{e.message}</span>
            </div>
          ))
        )}
      </div>
      <footer className="os-statusbar">
        {shown.length} of {entries.length} messages · this visit only, never sent anywhere
      </footer>
    </div>
  );
}
