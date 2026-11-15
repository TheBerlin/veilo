// reset-button.tsx: the header's "Reset to defaults" button. Restores every setting, then offers
// Undo until the next change, since the settings are remembered between visits.

import type { Settings } from "@veilo/core";
import { Button } from "@veilo/ui";
import { useEffect, useRef, useState } from "react";
import type { SettingsStore } from "../state/settings-store.ts";

/** The message after a reset. */
export const RESET_MESSAGE = "Settings reset to the defaults.";

/** Props of {@link ResetButton}. */
export interface ResetButtonProps {
  /** The settings store to reset. */
  store: SettingsStore;
  /** Class for the button, for placing it in its row. */
  buttonClassName?: string;
  /** Class for the message line. */
  messageClassName?: string;
}

/**
 * The reset button and its message line. Reset restores the default settings (custom colors
 * included) and plays the full sequence; the message then offers Undo, which loads the settings
 * from before the reset. The message and Undo go away at the next settings change. Side effects:
 * writes the store and subscribes to it while Undo is offered.
 *
 * @param props - The store, and classes for the button and the message line.
 * @returns The button, and the message line (a polite live region).
 */
export function ResetButton(props: ResetButtonProps) {
  const { store, buttonClassName, messageClassName } = props;
  // The settings before the last reset, while Undo is offered.
  const [before, setBefore] = useState<Settings | null>(null);
  // Set while Undo writes the store, so its own change does not count as "the next change".
  const undoing = useRef(false);

  useEffect(() => {
    if (!before) return;
    return store.subscribe((state, previous) => {
      if (state.settings !== previous.settings && !undoing.current) setBefore(null);
    });
  }, [store, before]);

  const reset = () => {
    const current = store.getState().settings;
    store.getState().reset();
    setBefore(current);
  };

  const undo = () => {
    if (!before) return;
    undoing.current = true;
    store.getState().load(before);
    undoing.current = false;
    setBefore(null);
  };

  return (
    <>
      {/* Ghost, so it does not read as one more preset chip. */}
      <Button size="sm" variant="ghost" className={buttonClassName} onClick={reset}>
        Reset to defaults
      </Button>
      {/* Polite live region: the result is read out without moving focus. */}
      <p className={messageClassName} aria-live="polite">
        {before ? (
          <>
            {RESET_MESSAGE}{" "}
            <Button size="sm" variant="ghost" onClick={undo}>
              Undo
            </Button>
          </>
        ) : null}
      </p>
    </>
  );
}
