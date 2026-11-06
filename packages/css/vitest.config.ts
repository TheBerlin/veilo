import { defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Everything here runs in Node: the package has no DOM or canvas code.
export default defineProject(mergeConfig(shared, { test: { name: "css" } }));
