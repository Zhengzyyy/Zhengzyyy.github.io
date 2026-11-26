import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distDir = path.join(root, "dist");
const srcDir = path.join(root, "src");

const args = new Set(process.argv.slice(2));
const watch = !args.has("--no-watch");
const portFlag = process.argv.indexOf("--port");
const port = Number(
  process.env.PORT || (portFlag > -1 ? process.argv[portFlag + 1] : 4173),
);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function contentType(file) {
  return types.get(path.extname(file).toLowerCase()) ?? "application/octet-stream";
}

async function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }
  let target = path.join(distDir, decoded.replace(/^\/+/, ""));
  if (target !== distDir && !target.startsWith(distDir + path.sep)) return null;

  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) target = path.join(target, "index.html");
  } catch {
    if (!path.extname(target)) target = path.join(target, "index.html");
  }

  try {
    const stat = await fs.stat(target);
    if (stat.isFile()) return target;
  } catch {
    /* 落到 404 */
  }
  return null;
}

const server = createServer(async (request, response) => {
  const file = await resolveFile(request.url || "/");
  if (!file) {
    try {
      const body = await fs.readFile(path.join(distDir, "404.html"));
      response.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(body);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("404 Not Found");
    }
    return;
  }

  try {
    const body = await fs.readFile(file);
    response.writeHead(200, {
      "Content-Type": contentType(file),
      "Cache-Control": "no-store",
      "Content-Length": body.length,
    });
    response.end(body);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("500 Internal Server Error");
  }
});

function build() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(here, "build.mjs")], {
      cwd: root,
      stdio: "inherit",
    });
    child.on("exit", (code) => resolve(code === 0));
  });
}

let building = false;
let queued = false;

async function rebuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const ok = await build();
  building = false;
  if (ok) {
    console.log(`\n  ↻ 已重建 ${new Date().toLocaleTimeString("zh-CN")} — 刷新浏览器查看\n`);
  }
  if (queued) {
    queued = false;
    rebuild();
  }
}

async function start() {
  await build();
  server.listen(port, "127.0.0.1", () => {
    console.log(`\n  本地预览：http://127.0.0.1:${port}`);
    console.log(
      watch
        ? "  监听 src/、scripts/ 与 site.config.mjs —— 保存后自动重建，刷新页面即可。\n"
        : "  已关闭监听（--no-watch）。\n",
    );
  });

  if (!watch) return;

  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 180);
  };

  for (const target of [srcDir, path.join(root, "scripts"), path.join(root, "site.config.mjs")]) {
    try {
      const stat = await fs.stat(target);
      if (stat.isDirectory()) {
        fs.watch(target, { recursive: true }, schedule);
      } else {
        fs.watch(target, schedule);
      }
    } catch {
      /* 可选路径不存在时忽略 */
    }
  }
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
