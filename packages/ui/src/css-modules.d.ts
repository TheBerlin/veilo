// css-modules.d.ts: types for `import styles from "./x.module.css"`. Vite turns each class into
// a unique name and the import into a map from the written name to it.

declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// The token stylesheet, imported only for its side effect of defining the --veilo-* variables.
declare module "*/tokens.css";
