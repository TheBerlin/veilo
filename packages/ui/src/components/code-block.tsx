// code-block.tsx: a command or snippet in monospace with a copy button.

import { useEffect, useRef, useState } from "react";
import styles from "./code-block.module.css";

/** How long the button says "Copied", in ms (from the design system). */
export const COPIED_MS = 1600;

/** Props of {@link CodeBlock}. */
export interface CodeBlockProps {
  /** The text shown and copied. Lines keep their breaks and never wrap. */
  code: string;
  /** Shows a `$` before the code, for one shell command. The `$` is not copied. */
  prompt?: boolean;
  /** Names the block for screen readers, such as "Install command" or "Loader CSS". */
  "aria-label"?: string;
  /** Extra class for the block. */
  className?: string;
}

/** The copy button's states. */
type CopyState = "idle" | "copied" | "blocked";

const LABELS: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Copied",
  blocked: "Press Ctrl+C",
};

/**
 * A code panel with a Copy button. Copying writes the code to the clipboard and shows "Copied"
 * for {@link COPIED_MS}. When the clipboard is blocked, it selects the code and shows "Press
 * Ctrl+C" instead. Side effects: writes to the clipboard, changes the page selection when
 * blocked, and runs a timer that is cleared on unmount.
 *
 * @param props - The code, whether to show a prompt, and a label.
 * @returns The block element.
 */
export function CodeBlock(props: CodeBlockProps) {
  const { code, prompt = false, className } = props;
  const [state, setState] = useState<CopyState>("idle");
  const codeRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  /** Sets the state, and returns to idle after a while. */
  function show(next: CopyState) {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), COPIED_MS);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      show("copied");
    } catch {
      // Select the code so the user can copy it by hand.
      const element = codeRef.current;
      const selection = window.getSelection();
      if (element && selection) selection.selectAllChildren(element);
      show("blocked");
    }
  }

  return (
    <div className={[styles.block, className].filter(Boolean).join(" ")}>
      {/* Focusable, so keyboard users can scroll a long line. */}
      <pre className={styles.pre} tabIndex={0} aria-label={props["aria-label"]}>
        {prompt ? (
          <span className={styles.prompt} aria-hidden="true">
            $
          </span>
        ) : null}
        <code ref={codeRef} className={styles.code}>
          {code}
        </code>
      </pre>
      <button type="button" className={styles.copy} data-state={state} onClick={copy}>
        {LABELS[state]}
      </button>
      <span className={styles.status} role="status">
        {state === "copied" ? "Copied to the clipboard" : state === "blocked" ? LABELS.blocked : ""}
      </span>
    </div>
  );
}
