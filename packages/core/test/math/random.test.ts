// Tests for src/math/random.ts: repeatability, range and spread of the generator and the hash.

import { describe, expect, it } from "vitest";
import { createRandom, DEFAULT_SEED, hash } from "../../src/math/random.ts";

const take = (count: number, seed?: number) => {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => random());
};

/** Fails when any of the buckets holds far more or far less than its even share. */
const expectEvenSpread = (values: number[], buckets: number) => {
  const counts = new Array<number>(buckets).fill(0);
  for (const value of values) {
    const bucket = Math.floor(value * buckets);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
  }
  const share = values.length / buckets;
  for (const count of counts) {
    expect(count).toBeGreaterThan(share * 0.85);
    expect(count).toBeLessThan(share * 1.15);
  }
};

describe("createRandom", () => {
  it("uses the spec's seed of 7 by default", () => {
    expect(DEFAULT_SEED).toBe(7);
    expect(take(20)).toEqual(take(20, 7));
  });

  // Pinned on purpose. Changing these values changes every saved frame and needs a decision.
  it("keeps its exact sequence for seed 7", () => {
    expect(take(5)).toEqual([
      0.011704753153026104, 0.06195825757458806, 0.97690763277933, 0.6990287057124078,
      0.5214452685322613,
    ]);
  });

  it("gives each generator its own state", () => {
    const first = createRandom();
    const second = createRandom();
    const firstValue = first();
    first();
    first();
    expect(second()).toBe(firstValue);
  });

  it("gives different seeds different sequences", () => {
    expect(take(5, 8)).not.toEqual(take(5, 7));
  });

  it("stays from 0 up to but not including 1", () => {
    for (const value of take(10_000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("spreads evenly", () => {
    expectEvenSpread(take(10_000), 10);
  });
});

describe("hash", () => {
  // Pinned on purpose, for the same reason as the generator sequence.
  it("keeps its exact values", () => {
    expect(hash(0, 0, 0)).toBe(0.3673305166885257);
    expect(hash(1, 2, 3)).toBe(0.3062080356758088);
    expect(hash(6, 30, 17)).toBe(0.8456077883020043);
  });

  it("gives equal inputs equal results", () => {
    expect(hash(3, 14, 15)).toBe(hash(3, 14, 15));
  });

  it("responds to each input and to their order", () => {
    const base = hash(1, 2, 3);
    expect(hash(9, 2, 3)).not.toBe(base);
    expect(hash(1, 9, 3)).not.toBe(base);
    expect(hash(1, 2, 9)).not.toBe(base);
    expect(hash(3, 2, 1)).not.toBe(base);
  });

  // The shape of real scramble input: few elements and characters, ticks in order.
  const inputs = Array.from({ length: 7 * 40 * 25 }, (_, index) =>
    hash(index % 7, Math.floor(index / 7) % 40, Math.floor(index / 280)),
  );

  it("stays from 0 up to but not including 1", () => {
    for (const value of inputs) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("spreads small neighbouring inputs evenly", () => {
    expectEvenSpread(inputs, 10);
  });

  it("changes the picked character from tick to tick", () => {
    const picks = Array.from({ length: 200 }, (_, tick) => Math.floor(hash(2, 5, tick) * 20));
    const changes = picks.filter((pick, tick) => tick > 0 && pick !== picks[tick - 1]);
    expect(changes.length).toBeGreaterThan(170);
  });
});
