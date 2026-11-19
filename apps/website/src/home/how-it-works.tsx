// how-it-works.tsx: the "How it works" section, a pinned story. The section holds the screen for two
// screens of scrolling while the three steps open one at a time on the left and one shared stage
// on the right shows the step's live example. Scrolling only switches the steps; each example
// then plays at its own pace, like a short film, so a mouse wheel's coarse steps cannot make it jerky. Reference: design-taste-frontend's `pinned-chapters` moment. Where nothing can be pinned
// (a small or short screen, reduced motion) it falls back to plain stacked steps, as that moment
// does.

import { Grid, GridCell } from "@veilo-ui/ui";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { SectionHead, StepLink } from "./how-parts.tsx";
import styles from "./how-it-works.module.css";
import { HowStep } from "./how-step.tsx";
import { STEPS, type StepContent } from "./how-steps.tsx";
import { ExportVisual, MusicVisual } from "./how-visuals.tsx";

/** When the story can be pinned: a wide, tall screen, and no request for less motion. */
const LIVE_QUERY =
  "(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

/** How long the leaving example stays on the stage while the next one arrives, in ms. */
const LEAVE_MS = 250;

/**
 * The dead zone around each boundary between steps, as a share of the whole pinned stretch. A step
 * stays open until the page has scrolled this far past its edge, so a wheel tick or a trackpad
 * wobble at a boundary cannot flip the step back and forth, and each step has a short rest.
 */
const HOLD = 0.05;

/**
 * Follows a media query.
 *
 * Side effects: listens to the query while mounted.
 *
 * @param query - A media query.
 * @returns Whether it matches now.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const media = matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/**
 * Which step is open for a scroll position. The current step stays open while the position is
 * inside its share of the stretch widened by {@link HOLD} on both sides; outside that, the step
 * whose share holds the position takes over.
 *
 * @param rect - The section's bounding box.
 * @param viewport - The viewport's height.
 * @param current - The step open now.
 * @returns The index of the step that should be open.
 */
function pickStep(rect: DOMRect, viewport: number, current: number): number {
  // How far through the pinned stretch: 0 when the section reaches the top, 1 when its stage lets go.
  const span = rect.height - viewport;
  const total = span <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / span));
  const share = 1 / STEPS.length;
  if (total >= current * share - HOLD && total < (current + 1) * share + HOLD) return current;
  return Math.min(STEPS.length - 1, Math.floor(total / share));
}

/**
 * Which stage layer a step belongs to. Design and Preview share one layer, the music player, so it
 * stays in place from one to the other and only the row under it changes; Export is the code.
 *
 * @param step - The step.
 * @returns The layer's name.
 */
function layerOf(step: StepContent): "music" | "code" {
  return step.id === "export" ? "code" : "music";
}

/**
 * One step's live example on the stage. The music player plays alone in Design and in Preview.
 *
 * @param step - The step.
 * @returns The example.
 */
function renderVisual(step: StepContent): ReactNode {
  if (step.id === "export") return <ExportVisual />;
  return <MusicVisual mode={step.id === "preview" ? "preview" : "design"} />;
}

/**
 * The section. It is three screens tall and its stage sticks to the top while you scroll
 * through it; the step that is open follows the scroll, and a click on a step scrolls to it. Only
 * the open step's example (and, for a moment, the one leaving) is mounted, so each starts its own
 * reveal as it appears. The stage has one fixed size and the examples on it are scaled up, so
 * nothing moves when the step changes.
 *
 * Side effects: listens to scroll and resize while the story is pinned.
 *
 * @returns The section.
 */
export function HowItWorks() {
  const live = useMediaQuery(LIVE_QUERY);
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState<{ current: number; leaving: number | null; dir: 1 | -1 }>({
    current: 0,
    leaving: null,
    dir: 1,
  });
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = section.current;
    if (!live || !element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setActive((current) =>
        pickStep(element.getBoundingClientRect(), window.innerHeight, current),
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [live]);

  // A change of step that changes the layer (the music player to the code, or back) starts the
  // arrival of the new example and the departure of the old one, in the direction the visitor is
  // going. A change inside a layer (Design to Preview) only updates it: the card stays.
  useEffect(() => {
    setShown((previous) => {
      if (previous.current === active) return previous;
      const next = STEPS[active] ?? STEPS[0]!;
      const before = STEPS[previous.current] ?? STEPS[0]!;
      const dir = active > previous.current ? 1 : -1;
      return layerOf(next) === layerOf(before)
        ? { current: active, leaving: null, dir }
        : { current: active, leaving: previous.current, dir };
    });
  }, [active]);

  useEffect(() => {
    if (shown.leaving === null) return;
    const timer = setTimeout(
      () => setShown((previous) => ({ ...previous, leaving: null })),
      LEAVE_MS,
    );
    return () => clearTimeout(timer);
  }, [shown.leaving]);

  /** Scrolls to the middle of a step's share of the pinned stretch. */
  function goTo(index: number) {
    const element = section.current;
    if (!element) return;
    const span = element.offsetHeight - window.innerHeight;
    const top =
      element.getBoundingClientRect().top + window.scrollY + span * ((index + 0.5) / STEPS.length);
    window.scrollTo({ top, behavior: "smooth" });
  }

  if (!live) {
    return (
      <section ref={section} className={styles.rest} aria-labelledby="how-title">
        <Grid rowGap="space-8">
          <GridCell>
            <SectionHead id="how-title" />
          </GridCell>
          {STEPS.map((step, index) => (
            <HowStep
              key={step.id}
              title={step.title}
              visual={<step.Visual />}
              link={step.link}
              reverse={index === 1}
            >
              {step.text}
            </HowStep>
          ))}
        </Grid>
      </section>
    );
  }

  const current = STEPS[shown.current] ?? STEPS[0]!;
  const leaving = shown.leaving === null ? null : STEPS[shown.leaving];
  return (
    <section ref={section} className={styles.live} aria-labelledby="how-title">
      <div className={styles.stick}>
        <Grid className={styles.pinGrid}>
          <GridCell span={5}>
            <div className={styles.list}>
              <div className={styles.headLeft}>
                <SectionHead id="how-title" />
              </div>
              <ol className={styles.steps}>
                {STEPS.map((step, index) => {
                  const open = index === active;
                  return (
                    <li key={step.id} className={styles.step} data-open={open || undefined}>
                      <h3 className={styles.stepTitle}>
                        <button
                          type="button"
                          className={styles.stepButton}
                          aria-current={open ? "step" : undefined}
                          onClick={() => goTo(index)}
                        >
                          {step.title}
                        </button>
                      </h3>
                      <div className={styles.fold} aria-hidden={open ? undefined : true}>
                        <div className={styles.foldInner}>
                          <p className={styles.body}>{step.text}</p>
                          <p className={styles.more}>
                            <StepLink step={step} tabIndex={open ? 0 : -1} />
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </GridCell>
          <GridCell start={7} span={6}>
            {/* The stage: one fixed frame. The arriving example and, for a moment, the leaving one
                are stacked in it; each layer is keyed, so a new one mounts and plays its own
                reveal. The direction (1 forward, -1 back) sets which way they move. */}
            <div className={styles.stage} style={{ "--dir": shown.dir } as CSSProperties}>
              {leaving ? (
                <div className={styles.layer} data-phase="leave" key={`leave-${layerOf(leaving)}`}>
                  {renderVisual(leaving)}
                </div>
              ) : null}
              <div className={styles.layer} data-phase="enter" key={layerOf(current)}>
                {renderVisual(current)}
              </div>
            </div>
          </GridCell>
        </Grid>
      </div>
    </section>
  );
}
