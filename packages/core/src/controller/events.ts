/**
 * events.ts: a small typed event emitter for the controller's progress, state and complete.
 * Layer 3. No browser access.
 */

/** Event names mapped to their listener arguments, such as `{ progress: [p: number] }`. */
export type EventMap = Record<string, unknown[]>;

/** A typed event emitter. */
export interface Emitter<Events extends EventMap> {
  /**
   * Adds a listener.
   *
   * @returns A function that removes it. Calling it again does nothing.
   */
  on<Name extends keyof Events>(name: Name, listener: (...args: Events[Name]) => void): () => void;
  /** Calls every listener of an event, in the order they were added. */
  emit<Name extends keyof Events>(name: Name, ...args: Events[Name]): void;
  /** Removes every listener. */
  clear(): void;
}

/**
 * Creates an emitter.
 *
 * A listener that throws does not stop the others or the animation; its error is rethrown in a
 * microtask, where it shows up as an uncaught error.
 *
 * @returns The emitter.
 */
export function createEmitter<Events extends EventMap>(): Emitter<Events> {
  // Stored loosely typed; on() and emit() keep each event's own argument types for callers.
  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<keyof Events, Set<Listener>>();

  return {
    on(name, listener) {
      let set = listeners.get(name);
      if (!set) listeners.set(name, (set = new Set()));
      const stored = listener as unknown as Listener;
      set.add(stored);
      return () => {
        set.delete(stored);
      };
    },

    emit(name, ...args) {
      const set = listeners.get(name);
      if (!set) return;
      // A copy, so listeners added or removed during this emit do not change who is called.
      for (const listener of [...set]) {
        try {
          listener(...args);
        } catch (error) {
          queueMicrotask(() => {
            throw error;
          });
        }
      }
    },

    clear() {
      listeners.clear();
    },
  };
}
