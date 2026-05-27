# Architecture

## Stack & Tooling

- **Framework:** Next.js 15 with App Router, React 19, TypeScript
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **Fonts:** Geist + Geist Mono (`next/font/google`), Kode Mono (`src/app/fonts.ts`)
- **Icons:** react-icons v5
- **Dev server:** Turbopack (`npm run dev`)

## Directory Layout

```
src/
  app/
    layout.tsx        — root layout: applies fonts, imports globals.css, sets metadata
    page.tsx          — main page: all data, state, layout orchestration
    globals.css       — Tailwind import, CSS custom properties, dark mode
    fonts.ts          — Kode Mono font export (Geist fonts defined inline in layout.tsx)
  components/
    LandingSection.jsx / (no .css)
    SnakeGame.jsx     + SnakeGame.css
    SearchVisualizer.jsx + SearchVisualizer.css
public/
  images/             — all image assets (see Static Assets section)
  resume.pdf
  *.svg               — Next.js/Vercel default SVGs
```

## Component Hierarchy & Data Flow

```
RootLayout (layout.tsx)
└─ Home (page.tsx)            ← orchestrator; owns all page state
   ├─ MetaRow                 ← inline sub-component; renders project.role pill
   ├─ WorkDetailPanel         ← inline sub-component; "About + Key Highlights" layout for work projects
   ├─ LandingSection          ← rendered when displayedProject === null
   ├─ SnakeGame               ← passed as demoComponent for the Snake Game project entry
   └─ SearchVisualizer        ← passed as demoComponent for the Search Visualizer project entry
```

### Page State (`page.tsx`)

| Variable | Type | Purpose |
|---|---|---|
| `selectedProject` | `Project \| null` | Which project the user clicked (responds immediately) |
| `displayedProject` | `Project \| null` | What's actually rendered in the main panel (lags 200ms for fade animation) |
| `contentVisible` | `boolean` | Drives opacity/translate transition on the main panel |
| `showDemo` | `boolean` | Whether the inline demo component is shown instead of project detail |
| `isMenuOpen` | `boolean` | Mobile hamburger menu toggle |
| `projectsOpen` | `boolean` | Whether the Projects section is expanded in the sidebar |
| `experienceOpen` | `boolean` | Whether the Experience section is expanded in the sidebar |
| `openRoles` | `Record<string, boolean>` | Per-role collapse state, keyed by `role.title`; all start `false` |

### Page State Machine

| State | View |
|---|---|
| `displayedProject === null` | LandingSection (hero), centered in main panel |
| `displayedProject` set, has `image`, `showDemo = false` | 5-zone personal project detail (hero strip + About + Key Highlights + actions + prev/next) |
| `displayedProject` set, no `image`, `showDemo = false` | WorkDetailPanel (About + Key Highlights; no hero strip, no prev/next) |
| `displayedProject` set, `showDemo = true` | `displayedProject.demoComponent` rendered inline |

**Transition mechanism:** `selectedProject` changes immediately on click (sidebar active state snaps). A `useEffect` watching `selectedProject` fades out the main panel (`contentVisible = false`), waits 200ms, syncs `displayedProject = selectedProject`, and fades back in. Prev/next labels are derived from `displayedProject` so they stay in sync with visible content during transitions.

State handlers:
- `handleProjectClick(project)` — sets `selectedProject`, resets `showDemo`, closes mobile menu; if the project is a work project it also sets `experienceOpen = true` and opens the correct role card
- `handleGoToCode()` / `handleGoToProject()` — open URLs from `displayedProject` in a new tab

## Data Model

### Personal projects (`projects: Project[]`)

```ts
interface Project {
  name: string;
  image?: string;          // optional — work projects cast as Project have no image
  description: string;
  techStack?: string[];    // pill tags shown in sidebar (max 2) and detail view (all)
  codeUrl?: string;        // GitHub / GitLab repo URL
  projectUrl?: string;     // live site URL
  demoComponent?: React.ReactNode;  // component rendered inline
  featured?: boolean;      // shows "Featured" badge in sidebar card
  role?: string;           // shown in MetaRow below the project title
  highlights?: string[];   // shown in "Key Highlights" section of detail panel
}
```

