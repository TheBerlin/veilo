// color-field.tsx: a labelled color input, as a picker swatch plus a #rrggbb text box.

import { useEffect, useId, useState } from "react";
import styles from "./color-field.module.css";
import field from "./field.module.css";

/** The accepted format, the same one the settings schema checks for colors. */
const HEX = /^#[0-9a-f]{6}$/i;

/** Props of {@link ColorField}. */
export interface ColorFieldProps {
  /** The visible label, which also names both inputs for screen readers. */
  label: string;
  /** The color as `#rrggbb`. */
  value: string;
  /** Called with a valid `#rrggbb` color, in lower case. */
  onValueChange: (value: string) => void;
  /** Disables both inputs. */
  disabled?: boolean;
  /** Extra class for the field. */
  className?: string;
}

/**
 * A color field: the platform's color picker and a hex text box that stay in sync. The text box
 * reports a value only when it is a full `#rrggbb` color; until then it is marked invalid with a
 * message, and leaving it restores the last valid color.
 *
 * @param props - The label, the color and its change handler.
 * @returns The field with label, swatch and text box.
 */
export function ColorField(props: ColorFieldProps) {
  const { label, value, onValueChange, disabled, className } = props;
  const labelId = useId();
  const errorId = useId();
  // What the user is typing, which may be incomplete.
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const invalid = !HEX.test(draft);

  return (
    <div className={[field.field, className].filter(Boolean).join(" ")}>
      <span className={field.label} id={labelId}>
        {label}
      </span>
      <span className={styles.row}>
        <input
          type="color"
          className={styles.swatch}
          aria-labelledby={labelId}
          value={value}
          onChange={(event) => onValueChange(event.target.value.toLowerCase())}
          disabled={disabled}
        />
        <input
          type="text"
          className={styles.text}
          aria-labelledby={labelId}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          value={draft}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => {
            const next = event.target.value.trim();
            setDraft(next);
            if (HEX.test(next)) onValueChange(next.toLowerCase());
          }}
          // An unfinished color is dropped, so the box always ends up showing the real value.
          onBlur={() => setDraft(value)}
          disabled={disabled}
        />
      </span>
      {invalid ? (
        <span className={field.error} id={errorId}>
          Use the format #rrggbb.
        </span>
      ) : null}
    </div>
  );
}
