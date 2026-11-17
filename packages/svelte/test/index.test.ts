// Tests for src/index.ts, in Node: the export list is pinned, and the components render on a
// server, where there is no window and actions do not run.

import { createRawSnippet } from "svelte";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

const card = createRawSnippet(() => ({
  render: () => '<h2 data-veilo-slot="title">Title</h2>',
}));

describe("@veilo/svelte", () => {
  it("exports the two components and the two actions, nothing else at run time", () => {
    expect(Object.keys(api).sort()).toEqual(["Reveal", "Skeleton", "reveal", "skeleton"]);
  });

  it("renders the plain markup on the server, with no browser globals", () => {
    expect(typeof window).toBe("undefined");
    // The server marks hydration points with comments; the markup between them is what matters.
    const plain = (body: string) => body.replace(/<!--.*?-->/g, "");
    const reveal = render(api.Reveal, { props: { ready: false, as: "article", children: card } });
    expect(plain(reveal.body)).toContain(
      '<article><h2 data-veilo-slot="title">Title</h2></article>',
    );
    const skeleton = render(api.Skeleton, {
      props: { loading: true, class: "card", children: card },
    });
    expect(plain(skeleton.body)).toContain(
      '<div class="card"><h2 data-veilo-slot="title">Title</h2></div>',
    );
  });
});
