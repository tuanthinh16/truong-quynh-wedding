import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { mailConfigured, sendGuidance } from "./rsvp-mail.mjs";

const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const emailPattern = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const hash = value => createHash("sha256").update(value).digest("hex");

export class RsvpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function validateRsvp(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !uuid.test(input.submissionId || "") || !["groom", "bride"].includes(input.side) || !["yes", "no"].includes(input.attending)) throw new RsvpError(400, "Hồi đáp không hợp lệ.");
  if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 100 || /[\u0000-\u001f]/.test(input.name)) throw new RsvpError(400, "Tên không hợp lệ.");
  if (typeof input.message !== "string" || input.message.length > 1000 || input.website) throw new RsvpError(400, "Lời nhắn không hợp lệ.");
  if (input.email !== undefined && typeof input.email !== "string") throw new RsvpError(400, "Email không hợp lệ.");
  const email = input.attending === "yes" && typeof input.email === "string" ? input.email.trim() : "";
  if (email && (email.length > 254 || !emailPattern.test(email))) throw new RsvpError(400, "Email không hợp lệ.");
  if (input.attending === "yes" && (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 10)) throw new RsvpError(400, "Số khách không hợp lệ.");
  return { submissionId: input.submissionId.toLowerCase(), side: input.side, name: input.name.trim(), attending: input.attending, email, guests: input.attending === "yes" ? input.guests : 0, message: input.message.trim() };
}

async function directory(root, relative) {
  let target = await fs.realpath(root);
  for (const part of [".rsvp", ...relative.split("/")]) {
    target = path.join(target, part);
    try { await fs.mkdir(target, { mode: 0o700 }); } catch (error) { if (error.code !== "EEXIST") throw error; }
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("RSVP_UNSAFE_DIRECTORY");
  }
  return target;
}

async function readRecord(file) {
  if (!(await fs.lstat(file)).isFile() || (await fs.lstat(file)).isSymbolicLink()) throw new Error("RSVP_UNSAFE_FILE");
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function updateRecord(file, record) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temporary, JSON.stringify(record), { mode: 0o600, flag: "wx" }); await fs.rename(temporary, file); }
  finally { await fs.unlink(temporary).catch(() => {}); }
}

async function createRecord(file, record) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temporary, JSON.stringify(record), { mode: 0o600, flag: "wx" }); await fs.link(temporary, file); }
  finally { await fs.unlink(temporary).catch(() => {}); }
}

async function reserveEmail(root, email, side, dailyLimit) {
  const folder = await directory(root, `mail-${new Date().toISOString().slice(0, 10)}`);
  try { await fs.writeFile(path.join(folder, `recipient-${hash(`${side}:${email.toLowerCase()}`)}`), "", { flag: "wx", mode: 0o600 }); }
  catch (error) { if (error.code === "EEXIST") return false; throw error; }
  for (let index = 0; index < dailyLimit; index++) {
    try { await fs.writeFile(path.join(folder, `slot-${index}`), "", { flag: "wx", mode: 0o600 }); return true; }
    catch (error) { if (error.code !== "EEXIST") throw error; }
  }
  return false;
}

export async function listRsvps(root) {
  const folder = await directory(root, "responses");
  const files = (await fs.readdir(folder, { withFileTypes: true })).filter(file => file.isFile() && uuid.test(file.name.replace(/\.json$/, "")) && file.name.endsWith(".json"));
  const ordered = await Promise.all(files.map(async file => ({ name: file.name, modified: (await fs.stat(path.join(folder, file.name))).mtimeMs })));
  ordered.sort((first, second) => second.modified - first.modified);
  const responses = [];
  for (const file of ordered.slice(0, 500)) {
    const record = await readRecord(path.join(folder, file.name));
    responses.push({ id: record.submissionId, name: record.name, email: record.email, side: record.side, attending: record.attending, guests: record.guests, message: record.message, submittedAt: record.submittedAt, emailStatus: record.emailStatus });
  }
  return { responses, total: files.length };
}

export function createRsvpService({ root, getWedding, sendEmail = sendGuidance, isConfigured = mailConfigured, dailyLimit = 100 }) {
  let attempts = [];
  const maximumEmails = Number.isInteger(dailyLimit) && dailyLimit > 0 && dailyLimit <= 10000 ? dailyLimit : 100;
  return async function submit(input) {
    const reply = validateRsvp(input);
    const folder = await directory(root, "responses");
    const file = path.join(folder, `${reply.submissionId}.json`);
    const fingerprint = hash(JSON.stringify(reply));
    const result = record => ({ received: true, emailStatus: record.emailStatus });
    async function existing() {
      const record = await readRecord(file);
      if (record.fingerprint !== fingerprint) throw new RsvpError(409, "Mã hồi đáp đã được dùng cho nội dung khác.");
      return result(record);
    }
    try { return await existing(); } catch (error) { if (error.code !== "ENOENT") throw error; }
    const now = Date.now();
    attempts = attempts.filter(time => time > now - 10 * 60 * 1000);
    if (attempts.length >= 120) throw new RsvpError(429, "Có quá nhiều hồi đáp. Vui lòng thử lại sau.");
    attempts.push(now);
    const record = { ...reply, fingerprint, submittedAt: new Date().toISOString(), emailStatus: "pending" };
    try { await createRecord(file, record); }
    catch (error) { if (error.code === "EEXIST") return existing(); throw error; }
    const wedding = await getWedding();
    if (reply.attending !== "yes" || !reply.email) record.emailStatus = "skipped";
    else if (!wedding.mail.enabled) record.emailStatus = "disabled";
    else if (!isConfigured()) record.emailStatus = "unconfigured";
    else if (!(await reserveEmail(root, reply.email, reply.side, maximumEmails))) record.emailStatus = "rate-limited";
    else {
      try { await sendEmail(wedding, reply); record.emailStatus = "sent"; }
      catch { record.emailStatus = "failed"; }
    }
    await updateRecord(file, record);
    return result(record);
  };
}

export async function handleRsvpRequest(request, submit) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin") throw new RsvpError(403, "Chỉ nhận hồi đáp từ thiệp mời.");
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new RsvpError(415, "Dữ liệu phải là JSON.");
    if (Number(request.headers.get("content-length")) > 8192) throw new RsvpError(413, "Hồi đáp quá dài.");
    const reader = request.body?.getReader();
    if (!reader) throw new RsvpError(400, "Thiếu nội dung hồi đáp.");
    const chunks = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        length += value.length;
        if (length > 8192) { await reader.cancel(); throw new RsvpError(413, "Hồi đáp quá dài."); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let payload;
    try { payload = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new RsvpError(400, "JSON không hợp lệ."); }
    return Response.json(await submit(payload), { status: 200, headers });
  } catch (error) {
    const status = error instanceof RsvpError ? error.status : 503;
    return Response.json({ error: error instanceof RsvpError ? error.message : "Chưa lưu được hồi đáp. Vui lòng thử lại sau." }, { status, headers: { ...headers, ...(status === 429 ? { "Retry-After": "600" } : {}) } });
  }
}
