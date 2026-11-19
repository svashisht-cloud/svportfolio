"use client";
import { useRef } from "react";

/** Detects a fast horizontal shake while dragging: 4+ direction changes within 600ms. */
export function useShake(onShake: () => void) {
  const state = useRef({ lastX: 0, dir: 0, flips: [] as number[] });
  return {
    reset(x: number) {
      state.current = { lastX: x, dir: 0, flips: [] };
    },
    track(x: number) {
      const s = state.current;
      const dx = x - s.lastX;
      if (Math.abs(dx) < 6) return;
      const dir = Math.sign(dx);
      if (s.dir && dir !== s.dir) {
        const now = performance.now();
        s.flips = [...s.flips.filter((t) => now - t < 600), now];
        if (s.flips.length >= 4) {
          s.flips = [];
          onShake();
        }
      }
      s.dir = dir;
      s.lastX = x;
    },
  };
}
