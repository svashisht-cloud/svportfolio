"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../appMeta";

/**
 * Case file: thinning a yard point cloud. A procedural yard (truck, trailer, containers, light
 * poles) as 60k points; the visitor cuts the count until the view is smooth but still readable,
 * then ships it. The "dispatcher laptop" frame time is simulated so the lesson is the same on
 * every device; the visitor's real FPS is shown alongside.
 */

const TOTAL = 60_000;
const MIN = 1_000;
/** Below this, the poles and container edges dissolve. */
const READABLE = 3_500;
/** Simulated frame time on the dispatcher laptop, in ms. */
const frameMs = (n: number) => 2 + n * 0.0022;
const BUDGET_MS = 1000 / 60;

/* ---------- the yard, sampled once ---------- */

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

type Box = { x: number; y: number; z: number; w: number; d: number; h: number; weight: number };

const BOXES: Box[] = [
  // truck cab + chassis
  { x: -9, y: -1.3, z: 0, w: 3, d: 2.6, h: 3.2, weight: 6 },
  { x: -6, y: -1.3, z: 0, w: 2, d: 2.6, h: 1.2, weight: 2 },
  // trailer
  { x: -4, y: -1.3, z: 1, w: 13, d: 2.6, h: 3.4, weight: 22 },
  // container stacks
  ...[-12, -5, 2, 9].flatMap((x) => [
    { x, y: 5.5, z: 0, w: 6, d: 2.4, h: 2.6, weight: 7 },
    { x, y: 5.5, z: 2.6, w: 6, d: 2.4, h: 2.6, weight: 6 },
  ]),
  // light poles
  ...[-14, 0, 14].map((x) => ({ x, y: -6, z: 0, w: 0.3, d: 0.3, h: 8, weight: 1 })),
];

function sampleYard() {
  const r = rng(7);
  const xyz = new Float32Array(TOTAL * 3);
  const totalWeight = BOXES.reduce((s, b) => s + b.weight, 0);
  const groundShare = 0.22;
  for (let i = 0; i < TOTAL; i++) {
    let x: number, y: number, z: number;
    if (r() < groundShare) {
      x = -18 + r() * 36;
      y = -9 + r() * 18;
      z = 0;
    } else {
      let pick = r() * totalWeight;
      let b = BOXES[0];
      for (const box of BOXES) {
        pick -= box.weight;
        if (pick <= 0) {
          b = box;
          break;
        }
      }
      // A point on the box's surface: pick a face, then a spot on it.
      const face = Math.floor(r() * 5); // no bottom face
      const u = r();
      const v = r();
      x = b.x + u * b.w;
      y = b.y + v * b.d;
      z = b.z + r() * b.h;
      if (face === 0) y = b.y;
      else if (face === 1) y = b.y + b.d;
      else if (face === 2) x = b.x;
      else if (face === 3) x = b.x + b.w;
      else z = b.z + b.h;
    }
    xyz[i * 3] = x;
    xyz[i * 3 + 1] = y;
    xyz[i * 3 + 2] = z;
  }
  // Shuffle so any first-N subset is spread evenly over the scene.
  for (let i = TOTAL - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    for (let k = 0; k < 3; k++) {
      const t = xyz[i * 3 + k];
      xyz[i * 3 + k] = xyz[j * 3 + k];
      xyz[j * 3 + k] = t;
    }
  }
  return xyz;
}

/** Slider position (0–1000, log scale) ↔ point count. */
const toCount = (v: number) => Math.round(MIN * Math.pow(TOTAL / MIN, v / 1000));
const toSlider = (n: number) => Math.round((1000 * Math.log(n / MIN)) / Math.log(TOTAL / MIN));

const COLORS = ["#2d6b78", "#3fa3a0", "#6ad7b3", "#b9ef8a", "#ffd36b", "#ffa45b"];

type Verdict = { ok: boolean; text: string } | null;

