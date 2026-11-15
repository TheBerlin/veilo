// setup.ts: runs before every browser test file. An agreed exception to the test mirror, as in
// the other packages.

import { afterEach } from "vitest";

// Each test builds its own markup; removing it disconnects the elements, which destroys them.
afterEach(() => {
  document.body.replaceChildren();
});
