"use client";
import { AppIcon } from "../appMeta";
import { useWM } from "../WindowManager";
import { Bug } from "../AchievementsApp";
import { CASES } from "./registry";
import { useSolvedCases } from "./store";

/** The Case Files folder: one row per puzzle, with a ✓ for solved ones. */
export default function CaseFilesApp() {
  const wm = useWM();
  const solved = useSolvedCases();
  const done = CASES.filter((c) => solved.includes(c.id)).length;
  return (
    <div className="os-cases">
      <p className="os-cases-intro">
        60-second puzzles from my real work. Each one ends with what actually happened, and the numbers
        behind it. <Bug id="cases" />
      </p>
      <ul className="os-cases-list" aria-label="Case files">
        {CASES.map((c) => {
          const isSolved = solved.includes(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                className="os-case-row"
                onClick={() => wm.launch("case", { caseId: c.id })}
                aria-label={`${c.title}${isSolved ? " (solved)" : ""}: ${c.tagline}`}
              >
                <span className="os-case-row-icon">
                  <AppIcon kind="case" payload={{ caseId: c.id }} />
                </span>
                <span className="os-case-row-text">
                  <span className="os-case-row-title">{c.title}</span>
                  <span className="os-case-row-sub">{c.tagline}</span>
                </span>
                <span className={`os-case-row-state${isSolved ? " is-solved" : ""}`} aria-hidden>
                  {isSolved ? "✓ Solved" : "▶ Play"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <footer className="os-statusbar">
        {done} of {CASES.length} solved · {done === CASES.length ? "nice work" : "click one to play"}
      </footer>
    </div>
  );
}
