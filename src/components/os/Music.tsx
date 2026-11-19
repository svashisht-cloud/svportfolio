"use client";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { FaBackward, FaForward, FaMusic, FaPause, FaPlay, FaVolumeDown, FaVolumeUp } from "react-icons/fa";
import { songs, type Song } from "@/app/songs";

interface MusicState {
  songs: Song[];
  index: number;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
}

interface MusicActions {
  play(index?: number): void;
  pause(): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seek(seconds: number): void;
  setVolume(v: number): void;
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
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  const actions = useMemo<MusicActions>(() => {
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
    const play = (i?: number) => {
      if (!songs.length) return;
      const a = audio();
      if (!a) return;
      if (i !== undefined || !a.src) load(i ?? 0);
      a.play().catch(() => setPlaying(false));
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
        play((indexRef.current + 1) % songs.length);
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
    };
  }, []);

  const state = useMemo(
    () => ({ songs, index, playing, time, duration, volume }),
    [index, playing, time, duration, volume],
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
          onEnded={() => actions.next()}
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

/** The Music window: brushed-metal toolbar, LCD display and playlist. */
export function MusicApp() {
  const m = useMusic();
  const song = m.songs[m.index];
  return (
    <div className="os-music">
      <div className="os-music-bar">
        <div className="os-music-transport">
          <button type="button" className="os-round-btn" aria-label="Previous" onClick={m.prev} disabled={!m.songs.length}>
            <FaBackward aria-hidden />
          </button>
          <button
            type="button"
            className="os-round-btn os-round-btn--big"
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
                <td>{i === m.index && m.playing ? "♫" : ""}</td>
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
