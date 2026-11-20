"use client";
import { useState } from "react";
import { FaBug } from "react-icons/fa";
import {
  ACHIEVEMENTS,
  BUG_IDS,
  squash,
  startBugHunt,
  useBugHunt,
  useUnlocked,
  type BugId,
} from "./achievements";
import { prefersReducedMotion } from "./appMeta";
import { useToast } from "./Toast";

/** Trophies: every achievement (locked ones show a hint), plus the Bug Hunt switch. */
export default function AchievementsApp() {
  const unlocked = useUnlocked();
  const hunt = useBugHunt();
  return (
    <div className="os-trophies">
      <header className="os-trophies-head">
        <h1>Trophies</h1>
        <p>
          {unlocked.length} of {ACHIEVEMENTS.length} unlocked
        </p>
        <div className="os-trophies-meter" aria-hidden>
          <span style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }} />
        </div>
      </header>

      <section className="os-bughunt">
        <span className="os-bughunt-icon" aria-hidden>
          <FaBug />
        </span>
        {hunt.on ? (
          <p>
            <strong>Bug Hunt: {hunt.found.length} of {BUG_IDS.length} squashed.</strong>{" "}
            They&apos;re hiding in
            About, Projects, a project, Experience, a work project, Education, Photos, Music, System
            Report and Case Files.
          </p>
        ) : (
          <>
            <p>
              <strong>Bug Hunt.</strong> Ten tiny bugs will hide in windows around the desktop. Find
              and squash them all.
            </p>
            <button type="button" className="aqua-btn aqua-btn--primary" onClick={startBugHunt}>
              Start the Bug Hunt
            </button>
          </>
        )}
      </section>

      <ul className="os-trophy-grid">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.includes(a.id);
          return (
            <li key={a.id} className={`os-trophy${got ? " is-unlocked" : ""}`}>
              <span className="os-trophy-icon" aria-hidden>
                {got ? a.icon : "?"}
              </span>
              <span className="os-trophy-title">{got ? a.title : "???"}</span>
              <span className="os-trophy-hint">{a.hint}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A Bug Hunt bug. Renders nothing unless the hunt is on and this one hasn't been found. */
export function Bug({ id }: { id: BugId }) {
  const hunt = useBugHunt();
  const toast = useToast();
  const [squashing, setSquashing] = useState(false);
  if (!hunt.on || hunt.found.includes(id)) return null;
  return (
    <button
      type="button"
      className={`os-bug${squashing ? " is-squashing" : ""}`}
      aria-label="A bug! Squash it"
      title="A bug!"
      onClick={(e) => {
        e.stopPropagation();
        setSquashing(true);
        window.setTimeout(
          () => {
            const n = squash(id);
            toast(
              n >= BUG_IDS.length ? "All 10 bugs squashed. Ship it!" : `Bug ${n} of ${BUG_IDS.length} squashed.`,
              "🐞",
            );
          },
          prefersReducedMotion() ? 0 : 280,
        );
      }}
    >
      <FaBug aria-hidden />
    </button>
  );
}
