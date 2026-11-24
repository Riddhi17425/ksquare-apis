import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { removeBackground } from "../utils/removeBackground.js";
import { logger } from "../utils/logger.js";

export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** Detects the real image type from the file's magic bytes (the client-sent mimetype/extension is never trusted). */
export function detectImageExt(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  return null;
}

/** A real PDF starts with "%PDF-" (the client-sent mimetype/extension is never trusted). */
export const isPdf = (buf) => buf.length > 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";

/** DB stores a relative path ("blogs/ab12.png"); API responses expose the absolute URL. */
export const imageUrl = (rel) => (rel ? `${env.API_PUBLIC_URL}/uploads/${rel}` : null);

export async function deleteImage(rel) {
  if (!rel) return;
  const full = path.resolve(UPLOAD_ROOT, rel);
  if (!full.startsWith(UPLOAD_ROOT + path.sep)) return; // never delete outside the upload dir
  try {
    await unlink(full);
  } catch (err) {
    if (err.code !== "ENOENT") logger.warn("Could not delete image", rel, err.message);
  }
}

/**
 * Tracks files written during one request so they can be rolled back if the database step fails,
 * and so replaced files can be removed only after the database commit succeeded.
 */
export class UploadSession {
  saved = [];

  /** `transparent`: strip the photo's solid background and store it as a PNG (used for product photos). */
  async save(file, folder, { transparent = false } = {}) {
    const buffer = transparent ? await removeBackground(file.buffer) : file.buffer;
    const ext = transparent ? ".png" : detectImageExt(file.buffer);
    const rel = `${folder}/${randomBytes(16).toString("hex")}${ext}`;
    await mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
    await writeFile(path.join(UPLOAD_ROOT, rel), buffer, { flag: "wx" });
    this.saved.push(rel);
    return rel;
  }

  /** Saves an uploaded PDF (already validated) and returns its relative path. */
  async saveDocument(file, folder) {
    const rel = `${folder}/${randomBytes(16).toString("hex")}.pdf`;
    await mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
    await writeFile(path.join(UPLOAD_ROOT, rel), file.buffer, { flag: "wx" });
    this.saved.push(rel);
    return rel;
  }

  async rollback() {
    await Promise.all(this.saved.map(deleteImage));
    this.saved = [];
  }
}

/** Convenience: first uploaded file for a field name (multer.fields shape), or undefined. */
export const fileOf = (files, name) => files?.[name]?.[0];
