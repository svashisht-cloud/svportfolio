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
    page.tsx          — renders <Desktop/>; generateMetadata() gives a deep link (`?w=`) its own title/description, so `/` renders per request
    portfolioData.tsx — all content: projects[] and experiences[] (+ types), plus isCurrentRole(), roleStart(), careerSteps() (every role, oldest first, numbered "1.0"…), findWork(name)
    profile.ts        — recruiter facts (headline, location, status {{TODO}}, previously, education) and impact[] (the résumé's before → after numbers)
    skills.ts         — SKILL_GROUPS parsed from the résumé's SKILLS section; groupOf(), mentions() (whole-word match), evidenceFor(skill) → matching work items and projects
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
      FinderSidebar.tsx — pinned Finder sidebar + FinderList (Projects / Experience source list); collapses to an icon rail (FinderRail) via `prefs.sidebar`
      MenuBar.tsx       — top menu bar with working menus and clock; logo menu: About This Developer (sysinfo), About This Site, Software Update…, System Preferences…, résumé, Restart/Shut Down/Log Out
      Dock.tsx          — magnifying dock, running dots, bounce, minimized-window tiles (desktop only)
      launcher.ts       — shared app/link list (APPS, LINK_ITEMS, DEMO_ITEMS) for the dock and the phone home screen; set/takeLaunchOrigin() for the phone zoom
      PhoneShell.tsx    — phones only: HomeScreen (two-page pager: Search | app grid, Search pill, dots, 4-app tray), PhoneSearch, HomeIndicator (swipe up / tap = home), goHome()
      ControlCenter.tsx — phones only: top-right button + sheet (Dark Mode, Sounds, music player, Copy Link, Résumé, Settings); equalizer while music plays
      PhoneSettings.tsx — phones only: the Settings app (the `prefs` window on phones)
      searchIndex.tsx   — search index + scoring shared by Spotlight and the phone Search page (buildIndex, search, Highlight, runItem)
      types.ts          — AppKind, AppPayload, WinState
      deliver.ts        — deliver(wm, kind, event, message): open a window with a message, or send it over the bus if it's already open
      links.ts          — deep links: toSlug/fromSlug/linkFor (`?w=project/forte-resume`, `case/boot-order`, `resume`…); plain module, also used by page.tsx
      useCopyLink.ts    — copy a window's link to the clipboard + toast
      RetroApp.tsx      — Virtual PC (Windows XP Clone) and Classic (old portfolio) in an iframe after a short in-window start-up screen
      achievements.ts   — ACHIEVEMENTS, unlock(), noteRoleSeen(), Bug Hunt store (startBugHunt, squash, BUG_IDS)
      AchievementsApp.tsx — Trophies window + <Bug id/> (renders only while the hunt is on and that bug isn't found)
      syslog.ts         — Console log store: log(subsystem, message, level?), last 500 entries, in memory only
      ConsoleApp.tsx    — Console window (subsystem chips, filter, Clear, follows the bottom)
      ActivityApp.tsx   — Activity Monitor: Processes (open windows, DOM nodes, uptime, Quit Process), CPU (rAF fps graph, long tasks, heap), Network (Resource Timing by type, heaviest files)
      TileGame.tsx      — sliding 15-puzzle widget (numbered Aqua tiles 1–15, a tile in its right place turns green), shuffled by legal moves; "Hold to see solution" shows the solved layout tile by tile while held (doesn't count as solving)
      Spotlight.tsx     — menu-bar search (⌘K / Ctrl+K, "/"): apps, case files, projects, work, skills, résumé lines, Terminal commands, links, "Ask ShubhGPT"
      SystemApps.tsx    — SysInfoApp (About This Developer), SysReportApp (System Report), UpdateApp (Software Update)
      cases/            — Case Files: registry.ts (CASES + facts/story), store.ts (solved ids), CaseFilesApp.tsx (folder), CaseApp.tsx (window), Debrief.tsx (the reveal), IncidentReplay.tsx, BootOrder.tsx
      Terminal.tsx      — Terminal window UI (prompt, history, Tab completion)
      commands.ts       — pure command handlers for the Terminal (run, complete, banner, findTarget)
      BootScreen.tsx    — Boot (first visit per tab) and Login (after Log Out)
      ContextMenu.tsx   — right-click menu (fixed `.os-context-wrap`, clamped to the viewport); entries can be `checked` (menuitemcheckbox, stays open on click) or have a `submenu` (opens on hover/focus/→, ← closes, flips left near the edge); `items` may be a function, re-run on prefs changes so checks stay live
      widgetList.ts     — WIDGETS (id + name, in stacking order), WidgetId, DEFAULT_WIDGETS (clock, weather, note)
      widgetMenu.ts     — widgetMenu() ("Widgets ▸" checkbox submenu + Hide All/Show Widgets) and setWidgetShown() (ticking a widget while all are hidden shows only that one; Show Widgets brings back the previous set)
      Music.tsx         — MusicProvider (single <audio> + lazy Web Audio AnalyserNode), MusicApp window (turntable stage, canvas Visualizer, EqBars), NowPlaying menu-bar item
      prefs.ts          — wallpaper + appearance store (useSyncExternalStore, localStorage)
      useSelection.ts   — Finder-style selection hook (click, Cmd/Ctrl, Shift, rubber band, keys)
      useTilt.ts        — pointer-follow tilt + shine handlers (sets --rx/--ry/--sx/--sy)
      Widgets.tsx       — draggable desktop widgets (clock, sticky note, now playing, Dallas weather, top tech, tile puzzle); only those in `prefs.shownWidgets` render; unmoved ones stack without gaps in the right-hand column (`SLOT_H` per widget, measured heights + gap; the tile has its own column); right-click a widget → Remove “…” Widget + the Widgets ▸ submenu; fade/scale in on show; weather comes from Open-Meteo (no key), refreshes every 30 min and is cached in `sessionStorage["sv-os-weather"]`; double-clicking Now Playing launches Music (`card()` takes an optional `onDoubleClick`)
      Calendar.tsx      — month calendar from the menu-bar clock; milestones derived from data
      Toast.tsx         — ToastProvider / useToast() notification bubbles; toast(text, icon?, { onClick?, ms? }) — with onClick the toast is a button
      sounds.ts         — Web Audio synthesised UI sounds; play(name) is a no-op unless prefs.sound
      shubhgpt/         — ShubhGPT.tsx (chat window) + answer.ts (scripted keyword matching over knowledge.ts)
      eggs/             — Easter eggs: bus.ts (event bus with an optional string payload + dev mode), trash.ts, useKonami.ts,
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
            ├─ MenuBar             ← menus, NowPlaying (double-click opens Music), clock, Spotlight (phones: `mobile` → .os-phonebar status bar)
            ├─ HomeScreen          ← phones only
            ├─ FinderSidebar       ← desktop only
            ├─ DesktopIcons        ← desktop only; full-screen layer with useSelection, right-click menu, drag-to-Trash
            ├─ Widgets             ← desktop only, when prefs.widgets
            ├─ Window × n
            │  └─ AppBody(kind, payload)
            ├─ Dock / HomeIndicator ← Dock on desktop, HomeIndicator on phones
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
- **Software Update nudge:** 12s after the desktop appears, a clickable toast ("Shubh 4.0 is available") opens Software Update. Once per browser (`localStorage["sv-os-update-seen"]`); skipped if storage is unavailable.

```
```

### Window manager (`WindowManager.tsx`)

State: `{ wins: WinState[], zTop }`. `WinState` holds `id, kind, title, payload, x, y, w, h, z, minimized, maximized, phase, mx, my, prev`.

- **Window identity:** `describe(kind, payload)` gives a stable `id` (`"about"`, `"project:<name>"`, `"work:<name>"`, `"demo:<name>"`, …). Launching an id that is already open focuses it (or restores it if minimized) instead of opening a duplicate.
- **Actions (`useWM()`):** `launch, activate, focus, close, minimize, restore, toggleMaximize, move, resize, isOpen` (`isOpen(id)` reads the state ref, so callers don't re-render). The actions object is stable; state is in a separate context (`useWMState()` → `{ wins, focused }`), so components that only launch windows don't re-render on every drag.
- **Phases drive CSS animations:** `opening → open`, `closing → removed`, `minimizing → minimized`, `restoring → open`. Timers are set to 0 under `prefers-reduced-motion`.
- **Minimize target:** the dock separator marked `data-dock-target="minimized"`; `mx/my` is the offset used by the `os-minimize` keyframes.
- **Layout:** `workArea()` = right of the sidebar (desktop), between the menu bar (22px) and dock (84px); on phones between the status bar (`STATUSBAR_H` 36px) and home bar (`HOMEBAR_H` 22px), plus safe-area insets in CSS. New windows cascade by 26px.
- **Focus:** the topmost non-minimized window. The menu bar shows its app name.

### Window kinds (`apps.tsx`)

| kind | Content |
|---|---|
| `about` | Bio, photo, **At a glance** (now / before / based in / open to, from `profile.ts` and the current role; 3 impact tiles from `impact[]`; an "About This Developer…" button), a row of icon shortcuts (`Shortcuts`), quick facts, social links |
| `finder` | `FinderList` (used as a full-screen window on mobile) |
| `projects` | Finder icon view of all projects |
| `project` | Screenshot, role, tags, description, highlights, Launch demo / View live / Source, "Next project" |
| `demo` | `project.demoComponent` (Snake, Search Visualizer) on a dark background |
| `work` | Terminal style: `cat README.md` prompt, ROLE/COMPANY/PERIOD/STACK rows, description, `[ OK ]` highlight lines; "▶ Play the 60-second case file" when a case is about this work (`caseForWork`) |
| `experience` | Terminal style `git log --graph`, one block per company: one fake commit per role (newest first; `HEAD -> main` on the role whose dates say "Present"); work projects are clickable, and those with a case file get a git-style trailer line, "└─ ▶ play the 60s case file" |
| `education` | Graduation photo + UMass logo, degree, Aug 2019 – Dec 2022 |
| `photos` | Viewer: large image or `<video controls>` (for items with `video`), caption, thumbnail strip (videos get a ▶ badge), prev/next; ←/→ keys while the window is focused (ignored while the video itself has focus); swipe left/right on the stage (pointer events, 40px; native image drag is blocked). Caption plus a `place · date` line. ▶ Slideshow: the stage fills the window (bar hidden), photos advance every 4s (6s with reduced motion) with a fade and alternating Ken Burns pan/zoom (`.os-kenburns--a/b`), a video plays through (`startSlideVideo` retries muted if autoplay with sound is refused, else skips) and advances on end; Esc (any focus), a click or the Stop pill ends it. Playing a video pauses the Music player |
| `resume` | Toolbar (Download / Open in new tab) + PDF iframe (`#navpanes=0&toolbar=0&view=FitH` hides the browser's thumbnail sidebar/toolbar so the page fills the window) |
| `contact` | Mail compose form that opens a `mailto:` link. Body from `payload.label` when it opens; a `compose` bus message replaces it while open |
| `trash`, `help` | Joke / usage tips |
| `terminal` | Terminal: banner + commands from `commands.ts` (help, whoami, ls, open, run (demos and case files), cases, skills, cat resume, contact, play [song]/pause/next/np, neofetch, adventure, history, date, clear, sudo hire-me). Runs `payload.label` on open (`initialCommand`) and any `terminal` bus message while open, as if typed. `CommandContext.music` exposes the Music player; a `CommandResult.prompt` (`FollowUp`: label, masked?, handle) sends the next input line to a handler instead of the shell (sudo's password, the `eggs/adventure.ts` text adventure). ↑/↓ history, Tab completion (also song titles after `play`), Ctrl+L / Ctrl+C (Ctrl+C also exits a follow-up) |
| `prefs` | System Preferences: 6 CSS wallpapers + Blue/Graphite appearance (`prefs.ts`) |
| `music` | Music: transport, LCD display with scrubber, shuffle + repeat (off/all/one; `following()` picks a random different song when shuffling; `ended()` handles repeat-one and stops after the last song when repeat is off), volume, turntable stage, playlist. Space / ←/→ while the window is focused (skipped on buttons and sliders). An optional `song.cover` replaces the coloured record label. Playback lives in `MusicProvider`, so it continues when the window is closed. On the first play the provider creates an `AudioContext` and routes the `<audio>` through an `AnalyserNode` (fftSize 128; created once per element, stored in refs; exposed as `analyser()`). The stage (`.os-music-stage`, `--label-hue` per song) shows a vinyl that spins only while playing (`animation-play-state`), a CSS tonearm that swings on/off, and a canvas LED spectrum (`Visualizer`) that reads real frequency data, falls back to a simulated wave without Web Audio, and runs its rAF loop only while playing or decaying. The current playlist row shows animated `EqBars`. All of it stops under `prefers-reduced-motion` |
| `folder` | An "untitled folder" made from the desktop right-click menu (in memory only) |
| `info` | Get Info: about the site (no payload) or about a desktop icon (`{ label, target }`) |
| `shubhgpt` | ShubhGPT chat: speech bubbles, suggested questions, typing dots, word-by-word answers, Email Shubh (Mail via `deliver`), New chat. Asks `payload.label` on open (`initialQuestion`) and any `ask` bus message while open |
| `cases` | Case Files folder (`cases/CaseFilesApp.tsx`): one row per case with tagline and ✓ Solved / ▶ Play; status bar "n of N solved" |
| `case` | One case file (`cases/CaseApp.tsx`, payload `caseId`): header (company, title, SIMULATED tag), the puzzle (loaded with `next/dynamic`), "Skip to what really happened", then the Debrief once solved or skipped. Dark window |
| `sysinfo` | About This Developer: photo, headline, version line that cycles on click (Version n.0 → Build: degree → Uptime since the first role), current / previous role, location, status, More Info… (System Report) and Software Update… |
| `sysreport` | System Report: source list (Overview + the résumé's skill groups). Overview = profile facts + an Impact table; a group = table of skills with clickable evidence chips (`evidenceFor`; 3 shown, "+n more"), or "Listed on my résumé". `payload.label` / `sysreport` bus message selects a skill's group and flashes its row. Path bar at the bottom. Stacks below 520px (container query) |
| `virtualpc` / `classic` | `RetroApp`: toolbar ("an earlier project of mine", Open in new tab) + iframe of windowsxpsimulator.vercel.app / og-portfolio-svashisht.vercel.app behind a 1.6s start-up screen. Opened from the SV menu ("Restart in Windows…"), View → Classic Environment, the dock (Virtual PC), "Run it here" on the two project windows, Terminal/Spotlight |
| `achievements` | Trophies: progress bar, Bug Hunt panel (Start / n of 10), grid of 18 trophies (??? + hint until unlocked) |
| `console` | Console (`syslog.ts`) |
| `activity` | Activity Monitor |
| `update` | Software Update: every role as a version (`careerSteps()`), newest marked New; selecting one shows its notes (each work item + its first highlight). Install → Mail via `deliver`; Not Now closes |

To add a new kind: extend `AppKind`, then `describe`, `SIZES`, `appName`, `ICONS` in `appMeta.tsx`, and the `AppBody` switch.

`AppIcon` looks up `case:<caseId>` first for `case` windows, so each case has its own glyph.

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
| Trophies | 18 achievements + Bug Hunt | `achievements.ts`, `AchievementsApp.tsx` |
| Tile Game | sliding-puzzle widget | `TileGame.tsx` |
| Calendar | click the menu-bar clock | `Calendar.tsx`; badges from role start dates + graduation |

All motion-heavy eggs are skipped under `prefers-reduced-motion`.

### Selection (`useSelection.ts`)
Used by `DesktopIcons` and the Projects folder. Click selects; Cmd/Ctrl+click toggles; Shift+click selects a range; dragging on empty space draws a rubber band (`.os-band`, fixed-position); clicking empty space clears. Double-click, Enter or Cmd/Ctrl+O opens **all** selected items; Cmd/Ctrl+A selects all; arrow keys move within the folder grid. On touch, a tap opens immediately. A plain click on one item of a multi-selection narrows it after 450ms unless a double-click follows.

### Right-click menu
On the wallpaper: New Folder, Change Desktop Background…, Clean Up (`wm.cleanUp()`), Widgets ▸ (a checkbox per widget), Hide All Widgets / Show Widgets, Open Terminal, Get Info. On a widget: Remove “Name” Widget, Widgets ▸, Hide All Widgets. On a desktop icon: Open (N Items), Get Info. Inside windows the browser's own menu is kept.

### Window chrome (`Window.tsx`)
- Drag by title bar (pointer capture), clamped to the viewport; resize from the bottom-right grip (min 300×200). While dragging, `html.os-dragging` disables iframe pointer events.
- Traffic lights: close, minimize, zoom (zoom hidden on mobile). Double-click title bar minimizes. Escape closes a focused window.
- `role="dialog"`. When a window becomes frontmost (and focus isn't already inside it), it focuses its `[data-autofocus]` element (e.g. the Terminal prompt) or itself.
- Variants by kind: `.os-window--dark` (experience, work, terminal, case), `.os-window--metal` (music, shubhgpt).
- `WindowManager` also has `closeAll()` (Log Out / Restart), `cleanUp()` and `home()` (phones: minimizes every visible window so apps keep their state); `launch()` briefly adds `html.os-busy` for the spinning-wheel cursor.

### ShubhGPT orb (`Orb` in `appMeta.tsx`)
`AppIcon` draws `kind: "shubhgpt"` as `.os-icon--orb`: a glass sphere of layered radial gradients with a conic swirl, a faint "SV" and a ✦ sparkle. Its text is sized in `cqw` (the orb is a size container), so it scales anywhere. ShubhGPT.tsx uses `<Orb>` for the header and bot avatars; `thinking` (while typing) adds `.is-thinking`, a rotating swirl and a breathing glow.

### Dock (`Dock.tsx`)
Projects, About, ShubhGPT, Experience, Case Files, one item per project with a `demoComponent`, Résumé, Photos, Music, Terminal, Mail | GitHub, LinkedIn, YouTube | minimized windows | Trash. Magnification uses item centres measured on pointer-enter (mouse only). Items bounce on first launch; a triangle marks open windows.

### Desktop icons (`Desktop.tsx` `DESKTOP_ICONS`)
Kept to four to keep the desktop calm: About Me.txt, Projects, Résumé.pdf, ShubhGPT (plus any New Folders). Case Files, Photos and Mail are in the dock, Finder Favorites and Spotlight.

### Sidebar collapse
`prefs.sidebar` (default true). Collapsed (`.os-sidebar.is-collapsed`, 40px wide; `RAIL_W` 52 in appMeta includes the 12px inset) shows `FinderRail`: Favorites as icon-only buttons. Toggles: the sidebar glyph button in its title bar, View → Hide/Show Sidebar, ⌘⌥S / Ctrl+Alt+S (Workspace keydown, ignored in text fields). `sidebarWidth()` (appMeta) feeds `workArea()` and the widget default positions; open windows keep their place. Width animates (none under reduced motion).

### FinderList (`FinderSidebar.tsx`)
Search field (filters projects and work projects by name, tech stack, description), Favorites (incl. Case Files), Projects (★ = featured), Experience (role groups with disclosure triangles; each company's newest role expanded). The item for the focused window is highlighted.

### Mobile (< 768px)
Phones get an iOS-style shell instead of a squeezed desktop. `useIsMobile()` lives in `appMeta.tsx`.
- **Top bar** (`MenuBar` with `mobile`, class `.os-phonebar`): the **time** top-left (no weekday) is the trigger for the system menu. The menu opens with an SV brand header (`Menu.header` → `.os-menu-brand`), then About This Developer / Site, Software Update, Trophies, System Preferences, résumé, Restart / Shut Down / Log Out ("Restart in Windows…" is desktop-only). `ControlCenter` is top-right; the middle stays clear for the notch / Dynamic Island. The phone menu is opaque frosted glass. Spotlight's menu-bar button isn't rendered on phones (the Search page replaces it; ⌘K still works).
- **Control Center** (`ControlCenter.tsx`, `.os-cc`): a frosted sheet anchored top-right. Tiles: Dark Mode, Sounds, a music tile (song, prev/play/next; tapping the song opens Music), Copy Link (focused window), Résumé, Settings. While music plays, a green equalizer (`.os-cc-eq`) sits left of the button.
- **Home screen** (`PhoneShell.tsx`, `.os-home`): a pager track (`.os-home-track`, width and translateX set inline, one 100% page each): **Search, then as many app pages as needed**. Each app page holds only whole rows: `rows` is measured from the first app page's height and the real cell height (ResizeObserver; `guessRows()` before the first measure), times 4 columns, so icons are never cut. It starts on the first app page.
  - **Swipes:** the axis locks after 8px, and `touch-action: pan-y` keeps vertical scroll. A swipe counts by the raw finger distance (>25% width) or speed (>0.5 px/ms); the shown offset rubber-bands at the ends. Right goes to the previous page; left goes to the next. From Search, either direction returns to the first app page.
  - **Under the pages:** the "Search" pill and the page dots (the first dot is a small magnifier), then the frosted tray (About, Projects, ShubhGPT, Mail). These float in `.os-home-bottom`, absolutely positioned at the bottom. App pages keep `--home-bottom-h` (160px, the measured ~154px plus breathing room) free as bottom padding. The Search page runs to the bottom edge with a 28px fade mask, so nothing ends abruptly when the tray hides.
  - The grid holds every app, including the tray four; Virtual PC is excluded. On Search, the pill and tray step aside (`.is-search`).
  - `goHome()` and the swipe-home finish dispatch `sv-home-page`, so home always lands on the first app page. The whole screen is hidden while an app is open (`.os-root.has-app`).
- **Search page** (`PhoneSearch`, `.os-psearch-*`; not `.os-search`, which is the desktop sidebar field): a sticky field, focused when the page settles and cleared when leaving. An empty query shows Suggestions (recently opened windows, then About/Projects/ShubhGPT/Résumé), Ask ShubhGPT chips (`SUGGESTIONS` from ShubhGPT.tsx, via `deliver`), Featured projects and Case files. Typing shows `search()` groups from `searchIndex.tsx`; Enter runs the first result.
- **Settings app** (`PhoneSettings.tsx`, `.os-set-*`): on phones the `prefs` window renders this, titled "Settings". It's an iOS inset grouped list with a profile card (→ sysinfo); Display & Brightness (Light/Dark previews, Automatic switch, Accent); Wallpaper (2-column swatches); a Sounds switch; General (About This Site, Help, Console, Activity Monitor, Classic); Software Update; Trophies; résumé view/download; Mail and the social links; Restart / Shut Down / Log Out. Sub-pages are local state with a "‹ Settings" back button. Power rows `emit("power", "restart" | "shutdown" | "logout")`, which `Workspace` handles. The CSS-only `.os-switch` is the iOS toggle.
- **Apps**: full screen between the status bar and home bar. The title bar becomes a nav bar (`.os-navbar`) with `‹ <window below>` (closes this window) or `‹ Home` (`wm.home()`). A 14px left-edge strip (`.os-edge-swipe`) does the same on a right swipe. The back target is computed in `Workspace` from the z-order of visible windows.
- **Motion**: tapping a home icon records its centre (`setLaunchOrigin`). `launch()`/`restore()` store it as `win.origin`, and the window zooms out of and back into that icon (`os-app-zoom-in/out`, `.has-origin`). Windows opened from inside an app slide in from the right (`os-push-in`) and slide out when closed.
- **Home bar** (`.os-homebar`, `HomeIndicator`): dragging it up pulls the front app with the finger (inline transform: it rises, shrinks and rounds off). Windows under it are hidden, and the home screen fades and settles in behind (`.is-swiping-home`, `--home-p`). On release past 110px, or a fast flick, the app flies into its icon (Web Animations, using `data-origin` on the window) and then `wm.home({ instant: true })` runs. Otherwise it springs back. A tap, `‹ Home` and the edge swipe use `goHome()`: the normal shrink plus the icons easing in (`.is-homing`). Only gesture-touched inline styles are reset afterwards, because React owns `display` and `transform-origin`.
- **Terminal is desktop-only** (it needs a keyboard): missing from the home grid, phone Search (no Terminal app, no Terminal commands group) and Finder Favorites. If opened anyway (deep link, adventure), `TerminalApp` in apps.tsx shows a "needs a keyboard" card with an Ask ShubhGPT button.
- **Virtual PC (Windows XP Clone) is desktop-only** (`RETRO.virtualpc.desktopOnly`). On phones it's missing from the home grid, the SV menu ("Restart in Windows…"), Spotlight and the project's "Run it here" button. If it's opened anyway (Terminal, deep link), `RetroApp` shows a "needs a bigger screen" card with an Open in new tab link.
- **No surprise zooming on phones:**
  - Text boxes are at least 16px (`.is-mobile input/textarea/select`), because iPhone Safari zooms into smaller focused fields and stays zoomed, e.g. after returning from a link in another tab.
  - `.os-root.is-mobile` has `touch-action: manipulation`, which turns off double-tap zoom; pinch zoom still works, and the viewport doesn't lock zoom.
  - `Window` doesn't auto-focus `[data-autofocus]` inputs on phones; it focuses the window, so the keyboard only appears when you tap a field.
- **No screen saver on phones** (`ScreenSaver disabled` when mobile). The shut-down screen (`.os-shutdown`, z 31000) sits above Boot/Login (30000), so Shut Down works from the login screen.
- **Boot**: phones land on the home screen (About isn't opened). A deep link opens its app over home.
- `--menubar-h`/`--dock-h` are pointed at the status/home bar heights, so Spotlight's full-width sheet still fits. Toasts sit above the home bar (via a width media query, since they render outside `.os-root`). `layout.tsx` exports `viewport` with `viewportFit: "cover"`.
- Checked at 375px (in a 375px iframe, since Chrome won't shrink below ~600px).

### ShubhGPT (`shubhgpt/`, `src/app/knowledge.ts`)
- **Scripted fallback:** `answer(question)` scores every `KNOWLEDGE` entry by whole-word keyword hits and replies with the best one (two if tied); greetings/thanks get small talk; no match gets `FALLBACK`. Answers are first person and never invented: every entry is generated from `portfolioData.tsx` or facts already shown on the site.
- **Live model (OpenAI):** `src/app/api/shubhgpt/route.ts` (POST `{ messages: [{role, content}] }` → `{ text }`) sends instructions + the résumé text (`src/app/resumeText.ts`, a tidied copy of `public/resume.pdf` without the phone number; treated as the most up-to-date source) + the whole knowledge base as the system instructions to an OpenAI model via the Responses API (`openai` SDK): `reasoning.effort: "low"`, `max_output_tokens: 1200`, `store: false`, `prompt_cache_key: "shubhgpt-v1"` (the fixed prefix is ~2.5K tokens and is served from OpenAI's prompt cache after the first request). **When `public/resume.pdf` changes, update `resumeText.ts`.** Career-only, first-person, "email Shubh" when unsure. Last 8 messages, 500 chars each; best-effort in-memory rate limit of 20 questions/hour per IP.
- **Config:** `OPENAI_API_KEY` (required) and `OPENAI_MODEL` (default `gpt-5.4-mini`) in `.env.local` locally (git-ignored) or the host's environment settings. Without a key the route returns 503.
- **Client:** `askShubhGPT(history)` in `answer.ts` calls the route and falls back to the scripted `answer()` on 503/502/network errors; on 429 it shows a "slow down" message. The typing dots stay up at least 600ms. "New chat" drops replies that arrive afterwards.
- Mail's `ContactApp` accepts `prefill` (from `payload.label`); ShubhGPT reopens Mail if it is already open so the prefill applies.

### Case Files (`cases/`)
60-second puzzles built from résumé bullets; each ends on a Debrief with the real numbers.
- **`registry.ts`:** `CASES` — `{ id, title, tag ("SIMULATED …"), tagline, work (exact work-item name), company, facts[{ from?, to, label }], story[], question }`. `caseById`, `caseForWork`. Facts and story use only résumé wording; the puzzles use generic names.
- **`store.ts`:** solved ids in `localStorage["sv-os-cases"]` (`useSolvedCases()`, `getSolvedCases()` for the Terminal, `markSolved()`).
- **`CaseApp.tsx`:** header, `<Game key={round}>` (each puzzle via `next/dynamic`), "Skip to what really happened ↓", then `Debrief` (scrolled into view inside the window). "Play again" bumps `round` to remount the puzzle.
- **`Debrief.tsx`:** facts tiles (struck-through "from" → "to"), "How I built it", buttons: Read the full story (`work` window via `findWork`), Ask ShubhGPT about it (`deliver` → `ask`), Email Shubh (`deliver` → `compose`), Play again.
- **Incident Replay** (`IncidentReplay.tsx`): reducer state machine (brief → approach → stopped → recording → review → solved; second pass keeps a 30 s buffer), canvas LiDAR scan, slider to scrub; marking a frame from −10 to −6 s solves it.
- **Point Cloud Diet** (`PointCloudDiet.tsx`): procedural yard sampled into 60k shuffled points, canvas 2D with drag-to-rotate (auto-rotate off with reduced motion); log-scale slider 1k–60k; simulated laptop frame time `2 + n × 0.0022` ms plus the real fps; "Ship it" passes when ≤ 16.7 ms and ≥ 3,500 points.
- **Slanted Spots** (`SlantedSpots.tsx`): SVG top-down yard, 30 trailers (21 square, 9 at ±15/30/45°); a plate reads when it's within 6px of the capture point; slider = capture offset × sin(angle). Start 70%, best 96.7%; then clicking the one remaining miss (a faded plate, CV model) solves it.
- **Boot Order** (`BootOrder.tsx`, classes `os-seq-*`; `.os-boot` is the boot screen): drag the `verify-config` card (pointer events, `touch-action: none`) or click one of 3 slots (before the kernel / in Buildroot before ROS / as a ROS service), then "Boot the truck" prints a scripted log line by line; only Buildroot-before-ROS solves it. Tried slots are marked; the pipeline lights stages as the log reaches them. Two columns from 600px (container query); on narrow windows the log scrolls into view when booting.
- **Ways in:** desktop icon, dock, Finder Favorites, WorkApp button, Experience trailer line, Terminal `cases` / `run <case>`, Spotlight.
- **To add a case:** an entry in `CASES`, a component in `cases/` taking `{ onSolved }`, a line in `Game` (CaseApp.tsx), and an icon `case:<id>` in `ICONS` (appMeta.tsx).

### Spotlight (`Spotlight.tsx`)
Magnifier at the right end of the menu bar; ⌘K / Ctrl+K toggles, "/" opens (outside text fields), Esc closes and returns focus, clicking outside closes. Index built once: apps (`APPS` from commands.ts), case files, projects, work items, skills (→ System Report via `deliver`), résumé lines (parsed from `RESUME_TEXT` with their role/company), Terminal commands without arguments (→ Terminal via `deliver`; music, history and clear are skipped), links, plus "Ask ShubhGPT “…”" (→ `deliver` `ask`). Scoring: exact title > title prefix > word prefix > title contains > subtitle/keywords; best match ≥ 55 becomes Top Hit; 4 per group (Résumé and Terminal 3). Combobox + listbox with `aria-activedescendant`; ↑/↓/Enter handled in the field (and stopped from reaching other key listeners).

### Messages between windows (`deliver.ts`, `eggs/bus.ts`)
`deliver(wm, kind, event, message)`: if the window is open (`wm.isOpen`), `emit(event, message)` and bring it forward; otherwise `launch(kind, { label: message })`. Events: `ask` (ShubhGPT question), `terminal` (command), `sysreport` (skill), `compose` (Mail body). Components keep the latest handler in a ref updated in an effect, and initial messages run in a 0 ms timeout (so React strict mode doesn't run them twice).

### Deep links (`links.ts`)
`/?w=<slug>` opens that window on load (skips the boot screen, About underneath). The focused window's slug is kept in the address bar with `history.replaceState`, and `document.title` follows; windows without a slug (Trash, folders) leave the URL alone. "Copy Link to This Window" is in the File and Window menus; project windows and case reveals have a Copy link button.

### Achievements + Bug Hunt (`achievements.ts`)
`unlock(id)` (callable from anywhere, incl. `commands.ts` and `eggs/adventure.ts`) stores the id, logs it and emits `achievement`; Workspace shows a clickable toast that opens Trophies. Triggers: Terminal command, Spotlight result, ShubhGPT question, a work project from every role (`noteRoleSeen` in WorkApp), a case / all cases (`cases/store.ts`), Konami, dev mode, `rm -rf /`, `matrix`, windows falling (`wm.drop`), Empty Trash, Résumé → Trash, `sudo hire-me`, finishing the adventure, Calendar to Jun 2022, solving the Tile Game, all 10 bugs. Help shows the live count. Bug Hunt is opt-in (Trophies → Start); bugs sit in About (Quick facts), Projects status bar, project windows (About heading), Experience (last prompt), work windows (## Highlights), Education, Photos bar, Music bar, System Report path bar, Case Files intro. 10/10 → trophy + confetti.

### Console log (`syslog.ts`)
Logged: page load timing and screen size (Kernel), window open/close/minimize (WindowServer), music play/pause, ShubhGPT request status + latency (never the question), Spotlight picks, Terminal commands, preferences changes, weather fetches, case solves, achievements, Bug Hunt, Tile Game.

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

Two companies, newest first: **Forte** (Founder & Software Engineer, Apr 2026 – Present; 3 work items) and **Outrider** (Intern Jun 2022 – Dec 2022, Associate Dec 2022 – Nov 2024, Software Engineer II Nov 2024 – Mar 2026; 12 work items). Roles, dates and numbers follow `public/resume.pdf` (`resumeText.ts`), which wins when they disagree; items not on the résumé are marked `// Site only.` and were left where they were. Work projects open as `work` windows with payload `{ work, company, role }`. The company logo is not shown in the desktop UI.

The current role is the one whose `dateRange` contains "Present" (`isCurrentRole`) — used by Experience's HEAD marker, ShubhGPT's knowledge ("Right now I'm…"), About's "Now" line and About This Developer. `careerSteps()` numbers every role as a version for Software Update and About This Developer.

**To add a work project:** push a `WorkProject` object into the appropriate `role.projects` array. Put the strongest number first in `highlights`: Software Update shows the first highlight.

### Recruiter facts (`profile.ts`, `skills.ts`)
- `profile`: name, headline, location (Boston, MA, from the résumé), `status` ("Open to my next exciting project"), previously, education.
- `impact[]`: the résumé's before → after numbers (About shows the first 3; System Report shows all).
- `SKILL_GROUPS`: parsed from the résumé's SKILLS lines ("Label: a, b, c"). `evidenceFor(skill)` matches aliases (e.g. "C++17/20" → C++, PostgreSQL → also Postgres) as whole words in tags, names, descriptions and highlights; short or all-caps names match case-sensitively. No lookbehind (older Safari).

## Styling

- **Desktop UI:** plain CSS in `src/components/os/os.css` (Aqua-inspired, original drawing; no Apple artwork or fonts are shipped — the font stack prefers Lucida Grande if the visitor has it). Glossy icons are CSS gradient tiles with react-icons glyphs, or the project screenshot.
- **Retro cursors:** `public/os/cursor-arrow.svg` (default), `cursor-hand.svg` (links/buttons) and `cursor-wait.svg` (while a window opens), set in `os.css`.
- **Wallpapers / appearance:** `.os-wallpaper[data-wallpaper=…]` and `.os-root[data-appearance="graphite"]` (overrides `--hilite-*`, traffic lights, primary buttons).
- **Per-visitor storage (all wrapped in try/catch):** `localStorage["sv-os-prefs"]` (wallpaper, appearance, theme, sound, widgets (master switch), shownWidgets, sidebar), `localStorage["sv-os-widgets"]` (widget positions), `localStorage["sv-snake-best"]`, `localStorage["sv-os-cases"]` (solved case files), `localStorage["sv-os-update-seen"]` (Software Update nudge shown), `localStorage["sv-os-achievements"]`, `localStorage["sv-os-roles-seen"]`, `localStorage["sv-os-bugs"]` (`{ on, found[] }`), `sessionStorage["sv-os-booted"]`.
- **Music in narrow windows:** `.os-music` is a size container; under 540px the LCD takes its own full-width row, under 380px the volume icons and the spectrum hide.
- **New-window styles** live in the last section of `os.css` ("Recruiter fast path, Case Files, system windows and Spotlight"), each with its dark-theme override next to it. `.os-todo` marks visible `{{TODO}}` facts. Desktop icons wrap into a second column on short screens (`flex-wrap: wrap-reverse`).
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
| `images/xp-clone.png` | Windows XP Clone project icon: an original XP-era scene (sky, hill, window, taskbar), 512×512. `images/windowIcon.png` (a white outline that looked blank) is no longer used |
| `images/search1.png` | Search Algorithm Viz project icon + window screenshot |
| `images/snake1.png` | Snake Game project icon + window screenshot |
| `images/npm1.png` | Moral-Fibre project icon + window screenshot |
| `images/python.svg.png` | PySvap project icon + window screenshot |
| `images/discord1.png` | Discord Bot project icon + window screenshot |
| `images/person.webp` | Personal Portfolio (Old) project icon + window screenshot |
