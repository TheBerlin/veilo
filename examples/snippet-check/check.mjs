// check.mjs: runs every code snippet of the playground's Export tab, for every card layout.
// It builds the snippets with the playground's own builders, packs the @veilo packages as a
// publish would, installs them into a temp app outside the workspace, typechecks the React
// snippets with strict TypeScript, builds each snippet as its own page and opens every page in
// Chromium. A snippet passes when its card goes from the skeleton to the revealed real content
// with the user's text, at the chosen width, with no console errors and no request that leaves
// the page (except the CDN script, which is served from the packed package).
// Runs as this example's `e2e` script (Turbo builds the packages first). The playground's
// snippet builders are plain TypeScript, which Node runs directly.

// The functions passed to Playwright's `evaluate` and `waitForFunction` run in the page, so they
// use browser globals, which this Node script otherwise does not have.
/* global window, document, customElements, MutationObserver */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { serve } from "../element-demo/serve.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const playground = join(repo, "apps/website/src/playground");
const {
  angularSnippet,
  cdnSnippet,
  elementSnippet,
  reactSnippet,
  svelteSnippet,
  vanillaSnippet,
  vueSnippet,
} = await import(pathToFileURL(join(playground, "export/snippets.ts")).href);
const { CARD_LAYOUTS, LAYOUT_IDS } = await import(
  pathToFileURL(join(playground, "stage/card-layouts.ts")).href
);

/** The packages a user installs for these snippets, as workspace folders. */
const PACKAGES = ["core", "presets", "react", "vue", "svelte", "angular", "element"];
// SNIPPET_PORT picks another port where 4177 is reserved (Windows keeps some ranges back).
const PORT = Number(process.env.SNIPPET_PORT ?? 4177);
const ORIGIN = `http://localhost:${PORT}`;
/** The address the CDN snippet loads its script from; the check serves the packed file there. */
const CDN_URL = "https://cdn.jsdelivr.net/npm/@veilo-ui/element";

/**
 * Settings per layout, so every image effect and several text effects run. Hold and duration are
 * short, to keep the check quick. These cover grid effects (dots, hex, binary) and several text effects; the inbox has no picture.
 */
const SETTINGS = {
  music: { imageFx: "dots", origin: "left", textFx: "scramble" },
  video: { imageFx: "hex", origin: "center", textFx: "typewriter" },
  inbox: { imageFx: "binary", origin: "top", textFx: "rise" },
};
const GRID_EFFECTS = new Set(["dots", "hex", "binary", "mosaic"]);
/** A text with the characters that break HTML and JSX if they are not escaped. */
const SPECIAL_TEXT = "Quiet <mouse> & {co}";
/** A width other than the default, for one layout. */
const WIDTHS = { video: 500 };

const work = mkdtempSync(join(tmpdir(), "veilo-snippet-check-"));
const packs = join(work, "packs");
const app = join(work, "app");
mkdirSync(packs);
mkdirSync(join(app, "src"), { recursive: true });
mkdirSync(join(app, "public"));

/**
 * Runs a command and fails the check when it fails. Output is shown as it runs.
 *
 * @param command - The program.
 * @param args - Its arguments.
 * @param cwd - The folder to run it in.
 */
function run(command, args, cwd) {
  // On Windows, npm and pnpm are .cmd scripts, which need a shell.
  execFileSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
}

/**
 * Wraps snippet text in a minimal HTML page, as a user would paste it into theirs.
 *
 * @param name - The page title.
 * @param body - The snippet.
 * @returns The page.
 */
function page(name, body) {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<title>${name}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
}

// The cases: one page per snippet kind and layout.
const cases = [];
for (const layoutId of LAYOUT_IDS) {
  const layout = CARD_LAYOUTS[layoutId];
  const settings = { ...SETTINGS[layoutId], hold: 0.2, rDur: 0.8 };
  // The first editable part of the layout gets the tricky text.
  const texts = { [layout.texts[0].slot]: SPECIAL_TEXT };
  const width = WIDTHS[layoutId] ?? layout.width;
  const input = { layoutId, texts, width, settings };
  const expected = Object.fromEntries(
    layout.texts.map((part) => [part.slot, texts[part.slot] ?? part.text]),
  );
  const base = { layoutId, width, expected, grid: GRID_EFFECTS.has(settings.imageFx) };
  cases.push({ ...base, kind: "vanilla", html: vanillaSnippet(input) });
  cases.push({ ...base, kind: "element", html: elementSnippet(input) });
  cases.push({ ...base, kind: "cdn", html: cdnSnippet(input) });
  cases.push({ ...base, kind: "react", tsx: reactSnippet(input) });
  cases.push({ ...base, kind: "vue", sfc: vueSnippet(input) });
  cases.push({ ...base, kind: "svelte", svelte: svelteSnippet(input) });
  cases.push({ ...base, kind: "angular", ts: angularSnippet(input) });
}
for (const entry of cases) {
  entry.name = `${entry.kind}-${entry.layoutId}`;
  // The Angular snippets are one app (its own TypeScript and build), shown by a query.
  entry.url =
    entry.kind === "angular"
      ? `${ORIGIN}/angular/index.html?layout=${entry.layoutId}`
      : `${ORIGIN}/${entry.name}.html`;
}
// SNIPPET_ONLY=element-music,cdn-video runs just those pages, for debugging a failure.
const only = process.env.SNIPPET_ONLY?.split(",");
if (only) cases.splice(0, cases.length, ...cases.filter((entry) => only.includes(entry.name)));

