// tabs.tsx: a segmented bar that switches between views of the same content, on Radix Tabs. The
// selected tab's fill is a pill that slides between the tabs.

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef, useRef, type ComponentPropsWithoutRef } from "react";
import styles from "./tabs.module.css";
import { useSlidingPill } from "./use-sliding-pill.ts";

/**
 * The tabs container. It holds the {@link TabsList} and one {@link TabsContent} per tab. This is
 * Radix's `Tabs.Root`, which has no styles of its own.
 */
export const Tabs = TabsPrimitive.Root;

/** Props of {@link TabsList}. */
export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  /**
   * Spans the container's full width, with the tabs sharing it evenly like a segmented control,
   * 8 px side padding, and smaller labels at 900 px and below. For a bar with more tabs than fit
   * at the usual size, such as the playground panel's four.
   */
  stretch?: boolean;
};

/**
 * The tab bar. Give it an `aria-label`. Arrow keys move between tabs; Home and End jump. The
 * selected tab's fill is a pill that slides to the newly selected tab (it does not move under
 * reduced motion, because the duration token is 0).
 *
 * @param props - Radix `Tabs.List` props, and `stretch` to span the container.
 * @returns The tablist element.
 */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, stretch = false, children, ...rest },
  ref,
) {
  const list = useRef<HTMLDivElement | null>(null);
  const pill = useRef<HTMLSpanElement>(null);
  useSlidingPill(list, pill, true, '[data-state="active"]');
  return (
    <TabsPrimitive.List
      ref={(element) => {
        list.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      className={[styles.list, stretch ? styles.stretch : undefined, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span ref={pill} className={styles.pill} aria-hidden="true" />
      {children}
    </TabsPrimitive.List>
  );
});

/** Props of {@link TabsTrigger}. */
export type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

/**
 * One tab. Its `value` matches a {@link TabsContent}.
 *
 * @param props - Radix `Tabs.Trigger` props.
 * @returns The tab button.
 */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { className, ...rest },
  ref,
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={[styles.trigger, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});

/** Props of {@link TabsContent}. */
export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

/**
 * The panel shown while its tab is selected.
 *
 * @param props - Radix `Tabs.Content` props.
 * @returns The tabpanel element.
 */
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { className, ...rest },
  ref,
) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={[styles.content, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
