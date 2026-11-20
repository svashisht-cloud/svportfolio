"use client";

import { useEffect, useReducer, useRef } from "react";

/**
 * Case file: the LiDAR ring buffer. A yard truck stops. Recording from the stop shows nothing,
 * so the visitor keeps a rolling 30 s buffer, replays the incident and marks the frame that
 * explains the stop. All of it is simulated; the real story is in the registry's debrief.
 */

type Phase = "brief" | "approach" | "stopped" | "recording" | "review" | "solved";
type State = { phase: Phase; second: number; buffered: boolean; hint: string };
type Action = "start" | "tick" | "record" | "buffer" | "mark" | { seek: number };
const initial: State = { phase: "brief", second: -42, buffered: false, hint: "" };
const historySeconds = 30;

function crossing(second: number) {
  return second >= -10 && second <= -6;
}

function update(state: State, action: Action): State {
  if (typeof action === "object") {
    if (state.phase !== "review") return state;
    const first = state.buffered ? -historySeconds : 0;
    return { ...state, second: Math.max(first, Math.min(historySeconds, action.seek)), hint: "" };
  }
  switch (action) {
    case "start": return { ...initial, phase: "approach" };
    case "buffer": return { ...initial, phase: "approach", buffered: true };
    case "record": return { ...state, phase: "recording" };
    case "tick": {
      const second = state.second + 1;
      if (state.phase === "approach") {
        if (second === 0) return { ...state, second, phase: state.buffered ? "recording" : "stopped" };
      } else if (state.phase === "recording") {
        if (second === historySeconds) return { ...state, phase: "review", second: 0 };
      } else return state;
      return { ...state, second };
    }
    case "mark": return crossing(state.second)
      ? { ...state, phase: "solved", hint: "" }
      : { ...state, hint: "Look for the amber returns inside the dashed travel lane before the stop." };
  }
}

function stamp(second: number) {
  const seconds = 42 * 60 + 8 + second;
  return `10:${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function scanDescription(second: number) {
  if (crossing(second)) return "A moving cluster of amber returns crosses the truck’s travel lane.";
  if (second >= 0) return "Truck stationary. Travel lane clear.";
  return "Truck approaching the loading bay. Travel lane clear.";
}

function YardScan({ second }: { second: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = "#071b23";
    ctx.fillRect(0, 0, 600, 240);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "#19343d";
    ctx.beginPath();
    for (let grid = 0; grid <= 600; grid += 20) {
      ctx.moveTo(grid, 0); ctx.lineTo(grid, 240);
      ctx.moveTo(0, grid); ctx.lineTo(600, grid);
    }
    ctx.stroke();
    ctx.strokeStyle = "#5b7f87";
    ctx.setLineDash([8, 7]);
    ctx.strokeRect(-8, 95, 616, 52);
    ctx.setLineDash([]);
    function returns(left: number, top: number, width: number, height: number, color: string) {
      if (!ctx) return;
      ctx.fillStyle = color;
      for (let along = 0; along <= width; along += 3) {
        const jitter = Math.sin(along * 8 + left);
        ctx.fillRect(left + along, top + jitter, 2, 2);
        ctx.fillRect(left + along, top + height - jitter, 2, 2);
      }
      for (let down = 0; down <= height; down += 3) {
        ctx.fillRect(left, top + down, 2, 2);
        ctx.fillRect(left + width, top + down, 2, 2);
      }
    }
    for (let bay = 0; bay < 8; bay++) {
      returns(26 + bay * 72, 37, 52, 35, "#537e8a");
      returns(14 + bay * 73, 183, 54, 36, "#537e8a");
    }
    const truck = 270 + Math.min(0, second) * 4;
    ctx.strokeStyle = "#25535a";
    for (const radius of [41, 82, 123]) {
      ctx.beginPath();
      ctx.arc(truck + 51, 121, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    returns(truck, 109, 40, 23, "#6af1cf");
    returns(truck + 44, 111, 15, 19, "#a1ffe4");
    if (second >= -15 && second <= -2) {
      returns(360, 97 + (second + 10) * 10, 20, 8, "#ffbb67");
    }
    ctx.font = "12px monospace";
    ctx.fillStyle = "#a4c1c8";
    ctx.fillText("YARD  /  BAY 04", 14, 18);
    ctx.fillStyle = "#a1ffe4";
    ctx.fillText("UNIT 07", truck, 157);
  }, [second]);
  return <canvas ref={canvasRef} width={1200} height={480} className="os-case-canvas" role="img" aria-label={scanDescription(second)} />;
}

export default function IncidentReplay({ onSolved }: { onSolved: () => void }) {
  const [state, dispatch] = useReducer(update, initial);
  const { phase, second, buffered } = state;
  const running = phase === "approach" || phase === "recording";
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => dispatch("tick"), 100);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (phase === "solved") onSolved();
  }, [phase, onSolved]);

  const review = phase === "review" || phase === "solved";
  const first = buffered ? -historySeconds : 0;
  const bufferedCount = Math.min(historySeconds, 42 + second);
  const message = {
    brief: "A yard truck stopped at 10:42:08. Find the scan that explains why.",
    approach: buffered ? "Keeping the latest 30 seconds in memory. The stop will pin the clip." : "Watch the truck approach the bay. The recorder is on standby.",
    stopped: "Stop detected. Start recording to inspect the incident.",
    recording: "Saving the 30 seconds after the stop…",
    review: buffered ? "Rewind and mark a frame where something crosses the truck’s lane." : "Every saved frame shows a stopped truck. Keep a rolling buffer and run the same incident again.",
    solved: "Incident solved. A crossing object entered the lane before the truck stopped.",
  }[phase];

  return (
    <div className="os-case-body">
      <YardScan second={second} />
      <div className="os-case-readout">
        <span>{stamp(second)}</span>
        <span>{phase === "approach" && buffered ? `Buffer · ${bufferedCount}/30 s` : review ? `Saved clip · ${buffered ? "60" : "30"} s` : running ? "Feed · 10×" : "Feed paused"}</span>
      </div>
      {phase === "approach" && buffered && <progress className="os-case-progress" value={bufferedCount} max={historySeconds} aria-label="Rolling history in seconds" />}
      <section className="os-case-panel">
        <p role="status" className="os-case-msg">{message}</p>
        {review && <>
          <label className="os-case-label" htmlFor="incident-frame">Inspect captured frame</label>
          <input id="incident-frame" className="os-case-range" type="range" min={first} max={historySeconds} value={second} disabled={phase === "solved"}
            aria-valuetext={`${stamp(second)}. ${scanDescription(second)}`} onChange={event => dispatch({ seek: Number(event.target.value) })} />
          <div className="os-case-ticks"><span>{first} s</span><span>+30 s</span></div>
          <p className="os-case-scan">{scanDescription(second)}</p>
        </>}
        <div className="os-case-buttons">
          {phase === "brief" && <button type="button" className="aqua-btn aqua-btn--primary" onClick={() => dispatch("start")}>Run incident</button>}
          {phase === "stopped" && <button type="button" className="aqua-btn aqua-btn--primary" onClick={() => dispatch("record")}>Record from stop</button>}
          {phase === "review" && <button type="button" className="aqua-btn aqua-btn--primary" onClick={() => dispatch(buffered ? "mark" : "buffer")}>{buffered ? "Mark this frame" : "Keep last 30 seconds & replay"}</button>}
        </div>
        {state.hint && <p role="status" className="os-case-hint">{state.hint}</p>}
      </section>
    </div>
  );
}
