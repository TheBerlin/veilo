import { defineProject, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.ts";

// Everything here runs in Node: tokens are plain data.
export default defineProject(mergeConfig(shared, { test: { name: "ui" } }));
