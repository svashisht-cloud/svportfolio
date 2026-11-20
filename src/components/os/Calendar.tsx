"use client";
import { useEffect, useRef, useState } from "react";
import { experiences } from "@/app/portfolioData";
import { unlock } from "./achievements";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Milestones by "YYYY-M" (month 0–11), taken from the portfolio data so nothing is invented. */
function milestones(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (y: number, m: number, label: string) => {
    const k = `${y}-${m}`;
    out.set(k, [...(out.get(k) ?? []), label]);
  };
  for (const exp of experiences) {
    for (const role of exp.roles) {
      // dateRange looks like "June 2022 – Dec 2022"; we use the start month.
      const start = role.dateRange.split(/[–-]/)[0]?.trim().toLowerCase() ?? "";
      const [mon, year] = start.split(/\s+/);
      const m = SHORT.indexOf(mon?.slice(0, 3) ?? "");
      const y = Number(year);
      if (m >= 0 && y) add(y, m, `Started as ${role.title} at ${exp.company}`);
    }
  }
  add(2022, 11, "Graduated from UMass Amherst");
  return out;
}

const MILESTONES = milestones();

/** Small month calendar that drops down from the menu-bar clock. */
export default function Calendar({ onClose }: { onClose: () => void }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest(".os-clock")) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const notes = MILESTONES.get(`${view.y}-${view.m}`);
  const shift = (d: number) => {
    const n = new Date(view.y, view.m + d, 1);
    setView({ y: n.getFullYear(), m: n.getMonth() });
    // Back to the month of my first engineering job.
    if (n.getFullYear() === 2022 && n.getMonth() === 5) unlock("time-travel");
  };

  return (
    <div className="os-calendar" ref={ref} role="dialog" aria-label="Calendar">
      <div className="os-cal-head">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)}>
          ‹
        </button>
        <span>
          {MONTHS[view.m]} {view.y}
          {notes && <span className="os-cal-dot" aria-hidden />}
        </span>
        <button type="button" aria-label="Next month" onClick={() => shift(1)}>
          ›
        </button>
      </div>
      <div className="os-cal-grid" role="grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="os-cal-dow">
            {d}
          </span>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const isToday =
            d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear();
          return (
            <span key={d} className={`os-cal-day${isToday ? " is-today" : ""}`}>
              {d}
            </span>
          );
        })}
      </div>
      {notes ? (
        <ul className="os-cal-notes">
          {notes.map((n) => (
            <li key={n}>★ {n}</li>
          ))}
        </ul>
      ) : (
        <p className="os-cal-hint">Try flipping back to 2022…</p>
      )}
      <button
        type="button"
        className="os-cal-today"
        onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}
      >
        Today
      </button>
    </div>
  );
}
