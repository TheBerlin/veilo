// use-drawer.tsx: the "Use in your project" drawer of the gallery: how to install the package and
// one snippet per format for the chosen effect, with a copy button.

import type { FlakeShape } from "@veilo-ui/seasonal";
import { ChipGroup, ChipGroupItem, CodeBlock, Drawer } from "@veilo-ui/ui";
import { useRef, useState } from "react";
import type { GalleryEffect } from "./effects.ts";
import { INSTALL_COMMAND, USE_FORMATS, useSnippet, type UseFormat } from "./use-snippets.ts";
import styles from "./use-drawer.module.css";

/** Props of {@link UseDrawer}. */
export interface UseDrawerProps {
  /** The effect to show code for, or null while the drawer is closed. */
  effect: GalleryEffect | null;
  /** The flake form chosen on the page; the snippets use it. */
  shape: FlakeShape;
  /** Called when the visitor closes the drawer. */
  onClose: () => void;
}

/**
 * The drawer that says how to use an effect in a project. It keeps showing the last effect while
 * it slides out, so it never goes blank.
 *
 * @param props - The effect (null when closed), the flake form and the close handler.
 * @returns The drawer.
 */
export function UseDrawer(props: UseDrawerProps) {
  const { effect, shape, onClose } = props;
  const [format, setFormat] = useState<UseFormat>("javascript");
  const last = useRef<GalleryEffect | null>(effect);
  if (effect) last.current = effect;
  const shown = last.current;
  return (
    <Drawer
      open={effect !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={shown ? `Use ${shown.name}` : "Use this effect"}
      description="Add this effect to your own project, as a loading animation."
    >
      {shown ? (
        <div className={styles.body}>
          <section className={styles.section} aria-labelledby="use-install">
            <h3 id="use-install" className={styles.heading}>
              1. Install
            </h3>
            <CodeBlock code={INSTALL_COMMAND} prompt aria-label="Install command" />
            <p className={styles.note}>
              The package is not on npm yet. It is published with the first public release.
            </p>
          </section>
          <section className={styles.section} aria-labelledby="use-code">
            <h3 id="use-code" className={styles.heading}>
              2. Add it
            </h3>
            <ChipGroup
              aria-label="Format"
              variant="segmented"
              value={format}
              onValueChange={(value) => setFormat(value as UseFormat)}
            >
              {USE_FORMATS.map((item) => (
                <ChipGroupItem key={item.id} value={item.id}>
                  {item.label}
                </ChipGroupItem>
              ))}
            </ChipGroup>
            <CodeBlock
              code={useSnippet(format, shown.id, shape)}
              narrow="wrap"
              aria-label={`${USE_FORMATS.find((item) => item.id === format)!.label} code`}
            />
          </section>
          <p className={styles.note}>
            The effects draw characters in IBM Plex Mono. Load it on your page, for example with
            Fontsource, or they use your system's monospace font. Colors come from your page's Veilo
            custom properties, and follow its light and dark theme.
          </p>
        </div>
      ) : null}
    </Drawer>
  );
}
