"use client";
import React, { useEffect, useRef, useState } from "react";
import "./SearchVisualizer.css";
import { ALGORITHMS, SIZE, generateMaze, neighbours, scatterWalls, search } from "./searchAlgorithms";

const N = SIZE * SIZE;
const MAX_STARTS = 4;
export const START_COLORS = ["#2f9e44", "#7c3aed", "#e8590c", "#0b8fd6"];
const at = (r, c) => r * SIZE + c;

/** Animation delay (ms) and squares processed per tick, by speed setting 1–10. */
const SPEEDS = [
  [140, 1],
  [90, 1],
  [60, 1],
  [35, 1],
  [20, 1],
  [12, 1],
  [6, 1],
  [2, 1],
  [0, 3],
  [0, 8],
];

const TOOLS = [
  { id: "start", label: "Start", hint: `Add a start (up to ${MAX_STARTS})` },
  { id: "goal", label: "Goal", hint: "Move the goal" },
  { id: "wall", label: "Wall", hint: "Paint walls" },
  { id: "mud", label: "Mud", hint: "Paint mud (costs 5 to cross)" },
  { id: "erase", label: "Eraser", hint: "Erase walls, mud or extra starts" },
];

const freshBoard = () => ({
  starts: [at(12, 4)],
  goal: at(12, 20),
  walls: new Set(),
  mud: new Set(),
});

const emptyStats = { explored: 0, length: null, cost: null, ms: null, winner: null, status: "ready" };

