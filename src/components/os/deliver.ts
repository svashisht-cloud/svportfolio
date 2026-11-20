"use client";
import { describe } from "./appMeta";
import { emit, type BusEvent } from "./eggs/bus";
import type { WMActions } from "./WindowManager";
import type { AppKind } from "./types";

/**
 * Open a window with a message for it: a question for ShubhGPT, a command for the Terminal,
 * a skill for System Report, a body for Mail. A window that's already open gets the message
 * over the bus and comes to the front; a new one gets it as `payload.label`.
 */
export function deliver(wm: WMActions, kind: AppKind, event: BusEvent, message: string) {
  const id = describe(kind).id;
  if (wm.isOpen(id)) {
    emit(event, message);
    wm.activate(id);
  } else {
    wm.launch(kind, { label: message });
  }
}
