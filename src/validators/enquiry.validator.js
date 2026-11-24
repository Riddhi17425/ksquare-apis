import { z } from "zod";
import { emailSchema, hasPlausibleDigits, PHONE_CHARS } from "./common.validator.js";

const STATUSES = ["new", "in_progress", "resolved"];
const optionalText = (max) => z.string().trim().max(max).optional().transform((v) => v || null);

/** Public website form */
export const createEnquiryBody = z.object({
  name: z.string("Name is required").trim().min(2, "Name is too short").max(120),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || (PHONE_CHARS.test(v) && hasPlausibleDigits(v)), "Enter a valid phone number")
    .optional()
    .transform((v) => v || null),
  subject: optionalText(200),
  message: z.string("Message is required").trim().min(10, "Message is too short").max(5000),
});

/** Admin list filters */
export const listEnquiriesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

export const updateEnquiryStatusBody = z.object({ status: z.enum(STATUSES, "Invalid status") });
