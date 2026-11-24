import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong";
  let errors;

  if (err instanceof ApiError) {
    ({ statusCode: status, code, message, errors } = err);
  } else if (err.type === "entity.parse.failed") {
    [status, code, message] = [400, "INVALID_JSON", "Request body is not valid JSON"];
  } else if (err.type === "entity.too.large") {
    [status, code, message] = [413, "PAYLOAD_TOO_LARGE", "Request body too large"];
  } else if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    code = "UPLOAD_ERROR";
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 2 MB or smaller"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field"
          : "Invalid upload";
  } else if (err.code === "ER_DUP_ENTRY") {
    [status, code, message] = [409, "CONFLICT", "A record with these details already exists"];
  } else {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    if (!env.isProd) message = err.message;
  }

  res.status(status).json({ success: false, message, code, ...(errors && { errors }) });
}
