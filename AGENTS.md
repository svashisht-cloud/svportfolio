# Project Overview
Personal portfolio built with Next.js 15 App Router + React + TypeScript.

Read ARCHITECTURE.md before making major changes.

## Commands
npm run dev
npm run build
npm run lint

## Rules
- Preserve fade transition behavior using selectedProject/displayedProject/contentVisible.
- Preserve refs-based SnakeGame architecture.
- Preserve SearchVisualizer async animation behavior.
- Maintain responsive desktop/mobile layouts.
- Use Tailwind utility classes.
- Avoid unnecessary global state.

## Important Files
- src/app/page.tsx → page orchestration + state
- src/components/SnakeGame.jsx
- src/components/SearchVisualizer.jsx
- src/components/LandingSection.jsx