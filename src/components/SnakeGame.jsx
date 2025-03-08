"use client";
import React, { useEffect, useRef, useState } from "react";
import "./SnakeGame.css"; // Ensure you have appropriate styles

const SnakeGame = () => {
  const boardRef = useRef(null);
  const scoreBoardRef = useRef(null);

  // Game state stored in refs so that updates don't trigger re-renders.
  const speedRef = useRef(5);
  const scoreRef = useRef(0);
  const lastPaintTimeRef = useRef(0);
  const snakeArrRef = useRef([{ x: 9, y: 5 }]);
  const foodRef = useRef({ x: 17, y: 8 });
  const inputDirRef = useRef({ x: 0, y: 0 });

  // Refs to track touch positions for swipe detection.
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const [gameOver, setGameOver] = useState(false);

  function main(ctime) {
    window.requestAnimationFrame(main);
    if ((ctime - lastPaintTimeRef.current) / 1000 < 1 / speedRef.current) return;
    lastPaintTimeRef.current = ctime;
    if (!gameOver) {
      gameEngine();
    }
  }

  function isCollide(sarr) {
    // If snake hits wall
    if (sarr[0].x <= 0 || sarr[0].x >= 18 || sarr[0].y <= 0 || sarr[0].y >= 18) {
      return true;
    }
    // If snake collides with itself
    for (let i = 1; i < sarr.length; i++) {
      if (sarr[0].x === sarr[i].x && sarr[0].y === sarr[i].y) return true;
    }
    return false;
  }

  function gameEngine() {
    if (scoreBoardRef.current) {
      scoreBoardRef.current.innerHTML = `Score: ${scoreRef.current}`;
    }
    // Check for collision
    if (isCollide(snakeArrRef.current)) {
      setGameOver(true);
      return;
    }

    // If snake eats food
    if (
      snakeArrRef.current[0].x === foodRef.current.x &&
      snakeArrRef.current[0].y === foodRef.current.y
    ) {
      scoreRef.current += 1;
      speedRef.current = speedRef.current + scoreRef.current * 0.25;
      snakeArrRef.current.unshift({
        x: snakeArrRef.current[0].x + inputDirRef.current.x,
        y: snakeArrRef.current[0].y + inputDirRef.current.y,
      });
      let a = 2,
        b = 16;
      foodRef.current = {
        x: Math.round(a + (b - a) * Math.random()),
        y: Math.round(a + (b - a) * Math.random()),
      };
    }

    // Move snake body
    for (let i = snakeArrRef.current.length - 2; i >= 0; i--) {
      snakeArrRef.current[i + 1] = { ...snakeArrRef.current[i] };
    }
    snakeArrRef.current[0].x += inputDirRef.current.x;
    snakeArrRef.current[0].y += inputDirRef.current.y;

    // Render snake and food
    if (boardRef.current) {
      boardRef.current.innerHTML = "";
      snakeArrRef.current.forEach((e, index) => {
        const snakeElement = document.createElement("div");
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        snakeElement.classList.add(index === 0 ? "head" : "snake");
        boardRef.current.appendChild(snakeElement);
      });
      const foodElement = document.createElement("div");
      foodElement.style.gridRowStart = foodRef.current.y;
      foodElement.style.gridColumnStart = foodRef.current.x;
      foodElement.classList.add("food");
      boardRef.current.appendChild(foodElement);
    }
  }

  // Handle keyboard input
  function handleKeydown(e) {
    // Set default direction if no key is pressed (e.g., going down)
    inputDirRef.current = { x: 0, y: 1 };
    switch (e.key) {
      case "ArrowUp":
        inputDirRef.current.x = 0;
        inputDirRef.current.y = -1;
        break;
      case "ArrowDown":
        inputDirRef.current.x = 0;
        inputDirRef.current.y = 1;
        break;
      case "ArrowLeft":
        inputDirRef.current.x = -1;
        inputDirRef.current.y = 0;
        break;
      case "ArrowRight":
        inputDirRef.current.x = 1;
        inputDirRef.current.y = 0;
        break;
      default:
        break;
    }
  }

  // Handle touch events for swipe detection
  function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        inputDirRef.current = { x: 1, y: 0 };
      } else {
        inputDirRef.current = { x: -1, y: 0 };
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        inputDirRef.current = { x: 0, y: 1 };
      } else {
        inputDirRef.current = { x: 0, y: -1 };
      }
    }
  }

  const restartGame = () => {
    snakeArrRef.current = [{ x: 9, y: 5 }];
    foodRef.current = { x: 17, y: 8 };
    inputDirRef.current = { x: 0, y: 0 };
    scoreRef.current = 0;
    speedRef.current = 5;
    setGameOver(false);
  };

  useEffect(() => {
    window.requestAnimationFrame(main);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gameOver]);

  return (
    <div className="snake-game-container overflow-hidden relative">
      <div id="board" ref={boardRef} className="board"></div>
      <div id="Score" ref={scoreBoardRef} className="scoreboard"></div>
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <h1 className="text-white text-4xl mb-4">Game Over!</h1>
          <button
            onClick={restartGame}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
          >
            Restart Game
          </button>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
