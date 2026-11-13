import * as blob from "@vercel/blob";
import { createHash, randomUUID } from "node:crypto";

export const cloudConfigured = (env = process.env) => Boolean(env.BLOB_READ_WRITE_TOKEN);
export const digest = value => createHash("sha256").update(value).digest("hex");

export function createCloudStore({ sdk = blob, env = process.env } = {}) {
  const prefix = env.WEDDING_BLOB_PREFIX || `wedding-${env.VERCEL_ENV || "production"}`;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(prefix)) throw new Error("WEDDING_BLOB_PREFIX không hợp lệ.");
  const options = () => ({ token: env.BLOB_READ_WRITE_TOKEN, abortSignal: AbortSignal.timeout(20000) });
  const pathname = relative => `${prefix}/${relative}`;
  async function read(relative) {
    const result = await sdk.get(pathname(relative), { ...options(), access: "private", useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error("BLOB_READ_FAILED");
    return { data: await new Response(result.stream).json(), etag: result.blob.etag };
  }
  async function write(relative, data, { etag, ttlDays } = {}) {
    return sdk.put(pathname(relative), JSON.stringify(data), {
      ...options(), access: "private", addRandomSuffix: false, allowOverwrite: Boolean(etag),
      ...(etag ? { ifMatch: etag } : {}), ...(ttlDays ? { ttlDays } : {}), contentType: "application/json",
    });
  }
  async function claim(relative, data, settings) {
    try { await write(relative, data, settings); return true; }
    catch (error) { if (await read(relative)) return false; throw error; }
  }
  async function consume(relative, maximum) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const current = await read(relative);
      if ((current?.data.count || 0) >= maximum) return false;
      try { await write(relative, { count: (current?.data.count || 0) + 1 }, { etag: current?.etag, ttlDays: 2 }); return true; }
      catch (error) {
        const latest = await read(relative);
        if (!latest || latest.etag === current?.etag) throw error;
      }
    }
    throw new Error("BLOB_BUSY");
  }
  async function files(relative) {
    const entries = [];
    let cursor;
    do {
      const result = await sdk.list({ ...options(), prefix: pathname(relative), limit: 1000, cursor });
      entries.push(...result.blobs);
      cursor = result.hasMore ? result.cursor : undefined;
      if (entries.length > 10000) throw new Error("BLOB_LIST_LIMIT");
    } while (cursor);
    return entries;
  }
  async function image(relative, bytes) {
    return sdk.put(pathname(relative), bytes, { ...options(), access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "image/webp", cacheControlMaxAge: 31536000 });
  }
  async function readImage(name) {
    return sdk.get(pathname(`images/${name}`), { ...options(), access: "private" });
  }
  async function remove(relative) { await sdk.del(pathname(relative), options()); }
  return { read, write, claim, consume, files, image, readImage, remove, pathname, randomId: randomUUID };
}
