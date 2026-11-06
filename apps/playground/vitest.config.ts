import { defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// State tests are plain data and run in Node. Browser tests join when the stage lands.
export default defineProject(mergeConfig(shared, { test: { name: "playground" } }));
