"use client";
import { useEffect, useState } from "react";
import { useWM, useWMState } from "./WindowManager";

/**
 * Activity Monitor, with real numbers only: open windows as processes, this tab's frame rate
 * and long tasks, and what the page downloaded (Resource Timing). Samples only while open.
 */

type Tab = "processes" | "cpu" | "network";

/** A stable, process-like id for a window. */
function pid(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 100 + (h % 9000);
}

const kb = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const since = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

function Processes() {
  const wm = useWM();
  const { wins, focused } = useWMState();
  const [now, setNow] = useState(() => Date.now());
  const [nodes, setNodes] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const sample = () => {
      setNow(Date.now());
      const next: Record<string, number> = {};
      document.querySelectorAll<HTMLElement>("[data-win-id]").forEach((el) => {
        next[el.dataset.winId!] = el.querySelectorAll("*").length;
      });
      setNodes(next);
    };
    const first = window.setTimeout(sample, 0);
    const t = window.setInterval(sample, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, []);

  const rows = wins.filter((w) => w.phase !== "closing");
  const total = Object.values(nodes).reduce((a, b) => a + b, 0);
  const pick = rows.find((w) => w.id === selected);

  return (
    <>
      <div className="os-activity-scroll">
        <table className="os-playlist os-activity-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Process</th>
              <th>DOM nodes</th>
              <th>Running</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id} className={w.id === selected ? "is-current" : undefined}>
                <td>{pid(w.id)}</td>
                <td>
                  <button
                    type="button"
                    className="os-playlist-song"
                    onClick={() => setSelected(w.id)}
                    aria-pressed={w.id === selected}
                  >
                    {w.title}
                  </button>
                </td>
                <td>{nodes[w.id]?.toLocaleString() ?? "…"}</td>
                <td>{w.openedAt ? since(now - w.openedAt) : "—"}</td>
                <td>{w.minimized ? "Minimized" : focused?.id === w.id ? "Active" : "Running"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="os-activity-foot">
        <span>
          {rows.length} processes · {total.toLocaleString()} DOM nodes in windows ·{" "}
          {document.querySelectorAll("*").length.toLocaleString()} on the page
        </span>
        <button
          type="button"
          className="aqua-btn"
          disabled={!pick}
          onClick={() => {
            if (!pick) return;
            wm.close(pick.id);
            setSelected(null);
          }}
        >
          Quit Process
        </button>
      </div>
    </>
  );
}

