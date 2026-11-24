import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.validator.js";

const tokenSchema = z.string("Token is required").min(20).max(128);

export const loginBody = z.object({
  email: emailSchema,
  password: z.string("Password is required").min(1, "Password is required").max(200),
});

export const forgotPasswordBody = z.object({ email: emailSchema });

export const verifyResetQuery = z.object({ token: tokenSchema });

export const resetPasswordBody = z.object({ token: tokenSchema, password: passwordSchema });
