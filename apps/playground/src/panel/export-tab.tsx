// export-tab.tsx: the Export tab (spec 1.6): a share link, the settings as JSON, the loader as
// plain CSS, and a box to load settings back.

import { generateLoaderCss, type Settings } from "@veilo/core";
import { Button, CodeBlock, TextArea } from "@veilo/ui";
import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { encodeShareLink, shareUrl } from "../share/share-link.ts";
import type { SettingsStore } from "../state/settings-store.ts";
import { themeColor } from "./color-fields.tsx";
import styles from "./panel.module.css";

/** The message for text that does not parse. */
export const INVALID_JSON = "That is not valid JSON.";

/**
 * The settings as the Export tab shows them: every key, two-space indented.
 *
 * @param settings - The current settings.
 * @returns The JSON text.
 */
export function settingsJson(settings: Settings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * The loader as plain CSS for the default `.skeleton` class, with the theme's colors resolved to
 * hex values where nothing is picked (spec 1.6).
 *
 * @param settings - The current settings.
 * @param base - The theme's base color.
 * @param highlight - The theme's highlight color.
 * @returns The CSS text.
 */
export function loaderCss(settings: Settings, base: string, highlight: string): string {
  return generateLoaderCss(settings, { selector: ".skeleton", base, highlight });
}

/**
 * The message after applying pasted text.
 *
 * @param count - How many settings were applied.
 * @returns For example "3 settings applied."
 */
export function appliedMessage(count: number): string {
  return `${count} ${count === 1 ? "setting" : "settings"} applied.`;
}

/**
 * The share link for the current settings. Encoding is async, so the link follows the settings
 * one step later; until the first one is ready it is empty.
 *
 * @param settings - The current settings.
 * @returns The full URL, or `""` while it is being made.
 */
function useShareUrl(settings: Settings): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    // A newer change may finish first; only the latest settings' link is shown.
    let current = true;
    void encodeShareLink({ settings }).then((fragment) => {
      if (current) setUrl(shareUrl(window.location, fragment));
    });
    return () => {
      current = false;
    };
  }, [settings]);
  return url;
}

/** Props of {@link ExportTab}. */
export interface ExportTabProps {
  /** The settings store. */
  store: SettingsStore;
}

/**
 * The Export tab. Side effects: Apply settings replaces the settings in the store.
 *
 * @param props - The settings store.
 * @returns The tab's sections.
 */
export function ExportTab(props: ExportTabProps) {
  const { store } = props;
  const settings = useStore(store, (state) => state.settings);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const url = useShareUrl(settings);

  const apply = () => {
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      setMessage(INVALID_JSON);
      return;
    }
    setMessage(appliedMessage(store.getState().load(input).length));
  };

  return (
    <>
      <section className={styles.group}>
        <h3 className={styles.legend}>Share link</h3>
        <CodeBlock code={url} aria-label="Share link" />
        <p className={styles.message}>The link holds the settings, not your own image.</p>
      </section>
      <section className={styles.group}>
        <h3 className={styles.legend}>Settings (JSON)</h3>
        <CodeBlock code={settingsJson(settings)} aria-label="Settings JSON" />
      </section>
      <section className={styles.group}>
        <h3 className={styles.legend}>Loader CSS</h3>
        <CodeBlock
          code={loaderCss(settings, themeColor("--veilo-base"), themeColor("--veilo-hi"))}
          aria-label="Loader CSS"
        />
      </section>
      <section className={styles.group}>
        <h3 className={styles.legend}>Load settings</h3>
        <TextArea
          label="Settings to load"
          value={text}
          onValueChange={setText}
          placeholder='{ "effect": "wave", "imageFx": "hex" }'
        />
        <Button size="sm" variant="primary" onClick={apply} disabled={text.trim() === ""}>
          Apply settings
        </Button>
        {/* Polite live region: the result is read out without moving focus. */}
        <p className={styles.message} aria-live="polite">
          {message}
        </p>
      </section>
    </>
  );
}
