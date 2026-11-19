"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../appMeta";

const IDLE_MS = 90_000;

/** After 90s of no input, glossy SV logos drift around a dark screen. Any input dismisses it. */
export default function ScreenSaver({ disabled }: { disabled: boolean }) {
  const [active, setActive] = useState(false);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!disabledRef.current && document.visibilityState === "visible") setActive(true);
        else arm();
      }, IDLE_MS);
    };
    const wake = () => {
      setActive(false);
      arm();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, wake));
    };
  }, []);

  if (!active) return null;
  return (
    <div className="os-saver" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="os-saver-logo"
          style={{ animationDuration: `${11 + i * 3}s, ${7 + i * 2}s`, animationDelay: `${-i * 2.3}s, ${-i * 1.7}s` }}
        >
          SV
        </span>
      ))}
    </div>
  );
}
