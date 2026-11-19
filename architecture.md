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
    page.tsx          — renders <Desktop/>; nothing else
    portfolioData.tsx — all content: projects[] and experiences[] (+ types)
    globals.css       — Tailwind import, CSS custom properties (still used by the demos)
    fonts.ts          — Kode Mono font export
  components/
    os/               — the retro Mac OS X–style desktop (see below)
      Desktop.tsx       — root client component: provider, wallpaper, desktop icons, shut-down screen
      WindowManager.tsx — window state (reducer + context), workArea(), useWM()/useWMState()
      Window.tsx        — window chrome: traffic lights, drag, resize, open/close/minimize animations
      apps.tsx          — AppBody (memoized) + one component per window kind
      appMeta.tsx       — constants, links, describe()/defaultSize()/appName(), AppIcon
      FinderSidebar.tsx — pinned Finder sidebar + FinderList (Projects / Experience source list)
      MenuBar.tsx       — top menu bar with working menus and clock
      Dock.tsx          — magnifying dock, running dots, bounce, minimized-window tiles
      types.ts          — AppKind, AppPayload, WinState
      os.css            — all desktop styling (Aqua chrome, cursors, animations, mobile)
    SnakeGame.jsx     + SnakeGame.css
    SearchVisualizer.jsx + SearchVisualizer.css
public/
  os/                 — cursor-arrow.svg, cursor-hand.svg (retro cursors)
  images/             — image assets
  resume.pdf
```

## The Desktop (component hierarchy)

```
Home (page.tsx)
└─ Desktop
   └─ WindowManagerProvider        ← owns all window state
      └─ Workspace                 ← .os-root; adds .is-mobile below 768px
         ├─ MenuBar                ← logo/app/File/View/Go/Window/Help menus + clock
         ├─ FinderSidebar          ← desktop only; FinderList inside a brushed-metal panel
         ├─ DesktopIcons           ← desktop only; double-click (or Enter) to open
         ├─ Window × n             ← one per open window
         │  └─ AppBody(kind, payload)
         ├─ Dock
         └─ shut-down overlay      ← from the logo menu
