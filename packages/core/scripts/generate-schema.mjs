// Writes settings.schema.json from the settings table. Run with `pnpm generate:schema`.
// A test fails when the committed file is out of date.
import { writeFileSync } from "node:fs";
import { settingsJsonSchema } from "../src/schema/json-schema.ts";

const target = new URL("../settings.schema.json", import.meta.url);
writeFileSync(target, `${JSON.stringify(settingsJsonSchema(), null, 2)}\n`);
