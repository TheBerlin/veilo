// Tests for src/use-reveal.ts, in Chromium.

import type { Reveal } from "@veilo-ui/core";
import { defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";
import { useReveal } from "../src/use-reveal.ts";
import { clock, mountAttached } from "./support/mount.ts";

/**
 * A component that uses the composable and reports each reveal it makes.
 *
 * @param seen - Receives every reveal the composable creates, in order.
 * @param time - The clock options for core.
 * @returns The component, and the settings ref that drives its effect.
 */
function harness(seen: Reveal[], time: ReturnType<typeof clock>) {
  const settings = ref({ rDur: 1 });
  const Probe = defineComponent({
    setup() {
      const { el, reveal, state } = useReveal(() => ({ settings: settings.value }), time.options);
      return () => {
        if (reveal.value && seen[seen.length - 1] !== reveal.value) seen.push(reveal.value);
        return h("div", { ref: el, "data-state": state.value }, [
          h("p", { "data-veilo-slot": "line" }, "A line of text"),
        ]);
      };
    },
  });
  return { Probe, settings };
}

describe("useReveal", () => {
  it("makes a reveal when the element mounts and destroys it on unmount", async () => {
    const seen: Reveal[] = [];
    const time = clock();
    const { Probe } = harness(seen, time);
    const wrapper = mountAttached(Probe);
    await nextTick();
    await nextTick();
    expect(seen).toHaveLength(1);
    const element = wrapper.element as HTMLElement;
    seen[0]!.showLoading();
    expect(element.getAttribute("aria-busy")).toBe("true");
    wrapper.unmount();
    element.removeAttribute("data-v-app");
    expect(element.hasAttribute("aria-busy")).toBe(false);
    expect(time.time.pending()).toBe(0);
  });

  it("rebuilds only when the effect really changes", async () => {
    const seen: Reveal[] = [];
    const time = clock();
    const { Probe, settings } = harness(seen, time);
    mountAttached(Probe);
    await nextTick();
    await nextTick();
    expect(seen).toHaveLength(1);
    // A new but equal object does nothing.
    settings.value = { rDur: 1 };
    await nextTick();
    await nextTick();
    expect(seen).toHaveLength(1);
    settings.value = { rDur: 2 };
    await nextTick();
    await nextTick();
    await nextTick();
    expect(seen).toHaveLength(2);
  });

  it("follows the reveal's state", async () => {
    const seen: Reveal[] = [];
    const time = clock();
    const { Probe } = harness(seen, time);
    const wrapper = mountAttached(Probe);
    await nextTick();
    await nextTick();
    expect(wrapper.element.getAttribute("data-state")).toBe("idle");
    seen[0]!.showLoading();
    await nextTick();
    expect(wrapper.element.getAttribute("data-state")).toBe("loading");
  });
});
