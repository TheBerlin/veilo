// color-fields.tsx: the Loader tab's Base and Highlight colors and Reset colors (spec 1.3).

import { Button, ColorField } from "@veilo/ui";
import { useSetting, type SettingsStore } from "../state/settings-store.ts";
import styles from "./panel.module.css";

/**
 * The theme's value of a color token, as the field's starting value when nothing is picked.
 *
 * @param name - The custom property, such as `--veilo-base`.
 * @returns The `#rrggbb` value, or black if the token is missing.
 */
export function themeColor(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "#000000";
}

/** Props of {@link ColorFields}. */
export interface ColorFieldsProps {
  /** The settings store. */
  store: SettingsStore;
}

/**
 * The two skeleton colors. Picking one overrides the theme on the card only; Reset colors
 * removes both overrides.
 *
 * @param props - The settings store.
 * @returns The fields and the reset button.
 */
export function ColorFields(props: ColorFieldsProps) {
  const { store } = props;
  const base = useSetting(store, "baseColor");
  const highlight = useSetting(store, "highlightColor");
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Colors</legend>
      <ColorField
        label="Base"
        value={base ?? themeColor("--veilo-base")}
        onValueChange={(value) => store.getState().set("baseColor", value)}
      />
      <ColorField
        label="Highlight"
        value={highlight ?? themeColor("--veilo-hi")}
        onValueChange={(value) => store.getState().set("highlightColor", value)}
      />
      <Button
        size="sm"
        variant="ghost"
        disabled={base === undefined && highlight === undefined}
        onClick={() => store.getState().resetColors()}
      >
        Reset colors
      </Button>
    </fieldset>
  );
}
