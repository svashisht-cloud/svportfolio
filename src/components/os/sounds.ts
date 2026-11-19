"use client";
import { getPrefs } from "./prefs";

/**
 * Original UI sounds, synthesised with the Web Audio API (no audio files).
 * Silent unless the visitor turns sounds on (prefs.sound, off by default).
 */
export type SoundName = "click" | "open" | "close" | "minimize" | "trash" | "startup" | "pop" | "alert";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  ac: AudioContext,
  { freq, to, start = 0, dur = 0.12, type = "sine", gain = 0.12 }: {
    freq: number;
    to?: number;
    start?: number;
    dur?: number;
    type?: OscillatorType;
    gain?: number;
  },
) {
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(ac: AudioContext, { start = 0, dur = 0.2, from = 3000, to = 400, gain = 0.15 }) {
  const t = ac.currentTime + start;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t);
}

export function play(name: SoundName) {
  if (!getPrefs().sound) return;
  const ac = audio();
  if (!ac) return;
  switch (name) {
    case "click":
      tone(ac, { freq: 1800, dur: 0.03, type: "square", gain: 0.04 });
      break;
    case "open":
      tone(ac, { freq: 520, to: 880, dur: 0.14, gain: 0.08 });
      break;
    case "close":
      tone(ac, { freq: 700, to: 380, dur: 0.12, gain: 0.07 });
      break;
    case "minimize":
      noise(ac, { dur: 0.35, from: 4000, to: 300, gain: 0.08 });
      break;
    case "trash":
      for (let i = 0; i < 5; i++) noise(ac, { start: i * 0.05, dur: 0.07, from: 2500, to: 900, gain: 0.12 });
      break;
    case "startup":
      // A warm major chord that swells and fades.
      [261.6, 329.6, 392, 523.3].forEach((f, i) =>
        tone(ac, { freq: f, start: i * 0.015, dur: 1.6, type: "triangle", gain: 0.06 }),
      );
      break;
    case "pop":
      tone(ac, { freq: 300, to: 1200, dur: 0.08, gain: 0.1 });
      tone(ac, { freq: 900, to: 1600, start: 0.08, dur: 0.1, gain: 0.07 });
      break;
    case "alert":
      tone(ac, { freq: 880, dur: 0.12, type: "triangle", gain: 0.1 });
      tone(ac, { freq: 660, start: 0.13, dur: 0.18, type: "triangle", gain: 0.1 });
      break;
  }
}
