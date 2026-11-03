/**
 * cleanup.ts: records every change made to the page so it can be undone in one call.
 * Layer 1. Uses only the elements it is given, no browser globals.
 */

/** A list of undo steps, run in reverse order. */
export interface Cleanup {
  /** Adds an undo step, such as cancelling a frame or removing an element. */
  add(undo: () => void): void;
  /**
   * Sets an inline style property and records its original value. Only the first change of a
   * property is recorded, so later changes still restore the original.
   */
  style(element: Element & ElementCSSInlineStyle, property: string, value: string): void;
  /** Sets an attribute and records its original value, or its absence, the same way. */
  attribute(element: Element, name: string, value: string): void;
  /** Runs every undo step, newest first, and empties the list. Errors do not stop the rest. */
  run(): void;
}

/**
 * Creates an empty cleanup list.
 *
 * @returns The list.
 */
export function createCleanup(): Cleanup {
  let steps: (() => void)[] = [];
  // Which properties and attributes already have their original value recorded. Undo steps run
  // newest first, so recording every change would also end on the original; recording once
  // keeps a style written on every frame from growing the list.
  let recorded = new WeakMap<object, Set<string>>();

  /** Tells whether `key` is recorded for `target`, and marks it as recorded. */
  const firstChange = (target: object, key: string) => {
    let keys = recorded.get(target);
    if (!keys) recorded.set(target, (keys = new Set()));
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  };

  return {
    add(undo) {
      steps.push(undo);
    },

    style(element, property, value) {
      const { style } = element;
      if (firstChange(element, "style-attribute")) {
        // Added before the property steps, so it runs after them. Writing through `style`
        // makes the browser rewrite the attribute text ("width:8px" becomes "width: 8px;"), so
        // once the properties are back, the original text is put back too. Only when the style
        // still means the same: a change the page made meanwhile is kept.
        const original = element.getAttribute("style");
        const meaning = style.cssText;
        steps.push(() => {
          if (style.cssText !== meaning) return;
          // Chromium writes `style` changes into the attribute lazily, on the next read. Reading
          // it now settles that; otherwise a late write would put back an empty `style=""`.
          element.getAttribute("style");
          if (original === null) element.removeAttribute("style");
          else element.setAttribute("style", original);
        });
      }
      if (firstChange(style, `style:${property}`)) {
        const old = style.getPropertyValue(property);
        const priority = style.getPropertyPriority(property);
        steps.push(() => {
          if (old) style.setProperty(property, old, priority);
          else style.removeProperty(property);
        });
      }
      style.setProperty(property, value);
    },

    attribute(element, name, value) {
      if (firstChange(element, `attr:${name}`)) {
        const old = element.getAttribute(name);
        steps.push(() => {
          if (old === null) element.removeAttribute(name);
          else element.setAttribute(name, old);
        });
      }
      element.setAttribute(name, value);
    },

    run() {
      const pending = steps;
      steps = [];
      // After a run the page is back to its original state, so the next change records anew.
      recorded = new WeakMap();
      let failure: unknown;
      for (const undo of pending.reverse()) {
        try {
          undo();
        } catch (error) {
          failure ??= error;
        }
      }
      // Every step ran; report the first problem afterwards.
      if (failure !== undefined) throw failure;
    },
  };
}
