import { z } from "zod";
import { emailSchema, passwordSchema, requiredText } from "./common.validator.js";

export const profileBody = z.object({
  name: requiredText("Name", 120),
  email: emailSchema,
});

export const changePasswordBody = z
  .object({
    current_password: z.string("Current password is required").min(1, "Current password is required").max(200),
    password: passwordSchema,
    confirm_password: z.string("Please confirm the new password").min(1, "Please confirm the new password"),
  })
  .superRefine((b, ctx) => {
    if (b.confirm_password !== b.password) ctx.addIssue({ code: "custom", path: ["confirm_password"], message: "Passwords do not match" });
    else if (b.current_password === b.password) ctx.addIssue({ code: "custom", path: ["password"], message: "New password must be different from the current one" });
  });
