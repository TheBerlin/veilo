// Tests for src/dom/style.ts. Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it } from "vitest";
import { addStyle, computedValue } from "../../src/dom/style.ts";

afterEach(() => {
  document.body.replaceChildren();
});

describe("addStyle", () => {
  it("adds a working stylesheet to the head and removes it", () => {
    const element = document.createElement("div");
    element.className = "veilo-style-test";
    document.body.append(element);

    const remove = addStyle(".veilo-style-test { width: 37px; }");
    expect(getComputedStyle(element).width).toBe("37px");
    expect(document.head.lastElementChild?.textContent).toBe(".veilo-style-test { width: 37px; }");

    remove();
    expect(getComputedStyle(element).width).not.toBe("37px");
    remove();
  });

  it("adds the stylesheet to a shadow root when given one", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    inner.className = "x";
    root.append(inner);

    const remove = addStyle(".x { display: block; width: 21px; }", root);
    expect(getComputedStyle(inner).width).toBe("21px");
    remove();
    expect(root.querySelector("style")).toBeNull();
  });

  it("writes the CSS as text, never as markup", () => {
    const remove = addStyle("</style><img src=x>");
    const style = document.head.lastElementChild!;
    expect(style.children).toHaveLength(0);
    expect(style.textContent).toBe("</style><img src=x>");
    remove();
  });
});

describe("computedValue", () => {
  it("reads inherited custom properties and normal properties, trimmed", () => {
    const parent = document.createElement("div");
    parent.style.setProperty("--veilo-ink", "  #123456 ");
    const child = document.createElement("span");
    child.style.color = "rgb(1, 2, 3)";
    parent.append(child);
    document.body.append(parent);
    expect(computedValue(child, "--veilo-ink")).toBe("#123456");
    expect(computedValue(child, "color")).toBe("rgb(1, 2, 3)");
  });

  it("returns an empty string for a custom property that is not set", () => {
    const element = document.createElement("div");
    document.body.append(element);
    expect(computedValue(element, "--veilo-ink")).toBe("");
  });
});
