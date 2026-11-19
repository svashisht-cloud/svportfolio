/**
 * Grid path-finding as step-by-step generators, so the UI can run, step and pause.
 *
 * The board is a flat array of SIZE×SIZE squares, indexed i = row * SIZE + col.
 * Mud squares cost MUD_COST to enter; everything else costs 1. Walls can't be entered.
 * All starts begin in the frontier together (multi-source search); every square
 * remembers which start reached it ("owner"), and the first start to reach the goal wins.
 */

export const SIZE = 25;
export const MUD_COST = 5;

export const ALGORITHMS = {
  BFS: { label: "Breadth-first (BFS)", weighted: false },
  DFS: { label: "Depth-first (DFS)", weighted: false },
  GREEDY: { label: "Greedy best-first", weighted: false },
  UCS: { label: "Uniform cost (Dijkstra)", weighted: true },
  ASTAR: { label: "A*", weighted: true },
};

const rowOf = (i) => Math.floor(i / SIZE);
const colOf = (i) => i % SIZE;

export function neighbours(i) {
  const r = rowOf(i);
  const c = colOf(i);
  const out = [];
  if (r > 0) out.push(i - SIZE);
  if (c < SIZE - 1) out.push(i + 1);
  if (r < SIZE - 1) out.push(i + SIZE);
  if (c > 0) out.push(i - 1);
  return out;
}

const manhattan = (a, b) => Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b));

/** Small binary min-heap keyed by priority, tie-broken by insertion order. */
class MinHeap {
  constructor() {
    this.items = [];
    this.seq = 0;
  }
  get size() {
    return this.items.length;
  }
  push(value, priority) {
    const it = { value, priority, seq: this.seq++ };
    const a = this.items;
    a.push(it);
    let k = a.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (this.less(a[p], a[k])) break;
      [a[p], a[k]] = [a[k], a[p]];
      k = p;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === k) break;
        [a[m], a[k]] = [a[k], a[m]];
        k = m;
      }
    }
    return top.value;
  }
  less(x, y) {
    return x.priority < y.priority || (x.priority === y.priority && x.seq < y.seq);
  }
}

/**
 * Yields { type: "visit", i, owner } when a square is expanded and
 * { type: "frontier", i, owner } when one is discovered.
 * Returns { path, cost, owner } or null when the goal can't be reached.
 *
 * @param {keyof ALGORITHMS} algo
 * @param {{ starts: number[], goal: number, walls: Set<number>, mud: Set<number> }} board
 */
export function* search(algo, board) {
  const { starts, goal, walls, mud } = board;
  const cost = (i) => (mud.has(i) ? MUD_COST : 1);
  const parent = new Map();
  const owner = new Map();
  const best = new Map();
  const closed = new Set();

  // Frontier: queue (BFS), stack (DFS) or priority heap (Greedy / UCS / A*).
  const fifo = algo === "BFS";
  const lifo = algo === "DFS";
  const list = [];
  const heap = new MinHeap();
  const priority = (i, g) =>
    algo === "GREEDY" ? manhattan(i, goal) : algo === "ASTAR" ? g + manhattan(i, goal) : g;
  const push = (i, g) => {
    if (fifo || lifo) list.push(i);
    else heap.push(i, priority(i, g));
  };
  const pop = () => (fifo ? list.shift() : lifo ? list.pop() : heap.pop());
  const empty = () => (fifo || lifo ? list.length === 0 : heap.size === 0);

  starts.forEach((s, k) => {
    best.set(s, 0);
    owner.set(s, k);
    push(s, 0);
  });

  while (!empty()) {
    const cur = pop();
    if (closed.has(cur)) continue;
    closed.add(cur);
    yield { type: "visit", i: cur, owner: owner.get(cur) };

    if (cur === goal) {
      const path = [];
      for (let n = cur; n !== undefined; n = parent.get(n)) path.unshift(n);
      const total = path.slice(1).reduce((sum, i) => sum + cost(i), 0);
      return { path, cost: total, owner: owner.get(cur) };
    }

    const g = best.get(cur);
    for (const n of neighbours(cur)) {
      if (walls.has(n) || closed.has(n)) continue;
      const ng = g + cost(n);
      // Unweighted searches take the first discovery; weighted ones keep the cheapest.
      const better = ALGORITHMS[algo].weighted || algo === "GREEDY" ? ng < (best.get(n) ?? Infinity) : !best.has(n);
      if (!better) continue;
      best.set(n, ng);
      parent.set(n, cur);
      owner.set(n, owner.get(cur));
      push(n, ng);
      yield { type: "frontier", i: n, owner: owner.get(cur) };
    }
  }
  return null;
}

/** Random maze by recursive backtracking: walls everywhere, passages carved on odd squares. */
export function generateMaze() {
  const walls = new Set();
  for (let i = 0; i < SIZE * SIZE; i++) walls.add(i);
  const at = (r, c) => r * SIZE + c;
  const stack = [[1, 1]];
  walls.delete(at(1, 1));
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const options = [
      [r - 2, c],
      [r + 2, c],
      [r, c - 2],
      [r, c + 2],
    ].filter(([nr, nc]) => nr > 0 && nc > 0 && nr < SIZE - 1 && nc < SIZE - 1 && walls.has(at(nr, nc)));
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nr, nc] = options[Math.floor(Math.random() * options.length)];
    walls.delete(at((r + nr) / 2, (c + nc) / 2));
    walls.delete(at(nr, nc));
    stack.push([nr, nc]);
  }
  // Knock out a few extra walls so there's more than one route.
  for (let k = 0; k < SIZE * 2; k++) {
    const i = Math.floor(Math.random() * SIZE * SIZE);
    const r = rowOf(i);
    const c = colOf(i);
    if (r > 0 && c > 0 && r < SIZE - 1 && c < SIZE - 1) walls.delete(i);
  }
  return walls;
}

/** Roughly `density` of squares become walls. */
export function scatterWalls(density = 0.28) {
  const walls = new Set();
  for (let i = 0; i < SIZE * SIZE; i++) if (Math.random() < density) walls.add(i);
  return walls;
}
