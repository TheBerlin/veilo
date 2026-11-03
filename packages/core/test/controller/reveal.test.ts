// Tests for src/controller/reveal.ts, on a real card in Chromium with a fake clock.
// Runs in Chromium (see BROWSER_TESTS in vitest.config.ts).

import { afterEach, describe, expect, it, vi } from "vitest";
import { createReveal, type RevealOptions, type RevealState } from "../../src/controller/reveal.ts";
import { clamp, cssNumber } from "../../src/math/number.ts";
import { fakeScheduler } from "../support/scheduler.ts";

/** Linear easing and a 1 s reveal, so progress p is reached after p x 1000 ms. */
const BASE = { rDur: 1, rEase: "linear", hold: 0.5, imageFx: "dots", textFx: "scramble" };

/** Lets pending promise callbacks run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Builds a product card: a photo in a plain wrapper, a heading, a price and a button. */
function card() {
  const root = document.createElement("article");
  root.style.cssText = "width: 200px; font: 16px monospace; color: rgb(20, 20, 20);";
  const media = document.createElement("div");
  // Padding stops the photo's top margin from collapsing through the wrapper.
  media.style.paddingTop = "5px";
  const photo = document.createElement("canvas");
  photo.width = 100;
  photo.height = 100;
  // The margin puts the photo away from its wrapper's corner, so placement is really tested.
  photo.style.cssText = "display: block; width: 100px; height: 100px; margin: 7px 0 0 11px;";
  const context = photo.getContext("2d")!;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, 100, 100);
  context.fillStyle = "#000";
  context.fillRect(0, 0, 50, 100);
  media.append(photo);
  const heading = document.createElement("h3");
  heading.textContent = "MCHOSE L7 Pro";
  const price = document.createElement("p");
  price.textContent = "$59.99";
  const button = document.createElement("button");
  const label = document.createElement("span");
  label.textContent = "Buy now";
  button.append(label);
  root.append(media, heading, price, button);
  document.body.append(root);
  return {
    root,
    media,
    photo,
    heading,
    label,
    button,
    targets: { image: photo, text: [heading, price, label], button },
  };
}

/** Creates a reveal on a fresh card with a fake clock. */
function setup(settings: object = {}, options: RevealOptions = {}) {
  const parts = card();
  const time = fakeScheduler(10);
  const before = parts.root.outerHTML;
  const reveal = createReveal(
    parts.targets,
    { ...BASE, ...settings },
    {
      scheduler: time.scheduler,
      reducedMotion: false,
      ...options,
    },
  );
  return { ...parts, time, reveal, before };
}

/** Counts canvas pixels with any alpha. */
function inked(canvas: HTMLCanvasElement) {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if ((data[i] as number) > 0) count++;
  return count;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createReveal setup", () => {
  it("changes nothing on the page until a method is called", async () => {
    const { root, reveal, before } = setup();
    await reveal.ready;
    expect(root.outerHTML).toBe(before);
    expect([reveal.state, reveal.progress]).toEqual(["idle", 0]);
  });
});

describe("play", () => {
  it("plays to the end, reports progress, state and complete, and restores the page", async () => {
    const { root, reveal, before, time } = setup();
    const states: RevealState[] = [];
    const progress: number[] = [];
    let completes = 0;
    reveal.on("state", (s) => states.push(s));
    reveal.on("progress", (p) => progress.push(p));
    reveal.on("complete", () => completes++);

    const done = reveal.play();
    await flush();
    time.advance(1100);
    expect(await done).toBe(true);
    expect(states).toEqual(["revealing", "revealed"]);
    expect(progress[0]).toBe(0);
    expect(progress.at(-1)).toBe(1);
    expect(progress.every((p, i) => i === 0 || p >= progress[i - 1]!)).toBe(true);
    expect(completes).toBe(1);
    expect(root.outerHTML).toBe(before);
    expect(time.pending()).toBe(0);
  });

  it("restarts on a second play, and the first one resolves false", async () => {
    const { reveal, time } = setup();
    const first = reveal.play();
    await flush();
    time.advance(500);
    const second = reveal.play();
    expect(await first).toBe(false);
    await flush();
    expect(reveal.progress).toBe(0);
    time.advance(1100);
    expect(await second).toBe(true);
  });

  it("jumps straight to the end with reduced motion", async () => {
    const { root, reveal, before, time } = setup({}, { reducedMotion: true });
    const done = reveal.play();
    await flush();
    expect(await done).toBe(true);
    expect(reveal.state).toBe("revealed");
    expect(root.outerHTML).toBe(before);
    expect(time.time).toBe(0);
  });
});

