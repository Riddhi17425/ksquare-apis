import { z } from "zod";
import { listQuery, rejectDuplicates, requiredText } from "./common.validator.js";

const STATUSES = ["active", "inactive"];
export const MAX_FAQ_BATCH = 20;

// ---- FAQ categories
export const faqCategoryBody = z.object({
  name: requiredText("Name", 150),
  status: z.enum(STATUSES, "Status must be active or inactive"),
});
export const listFaqCategoriesQuery = listQuery.extend({ status: z.enum(STATUSES).optional() });
export const faqCategoryStatusBody = z.object({ status: z.enum(STATUSES, "Status must be active or inactive") });

// ---- FAQs
const categoryId = z.coerce.number("Category is required").int().positive("Category is required").max(4_294_967_295, "Category is required");
const faqItem = z.object({
  question: requiredText("Question", 500),
  answer: requiredText("Answer", 5000),
});

/** Several question/answer pairs under one category */
export const createFaqsBody = z
  .object({
    category_id: categoryId,
    items: z.array(faqItem).min(1, "Add at least one FAQ").max(MAX_FAQ_BATCH, `At most ${MAX_FAQ_BATCH} FAQs at a time`),
  })
  .superRefine((body, ctx) => rejectDuplicates(ctx, body.items, ["items"], "question", "This question is repeated in the list"));

/** One FAQ */
export const updateFaqBody = faqItem.extend({ category_id: categoryId });

export const listFaqsQuery = listQuery.extend({ category_id: z.coerce.number().int().positive().max(4_294_967_295).optional() });
