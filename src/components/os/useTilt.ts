"use client";

/**
 * Pointer-follow tilt + shine for icons and screenshots (mouse/pen only).
 * Sets --rx/--ry (rotation) and --mx/--my (highlight position) on the element.
 */
export function tiltHandlers() {
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(px - 0.5) * 14}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * 14}deg`);
      el.style.setProperty("--sx", `${px * 100}%`);
      el.style.setProperty("--sy", `${py * 100}%`);
      el.dataset.tilting = "true";
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
      delete el.dataset.tilting;
    },
  };
}
