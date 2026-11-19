// app.tsx: root of the website: the header and the home page.

import { Hero } from "./home/hero.tsx";
import { HowItWorks } from "./home/how-it-works.tsx";
import { SiteNav } from "./site/site-nav.tsx";

/**
 * The website's root component.
 *
 * @returns The page: a skip link target is the `main` landmark.
 */
export function App() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <HowItWorks />
      </main>
    </>
  );
}
