// serve.mjs: a tiny static file server for this folder, because module scripts do not run from
// file://. Any static server works the same; this one needs no install. Usage:
// `node serve.mjs [port]` (default 4176), or import { serve } to start one from a script.

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

/**
 * Serves the files in a folder over HTTP on localhost.
 *
 * @param root - The folder to serve; `/` is its index.html.
 * @param port - The port.
 * @returns The running server.
 */
export function serve(root, port) {
  // resolve() drops a trailing separator, so the inside-the-folder check below holds.
  const base = resolve(root);
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const file = normalize(join(base, path === "/" ? "index.html" : path));
    // Never serve anything outside the folder.
    if (!file.startsWith(base + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if (!statSync(file).isFile()) throw new Error("not a file");
    } catch {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  server.listen(port, "127.0.0.1");
  return server;
}

// Run directly: serve this folder.
if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const port = Number(process.argv[2] ?? 4176);
  serve(fileURLToPath(new URL(".", import.meta.url)), port);
  console.log(`Veilo web components demo: http://localhost:${port}/`);
}
