import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = 4173;
const types = { ".html":"text/html; charset=utf-8", ".mp4":"video/mp4", ".md":"text/markdown; charset=utf-8" };

http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relativePath = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, "index.html")) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    const headers = {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache"
    };
    const range = request.headers.range;
    if (!range) {
      response.writeHead(200, { ...headers, "Content-Length": stats.size });
      fs.createReadStream(filePath).pipe(response);
      return;
    }

    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), stats.size - 1) : stats.size - 1;
    if (!match || start > end || start >= stats.size) {
      response.writeHead(416, { "Content-Range": `bytes */${stats.size}` }).end();
      return;
    }

    response.writeHead(206, {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Content-Length": end - start + 1
    });
    fs.createReadStream(filePath, { start, end }).pipe(response);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Tea Experience preview: http://127.0.0.1:${port}/`);
});