function Cpu() {
  const [samples, setSamples] = useState<number[]>([]);
  const [longTasks, setLongTasks] = useState<{ count: number; ms: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let start = performance.now();
    const tick = (t: number) => {
      frames++;
      if (t - start >= 500) {
        const fps = Math.round((frames * 1000) / (t - start));
        setSamples((s) => [...s.slice(-59), fps]);
        frames = 0;
        start = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let observer: PerformanceObserver | null = null;
    if (PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        setLongTasks((prev) => ({
          count: (prev?.count ?? 0) + entries.length,
          ms: (prev?.ms ?? 0) + entries.reduce((a, e) => a + e.duration, 0),
        }));
      });
      observer.observe({ type: "longtask" });
    }
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  const last = samples[samples.length - 1];
  // Scale to the display: 60 Hz screens top out at 60, 120 Hz ones at 120.
  const max = Math.max(70, ...samples) + 10;
  const points = samples
    .map((v, i) => `${(i / 59) * 600},${120 - (Math.min(v, max) / max) * 116}`)
    .join(" ");
  const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;

  return (
    <div className="os-activity-cpu">
      <svg viewBox="0 0 600 120" className="os-activity-graph" role="img" aria-label={`Frame rate: ${last ?? "measuring"} frames per second`}>
        {(max > 130 ? [120, 60] : [60, 30]).map((v) => (
          <g key={v}>
            <line x1={0} x2={600} y1={120 - (v / max) * 116} y2={120 - (v / max) * 116} className="os-activity-grid" />
            <text x={4} y={120 - (v / max) * 116 - 3} className="os-activity-gridlabel">
              {v} fps
            </text>
          </g>
        ))}
        {samples.length > 1 && <polyline points={points} className="os-activity-line" />}
      </svg>
      <dl className="os-activity-stats">
        <div>
          <dt>Frame rate</dt>
          <dd>{last === undefined ? "measuring…" : `${last} fps`}</dd>
        </div>
        <div>
          <dt>Long tasks</dt>
          <dd>
            {longTasks === null
              ? "not measured by this browser"
              : `${longTasks.count} since opened (${Math.round(longTasks.ms)} ms blocked)`}
          </dd>
        </div>
        <div>
          <dt>JS heap</dt>
          <dd>{heap ? kb(heap) : "not shared by this browser"}</dd>
        </div>
        <div>
          <dt>Cores</dt>
          <dd>{navigator.hardwareConcurrency || "unknown"}</dd>
        </div>
      </dl>
    </div>
  );
}

const TYPES: [string, RegExp][] = [
  ["Scripts", /\.(m?js)(\?|$)/],
  ["Styles", /\.css(\?|$)/],
  ["Images", /\.(png|jpe?g|webp|avif|gif|svg|ico)(\?|$)|\/_next\/image/],
  ["Fonts", /\.(woff2?|ttf|otf)(\?|$)/],
  ["Media", /\.(mp3|mp4|webm|m4a)(\?|$)/],
];

function Network() {
  const [stamp, setStamp] = useState(0);
  const [data, setData] = useState<{ rows: [string, number, number][]; top: { name: string; size: number }[]; total: number } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      // Body size, so files served from cache still count.
      const size = (e: PerformanceResourceTiming) => e.encodedBodySize || e.transferSize || 0;
      const groups = new Map<string, [number, number]>();
      for (const e of entries) {
        const type = TYPES.find(([, re]) => re.test(e.name))?.[0] ?? "Other";
        const [n, b] = groups.get(type) ?? [0, 0];
        groups.set(type, [n + 1, b + size(e)]);
      }
      if (nav) groups.set("Document", [1, nav.encodedBodySize || nav.transferSize || 0]);
      const rows = [...groups.entries()].map(([t2, [n, b]]) => [t2, n, b] as [string, number, number]).sort((a, b) => b[2] - a[2]);
      const top = entries
        .map((e) => ({ name: decodeURIComponent(new URL(e.name).pathname.split("/").pop() || e.name), size: size(e) }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);
      setData({ rows, top, total: rows.reduce((a, r) => a + r[2], 0) });
    }, 0);
    return () => window.clearTimeout(t);
  }, [stamp]);

  if (!data) return <p className="os-activity-note">Reading…</p>;
  return (
    <div className="os-activity-scroll os-activity-net">
      <p className="os-activity-note">
        This page has loaded <strong>{kb(data.total)}</strong> of files so far (compressed size, including ones from the cache).
      </p>
      <table className="os-playlist os-activity-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Files</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map(([t, n, b]) => (
            <tr key={t}>
              <td>{t}</td>
              <td>{n}</td>
              <td>{kb(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="os-activity-h">Heaviest files</h3>
      <ol className="os-activity-top">
        {data.top.map((f) => (
          <li key={f.name}>
            <span>{f.name}</span> <span>{kb(f.size)}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="aqua-btn" onClick={() => setStamp((s) => s + 1)}>
        Refresh
      </button>
    </div>
  );
}

export default function ActivityApp() {
  const [tab, setTab] = useState<Tab>("processes");
  return (
    <div className="os-activity">
      <div className="os-toolbar os-activity-tabs" role="tablist" aria-label="Activity Monitor">
        {(
          [
            ["processes", "Processes"],
            ["cpu", "CPU"],
            ["network", "Network"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`os-seg${tab === id ? " is-on" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="os-activity-body" role="tabpanel">
        {tab === "processes" ? <Processes /> : tab === "cpu" ? <Cpu /> : <Network />}
      </div>
    </div>
  );
}
