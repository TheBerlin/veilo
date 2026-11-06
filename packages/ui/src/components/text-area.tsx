// text-area.tsx: a labelled multi-line text box for pasted code, such as settings JSON.

import { useId } from "react";
import field from "./field.module.css";
import styles from "./text-area.module.css";

/** Props of {@link TextArea}. */
export interface TextAreaProps {
  /** The visible label, which also names the box for screen readers. */
  label: string;
  /** The text. */
  value: string;
  /** Called with the new text on every edit. */
  onValueChange: (value: string) => void;
  /** Visible lines. Defaults to 6. */
  rows?: number;
  /** Example text shown while empty. */
  placeholder?: string;
  /** A message under the box, linked to it for screen readers. */
  hint?: string;
  /** Disables the box. */
  disabled?: boolean;
  /** Extra class for the field. */
  className?: string;
}

/**
 * A labelled `<textarea>` in the monospace code style, with spell checking off.
 *
 * @param props - The label, text, change handler and options.
 * @returns The field with label, box and optional hint.
 */
export function TextArea(props: TextAreaProps) {
  const { label, value, onValueChange, rows = 6, placeholder, hint, disabled, className } = props;
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={[field.field, className].filter(Boolean).join(" ")}>
      <label className={field.label} htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.box}
        value={value}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {hint && (
        <span id={hintId} className={field.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