describe("pause, resume and seek", () => {
  it("pauses and resumes where it left off", async () => {
    const { reveal, time } = setup();
    void reveal.play();
    await flush();
    time.advance(300);
    reveal.pause();
    time.advance(1000);
    expect(reveal.progress).toBeCloseTo(0.3, 10);
    reveal.resume();
    time.advance(200);
    expect(reveal.progress).toBeCloseTo(0.5, 10);
  });

  it("seeks to an exact frame and stops playback", async () => {
    const { reveal, time } = setup();
    const done = reveal.play();
    await flush();
    time.advance(200);
    reveal.seek(0.4);
    expect(await done).toBe(false);
    expect([reveal.state, reveal.progress]).toEqual(["revealing", 0.4]);
    time.advance(1000);
    expect(reveal.progress).toBe(0.4);
    expect(time.pending()).toBe(0);
  });

  it("drops a play that has not started yet when seek comes right after it", async () => {
    const { reveal, time } = setup();
    await reveal.ready;
    void reveal.play();
    reveal.seek(0.4);
    await flush();
    time.advance(500);
    expect([reveal.state, reveal.progress]).toEqual(["revealing", 0.4]);
  });

  it("restores the page when seeking to 1, and adds the layers again below 1", async () => {
    const { root, photo, reveal, before } = setup();
    await reveal.ready;
    reveal.seek(0.5);
    expect(photo.nextElementSibling).toBeInstanceOf(HTMLCanvasElement);
    reveal.seek(1);
    expect(reveal.state).toBe("revealed");
    expect(root.outerHTML).toBe(before);
    reveal.seek(0.5);
    expect(photo.nextElementSibling).toBeInstanceOf(HTMLCanvasElement);
  });
});

describe("grid image effect", () => {
  it("draws on a canvas laid exactly over the photo, hiding the photo until p = 0.8", async () => {
    const { media, photo, reveal } = setup();
    await reveal.ready;
    reveal.seek(0.5);
    const canvas = photo.nextElementSibling as HTMLCanvasElement;
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.getBoundingClientRect().toJSON()).toEqual(photo.getBoundingClientRect().toJSON());
    expect(media.style.position).toBe("relative");
    expect(photo.style.opacity).toBe("0");
    expect(inked(canvas)).toBeGreaterThan(0);

    reveal.seek(0.9);
    expect(photo.style.opacity).toBe("0.5");
  });

  it("samples once and draws every frame from the cached grid", async () => {
    const { photo, reveal } = setup();
    await reveal.ready;
    reveal.seek(0.5);
    const canvas = photo.nextElementSibling as HTMLCanvasElement;
    const first = inked(canvas);
    // Paint the photo white. Frames that sampled again would find nothing to draw.
    const context = photo.getContext("2d")!;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, photo.width, photo.height);
    reveal.seek(0.4);
    reveal.seek(0.5);
    expect(inked(canvas)).toBe(first);
    expect(first).toBeGreaterThan(0);
  });

  it("draws in --veilo-ink from the photo's wrapper", async () => {
    const { media, photo, reveal } = setup();
    media.style.setProperty("--veilo-ink", "rgb(255, 0, 0)");
    await reveal.ready;
    reveal.seek(0.7);
    const canvas = photo.nextElementSibling as HTMLCanvasElement;
    const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    const solid = data.findIndex((value, i) => i % 4 === 3 && value === 255);
    expect([...data.slice(solid - 3, solid + 1)]).toEqual([255, 0, 0, 255]);
  });

  it("samples a real <img> once it has loaded", async () => {
    const { media, photo, label } = card();
    const img = document.createElement("img");
    img.src = photo.toDataURL();
    img.style.cssText = "display: block; width: 100px; height: 100px;";
    photo.replaceWith(img);
    const reveal = createReveal({ image: img, text: [label] }, BASE, {
      scheduler: fakeScheduler().scheduler,
      reducedMotion: false,
    });
    await reveal.ready;
    reveal.seek(0.5);
    const canvas = img.nextElementSibling as HTMLCanvasElement;
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(inked(canvas)).toBeGreaterThan(0);
    expect(media.contains(canvas)).toBe(true);
  });

  it("shows a broken image as it is and still reveals the text", async () => {
    const { photo, label } = card();
    const img = document.createElement("img");
    img.src = "data:image/png;base64,broken";
    photo.replaceWith(img);
    const time = fakeScheduler(10);
    const reveal = createReveal({ image: img, text: [label] }, BASE, {
      scheduler: time.scheduler,
      reducedMotion: false,
    });
    await reveal.ready;
    const done = reveal.play();
    await flush();
    time.advance(1100);
    expect(await done).toBe(true);
    expect(img.nextElementSibling).toBeNull();
  });
});

