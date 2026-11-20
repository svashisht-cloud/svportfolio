"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { prefersReducedMotion } from "../appMeta";

/**
 * Case file: where should the on-truck compatibility check run? The visitor drops a
 * `verify-config` step into a simulated boot sequence and boots. Only "in Buildroot, before
 * ROS" catches the bad image cleanly. Service names and versions are generic; the real story
 * is in the registry's debrief.
 */

type SlotId = "kernel" | "buildroot" | "ros";
type Tone = "ok" | "fail" | "warn" | "dim";

interface Stage {
  id: string;
  label: string;
  sub: string;
}

const STAGES: Stage[] = [
  { id: "reprogram", label: "Reprogramming finished", sub: "New service images installed" },
  { id: "bootloader", label: "Bootloader", sub: "Loads the Linux kernel" },
  { id: "kernel", label: "Linux kernel", sub: "Hardware and drivers" },
  { id: "buildroot", label: "Buildroot userspace", sub: "Mounts /config, brings up the network" },
  { id: "ros", label: "ROS", sub: "Launches the truck's services" },
  { id: "services", label: "Autonomy services", sub: "Perception, planning, control" },
  { id: "ready", label: "Truck ready", sub: "Waiting for a mission" },
];

/** Drop slots, each shown right after the stage named in `after`. */
const SLOTS: { id: SlotId; after: string; label: string }[] = [
  { id: "kernel", after: "bootloader", label: "Before the kernel" },
  { id: "buildroot", after: "buildroot", label: "In Buildroot, before ROS" },
  { id: "ros", after: "ros", label: "As a ROS service" },
];

interface LogLine {
  t: string;
  stage: string;
  text: string;
  tone?: Tone;
}

const L = (t: string, stage: string, text: string, tone?: Tone): LogLine => ({ t, stage, text, tone });

const START = [
  L("0.00", "reprogram", "reprogram: new service images installed", "dim"),
  L("0.41", "bootloader", "bootloader: loading kernel"),
];
const KERNEL = [L("1.20", "kernel", "kernel: up", "ok")];
const BUILDROOT = [
  L("2.03", "buildroot", "buildroot: mounted /config", "ok"),
  L("2.18", "buildroot", "buildroot: network up", "ok"),
];
const ROS = [L("3.00", "ros", "ros: started", "ok")];
const MISMATCH = L("3.42", "services", "perception: image 4.2 needs config schema 7, truck has 6", "warn");
const crash = (t: string) => L(t, "services", "perception: exited (code 1), restarting…", "fail");

const SCRIPTS: Record<SlotId, { ok: boolean; lines: LogLine[]; verdict: string }> = {
  kernel: {
    ok: false,
    lines: [
      ...START,
      L("0.52", "bootloader", "verify-config: reading /config/truck.yaml"),
      L("0.52", "bootloader", "verify-config: can't read /config (not mounted yet)", "fail"),
      L("0.53", "bootloader", "verify-config: skipped, continuing boot", "warn"),
      ...KERNEL,
      ...BUILDROOT,
      ...ROS,
      L("3.10", "services", "ros: launching perception, planning, control"),
      MISMATCH,
      crash("3.43"),
      crash("4.43"),
      crash("5.43"),
    ],
    verdict:
      "Too early. Before the kernel, /config isn't mounted yet, so the check had nothing to read and the bad image got through.",
  },
  buildroot: {
    ok: true,
    lines: [
      ...START,
      ...KERNEL,
      ...BUILDROOT,
      L("2.25", "buildroot", "verify-config: checking service images against /config"),
      L("2.31", "buildroot", "verify-config: perception 4.2 needs config schema 7, truck has 6", "fail"),
      L("2.31", "buildroot", "verify-config: incompatible image, stopping before ROS starts", "warn"),
    ],
    verdict: "Caught before ROS started: one clear error, and nothing ran on the bad image.",
  },
  ros: {
    ok: false,
    lines: [
      ...START,
      ...KERNEL,
      ...BUILDROOT,
      ...ROS,
      L("3.10", "services", "ros: launching verify-config, perception, planning, control"),
      MISMATCH,
      crash("3.43"),
      L("3.90", "services", "verify-config: perception 4.2 is incompatible", "warn"),
      crash("4.43"),
    ],
    verdict:
      "Too late. As a ROS service, the check starts alongside the services it should protect, so they were already crashing when it reported.",
  },
};

