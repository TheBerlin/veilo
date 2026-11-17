// Tests for src/index.ts, in Node: the export list is pinned, and the components render on a
// server, where there is no window and no element for core to work on.

import { renderToString } from "@vue/server-renderer";
import { createSSRApp, h } from "vue";
import { describe, expect, it } from "vitest";
import * as api from "../src/index.ts";

describe("@veilo/vue", () => {
  it("exports the two components and the composable, nothing else at run time", () => {
    expect(Object.keys(api).sort()).toEqual(["Reveal", "Skeleton", "useReveal"]);
  });

  it("renders the plain markup on the server, with no browser globals", async () => {
    expect(typeof window).toBe("undefined");
    const slot = () => [h("h2", { "data-veilo-slot": "title" }, "Title")];
    const reveal = await renderToString(
      createSSRApp({ render: () => h(api.Reveal, { ready: false, as: "article" }, slot) }),
    );
    expect(reveal).toBe('<article><h2 data-veilo-slot="title">Title</h2></article>');
    const skeleton = await renderToString(
      createSSRApp({ render: () => h(api.Skeleton, { loading: true, class: "card" }, slot) }),
    );
    expect(skeleton).toBe('<div class="card"><h2 data-veilo-slot="title">Title</h2></div>');
  });
});
