"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaBackward, FaForward, FaMusic, FaPause, FaPlay, FaRandom, FaRedo, FaVolumeDown, FaVolumeUp } from "react-icons/fa";
import { songs, type Song } from "@/app/songs";

interface MusicState {
  songs: Song[];
  index: number;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: Repeat;
}

/** off: stop after the last song; all: wrap around; one: loop the current song. */
export type Repeat = "off" | "all" | "one";

interface MusicActions {
  play(index?: number): void;
  pause(): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seek(seconds: number): void;
  setVolume(v: number): void;
  toggleShuffle(): void;
  /** off → all → one → off */
  cycleRepeat(): void;
  /** Frequency analyser for the visualizer; null until the first play (or if Web Audio is unavailable). */
  analyser(): AnalyserNode | null;
}

const StateCtx = createContext<MusicState | null>(null);
const ActionsCtx = createContext<MusicActions | null>(null);

/**
 * Owns the single <audio> element at desktop level, so music keeps playing
 * when the Music window is minimized or closed.
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const indexRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<Repeat>("off");
  // Mirrors for the stable action callbacks below.
  const shuffleRef = useRef(false);
  const repeatRef = useRef<Repeat>("off");

  const actions = useMemo<MusicActions & { ended(): void }>(() => {
    const audio = () => audioRef.current;
    const load = (i: number) => {
      const a = audio();
      const song = songs[i];
      if (!a || !song) return;
      if (!a.src.endsWith(song.src)) {
        a.src = song.src;
        setTime(0);
      }
      indexRef.current = i;
      setIndex(i);
    };
    // Route the <audio> element through an AnalyserNode so the visualizer can read
    // real frequency data. Created lazily on the first play (a user gesture), and only
    // once: an element can be wrapped by createMediaElementSource a single time.
    const ensureGraph = (a: HTMLAudioElement) => {
      let ctx = ctxRef.current;
      if (!ctx) {
        try {
          ctx = ctxRef.current = new AudioContext();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.78;
          ctx.createMediaElementSource(a).connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
        } catch {
          return; // No Web Audio: the visualizer falls back to a simulated animation.
        }
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    };
    const play = (i?: number) => {
      if (!songs.length) return;
      const a = audio();
      if (!a) return;
      ensureGraph(a);
      if (i !== undefined || !a.src) load(i ?? 0);
      a.play().catch(() => setPlaying(false));
    };
    /** Next index: random (never the same song) when shuffling, otherwise the following one. */
    const following = () => {
      const n = songs.length;
      if (shuffleRef.current && n > 1) {
        const r = Math.floor(Math.random() * (n - 1));
        return r >= indexRef.current ? r + 1 : r;
      }
      return (indexRef.current + 1) % n;
    };
    return {
      play,
      pause: () => audio()?.pause(),
      toggle: () => {
        const a = audio();
        if (!a) return;
        if (a.paused) play();
        else a.pause();
      },
      next: () => {
        if (!songs.length) return;
        play(following());
      },
      ended: () => {
        const a = audio();
        if (!a || !songs.length) return;
        if (repeatRef.current === "one") {
          a.currentTime = 0;
          play();
          return;
        }
        const last = indexRef.current === songs.length - 1;
        if (repeatRef.current === "off" && !shuffleRef.current && last) {
          // End of the playlist: rewind to the first song, stopped.
          load(0);
          return;
        }
        play(following());
      },
      prev: () => {
        if (!songs.length) return;
        const a = audio();
        // Like iTunes: "back" restarts the song unless you're near the start.
        if (a && a.currentTime > 3) {
          a.currentTime = 0;
          return;
        }
        play((indexRef.current - 1 + songs.length) % songs.length);
      },
      seek: (s) => {
        const a = audio();
        if (a) a.currentTime = s;
      },
      setVolume: (v) => {
        const a = audio();
        if (a) a.volume = v;
        setVolumeState(v);
      },
      toggleShuffle: () => {
        shuffleRef.current = !shuffleRef.current;
        setShuffle(shuffleRef.current);
      },
      cycleRepeat: () => {
        const order: Repeat[] = ["off", "all", "one"];
        repeatRef.current = order[(order.indexOf(repeatRef.current) + 1) % order.length];
        setRepeat(repeatRef.current);
      },
      analyser: () => analyserRef.current,
    };
  }, []);

  const state = useMemo(
    () => ({ songs, index, playing, time, duration, volume, shuffle, repeat }),
    [index, playing, time, duration, volume, shuffle, repeat],
  );

  return (
    <ActionsCtx.Provider value={actions}>
      <StateCtx.Provider value={state}>
        {children}
        <audio
          ref={audioRef}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={() => actions.ended()}
        />
      </StateCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useMusic() {
  const state = useContext(StateCtx);
  const actions = useContext(ActionsCtx);
  if (!state || !actions) throw new Error("useMusic must be used inside MusicProvider");
  return { ...state, ...actions };
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const BARS = 28;
/** Frequency bins to show: the top of a 64-bin spectrum is mostly empty for music. */
const BIN_RANGE = 44;

/**
 * LED-style spectrum analyser. Reads live frequency data from the provider's
 * AnalyserNode (or simulates it when Web Audio is unavailable). The loop runs only
 * while playing, plus a short tail while the bars fall back to zero.
 */
function Visualizer({ playing, analyser }: { playing: boolean; analyser: () => AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levels = useRef(new Float32Array(BARS));
  const peaks = useRef(new Float32Array(BARS));

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !g) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let data: Uint8Array<ArrayBuffer> | null = null;
    const t0 = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    const sample = () => {
      const lv = levels.current;
      const node = analyser();
      if (playing && node) {
        if (!data || data.length !== node.frequencyBinCount) data = new Uint8Array(node.frequencyBinCount);
        node.getByteFrequencyData(data);
        for (let i = 0; i < BARS; i++) {
          const a = Math.floor((i * BIN_RANGE) / BARS);
          const b = Math.max(a + 1, Math.floor(((i + 1) * BIN_RANGE) / BARS));
          let sum = 0;
          for (let k = a; k < b; k++) sum += data[k];
          lv[i] = sum / (b - a) / 255;
        }
      } else if (playing) {
        const t = (performance.now() - t0) / 1000;
        for (let i = 0; i < BARS; i++) {
          const x = i / BARS;
          lv[i] = Math.max(0, (0.75 - x * 0.45) * (0.55 + 0.45 * Math.sin(t * (3 + i * 0.37) + i * 1.7)));
        }
      } else {
        for (let i = 0; i < BARS; i++) lv[i] *= 0.82;
      }
      const pk = peaks.current;
      let active = playing;
      for (let i = 0; i < BARS; i++) {
        pk[i] = lv[i] >= pk[i] ? lv[i] : Math.max(0, pk[i] - 0.012);
        if (lv[i] > 0.005 || pk[i] > 0.005) active = true;
      }
      return active;
    };

    function draw() {
      if (!canvas || !g) return;
      const W = canvas.width;
      const H = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      g.clearRect(0, 0, W, H);
      const gap = 3 * dpr;
      const bw = (W - gap * (BARS - 1)) / BARS;
      const seg = 3 * dpr;
      const segGap = 1.5 * dpr;
      const grad = g.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, "#5ccfe6");
      grad.addColorStop(0.45, "#a855f7");
      grad.addColorStop(1, "#ff7ab2");
      for (let i = 0; i < BARS; i++) {
        const x = i * (bw + gap);
        // Unlit LED column, so the panel never looks empty.
        g.fillStyle = "rgba(255,255,255,0.05)";
        for (let y = H - seg; y >= 0; y -= seg + segGap) g.fillRect(x, y, bw, seg);
        const h = levels.current[i] * H;
        g.fillStyle = grad;
        for (let y = H - seg; y >= H - h; y -= seg + segGap) g.fillRect(x, y, bw, seg);
        const p = peaks.current[i] * H;
        if (p > seg) {
          g.fillStyle = "rgba(255,255,255,0.9)";
          g.fillRect(x, H - p - seg, bw, 2 * dpr);
        }
      }
    }

    const loop = () => {
      const active = sample();
      draw();
      raf = active ? requestAnimationFrame(loop) : 0;
    };
    if (reduced) {
      levels.current.fill(0);
      peaks.current.fill(0);
      draw();
    } else {
      loop();
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [playing, analyser]);

  return <canvas ref={canvasRef} className="os-visualizer" aria-hidden />;
}

/** Tiny animated equalizer shown next to the current song in the playlist. */
function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className={`os-eq${playing ? " is-playing" : ""}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

/** The Music window: brushed-metal toolbar, LCD display, turntable stage and playlist. */
export function MusicApp() {
  const m = useMusic();
  const song = m.songs[m.index];
  const { toggle, next, prev } = m;

  useEffect(() => {
    // Space / ←/→ only while the Music window has focus (Snake and Photos use arrows too).
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (!el?.closest("[data-win-id='music']")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") {
        // A focused button already activates on Space; don't toggle twice.
        if (el.tagName === "BUTTON") return;
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        // Sliders use arrows themselves.
        if (el instanceof HTMLInputElement) return;
        e.preventDefault();
        if (e.key === "ArrowRight") next();
        else prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, next, prev]);
  return (
    <div className="os-music">
      <div className="os-music-bar">
        <div className="os-music-transport">
          <button type="button" className="os-round-btn" aria-label="Previous" onClick={m.prev} disabled={!m.songs.length}>
            <FaBackward aria-hidden />
          </button>
          <button
            type="button"
            className={`os-round-btn os-round-btn--big${m.playing ? " is-playing" : ""}`}
            aria-label={m.playing ? "Pause" : "Play"}
            onClick={m.toggle}
            disabled={!m.songs.length}
          >
            {m.playing ? <FaPause aria-hidden /> : <FaPlay aria-hidden />}
          </button>
          <button type="button" className="os-round-btn" aria-label="Next" onClick={m.next} disabled={!m.songs.length}>
            <FaForward aria-hidden />
          </button>
        </div>
        <div className="os-lcd" aria-live="polite">
          {song ? (
            <>
              <p className="os-lcd-title">{song.title}</p>
              <p className="os-lcd-artist">{song.artist}</p>
              <div className="os-lcd-scrub">
                <span>{fmt(m.time)}</span>
                <input
                  type="range"
                  min={0}
                  max={m.duration || 0}
                  step={0.5}
                  value={Math.min(m.time, m.duration || 0)}
                  onChange={(e) => m.seek(Number(e.target.value))}
                  aria-label="Seek"
                />
                <span>-{fmt(m.duration - m.time)}</span>
              </div>
            </>
          ) : (
            <p className="os-lcd-title os-lcd-idle">
              <FaMusic aria-hidden /> No songs yet
            </p>
          )}
        </div>
        <div className="os-music-modes">
          <button
            type="button"
            className={`os-mode-btn${m.shuffle ? " is-on" : ""}`}
            aria-label="Shuffle"
            aria-pressed={m.shuffle}
            title={m.shuffle ? "Shuffle: on" : "Shuffle: off"}
            onClick={m.toggleShuffle}
          >
            <FaRandom aria-hidden />
          </button>
          <button
            type="button"
            className={`os-mode-btn${m.repeat !== "off" ? " is-on" : ""}`}
            aria-label={`Repeat: ${m.repeat}`}
            title={`Repeat: ${m.repeat}`}
            onClick={m.cycleRepeat}
          >
            <FaRedo aria-hidden />
            {m.repeat === "one" && <span className="os-mode-badge">1</span>}
          </button>
        </div>
        <label className="os-music-volume">
          <FaVolumeDown aria-hidden />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={m.volume}
            onChange={(e) => m.setVolume(Number(e.target.value))}
            aria-label="Volume"
          />
          <FaVolumeUp aria-hidden />
        </label>
      </div>
      {song && (
        <div
          className={`os-music-stage${m.playing ? " is-playing" : ""}`}
          style={{ "--label-hue": `${(m.index * 137 + 300) % 360}` } as React.CSSProperties}
        >
          <div className="os-turntable">
            <div className="os-vinyl">
              <div
                className={`os-vinyl-label${song.cover ? " has-cover" : ""}`}
                style={song.cover ? { backgroundImage: `url(${song.cover})` } : undefined}
              >
                {!song.cover && <span>{song.title}</span>}
              </div>
            </div>
            <div className="os-tonearm" aria-hidden />
          </div>
          <Visualizer playing={m.playing} analyser={m.analyser} />
        </div>
      )}
      {m.songs.length ? (
        <table className="os-playlist">
          <thead>
            <tr>
              <th aria-label="Now playing" />
              <th>Song</th>
              <th>Artist</th>
            </tr>
          </thead>
          <tbody>
            {m.songs.map((s, i) => (
              <tr
                key={s.src}
                className={i === m.index ? "is-current" : undefined}
                onDoubleClick={() => m.play(i)}
              >
                <td>{i === m.index && (m.playing || m.time > 0) ? <EqBars playing={m.playing} /> : null}</td>
                <td>
                  <button type="button" className="os-playlist-song" onClick={() => m.play(i)}>
                    {s.title}
                  </button>
                </td>
                <td>{s.artist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="os-playlist-empty">
          <p>Your library is empty.</p>
          <p className="os-meta">Songs will show up here once they&apos;re added.</p>
        </div>
      )}
    </div>
  );
}

/** Small now-playing control for the menu bar. Hidden until something has played. */
export function NowPlaying() {
  const m = useMusic();
  const song = m.songs[m.index];
  if (!song || (!m.playing && m.time === 0)) return null;
  return (
    <div className="os-nowplaying">
      <button type="button" aria-label={m.playing ? "Pause music" : "Play music"} onClick={m.toggle}>
        {m.playing ? <FaPause aria-hidden /> : <FaPlay aria-hidden />}
      </button>
      <span className="os-nowplaying-title">♫ {song.title}</span>
    </div>
  );
}
