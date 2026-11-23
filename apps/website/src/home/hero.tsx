// hero.tsx: the top of the home page: the pitch, the two actions, the install command and a live
// card that plays a reveal.

import { Button, ChipGroup, ChipGroupItem, CodeBlock, Grid, GridCell } from "@veilo-ui/ui";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GALLERY_URL, INSTALL_COMMAND, PLAYGROUND_URL } from "../site/links.ts";
import { DemoColumn } from "./demo-column.tsx";
import { DEMO_KINDS, DemoStage, type DemoKind } from "./demo-stage.tsx";
import { CARDS_SETTINGS } from "./hero-effect.ts";
import styles from "./hero.module.css";
import rise from "./rise.module.css";
import { useWideScreen } from "./use-wide-screen.ts";

/**
 * The hero section. The copy is on the left in six columns and the demo on the right in five;
 * on the narrow layout they stack. On a wide screen the demo is the three cards in a column that
 * runs down beside the copy; on a phone it is one card with a switch.
 *
 * @returns The section with the page's only `h1`.
 */
export function Hero() {
  const [kind, setKind] = useState<DemoKind>(DEMO_KINDS[0].id);
  const wide = useWideScreen();
  // On a wide screen the demo column starts level with the action buttons: it is pushed down by
  // the distance from the top of the copy to the buttons, measured again when the copy resizes
  // (the headline wraps differently at other widths). offsetTop is layout, so the copy's entrance
  // transform does not disturb it.
  const copy = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  // The demo column waits for the buttons' entrance to end (with no entrance, as under reduced
  // motion, there is nothing to wait for).
  const [buttonsIn, setButtonsIn] = useState(false);
  useEffect(() => {
    const element = actions.current;
    if (!element) return;
    if (getComputedStyle(element).animationName === "none") {
      setButtonsIn(true);
      return;
    }
    const done = () => setButtonsIn(true);
    element.addEventListener("animationend", done, { once: true });
    return () => element.removeEventListener("animationend", done);
  }, []);
  useLayoutEffect(() => {
    const element = copy.current;
    if (!wide || !element) return;
    const measure = () => {
      if (actions.current) setOffset(actions.current.offsetTop - element.offsetTop);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [wide]);
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Grid rowGap="space-4">
        <GridCell span={6} spanMobile={4}>
          <div ref={copy} className={`${styles.copy} ${rise.onLoad}`}>
            <h1 className={styles.title} id="hero-title">
              Design skeleton loaders and reveal animations, visually.
            </h1>
            <p className={styles.lead}>
              Tune an effect with live controls, watch it draw from your own image and text, then
              run it on the markup you already have. React, Vue, Svelte, Angular, web components and
              plain HTML.
            </p>
            <div ref={actions} className={styles.actions}>
              <Button asChild variant="primary" size="lg">
                <a href={PLAYGROUND_URL}>Open the playground</a>
              </Button>
              <Button asChild size="lg">
                <a href={GALLERY_URL}>Browse presets</a>
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
          {wide ? (
            <div style={{ marginTop: offset }}>
              <DemoColumn settings={CARDS_SETTINGS} start={buttonsIn} />
            </div>
          ) : (
            <div className={styles.demo}>
              <ChipGroup
                aria-label="Component on the demo"
                value={kind}
                onValueChange={(value) => setKind(value as DemoKind)}
                variant="segmented"
              >
                {DEMO_KINDS.map((item) => (
                  <ChipGroupItem key={item.id} value={item.id}>
                    {item.label}
                  </ChipGroupItem>
                ))}
              </ChipGroup>
              <DemoStage kind={kind} settings={CARDS_SETTINGS} />
            </div>
          )}
        </GridCell>
      </Grid>
    </section>
  );
}
