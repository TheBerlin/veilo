// use-replay-key.ts: the R key as a keyboard shortcut for a Replay button.

import { useEffect, useState, type RefObject } from "react";

/**
 * Makes the R key imitate a mouse click on a button. The button shows pressed for as long as the
 * key is held (a mouse-down), and the click, which replays, happens when the key is released (a
 * mouse-up). If the window loses focus while the key is held, the press is cancelled with no
 * click, as when a pointer is dragged off a button. The key is left alone while the visitor types
 * in a field, when a modifier is held (Ctrl+R and Cmd+R reload the page), on key repeat and while
 * the shortcut is off.
 *
 * Side effects: listens to key and blur events on the window while mounted.
 *
 * @param button - The Replay button, which receives the click.
 * @param enabled - Whether the shortcut works (default). A button that is not shown turns it off.
 * @returns True while the key is held, for the button's pressed look.
 */
export function useReplayKey(button: RefObject<HTMLButtonElement | null>, enabled = true): boolean {
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let held = false;
    const release = () => {
      held = false;
      setPressed(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "r" || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      held = true;
      setPressed(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!held || event.key.toLowerCase() !== "r") return;
      release();
      button.current?.click();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
      release();
    };
  }, [button, enabled]);
  return pressed;
}