export default function PointCloudDiet({ onSolved }: { onSolved: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(TOTAL);
  const [fps, setFps] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const countRef = useRef(TOTAL);
  const yawRef = useRef(0.6);
  const dragRef = useRef<{ x: number; yaw: number } | null>(null);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  // Draw loop: rotates slowly (unless reduced motion) and measures real frame rate.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const xyz = sampleYard();
    // Colour band by height, worked out once.
    const band = new Uint8Array(TOTAL);
    for (let i = 0; i < TOTAL; i++) band[i] = Math.min(COLORS.length - 1, Math.floor(xyz[i * 3 + 2] / 1.4));
    const reduced = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    const times: number[] = [];
    let lastShown = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.fillStyle = "#061016";
      ctx.fillRect(0, 0, W, H);
      const n = countRef.current;
      const yaw = yawRef.current;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const pitch = 0.95; // looking down at the yard
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const scale = W / 46;
      const size = Math.max(1.4, Math.min(4, 1.4 * Math.sqrt(TOTAL / n) * 0.55));
      for (let c = 0; c < COLORS.length; c++) {
        ctx.fillStyle = COLORS[c];
        for (let i = 0; i < n; i++) {
          if (band[i] !== c) continue;
          const z = xyz[i * 3 + 2];
          const x = xyz[i * 3];
          const y = xyz[i * 3 + 1];
          const rx = x * cos - y * sin;
          const ry = x * sin + y * cos;
          const depth = ry * cp + z * sp;
          const sy = ry * sp - z * cp;
          const persp = 40 / (40 + depth);
          ctx.fillRect(W / 2 + rx * scale * persp, H * 0.5 + sy * scale * persp, size, size);
        }
      }
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      times.push(dt);
      if (times.length > 30) times.shift();
      if (!reduced && !dragRef.current) yawRef.current += dt * 0.00018;
      draw();
      if (now - lastShown > 500) {
        lastShown = now;
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        setFps(Math.round(1000 / avg));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ms = frameMs(count);
  const smooth = ms <= BUDGET_MS;
  const readable = count >= READABLE;

  const ship = () => {
    if (!smooth) {
      setVerdict({
        ok: false,
        text: `Too slow: ${Math.round(ms)} ms a frame on the dispatcher laptop (${Math.round(1000 / ms)} fps). Operators get a slideshow. Cut more points.`,
      });
    } else if (!readable) {
      setVerdict({
        ok: false,
        text: "Smooth, but the light poles and container edges have dissolved. Operators can't tell the trailer from a container. Add some points back.",
      });
    } else {
      setVerdict({
        ok: true,
        text: `Shipped at ${count.toLocaleString()} points: ${Math.round(ms)} ms a frame, and the truck, trailer and containers are still easy to pick out.`,
      });
      onSolved();
    }
  };

  return (
    <div className="os-case-body">
      <canvas
        ref={canvasRef}
        width={1200}
        height={560}
        className="os-case-canvas os-pcd-canvas"
        role="img"
        aria-label={`Point cloud of a yard with a truck, a trailer and container stacks, drawn with ${count.toLocaleString()} points. Drag to rotate.`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { x: e.clientX, yaw: yawRef.current };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (d) yawRef.current = d.yaw + (e.clientX - d.x) * 0.01;
        }}
        onPointerUp={() => (dragRef.current = null)}
        onPointerCancel={() => (dragRef.current = null)}
      />
      <div className="os-case-readout">
        <span>{count.toLocaleString()} points</span>
        <span>Drag to rotate</span>
      </div>

      <section className="os-case-panel">
        <p className="os-case-msg">
          The browser yard view draws every LiDAR point, and the dispatchers&apos; laptops can&apos;t keep up.
          Cut points until it&apos;s smooth, but keep the yard readable, then ship it.
        </p>
        <label className="os-case-label" htmlFor="pcd-points">
          Points to render
        </label>
        <input
          id="pcd-points"
          className="os-case-range"
          type="range"
          min={0}
          max={1000}
          value={toSlider(count)}
          aria-valuetext={`${count.toLocaleString()} points`}
          onChange={(e) => {
            setCount(toCount(Number(e.target.value)));
            setVerdict(null);
          }}
          disabled={verdict?.ok}
        />
        <div className="os-case-ticks">
          <span>1k</span>
          <span>60k</span>
        </div>

        <div className="os-pcd-meters">
          <div>
            <p className="os-case-label">Dispatcher laptop (simulated)</p>
            <div className="os-pcd-bar" aria-hidden>
              <span
                className={smooth ? "is-ok" : ms < 34 ? "is-warn" : "is-bad"}
                style={{ width: `${Math.min(100, (ms / 140) * 100)}%` }}
              />
              <i style={{ left: `${(BUDGET_MS / 140) * 100}%` }} />
            </div>
            <p className="os-pcd-num">
              {Math.round(ms)} ms a frame · {Math.round(1000 / ms)} fps {smooth ? "✓ smooth" : ""}
            </p>
          </div>
          <div>
            <p className="os-case-label">Your machine (real)</p>
            <p className="os-pcd-num">{fps === null ? "measuring…" : `${fps} fps`}</p>
          </div>
        </div>

        <div className="os-case-buttons">
          {!verdict?.ok && (
            <button type="button" className="aqua-btn aqua-btn--primary" onClick={ship}>
              Ship it
            </button>
          )}
        </div>
        {verdict && (
          <p role="status" className={verdict.ok ? "os-case-scan" : "os-case-hint"}>
            {verdict.ok ? "✓ " : ""}
            {verdict.text}
          </p>
        )}
      </section>
    </div>
  );
}