9 personal projects: Forte Resume, AI Interviewer, Search Algorithm Viz, Snake Game, Moral-Fibre, PySvap, Windows XP Clone, Discord Bot, Personal Portfolio (Old).

### Work experience (`experiences: Experience[]`)

```ts
interface WorkProject {
  name: string;
  description: string;
  techStack?: string[];
  codeUrl?: string;
  projectUrl?: string;
  highlights?: string[];
}

interface Role {
  title: string;
  dateRange: string;
  projects: WorkProject[];
}

interface Experience {
  company: string;
  logo: string;            // path under /public/images/
  roles: Role[];
}
```

Currently one company (Outrider) with 3 roles and 8 work projects total. Work projects are cast as `Project` via `wp as Project` when passed to `handleProjectClick` — valid because `Project.image` is optional.

**To add a work project:** push a `WorkProject` object into the appropriate `role.projects` array.

## Component Details

### LandingSection (`src/components/LandingSection.jsx`)

- **Role:** Hero/home view shown before any project is selected.
- **State:** One boolean per overlay panel — `showAboutMe`, `showExperience`, `showEducation`, `showSocials`, `showContact`.
- **Overlay mechanism:** Each panel is `position: absolute` and toggled via Tailwind `translate-x-full` / `translate-x-0` (horizontal slide carousel).
- **Content areas:**
  - About Me: personal bio, quick facts, profile photo (`/images/personal.png`)
  - Experience: Outrider logo (`/images/outrider.jpeg`), brief copy
  - Education: UMass Amherst CS, logo (`/images/umass.png`)
  - Socials: LinkedIn, GitHub, YouTube — each calls `window.open()`
  - Contact: mailto link (`nucaluregaming@gmail.com`)
  - Resume: anchor download link to `/resume.pdf`
- **Props:** `setIsMenuOpen` — lets LandingSection open the mobile project nav.

### WorkDetailPanel (inline, `src/app/page.tsx`)

- **Role:** Right-panel layout for work projects (no hero image). Used when `displayedProject` has no `image`.
- **Props:** `project: Project`, `mobile?: boolean`
- **Layout:** Title + tech stack tags (pinned header) → scrollable "About" section → "Key Highlights" bullet list with ✦ markers.
- **Padding:** `px-10` desktop / `px-4` mobile, controlled by `mobile` prop.

### MetaRow (inline, `src/app/page.tsx`)

- **Role:** Single line shown below the title in personal project detail panels.
- **Content:** `project.role` only (e.g. "Solo developer", "Author").
- **Returns null** if `project.role` is not set.

### SnakeGame (`src/components/SnakeGame.jsx` + `SnakeGame.css`)

- **Role:** Playable 18×18 classic snake game; used as an inline project demo.
- **Performance pattern:** All mutable game state lives in **refs** to avoid re-renders. Only `gameOver` is React state.
- **Game loop:** `main(ctime)` via `requestAnimationFrame` → throttled by `speedRef` → calls `gameEngine()`.
- **Core logic (`gameEngine`):** collision check via `isCollide()` → food detection → snake array shift → DOM rendering.
- **Rendering:** Direct DOM manipulation — no JSX re-renders during play.
- **Controls:** Arrow keys (desktop); swipe via `handleTouchStart` / `handleTouchEnd` (mobile).

### SearchVisualizer (`src/components/SearchVisualizer.jsx` + `SearchVisualizer.css`)

- **Role:** Interactive 20×20 pathfinding visualizer for 5 algorithms.
- **State:** `grid` (2D array), `selectedAlgorithm`, `startNode`, `endNode`, `isSearching`, `showHelp`
- **Algorithms:** BFS (queue), DFS (stack), Greedy DFS (stack + Manhattan sort), Uniform Cost (min-heap), A* (min-heap, f = g + h).
- **Shared pattern:** `visited` + `parent` arrays → `reconstructPath()` traces back and marks cells `"path"`.

## Layout

### Desktop (`lg:` and above)