const SearchVisualizer = () => {
  const [algo, setAlgo] = useState("ASTAR");
  const [tool, setTool] = useState("wall");
  const [speed, setSpeed] = useState(7);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [startCount, setStartCount] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [shake, setShake] = useState(false);

  const board = useRef(freshBoard());
  const cells = useRef([]);
  const gridRef = useRef(null);
  const gen = useRef(null);
  const timer = useRef(0);
  const explored = useRef(0);
  const speedRef = useRef(speed);
  const algoRef = useRef(algo);
  const gesture = useRef(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    algoRef.current = algo;
  }, [algo]);

  /* ---------- Drawing ---------- */

  const drawCell = (i) => {
    const el = cells.current[i];
    if (!el) return;
    const b = board.current;
    const startIdx = b.starts.indexOf(i);
    el.classList.toggle("is-wall", b.walls.has(i));
    el.classList.toggle("is-mud", b.mud.has(i));
    el.classList.toggle("is-goal", b.goal === i);
    el.classList.toggle("is-start", startIdx >= 0);
    if (startIdx >= 0) {
      el.style.setProperty("--start", START_COLORS[startIdx]);
      el.dataset.label = String(startIdx + 1);
    } else {
      delete el.dataset.label;
    }
  };

  const drawAll = () => {
    for (let i = 0; i < N; i++) drawCell(i);
  };

  const clearSearchMarks = () => {
    for (const el of cells.current) {
      if (!el) continue;
      el.classList.remove("is-visited", "is-frontier", "is-path", "is-path-start", "is-path-goal");
      el.style.removeProperty("--owner");
      el.style.removeProperty("--d");
    }
    explored.current = 0;
  };

  const stop = () => {
    window.clearTimeout(timer.current);
    gen.current = null;
    setRunning(false);
  };

  /** Any edit cancels a search in progress and wipes its marks. */
  const edited = () => {
    if (gen.current || stats.status !== "ready") {
      stop();
      clearSearchMarks();
      setStats(emptyStats);
    }
  };

  useEffect(() => {
    drawAll();
    return () => window.clearTimeout(timer.current);
    // drawAll only touches refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Editing ---------- */

  const applyTool = (i, t) => {
    const b = board.current;
    const isStart = b.starts.includes(i);
    const isGoal = b.goal === i;
    switch (t) {
      case "wall":
      case "mud": {
        if (isStart || isGoal) return;
        const set = t === "wall" ? b.walls : b.mud;
        const other = t === "wall" ? b.mud : b.walls;
        if (set.has(i)) return;
        other.delete(i);
        set.add(i);
        break;
      }
      case "erase":
        if (isStart && b.starts.length > 1) {
          b.starts = b.starts.filter((s) => s !== i);
          setStartCount(b.starts.length);
          drawAll();
          return;
        }
        if (!b.walls.delete(i) && !b.mud.delete(i)) return;
        break;
      case "start":
        if (isGoal || isStart) return;
        b.walls.delete(i);
        b.mud.delete(i);
        // At the limit, the newest start moves instead of adding a fifth.
        b.starts = b.starts.length >= MAX_STARTS ? [...b.starts.slice(0, -1), i] : [...b.starts, i];
        setStartCount(b.starts.length);
        drawAll();
        return;
      case "goal": {
        if (isStart) return;
        const prev = b.goal;
        b.walls.delete(i);
        b.mud.delete(i);
        b.goal = i;
        drawCell(prev);
        break;
      }
      default:
        return;
    }
    drawCell(i);
  };

  /** Move a start or the goal to square i (dragging a marker). */
  const moveMarker = (marker, i) => {
    const b = board.current;
    if (b.goal === i || b.starts.includes(i)) return;
    b.walls.delete(i);
    b.mud.delete(i);
    if (marker.kind === "goal") {
      const prev = b.goal;
      b.goal = i;
      drawCell(prev);
    } else {
      const prev = b.starts[marker.index];
      b.starts = b.starts.map((s, k) => (k === marker.index ? i : s));
      drawCell(prev);
    }
    drawCell(i);
  };

  const cellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const i = el?.closest?.("[data-i]")?.dataset.i;
    return i === undefined ? null : Number(i);
  };

  const onPointerDown = (e) => {
    const i = cellFromPoint(e.clientX, e.clientY);
    if (i === null) return;
    e.preventDefault();
    edited();
    try {
      gridRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Capture is best-effort.
    }
    const b = board.current;
    const t = e.button === 2 ? "erase" : tool;
    // Grabbing a marker drags it, whatever the tool (except the eraser).
    if (t !== "erase" && b.goal === i) {
      gesture.current = { kind: "move", marker: { kind: "goal" } };
      return;
    }
    const s = b.starts.indexOf(i);
    if (t !== "erase" && s >= 0) {
      gesture.current = { kind: "move", marker: { kind: "start", index: s } };
      return;
    }
    gesture.current = { kind: "paint", tool: t, last: i };
    applyTool(i, t);
    // Start and Goal place once per press rather than painting.
    if (t === "start" || t === "goal") gesture.current = null;
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const i = cellFromPoint(e.clientX, e.clientY);
    if (i === null) return;
    if (g.kind === "move") moveMarker(g.marker, i);
    else if (i !== g.last) {
      g.last = i;
      applyTool(i, g.tool);
    }
  };

  const onPointerUp = () => {
    gesture.current = null;
  };

  /* ---------- Running ---------- */

  const begin = () => {
    clearSearchMarks();
    const b = board.current;
    const snapshot = { starts: [...b.starts], goal: b.goal, walls: new Set(b.walls), mud: new Set(b.mud) };
    // Time the pure algorithm once, without animation.
    const t0 = performance.now();
    const silent = search(algoRef.current, snapshot);
    let r = silent.next();
    while (!r.done) r = silent.next();
    const ms = performance.now() - t0;
    gen.current = search(algoRef.current, snapshot);
    setStats({ ...emptyStats, status: "running", ms });
  };

  /** Advance until one square is expanded. Returns false when the search is over. */
  const advance = () => {
    const g = gen.current;
    if (!g) return false;
    for (;;) {
      const r = g.next();
      if (r.done) {
        finish(r.value);
        return false;
      }
      const ev = r.value;
      const el = cells.current[ev.i];
      if (!el) continue;
      el.style.setProperty("--owner", START_COLORS[ev.owner] ?? START_COLORS[0]);
      if (ev.type === "frontier") {
        el.classList.add("is-frontier");
        continue;
      }
      el.classList.remove("is-frontier");
      el.classList.add("is-visited");
      explored.current += 1;
      return true;
    }
  };

  const finish = (result) => {
    gen.current = null;
    setRunning(false);
    if (!result) {
      setStats((s) => ({ ...s, explored: explored.current, status: "nopath" }));
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    const { path, cost, owner } = result;
    path.forEach((i, k) => {
      const el = cells.current[i];
      if (!el) return;
      el.style.setProperty("--d", `${k * 18}ms`);
      el.style.setProperty("--owner", START_COLORS[owner]);
      el.classList.add("is-path");
    });
    setStats((s) => ({
      ...s,
      explored: explored.current,
      length: path.length - 1,
      cost,
      winner: owner,
      status: "found",
    }));
  };

  const tick = () => {
    const [delay, perTick] = SPEEDS[speedRef.current - 1];
    for (let k = 0; k < perTick; k++) {
      if (!advance()) return;
    }
    setStats((s) => ({ ...s, explored: explored.current }));
    timer.current = window.setTimeout(tick, delay);
  };

  const run = () => {
    if (running) {
      // Pause.
      window.clearTimeout(timer.current);
      setRunning(false);
      return;
    }
    if (!gen.current) begin();
    setRunning(true);
    tick();
  };

  const step = () => {
    if (running) return;
    if (!gen.current) begin();
    advance();
    setStats((s) => ({ ...s, explored: explored.current }));
  };

  const reset = () => {
    stop();
    clearSearchMarks();
    setStats(emptyStats);
  };

  /* ---------- Board presets ---------- */

  const keepMarkersOpen = (walls) => {
    const b = board.current;
    for (const m of [...b.starts, b.goal]) {
      walls.delete(m);
      // Open one neighbour too, so markers aren't sealed in.
      const open = neighbours(m);
      walls.delete(open[Math.floor(Math.random() * open.length)]);
    }
    return walls;
  };

  const preset = (kind) => {
    reset();
    const b = board.current;
    if (kind === "maze") {
      b.walls = keepMarkersOpen(generateMaze());
      b.mud = new Set();
    } else if (kind === "scatter") {
      b.walls = keepMarkersOpen(scatterWalls());
      b.mud = new Set();
    } else if (kind === "mud") {
      for (let i = 0; i < N; i++) {
        if (!b.walls.has(i) && !b.starts.includes(i) && b.goal !== i && Math.random() < 0.18) b.mud.add(i);
      }
    } else if (kind === "clear-walls") {
      b.walls = new Set();
      b.mud = new Set();
    } else if (kind === "clear-all") {
      board.current = freshBoard();
      setStartCount(1);
    }
    drawAll();
  };

  /* ---------- Render ---------- */

  const statusText = {
    ready: "Ready",
    running: running ? "Searching…" : "Paused",
    found: "Path found",
    nopath: "No path",
  }[stats.status];

  return (
    <div className="sv">
      <div className="sv-toolbar">
        <label className="sv-field">
          <span>Algorithm</span>
          <select
            value={algo}
            onChange={(e) => {
              setAlgo(e.target.value);
              reset();
            }}
          >
            {Object.entries(ALGORITHMS).map(([id, a]) => (
              <option key={id} value={id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <div className="sv-segment" role="radiogroup" aria-label="Drawing tool">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={tool === t.id}
              title={t.hint}
              className={`sv-tool sv-tool--${t.id}`}
              onClick={() => setTool(t.id)}
            >
              <span className="sv-swatch" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
        <label className="sv-field">
          <span>Board</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) preset(e.target.value);
            }}
          >
            <option value="">Choose…</option>
            <option value="maze">Random maze</option>
            <option value="scatter">Scattered walls</option>
            <option value="mud">Sprinkle mud</option>
            <option value="clear-walls">Clear walls &amp; mud</option>
            <option value="clear-all">Reset everything</option>
          </select>
        </label>
      </div>

      <div className="sv-toolbar sv-toolbar--run">
        <button type="button" className="sv-btn sv-btn--primary" onClick={run}>
          {running ? "Pause" : stats.status === "running" ? "Resume" : "Run"}
        </button>
        <button type="button" className="sv-btn" onClick={step} disabled={running}>
          Step
        </button>
        <button type="button" className="sv-btn" onClick={reset}>
          Reset
        </button>
        <label className="sv-speed">
          <span>Speed</span>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label="Animation speed"
          />
        </label>
        <button
          type="button"
          className="sv-help-btn"
          aria-label="How to use"
          aria-expanded={showHelp}
          onClick={() => setShowHelp((v) => !v)}
        >
          ?
        </button>
        {showHelp && (
          <div className="sv-help" role="note">
            <p>
              <b>Paint</b> with the chosen tool by clicking or dragging. <b>Drag</b> a start or the
              goal to move it. <b>Right-click</b> erases.
            </p>
            <p>
              Add up to {MAX_STARTS} <b>starts</b>: they all search at once and the first to reach
              the goal wins.
            </p>
            <p>
              <b>Mud</b> costs 5 to cross. Uniform Cost and A* avoid it when they can; BFS, DFS and
              Greedy don&apos;t care.
            </p>
          </div>
        )}
      </div>

      <div
        ref={gridRef}
        className={`sv-board${shake ? " is-shaking" : ""}`}
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        role="application"
        aria-label="Search grid"
      >
        {Array.from({ length: N }, (_, i) => (
          <div
            key={i}
            data-i={i}
            className="sv-cell"
            ref={(el) => {
              cells.current[i] = el;
            }}
          />
        ))}
      </div>

      <div className="sv-lcd" aria-live="polite">
        <span className={`sv-status sv-status--${stats.status}`}>{statusText}</span>
        <span>
          EXPLORED <b>{stats.explored}</b>
        </span>
        <span>
          LENGTH <b>{stats.length ?? "–"}</b>
        </span>
        <span>
          COST <b>{stats.cost ?? "–"}</b>
        </span>
        <span>
          TIME <b>{stats.ms === null ? "–" : `${stats.ms.toFixed(2)}ms`}</b>
        </span>
        <span className="sv-winner">
          {stats.winner !== null ? (
            <>
              WINNER <i style={{ background: START_COLORS[stats.winner] }}>{stats.winner + 1}</i>
            </>
          ) : (
            <>
              STARTS <b>{startCount}</b>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default SearchVisualizer;
