import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { App } from "../src/app.tsx";

afterEach(async () => {
  history.replaceState(null, "", "/");
  await page.viewport(414, 896);
});

describe("App", () => {
  it("renders the page with one level-one heading", () => {
    render(<App />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("shows the gallery at /gallery, with its title and its link in the header marked as current", async () => {
    // A wide screen, where the header shows its links (a phone puts them in a menu).
    await page.viewport(1440, 900);
    history.replaceState(null, "", "/gallery");
    render(<App />);
    // The gallery's code loads on demand.
    expect((await screen.findAllByRole("heading", { level: 1 })).map((h) => h.textContent)).toEqual(
      ["Gallery."],
    );
    expect(document.title).toBe("Gallery · Veilo UI");
    const current = screen
      .getAllByRole("link", { name: "Gallery" })
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
  });

  it("shows the home page at an address it does not know", () => {
    history.replaceState(null, "", "/no-such-page");
    render(<App />);
    expect(document.title).toBe("Veilo UI: skeleton loaders and reveal animations");
    expect(screen.queryByRole("heading", { name: "Gallery." })).toBeNull();
  });

  it("the home page's links to the gallery go to /gallery", () => {
    render(<App />);
    const hrefs = screen
      .getAllByRole("link", { name: /Browse (gallery|presets)|^Gallery$/ })
      .map((link) => new URL((link as HTMLAnchorElement).href).pathname);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toBe("/gallery");
  });
});
