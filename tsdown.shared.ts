import type { UserConfig } from "tsdown";

/** tsdown settings shared by every publishable package. */
export const sharedOptions: UserConfig = {
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // Remove files left by a previous build so stale output is never published.
  clean: true,
};
