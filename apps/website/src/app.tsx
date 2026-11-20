// app.tsx: root of the website: the header, the page for the current address and the footer.

import { useEffect } from "react";
import { FinalCta } from "./home/final-cta.tsx";
import { GalleryPreview } from "./home/gallery-preview.tsx";
import { Hero } from "./home/hero.tsx";
import { HowItWorks } from "./home/how-it-works.tsx";
import { WhyUseful } from "./home/why-useful.tsx";
import { App as Playground } from "./playground/app.tsx";
import { PLAYGROUND_URL } from "./site/links.ts";
import { usePath } from "./site/router.tsx";
import { SiteFooter } from "./site/site-footer.tsx";
import { SiteNav } from "./site/site-nav.tsx";

/** The browser tab title of each page. "Veilo UI" keeps it apart from an unrelated "Veilo". */
const TITLES: Record<string, string> = {
  "/": "Veilo UI: skeleton loaders and reveal animations",
  [PLAYGROUND_URL]: "Playground · Veilo UI",
};

/**
 * The website's root component. The address picks the page; the header and the footer stay
 * mounted across pages, and the `main` landmark is the target of the skip link and of focus after
 * a navigation. An unknown address shows the home page.
 *
 * @returns The page.
 */
export function App() {
  const path = usePath();
  const playground = path === PLAYGROUND_URL;
  useEffect(() => {
    document.title = TITLES[playground ? PLAYGROUND_URL : "/"] ?? TITLES["/"]!;
  }, [playground]);
  return (
    <>
      <SiteNav path={path} />
      <main id="main" tabIndex={-1}>
        {playground ? (
          <Playground />
        ) : (
          <>
            <Hero />
            <HowItWorks />
            <WhyUseful />
            <GalleryPreview />
            <FinalCta />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
