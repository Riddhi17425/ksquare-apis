import { z } from "zod";
import { jsonArray, listQuery, seoFields, optionalRichText, requiredRichText, requiredText } from "./common.validator.js";

export const MAX_DETAIL_IMAGES = 10;
export const MAX_FAQS = 30;
export const DETAIL_IMG_FIELDS = Array.from({ length: MAX_DETAIL_IMAGES }, (_, i) => `detail_img_${i}`);

const labels = { list_img: "List image", ...Object.fromEntries(DETAIL_IMG_FIELDS.map((f, i) => [f, `Detail image ${i + 1}`])) };
export const productCreateImages = { required: ["list_img"], all: ["list_img", ...DETAIL_IMG_FIELDS], labels };
export const productUpdateImages = { all: ["list_img", ...DETAIL_IMG_FIELDS], labels };

const faq = z.object({
  faq_question: requiredText("Question", 500),
  faq_answer: requiredText("Answer", 5000),
});

const RICH_MAX = 100_000;

export const productBody = z.object({
  category_id: z.coerce.number("Category is required").int().positive("Category is required").max(4_294_967_295, "Category is required"),
  name: requiredText("Name", 255),
  ...seoFields,
  short_description: requiredRichText("Short description", RICH_MAX),
  title: requiredText("Title", 255),
  product_info: optionalRichText("Product info", RICH_MAX),
  highlights: optionalRichText("Highlights", RICH_MAX),
  benefits: optionalRichText("Benefits", RICH_MAX),
  features: optionalRichText("Features", RICH_MAX),
  technical_specification: optionalRichText("Technical specification", RICH_MAX),
  installation_process: optionalRichText("Installation process", RICH_MAX),
  status: z.enum(["active", "inactive"], "Status must be active or inactive").default("active"),
  faqs: jsonArray(faq, MAX_FAQS, "FAQs"),
  /** Edit only: ids of the existing detail images to keep (the others are removed). */
  keep_image_ids: jsonArray(z.coerce.number().int().positive(), MAX_DETAIL_IMAGES, "Images"),
});

export const listProductsQuery = listQuery.extend({ status: z.enum(["active", "inactive"]).optional() });
