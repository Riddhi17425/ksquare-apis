import { z } from "zod";
import { emailSchema, phoneSchema, rejectDuplicates, requiredText } from "./common.validator.js";

export const MAX_ENTRIES = 10;

const entries = (valueSchema) => z.array(z.object({ value: valueSchema })).max(MAX_ENTRIES, `At most ${MAX_ENTRIES} entries`).default([]);

const hostIn = (value, domains) => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return domains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

/** Optional social link: must be http(s) and point at the matching network (subdomains like m.facebook.com are fine). */
const socialUrl = (label, domains) =>
  z
    .string()
    .trim()
    .max(255, `${label} must be at most 255 characters`)
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || (/^https?:\/\//i.test(v) && URL.canParse(v)), `${label} must be a valid http(s) link`)
    .refine((v) => v === null || !URL.canParse(v) || hostIn(v, domains), `${label} must be a link to ${domains[0]}`);

export const settingsBody = z
  .object({
    call_details: entries(phoneSchema("Phone number")),
    email_details: entries(emailSchema),
    address_details: entries(requiredText("Address", 500)),
    facebook_link: socialUrl("Facebook link", ["facebook.com", "fb.com", "fb.me"]),
    instagram_link: socialUrl("Instagram link", ["instagram.com", "instagr.am"]),
    linkedin_link: socialUrl("LinkedIn link", ["linkedin.com", "lnkd.in"]),
  })
  .superRefine((body, ctx) => {
    rejectDuplicates(ctx, body.call_details, ["call_details"], "value", "This phone number is already in the list");
    rejectDuplicates(ctx, body.email_details, ["email_details"], "value", "This email is already in the list");
    rejectDuplicates(ctx, body.address_details, ["address_details"], "value", "This address is already in the list");
  });
