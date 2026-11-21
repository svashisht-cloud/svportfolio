import type { ContextEntry } from "./ContextMenu";
import { getPrefs, setPrefs } from "./prefs";
import { log } from "./syslog";
import { WIDGETS, type WidgetId } from "./widgetList";

/**
 * Adds or removes one widget. Adding one while all widgets are hidden shows just that one
 * (not the whole list from before Hide All); "Show Widgets" is the way to bring them all back.
 */
export function setWidgetShown(id: WidgetId, shown: boolean) {
  const { shownWidgets: current, widgets: visible } = getPrefs();
  const next = !shown
    ? current.filter((w) => w !== id)
    : visible
      ? [...new Set([...current, id])]
      : [id];
  setPrefs(shown ? { shownWidgets: next, widgets: true } : { shownWidgets: next });
  log("Widgets", `${shown ? "Added" : "Removed"} ${WIDGETS.find((w) => w.id === id)?.name ?? id}`);
}

/** The "Widgets ▸" submenu (one checkbox per widget) plus the Hide/Show all switch. Shared by the wallpaper and widget menus. */
export function widgetMenu(): ContextEntry[] {
  const { shownWidgets, widgets } = getPrefs();
  return [
    {
      label: "Widgets",
      submenu: WIDGETS.map((w) => {
        const on = widgets && shownWidgets.includes(w.id);
        return { label: w.name, checked: on, run: () => setWidgetShown(w.id, !on) };
      }),
    },
    widgets
      ? { label: "Hide All Widgets", run: () => setPrefs({ widgets: false }) }
      : { label: "Show Widgets", run: () => setPrefs({ widgets: true }) },
  ];
}
