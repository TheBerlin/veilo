// panel.tsx: the control panel beside the stage, with the Loader, Reveal and Content tabs. Saved
// presets and export are not tabs: they are opened from the top bar.

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@veilo-ui/ui";
import { useState } from "react";
import { createContentStore, type ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";
import { ColorFields, InkColorField } from "./color-fields.tsx";
import { ContentTab } from "./content-tab.tsx";
import { ControlGroups } from "./control-groups.tsx";
import { LOADER_GROUPS, REVEAL_GROUPS } from "./controls.ts";
import styles from "./panel.module.css";

/** Props of {@link Panel}. */
export interface PanelProps {
  /** The settings store the controls read and write. */
  store: SettingsStore;
  /** The preview content (card, image and text) the Content tab edits. */
  content?: ContentStore;
  /**
   * Draws the panel without its own card (border, radius, fill and fixed height), for use inside
   * a sheet that is the card. The tab bar then sticks to the top of the sheet as it scrolls.
   */
  embedded?: boolean;
}

/**
 * The control panel. Side effects: writes settings to the store as controls change, and the
 * content to its store from the Content tab.
 *
 * @param props - The settings store and the content store.
 * @returns The panel.
 */
export function Panel(props: PanelProps) {
  // The app passes its store; tests that leave it out get a private one.
  const [content] = useState(() => props.content ?? createContentStore());
  return (
    <aside
      className={[styles.panel, props.embedded ? styles.embedded : undefined]
        .filter(Boolean)
        .join(" ")}
      aria-label="Settings"
    >
      <Tabs defaultValue="loader" className={styles.tabs}>
        {/* Stretched: the tabs share the panel's width. */}
        <TabsList aria-label="Settings sections" stretch className={styles.tabBar}>
          <TabsTrigger value="loader">Loader</TabsTrigger>
          <TabsTrigger value="reveal">Reveal</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        <TabsContent value="loader" className={styles.content}>
          <ControlGroups store={props.store} groups={LOADER_GROUPS} />
          <ColorFields store={props.store} />
        </TabsContent>
        <TabsContent value="reveal" className={styles.content}>
          <ControlGroups store={props.store} groups={REVEAL_GROUPS} />
          <InkColorField store={props.store} />
        </TabsContent>
        <TabsContent value="content" className={styles.content}>
          <ContentTab content={content} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
