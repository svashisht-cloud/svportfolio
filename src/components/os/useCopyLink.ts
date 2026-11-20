"use client";
import { useCallback } from "react";
import { linkFor } from "./links";
import { useToast } from "./Toast";
import type { AppKind, AppPayload } from "./types";

/** Copy a window's deep link to the clipboard, with a toast either way. */
export function useCopyLink() {
  const toast = useToast();
  return useCallback(
    (kind: AppKind, payload?: AppPayload) => {
      const url = linkFor(kind, payload);
      if (!url) {
        toast("This window doesn't have its own link.", "🔗");
        return;
      }
      const done = () => toast("Link copied. Paste it anywhere to open this window.", "🔗");
      const failed = () => toast("Couldn't copy. The link is in the address bar.", "🔗");
      if (!navigator.clipboard) return failed();
      navigator.clipboard.writeText(url).then(done, failed);
    },
    [toast],
  );
}
