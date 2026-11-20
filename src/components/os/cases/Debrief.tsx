"use client";
import { FaComments, FaEnvelope, FaFileAlt, FaLink, FaRedo } from "react-icons/fa";
import { findWork } from "@/app/portfolioData";
import { deliver } from "../deliver";
import { useCopyLink } from "../useCopyLink";
import { useWM } from "../WindowManager";
import type { CaseFile } from "./registry";

/** The reveal at the end of a case file: the real numbers, how it was built, and where to go next. */
export default function Debrief({
  caseFile: c,
  solved,
  onReplay,
  ref,
}: {
  caseFile: CaseFile;
  solved: boolean;
  onReplay: () => void;
  ref?: React.Ref<HTMLElement>;
}) {
  const wm = useWM();
  const copyLink = useCopyLink();
  const work = findWork(c.work);
  return (
    <section ref={ref} className="os-debrief" aria-labelledby={`debrief-${c.id}`}>
      <p className="os-debrief-kicker" id={`debrief-${c.id}`}>
        {solved ? "✓ Case solved · what really happened" : "What really happened"}
      </p>
      <ul className="os-debrief-facts">
        {c.facts.map((f) => (
          <li key={f.label}>
            <span className="os-debrief-num">
              {f.from ? (
                <>
                  <s>{f.from}</s> <span>→ {f.to}</span>
                </>
              ) : (
                <span>{f.to}</span>
              )}
            </span>
            <span className="os-debrief-label">{f.label}</span>
          </li>
        ))}
      </ul>
      <h2>How I built it</h2>
      {c.story.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <div className="os-actions">
        {work && (
          <button type="button" className="aqua-btn aqua-btn--primary" onClick={() => wm.launch("work", work)}>
            <FaFileAlt aria-hidden /> Read the full story
          </button>
        )}
        <button type="button" className="aqua-btn" onClick={() => deliver(wm, "shubhgpt", "ask", c.question)}>
          <FaComments aria-hidden /> Ask ShubhGPT about it
        </button>
        <button
          type="button"
          className="aqua-btn"
          onClick={() =>
            deliver(
              wm,
              "contact",
              "compose",
              `Hi Shubh,\n\nI just played "${c.title}" on your portfolio and wanted to talk about it.\n\n`,
            )
          }
        >
          <FaEnvelope aria-hidden /> Email Shubh
        </button>
        <button type="button" className="aqua-btn" onClick={() => copyLink("case", { caseId: c.id })}>
          <FaLink aria-hidden /> Copy link
        </button>
        <button type="button" className="aqua-btn" onClick={onReplay}>
          <FaRedo aria-hidden /> Play again
        </button>
      </div>
    </section>
  );
}
