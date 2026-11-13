export function normalizeGuestName(value: string | null) {
  return Array.from((value ?? "").normalize("NFC").replace(/\p{Cc}/gu, " ").replace(/\s+/gu, " ").trim()).slice(0, 120).join("");
}

export function invitationHref(path: string, name: string | null) {
  const url = new URL(path, "https://invitation.local");
  const guest = normalizeGuestName(name);
  if (guest) url.searchParams.set("name", guest);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function generateInvitationLinks(website: string, path: string, names: string) {
  let base: URL;
  try { base = new URL(website.trim()); }
  catch { throw new Error("Nhập địa chỉ website đầy đủ, bắt đầu bằng https:// hoặc http://."); }
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password) throw new Error("Địa chỉ website phải dùng https:// hoặc http:// và không chứa tài khoản.");
  const guests = [...new Set(names.split(/\r?\n/).map(normalizeGuestName).filter(Boolean))];
  if (!guests.length) throw new Error("Nhập ít nhất một tên người được mời, mỗi tên một dòng.");
  return guests.map(name => ({ name, url: new URL(invitationHref(path, name), base.origin).href }));
}