let server;
let browser;
try {
  // 1. Pack: `pnpm pack` turns workspace:* into real versions, exactly as a publish would.
  for (const name of PACKAGES) {
    run("pnpm", ["pack", "--pack-destination", packs, "--silent"], join(repo, "packages", name));
  }
  const tarball = (name) => {
    const file = readdirSync(packs).find((entry) => entry.startsWith(`veilo-ui-${name}-`));
    if (!file) throw new Error(`no tarball for @veilo-ui/${name}`);
    return `file:${join(packs, file)}`;
  };

  // 2. The temp app: every snippet as its own page. React versions are the react-demo
  //    example's, so they are kept in one place.
  const reactDemo = JSON.parse(
    readFileSync(join(repo, "examples/react-demo/package.json"), "utf8"),
  );
  const local = Object.fromEntries(PACKAGES.map((name) => [`@veilo-ui/${name}`, tarball(name)]));
  const vueDemo = JSON.parse(readFileSync(join(repo, "examples/vue-demo/package.json"), "utf8"));
  // vue-tsc needs TypeScript 5 or 6 (it uses the compiler's JavaScript API), so every snippet,
  // the React ones too, is checked with the version the Vue demo uses.
  const svelteDemo = JSON.parse(
    readFileSync(join(repo, "examples/svelte-demo/package.json"), "utf8"),
  );
  const devDependencies = {
    ...reactDemo.devDependencies,
    "@sveltejs/vite-plugin-svelte": svelteDemo.devDependencies["@sveltejs/vite-plugin-svelte"],
    "svelte-check": svelteDemo.devDependencies["svelte-check"],
    "@vitejs/plugin-vue": vueDemo.devDependencies["@vitejs/plugin-vue"],
    "vue-tsc": vueDemo.devDependencies["vue-tsc"],
    typescript: vueDemo.devDependencies.typescript,
  };
  delete devDependencies.playwright;
  const pkg = {
    name: "veilo-snippet-check-app",
    private: true,
    type: "module",
    dependencies: {
      ...reactDemo.dependencies,
      vue: vueDemo.dependencies.vue,
      svelte: svelteDemo.dependencies.svelte,
      "@veilo-ui/core": local["@veilo-ui/core"],
      "@veilo-ui/react": local["@veilo-ui/react"],
      "@veilo-ui/vue": local["@veilo-ui/vue"],
      "@veilo-ui/svelte": local["@veilo-ui/svelte"],
      "@veilo-ui/element": local["@veilo-ui/element"],
    },
    devDependencies,
    // The packed packages ask for each other at versions not on npm yet: point every copy of
    // the internal packages at the local tarballs.
    overrides: local,
  };
  writeFileSync(join(app, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  writeFileSync(
    join(app, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "esnext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: ["vite/client"],
        },
        include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
        // vue-tsc cannot read .svelte files, and svelte-check cannot read .vue ones: each has
        // its own config.
        exclude: ["src/svelte-*"],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(app, "tsconfig.svelte.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "esnext",
          moduleResolution: "bundler",
          strict: true,
          noEmit: true,
          verbatimModuleSyntax: true,
          isolatedModules: true,
          skipLibCheck: false,
          types: ["svelte", "vite/client"],
        },
        include: ["src/svelte-*"],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(app, "svelte.config.js"),
    'import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";\n\nexport default { preprocess: vitePreprocess() };\n',
  );
  // Every page is a build input. `dedupe` as in the react-demo: one React for the app.
  const vitePages = cases.filter((entry) => entry.kind !== "angular");
  const inputs = vitePages.map((entry) => `"${entry.name}.html"`).join(", ");
  writeFileSync(
    join(app, "vite.config.js"),
    `import react from "@vitejs/plugin-react";\nimport vue from "@vitejs/plugin-vue";\nimport { svelte } from "@sveltejs/vite-plugin-svelte";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n  plugins: [react(), vue(), svelte()],\n  resolve: { dedupe: ["react", "react-dom", "vue", "svelte"] },\n  build: { rollupOptions: { input: [${inputs}] } },\n});\n`,
  );
  // The photo every snippet names. Browsers read an image by its bytes, not its extension.
  copyFileSync(join(playground, "stage/samples/figure.webp"), join(app, "public/photo.jpg"));
  for (const entry of cases) {
    if (entry.kind === "angular") continue; // built into its own app below
    if (entry.kind === "svelte") {
      // The Svelte snippet is a component file, used by a small host component that turns
      // `ready` on shortly after mount, as data arriving would.
      writeFileSync(join(app, "src", `${entry.name}.svelte`), `${entry.svelte}\n`);
      writeFileSync(
        join(app, "src", `${entry.name}-host.svelte`),
        `<script lang="ts">\n  import { onMount } from "svelte";\n  import Card from "./${entry.name}.svelte";\n\n  let ready = $state(false);\n  onMount(() => {\n    const timer = setTimeout(() => (ready = true), 300);\n    return () => clearTimeout(timer);\n  });\n</script>\n\n<Card {ready} />\n`,
      );
      writeFileSync(
        join(app, "src", `${entry.name}-main.ts`),
        `import { mount } from "svelte";\nimport Host from "./${entry.name}-host.svelte";\n\nmount(Host, { target: document.getElementById("root")! });\n`,
      );
      writeFileSync(
        join(app, `${entry.name}.html`),
        page(
          entry.name,
          `<div id="root"></div>\n<script type="module" src="/src/${entry.name}-main.ts"></script>`,
        ),
      );
      continue;
    }
    if (entry.kind === "vue") {
      // The Vue snippet is a component file, used by a small page that turns `ready` on shortly
      // after mount, as data arriving would.
      writeFileSync(join(app, "src", `${entry.name}.vue`), `${entry.sfc}\n`);
      writeFileSync(
        join(app, "src", `${entry.name}-main.ts`),
        `import { createApp, h, onMounted, ref } from "vue";\nimport Card from "./${entry.name}.vue";\n\ncreateApp({\n  setup() {\n    const ready = ref(false);\n    onMounted(() => setTimeout(() => (ready.value = true), 300));\n    return () => h(Card, { ready: ready.value });\n  },\n}).mount("#root");\n`,
      );
      writeFileSync(
        join(app, `${entry.name}.html`),
        page(
          entry.name,
          `<div id="root"></div>\n<script type="module" src="/src/${entry.name}-main.ts"></script>`,
        ),
      );
      continue;
    }
    if (entry.kind !== "react") {
      writeFileSync(join(app, `${entry.name}.html`), page(entry.name, entry.html));
      continue;
    }
    // The React snippet is a component file, used by a small page that turns `ready` on shortly
    // after mount, as data arriving would.
    writeFileSync(join(app, "src", `${entry.name}.tsx`), `${entry.tsx}\n`);
    writeFileSync(
      join(app, "src", `${entry.name}-main.tsx`),
      `import { useEffect, useState } from "react";\nimport { createRoot } from "react-dom/client";\nimport { Card } from "./${entry.name}";\n\nfunction App() {\n  const [ready, setReady] = useState(false);\n  useEffect(() => {\n    const timer = setTimeout(() => setReady(true), 300);\n    return () => clearTimeout(timer);\n  }, []);\n  return <Card ready={ready} />;\n}\n\ncreateRoot(document.getElementById("root")!).render(<App />);\n`,
    );
    writeFileSync(
      join(app, `${entry.name}.html`),
      page(
        entry.name,
        `<div id="root"></div>\n<script type="module" src="/src/${entry.name}-main.tsx"></script>`,
      ),
    );
  }

  // 3. Install with npm, as most users would; typecheck the React snippets; build every page.
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], app);
  // (vue-tsc has nothing to check when SNIPPET_ONLY leaves out every React and Vue page.)
  if (cases.some((entry) => entry.kind === "react" || entry.kind === "vue")) {
    run("npx", ["vue-tsc", "-p", "."], app);
  }
  if (cases.some((entry) => entry.kind === "svelte")) {
    run("npx", ["svelte-check", "--tsconfig", "./tsconfig.svelte.json"], app);
  }
  if (vitePages.length > 0) run("npx", ["vite", "build", "--logLevel", "warn"], app);
  mkdirSync(join(app, "dist"), { recursive: true });

  // The Angular snippets are one app of their own: Angular 22 needs TypeScript 6, which the
  // other frameworks' type checkers here cannot use. Every snippet is a component, compiled with
  // strict templates by `ng build` against the package, which was built with Angular 20, so this
  // is also the check that an app on a newer Angular links it.
  const angularPages = cases.filter((entry) => entry.kind === "angular");
  if (angularPages.length > 0) {
    const demo = join(repo, "examples/angular-demo");
    const ngApp = join(work, "ng-app");
    mkdirSync(join(ngApp, "src/snippets"), { recursive: true });
    for (const file of ["angular.json", "tsconfig.json", "tsconfig.app.json", "src/index.html"]) {
      copyFileSync(join(demo, file), join(ngApp, file));
    }
    writeFileSync(join(ngApp, "src/styles.css"), "");
    const ownNg = JSON.parse(readFileSync(join(demo, "package.json"), "utf8"));
    const ngDevDependencies = { ...ownNg.devDependencies };
    delete ngDevDependencies.playwright;
    writeFileSync(
      join(ngApp, "package.json"),
      `${JSON.stringify(
        {
          name: "veilo-snippet-check-ng-app",
          private: true,
          type: "module",
          dependencies: { ...ownNg.dependencies, "@veilo-ui/angular": local["@veilo-ui/angular"] },
          devDependencies: ngDevDependencies,
          overrides: local,
        },
        null,
        2,
      )}\n`,
    );
    // Each snippet is a file of its own. They all name their component `Card` with the selector
    // `app-card`, so the page gets a copy per layout with both made unique.
    const ids = angularPages.map((entry) => entry.layoutId);
    for (const entry of angularPages) {
      const unique = entry.ts
        .replace('selector: "app-card"', `selector: "app-card-${entry.layoutId}"`)
        .replace("export class Card ", `export class Card_${entry.layoutId} `);
      writeFileSync(join(ngApp, "src/snippets", `${entry.name}.ts`), `${unique}\n`);
    }
    const imports = angularPages
      .map((entry) => `import { Card_${entry.layoutId} } from "./snippets/${entry.name}";`)
      .join("\n");
    const switchCases = ids
      .map((id) => `      @case ("${id}") {\n        <app-card-${id} [ready]="ready()" />\n      }`)
      .join("\n");
    writeFileSync(
      join(ngApp, "src/main.ts"),
      `import { Component, provideZonelessChangeDetection, signal } from "@angular/core";\nimport { bootstrapApplication } from "@angular/platform-browser";\n${imports}\n\n@Component({\n  selector: "app-root",\n  imports: [${ids.map((id) => `Card_${id}`).join(", ")}],\n  template: \`\n    @switch (layout) {\n${switchCases}\n    }\n  \`,\n})\nclass Root {\n  protected readonly layout = new URLSearchParams(location.search).get("layout");\n  protected readonly ready = signal(false);\n  constructor() {\n    // Data arriving shortly after the page opens.\n    setTimeout(() => this.ready.set(true), 300);\n  }\n}\n\nbootstrapApplication(Root, { providers: [provideZonelessChangeDetection()] });\n`,
    );
    run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], ngApp);
    run("npx", ["ng", "build", "--base-href", "/angular/"], ngApp);
    cpSync(join(ngApp, "dist/browser"), join(app, "dist/angular"), { recursive: true });
    // The photo every snippet names, next to the page they are served from.
    copyFileSync(
      join(playground, "stage/samples/figure.webp"),
      join(app, "dist/angular/photo.jpg"),
    );
  }
  const cdnFile = join(
    app,
    "node_modules/@veilo-ui/element",
    JSON.parse(readFileSync(join(app, "node_modules/@veilo-ui/element/package.json"), "utf8"))
      .jsdelivr,
  );

  // 4. Serve the build and open every page like a visitor.
  server = serve(join(app, "dist"), PORT);
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  // The CDN address is answered from the packed package; the script needs a CORS header, as a
  // real CDN sends one. Anything else that leaves the page is an error, below.
  await context.route(CDN_URL, (route) =>
    route.fulfill({
      path: cdnFile,
      contentType: "text/javascript",
      headers: { "access-control-allow-origin": "*" },
    }),
  );
  // Notes what the engine does to the page, since a fast reveal can finish before a poll sees it.
  await context.addInitScript(() => {
    const seen = { engaged: false, canvas: false };
    window.__veiloSeen = seen;
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") seen.engaged = true;
        for (const node of record.addedNodes) {
          if (node.nodeName === "CANVAS") {
            seen.canvas = true;
            seen.engaged = true;
          } else if (node.nodeName === "SPAN" && node.getAttribute?.("aria-hidden") === "true") {
            seen.engaged = true;
          }
        }
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-busy", "data-veilo-skeleton", "style"],
    });
  });

  for (let attempt = 0; ; attempt++) {
    try {
      const probe = await context.newPage();
      await probe.goto(cases[0].url);
      await probe.close();
      break;
    } catch (error) {
      if (attempt > 50) throw error;
      await new Promise((done) => setTimeout(done, 200));
    }
  }

  const failures = [];
  for (const entry of cases) {
    const problems = [];
    const tab = await context.newPage();
    // Warnings are not failures, but they explain one (a layout the element could not read).
    const notes = [];
    tab.on("console", (message) => message.type() === "warning" && notes.push(message.text()));
    tab.on(
      "console",
      (message) => message.type() === "error" && problems.push(`console: ${message.text()}`),
    );
    tab.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
    tab.on("requestfailed", (request) => problems.push(`request failed: ${request.url()}`));
    tab.on("response", (response) => {
      if (response.status() >= 400) problems.push(`${response.status()}: ${response.url()}`);
      const origin = new URL(response.url()).origin;
      if (origin !== ORIGIN && response.url() !== CDN_URL) {
        problems.push(`left the page: ${response.url()}`);
      }
    });
    try {
      await tab.goto(entry.url);
      const card = tab.locator(".card");
      await card.waitFor();
      // The engine must start, then the card must settle: no busy flag, no skeleton, no grid
      // canvas left behind.
      await tab.waitForFunction(() => window.__veiloSeen.engaged, null, { timeout: 15_000 });
      await tab.waitForFunction(
        () => {
          const root = document.querySelector(".card");
          return (
            root &&
            root.getAttribute("aria-busy") === null &&
            root.querySelector("[data-veilo-skeleton], canvas") === null &&
            (!root.querySelector("img") || root.querySelector("img").complete)
          );
        },
        null,
        { timeout: 15_000 },
      );
      const seen = await tab.evaluate(() => window.__veiloSeen);
      if (entry.grid && !seen.canvas) problems.push("a grid effect drew no canvas");
      // The real content is back: the user's text in every part, the photo loaded, the width set.
      for (const [slot, text] of Object.entries(entry.expected)) {
        const actual = await card.locator(`[data-veilo-slot="${slot}"]`).first().textContent();
        if (actual !== text) problems.push(`slot ${slot}: "${actual}", expected "${text}"`);
      }
      // The inbox has no picture; the other layouts must have loaded theirs.
      if ((await card.locator("img").count()) > 0) {
        const photo = await card.locator("img").evaluate((img) => img.naturalWidth);
        if (photo === 0) problems.push("the photo did not load");
      }
      const box = await card.boundingBox();
      if (!box || Math.abs(box.width - entry.width) > 1) {
        problems.push(`width ${box?.width}, expected ${entry.width}`);
      }
    } catch (error) {
      problems.push(error.message.split("\n")[0]);
      // What the page looked like when it stalled, to tell "never started" from "never settled".
      const state = await tab
        .evaluate(() => {
          const root = document.querySelector(".card");
          return {
            defined: Boolean(customElements.get("veilo-reveal")),
            seen: window.__veiloSeen,
            busy: root?.getAttribute("aria-busy"),
            loading: root?.hasAttribute("loading"),
            skeletons: root?.querySelectorAll("[data-veilo-skeleton]").length,
            canvases: root?.querySelectorAll("canvas").length,
            imgComplete: root?.querySelector("img")?.complete,
          };
        })
        .catch(() => null);
      problems.push(`state: ${JSON.stringify(state)}`);
      if (notes.length > 0) problems.push(`warnings: ${notes.join(" | ")}`);
      problems.push(
        `html: ${(
          await tab
            .locator(".card")
            .evaluate((el) => el.outerHTML)
            .catch(() => "")
        ).slice(0, 700)}`,
      );
    }
    await tab.close();
    if (problems.length > 0) {
      failures.push(`${entry.name}\n  ${[...new Set(problems)].join("\n  ")}`);
      console.log(`FAIL ${entry.name}`);
    } else console.log(`ok   ${entry.name}`);
  }
  if (failures.length > 0) throw new Error(`snippets that do not run:\n${failures.join("\n")}`);
  console.log(`ok  example-snippet-check: ${cases.length} snippets install, typecheck and run`);
} finally {
  await browser?.close();
  server?.close();
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  } catch (error) {
    // A leftover temp folder must not hide the check's own result.
    console.warn(`could not remove ${work}: ${error.message}`);
  }
}
