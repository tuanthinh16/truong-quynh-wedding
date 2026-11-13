import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseArgs } from "node:util";
import next from "next";
import { createAdminAuth } from "./editor/auth.mjs";
import { createEditorService } from "./editor/service.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Added 2026-11-13: local authenticated visual editing, following the do-tho-dn editor's server lifecycle.
const { values } = parseArgs({ options: { port: { type: "string", short: "p" } } });
const port = Number(values.port || process.env.EDITOR_PORT || process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Port phải là số nguyên từ 1024 đến 65535.");
const hostname = "127.0.0.1";
const origin = `http://${hostname}:${port}`;
const aliases = [`http://localhost:${port}`];
const app = next({ dev: true, dir: root, hostname, port });
const nextHandler = app.getRequestHandler();
await app.prepare();
const auth = createAdminAuth({ origin, aliases, username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
const editor = createEditorService({ root, origin, aliases, token: randomBytes(32).toString("hex") });
const server = createServer(async (request, response) => {
  try {
    response.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (await auth(request, response)) return;
    if (await editor(request, response)) return;
    await nextHandler(request, response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Không thể xử lý yêu cầu.");
  }
});
server.on("upgrade", (request, socket, head) => app.getUpgradeHandler()(request, socket, head));
server.on("error", error => { console.error(error.message); process.exitCode = 1; void app.close(); });
server.listen(port, hostname, () => console.log(`Thiệp: http://localhost:${port}\nVisual editor: http://localhost:${port}/admin\nNội dung: src/data/wedding.json · Ảnh: public/uploads/editor`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { server.close(); void app.close().finally(() => process.exit(0)); });
