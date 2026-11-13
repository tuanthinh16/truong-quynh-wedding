import { RsvpError, validateRsvp } from "./rsvp-service.mjs";
import { mailConfigured, sendGuidance } from "./rsvp-mail.mjs";
import { digest } from "./cloud-store.mjs";

export function createCloudRsvp({ store, getWedding, env = process.env, sendEmail = sendGuidance }) {
  async function submit(input) {
    if (!env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_NOT_CONFIGURED");
    const reply = validateRsvp(input);
    const key = `rsvps/${reply.submissionId}.json`;
    const fingerprint = digest(JSON.stringify(reply));
    function existing(record) {
      if (record.fingerprint !== fingerprint) throw new RsvpError(409, "Mã hồi đáp đã được dùng cho nội dung khác.");
      return { received: true, emailStatus: record.emailStatus };
    }
    const current = await store.read(key);
    if (current) return existing(current.data);
    if (!await store.consume(`limits/rsvp-${Math.floor(Date.now() / 600000)}.json`, 120)) throw new RsvpError(429, "Có quá nhiều hồi đáp. Vui lòng thử lại sau.");
    const wedding = await getWedding();
    const record = { ...reply, fingerprint, submittedAt: new Date().toISOString(), emailStatus: "pending" };
    if (!await store.claim(key, record)) return existing((await store.read(key)).data);
    const created = await store.read(key);
    if (reply.attending !== "yes" || !reply.email) record.emailStatus = "skipped";
    else if (!wedding.mail.enabled) record.emailStatus = "disabled";
    else if (!mailConfigured(env)) record.emailStatus = "unconfigured";
    else {
      const day = new Date().toISOString().slice(0, 10);
      const limit = Number(env.RSVP_DAILY_EMAIL_LIMIT || 100);
      const maximum = Number.isInteger(limit) && limit > 0 && limit <= 10000 ? limit : 100;
      const recipient = await store.claim(`limits/mail-${day}-${digest(`${reply.side}:${reply.email.toLowerCase()}`)}.json`, { reserved: true }, { ttlDays: 2 });
      if (!recipient || !await store.consume(`limits/mail-${day}.json`, maximum)) record.emailStatus = "rate-limited";
      else {
        try { await sendEmail(wedding, reply, { env }); record.emailStatus = "sent"; }
        catch { record.emailStatus = "failed"; }
      }
    }
    await store.write(key, record, { etag: created.etag });
    return { received: true, emailStatus: record.emailStatus };
  }
  async function list() {
    const files = await store.files("rsvps/");
    files.sort((first, second) => new Date(second.uploadedAt) - new Date(first.uploadedAt));
    const records = await Promise.all(files.slice(0, 500).map(file => store.read(file.pathname.slice(store.pathname("").length))));
    const responses = records.filter(Boolean).map(({ data }) => ({ id: data.submissionId, name: data.name, email: data.email, side: data.side, attending: data.attending, guests: data.guests, message: data.message, submittedAt: data.submittedAt, emailStatus: data.emailStatus }));
    return { responses, total: files.length };
  }
  return { submit, list };
}
