import { z } from "zod";
import { hasText, sanitizeRich } from "../utils/sanitizeHtml.js";

export const emailSchema = z
  .string("Email is required")
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(255));

/** Password policy for NEW passwords (bcrypt only uses the first 72 bytes, hence the max). */
export const passwordSchema = z
  .string("Password is required")
  .min(10, "Password must be at least 10 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/\d/, "Password must include a number");

/** Public website: a record addressed by its URL slug. */
export const slugParams = z.object({ slug: z.string().trim().toLowerCase().min(1).max(191) });

const MAX_ID = 4_294_967_295; // INT UNSIGNED, the type of every id column
export const idParams = z.object({ id: z.coerce.number().int().positive("Invalid id").max(MAX_ID, "Invalid id") });

// Control characters (NUL, escape codes, ...) have no place in text; tab / newline / carriage return stay allowed.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const noControlChars = (v) => !CONTROL_CHARS.test(v);
const INVALID_CHARS = "Contains invalid characters";

/** Mandatory text field (works for multipart bodies, where missing/empty values arrive as undefined/""). */
export const requiredText = (label, max) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine(noControlChars, INVALID_CHARS);

/** Optional text field; empty becomes null. */
export const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .refine(noControlChars, INVALID_CHARS)
    .optional()
    .transform((v) => v || null);

/**
 * Rich-text (HTML) field from the admin editor: sanitized to a safe tag allowlist, then length-checked.
 * Required fields must contain visible content ("<p></p>" counts as empty). Optional ones become null when empty.
 */
export const requiredRichText = (label, max) =>
  z
    .string(`${label} is required`)
    .transform(sanitizeRich)
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`))
    .refine(hasText, `${label} is required`);

export const optionalRichText = (label, max) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeRich(v) : ""))
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`))
    .transform((v) => (hasText(v) ? v : null));

/** Phone number: only phone punctuation, and a plausible number of digits (6-15, E.164 upper bound). */
export const PHONE_CHARS = /^[0-9+()\-.\s]+$/;
export const hasPlausibleDigits = (v) => {
  const digits = v.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15;
};
export const phoneSchema = (label = "Phone number") =>
  requiredText(label, 30).regex(PHONE_CHARS, "Enter a valid phone number").refine(hasPlausibleDigits, "Enter a valid phone number");

/** Standard list query: ?page=&limit=&q= */
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).max(100_000, "Page is out of range").default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
});

/** HTML forms send "1"/"true"/"on" for ticked checkboxes. */
export const flag = z
  .enum(["1", "true", "on"])
  .optional()
  .transform((v) => v !== undefined);

/** Reports repeated values in a list (case-insensitive) as errors on the repeating row's `<key>` field. */
export function rejectDuplicates(ctx, list, listPath, key, message) {
  const seen = new Set();
  list.forEach((item, i) => {
    const value = String(item?.[key] ?? "").trim().toLowerCase();
    if (!value) return;
    if (seen.has(value)) ctx.addIssue({ code: "custom", path: [...listPath, i, key], message });
    seen.add(value);
  });
}

/** http(s) link, optional (empty becomes null). */
export const optionalUrl = (label) =>
  z
    .string()
    .trim()
    .max(255, `${label} must be at most 255 characters`)
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || (/^https?:\/\//i.test(v) && URL.canParse(v)), `${label} must be a valid http(s) link`);

/** A JSON array sent inside a multipart/JSON form field (e.g. repeating rows); each item is checked with `itemSchema`. */
export const jsonArray = (itemSchema, max, label) =>
  z
    .string()
    .optional()
    .default("[]")
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: "custom", message: `${label} is not valid` });
        return z.NEVER;
      }
    })
    .pipe(z.array(itemSchema).max(max, `At most ${max} ${label.toLowerCase()}`));

/** URL slug typed by the admin: lowercase letters, numbers and single hyphens. Empty = generate from the name. */
export const optionalSlug = z
  .string()
  .trim()
  .toLowerCase()
  .max(191, "Slug must be at most 191 characters")
  .regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and single hyphens only (e.g. cold-room)")
  .optional()
  .default("");

export const seoFields = {
  slug: optionalSlug,
  meta_title: optionalText("Meta title", 255),
  meta_description: optionalText("Meta description", 500),
};

/** Body of PATCH /:id/status for modules with an active / inactive status. */
export const activeStatusBody = z.object({ status: z.enum(["active", "inactive"], "Status must be active or inactive") });
