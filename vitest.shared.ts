import { defineConfig } from "vitest/config";

/** Vitest settings shared by every package. */
export default defineConfig({
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    // Each test file imports what it uses, so tsconfig needs no global types.
    globals: false,
  },
});