```

### Window manager (`WindowManager.tsx`)

State: `{ wins: WinState[], zTop }`. `WinState` holds `id, kind, title, payload, x, y, w, h, z, minimized, maximized, phase, mx, my, prev`.

- **Window identity:** `describe(kind, payload)` gives a stable `id` (`"about"`, `"project:<name>"`, `"work:<name>"`, `"demo:<name>"`, …). Launching an id that is already open focuses it (or restores it if minimized) instead of opening a duplicate.
- **Actions (`useWM()`):** `launch, activate, focus, close, minimize, restore, toggleMaximize, move, resize`. The actions object is stable; state is in a separate context (`useWMState()` → `{ wins, focused }`), so components that only launch windows don't re-render on every drag.
- **Phases drive CSS animations:** `opening → open`, `closing → removed`, `minimizing → minimized`, `restoring → open`. Timers are set to 0 under `prefers-reduced-motion`.
- **Minimize target:** the dock separator marked `data-dock-target="minimized"`; `mx/my` is the offset used by the `os-minimize` keyframes.
- **Layout:** `workArea()` = right of the sidebar (desktop), between the menu bar (22px) and dock (84px; 64px on mobile). New windows cascade by 26px.
- **Focus:** the topmost non-minimized window. The menu bar shows its app name.

### Window kinds (`apps.tsx`)

| kind | Content |
|---|---|
| `about` | Bio, photo, quick facts, buttons that launch other windows, social links |
| `finder` | `FinderList` (used as a full-screen window on mobile) |
| `projects` | Finder icon view of all projects |
| `project` | Screenshot, role, tags, description, highlights, Launch demo / View live / Source, "Next project" |
| `demo` | `project.demoComponent` (Snake, Search Visualizer) on a dark background |
| `work` | Work project: role · company · dates, tags, description, highlights |
| `experience` | Timeline of roles (newest first) with clickable work projects |
| `education` | UMass Amherst |
| `resume` | Toolbar (Download / Open in new tab) + PDF iframe |
| `contact` | Mail compose form that opens a `mailto:` link |
| `trash`, `help` | Joke / usage tips |

To add a new kind: extend `AppKind`, then `describe`, `SIZES`, `appName`, `ICONS` in `appMeta.tsx`, and the `AppBody` switch.

### Window chrome (`Window.tsx`)
- Drag by title bar (pointer capture), clamped to the viewport; resize from the bottom-right grip (min 300×200). While dragging, `html.os-dragging` disables iframe pointer events.
- Traffic lights: close, minimize, zoom (zoom hidden on mobile). Double-click title bar minimizes. Escape closes a focused window.
- `role="dialog"`, focused on mount.

### Dock (`Dock.tsx`)
Projects, About, Experience, one item per project with a `demoComponent`, Résumé, Mail | GitHub, LinkedIn | minimized windows | Trash. Magnification uses item centres measured on pointer-enter (mouse only). Items bounce on first launch; a triangle marks open windows.

### FinderList (`FinderSidebar.tsx`)
Search field (filters projects and work projects by name, tech stack, description), Favorites, Projects (★ = featured), Experience (role groups with disclosure triangles; newest role expanded). The item for the focused window is highlighted.

### Mobile (< 768px)
`.is-mobile`: no sidebar or desktop icons; every window is full screen between the menu bar and dock; no drag/resize/zoom; dock scrolls horizontally; File/View/Go/Help menus hidden. On load, the Finder window opens under About.

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

Currently one company (Outrider) with 3 roles and 8 work projects total. Work projects open as `work` windows with payload `{ work, company, role }`. The company logo is not shown in the desktop UI.

**To add a work project:** push a `WorkProject` object into the appropriate `role.projects` array.

## Styling

- **Desktop UI:** plain CSS in `src/components/os/os.css` (Aqua-inspired, original drawing; no Apple artwork or fonts are shipped — the font stack prefers Lucida Grande if the visitor has it). Glossy icons are CSS gradient tiles with react-icons glyphs, or the project screenshot.
- **Retro cursors:** `public/os/cursor-arrow.svg` (default) and `cursor-hand.svg` (links/buttons), set in `os.css`.
- **Demos** keep their dark token-based look via `.os-demo`; `os.css` overrides their fixed `vmin` sizes to fit inside windows.
- **Tailwind utility classes** are still used inside SnakeGame / SearchVisualizer.
- **Global theme** (`src/app/globals.css`): CSS custom properties `--background`, `--surface`, `--surface-raised`, `--foreground`, `--muted`, `--text-dim`, `--border`, `--accent`, `--accent-hover`, `--accent-secondary`; automatic dark mode via `prefers-color-scheme: dark`.

- **Font variables:** `--font-geist-sans`, `--font-geist-mono` set by Next.js font loader; `kode_mono.className` applied directly to `<body>`.

## Static Assets (`/public`)

| File | Used by |
|---|---|
| `images/personal.png` | About window — profile photo |
| `images/outrider.jpeg` | Referenced by `experiences[].logo` only; not rendered |
| `images/umass.png` | Education window |
| `resume.pdf` | Résumé window (iframe + download), logo menu, desktop icon |
| `os/cursor-arrow.svg`, `os/cursor-hand.svg` | Retro cursors (os.css) |
| `images/forte2.png` | Forte Resume project icon + window screenshot |
| `images/MockLoop1.png` | AI Interviewer project icon + window screenshot |
| `images/windowIcon.png` | Windows XP Clone project icon + window screenshot |
| `images/search1.png` | Search Algorithm Viz project icon + window screenshot |
| `images/snake1.png` | Snake Game project icon + window screenshot |
| `images/npm1.png` | Moral-Fibre project icon + window screenshot |
| `images/python.svg.png` | PySvap project icon + window screenshot |
| `images/discord1.png` | Discord Bot project icon + window screenshot |
| `images/person.webp` | Personal Portfolio (Old) project icon + window screenshot |
