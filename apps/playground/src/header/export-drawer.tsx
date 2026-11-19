// export-drawer.tsx: the top bar's Export button, which opens a drawer with the share link, the
// code to copy (settings, CSS, layout JSON and the snippets for each framework) and a box to load
// settings back.

import { Button, Drawer } from "@veilo-ui/ui";
import { useState } from "react";
import { ExportTab } from "../panel/export-tab.tsx";
import type { ContentStore } from "../state/content-store.ts";
import type { SettingsStore } from "../state/settings-store.ts";

/** Props of {@link ExportButton}. */
export interface ExportButtonProps {
  /** The settings store the export reads, and Apply settings writes. */
  store: SettingsStore;
  /** The preview content, for the share link. */
  content?: ContentStore;
}

/**
 * The Export button and its drawer. The drawer slides in from the right over a dimmed page; focus
 * goes into it and returns to the button on close. Side effects: those of {@link ExportTab}.
 *
 * @param props - The settings store and the content store.
 * @returns The button and, while open, the drawer.
 */
export function ExportButton(props: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
        Export
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Export"
        description="Share a link, or copy the settings or the code."
      >
        <ExportTab store={props.store} content={props.content} />
      </Drawer>
    </>
  );
}
