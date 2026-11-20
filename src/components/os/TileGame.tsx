"use client";
import { useEffect, useState } from "react";
import { unlock } from "./achievements";
import { emit } from "./eggs/bus";
import { log } from "./syslog";

/** Sliding 15-puzzle with numbered tiles: put 1–15 in order (a desktop widget). */
const SIZE = 4;
const BLANK = SIZE * SIZE - 1;
const SOLVED = Array.from({ length: SIZE * SIZE }, (_, i) => i);

const neighbours = (p: number) =>
  [p - SIZE, p + SIZE, p % SIZE ? p - 1 : -1, (p + 1) % SIZE ? p + 1 : -1].filter(
    (q) => q >= 0 && q < SIZE * SIZE,
  );

/** Shuffle with random legal moves, so the board is always solvable. */
function shuffle(): number[] {
  const board = [...SOLVED];
  let blank = BLANK;
  let prev = -1;
  for (let i = 0; i < 160; i++) {
    const options = neighbours(blank).filter((q) => q !== prev);
    const q = options[Math.floor(Math.random() * options.length)];
    [board[blank], board[q]] = [board[q], board[blank]];
    prev = blank;
    blank = q;
  }
  return board.every((t, i) => t === i) ? shuffle() : board;
}

export default function TileGame() {
  const [board, setBoard] = useState<number[]>(SOLVED);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  /** While the button is held, the board shows the solved layout (tile by tile); it doesn't count as solving. */
  const [peek, setPeek] = useState(false);

  // Start shuffled (after mount, so the server and first render agree).
  useEffect(() => {
    const t = window.setTimeout(() => setBoard(shuffle()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const slide = (pos: number) => {
    if (won || peek) return;
    const blank = board.indexOf(BLANK);
    if (!neighbours(blank).includes(pos)) return;
    const next = [...board];
    [next[blank], next[pos]] = [next[pos], next[blank]];
    setBoard(next);
    setMoves((m) => m + 1);
    if (next.every((t, i) => t === i)) {
      setWon(true);
      log("TileGame", `solved in ${moves + 1} moves`);
      unlock("tiles");
      emit("confetti");
    }
  };

  const restart = () => {
    setBoard(shuffle());
    setMoves(0);
    setWon(false);
    setPeek(false);
  };

  return (
    <div className="os-tiles">
      <div className="os-tiles-head">
        <p className="os-w-label">{won ? "Solved!" : "Tile Game"}</p>
        <span className="os-w-dim">{moves} moves</span>
      </div>
      <div className={`os-tiles-grid${won ? " is-won" : ""}`} role="grid" aria-label="Sliding tile puzzle">
        {(peek ? SOLVED : board).map((tile, pos) =>
          tile === BLANK && !won ? (
            <span key={pos} className="os-tile is-blank" aria-hidden />
          ) : (
            <button
              key={pos}
              type="button"
              className={`os-tile${tile === pos ? " is-home" : ""}`}
              aria-label={`Tile ${tile + 1}`}
              onClick={() => slide(pos)}
            >
              {tile + 1}
            </button>
          ),
        )}
      </div>
      <div className="os-tiles-actions">
        {!won && (
          <button
            type="button"
            className={`os-tiles-shuffle${peek ? " is-held" : ""}`}
            aria-pressed={peek}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setPeek(true);
            }}
            onPointerUp={() => setPeek(false)}
            onPointerCancel={() => setPeek(false)}
            onLostPointerCapture={() => setPeek(false)}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                setPeek(true);
              }
            }}
            onKeyUp={() => setPeek(false)}
            onBlur={() => setPeek(false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            Hold to see solution
          </button>
        )}
        <button type="button" className="os-tiles-shuffle" onClick={restart}>
          Shuffle
        </button>
      </div>
    </div>
  );
}
