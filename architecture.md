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
    photos.ts         — photos[] shown in the Photos window ({ src, alt, caption?, w, h })
    songs.ts          — songs[] for the Music window ({ title, artist, src }); files in public/music/
    widgets.ts        — text for the sticky-note widget
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
      Terminal.tsx      — Terminal window UI (prompt, history, Tab completion)
      commands.ts       — pure command handlers for the Terminal (run, complete, banner, findTarget)
      BootScreen.tsx    — Boot (first visit per tab) and Login (after Log Out)
      ContextMenu.tsx   — right-click menu (fixed position, clamped to the viewport)
      Music.tsx         — MusicProvider (single <audio>), MusicApp window, NowPlaying menu-bar item
      prefs.ts          — wallpaper + appearance store (useSyncExternalStore, localStorage)
      useSelection.ts   — Finder-style selection hook (click, Cmd/Ctrl, Shift, rubber band, keys)
      useTilt.ts        — pointer-follow tilt + shine handlers (sets --rx/--ry/--sx/--sy)
      Widgets.tsx       — draggable desktop widgets (clock, sticky note, now playing, top tech)
      Calendar.tsx      — month calendar from the menu-bar clock; milestones derived from data
      Toast.tsx         — ToastProvider / useToast() notification bubbles
      sounds.ts         — Web Audio synthesised UI sounds; play(name) is a no-op unless prefs.sound
      eggs/             — Easter eggs: bus.ts (event bus + dev mode), trash.ts, useKonami.ts,
                          Confetti.tsx, ScreenSaver.tsx, Panic.tsx, MatrixRain.tsx, useShake.ts
      os.css            — all desktop styling (Aqua chrome, cursors, animations, mobile)
    SnakeGame.jsx     + SnakeGame.css
    SearchVisualizer.jsx + SearchVisualizer.css
public/
  os/                 — cursor-arrow.svg, cursor-hand.svg, cursor-wait.svg (retro cursors)
  music/              — mp3s for the Music window (empty until songs are added)
  images/             — image assets
  resume.pdf
```

## The Desktop (component hierarchy)

```
Home (page.tsx)
└─ Desktop
   └─ WindowManagerProvider        ← owns all window state
      └─ MusicProvider             ← owns the single <audio> element
         └─ ToastProvider          ← toasts (rendered fixed, outside .os-root)
         └─ Workspace              ← .os-root (+ .is-mobile, .is-party, data-appearance, data-theme); owns the stage
            ├─ wallpaper           ← data-wallpaper from prefs
            ├─ MenuBar             ← menus, NowPlaying, clock
            ├─ FinderSidebar       ← desktop only
            ├─ DesktopIcons        ← desktop only; full-screen layer with useSelection, right-click menu, drag-to-Trash
            ├─ Widgets             ← desktop only, when prefs.widgets
            ├─ Window × n
            │  └─ AppBody(kind, payload)
            ├─ Dock
            ├─ ContextMenu         ← when open
            ├─ AlertDialog         ← Aqua alert (Résumé → Trash)
            ├─ Confetti / ScreenSaver / Panic
            └─ stage overlays      ← blackout / Boot / wake / Login, and the shut-down screen
```

### Stages (`Workspace`)

`pending` (one black frame) → `boot` (first visit in this tab; skipped if `sessionStorage["sv-os-booted"]` is set or reduced motion) → `waking` (0.65s screen-on fade; About opens, plus Finder on phones) → `desktop`.
- **Log Out Shubh…** (logo menu): closes all windows → `loggedOut` (Login panel) → click/Enter → `waking`.
- **Restart…**: closes all windows → `boot`.
- **Shut Down…**: black overlay with a "Turn it back on" button.

```
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
| `about` | Bio, photo, a row of icon shortcuts that each open a window (`Shortcuts`), quick facts, social links |
| `finder` | `FinderList` (used as a full-screen window on mobile) |
| `projects` | Finder icon view of all projects |
| `project` | Screenshot, role, tags, description, highlights, Launch demo / View live / Source, "Next project" |
| `demo` | `project.demoComponent` (Snake, Search Visualizer) on a dark background |
| `work` | Terminal style: `cat README.md` prompt, ROLE/COMPANY/PERIOD/STACK rows, description, `[ OK ]` highlight lines |
| `experience` | Terminal style `git log --graph`: one fake commit per role (newest first, `HEAD -> main` on the current one); work projects are clickable |
| `education` | Graduation photo + UMass logo, degree, Aug 2019 – Dec 2022 |
| `photos` | Viewer: large image, caption, thumbnail strip, prev/next; ←/→ keys while the window is focused |
| `resume` | Toolbar (Download / Open in new tab) + PDF iframe |
| `contact` | Mail compose form that opens a `mailto:` link |
| `trash`, `help` | Joke / usage tips |
| `terminal` | Terminal: banner + commands from `commands.ts` (help, whoami, ls, open, run, skills, cat resume, contact, history, date, clear, sudo hire-me). ↑/↓ history, Tab completion, Ctrl+L / Ctrl+C |
| `prefs` | System Preferences: 6 CSS wallpapers + Blue/Graphite appearance (`prefs.ts`) |
| `music` | Music: transport, LCD display with scrubber, volume, playlist. Playback lives in `MusicProvider`, so it continues when the window is closed |
| `folder` | An "untitled folder" made from the desktop right-click menu (in memory only) |
| `info` | Get Info: about the site (no payload) or about a desktop icon (`{ label, target }`) |

