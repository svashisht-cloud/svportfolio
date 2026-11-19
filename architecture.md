# Architecture

## Stack & Tooling

- **Framework:** Next.js 15 with App Router, React 19, TypeScript
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **Fonts:** Geist + Geist Mono (`next/font/google`, in `layout.tsx`); the desktop itself uses Lucida Grande-style system fonts from `os.css`
- **Icons:** react-icons v5
- **Dev server:** Turbopack (`npm run dev`)

## Directory Layout

```
src/
  app/
    layout.tsx        — root layout: applies fonts, imports globals.css, sets metadata
    page.tsx          — renders <Desktop/>; nothing else
    portfolioData.tsx — all content: projects[] and experiences[] (+ types)
    photos.ts         — photos[] shown in the Photos window ({ src, alt, caption?, date?, place?, w, h, video? }); a `video` entry uses `src` as its poster; `date` only from the original file's metadata or the owner
    songs.ts          — songs[] for the Music window ({ title, artist, src, cover? }); files in public/music/ (128 kbps mp3)
    widgets.ts        — text for the sticky-note widget
    resumeText.ts     — plain-text résumé for ShubhGPT (no phone number); update when resume.pdf changes
    knowledge.ts      — ShubhGPT knowledge entries (first-person, generated from portfolioData + About facts)
    globals.css       — Tailwind import, CSS custom properties (still used by the demos)
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
      Music.tsx         — MusicProvider (single <audio> + lazy Web Audio AnalyserNode), MusicApp window (turntable stage, canvas Visualizer, EqBars), NowPlaying menu-bar item
      prefs.ts          — wallpaper + appearance store (useSyncExternalStore, localStorage)
      useSelection.ts   — Finder-style selection hook (click, Cmd/Ctrl, Shift, rubber band, keys)
      useTilt.ts        — pointer-follow tilt + shine handlers (sets --rx/--ry/--sx/--sy)
      Widgets.tsx       — draggable desktop widgets (clock, sticky note, now playing, Dallas weather, top tech); weather comes from Open-Meteo (no key), refreshes every 30 min and is cached in `sessionStorage["sv-os-weather"]`; double-clicking Now Playing launches Music (`card()` takes an optional `onDoubleClick`)
      Calendar.tsx      — month calendar from the menu-bar clock; milestones derived from data
      Toast.tsx         — ToastProvider / useToast() notification bubbles
      sounds.ts         — Web Audio synthesised UI sounds; play(name) is a no-op unless prefs.sound
      shubhgpt/         — ShubhGPT.tsx (chat window) + answer.ts (scripted keyword matching over knowledge.ts)
      eggs/             — Easter eggs: bus.ts (event bus + dev mode), trash.ts, useKonami.ts,
                          Confetti.tsx, ScreenSaver.tsx, Panic.tsx, MatrixRain.tsx, useShake.ts, adventure.ts
      os.css            — all desktop styling (Aqua chrome, cursors, animations, mobile)
    SnakeGame.jsx     + SnakeGame.css
    SearchVisualizer.jsx + SearchVisualizer.css + searchAlgorithms.js
public/
  os/                 — cursor-arrow.svg, cursor-hand.svg, cursor-wait.svg (retro cursors)
  music/              — mp3s for the Music window (trimski.mp3, hotline-bling.mp3; 128 kbps, ~7.6MB total)
  images/             — image assets
  videos/             — MP4 clips + poster frames for the Photos window
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
| `photos` | Viewer: large image or `<video controls>` (for items with `video`), caption, thumbnail strip (videos get a ▶ badge), prev/next; ←/→ keys while the window is focused (ignored while the video itself has focus); swipe left/right on the stage (pointer events, 40px; native image drag is blocked). Caption plus a `place · date` line. ▶ Slideshow: the stage fills the window (bar hidden), photos advance every 4s (6s with reduced motion) with a fade and alternating Ken Burns pan/zoom (`.os-kenburns--a/b`), a video plays through (`startSlideVideo` retries muted if autoplay with sound is refused, else skips) and advances on end; Esc (any focus), a click or the Stop pill ends it. Playing a video pauses the Music player |
| `resume` | Toolbar (Download / Open in new tab) + PDF iframe (`#navpanes=0&toolbar=0&view=FitH` hides the browser's thumbnail sidebar/toolbar so the page fills the window) |
| `contact` | Mail compose form that opens a `mailto:` link |
| `trash`, `help` | Joke / usage tips |
| `terminal` | Terminal: banner + commands from `commands.ts` (help, whoami, ls, open, run, skills, cat resume, contact, play [song]/pause/next/np, neofetch, adventure, history, date, clear, sudo hire-me). `CommandContext.music` exposes the Music player; a `CommandResult.prompt` (`FollowUp`: label, masked?, handle) sends the next input line to a handler instead of the shell (sudo's password, the `eggs/adventure.ts` text adventure). ↑/↓ history, Tab completion (also song titles after `play`), Ctrl+L / Ctrl+C (Ctrl+C also exits a follow-up) |
| `prefs` | System Preferences: 6 CSS wallpapers + Blue/Graphite appearance (`prefs.ts`) |
| `music` | Music: transport, LCD display with scrubber, shuffle + repeat (off/all/one; `following()` picks a random different song when shuffling; `ended()` handles repeat-one and stops after the last song when repeat is off), volume, turntable stage, playlist. Space / ←/→ while the window is focused (skipped on buttons and sliders). An optional `song.cover` replaces the coloured record label. Playback lives in `MusicProvider`, so it continues when the window is closed. On the first play the provider creates an `AudioContext` and routes the `<audio>` through an `AnalyserNode` (fftSize 128; created once per element, stored in refs; exposed as `analyser()`). The stage (`.os-music-stage`, `--label-hue` per song) shows a vinyl that spins only while playing (`animation-play-state`), a CSS tonearm that swings on/off, and a canvas LED spectrum (`Visualizer`) that reads real frequency data, falls back to a simulated wave without Web Audio, and runs its rAF loop only while playing or decaying. The current playlist row shows animated `EqBars`. All of it stops under `prefers-reduced-motion` |
| `folder` | An "untitled folder" made from the desktop right-click menu (in memory only) |
| `info` | Get Info: about the site (no payload) or about a desktop icon (`{ label, target }`) |
| `shubhgpt` | ShubhGPT chat: speech bubbles, suggested questions, typing dots, word-by-word answers, Email Shubh (opens Mail prefilled via `payload.label`), New chat |

To add a new kind: extend `AppKind`, then `describe`, `SIZES`, `appName`, `ICONS` in `appMeta.tsx`, and the `AppBody` switch.

Terminal look: `.os-term` in `os.css` (Geist Mono, dark background, scanlines, blinking caret). Each `Line` fades in 40ms after the previous one. `experience`/`work` windows get the graphite title bar (`.os-window--dark`).

**Adding a photo:** put a resized copy (max ~2000px) in `public/photos/` and add an entry to `src/app/photos.ts`.

**Adding a video:** iPhone clips are HEVC HDR and won't play in most browsers. Convert to SDR H.264: `avconvert --source in.mov --preset Preset1280x720 --output tmp.mp4`, then `ffmpeg -i tmp.mp4 -map 0:v:0 -map 0:a:0 -c:v libx264 -crf 26 -preset slow -r 30 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart -map_metadata -1 public/videos/name.mp4`. Grab a poster with `ffmpeg -ss 1 -i public/videos/name.mp4 -frames:v 1 -q:v 3 public/videos/name.jpg`, then add an entry with `src` (the poster) and `video`.

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
| Text adventure | Terminal `adventure` | `eggs/adventure.ts`: 6 rooms, coffee + keycard open the corner office; `take resume` opens Résumé, `hire` opens Mail |
| Girlfriend | ask ShubhGPT about my girlfriend ("gf", "girlfriend", "dating", "are you single"…) | the fact lives in a `PERSONAL` section of the route's system prompt, and the model writes the reply; `easterEgg()` in `shubhgpt/answer.ts` gives a fixed reply only in the offline/scripted fallback |
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
Projects, About, ShubhGPT, Experience, one item per project with a `demoComponent`, Résumé, Photos, Music, Terminal, Mail | GitHub, LinkedIn, YouTube | minimized windows | Trash. Magnification uses item centres measured on pointer-enter (mouse only). Items bounce on first launch; a triangle marks open windows.

### FinderList (`FinderSidebar.tsx`)
Search field (filters projects and work projects by name, tech stack, description), Favorites, Projects (★ = featured), Experience (role groups with disclosure triangles; newest role expanded). The item for the focused window is highlighted.

### Mobile (< 768px)
`.is-mobile`: no sidebar or desktop icons; every window is full screen between the menu bar and dock; no drag/resize/zoom; dock scrolls horizontally; File/View/Go/Help menus hidden. On load, the Finder window opens under About.

### ShubhGPT (`shubhgpt/`, `src/app/knowledge.ts`)
- **Scripted fallback:** `answer(question)` scores every `KNOWLEDGE` entry by whole-word keyword hits and replies with the best one (two if tied); greetings/thanks get small talk; no match gets `FALLBACK`. Answers are first person and never invented: every entry is generated from `portfolioData.tsx` or facts already shown on the site.
- **Live model (OpenAI):** `src/app/api/shubhgpt/route.ts` (POST `{ messages: [{role, content}] }` → `{ text }`) sends instructions + the résumé text (`src/app/resumeText.ts`, a tidied copy of `public/resume.pdf` without the phone number; treated as the most up-to-date source) + the whole knowledge base as the system instructions to an OpenAI model via the Responses API (`openai` SDK): `reasoning.effort: "low"`, `max_output_tokens: 1200`, `store: false`, `prompt_cache_key: "shubhgpt-v1"` (the fixed prefix is ~2.5K tokens and is served from OpenAI's prompt cache after the first request). **When `public/resume.pdf` changes, update `resumeText.ts`.** Career-only, first-person, "email Shubh" when unsure. Last 8 messages, 500 chars each; best-effort in-memory rate limit of 20 questions/hour per IP.
- **Config:** `OPENAI_API_KEY` (required) and `OPENAI_MODEL` (default `gpt-5.4-mini`) in `.env.local` locally (git-ignored) or the host's environment settings. Without a key the route returns 503.
- **Client:** `askShubhGPT(history)` in `answer.ts` calls the route and falls back to the scripted `answer()` on 503/502/network errors; on 429 it shows a "slow down" message. The typing dots stay up at least 600ms. "New chat" drops replies that arrive afterwards.
- Mail's `ContactApp` accepts `prefill` (from `payload.label`); ShubhGPT reopens Mail if it is already open so the prefill applies.

### Demos
**SnakeGame** (`src/components/SnakeGame.jsx` + `.css`): 18×18 board, DOM-rendered from refs. Glossy look: checkerboard, gel segments with a head-to-tail colour shift, head with eyes facing `data-dir`, CSS apple, LCD SCORE/BEST (best in `localStorage["sv-snake-best"]`), start screen and Aqua game-over dialog. One animation loop for the component's lifetime; only arrow keys steer, only while its window is active; no reversing into itself.

**SearchVisualizer** (`SearchVisualizer.jsx` + `.css`, logic in `searchAlgorithms.js`):
- **Board:** 25×25 (`SIZE`). Model in refs (`starts[]`, `goal`, `walls`/`mud` Sets); squares render once and are updated by toggling classes (`is-wall`, `is-mud`, `is-start`, `is-goal`, `is-frontier`, `is-visited`, `is-path`), so animation never re-renders 625 React nodes. Width `min(560px, 100%, 100dvh - 340px)` to fit the window.
- **Tools:** Start (up to 4, `START_COLORS`), Goal, Wall, Mud (cost 5), Eraser; click/drag paints, dragging a marker moves it, right-click erases. Any edit cancels a running search and clears its marks.
- **Algorithms:** `search(algo, board)` is a generator yielding `frontier` / `visit` events and returning `{ path, cost, owner }` or `null`. Multi-source: all starts enter the frontier at cost 0, each square records its `owner` start, and the first start to reach the goal wins. BFS/DFS/Greedy ignore mud for ordering; UCS/A* use costs; Greedy/A* use Manhattan distance.
- **Run / Step / Pause / Reset** share the generator; speed 1–10 maps to `SPEEDS` (delay, squares per tick). Stats LCD: explored, path length, path cost, pure algorithm time (timed once without animation), winner. No path: "No path" + board shake.
- **Board menu:** random maze (recursive backtracking plus a few knocked-out walls), scattered walls (~28%), sprinkle mud, clear, reset.

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
- **Global theme** (`src/app/globals.css`): Tailwind import (used only for its base reset) plus `--background`, `--foreground` (the embedded demos) and `--accent` (used across `os.css`).

- **Font variables:** `--font-geist-sans`, `--font-geist-mono` set by the Next.js font loader on `<body>` (used by the demos, Terminal and Snake/Search CSS).

## Static Assets (`/public`)

| File | Used by |
|---|---|
| `images/avatar.jpg` | Profile photo: About window, login screen, Terminal banner (600×600 crop) |
| `photos/cafe.jpg` | First photo in the Photos viewer |
| `photos/img-4988.jpg` | Mountain overlook photo (converted from HEIC; EXIF orientation 6, displays 1500×2000) |
| `photos/snow-day.jpg` | Snow day with friends |
| `photos/roadside-selfie.jpg` | Selfie beside a race route (1536×2048) |
| `videos/img-2234.mp4` + `.jpg` | "Leg day" gym clip (720×1280 H.264 SDR, 30s, ~3.3MB) and its poster frame |
| `images/outrider.jpeg` | Referenced by `experiences[].logo` only; not rendered |
| `images/umass.png` | Education window |
| `images/umass-grad.jpg` | Education window + Photos (graduation photo, 643×1200) |
| `images/arcfield.png` | Arcfield project icon + window screenshot (crop of the live site) |
| `resume.pdf` | Résumé window (iframe + download), logo menu, desktop icon |
| `os/cursor-arrow.svg`, `os/cursor-hand.svg`, `os/cursor-wait.svg` | Retro cursors (os.css) |
| `music/` | Songs for the Music window (listed in `src/app/songs.ts`): trimski.mp3, hotline-bling.mp3 (128 kbps) |
| `images/forte2.png` | Forte Resume project icon + window screenshot |
| `images/MockLoop1.png` | AI Interviewer project icon + window screenshot |
| `images/windowIcon.png` | Windows XP Clone project icon + window screenshot |
| `images/search1.png` | Search Algorithm Viz project icon + window screenshot |
| `images/snake1.png` | Snake Game project icon + window screenshot |
| `images/npm1.png` | Moral-Fibre project icon + window screenshot |
| `images/python.svg.png` | PySvap project icon + window screenshot |
| `images/discord1.png` | Discord Bot project icon + window screenshot |
| `images/person.webp` | Personal Portfolio (Old) project icon + window screenshot |
