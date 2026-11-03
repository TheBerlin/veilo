// random.ts: seeded random generator and deterministic hash, so frames are repeatable.
// Layer 0 (pure). Must not import DOM code.

/** The spec's seed for cell order, which makes every run identical. */
export const DEFAULT_SEED = 7;

/** Returns the next random number, from 0 up to but not including 1. */
export type RandomGenerator = () => number;

const UINT32_RANGE = 2 ** 32;

/**
 * Creates a seeded generator (mulberry32). Only integer operations are used, so the
 * sequence is the same in every browser and on every machine.
 *
 * @param seed - The starting state, truncated to a 32-bit integer.
 * @returns A generator with its own state. Each call advances that state only.
 */
export function createRandom(seed: number = DEFAULT_SEED): RandomGenerator {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

/**
 * Hashes three integers to a number. The scramble uses it instead of a generator, because
 * a frame must not depend on the frames before it when the user scrubs.
 *
 * @param a - First integer, such as the element index.
 * @param b - Second integer, such as the character index.
 * @param c - Third integer, such as the time tick.
 * @returns A number from 0 up to but not including 1. Equal inputs give equal results.
 */
export function hash(a: number, b: number, c: number): number {
  // FNV-1a over the three values.
  let mixed = Math.imul(0x811c9dc5 ^ a, 0x01000193);
  mixed = Math.imul(mixed ^ b, 0x01000193);
  mixed = Math.imul(mixed ^ c, 0x01000193);
  // Finalizer from MurmurHash3. FNV alone spreads small neighbouring inputs poorly.
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b);
  mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
  return ((mixed ^ (mixed >>> 16)) >>> 0) / UINT32_RANGE;
}
