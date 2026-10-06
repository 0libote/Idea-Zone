import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Request input never becomes a filesystem path. Serve only built documents.
const routes = new Map([
  ["/", path.resolve("dist/index.html")],
  ["/index.html", path.resolve("dist/index.html")],
  ["/examples/brief.html", path.resolve("examples/brief.html")],
  ["/examples/editorial.html", path.resolve("examples/editorial.html")],
  ["/examples/report.html", path.resolve("examples/report.html")],
]);
export function createPreviewServer() {
  return http.createServer((req, res) => {
    let requested;
    try {
      requested = new URL(req.url, "http://localhost").pathname;
    } catch {
      res.writeHead(400);
      res.end("Invalid request");
      return;
    }
    const file = routes.get(requested);
    if (!file) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end(data);
    });
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  createPreviewServer().listen(5173, "0.0.0.0", () =>
    console.log("Idea Zone: http://localhost:5173"),
  );
}
