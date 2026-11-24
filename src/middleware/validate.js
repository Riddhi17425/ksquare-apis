import { detectImageExt } from "../services/image.service.js";
import { ApiError } from "../utils/ApiError.js";

const humanize = (name, labels) => labels?.[name] ?? name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/**
 * Validates req.body / req.query / req.params against zod schemas, and (optionally) uploaded images:
 *   images: { required: ["front_image"], all: ["front_image", "cta_image"] }
 * Parsed values are exposed as req.valid.{body,query,params}; unknown keys are stripped.
 */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  req.valid = {};
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (result.success) req.valid[part] = result.data;
    else
      for (const issue of result.error.issues)
        errors.push({ field: issue.path.join(".") || part, message: issue.message });
  }

  if (schemas.images) {
    const files = req.files ?? {};
    for (const name of schemas.images.required ?? [])
      if (!files[name]?.[0]) errors.push({ field: name, message: `${humanize(name, schemas.images.labels)} is required` });
    for (const name of schemas.images.all ?? []) {
      const file = files[name]?.[0];
      if (file && !detectImageExt(file.buffer))
        errors.push({ field: name, message: `${humanize(name, schemas.images.labels)} must be a JPG, PNG or WebP image` });
    }
  }

  if (errors.length) return next(new ApiError(422, errors[0].message, { code: "VALIDATION_ERROR", errors }));
  next();
};
