// export-tab.tsx: the Export tab (spec 1.6): a share link, the Code section (settings, CSS,
// layout JSON and the code snippets) and a box to load settings back.

import { parseSettings, type Settings } from "@veilo-ui/core";
import { Button, CodeBlock, TextArea } from "@veilo-ui/ui";
import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { encodeShareLink, shareUrl } from "../share/share-link.ts";
import { createContentStore, type Content, type ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";
import { CodeSection } from "./code-section.tsx";
import styles from "./panel.module.css";

/** The message for text that does not parse. */
export const INVALID_JSON = "That is not valid JSON.";

/**
 * The message after applying pasted text.
 *
 * @param count - How many settings were applied.
 * @param newer - Whether the settings came from a newer version of Veilo, which adds a note.
 * @returns For example "3 settings applied."
 */
export function appliedMessage(count: number, newer = false): string {
  const applied = `${count} ${count === 1 ? "setting" : "settings"} applied.`;
  return newer ? `${applied} ${NEWER_VERSION_NOTE}` : applied;
}

/** Said after loading settings that a newer version of Veilo made. */
export const NEWER_VERSION_NOTE =
  "These settings were made by a newer version of Veilo, so some may look different.";

/**
 * The share link for the current settings and preview content. Encoding is async, so the link
 * follows changes one step later; until the first one is ready it is empty.
 *
 * @param settings - The current settings.
 * @param content - The current preview content.
 * @returns The full URL, or `""` while it is being made.
 */
function useShareUrl(settings: Settings, content: Content): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    // A newer change may finish first; only the latest state's link is shown.
    let current = true;
    void encodeShareLink({ settings, content }).then((fragment) => {
      if (current) setUrl(shareUrl(window.location, fragment));
    });
    return () => {
      current = false;
    };
  }, [settings, content]);
  return url;
}

/** Props of {@link ExportTab}. */
export interface ExportTabProps {
  /** The settings store. */
  store: SettingsStore;
  /** The preview content, for the share link. Defaults to a fresh store. */
  content?: ContentStore;
}

/**
 * The Export tab. Side effects: Apply settings replaces the settings in the store.
 *
 * @param props - The settings store and the content store.
 * @returns The tab's sections.
 */
export function ExportTab(props: ExportTabProps) {
  const { store } = props;
  const settings = useStore(store, (state) => state.settings);
  const [contentStore] = useState(() => props.content ?? createContentStore());
  const content = useStore(contentStore, (state) => state.content);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const url = useShareUrl(settings, content);

  const apply = () => {
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      setMessage(INVALID_JSON);
      return;
    }
    const newer = parseSettings(input).newerVersion !== undefined;
    setMessage(appliedMessage(store.getState().load(input).length, newer));
  };

  return (
    <>
      <section className={styles.group}>
        <h3 className={styles.legend}>Share link</h3>
        <CodeBlock code={url} aria-label="Share link" />
        <p className={styles.message}>The link holds the settings, not your own image.</p>
      </section>
      <CodeSection settings={settings} content={content} />
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
