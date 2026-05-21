import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const port = 3000;

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json",
};

createServer(async (req, res) => {
  const pathname = new URL(req.url ?? "/", `http://127.0.0.1:${port}`).pathname;
  const path = pathname === "/" ? "/index.html" : pathname;
  const file = join(root, path.replace(/^\//, ""));

  try {
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "text/plain",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => {
  console.log(`🌐 http://localhost:${port}`);
});
