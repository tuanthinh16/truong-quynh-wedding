import nodemailer from "nodemailer";

const mailbox = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

function configuration(env) {
  const port = Number(env.SMTP_PORT || 587);
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;
  const configured = Boolean(env.SMTP_HOST?.trim() && mailbox.test(env.SMTP_FROM || "") && Number.isInteger(port) && port > 0 && port <= 65535 && (!env.SMTP_SECURE || ["true", "false"].includes(env.SMTP_SECURE)) && Boolean(env.SMTP_USER) === Boolean(env.SMTP_PASS) && (!env.SMTP_REPLY_TO || mailbox.test(env.SMTP_REPLY_TO)));
  return { configured, from: env.SMTP_FROM, replyTo: env.SMTP_REPLY_TO || undefined, options: {
    host: env.SMTP_HOST, port, secure, requireTLS: !secure,
    ...(env.SMTP_USER && env.SMTP_PASS ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    disableFileAccess: true, disableUrlAccess: true,
  } };
}

export function mailConfigured(env = process.env) { return configuration(env).configured; }

export function guidanceMessage(wedding, reply) {
  const event = wedding.events[reply.side];
  const couple = `${wedding.groom.name} & ${wedding.bride.name}`;
  const values = { name: reply.name, couple, side: event.sideLabel, guests: String(reply.guests) };
  const template = text => text.replace(/\{(name|couple|side|guests)\}/g, (_, key) => values[key]);
  const date = event.dateTime ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(event.dateTime)) : "";
  let mapUrl = "";
  try { const url = new URL(event.mapUrl); if (["https:", "http:"].includes(url.protocol)) mapUrl = url.href; } catch {}
  if (!mapUrl && event.address.trim()) mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address.trim())}`;
  return {
    to: reply.email,
    subject: template(wedding.mail.subject).replace(/[\r\n]/g, " ").slice(0, 200),
    text: [template(wedding.mail.greeting), "", template(wedding.mail.introduction), "", event.label, event.sideLabel, date && `Thời gian: ${date}`, event.venue && `Địa điểm: ${event.venue}`, event.address && `Địa chỉ: ${event.address}`, mapUrl && `Chỉ đường Google Maps: ${mapUrl}`, `Số người tham dự: ${reply.guests}`, "", template(wedding.mail.instructions), "", template(wedding.mail.closing)].filter(line => line !== false && line !== null && line !== undefined).join("\n"),
  };
}

export async function sendGuidance(wedding, reply, { env = process.env, createTransport = nodemailer.createTransport } = {}) {
  const config = configuration(env);
  if (!config.configured) throw new Error("SMTP_NOT_CONFIGURED");
  const transport = createTransport(config.options);
  try {
    const from = { name: wedding.mail.senderName.replace(/[\r\n]/g, " ").trim(), address: config.from };
    const result = await transport.sendMail({ ...guidanceMessage(wedding, reply), from, replyTo: config.replyTo, disableFileAccess: true, disableUrlAccess: true });
    if (!result.accepted?.length) throw new Error("SMTP_NOT_ACCEPTED");
  } finally { transport.close(); }
}
