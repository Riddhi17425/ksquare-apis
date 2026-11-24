import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooMany(message)),
  });

const MIN = 60 * 1000;

export const globalLimiter = make(15 * MIN, 600, "Too many requests. Please slow down.");
export const loginLimiter = make(15 * MIN, env.LOGIN_RATE_LIMIT, "Too many login attempts. Please try again later.");
export const forgotPasswordLimiter = make(
  60 * MIN,
  env.FORGOT_PASSWORD_RATE_LIMIT,
  "Too many reset requests. Please try again later.",
);
export const resetPasswordLimiter = make(15 * MIN, 10, "Too many attempts. Please try again later.");
export const publicFormLimiter = make(60 * MIN, 10, "Too many submissions. Please try again later.");
