# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint via Next.js
npm start        # Start production server
```

No test framework is configured.

## Architecture

See `architecture.md` for the full architectural reference (component hierarchy, state machines, per-component internals, data model, styling approach, static assets).

**Before any change:** Read `architecture.md` to understand the current structure and conventions.
**After any change:** Update `architecture.md` to reflect what changed — component details, state, data model, styling, or static assets. Keep it accurate and in sync with the code.

Next.js 15 App Router project (React 19, TypeScript, Tailwind CSS v4).

**Entry points:**
- `src/app/layout.tsx` — root layout, font config, metadata
- `src/app/page.tsx` — main portfolio page (client component); holds all project data as a `projects` array and renders the full single-page layout

**Component layout:**
The page renders a fixed sidebar (desktop) / mobile nav + a scrollable right panel. Clicking a nav item (About, Experience, Education, Socials) opens an overlay panel inside `LandingSection`. Project cards in `page.tsx` can embed an inline demo component or link out.

**Key components (`src/components/`):**
- `LandingSection.jsx` — hero section with slide-in overlay panels for About, Experience, Education, and Socials content
- `SnakeGame.jsx` / `SnakeGame.css` — playable Snake game used as an inline project demo
- `SearchVisualizer.jsx` / `SearchVisualizer.css` — interactive grid visualizer for BFS, DFS, Greedy DFS, Uniform Cost, and A* algorithms

**Adding a project:** Add an entry to the `projects` array in `src/app/page.tsx`. Each project object supports `name`, `description`, `image`, an optional `demo` (React component rendered inline), and optional `links`.

**Styling:** Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`). Tailwind is only imported for its base reset; the desktop is styled by `src/components/os/os.css`. `src/app/globals.css` holds the few shared variables used by the demos. Font variables (`--font-geist-sans`, `--font-geist-mono`) are set in `src/app/layout.tsx` and applied on `<body>`.

**Path alias:** `@/*` → `./src/*`.
