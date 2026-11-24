import { z } from "zod";
import { listQuery, requiredRichText, requiredText } from "./common.validator.js";

const STATUSES = ["draft", "published"];

export const BLOG_IMAGES = ["front_image", "detail_image", "cta_image"];
export const blogCreateImages = { required: BLOG_IMAGES, all: BLOG_IMAGES };
export const blogUpdateImages = { all: BLOG_IMAGES }; // on edit, images are only replaced when a new file is sent

export const blogBody = z.object({
  author_id: z.coerce.number("Author is required").int().positive("Author is required"),
  title: requiredText("Title", 255),
  short_description: requiredText("Short description", 500),
  description: requiredRichText("Description", 500_000),
  date: z.iso.date("Enter a valid date").refine((d) => d >= "1990-01-01" && d <= "2100-12-31", "Date is out of range"),
  cta_text: requiredText("CTA text", 255),
  conclusion: requiredRichText("Conclusion", 100_000),
  url: z
    .string("URL is required")
    .trim()
    .toLowerCase()
    .min(1, "URL is required")
    .max(191, "URL must be at most 191 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens only (e.g. my-first-post)"),
  status: z.enum(STATUSES, "Status must be draft or published"),
  meta_title: requiredText("Meta title", 255),
  meta_description: requiredText("Meta description", 500),
});

export const listBlogsQuery = listQuery.extend({ status: z.enum(STATUSES).optional() });

export const blogStatusBody = z.object({ status: z.enum(STATUSES, "Status must be draft or published") });

export const checkUrlQuery = z.object({
  url: z.string().trim().toLowerCase().max(191),
  exclude: z.coerce.number().int().positive().optional(), // blog being edited
});

/** Public website: GET /frontend/blogs/:url */
export const publicBlogParams = z.object({ url: z.string().trim().toLowerCase().min(1).max(191) });
