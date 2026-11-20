"use client";
import { useEffect, useRef, useState } from "react";
import {
  FaBackward,
  FaCog,
  FaFilePdf,
  FaForward,
  FaLink,
  FaMoon,
  FaMusic,
  FaPause,
  FaPlay,
  FaSlidersH,
  FaSun,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { useMusic } from "./Music";
import { setPrefs, useEffectiveTheme, usePrefs } from "./prefs";
import { play } from "./sounds";
import { useCopyLink } from "./useCopyLink";
import { useWM, useWMState } from "./WindowManager";

/**
 * Phones: the top-right button. Opens an iOS-style Control Center sheet with quick toggles
 * (dark mode, sounds), the music player, Copy Link, Résumé and Settings. While a song plays,
 * a small equalizer shows next to the button.
 */
export default function ControlCenter() {
  const wm = useWM();
  const { focused } = useWMState();
  const music = useMusic();
  const prefs = usePrefs();
  const theme = useEffectiveTheme();
  const copyLink = useCopyLink();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const song = music.songs[music.index];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Run an action and close the sheet. */
  const then = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const dark = theme === "dark";

  return (
    <div className="os-cc-wrap" ref={wrap}>
      {music.playing && (
        <button
          type="button"
          className="os-cc-eq"
          aria-label={`Now playing: ${song?.title ?? "music"}`}
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      )}
      <button
        type="button"
        className="os-menubar-icon os-cc-btn"
        aria-label="Control Center"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <FaSlidersH aria-hidden />
      </button>
      {open && (
        <div className="os-cc" role="dialog" aria-label="Control Center">
          <button
            type="button"
            className={`os-cc-tile${dark ? " is-on" : ""}`}
            aria-pressed={dark}
            onClick={() => setPrefs({ theme: dark ? "light" : "dark" })}
          >
            <span className="os-cc-glyph">{dark ? <FaMoon aria-hidden /> : <FaSun aria-hidden />}</span>
            <span>
              Dark Mode
              <small>{dark ? "On" : "Off"}</small>
            </span>
          </button>
          <button
            type="button"
            className={`os-cc-tile${prefs.sound ? " is-on" : ""}`}
            aria-pressed={prefs.sound}
            onClick={() => {
              setPrefs({ sound: !prefs.sound });
              if (!prefs.sound) window.setTimeout(() => play("click"), 0);
            }}
          >
            <span className="os-cc-glyph">
              {prefs.sound ? <FaVolumeUp aria-hidden /> : <FaVolumeMute aria-hidden />}
            </span>
            <span>
              Sounds
              <small>{prefs.sound ? "On" : "Off"}</small>
            </span>
          </button>

          <div className="os-cc-tile os-cc-music">
            <button type="button" className="os-cc-song" onClick={then(() => wm.launch("music"))}>
              <span className="os-cc-glyph">
                <FaMusic aria-hidden />
              </span>
              <span>
                {song?.title ?? "Not playing"}
                <small>{song?.artist ?? "Music"}</small>
              </span>
            </button>
            <div className="os-cc-controls">
              <button type="button" aria-label="Previous song" onClick={music.prev}>
                <FaBackward aria-hidden />
              </button>
              <button
                type="button"
                aria-label={music.playing ? "Pause" : "Play"}
                onClick={music.toggle}
              >
                {music.playing ? <FaPause aria-hidden /> : <FaPlay aria-hidden />}
              </button>
              <button type="button" aria-label="Next song" onClick={music.next}>
                <FaForward aria-hidden />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="os-cc-tile os-cc-small"
            disabled={!focused}
            onClick={then(() => focused && copyLink(focused.kind, focused.payload))}
          >
            <span className="os-cc-glyph">
              <FaLink aria-hidden />
            </span>
            Copy Link
          </button>
          <button
            type="button"
            className="os-cc-tile os-cc-small"
            onClick={then(() => wm.launch("resume"))}
          >
            <span className="os-cc-glyph">
              <FaFilePdf aria-hidden />
            </span>
            Résumé
          </button>
          <button
            type="button"
            className="os-cc-tile os-cc-wide"
            onClick={then(() => wm.launch("prefs"))}
          >
            <span className="os-cc-glyph">
              <FaCog aria-hidden />
            </span>
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
