import { z } from "zod";
import { listQuery, optionalRichText, optionalText, requiredRichText, requiredText } from "../validators/common.validator.js";
import { fieldLabel } from "./resources.js";

export const STATUSES = ["active", "inactive"];
const MAX_ID = 4_294_967_295; // INT UNSIGNED, the type of every id column

// Multipart forms send "" for an empty input; treat it as missing so the "is required" message shows.
const blankToUndefined = (v) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const isRealDate = (v) => new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

function fieldSchema(f) {
  const label = fieldLabel(f);
  switch (f.type) {
    case "text":
    case "textarea":
      if (f.rich) return f.optional ? optionalRichText(label, f.max) : requiredRichText(label, f.max);
      return f.optional ? optionalText(label, f.max) : requiredText(label, f.max);
    case "url": {
      const valid = z
        .string()
        .max(f.max, `${label} must be at most ${f.max} characters`)
        .refine((v) => /^https?:\/\//i.test(v) && URL.canParse(v), `${label} must be a valid http(s) link`);
      return z.preprocess(blankToUndefined, f.optional ? valid.nullish().transform((v) => v ?? null) : valid);
    }
    case "int":
      return z.preprocess(
        blankToUndefined,
        z.coerce
          .number(`${label} is required`)
          .int(`${label} must be a whole number`)
          .min(f.min, `${label} must be at least ${f.min}`)
          .max(f.max, `${label} must be at most ${f.max}`),
      );
    case "date":
      return z.preprocess(
        blankToUndefined,
        z
          .string(`${label} is required`)
          .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
          .refine(isRealDate, `${label} must be a valid date`),
      );
    case "bool": // 0 / 1, defaults to 0
      return z.preprocess((v) => blankToUndefined(v) ?? 0, z.coerce.number().int().min(0, `${label} must be Yes or No`).max(1, `${label} must be Yes or No`));
    case "fk":
      return z.preprocess(
        blankToUndefined,
        z.coerce.number(`${label} is required`).int(`${label} is required`).positive(`${label} is required`).max(MAX_ID, `${label} is required`),
      );
    default:
      throw new Error(`Unknown field type: ${f.type}`);
  }
}

/** Request body schema of a resource (image fields travel as uploaded files, not in the body). */
export function bodySchema(res) {
  const shape = { status: z.enum(STATUSES, "Status must be active or inactive").default("active") };
  for (const f of res.fields) if (f.type !== "image") shape[f.name] = fieldSchema(f);
  const schema = z.object(shape);
  return res.refine ? schema.superRefine(res.refine) : schema;
}

export const statusBody = z.object({ status: z.enum(STATUSES, "Status must be active or inactive") });

/** List query: ?page&limit&q&status plus one optional id filter per fk field. */
export function querySchema(res) {
  const filters = {};
  for (const f of res.fields) if (f.type === "fk") filters[f.name] = z.coerce.number().int().positive().max(MAX_ID).optional();
  return listQuery.extend({ status: z.enum(STATUSES).optional(), ...filters });
}