describe("other image effects", () => {
  it("styles the photo and restores its own inline styles at the end", async () => {
    const { photo, reveal } = setup({ imageFx: "blur" });
    photo.style.opacity = "0.9";
    await reveal.ready;
    reveal.seek(0.5);
    expect([photo.style.opacity, photo.style.filter, photo.style.transform]).toEqual([
      "0.5",
      "blur(9px)",
      "scale(1.03)",
    ]);
    expect(photo.nextElementSibling).toBeNull();
    reveal.seek(1);
    expect(photo.getAttribute("style")).toBe(
      "display: block; width: 100px; height: 100px; margin: 7px 0px 0px 11px; opacity: 0.9;",
    );
  });
});

describe("text and button", () => {
  it("covers each text with an aria-hidden overlay mid-reveal and keeps the real text", async () => {
    const { heading, reveal } = setup();
    await reveal.ready;
    reveal.seek(0.2);
    const overlay = heading.querySelector("span[aria-hidden='true']")!;
    expect(overlay).not.toBeNull();
    expect(Array.from(overlay.textContent!)).toHaveLength("MCHOSE L7 Pro".length);
    expect(heading.firstChild!.textContent).toBe("MCHOSE L7 Pro");
    reveal.seek(1);
    expect(heading.querySelector("span")).toBeNull();
  });

  it("styles text for rise without overlays", async () => {
    const { heading, reveal } = setup({ textFx: "rise" });
    await reveal.ready;
    reveal.seek(0);
    expect(heading.querySelector("span")).toBeNull();
    expect(heading.style.opacity).toBe("0");
  });

  it("fades the button background with its label", async () => {
    const { button, reveal } = setup();
    await reveal.ready;
    reveal.seek(0.6);
    // The label is text element 2 of 3: its window starts at 0.3 and lasts 0.55.
    expect(button.style.getPropertyValue("--veilo-bg-a")).toBe(
      cssNumber(clamp((0.6 - 0.3) / 0.55)),
    );
    reveal.seek(1);
    expect(button.hasAttribute("style")).toBe(false);
  });

  it("reveals text without an image", async () => {
    const { heading } = card();
    const reveal = createReveal(
      { text: [heading] },
      { ...BASE, textFx: "fade" },
      {
        scheduler: fakeScheduler().scheduler,
        reducedMotion: false,
      },
    );
    await reveal.ready;
    reveal.seek(0.275);
    expect(heading.style.opacity).toBe("0.5");
  });
});

describe("sequence", () => {
  it("shows loading for hold seconds, then reveals", async () => {
    const { root, photo, reveal, time } = setup({}, {});
    const states: RevealState[] = [];
    reveal.on("state", (s) => states.push(s));
    reveal.playSequence();
    expect(reveal.state).toBe("loading");
    expect(photo.hasAttribute("data-veilo-skeleton")).toBe(true);

    time.advance(500);
    await flush();
    expect(reveal.state).toBe("revealing");
    expect(photo.hasAttribute("data-veilo-skeleton")).toBe(false);
    time.advance(1100);
    expect(states).toEqual(["loading", "revealing", "revealed"]);
    expect(root.querySelector("[data-veilo-skeleton]")).toBeNull();
  });

  it("marks the busy region while loading", () => {
    const { root, reveal } = setup({}, { busy: document.body });
    void root;
    reveal.showLoading();
    expect(document.body.getAttribute("aria-busy")).toBe("true");
    reveal.seek(1);
    expect(document.body.hasAttribute("aria-busy")).toBe(false);
  });

  it("loops 900 ms after each reveal", async () => {
    const { reveal, time } = setup();
    reveal.playSequence({ loop: true });
    time.advance(500);
    await flush();
    time.advance(1000);
    expect(reveal.state).toBe("revealed");
    time.advance(890);
    expect(reveal.state).toBe("revealed");
    time.advance(10);
    expect(reveal.state).toBe("loading");
  });

  it("holds the skeleton with showLoading, cancelling playback", async () => {
    const { reveal, time, heading } = setup();
    const done = reveal.play();
    await flush();
    time.advance(300);
    reveal.showLoading();
    expect(await done).toBe(false);
    time.advance(2000);
    expect(reveal.state).toBe("loading");
    expect(heading.querySelector("span")).toBeNull();
    expect(heading.hasAttribute("data-veilo-skeleton")).toBe(true);
  });
});

