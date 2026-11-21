/** The desktop widgets, in the order they stack. Kept apart from Widgets.tsx so menus can list them cheaply. */
export const WIDGETS = [
  { id: "clock", name: "Clock" },
  { id: "weather", name: "Weather" },
  { id: "note", name: "Sticky Note" },
  { id: "music", name: "Now Playing" },
  { id: "stack", name: "Most-Used Tech" },
  { id: "tile", name: "Tile Puzzle" },
] as const;

export type WidgetId = (typeof WIDGETS)[number]["id"];

/** What a first-time visitor sees; the rest are added from the right-click menu. */
export const DEFAULT_WIDGETS: WidgetId[] = ["clock", "weather", "note"];

export const isWidgetId = (v: unknown): v is WidgetId => WIDGETS.some((w) => w.id === v);
