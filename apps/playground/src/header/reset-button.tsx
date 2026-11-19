// reset-button.tsx: the header's "Reset to defaults" button. Restores every setting and the
// preview content, then offers Undo until the next change, since both are remembered between
// visits.

import type { Settings } from "@veilo-ui/core";
import { Button } from "@veilo-ui/ui";
import { useEffect, useRef, useState } from "react";
import type { Content, ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";

/** The message after a reset. */
export const RESET_MESSAGE = "Settings reset to the defaults.";

/** Props of {@link ResetButton}. */
export interface ResetButtonProps {
  /** The settings store to reset. */
  store: SettingsStore;
  /** The content store to reset too (image ratio). Optional for tests of the settings alone. */
  content?: ContentStore;
  /** Class for the button, for placing it in its row. */
  buttonClassName?: string;
  /** Class for the message line. */
  messageClassName?: string;
}

/**
 * The reset button and its message line. Reset restores the default settings (custom colors
 * included) and the default content (square image), and plays the full sequence; the message
 * then offers Undo, which loads the settings and content from before the reset. The message and
 * Undo go away at the next change of either. The chosen photo is not touched: it is never saved.
 * Side effects: writes both stores and subscribes to them while Undo is offered.
 *
 * @param props - The stores, and classes for the button and the message line.
 * @returns The button, and the message line (a polite live region).
 */
export function ResetButton(props: ResetButtonProps) {
  const { store, content, buttonClassName, messageClassName } = props;
  // The settings and content before the last reset, while Undo is offered.
  const [before, setBefore] = useState<{ settings: Settings; content?: Content } | null>(null);
  // Set while Undo writes the store, so its own change does not count as "the next change".
  const undoing = useRef(false);

  useEffect(() => {
    if (!before) return;
    const offSettings = store.subscribe((state, previous) => {
      if (state.settings !== previous.settings && !undoing.current) setBefore(null);
    });
    const offContent = content?.subscribe((state, previous) => {
      if (state.content !== previous.content && !undoing.current) setBefore(null);
    });
    return () => {
      offSettings();
      offContent?.();
    };
  }, [store, content, before]);

  const reset = () => {
    const current = { settings: store.getState().settings, content: content?.getState().content };
    store.getState().reset();
    // An empty input loads the default content.
    content?.getState().load({});
    setBefore(current);
  };

  const undo = () => {
    if (!before) return;
    undoing.current = true;
    store.getState().load(before.settings);
    if (before.content) content?.getState().load(before.content);
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
