"use client";
import React, { useEffect, useState, useRef } from "react";
import "./SearchVisualizer.css";

const ROWS = 20;
const COLS = 20;

const createInitialGrid = () =>
  Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => ({
      row,
      col,
      status: "empty", // "empty", "start", "end", "visited", "path"
    }))
  );

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const heuristic = (node, end) =>
  Math.abs(node.row - end.row) + Math.abs(node.col - end.col);

const SearchVisualizer = () => {
  const [grid, setGrid] = useState(createInitialGrid());
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("BFS");
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // A ref to toggle between start and end updates when both are already set.
  const toggleTouchRef = useRef(false);

  // Update a cell's status.
  const updateCellStatus = (row, col, status) => {
    setGrid((prev) =>
      prev.map((r, i) =>
        r.map((cell, j) =>
          i === row && j === col ? { ...cell, status } : cell
        )
      )
    );
  };

  // Handle cell interaction for desktop (click/right-click)
  const handleCellClick = (row, col, e) => {
    e.preventDefault();
    if (e.type === "click" || e.type === "contextmenu") {
      if (e.type === "click") {
        // Left click: set start node
        if (startNode) updateCellStatus(startNode.row, startNode.col, "empty");
        setStartNode({ row, col });
        updateCellStatus(row, col, "start");
      } else if (e.type === "contextmenu") {
        // Right click: set end node
        if (endNode) updateCellStatus(endNode.row, endNode.col, "empty");
        setEndNode({ row, col });
        updateCellStatus(row, col, "end");
      }
    }
  };

  // Handle touch events: first touch sets start; second touch sets target.
  // Afterwards, alternate between updating the start and target.
  const handleCellTouch = (row, col, e) => {
    e.preventDefault();
    if (!startNode) {
      // First node touched is the start node.
      setStartNode({ row, col });
      updateCellStatus(row, col, "start");
    } else if (!endNode) {
      // Second node touched is the target node.
      setEndNode({ row, col });
      updateCellStatus(row, col, "end");
    } else {
      // Alternate updating based on toggle.
      if (toggleTouchRef.current) {
        if (endNode) updateCellStatus(endNode.row, endNode.col, "empty");
        setEndNode({ row, col });
        updateCellStatus(row, col, "end");
        toggleTouchRef.current = false;
      } else {
        if (startNode) updateCellStatus(startNode.row, startNode.col, "empty");
        setStartNode({ row, col });
        updateCellStatus(row, col, "start");
        toggleTouchRef.current = true;
      }
    }
  };

  // Reconstruct the path using parent pointers.
  const reconstructPath = async (parent) => {
    let cur = endNode;
    while (cur && (cur.row !== startNode.row || cur.col !== startNode.col)) {
      if (cur.row !== startNode.row || cur.col !== startNode.col) {
        updateCellStatus(cur.row, cur.col, "path");
        await delay(50);
      }
      cur = parent[cur.row][cur.col];
    }
  };

  // BFS search algorithm.
  const bfs = async () => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const queue = [startNode];
    visited[startNode.row][startNode.col] = true;
    while (queue.length > 0) {
      const current = queue.shift();
      if (
        (current.row !== startNode.row || current.col !== startNode.col) &&
        (current.row !== endNode.row || current.col !== endNode.col)
      ) {
        updateCellStatus(current.row, current.col, "visited");
        await delay(50);
      }
      if (current.row === endNode.row && current.col === endNode.col) {
        await reconstructPath(parent);
        return;
      }
      const directions = [
        { dRow: -1, dCol: 0 },
        { dRow: 1, dCol: 0 },
        { dRow: 0, dCol: -1 },
        { dRow: 0, dCol: 1 },
      ];
      for (let { dRow, dCol } of directions) {
        const newRow = current.row + dRow;
        const newCol = current.col + dCol;
        if (
          newRow >= 0 &&
          newRow < ROWS &&
          newCol >= 0 &&
          newCol < COLS &&
          !visited[newRow][newCol]
        ) {
          visited[newRow][newCol] = true;
          parent[newRow][newCol] = current;
          queue.push({ row: newRow, col: newCol });
        }
      }
    }
  };

  // DFS search algorithm.
  const dfs = async () => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const stack = [startNode];
    while (stack.length > 0) {
      const current = stack.pop();
      if (visited[current.row][current.col]) continue;
      visited[current.row][current.col] = true;
      if (
        (current.row !== startNode.row || current.col !== startNode.col) &&
        (current.row !== endNode.row || current.col !== endNode.col)
      ) {
        updateCellStatus(current.row, current.col, "visited");
        await delay(50);
      }
      if (current.row === endNode.row && current.col === endNode.col) {
        await reconstructPath(parent);
        return;
      }
      const directions = [
        { dRow: -1, dCol: 0 },
        { dRow: 1, dCol: 0 },
        { dRow: 0, dCol: -1 },
        { dRow: 0, dCol: 1 },
      ];
      for (let { dRow, dCol } of directions) {
        const newRow = current.row + dRow;
        const newCol = current.col + dCol;
        if (
          newRow >= 0 &&
          newRow < ROWS &&
          newCol >= 0 &&
          newCol < COLS &&
          !visited[newRow][newCol]
        ) {
          parent[newRow][newCol] = current;
          stack.push({ row: newRow, col: newCol });
        }
      }
    }
  };

  // Greedy DFS: like DFS but sorts neighbors based on Manhattan distance to the end.
  const greedyDfs = async () => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const stack = [startNode];
    while (stack.length > 0) {
      const current = stack.pop();
      if (visited[current.row][current.col]) continue;
      visited[current.row][current.col] = true;
      if (
        (current.row !== startNode.row || current.col !== startNode.col) &&
        (current.row !== endNode.row || current.col !== endNode.col)
      ) {
        updateCellStatus(current.row, current.col, "visited");
        await delay(50);
      }
      if (current.row === endNode.row && current.col === endNode.col) {
        await reconstructPath(parent);
        return;
      }
      const directions = [
        { dRow: -1, dCol: 0 },
        { dRow: 1, dCol: 0 },
        { dRow: 0, dCol: -1 },
        { dRow: 0, dCol: 1 },
      ];
      let neighbors = [];
      for (let { dRow, dCol } of directions) {
        const newRow = current.row + dRow;
        const newCol = current.col + dCol;
        if (
          newRow >= 0 &&
          newRow < ROWS &&
          newCol >= 0 &&
          newCol < COLS &&
          !visited[newRow][newCol]
        ) {
          neighbors.push({ row: newRow, col: newCol });
          parent[newRow][newCol] = current;
        }
      }
      neighbors.sort(
        (a, b) => heuristic(a, endNode) - heuristic(b, endNode)
      );
      for (let neighbor of neighbors) {
        stack.push(neighbor);
      }
    }
  };

  // Uniform Cost Search (like Dijkstra's algorithm)
  const uniformCostSearch = async () => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const queue = [{ node: startNode, cost: 0 }];
    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const { node: current, cost } = queue.shift();
      if (visited[current.row][current.col]) continue;
      visited[current.row][current.col] = true;
      if (
        (current.row !== startNode.row || current.col !== startNode.col) &&
        (current.row !== endNode.row || current.col !== endNode.col)
      ) {
        updateCellStatus(current.row, current.col, "visited");
        await delay(50);
      }
      if (current.row === endNode.row && current.col === endNode.col) {
        await reconstructPath(parent);
        return;
      }
      const directions = [
        { dRow: -1, dCol: 0 },
        { dRow: 1, dCol: 0 },
        { dRow: 0, dCol: -1 },
        { dRow: 0, dCol: 1 },
      ];
      for (let { dRow, dCol } of directions) {
        const newRow = current.row + dRow;
        const newCol = current.col + dCol;
        if (
          newRow >= 0 &&
          newRow < ROWS &&
          newCol >= 0 &&
          newCol < COLS &&
          !visited[newRow][newCol]
        ) {
          parent[newRow][newCol] = current;
          queue.push({ node: { row: newRow, col: newCol }, cost: cost + 1 });
        }
      }
    }
  };

  // A* Search algorithm.
  const aStar = async () => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const parent = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const openList = [
      { node: startNode, g: 0, f: heuristic(startNode, endNode) },
    ];
    while (openList.length > 0) {
      openList.sort((a, b) => a.f - b.f);
      const { node: current, g } = openList.shift();
      if (visited[current.row][current.col]) continue;
      visited[current.row][current.col] = true;
      if (
        (current.row !== startNode.row || current.col !== startNode.col) &&
        (current.row !== endNode.row || current.col !== endNode.col)
      ) {
        updateCellStatus(current.row, current.col, "visited");
        await delay(50);
      }
      if (current.row === endNode.row && current.col === endNode.col) {
        await reconstructPath(parent);
        return;
      }
      const directions = [
        { dRow: -1, dCol: 0 },
        { dRow: 1, dCol: 0 },
        { dRow: 0, dCol: -1 },
        { dRow: 0, dCol: 1 },
      ];
      for (let { dRow, dCol } of directions) {
        const newRow = current.row + dRow;
        const newCol = current.col + dCol;
        if (
          newRow >= 0 &&
          newRow < ROWS &&
          newCol >= 0 &&
          newCol < COLS &&
          !visited[newRow][newCol]
        ) {
          const newG = g + 1;
          const newF = newG + heuristic({ row: newRow, col: newCol }, endNode);
          parent[newRow][newCol] = current;
          openList.push({ node: { row: newRow, col: newCol }, g: newG, f: newF });
        }
      }
    }
  };

  const startSearch = async () => {
    if (!startNode || !endNode) return;
    setIsSearching(true);
    if (selectedAlgorithm === "BFS") {
      await bfs();
    } else if (selectedAlgorithm === "DFS") {
      await dfs();
    } else if (selectedAlgorithm === "Greedy DFS") {
      await greedyDfs();
    } else if (selectedAlgorithm === "Uniform Cost") {
      await uniformCostSearch();
    } else if (selectedAlgorithm === "A*") {
      await aStar();
    }
    setIsSearching(false);
  };

  const resetGrid = () => {
    setGrid(createInitialGrid());
    setStartNode(null);
    setEndNode(null);
  };

  return (
    <div className="search-visualizer p-4">
      <div className="mb-4">
        <label htmlFor="algorithm" className="mr-2 font-semibold">
          Select Algorithm:
        </label>
        <select
          id="algorithm"
          value={selectedAlgorithm}
          onChange={(e) => {
            setSelectedAlgorithm(e.target.value);
            resetGrid();
          }}
        >
          <option value="BFS">BFS</option>
          <option value="DFS">DFS</option>
          <option value="Greedy DFS">Greedy DFS</option>
          <option value="Uniform Cost">Uniform Cost</option>
          <option value="A*">A*</option>
        </select>
        <button
          onClick={() => setShowHelp(true)}
          className="ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Help
        </button>
      </div>
      <div
        className="grid-container"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          width: "70vmin",
          height: "70vmin",
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
              onContextMenu={(e) => handleCellClick(rowIndex, colIndex, e)}
              onTouchEnd={(e) => handleCellTouch(rowIndex, colIndex, e)}
              className={`cell ${cell.status}`}
            ></div>
          ))
        )}
      </div>
      <div className="mt-4">
        <button
          onClick={startSearch}
          disabled={isSearching || !startNode || !endNode}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Start Search
        </button>
        <button
          onClick={resetGrid}
          className="ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset Grid
        </button>
      </div>
      {showHelp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 text-gray-900">
            <h2 className="text-xl font-bold mb-4">Instructions</h2>
            <p className="mb-2">
              <strong>Desktop:</strong> Left-click on a cell to set the start node and right-click to set the target node.
            </p>
            <p className="mb-2">
              <strong>Mobile:</strong> The first touch sets the start node, the second sets the target node. Subsequent touches alternate between updating the start and target.
            </p>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchVisualizer;
