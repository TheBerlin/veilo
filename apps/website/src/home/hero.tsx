// hero.tsx: the top of the home page: the pitch, the two actions, the install command and a live
// card that plays a reveal.

import { Button, ChipGroup, ChipGroupItem, CodeBlock, Grid, GridCell } from "@veilo/ui";
import type { PresetId } from "@veilo/presets";
import { useState } from "react";
import { INSTALL_COMMAND, PLAYGROUND_URL } from "../site/links.ts";
import { DemoCard } from "./demo-card.tsx";
import styles from "./hero.module.css";

/** The presets the visitor can switch the demo card between, with their labels. */
export const HERO_PRESETS = [
  { id: "dot-upscale", label: "Dot upscale" },
  { id: "hex-from-center", label: "Hex" },
  { id: "mosaic-from-edge", label: "Mosaic" },
] as const;

/**
 * The hero section. The copy is on the left in six columns and the demo on the right in five;
 * on the narrow layout they stack.
 *
 * @returns The section with the page's only `h1`.
 */
export function Hero() {
  const [preset, setPreset] = useState<PresetId>(HERO_PRESETS[0].id);
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Grid rowGap="space-4">
        <GridCell span={6} spanMobile={4}>
          <div className={styles.copy}>
            <h1 className={styles.title} id="hero-title">
              Design skeleton loaders and reveal animations, visually.
            </h1>
            <p className={styles.lead}>
              Tune an effect with live controls, watch it draw from your own image and text, then
              run it on the markup you already have. React, Vue, Svelte, Angular, web components and
              plain HTML.
            </p>
            <div className={styles.actions}>
              <Button asChild variant="primary" size="lg">
                <a href={PLAYGROUND_URL}>Open the playground</a>
              </Button>
              <Button asChild size="lg">
                <a href="#gallery">Browse presets</a>
              </Button>
            </div>
            <div className={styles.install}>
              <CodeBlock
                className={styles.command}
                code={INSTALL_COMMAND}
                prompt
                aria-label="Install command"
              />
              <p className={styles.note}>
                Coming with the first public release. The playground works today.
              </p>
            </div>
          </div>
        </GridCell>
        <GridCell start={8} span={5} spanMobile={4}>
          <div className={styles.demo}>
            <DemoCard preset={preset} />
            <ChipGroup
              aria-label="Preset on the demo card"
              value={preset}
              onValueChange={(value) => setPreset(value as PresetId)}
              variant="segmented"
            >
              {HERO_PRESETS.map((item) => (
                <ChipGroupItem key={item.id} value={item.id}>
                  {item.label}
                </ChipGroupItem>
              ))}
            </ChipGroup>
          </div>
        </GridCell>
      </Grid>
    </section>
  );
}
