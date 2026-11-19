// reset-button.tsx: the top bar's "Reset to defaults" button. Restores every setting and the
// preview content, then shows a message with Undo until the next change, since both are remembered
// between visits.

import type { Settings } from "@veilo-ui/core";
import { Button, toast } from "@veilo-ui/ui";
import { useEffect, useRef, useState } from "react";
import type { Content, ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";

/** The message after a reset. */
export const RESET_MESSAGE = "Settings reset to the defaults.";

/** How long the message, with its Undo, stays on screen if nothing changes, in ms. */
export const RESET_MESSAGE_MS = 10_000;

/** The message's id, so a second reset replaces the first instead of stacking. */
const MESSAGE_ID = "reset-to-defaults";

/** What a reset replaced: the settings and the content before it. */
interface Snapshot {
  settings: Settings;
  content?: Content;
}

/** Props of {@link ResetButton}. */
export interface ResetButtonProps {
  /** The settings store to reset. */
  store: SettingsStore;
  /** The content store to reset too (image ratio). Optional for tests of the settings alone. */
  content?: ContentStore;
  /** The button's size. Defaults to `sm`; a phone's bottom row uses `md` for a bigger target. */
  size?: "sm" | "md";
  /** Shows the short label "Reset" (the full name stays as the accessible name), for a phone. */
  compact?: boolean;
}

/**
 * The reset button. Reset restores the default settings (custom colors included) and the default
 * content (square image), and plays the full sequence; a message then offers Undo, which loads the
 * settings and content from before the reset. The message and its Undo go away at the next change
 * of either, or after {@link RESET_MESSAGE_MS}. The chosen photo is not touched: it is never
 * saved. Side effects: writes both stores, shows and dismisses the message, and subscribes to the
 * stores while Undo is offered.
 *
 * @param props - The stores and the button's size.
 * @returns The button.
 */
export function ResetButton(props: ResetButtonProps) {
  const { store, content, size = "sm", compact = false } = props;
  // What the last reset replaced, while Undo is offered.
  const [before, setBefore] = useState<Snapshot | null>(null);
  // Set while Undo writes the stores, so its own change does not count as "the next change".
  const undoing = useRef(false);

  useEffect(() => {
    if (!before) return;
    const forget = () => {
      if (undoing.current) return;
      setBefore(null);
      toast.dismiss(MESSAGE_ID);
    };
    const offSettings = store.subscribe((state, previous) => {
      if (state.settings !== previous.settings) forget();
    });
    const offContent = content?.subscribe((state, previous) => {
      if (state.content !== previous.content) forget();
    });
    return () => {
      offSettings();
      offContent?.();
    };
  }, [store, content, before]);

  // The message goes with the button.
  useEffect(() => () => void toast.dismiss(MESSAGE_ID), []);

  const undo = (snapshot: Snapshot) => {
    undoing.current = true;
    store.getState().load(snapshot.settings);
    if (snapshot.content) content?.getState().load(snapshot.content);
    undoing.current = false;
    setBefore(null);
  };

  const reset = () => {
    const current: Snapshot = {
      settings: store.getState().settings,
      content: content?.getState().content,
    };
    store.getState().reset();
    // An empty input loads the default content.
    content?.getState().load({});
    setBefore(current);
    toast(RESET_MESSAGE, {
      id: MESSAGE_ID,
      duration: RESET_MESSAGE_MS,
      action: { label: "Undo", onClick: () => undo(current) },
      onAutoClose: () => setBefore(null),
    });
  };

  // Ghost, so it does not read as one more preset chip.
  return (
    <Button
      size={size}
      variant="ghost"
      aria-label={compact ? "Reset to defaults" : undefined}
      onClick={reset}
    >
      {compact ? "Reset" : "Reset to defaults"}
    </Button>
  );
}
