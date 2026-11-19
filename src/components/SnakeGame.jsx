"use client";
import React, { useEffect, useRef, useState } from "react";
import "./SnakeGame.css";

const GRID = 18;
const START = () => ({ snake: [{ x: 9, y: 5 }], food: { x: 17, y: 8 }, dir: { x: 0, y: 0 } });
const BEST_KEY = "sv-snake-best";

const readBest = () => {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeBest = (n) => {
  try {
    window.localStorage.setItem(BEST_KEY, String(n));
  } catch {
    // Storage unavailable: best score lasts for this page only.
  }
};

const DIRS = {
  ArrowUp: { x: 0, y: -1, name: "up" },
  ArrowDown: { x: 0, y: 1, name: "down" },
  ArrowLeft: { x: -1, y: 0, name: "left" },
  ArrowRight: { x: 1, y: 0, name: "right" },
};

const SnakeGame = () => {
  const rootRef = useRef(null);
  const boardRef = useRef(null);
  const scoreRef = useRef(null);

  // Game state lives in refs so the loop doesn't trigger React re-renders.
  const game = useRef(START());
  const speed = useRef(5);
  const score = useRef(0);
  const lastPaint = useRef(0);
  const dirName = useRef("right");
  const touchStart = useRef({ x: 0, y: 0 });

  // "ready" → "playing" → "over"
  const [status, setStatus] = useState("ready");
  const statusRef = useRef("ready");
  const [final, setFinal] = useState({ score: 0, best: 0, newBest: false });
  const [best, setBest] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setBest(readBest()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const setPhase = (s) => {
    statusRef.current = s;
    setStatus(s);
  };

  /** Only react to keys when this game's window is the active one (or outside the desktop). */
  const isActive = () => {
    const win = rootRef.current?.closest("[data-win-id]");
    return !win || win.contains(document.activeElement) || document.activeElement === document.body;
  };

  const steer = (d) => {
    const cur = game.current.dir;
    // No reversing straight into yourself.
    if (game.current.snake.length > 1 && cur.x === -d.x && cur.y === -d.y) return;
    game.current.dir = { x: d.x, y: d.y };
    dirName.current = d.name;
    if (statusRef.current === "ready") setPhase("playing");
  };

  const draw = (popHead = false) => {
    const board = boardRef.current;
    if (!board) return;
    const { snake, food } = game.current;
    board.innerHTML = "";
    const n = snake.length;
    snake.forEach((seg, i) => {
      const el = document.createElement("div");
      el.style.gridRowStart = seg.y;
      el.style.gridColumnStart = seg.x;
      // Colour shifts from bright head to deeper tail.
      const t = n > 1 ? i / (n - 1) : 0;
      el.style.setProperty("--seg-h", String(132 + t * 28));
      el.style.setProperty("--seg-l", `${52 - t * 14}%`);
      if (i === 0) {
        el.className = `head${popHead ? " pop" : ""}`;
        el.dataset.dir = dirName.current;
        el.innerHTML = '<span class="eye"></span><span class="eye"></span>';
      } else {
        el.className = "snake";
      }
      board.appendChild(el);
    });
    const f = document.createElement("div");
    f.style.gridRowStart = food.y;
    f.style.gridColumnStart = food.x;
    f.className = "food";
    board.appendChild(f);
  };

  const collides = (snake) => {
    const h = snake[0];
    if (h.x <= 0 || h.x >= GRID || h.y <= 0 || h.y >= GRID) return true;
    return snake.slice(1).some((s) => s.x === h.x && s.y === h.y);
  };

  const step = () => {
    const g = game.current;
    if (collides(g.snake)) {
      const s = score.current;
      const prevBest = readBest();
      const newBest = s > prevBest;
      if (newBest) writeBest(s);
      setBest(Math.max(s, prevBest));
      setFinal({ score: s, best: Math.max(s, prevBest), newBest });
      setPhase("over");
      return;
    }
    let ate = false;
    if (g.snake[0].x === g.food.x && g.snake[0].y === g.food.y) {
      ate = true;
      score.current += 1;
      speed.current += score.current * 0.25;
      g.snake.unshift({ x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y });
      g.food = {
        x: Math.round(2 + 14 * Math.random()),
        y: Math.round(2 + 14 * Math.random()),
      };
      const sb = scoreRef.current;
      if (sb) {
        sb.classList.remove("flash");
        void sb.offsetWidth; // restart the flash animation
        sb.classList.add("flash");
      }
    }
    for (let i = g.snake.length - 2; i >= 0; i--) g.snake[i + 1] = { ...g.snake[i] };
    g.snake[0].x += g.dir.x;
    g.snake[0].y += g.dir.y;
    if (scoreRef.current) scoreRef.current.querySelector("[data-score]").textContent = String(score.current).padStart(3, "0");
    draw(ate);
  };

  // One animation loop for the component's lifetime.
  useEffect(() => {
    let raf = 0;
    const loop = (t) => {
      raf = window.requestAnimationFrame(loop);
      if ((t - lastPaint.current) / 1000 < 1 / speed.current) return;
      lastPaint.current = t;
      if (statusRef.current === "playing") step();
    };
    draw();
    raf = window.requestAnimationFrame(loop);

    const onKey = (e) => {
      const d = DIRS[e.key];
      if (!d || !isActive()) return;
      if (e.target instanceof HTMLElement && (e.target.closest("input, textarea, select") || e.target.isContentEditable)) return;
      if (statusRef.current === "over") return;
      e.preventDefault();
      steer(d);
    };
    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e) => {
      if (!rootRef.current?.contains(e.target) || statusRef.current === "over") return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
      if (Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft);
      else steer(dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // The loop reads everything through refs, so it only needs to start once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = () => {
    game.current = START();
    score.current = 0;
    speed.current = 5;
    dirName.current = "right";
    const el = scoreRef.current?.querySelector("[data-score]");
    if (el) el.textContent = "000";
    draw();
    setPhase("ready");
    rootRef.current?.focus();
  };

  return (
    <div className="snake-game" ref={rootRef} tabIndex={-1}>
      <div className="snake-lcd" ref={scoreRef} aria-live="polite">
        <span>
          SCORE <b data-score>000</b>
        </span>
        <span>
          BEST <b>{String(best).padStart(3, "0")}</b>
        </span>
      </div>
      <div className="snake-stage">
        <div ref={boardRef} className="board" />
        {status === "ready" && (
          <div className="snake-overlay snake-overlay--hint">
            <p className="snake-title">Snake</p>
            <p>Press an arrow key or swipe to start</p>
          </div>
        )}
        {status === "over" && (
          <div className="snake-overlay">
            <div className="snake-dialog" role="alertdialog" aria-label="Game over">
              <p className="snake-title">Game Over</p>
              <p>
                Score: <b>{final.score}</b>
                {final.newBest ? <span className="snake-newbest"> New best!</span> : <> · Best: {final.best}</>}
              </p>
              <button type="button" className="snake-btn" onClick={restart} autoFocus>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;
