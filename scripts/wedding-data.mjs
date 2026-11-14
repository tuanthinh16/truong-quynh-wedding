import { promises as fs } from "node:fs";
import path from "node:path";

export async function ensureWeddingData(root) {
  const filename = path.join(root, "src/data/wedding.json");
  try {
    await fs.copyFile(path.join(root, "src/data/wedding.defaults.json"), filename, fs.constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  return filename;
}
