// setup.ts: runs before every browser test file. An agreed exception to the test mirror, as in
// the other packages.

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only cleans up on its own when test globals are on, which they are not here.
// The other tests build plain markup and remove it themselves.
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});