const BADGE: Partial<Record<Tone, string>> = { ok: "[ OK ]", fail: "[FAIL]", warn: "[WARN]" };

/** The slot under a point, if any (the dragged card itself is skipped). */
function slotAt(x: number, y: number): SlotId | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el instanceof HTMLElement && el.dataset.slot && !el.classList.contains("os-seq-card")) {
      return el.dataset.slot as SlotId;
    }
  }
  return null;
}

export default function BootOrder({ onSolved }: { onSolved: () => void }) {
  const [slot, setSlot] = useState<SlotId | null>(null);
  const [tried, setTried] = useState<SlotId[]>([]);
  const [booting, setBooting] = useState<SlotId | null>(null);
  const [shown, setShown] = useState(0);
  const [over, setOver] = useState<SlotId | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLOListElement>(null);
  /** A drag ends with a click event; this swallows it. */
  const dragged = useRef(false);

  const script = booting ? SCRIPTS[booting] : null;
  const done = !!script && shown >= script.lines.length;
  const printed = script ? script.lines.slice(0, shown) : [];
  const reached = new Set(printed.map((l) => l.stage));
  // On the right answer the check stops the boot on purpose, so nothing turns red.
  const failed = new Set(
    script?.ok ? [] : printed.filter((l) => l.tone === "fail").map((l) => l.stage),
  );
  const current = !done ? printed[printed.length - 1]?.stage : undefined;

  // Print the boot log a line at a time (all at once with reduced motion).
  useEffect(() => {
    if (!script || shown >= script.lines.length) return;
    const reduced = prefersReducedMotion();
    const t = window.setTimeout(
      () => setShown(reduced ? script.lines.length : (n) => n + 1),
      reduced ? 0 : shown === 0 ? 150 : 240,
    );
    return () => window.clearTimeout(t);
  }, [script, shown]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [shown]);

  // On narrow windows the log sits below the pipeline: bring it into view when booting.
  useEffect(() => {
    const side = sideRef.current;
    const body = side?.closest(".os-window-body");
    if (!booting || !side || !body) return;
    const top = side.getBoundingClientRect().top - body.getBoundingClientRect().top;
    if (top < 0 || top > body.clientHeight - 160) {
      body.scrollTo({ top: body.scrollTop + top - 12, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  }, [booting]);

  useEffect(() => {
    if (done && script?.ok) onSolved();
  }, [done, script, onSolved]);

  const boot = () => {
    if (!slot) return;
    setShown(0);
    setBooting(slot);
  };

  const retry = () => {
    if (booting) setTried((t) => (t.includes(booting) ? t : [...t, booting]));
    setBooting(null);
    setShown(0);
    setSlot(null);
  };

  /** Drag the card by pointer (mouse or touch); dropping it on a slot places it there. */
  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (booting || e.button !== 0) return;
    const el = e.currentTarget;
    const sx = e.clientX;
    const sy = e.clientY;
    let moving = false;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moving && Math.hypot(dx, dy) < 5) return;
      moving = true;
      el.classList.add("is-dragging");
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      setOver(slotAt(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.classList.remove("is-dragging");
      el.style.transform = "";
      setOver(null);
      if (!moving) return;
      dragged.current = true;
      const hit = ev.type === "pointerup" ? slotAt(ev.clientX, ev.clientY) : null;
      if (hit) setSlot(hit);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onCardClick = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    if (booting) return;
    // A placed card goes back to the tray; a card in the tray points to the slots.
    if (slot) setSlot(null);
    else pipelineRef.current?.querySelector<HTMLButtonElement>("button[data-slot]")?.focus();
  };

  const card = (
    <button
      type="button"
      className="os-seq-card"
      onPointerDown={startDrag}
      onClick={onCardClick}
      disabled={!!booting}
      aria-label={
        slot
          ? "verify-config check. Click to take it out, or drag it to another slot."
          : "verify-config check. Drag it into the boot sequence, or pick a slot below."
      }
    >
      <FaShieldAlt aria-hidden /> verify-config
    </button>
  );

  return (
    <div className="os-case-body os-seq">
      <section className="os-case-panel">
        <p className="os-case-msg">
          The truck was just reprogrammed, and one of its new service images doesn&apos;t match its config.
          Put the <code>verify-config</code> check where it catches that cleanly, then boot.
        </p>
        <div className="os-seq-tray">
          {slot ? (
            <span className="os-seq-tray-note">
              Placed: {SLOTS.find((s) => s.id === slot)?.label}. Drag it to move it, or click it to take it out.
            </span>
          ) : (
            <>
              {card}
              <span className="os-seq-tray-note">Drag the check into a slot, or click a slot.</span>
            </>
          )}
        </div>
      </section>

      <div className="os-seq-grid">
        <ol className="os-seq-pipeline" aria-label="Boot sequence" ref={pipelineRef}>
          {STAGES.map((stage) => {
            const after = SLOTS.find((s) => s.after === stage.id);
            const cls = [
              "os-seq-stage",
              reached.has(stage.id) ? "is-done" : "",
              failed.has(stage.id) ? "is-failed" : "",
              current === stage.id ? "is-current" : "",
            ].join(" ");
            return (
              <Fragment key={stage.id}>
                <li className={cls}>
                  <strong>{stage.label}</strong>
                  <small>{stage.sub}</small>
                </li>
                {after && (
                  <li className="os-seq-slot-row">
                    {slot === after.id ? (
                      <div className="os-seq-slot is-filled" data-slot={after.id}>
                        {card}
                        <span className="os-seq-slot-label">{after.label}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-slot={after.id}
                        className={`os-seq-slot${over === after.id ? " is-over" : ""}${
                          tried.includes(after.id) ? " is-tried" : ""
                        }`}
                        disabled={!!booting}
                        onClick={() => setSlot(after.id)}
                        aria-label={`Put the check here: ${after.label}${tried.includes(after.id) ? " (tried)" : ""}`}
                      >
                        {after.label}
                        {tried.includes(after.id) && <span className="os-seq-tried">✗ tried</span>}
                      </button>
                    )}
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>

        <div className="os-seq-side" ref={sideRef}>
          <div className="os-case-buttons">
            {!done && (
              <button type="button" className="aqua-btn aqua-btn--primary" onClick={boot} disabled={!slot || !!booting}>
                {booting ? "Booting…" : "Boot the truck"}
              </button>
            )}
            {done && !script?.ok && (
              <button type="button" className="aqua-btn aqua-btn--primary" onClick={retry}>
                Try another spot
              </button>
            )}
          </div>
          <div className="os-seq-log" ref={logRef} role="log" aria-label="Boot log">
            {printed.length === 0 ? (
              <span className="is-dim">{slot ? "Ready. Boot the truck." : "Place the check, then boot the truck."}</span>
            ) : (
              printed.map((l, i) => (
                <div key={i} className={l.tone === "dim" ? "is-dim" : undefined}>
                  <span className="os-seq-t">[{l.t.padStart(5)}]</span> {l.text}
                  {l.tone && BADGE[l.tone] && <span className={`is-${l.tone}`}> {BADGE[l.tone]}</span>}
                </div>
              ))
            )}
          </div>
          {done && script && (
            <p role="status" className={`os-seq-verdict ${script.ok ? "is-ok" : "is-fail"}`}>
              {script.ok ? "✓ " : "✗ "}
              {script.verdict}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
