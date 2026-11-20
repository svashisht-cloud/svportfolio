"use client";

import { useEffect, useState } from "react";

/**
 * Case file: yard inventory on slanted spots. A truck drives the lane and photographs each
 * parked trailer's ID plate. On angled spots the plate sits off to the side, so capturing at the
 * spot's centre misses it (≈70%). An angle-scaled capture offset fixes the geometry (≈97%); the
 * one miss left is the CV model misreading a faded plate. Simulated, generic IDs.
 */

const W = 640;
const H = 300;
const LANE_Y = 150;
const SPACING = W / 15;
/** How far the plate sits from the trailer's centre, along its axis (px). */
const NOSE = 32;
/** Half-width of the camera's view at the plate (px). */
const VIEW = 6;
/** The spot whose plate is faded: geometry can't fix it. */
const CV_MISS = 22;

interface Spot {
  i: number;
  x: number;
  top: boolean;
  angle: number; // degrees, 0 = square to the lane
  id: string;
}

// 21 square spots, 9 slanted (15°, 30°, 45°, both ways): about 70% read at the start.
const ANGLES = [0, 0, 15, 0, 0, -30, 0, 0, 45, 0, 0, 0, -15, 0, 0, 0, 30, 0, 0, -45, 0, 0, 15, 0, 0, 0, -30, 0, 0, 45];

const SPOTS: Spot[] = ANGLES.map((angle, i) => ({
  i,
  x: SPACING / 2 + (i % 15) * SPACING,
  top: i < 15,
  angle,
  id: `T-${(4100 + i * 37) % 9000}`,
}));

const rad = (d: number) => (d * Math.PI) / 180;

/** Where the plate is, along the lane. */
const plateX = (s: Spot) => s.x + NOSE * Math.sin(rad(s.angle));
/** Where the truck takes the photo, for an offset factor k. */
const captureX = (s: Spot, k: number) => s.x + k * NOSE * Math.sin(rad(s.angle));
const inView = (s: Spot, k: number) => Math.abs(plateX(s) - captureX(s, k)) <= VIEW;
const reads = (s: Spot, k: number) => inView(s, k) && s.i !== CV_MISS;

export default function SlantedSpots({ onSolved }: { onSolved: () => void }) {
  const [k, setK] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);

  const correct = SPOTS.filter((s) => reads(s, k)).length;
  const pct = Math.round((correct / SPOTS.length) * 1000) / 10;
  const geometryFixed = pct >= 95;

  useEffect(() => {
    if (solved) onSolved();
  }, [solved, onSolved]);

  const pickedSpot = picked === null ? null : SPOTS[picked];
  let note = "";
  if (pickedSpot) {
    if (reads(pickedSpot, k)) note = `${pickedSpot.id}: read correctly.`;
    else if (!inView(pickedSpot, k))
      note = `${pickedSpot.id}: the plate is outside the camera's view. On a ${Math.abs(pickedSpot.angle)}° spot the plate sits off to the side, but the truck captured at the spot's centre.`;
    else
      note = `${pickedSpot.id}: the plate is fully in frame, but the model read it as “${pickedSpot.id.replace("1", "7")}”. It's faded. Better capture geometry can't fix this one: it's the CV model.`;
  }

  const pick = (s: Spot) => {
    setPicked(s.i);
    if (geometryFixed && s.i === CV_MISS) setSolved(true);
  };

  return (
    <div className="os-case-body">
      <svg viewBox={`0 0 ${W} ${H}`} className="os-case-canvas os-spots" role="img" aria-label={`Top-down yard: ${correct} of ${SPOTS.length} trailers read correctly.`}>
        <rect x={0} y={0} width={W} height={H} fill="#071b23" />
        <rect x={0} y={LANE_Y - 16} width={W} height={32} fill="#0d2a33" />
        <line x1={0} x2={W} y1={LANE_Y} y2={LANE_Y} stroke="#5b7f87" strokeDasharray="8 7" />
        {SPOTS.map((s) => {
          const dir = s.top ? -1 : 1; // trailers point away from the lane
          const cy = LANE_Y + dir * 80;
          const px = plateX(s);
          const py = LANE_Y + dir * (80 - NOSE * Math.cos(rad(s.angle)));
          const cx = captureX(s, k);
          const ok = reads(s, k);
          const cone = `${cx},${LANE_Y} ${cx - VIEW * 1.6},${py} ${cx + VIEW * 1.6},${py}`;
          const isPicked = picked === s.i;
          const hint = geometryFixed && !ok && !solved;
          return (
            <g
              key={s.i}
              className={`os-spot${ok ? " is-ok" : " is-miss"}${isPicked ? " is-picked" : ""}${hint ? " is-hint" : ""}`}
              onClick={() => pick(s)}
              role="button"
              tabIndex={0}
              aria-label={`Trailer ${s.id}, ${s.angle === 0 ? "square" : `${Math.abs(s.angle)}°`} spot, ${ok ? "read" : "misread"}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(s);
                }
              }}
            >
              <polygon points={cone} className="os-spot-cone" />
              <rect
                x={s.x - 9}
                y={cy - 32}
                width={18}
                height={64}
                rx={2}
                transform={`rotate(${dir * s.angle} ${s.x} ${cy})`}
                className="os-spot-trailer"
              />
              <circle cx={px} cy={py} r={3.2} className="os-spot-plate" />
              <text x={s.x} y={s.top ? 16 : H - 8} textAnchor="middle" className="os-spot-mark">
                {ok ? "✓" : "✗"}
              </text>
            </g>
          );
        })}
        <g transform={`translate(10 ${LANE_Y - 9})`} aria-hidden>
          <rect width={30} height={18} rx={3} fill="#6af1cf" />
          <rect x={30} y={3} width={9} height={12} rx={2} fill="#a1ffe4" />
        </g>
      </svg>
      <div className="os-case-readout">
        <span>Yard 2 · {SPOTS.length} trailers</span>
        <span className={geometryFixed ? "os-spots-good" : undefined}>Accuracy {pct}%</span>
      </div>

      <section className="os-case-panel">
        <p className="os-case-msg">
          {solved
            ? "Root cause found: capture geometry for the slanted spots, and the CV model for the last one."
            : geometryFixed
              ? `${pct}%. One trailer still misreads. Click it to find out why.`
              : "Inventory accuracy is stuck near 70%, and the misses cluster on slanted spots. Click a ✗ to inspect it, then fix the capture."}
        </p>
        <label className="os-case-label" htmlFor="spots-offset">
          Capture offset (scaled by each spot&apos;s angle)
        </label>
        <input
          id="spots-offset"
          className="os-case-range"
          type="range"
          min={0}
          max={150}
          value={Math.round(k * 100)}
          aria-valuetext={`offset ${k.toFixed(2)}, accuracy ${pct}%`}
          onChange={(e) => {
            setK(Number(e.target.value) / 100);
            setPicked(null);
          }}
          disabled={solved}
        />
        <div className="os-case-ticks">
          <span>at spot centre</span>
          <span>too far</span>
        </div>
        {note && (
          <p role="status" className={pickedSpot && reads(pickedSpot, k) ? "os-case-scan" : "os-case-hint"}>
            {note}
          </p>
        )}
      </section>
    </div>
  );
}
