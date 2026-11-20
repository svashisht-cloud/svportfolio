"use client";
import { useEffect, useState } from "react";
import { unlock } from "./achievements";
import { emit } from "./eggs/bus";
import { log } from "./syslog";

/** Sliding 15-puzzle made from my avatar (a desktop widget). */
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

  // Start shuffled (after mount, so the server and first render agree).
  useEffect(() => {
    const t = window.setTimeout(() => setBoard(shuffle()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const slide = (pos: number) => {
    if (won) return;
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
  };

  return (
    <div className="os-tiles">
      <div className="os-tiles-head">
        <p className="os-w-label">{won ? "Solved!" : "Tile Game"}</p>
        <span className="os-w-dim">{moves} moves</span>
      </div>
      <div className={`os-tiles-grid${won ? " is-won" : ""}`} role="grid" aria-label="Sliding tile puzzle">
        {board.map((tile, pos) =>
          tile === BLANK && !won ? (
            <span key={pos} className="os-tile is-blank" aria-hidden />
          ) : (
            <button
              key={pos}
              type="button"
              className="os-tile"
              aria-label={`Tile ${tile + 1}`}
              onClick={() => slide(pos)}
              style={{
                backgroundPosition: `${((tile % SIZE) * 100) / (SIZE - 1)}% ${(Math.floor(tile / SIZE) * 100) / (SIZE - 1)}%`,
              }}
            />
          ),
        )}
      </div>
      <button type="button" className="os-tiles-shuffle" onClick={restart}>
        Shuffle
      </button>
    </div>
  );
}