describe("visibility", () => {
  /** Moves the card off screen or back. */
  const place = (root: HTMLElement, onScreen: boolean) => {
    Object.assign(root.style, { position: "fixed", left: "0", top: onScreen ? "0" : "-10000px" });
  };

  it("pauses off screen and continues when back", async () => {
    const { root, reveal, time } = setup();
    place(root, false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    void reveal.play();
    await flush();
    time.advance(500);
    expect(reveal.progress).toBe(0);
    place(root, true);
    await vi.waitFor(() => {
      time.advance(10);
      expect(reveal.progress).toBeGreaterThan(0);
    });
  });

  it("pauses when it leaves the screen mid-reveal", async () => {
    const { root, reveal, time } = setup();
    place(root, true);
    void reveal.play();
    await flush();
    time.advance(300);
    place(root, false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    time.advance(500);
    expect(reveal.progress).toBeCloseTo(0.3, 10);
  });

  it("keeps a reveal you paused paused when it comes back on screen", async () => {
    const { root, reveal, time } = setup();
    place(root, true);
    void reveal.play();
    await flush();
    time.advance(200);
    reveal.pause();
    place(root, false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    place(root, true);
    await new Promise((resolve) => setTimeout(resolve, 100));
    time.advance(500);
    expect(reveal.progress).toBeCloseTo(0.2, 10);
  });
});

describe("destroy", () => {
  it("cancels playback and restores the page exactly", async () => {
    const { root, reveal, before, time } = setup();
    const styles = document.head.children.length;
    const done = reveal.play();
    await flush();
    time.advance(400);
    reveal.destroy();
    expect(await done).toBe(false);
    expect(root.outerHTML).toBe(before);
    expect(document.head.children).toHaveLength(styles);
    expect(time.pending()).toBe(0);
  });

  it("restores the page from the loading state", () => {
    const { root, reveal, before } = setup({}, { busy: document.body });
    reveal.playSequence({ loop: true });
    reveal.destroy();
    expect(root.outerHTML).toBe(before);
    expect(document.body.hasAttribute("aria-busy")).toBe(false);
  });

  it("makes every later call do nothing", async () => {
    const { root, reveal, before, time } = setup();
    reveal.destroy();
    reveal.destroy();
    expect(await reveal.play()).toBe(false);
    reveal.seek(0.5);
    reveal.showLoading();
    reveal.playSequence();
    time.advance(2000);
    await flush();
    expect(root.outerHTML).toBe(before);
  });

  it("stops listeners", async () => {
    const { reveal } = setup();
    const listener = vi.fn();
    reveal.on("progress", listener);
    await reveal.ready;
    reveal.destroy();
    reveal.seek(0.5);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("authored markup", () => {
  it("restores markup written as HTML exactly, style text included", async () => {
    document.body.innerHTML =
      '<article><div><canvas width="20" height="20" style="width:80px;height:80px"></canvas></div>' +
      '<h3 style="margin:0">Title</h3><button style="border:0"><span>Buy</span></button></article>';
    const root = document.body.firstElementChild as HTMLElement;
    const before = document.body.innerHTML;
    const [canvas, title, label, button] = ["canvas", "h3", "span", "button"].map(
      (s) => root.querySelector(s) as HTMLElement,
    );
    const reveal = createReveal(
      { image: canvas as HTMLCanvasElement, text: [title!, label!], button },
      BASE,
      { scheduler: fakeScheduler().scheduler, reducedMotion: false, busy: root },
    );
    reveal.showLoading();
    await reveal.ready;
    reveal.seek(0.5);
    reveal.destroy();
    expect(document.body.innerHTML).toBe(before);
  });
});

describe("container with slot markup", () => {
  it("reveals the slots it finds and restores the page exactly", async () => {
    document.body.innerHTML =
      '<article><span data-veilo-slot="badge">New</span>' +
      '<div><canvas data-veilo-slot="photo" width="20" height="20" style="width:80px;height:80px"></canvas></div>' +
      '<h3 data-veilo-slot="title">MCHOSE L7 Pro</h3>' +
      '<button data-veilo-slot="buy"><span data-veilo-slot="label">Buy</span></button></article>';
    const card = document.body.firstElementChild as HTMLElement;
    const before = document.body.innerHTML;
    const time = fakeScheduler(10);
    const reveal = createReveal(
      card,
      { settings: BASE, slots: { badge: { role: "block" } } },
      { scheduler: time.scheduler, reducedMotion: false, warnings: false },
    );

    reveal.showLoading();
    expect(card.getAttribute("aria-busy")).toBe("true");
    expect(card.querySelectorAll("[data-veilo-skeleton]")).toHaveLength(5);

    await reveal.ready;
    reveal.seek(0.5);
    expect(card.querySelector("canvas + canvas")).not.toBeNull();
    expect(card.querySelector("h3 > span[aria-hidden]")).not.toBeNull();
    expect(card.querySelector("button")!.style.getPropertyValue("--veilo-bg-a")).not.toBe("");
    // A block slot gets the skeleton but no reveal effect.
    expect(card.querySelector("[data-veilo-slot=badge] > span")).toBeNull();

    const done = reveal.play();
    await flush();
    time.advance(1100);
    expect(await done).toBe(true);
    expect(document.body.innerHTML).toBe(before);
  });
});