To add a new kind: extend `AppKind`, then `describe`, `SIZES`, `appName`, `ICONS` in `appMeta.tsx`, and the `AppBody` switch.

Terminal look: `.os-term` in `os.css` (Geist Mono, dark background, scanlines, blinking caret). Each `Line` fades in 40ms after the previous one. `experience`/`work` windows get the graphite title bar (`.os-window--dark`).

**Adding a photo:** put a resized copy (max ~2000px) in `public/photos/` and add an entry to `src/app/photos.ts`.

### Theme
`prefs.theme` is `system | light | dark` (default system). `useEffectiveTheme()` resolves it against `prefers-color-scheme` and Workspace sets `data-theme` on `.os-root`. Dark styles are one override block at the end of `os.css` (`.os-root[data-theme="dark"] …`); already-dark windows (Terminal, Experience, demos) are untouched. Toggles: sun/moon in the menu bar, View menu, System Preferences → Mode.

### Pop styling
- Window open = spring keyframe (`os-open`, 0.4s; the `opening` phase lasts 420ms). Dock magnification uses an overshoot easing; dock icons use `-webkit-box-reflect`.
- Wallpaper swirls drift (`os-drift-a/b`, transform only).
- Project/demo windows get `--accent` from `accentFor()` (hand-picked map in `appMeta.tsx`): tinted title bar, heading underline, tags, primary button, focus glow.
- Glass: menu bar, menus, sidebar, widgets, toasts use `backdrop-filter`.

### Easter eggs
| Egg | Trigger | Where |
|---|---|---|
| Résumé → Trash | drag the Résumé.pdf desktop icon onto the dock Trash | `Desktop.tsx` (`startDrag`, `overTrash`, `AlertDialog`) |
| Konami | ↑↑↓↓←→←→BA outside text fields | `eggs/useKonami.ts` → confetti + rainbow dock (`.is-party`) + toast |
| Screen saver | 90s idle, not while music plays | `eggs/ScreenSaver.tsx` |
| Developer mode | 7 logo clicks in 3s | `MenuBar.tsx` → `unlockDevMode()`; Terminal `devmode` |
| Panic / matrix | Terminal `rm -rf /`, `matrix` | `commands.ts` emits `panic` on the bus; `eggs/Panic.tsx`, `eggs/MatrixRain.tsx` |
| Windows fall | shake a window by its title bar (4 direction flips in 600ms) | `eggs/useShake.ts` → `wm.drop()`; Clean Up restores `fallFrom` |
| Trash isn't empty | Trash window → Empty Trash | `eggs/trash.ts` store; files return after ~4s; dock shows a full can |
| Calendar | click the menu-bar clock | `Calendar.tsx`; badges from role start dates + graduation |

All motion-heavy eggs are skipped under `prefers-reduced-motion`.

### Selection (`useSelection.ts`)
Used by `DesktopIcons` and the Projects folder. Click selects; Cmd/Ctrl+click toggles; Shift+click selects a range; dragging on empty space draws a rubber band (`.os-band`, fixed-position); clicking empty space clears. Double-click, Enter or Cmd/Ctrl+O opens **all** selected items; Cmd/Ctrl+A selects all; arrow keys move within the folder grid. On touch, a tap opens immediately. A plain click on one item of a multi-selection narrows it after 450ms unless a double-click follows.

### Right-click menu
On the wallpaper: New Folder, Change Desktop Background…, Clean Up (`wm.cleanUp()`), Open Terminal, Get Info. On a desktop icon: Open (N Items), Get Info. Inside windows the browser's own menu is kept.

