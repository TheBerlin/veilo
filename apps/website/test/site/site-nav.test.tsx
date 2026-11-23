// Tests for src/site/site-nav.tsx.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteNav } from "../../src/site/site-nav.tsx";
import { GALLERY_URL, GITHUB_URL, PLAYGROUND_URL } from "../../src/site/links.ts";

describe("SiteNav", () => {
  it("names the home link and carries the wordmark", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Veilo home" }).textContent).toBe("Veilo");
  });

  it("links to the playground, the gallery and GitHub", () => {
    render(<SiteNav />);
    // At the narrow test viewport the links wait behind the menu, so read them from the DOM.
    const hrefs = [...document.querySelectorAll("nav a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([PLAYGROUND_URL, GALLERY_URL, GITHUB_URL]);
  });

  it("has the theme switch", () => {
    render(<SiteNav />);
    expect(document.querySelector('[role="radiogroup"][aria-label="Theme"]')).toBeTruthy();
  });

  it("marks the page being shown as current", () => {
    render(<SiteNav path={PLAYGROUND_URL} />);
    const current = document.querySelectorAll('nav a[aria-current="page"]');
    expect([...current].map((a) => a.textContent)).toEqual(["Playground"]);
  });
});