Full-height flex row:
- **Sidebar** (`w-1/4`, `flex flex-col`, `overflow-y-auto`, dark gradient background)
  - Name button (home/reset)
  - **Projects** section — collapsible; project cards (`h-40`, hover lift, accent glow when active)
  - **Experience** section — collapsible; company header → role cards → work project rows
  - **Social icon row** — `mt-auto` pins it to the bottom; GitHub / LinkedIn / email
- **Main panel** (`flex-1`) — shows LandingSection, personal project detail, or WorkDetailPanel

### Mobile (below `lg:`)

- **Fixed top bar** (`fixed top-0 z-50`, `h-16`) — SV logo + home button + hamburger; spacer div below it prevents content from hiding under it
- **Hamburger overlay** (`fixed`, `flex flex-col`, slides in from left)
  - Scrollable content (`flex-1 overflow-y-auto`) — Projects list + Experience tree
  - Pinned social footer (`shrink-0`) — GitHub / LinkedIn / email icons
- **Main content** — same detail views as desktop, with tighter padding

### Sidebar — Experience section

Role cards use an accent stripe pattern:
- Card: `rounded-lg border border-[var(--border)]`
- Header button: company logo + role title + date range + chevron; `bg-[var(--surface-raised)]`
- Accent stripe: `w-0.5 h-8 rounded-full` — `bg-[var(--accent)]` when open, `bg-[var(--border)]` when closed
- Work project rows: text-only, `text-xs`, dot indicator; accent highlight when active

## Project Detail Layouts

### Personal project (has `image`)

5-zone layout, `flex-1 flex flex-col`:

| Zone | Classes | Notes |
|---|---|---|
| Hero strip | `shrink-0`, radial gradient bg, `border-b` | 200–260px desktop / 140–180px mobile |
| Title + tech tags | `shrink-0`, `px-10 pt-8 pb-3` / `px-4 pt-4 pb-2` | All tech tags shown |
| MetaRow | `shrink-0`, `px-10 pb-3` / `px-4 pb-2` | Role string only |
| Scrollable body | `flex-1 overflow-y-auto` | "About" section + "Key Highlights" bullets |
| Action buttons | `shrink-0`, `border-t` | View Live / Source / Working Demo |
| Nav footer | `shrink-0`, `border-t` | ← Previous / Next → (hidden for work projects) |

### Work project (no `image`) — WorkDetailPanel

| Zone | Classes | Notes |
|---|---|---|
| Title + tech tags | `shrink-0`, `border-b` | Same gradient title as personal projects |
| Scrollable body | `flex-1 overflow-y-auto` | "About" + "Key Highlights" sections |
| Action buttons | `shrink-0`, `border-t` | Only renders if codeUrl or projectUrl is set |

No hero strip, no MetaRow, no Prev/Next footer.

## Styling

- **Tailwind utility classes** throughout.
- **Global theme** (`src/app/globals.css`): CSS custom properties `--background`, `--surface`, `--surface-raised`, `--foreground`, `--muted`, `--text-dim`, `--border`, `--accent`, `--accent-hover`, `--accent-secondary`; automatic dark mode via `prefers-color-scheme: dark`.
- **Component CSS files** only exist for SnakeGame and SearchVisualizer.
- **Font variables:** `--font-geist-sans`, `--font-geist-mono` set by Next.js font loader; `kode_mono.className` applied directly to `<body>`.

## Static Assets (`/public`)

| File | Used by |
|---|---|
| `images/personal.png` | LandingSection — profile photo |
| `images/outrider.jpeg` | LandingSection + sidebar Experience section — Outrider logo |
| `images/umass.png` | LandingSection — Education logo |
| `resume.pdf` | LandingSection — resume download |
| `images/forte2.png` | Forte Resume project card |
| `images/MockLoop1.png` | AI Interviewer project card |
| `images/windowIcon.png` | Windows XP Clone project card |
| `images/search1.png` | Search Algorithm Viz project card |
| `images/snake1.png` | Snake Game project card |
| `images/npm1.png` | Moral-Fibre project card |
| `images/python.svg.png` | PySvap project card |
| `images/discord1.png` | Discord Bot project card |
| `images/person.webp` | Personal Portfolio (Old) project card |
