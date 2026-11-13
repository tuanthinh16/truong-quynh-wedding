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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function htmlText(value) { return escapeHtml(value).replace(/\r?\n/g, "<br>"); }

function conceptHtml(concept) {
  if (!concept?.enabled) return "";
  return `<tr><td style="padding:0 24px 24px;font-size:12px;line-height:1.7">
    <p style="margin:0">${htmlText(concept.paletteLabel)}: ${htmlText(concept.tones)}</p>
    <p style="margin:0">${htmlText(concept.dressCodeLabel)}: ${htmlText(concept.dressCode)}</p>
  </td></tr>`;
}

export function guidanceMessage(wedding, reply) {
  const event = wedding.events[reply.side];
  const couple = `${wedding.groom.name} & ${wedding.bride.name}`;
  const values = { name: reply.name, couple, side: event.sideLabel, guests: String(reply.guests) };
  const template = text => text.replace(/\{(name|couple|side|guests)\}/g, (_, key) => values[key]);
  const date = event.dateTime ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(event.dateTime)) : "";
  let mapUrl = "";
  try { const url = new URL(event.mapUrl); if (["https:", "http:"].includes(url.protocol)) mapUrl = url.href; } catch {}
  if (!mapUrl && event.address.trim()) mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address.trim())}`;
  const concept = wedding.partyConcept;
  const conceptLines = concept?.enabled ? ["", `${concept.paletteLabel}: ${concept.tones}`, `${concept.dressCodeLabel}: ${concept.dressCode}`] : [];
  const detailRow = (label, value) => value ? `<tr><td style="padding:14px 18px;border-bottom:1px solid #e8d8d0"><span style="font-size:11px;letter-spacing:1px;color:#735e57">${escapeHtml(label)}</span><br><strong style="font-size:15px;font-weight:normal;color:#362b28">${htmlText(value)}</strong></td></tr>` : "";
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(couple)}</title></head>
    <body style="margin:0;padding:0;background-color:#f5efe9;color:#55443f;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;overflow-wrap:anywhere">
    <table role="presentation" width="100%" style="border-collapse:collapse;background-color:#f5efe9"><tr><td align="center" style="padding:24px 8px">
    <table role="presentation" width="600" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#fffdf9">
      <tr><td align="center" style="padding:36px 24px;background-color:#792f3d;color:#fff8ee"><p style="margin:0 0 14px;font-size:11px;letter-spacing:3px">TRÂN TRỌNG ĐÓN CHÀO</p><h1 style="margin:0;font:normal 32px/1.4 Georgia,serif">${escapeHtml(couple)}</h1><p style="margin:14px 0 0;color:#f0d9cf">${htmlText(event.label)} · ${htmlText(event.sideLabel)}</p></td></tr>
      <tr><td style="padding:28px 24px 20px"><p style="margin:0 0 12px;font-size:18px;color:#792f3d">${htmlText(template(wedding.mail.greeting))}</p><p style="margin:0">${htmlText(template(wedding.mail.introduction))}</p></td></tr>
      <tr><td style="padding:0 24px 24px"><table role="presentation" width="100%" style="border-collapse:collapse;background-color:#f8f3ec;border:1px solid #e8d8d0">${detailRow("THỜI GIAN", date)}${detailRow("ĐỊA ĐIỂM", event.venue)}${detailRow("ĐỊA CHỈ", event.address)}${detailRow("SỐ NGƯỜI THAM DỰ", String(reply.guests))}</table>
      ${mapUrl ? `<table role="presentation" style="margin:20px auto 0;border-collapse:collapse"><tr><td align="center" bgcolor="#792f3d" style="border-radius:4px"><a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold">Chỉ đường Google Maps &rarr;</a></td></tr></table>` : ""}</td></tr>
      ${conceptHtml(concept)}
      <tr><td style="padding:0 24px 28px"><p style="margin:0 0 20px">${htmlText(template(wedding.mail.instructions))}</p><p style="margin:0;color:#792f3d">${htmlText(template(wedding.mail.closing))}</p></td></tr>
      <tr><td align="center" style="padding:18px 24px;border-top:1px solid #e8d8d0;background-color:#f8f3ec;font-size:12px;color:#735e57">${escapeHtml(couple)} · ${htmlText(event.sideLabel)}</td></tr>
    </table></td></tr></table></body></html>`;
  return {
    to: reply.email,
    subject: template(wedding.mail.subject).replace(/[\r\n]/g, " ").slice(0, 200),
    text: [template(wedding.mail.greeting), "", template(wedding.mail.introduction), "", event.label, event.sideLabel, date && `Thời gian: ${date}`, event.venue && `Địa điểm: ${event.venue}`, event.address && `Địa chỉ: ${event.address}`, mapUrl && `Chỉ đường Google Maps: ${mapUrl}`, `Số người tham dự: ${reply.guests}`, ...conceptLines, "", template(wedding.mail.instructions), "", template(wedding.mail.closing)].filter(line => line !== false && line !== null && line !== undefined).join("\n"),
    html,
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
