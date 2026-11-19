"use client";
import { useEffect, useRef } from "react";

const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/{}";

/** Falling green characters over the Terminal for ~6s (or until a key is pressed). */
export default function MatrixRain({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    const host = canvas?.parentElement;
    if (!canvas || !ctx || !host) return;
    const w = (canvas.width = host.clientWidth);
    const h = (canvas.height = host.clientHeight);
    const size = 14;
    const cols = Math.ceil(w / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 45) return;
      last = t;
      ctx.fillStyle = "rgba(13, 17, 23, 0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${size}px monospace`;
      drops.forEach((y, i) => {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = Math.random() > 0.95 ? "#d7ffe4" : "#3fdc6f";
        ctx.fillText(ch, i * size, y * size);
        drops[i] = y * size > h && Math.random() > 0.975 ? 0 : y + 1;
      });
      if (t - start > 6000) onDone();
    };
    raf = requestAnimationFrame(frame);
    // Ignore the Enter press that launched us (it is still being dispatched).
    const stop = () => {
      if (performance.now() - start > 300) onDone();
    };
    window.addEventListener("keydown", stop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", stop);
    };
  }, [onDone]);

  return <canvas ref={ref} className="os-matrix" aria-hidden />;
}
