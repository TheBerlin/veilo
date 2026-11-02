// ESLint for the whole repo. Run with `pnpm lint`.
//
// This package has its own TypeScript 6 because typescript-eslint does not support
// TypeScript 7 yet. It only parses source here, with no type-aware rules, so the two
// compilers cannot disagree.
import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import tsdoc from "eslint-plugin-tsdoc";
import globals from "globals";
import tseslint from "typescript-eslint";

// Exported functions, including those held in an exported const. A function exported later
// through `export { name }` is not matched, so export functions where they are declared.
const EXPORTED_FUNCTIONS = [
  "ExportNamedDeclaration > FunctionDeclaration",
  "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
  "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
  "ExportDefaultDeclaration > FunctionDeclaration",
  "ExportDefaultDeclaration > ArrowFunctionExpression",
];

export default tseslint.config(
  { ignores: ["**/dist/", "**/node_modules/", "**/.turbo/", "docs/"] },

  js.configs.recommended,
  tseslint.configs.recommended,

  // Scripts and tool configs run on Node.
  { files: ["**/*.{mjs,cjs}"], languageOptions: { globals: globals.node } },

  // Every doc comment in TypeScript must be valid TSDoc.
  { files: ["**/*.ts"], plugins: { tsdoc }, rules: { "tsdoc/syntax": "error" } },

  // Rule 4: every export in package source documents its purpose, parameters and result.
  {
    files: ["packages/*/src/**/*.ts"],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
          contexts: [
            "ExportNamedDeclaration > VariableDeclaration",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSEnumDeclaration",
          ],
        },
      ],
      "jsdoc/require-param": ["error", { contexts: EXPORTED_FUNCTIONS, enableFixer: false }],
      "jsdoc/require-returns": ["error", { contexts: EXPORTED_FUNCTIONS }],
      "jsdoc/check-param-names": "error",
    },
  },
);
