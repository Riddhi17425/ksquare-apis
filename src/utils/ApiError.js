/** Operational error with an HTTP status; the central error handler turns it into a JSON response. */
export class ApiError extends Error {
  constructor(statusCode, message, { code, errors } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? ApiError.defaultCode(statusCode);
    this.errors = errors;
  }

  static defaultCode(status) {
    return (
      { 400: "BAD_REQUEST", 401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND", 409: "CONFLICT", 429: "TOO_MANY_REQUESTS" }[
        status
      ] ?? "ERROR"
    );
  }

  static badRequest = (msg = "Bad request", opts) => new ApiError(400, msg, opts);
  static unauthorized = (msg = "Authentication required", opts) => new ApiError(401, msg, opts);
  static forbidden = (msg = "You do not have permission to do this", opts) => new ApiError(403, msg, opts);
  static notFound = (msg = "Resource not found", opts) => new ApiError(404, msg, opts);
  static tooMany = (msg = "Too many requests", opts) => new ApiError(429, msg, opts);
}