### Window chrome (`Window.tsx`)
- Drag by title bar (pointer capture), clamped to the viewport; resize from the bottom-right grip (min 300×200). While dragging, `html.os-dragging` disables iframe pointer events.
- Traffic lights: close, minimize, zoom (zoom hidden on mobile). Double-click title bar minimizes. Escape closes a focused window.
- `role="dialog"`. When a window becomes frontmost (and focus isn't already inside it), it focuses its `[data-autofocus]` element (e.g. the Terminal prompt) or itself.
- Variants by kind: `.os-window--dark` (experience, work, terminal), `.os-window--metal` (music).
- `WindowManager` also has `closeAll()` (Log Out / Restart) and `cleanUp()`; `launch()` briefly adds `html.os-busy` for the spinning-wheel cursor.

### Dock (`Dock.tsx`)
Projects, About, Experience, one item per project with a `demoComponent`, Résumé, Photos, Music, Terminal, Mail | GitHub, LinkedIn, YouTube | minimized windows | Trash. Magnification uses item centres measured on pointer-enter (mouse only). Items bounce on first launch; a triangle marks open windows.

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

10 personal projects: Forte Resume, Arcfield (freelance practice), AI Interviewer, Search Algorithm Viz, Snake Game, Moral-Fibre, PySvap, Windows XP Clone, Discord Bot, Personal Portfolio (Old).

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
- **Retro cursors:** `public/os/cursor-arrow.svg` (default), `cursor-hand.svg` (links/buttons) and `cursor-wait.svg` (while a window opens), set in `os.css`.
- **Wallpapers / appearance:** `.os-wallpaper[data-wallpaper=…]` and `.os-root[data-appearance="graphite"]` (overrides `--hilite-*`, traffic lights, primary buttons).
- **Per-visitor storage (all wrapped in try/catch):** `localStorage["sv-os-prefs"]` (wallpaper, appearance, theme, sound, widgets), `localStorage["sv-os-widgets"]` (widget positions), `localStorage["sv-snake-best"]`, `sessionStorage["sv-os-booted"]`.
- **Demos** keep their dark token-based look via `.os-demo`; `os.css` overrides their fixed `vmin` sizes to fit inside windows.
- **Tailwind utility classes** are still used inside SnakeGame / SearchVisualizer.
- **Global theme** (`src/app/globals.css`): CSS custom properties `--background`, `--surface`, `--surface-raised`, `--foreground`, `--muted`, `--text-dim`, `--border`, `--accent`, `--accent-hover`, `--accent-secondary`; automatic dark mode via `prefers-color-scheme: dark`.

- **Font variables:** `--font-geist-sans`, `--font-geist-mono` set by Next.js font loader; `kode_mono.className` applied directly to `<body>`.

## Static Assets (`/public`)

| File | Used by |
|---|---|
| `images/avatar.jpg` | Profile photo: About window, login screen, Terminal banner (600×600 crop) |
| `photos/cafe.jpg` | First photo in the Photos viewer |
| `images/personal.png` | No longer used (replaced by avatar.jpg) |
| `images/outrider.jpeg` | Referenced by `experiences[].logo` only; not rendered |
| `images/umass.png` | Education window |
| `images/umass-grad.jpg` | Education window + Photos (graduation photo, 643×1200) |
| `images/arcfield.png` | Arcfield project icon + window screenshot (crop of the live site) |
| `resume.pdf` | Résumé window (iframe + download), logo menu, desktop icon |
| `os/cursor-arrow.svg`, `os/cursor-hand.svg`, `os/cursor-wait.svg` | Retro cursors (os.css) |
| `music/` | Songs for the Music window (listed in `src/app/songs.ts`); empty for now |
| `images/forte2.png` | Forte Resume project icon + window screenshot |
| `images/MockLoop1.png` | AI Interviewer project icon + window screenshot |
| `images/windowIcon.png` | Windows XP Clone project icon + window screenshot |
| `images/search1.png` | Search Algorithm Viz project icon + window screenshot |
| `images/snake1.png` | Snake Game project icon + window screenshot |
| `images/npm1.png` | Moral-Fibre project icon + window screenshot |
| `images/python.svg.png` | PySvap project icon + window screenshot |
| `images/discord1.png` | Discord Bot project icon + window screenshot |
| `images/person.webp` | Personal Portfolio (Old) project icon + window screenshot |
