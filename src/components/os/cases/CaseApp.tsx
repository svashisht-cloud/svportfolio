"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../appMeta";
import Debrief from "./Debrief";
import { caseById } from "./registry";
import { markSolved, useSolvedCases } from "./store";

const loading = () => <p className="os-case-loading">Opening case file…</p>;

// Each puzzle loads only when its window opens.
const IncidentReplay = dynamic(() => import("./IncidentReplay"), { loading });
const BootOrder = dynamic(() => import("./BootOrder"), { loading });
const PointCloudDiet = dynamic(() => import("./PointCloudDiet"), { loading });
const SlantedSpots = dynamic(() => import("./SlantedSpots"), { loading });

function Game({ id, onSolved }: { id: string; onSolved: () => void }) {
  switch (id) {
    case "incident-replay":
      return <IncidentReplay onSolved={onSolved} />;
    case "boot-order":
      return <BootOrder onSolved={onSolved} />;
    case "point-cloud-diet":
      return <PointCloudDiet onSolved={onSolved} />;
    case "slanted-spots":
      return <SlantedSpots onSolved={onSolved} />;
    default:
      return null;
  }
}

/** One case file window: header, the puzzle, then the debrief once it's solved (or skipped). */
export default function CaseApp({ caseId }: { caseId?: string }) {
  const c = caseById(caseId);
  const solved = useSolvedCases().includes(caseId ?? "");
  const [reveal, setReveal] = useState(false);
  // Bumped by "Play again" so the puzzle starts over.
  const [round, setRound] = useState(0);
  const debriefRef = useRef<HTMLElement>(null);

  const onSolved = useCallback(() => {
    if (caseId) markSolved(caseId);
    setReveal(true);
  }, [caseId]);

  // Bring the debrief into view inside this window.
  useEffect(() => {
    const el = debriefRef.current;
    const body = el?.closest(".os-window-body");
    if (!reveal || !el || !body) return;
    const top = body.scrollTop + el.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
    body.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [reveal]);

  if (!c) {
    return (
      <div className="os-doc os-center">
        <p>This case file is missing.</p>
      </div>
    );
  }

  return (
    <article className="os-case">
      <header className="os-case-head">
        <div>
          <p className="os-case-kicker">Case file · {c.company}</p>
          <h1>{c.title}</h1>
        </div>
        <span className="os-case-tag">{c.tag}</span>
      </header>
      <Game key={round} id={c.id} onSolved={onSolved} />
      {reveal ? (
        <Debrief
          ref={debriefRef}
          caseFile={c}
          solved={solved}
          onReplay={() => {
            setRound((r) => r + 1);
            setReveal(false);
          }}
        />
      ) : (
        <button type="button" className="os-case-skip" onClick={() => setReveal(true)}>
          {solved ? "Show what really happened ↓" : "Skip to what really happened ↓"}
        </button>
      )}
    </article>
  );
}
