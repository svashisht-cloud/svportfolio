"use client";
import { useEffect, useState } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { prefersReducedMotion } from "./appMeta";

/**
 * Virtual PC and Classic: two of Shubh's earlier projects running in a window on this desktop.
 * Both sites allow being framed. The iframe loads behind a short in-window start-up screen.
 */
export const RETRO = {
  virtualpc: {
    url: "https://windowsxpsimulator.vercel.app/",
    project: "Windows XP Clone",
    booting: "Starting Shubh's XP…",
    title: "Windows XP Clone, running in Virtual PC",
  },
  classic: {
    url: "https://shubhvashisht.com/",
    project: "Personal Portfolio (Old)",
    booting: "Classic environment starting…",
    title: "My old portfolio, running in Classic",
  },
} as const;

export type RetroKind = keyof typeof RETRO;

const BOOT_MS = 1600;

export default function RetroApp({ kind }: { kind: RetroKind }) {
  const app = RETRO[kind];
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setBooted(true), prefersReducedMotion() ? 0 : BOOT_MS);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className={`os-retro os-retro--${kind}`}>
      <div className="os-toolbar">
        <span className="os-toolbar-note">{app.project} · an earlier project of mine</span>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="aqua-btn os-retro-open"
        >
          <FaExternalLinkAlt aria-hidden /> Open in new tab
        </a>
      </div>
      <div className="os-retro-screen">
        <iframe src={app.url} title={app.title} className="os-retro-frame" />
        {!booted && (
          <div className="os-retro-boot" role="status">
            <p>{app.booting}</p>
            <div className="os-retro-progress" aria-hidden>
              <span style={{ animationDuration: `${BOOT_MS}ms` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
