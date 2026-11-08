import { defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Everything here runs in Node: the package is data plus one helper.
export default defineProject(mergeConfig(shared, { test: { name: "presets" } }));
