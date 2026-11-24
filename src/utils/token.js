import { createHash, randomBytes } from "node:crypto";

/** 256-bit URL-safe random token (sent to the client). */
export const generateToken = () => randomBytes(32).toString("base64url");

/** Only this hash is stored in the database, so a DB leak never exposes usable tokens. */
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
