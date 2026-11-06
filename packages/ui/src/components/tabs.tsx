// tabs.tsx: a segmented bar that switches between views of the same content, on Radix Tabs.

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import styles from "./tabs.module.css";

/**
 * The tabs container. It holds the {@link TabsList} and one {@link TabsContent} per tab. This is
 * Radix's `Tabs.Root`, which has no styles of its own.
 */
export const Tabs = TabsPrimitive.Root;

/** Props of {@link TabsList}. */
export type TabsListProps = ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

/**
 * The tab bar. Give it an `aria-label`. Arrow keys move between tabs; Home and End jump.
 *
 * @param props - Radix `Tabs.List` props.
 * @returns The tablist element.
 */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, ...rest },
  ref,
) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={[styles.list, className].filter(Boolean).join(" ")}
      {...rest}
    />
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
