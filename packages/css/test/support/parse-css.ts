// parse-css.ts: test helper that checks CSS strictly with lightningcss.
// Shared by the css tests (an agreed exception to the one-to-one test mirror, like core's
// test/support/).

import { transform } from "lightningcss";

/**
 * Lists what is wrong with a stylesheet. lightningcss alone is too lenient for a test: it closes
 * open blocks at the end of the file and keeps a value it cannot parse as an "unparsed"
 * declaration without a warning. So this also checks that braces balance and that every
 * declaration parsed, except those using var(), whose value is only known in the browser.
 *
 * @param css - The stylesheet text.
 * @returns One message per problem; an empty list means clean.
 * @throws When lightningcss finds a syntax error (error recovery is off).
 */
export function cssProblems(css: string): string[] {
  const problems: string[] = [];
  const open = css.split("{").length - 1;
  const close = css.split("}").length - 1;
  if (open !== close) problems.push(`${open} "{" but ${close} "}"`);

  const { warnings } = transform({
    filename: "test.css",
    code: new TextEncoder().encode(css),
    errorRecovery: false,
    visitor: {
      Declaration(declaration) {
        if (declaration.property !== "unparsed") return;
        // Tokens of a var() reference have the type "var".
        const usesVar = JSON.stringify(declaration.value.value).includes('"type":"var"');
        if (!usesVar) problems.push(`cannot parse ${declaration.value.propertyId.property}`);
      },
    },
  });
  return [...problems, ...warnings.map((warning) => warning.message)];
}
