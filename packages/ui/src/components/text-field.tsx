// text-field.tsx: a labelled one-line text box, such as a preset name.

import { useId, type KeyboardEvent } from "react";
import field from "./field.module.css";
import styles from "./text-field.module.css";

/** Props of {@link TextField}. */
export interface TextFieldProps {
  /** The visible label, which also names the box for screen readers. */
  label: string;
  /** The text. */
  value: string;
  /** Called with the new text on every edit. */
  onValueChange: (value: string) => void;
  /**
   * A problem with the text. When set, the box is marked invalid and the message is shown under
   * it in words and color, linked for screen readers. Takes the place of the hint.
   */
  error?: string;
  /** A message under the box, linked to it for screen readers. */
  hint?: string;
  /** The most characters the box accepts. */
  maxLength?: number;
  /** Example text shown while empty. */
  placeholder?: string;
  /** Disables the box. */
  disabled?: boolean;
  /** Moves focus into the box when it mounts, for example when a rename starts. */
  autoFocus?: boolean;
  /** Called on key presses in the box, for example Escape to cancel an edit. */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Extra class for the field. */
  className?: string;
}

/**
 * A labelled `<input type="text">` in the control outline, with autocomplete off.
 *
 * @param props - The label, text, change handler and options.
 * @returns The field with label, box and an optional error or hint.
 */
export function TextField(props: TextFieldProps) {
  const {
    label,
    value,
    onValueChange,
    error,
    hint,
    maxLength,
    placeholder,
    disabled,
    autoFocus,
    onKeyDown,
    className,
  } = props;
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={[field.field, className].filter(Boolean).join(" ")}>
      <label className={field.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={styles.box}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        // Only when the caller asks, such as a rename box that opens on request; the label tells
        // screen readers where focus went.
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {message ? (
        <span id={messageId} className={error ? field.error : field.hint}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
