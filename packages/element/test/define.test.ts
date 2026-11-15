// Tests for src/define.ts: registering the elements.

import { describe, expect, it } from "vitest";
import { defineVeiloElements, ELEMENT_TAGS } from "../src/define.ts";
import { VeiloSkeletonElement } from "../src/skeleton-element.ts";

describe("defineVeiloElements", () => {
  it("registers every tag, and a second call changes nothing", () => {
    defineVeiloElements();
    expect(customElements.get(ELEMENT_TAGS.skeleton)).toBe(VeiloSkeletonElement);
    expect(() => defineVeiloElements()).not.toThrow();
  });

  it("leaves a tag that is already taken as it is", () => {
    const registry = new CustomElementRegistry();
    class Other extends HTMLElement {}
    registry.define(ELEMENT_TAGS.skeleton, Other);
    defineVeiloElements(registry);
    expect(registry.get(ELEMENT_TAGS.skeleton)).toBe(Other);
  });
});
