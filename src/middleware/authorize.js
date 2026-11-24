import { ApiError } from "../utils/ApiError.js";

/** Role gate; use after authenticate. Example: router.delete("/:id", authorize("super_admin"), ...) */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) throw ApiError.forbidden();
    next();
  };
