// app.tsx: root of the website: the header, the page for the current address and the footer.

import { useEffect } from "react";
import { GalleryPage } from "./gallery/gallery-page.tsx";
import { FinalCta } from "./home/final-cta.tsx";
import { GalleryPreview } from "./home/gallery-preview.tsx";
import { Hero } from "./home/hero.tsx";
import { HowItWorks } from "./home/how-it-works.tsx";
import { WhyUseful } from "./home/why-useful.tsx";
import { App as Playground } from "./playground/app.tsx";
import { GALLERY_URL, PLAYGROUND_URL } from "./site/links.ts";
import { usePath } from "./site/router.tsx";
import { SiteFooter } from "./site/site-footer.tsx";
import { SiteNav } from "./site/site-nav.tsx";

/** The browser tab title of each page. "Veilo UI" keeps it apart from an unrelated "Veilo". */
const TITLES: Record<string, string> = {
  "/": "Veilo UI: skeleton loaders and reveal animations",
  [PLAYGROUND_URL]: "Playground · Veilo UI",
  [GALLERY_URL]: "Gallery · Veilo UI",
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
  // An address the site does not know shows the home page.
  const page = path === PLAYGROUND_URL || path === GALLERY_URL ? path : "/";
  useEffect(() => {
    document.title = TITLES[page]!;
  }, [page]);
  // The playground is a full-screen tool: no site header or footer, only its own way back home.
  const tool = page === PLAYGROUND_URL;
  return (
    <>
      {tool ? null : <SiteNav path={path} />}
      <main id="main" tabIndex={-1}>
        {tool ? (
          <Playground />
        ) : page === GALLERY_URL ? (
          <GalleryPage />
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
      {tool ? null : <SiteFooter />}
    </>
  );
}
