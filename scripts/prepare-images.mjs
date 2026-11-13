import { promises as fs } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { fieldKind } from "../src/lib/editor-schema.mjs";
import { imageSettings } from "../src/lib/image-settings.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function writeAtomic(filename, bytes) {
  const temporary = `${filename}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, bytes, { flag: "wx" });
    await fs.rename(temporary, filename);
  } finally { await fs.unlink(temporary).catch(() => {}); }
}

export async function prepareImages(root = projectRoot) {
  const wedding = JSON.parse(await fs.readFile(path.join(root, "src/data/wedding.json"), "utf8"));
  const sources = new Set();
  function visit(value, trail = []) {
    if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) if (!key.startsWith("_")) visit(entry, [...trail, key]);
    } else if (value && fieldKind(trail, value) === "image" && trail.at(-1) !== "qrImage") sources.add(value);
  }
  visit(wedding);
  const publicRoot = await fs.realpath(path.join(root, "public"));
  const destination = path.join(publicRoot, "optimized");
  const manifestFolder = path.join(root, ".generated");
  await fs.mkdir(destination, { recursive: true });
  await fs.mkdir(manifestFolder, { recursive: true });
  const widths = [...imageSettings.imageSizes, ...imageSettings.deviceSizes].sort((first, second) => first - second);
  const manifest = {};
  let generated = 0;
  for (const source of [...sources].sort()) {
    if (typeof source !== "string" || !source.startsWith("/") || source.startsWith("//")) throw new Error(`Invalid local image: ${source}`);
    const filename = await fs.realpath(path.join(publicRoot, decodeURIComponent(source)));
    if (!filename.startsWith(publicRoot + path.sep)) throw new Error(`Image is outside public: ${source}`);
    const bytes = await fs.readFile(filename);
    const metadata = await sharp(bytes, { limitInputPixels: imageSettings.maxInputPixels, animated: false }).metadata();
    if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) throw new Error(`Unsupported image: ${source}`);
    const originalWidth = metadata.orientation >= 5 && metadata.orientation <= 8 ? metadata.height : metadata.width;
    const hash = createHash("sha256").update(bytes).update(JSON.stringify({ version: 1, quality: imageSettings.quality, encoder: sharp.versions })).digest("hex").slice(0, 24);
    const variants = {};
    for (const width of widths) {
      const target = Math.min(originalWidth, width);
      const name = `${hash}-${target}.webp`;
      const output = path.join(destination, name);
      try { await fs.access(output); }
      catch {
        const converted = await sharp(bytes, { limitInputPixels: imageSettings.maxInputPixels, animated: false }).rotate().resize({ width: target, withoutEnlargement: true }).webp({ quality: imageSettings.quality }).toBuffer();
        await writeAtomic(output, converted);
        generated += 1;
      }
      variants[width] = `/optimized/${name}`;
    }
    manifest[source] = variants;
  }
  const manifestFile = path.join(manifestFolder, "images.json");
  const serialized = JSON.stringify(manifest, null, 2) + "\n";
  const previous = await fs.readFile(manifestFile, "utf8").catch(() => "");
  if (previous !== serialized) await writeAtomic(manifestFile, serialized);
  return { sources: sources.size, generated, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareImages();
  console.log(`Prepared ${result.sources} image sources; generated ${result.generated} responsive WebP files.`);
}
