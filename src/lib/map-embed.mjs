export function isMapEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !["www.google.com", "google.com", "maps.google.com"].includes(url.hostname)) return false;
    return url.pathname === "/maps/embed" || url.pathname.startsWith("/maps/embed/") || (["/maps", "/maps/"].includes(url.pathname) && url.searchParams.get("output") === "embed");
  } catch { return false; }
}
